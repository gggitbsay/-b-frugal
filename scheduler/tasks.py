"""Price-check tasks run by the scheduler.

Strategy:
1. If the product has a cd_watch_uuid, fetch the latest snapshot from
   changedetection.io and parse the price from the returned text.
2. Otherwise fall back to a direct HTTP scrape with retailer-specific CSS
   selectors.
"""

import logging
import os
import re
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

API_URL = os.getenv("API_URL", "http://api:8000")
CD_URL = os.getenv("CHANGEDETECTION_URL", "http://changedetection:5000")
CD_KEY = os.getenv("CHANGEDETECTION_API_KEY", "")

log = logging.getLogger(__name__)

# Retailer hostname → CSS price selector
RETAILER_SELECTORS: dict[str, str] = {
    "coolblue.nl": "[class*='sales-price__current']",
    "bol.com": "[data-test='price']",
    "mediamarkt.nl": "[class*='price-tag']",
    "ikea.com": "[class*='pip-price']",
    "hornbach.nl": "[class*='price-tag']",
    "zalando.nl": "[class*='z3esyv-']",
}

PRICE_RE = re.compile(r"[\d.,]+")


def _parse_price(raw: str) -> float | None:
    """Convert Dutch/EU price string to float. '€1.299,00' → 1299.0"""
    raw = raw.strip()
    # Remove currency symbols and whitespace
    raw = re.sub(r"[€$£\s]", "", raw)
    # If both '.' and ',' appear, the comma is the decimal separator (EU)
    if "." in raw and "," in raw:
        raw = raw.replace(".", "").replace(",", ".")
    elif "," in raw:
        raw = raw.replace(",", ".")
    m = PRICE_RE.search(raw)
    if m:
        try:
            return float(m.group())
        except ValueError:
            pass
    return None


def _selector_for_url(url: str) -> str | None:
    for host, selector in RETAILER_SELECTORS.items():
        if host in url:
            return selector
    return None


async def _scrape_direct(url: str) -> tuple[str | None, float | None, bool]:
    """Fallback scraper using httpx + BeautifulSoup."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0 Safari/537.36"
        ),
        "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
    }
    selector = _selector_for_url(url)
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=20) as client:
            r = await client.get(url, headers=headers)
            r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        if selector:
            el = soup.select_one(selector)
        else:
            # Generic fallback: look for an element with "price" in its class
            el = soup.find(
                lambda tag: tag.name in ("span", "div", "p")
                and any("price" in c.lower() for c in tag.get("class", []))
            )
        if el:
            raw = el.get_text(" ", strip=True)
            return raw, _parse_price(raw), True
    except Exception as exc:
        log.warning("Direct scrape failed for %s: %s", url, exc)
    return None, None, True


async def _scrape_via_changedetection(
    watch_uuid: str,
) -> tuple[str | None, float | None, bool]:
    """Fetch latest snapshot text from changedetection.io and extract price."""
    headers = {"x-api-key": CD_KEY} if CD_KEY else {}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{CD_URL}/api/v1/watch/{watch_uuid}/history/latest",
                headers=headers,
            )
            r.raise_for_status()
            text = r.text
        # Scan lines for a price pattern
        for line in text.splitlines():
            line = line.strip()
            if re.search(r"[€$£]?\s*\d[\d.,]+", line) and len(line) < 80:
                raw = line
                return raw, _parse_price(raw), True
    except Exception as exc:
        log.warning("Changedetection fetch failed for %s: %s", watch_uuid, exc)
    return None, None, True


async def check_all_products() -> None:
    """Fetch all active products from the API and record a price for each."""
    async with httpx.AsyncClient(base_url=API_URL, timeout=30) as client:
        try:
            r = await client.get("/products/", params={"active_only": True})
            r.raise_for_status()
            products = r.json()
        except Exception as exc:
            log.error("Could not fetch products: %s", exc)
            return

        for product in products:
            pid = product["id"]
            url = product["url"]
            watch_uuid = product.get("cd_watch_uuid")

            log.info("Checking price for product %d (%s)", pid, product["name"])

            if watch_uuid:
                raw, price, in_stock = await _scrape_via_changedetection(watch_uuid)
            else:
                raw, price, in_stock = await _scrape_direct(url)

            payload = {
                "product_id": pid,
                "price": price,
                "price_raw": raw,
                "currency": "EUR",
                "in_stock": in_stock,
                "checked_at": datetime.now(timezone.utc).isoformat(),
            }
            try:
                resp = await client.post("/prices/", json=payload)
                resp.raise_for_status()
                log.info(
                    "Recorded price %.2f for product %d",
                    price or 0.0,
                    pid,
                )
            except Exception as exc:
                log.error("Failed to record price for product %d: %s", pid, exc)
