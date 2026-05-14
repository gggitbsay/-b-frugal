import asyncio
import logging
import os

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from tasks import check_all_products

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger(__name__)

# Default: check every 6 hours.  Override with CHECK_INTERVAL_HOURS env var.
INTERVAL_HOURS = float(os.getenv("CHECK_INTERVAL_HOURS", "6"))


async def main():
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        check_all_products,
        trigger=IntervalTrigger(hours=INTERVAL_HOURS),
        id="check_prices",
        replace_existing=True,
        next_run_time=None,  # don't fire immediately on startup
    )
    scheduler.start()
    log.info("Scheduler started — price checks every %.1f hour(s)", INTERVAL_HOURS)

    # Also trigger once on startup after a short delay so first-run data appears
    await asyncio.sleep(30)
    log.info("Running initial price check...")
    await check_all_products()

    try:
        await asyncio.Event().wait()
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
