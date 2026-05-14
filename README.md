# PriceWatch

A self-hosted, Docker-based price tracking dashboard for monitoring retail product deals across Dutch/EU online stores.

## Quick start

```bash
git clone <repo>
cd <repo>
docker compose up
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API (+ Swagger docs) | http://localhost:8000/docs |
| Changedetection.io | http://localhost:5000 |

Data persists in `./data/` and survives container restarts.

## Stack

| Layer | Tool |
|---|---|
| Containerization | Docker + Docker Compose |
| Backend | Python + FastAPI (async SQLAlchemy) |
| Database | SQLite (file-based, mounted volume) |
| Scheduler | APScheduler |
| Scraping | Changedetection.io + direct HTTP fallback (BeautifulSoup) |
| Frontend | React + Vite, served by Nginx |
| Charts | Recharts |

## Features

- Add products by URL — paste a link from any supported retailer
- Set a target price per product; cards highlight green when the price drops to or below it
- Price history chart per product with min / max / current indicators
- Filter and sort the watchlist by category, price, or deals
- Configurable check interval (default every 6 hours)
- Stores both raw price string and parsed float to handle EU formatting (`€1.299,00`)

## Supported retailers (MVP)

- Coolblue (coolblue.nl)
- Bol.com
- MediaMarkt NL
- IKEA NL
- Hornbach NL
- Zalando NL

## Project structure

```
├── docker-compose.yml
├── api/                  # FastAPI backend
│   ├── main.py
│   ├── models.py         # Product + PriceRecord ORM models
│   ├── schemas.py        # Pydantic request/response schemas
│   └── routers/
│       ├── products.py   # /products endpoints
│       └── prices.py     # /prices endpoint
├── scheduler/            # Price-check worker
│   ├── main.py           # APScheduler loop
│   └── tasks.py          # Scraper logic
├── frontend/             # React + Vite dashboard
│   └── src/
│       ├── pages/        # Dashboard, ProductDetail
│       └── components/   # Header, ProductCard, PriceChart, ProductForm
└── data/                 # Persistent volumes (gitignored)
    ├── db/               # SQLite database
    └── changedetection/  # Changedetection.io datastore
```

## Configuration

Copy `.env` and adjust as needed:

```bash
# Changedetection.io API key (set one under Settings > API in the CD.io UI)
CHANGEDETECTION_API_KEY=

# Price check interval in hours (default: 6)
CHECK_INTERVAL_HOURS=6
```

## API

Full OpenAPI spec available at `http://localhost:8000/docs` when running.

| Method | Path | Description |
|---|---|---|
| `GET` | `/products/` | List all watched products (with current price) |
| `POST` | `/products/` | Add a product to the watchlist |
| `GET` | `/products/{id}` | Get a single product with full price history |
| `PUT` | `/products/{id}` | Update product metadata |
| `DELETE` | `/products/{id}` | Remove a product |
| `GET` | `/products/{id}/prices` | Get price history records |
| `POST` | `/prices/` | Record a new price check (used by scheduler) |

## Changedetection.io integration

For JS-heavy retailer pages, add a watch in the Changedetection.io UI (port 5000) and copy the watch UUID into the product's `cd_watch_uuid` field via the API. The scheduler will then fetch price data from CD.io's snapshot rather than scraping directly.

For simpler pages the scheduler falls back to a direct HTTP request with retailer-specific CSS selectors.
