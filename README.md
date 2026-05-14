# PriceWatch

A self-hosted price tracking dashboard for Dutch/EU online stores. Paste the snippet below into your existing `docker-compose.yml` and you're done.

---

## Setup

**1. Clone the repo next to your other containers**

```bash
cd /docker/appdata
git clone https://github.com/gggitbsay/-b-frugal.git pricewatch
```

> Adjust the path to wherever your other container folders live.

**2. Add to your `docker-compose.yml`**

```yaml
  pricewatch-api:
    build: ./appdata/pricewatch/api
    ports:
      - "8000:8000"
    volumes:
      - ./appdata/pricewatch/data/db:/data/db
    environment:
      - DATABASE_URL=sqlite:////data/db/pricewatch.db
      - CHANGEDETECTION_URL=http://pricewatch-changedetection:5000
      - CHANGEDETECTION_API_KEY=        # optional, set after first boot
    restart: unless-stopped

  pricewatch-scheduler:
    build: ./appdata/pricewatch/scheduler
    volumes:
      - ./appdata/pricewatch/data/db:/data/db
    environment:
      - DATABASE_URL=sqlite:////data/db/pricewatch.db
      - API_URL=http://pricewatch-api:8000
      - CHANGEDETECTION_URL=http://pricewatch-changedetection:5000
      - CHECK_INTERVAL_HOURS=6          # how often to check prices
    depends_on:
      - pricewatch-api
    restart: unless-stopped

  pricewatch-frontend:
    build: ./appdata/pricewatch/frontend
    ports:
      - "3000:80"
    depends_on:
      - pricewatch-api
    restart: unless-stopped

  pricewatch-changedetection:
    image: ghcr.io/dgtlmoon/changedetection.io
    ports:
      - "5000:5000"
    volumes:
      - ./appdata/pricewatch/data/changedetection:/datastore
    restart: unless-stopped
```

**3. Start it**

```bash
docker compose up -d
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API + Swagger docs | http://localhost:8000/docs |
| Changedetection.io | http://localhost:5000 |

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | SQLite path (`sqlite:////data/db/pricewatch.db`) |
| `CHECK_INTERVAL_HOURS` | No | `6` | How often the scheduler checks prices |
| `CHANGEDETECTION_URL` | No | `http://changedetection:5000` | Internal URL of the CD.io service |
| `CHANGEDETECTION_API_KEY` | No | — | API key from CD.io Settings → API |

---

## Features

- Add products by URL from any supported retailer
- Set a target price — cards highlight green when the price drops to or below it
- Price history chart per product (min / max / current)
- Filter and sort watchlist by category, price, or deals
- Stores raw price string + parsed float to handle EU formatting (`€1.299,00`)

## Supported retailers (MVP)

Coolblue · bol.com · MediaMarkt NL · IKEA NL · Hornbach NL · Zalando NL

---

## Data

All data lives in `./appdata/pricewatch/data/` and survives container restarts automatically.

```
appdata/pricewatch/data/
├── db/               ← SQLite database
└── changedetection/  ← Changedetection.io datastore
```
