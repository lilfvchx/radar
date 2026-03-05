# Radar — Geospatial Intelligence Platform

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs)
![MapLibre](https://img.shields.io/badge/MapLibre_GL_JS-5.x-396CB2?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

**A comprehensive real-time geospatial intelligence platform for tracking aircraft, maritime vessels, cybersecurity threats, and global conflict events.**

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API](#-api-reference) • [Contributing](CONTRIBUTING.md)

</div>

---

## Overview

**Radar** is a full-stack geospatial intelligence dashboard that aggregates real-time data from multiple sources to provide comprehensive situational awareness across four intelligence domains:

- **🛩️ Flight Tracking** — Live aircraft positions via ADS-B data
- **🚢 Maritime Tracking** — Global vessel tracking via AIS streams
- **🛡️ Cyber Intelligence** — Internet security metrics via Cloudflare Radar
- **🌍 OSINT Monitor** — Conflict events, news feeds, and strategic posture analysis

Built with React 19, TypeScript, Express.js, and MapLibre GL JS, Radar delivers a high-performance, military-styled interface with three visual modes (EO/FLIR/CRT).

---

## ✨ Features

### 🛩️ Flight Tracking Module

- **Live ADS-B data** from ADSB.lol (community-fed, no auth required) or OpenSky Network
- **Rich telemetry** — altitude (barometric/geometric), speed, heading, vertical rate, squawk codes, Mach, IAS, TAS, roll angle, wind speed/direction, OAT/TAT, navigation modes, RSSI
- **Aircraft enrichment** — registration, manufacturer, model, operator, type code, year built (DuckDB + Parquet database)
- **Route history visualization** with origin airport data
- **Geographic filtering** via configurable bounding box (reduces API load)
- **On-ground/airborne detection** with visual distinction
- **Emergency squawk highlighting** (7500, 7600, 7700)
- **Globe & Mercator projections** — toggle between 3D and flat views

### 🚢 Maritime Tracking Module

- **Live AIS streams** via persistent WebSocket to `wss://stream.aisstream.io`
- **Full AIS message support** — Position Reports (Class A/B), Ship Static Data, Base Station Reports, SAR Aircraft, Aids to Navigation, Safety Broadcasts
- **Vessel details** — MMSI, name, call sign, ship type, destination, SOG, COG, heading, navigational status
- **Historical trail rendering** — last 150 position points per vessel
- **Stale vessel purging** — automatic cleanup after 30 minutes of inactivity
- **Auto-reconnect** — 5-second backoff on WebSocket disconnect

### 🌍 OSINT Monitor Module

A comprehensive intelligence monitoring dashboard with six real-time panels:

#### Live News Panel

- **Geo-located RSS feeds** from a massive 56,000+ line database
- Automatically detects country from map coordinates
- Fetches region-specific news (geopolitical, defense, local sources)
- Falls back to international feeds (Reuters, AP, BBC) if no local match

#### Live Webcams Panel

- Rotating display of live webcam feeds from strategic locations
- Visual HUMINT supplement for ground-truth verification

#### Conflict Events Panel (ACLED)

- **Real-time conflict data** from ACLED (Armed Conflict Location & Event Data Project)
- Tracks battles, explosions, violence against civilians
- Last 7 days by default, filterable by country and date range
- Geographic visualization on map with fatality counts

#### AI Insights Panel

- **LLM-powered intelligence briefs** via OpenRouter API
- Generates military-styled summaries from intercepted news headlines
- Regional context-aware analysis
- Uses Google Gemini 2.5 Flash (fast, cost-effective)

#### Country Instability Index (CII) Panel

- **Dynamic risk scoring** for 19 Tier-1 countries (US, Russia, China, Ukraine, Iran, Israel, Taiwan, North Korea, etc.)
- Baseline risk + dynamic event-driven adjustments
- Integrates ACLED protest/riot data with country-specific multipliers
- Real-time composite scores (0-100 scale)

#### Strategic Posture Panel

- **Military aircraft tracking** across three theaters (Europe, Middle East, Indo-Pacific)
- Detects tankers, AWACS, fighters, bombers by callsign/operator
- **Strike capability assessment** — flags when theater has sufficient tankers + AWACS + fighters for offensive operations
- Posture levels: Normal / Elevated / Critical

### 🛡️ Cyber Intelligence Module

Powered by **Cloudflare Radar API** for global internet security metrics:

- **DDoS attack origins** — top countries launching Layer 7 attacks
- **Traffic anomalies** — internet routing anomalies and BGP events
- **Top domains** — most popular websites by traffic
- **Attack vectors** — HTTP method distributions, bot classifications
- **ASN rankings** — autonomous system activity
- **Time-series visualization** — interactive charts and heatmaps

### 🎨 Display Modes

Three visual themes selectable from the navigation bar:

| Mode     | Description                                       |
| -------- | ------------------------------------------------- |
| **EO**   | Electro-optical — clean dark interface (default)  |
| **FLIR** | Forward-looking infrared — thermal color palette  |
| **CRT**  | Cathode-ray tube — retro phosphor green aesthetic |

---

## 🏗️ Architecture

### Project Structure

```
radar/
├── client/               # React 19 + Vite frontend (port 5173)
│   └── src/
│       ├── app/          # Entry point, routes, providers
│       ├── modules/
│       │   ├── flights/        # ADS-B aircraft tracking
│       │   ├── maritime/       # AIS vessel tracking
│       │   ├── monitor/        # OSINT intelligence hub
│       │   ├── cyber/          # Cloudflare Radar integration
│       │   └── osint/          # Shared OSINT components
│       ├── ui/
│       │   ├── layout/         # TopNav, shell components
│       │   └── theme/          # EO/FLIR/CRT mode + projection state
│       └── core/               # Query client, providers
│
└── server/               # Express.js backend (port 3001)
    └── src/
        ├── core/
        │   ├── source/
        │   │   ├── adsblol.ts       # ADSB.lol polling + cache
        │   │   ├── opensky.ts       # OpenSky fallback
        │   │   ├── aisstream.ts     # AISStream WebSocket singleton
        │   │   ├── acled.ts         # ACLED conflict data API
        │   │   └── cloudflare.ts    # Cloudflare Radar API client
        │   ├── aircraft_db.ts       # DuckDB/Parquet aircraft enrichment
        │   └── cache.ts             # TTL cache utility
        ├── routes/
        │   ├── flights.ts           # GET /api/flights/*
        │   ├── maritime.ts          # GET /api/maritime/*
        │   ├── monitor.ts           # GET /api/monitor/* (CII, posture, ACLED)
        │   ├── geo.ts               # GET /api/geo/* (news, intel briefs)
        │   └── cyber.ts             # GET /api/cyber/* (Cloudflare proxy)
        ├── types/                   # TypeScript definitions
        ├── news_feeds.json          # 56k+ line RSS database (190+ countries)
        └── index.ts                 # Server entry point
```

### Tech Stack

| Layer              | Technology                           |
| ------------------ | ------------------------------------ |
| Frontend framework | React 19 + Vite 7 + TypeScript 5.9   |
| Map rendering      | MapLibre GL JS 5 via react-map-gl 8  |
| State management   | Zustand 5                            |
| Data fetching      | TanStack Query v5                    |
| Styling            | Tailwind CSS v4                      |
| Icons              | Lucide React                         |
| Backend runtime    | Node.js 20 + Express 4               |
| Aircraft database  | DuckDB + Parquet                     |
| Maritime stream    | WebSocket (`ws` library)             |
| RSS parsing        | rss-parser                           |
| Geolocation        | which-country + i18n-iso-countries   |
| Build tooling      | `concurrently` (monorepo dev runner) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20 or later
- **npm** v9 or later

### 1. Install Dependencies

```bash
npm run install:all
```

This installs dependencies for both `client` and `server` workspaces.

### 2. Configure Environment Variables

#### Server — `server/.env`

```bash
# Copy example file
cp server/.env.example server/.env

# Edit with your API keys
nano server/.env
```

**Required API Keys:**

| Service          | Variable                 | Where to get                   | Cost          |
| ---------------- | ------------------------ | ------------------------------ | ------------- |
| AISStream        | `AISSTREAM_API_KEY`      | https://aisstream.io           | Free tier     |
| ACLED            | `ACLED_USERNAME`         | https://acleddata.com/register | Free          |
|                  | `ACLED_PASSWORD`         |                                |               |
| OpenRouter (LLM) | `OPENROUTER_API_KEY`     | https://openrouter.ai/keys     | Pay as you go |
| Cloudflare Radar | `CLOUDFLARE_RADAR_TOKEN` | https://dash.cloudflare.com/   | Free          |

**Optional:**

```ini
# Flight data source (default: adsblol - no key required)
FLIGHT_DATA_SOURCE=adsblol

# Geographic center for ADSB.lol queries
ADSB_LOL_LAT=0
ADSB_LOL_LON=0
ADSB_LOL_RADIUS=25000  # nautical miles (25000 ≈ global)

# OpenSky fallback (optional, requires account)
# OPENSKY_CLIENT_ID=your_email@example.com
# OPENSKY_CLIENT_SECRET=your_secret_here
```

#### Client — `client/.env`

```bash
cp client/.env.example client/.env
```

```ini
# Flight data provider: "adsblol" | "opensky" | "mock"
VITE_FLIGHT_PROVIDER=adsblol
```

### 3. Run Development Server

```bash
npm run dev
```

This starts:

- **Frontend** → [http://localhost:5173](http://localhost:5173)
- **Backend** → [http://localhost:3001](http://localhost:3001)
- **Health check** → [http://localhost:3001/health](http://localhost:3001/health)

---

## 🌐 API Reference

All routes served by Express backend on port `3001`.

### Flights

| Method | Endpoint                     | Description                                            |
| ------ | ---------------------------- | ------------------------------------------------------ |
| `GET`  | `/api/flights/states`        | Returns all tracked aircraft as `AircraftState[]`      |
| `GET`  | `/api/flights/track/:icao24` | Returns route path for specific aircraft by ICAO24 hex |

### Maritime

| Method | Endpoint                 | Description                                                       |
| ------ | ------------------------ | ----------------------------------------------------------------- |
| `GET`  | `/api/maritime/snapshot` | Returns all live vessels as `VesselState[]` with position history |

### Monitor (OSINT)

| Method | Endpoint               | Description                                                           |
| ------ | ---------------------- | --------------------------------------------------------------------- |
| `GET`  | `/api/monitor/cii`     | Country Instability Index scores for 19 Tier-1 countries              |
| `GET`  | `/api/monitor/posture` | Strategic military posture across 3 theaters                          |
| `GET`  | `/api/monitor/acled`   | ACLED conflict events (query: `?country=Ukraine&start=<ms>&end=<ms>`) |

### Geo (OSINT)

| Method | Endpoint               | Description                                                                        |
| ------ | ---------------------- | ---------------------------------------------------------------------------------- |
| `GET`  | `/api/geo/news`        | Geo-located RSS news feeds (query: `?lat=<lat>&lon=<lon>&category=<category>`)     |
| `POST` | `/api/geo/intel-brief` | Generate LLM intelligence brief from news headlines (body: `{news: [], lat, lon}`) |

### Cyber

| Method | Endpoint             | Description                                                                            |
| ------ | -------------------- | -------------------------------------------------------------------------------------- |
| `GET`  | `/api/cyber/radar/*` | Proxy for Cloudflare Radar API (e.g., `/api/cyber/radar/attacks/layer7/top/locations`) |

### System

| Method | Endpoint  | Description                |
| ------ | --------- | -------------------------- |
| `GET`  | `/health` | Returns `{ status: "ok" }` |

---

## 🔌 Data Sources

### ADSB.lol (Flights)

- **URL**: `https://api.adsb.lol/v2/point/{lat}/{lon}/{radius}`
- **Auth**: None required (community-operated, free)
- **Polling**: 3-second TTL cache on backend
- **Enrichment**: Aircraft details joined from local DuckDB/Parquet database

### OpenSky Network (Flights Fallback)

- **URL**: `https://opensky-network.org/api/states/all`
- **Auth**: Optional (higher rate limits with account)
- **Note**: Less complete telemetry than ADSB.lol

### AISStream.io (Maritime)

- **URL**: `wss://stream.aisstream.io/v0/stream`
- **Auth**: API key required (free tier: 15 requests/min)
- **Coverage**: Global bounding box `[[-90, -180], [90, 180]]`
- **Memory**: Up to 150 history points per vessel; stale vessels purged after 30 min

### ACLED (Conflict Data)

- **URL**: `https://api.acleddata.com/acled/read`
- **Auth**: Username + password (free registration)
- **Coverage**: Global conflict events since 1997
- **Rate limits**: Generous for academic/non-commercial use

### Cloudflare Radar (Cyber)

- **URL**: `https://api.cloudflare.com/client/v4/radar/*`
- **Auth**: Bearer token (free)
- **Endpoints**: 50+ metrics (DDoS, BGP, DNS, HTTP, email security)

### RSS News Feeds (OSINT)

- **Source**: `server/src/news_feeds.json` (56,934 lines)
- **Coverage**: 190+ countries, categorized by defense, geopolitical, economic, local
- **Fallback**: Reuters, AP, BBC for uncovered regions

---

## 🐳 Docker Deployment

### Build and Run

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Or use docker-compose
npm run docker:compose:build
```

### Docker Compose

```yaml
services:
  radar:
    build: .
    container_name: radar
    ports:
      - '3001:3001'
    env_file:
      - ./server/.env
    restart: unless-stopped
```

---

## 🛠️ Available Scripts

| Command                  | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `npm run dev`            | Start both client and server in development mode |
| `npm run install:all`    | Install all workspace dependencies               |
| `npm run build`          | Build production bundles (client + server)       |
| `npm run build:client`   | Build frontend only                              |
| `npm run build:server`   | Build backend only                               |
| `npm run start`          | Run production server (after building)           |
| `npm run lint`           | Run ESLint on client                             |
| `npm run format`         | Format all files with Prettier                   |
| `npm run type-check`     | Run TypeScript type checking (no emit)           |
| `npm run docker:build`   | Build Docker image                               |
| `npm run docker:compose` | Start with docker-compose                        |

---

## 📁 Key Files

| File                         | Description                             |
| ---------------------------- | --------------------------------------- |
| `package.json`               | Monorepo workspace configuration        |
| `client/package.json`        | Frontend dependencies                   |
| `server/package.json`        | Backend dependencies                    |
| `client/.env.example`        | Frontend environment template           |
| `server/.env.example`        | Backend environment template            |
| `server/src/news_feeds.json` | 56k+ line RSS database (190+ countries) |
| `Dockerfile`                 | Multi-stage production build            |
| `docker-compose.yml`         | Orchestration config                    |

---

## 🧪 Mock/Offline Mode

To run the flight module without API dependencies:

1. Edit `client/.env`:
   ```ini
   VITE_FLIGHT_PROVIDER=mock
   ```
2. Restart dev server. Uses bundled `flights_sample.json` fixture.

**Note:** Maritime, monitor, and cyber modules require live API connections.

---

## 📊 Performance

- **Frontend bundle size**: ~400 KB gzipped (with code splitting)
- **Map render**: 60 FPS on modern hardware (WebGL acceleration)
- **Backend memory**: ~150 MB baseline (grows with aircraft DB)
- **Concurrent users**: Tested up to 50 simultaneous connections

---

## 🗺️ Map Projections

Toggle between two rendering modes via the **VIEW** button:

- **Mercator** — Standard flat 2D projection (best for regional detail)
- **Globe** — 3D spherical projection (best for global awareness)

Powered by MapLibre GL JS v5 with custom terrain shading.

---

## 🔒 Security Notes

- **Never commit `.env` files** — use `.env.example` templates only
- **API keys in code**: All secrets are server-side only; frontend receives pre-processed data
- **CORS**: Currently permissive for development; restrict in production
- **Rate limiting**: Not yet implemented; add middleware before public deployment
- **Rotate keys**: If you accidentally commit secrets, rotate them immediately

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick checklist:**

- Fork the repo
- Create a feature branch (`git checkout -b feature/amazing-feature`)
- Commit changes (`git commit -m 'feat: add amazing feature'`)
- Push to branch (`git push origin feature/amazing-feature`)
- Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **ADSB.lol** — Community-fed ADS-B network
- **AISStream.io** — Free maritime AIS WebSocket API
- **ACLED** — Armed Conflict Location & Event Data Project
- **Cloudflare Radar** — Internet security metrics
- **OpenSky Network** — Flight data fallback
- **MapLibre GL JS** — Open-source map rendering
- **Contributors** — See [GitHub contributors](https://github.com/Syntax-Error-1337/radar/graphs/contributors)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Syntax-Error-1337/radar/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Syntax-Error-1337/radar/discussions)
- **Email**: nomails1337@gmail.com

---

<div align="center">

**Built with ❤️ for the OSINT community**

[⬆ Back to top](#radar--geospatial-intelligence-platform)

</div>
