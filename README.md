# Roost

**A self-hosted community platform for learning, building, and growing together.**

Roost is a full-featured, open-source community platform that you can deploy on your own infrastructure. Think Skool/Circle alternative that you own and control.

---

## Features

- **Community Feed** — Posts, comments, reactions, rich text editor, media uploads
- **Groups & Classrooms** — Public/private groups with roles (Admin, Moderator, Member)
- **Learn Mode** — Course modules with video lessons and progress tracking
- **Direct Messaging** — Real-time 1-on-1 chat with file attachments
- **Events & Calendar** — Event management with RSVP tracking
- **Leaderboard** — Points system for engagement tracking
- **Member Directory** — Searchable member profiles with online status
- **Association Workspace** — Internal workspace for associations: meetings, decisions, tasks, documents, news
- **Member Portal** — Separate mobile-first app for association members (news, activities, contact)
- **Admin Dashboard** — User management, content moderation, analytics
- **Live Room** — Live streaming with real-time chat
- **Notifications** — In-app + email notifications
- **Feature Requests** — Community-driven roadmap voting

## Association Workspace & Member Portal (Föreningsarbetsyta & Medlemsportal)

Roost includes an internal **Association Workspace** (`/associations`) for boards and staff — meetings with decisions that convert to tasks, documents, activities, news, internal communication, and member questions. Roles per association: `admin`, `internal`, `member` — where `member` only has access to the separate **Member Portal**, a standalone mobile-first Vite app in `member-portal/` (port 5100) that shares the same Supabase project and auth; permissions are enforced entirely by RLS.

```bash
npm run dev:portal     # Run the member portal locally (port 5100)
npm run build:portal   # Build it (member-portal/dist)
```

See [docs/member-portal.md](docs/member-portal.md) for architecture, local setup, and deployment (recommended: separate static site, e.g. `medlem.<domain>`).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Express.js, Node.js 20+ |
| Database | Supabase (Cloud/Self-hosted) or MongoDB + Prisma |
| Storage | AWS S3 / S3-compatible (MinIO, R2) |
| Icons | Lucide React |
| Editor | React Quill |

## Quick Start

### Option 1: Interactive Installer (Recommended)

```bash
git clone https://github.com/your-org/roost.git
cd roost
bash install.sh
```

The installer will guide you through:
- Database provider selection (Supabase Cloud, Supabase Self-hosted, MongoDB)
- Deployment target (Docker VPS, Dockploy VPS, Vercel, Netlify, Local dev)
- Storage, email, and optional integrations
- Docker VPS path includes Traefik + Let's Encrypt SSL and optional self-hosted MinIO profile
- Supabase self-hosted path can auto-generate JWT/anon/service keys and Dockploy-ready env values

### Option 2: Manual Setup

```bash
# Clone and install
git clone https://github.com/msrbuilds/roost.git
cd roost
npm install
cd server && npm install && cd ..

# Configure
cp .env.example .env.local
cp server/.env.example server/.env
# Edit both .env files with your values

# Start development
npm run dev          # Frontend (port 5173)
cd server && npm run dev  # Backend (port 3000)
```

## Database Providers

| Provider | Best For | Guide |
|----------|----------|-------|
| **Supabase Cloud** | Easiest setup, recommended for most | [Full Guide](guides/supabase-cloud.md) |
| **Supabase Self-hosted** | Full control, privacy-focused | [Full Guide](guides/supabase-selfhosted.md) |
| **MongoDB + Prisma** | Fully local, no external deps | [Full Guide](guides/mongodb-prisma.md) |

## Deployment

| Platform | Type | Guide |
|----------|------|-------|
| **Docker (VPS)** | Self-hosted VPS with Docker Compose + Traefik SSL | [Full Guide](guides/docker-vps.md) |
| **Dockploy (VPS)** | Self-hosted VPS with Dockploy | [Full Guide](guides/dockploy-vps.md) |
| **Vercel** | Frontend only (backend separate) | [Full Guide](guides/vercel.md) |
| **Netlify** | Frontend only (backend separate) | [Full Guide](guides/netlify.md) |

Also see: [Interactive Installer Guide](guides/install-script.md)

## Configuration

### Environment Variables

See [.env.example](.env.example) for frontend and [server/.env.example](server/.env.example) for backend configuration.

### Feature Flags

Toggle features via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ENABLE_SIGNUP` | `true` | Allow new user registration |
| `VITE_GUMROAD_ENABLED` | `false` | Enable Gumroad paid memberships |
| `VITE_ENABLE_LIVE_ROOM` | `true` | Enable live streaming room |
| `VITE_ENABLE_LEADERBOARD` | `true` | Enable points & leaderboard |
| `VITE_ENABLE_ACTIVATIONS` | `false` | Enable product activations |

## Project Structure

```
roost/
├── src/                    # Frontend (React)
│   ├── auth/               # Auth abstraction layer
│   │   ├── adapters/       # Supabase Auth, Local JWT
│   │   └── interfaces/     # Auth interface types
│   ├── db/                 # Database abstraction layer
│   │   ├── adapters/       # Supabase, MongoDB adapters
│   │   └── interfaces/     # Database interface types
│   ├── config/             # App configuration
│   ├── components/         # React components
│   ├── contexts/           # React context providers
│   ├── hooks/              # Custom hooks
│   ├── layouts/            # Page layouts
│   ├── pages/              # Page components
│   ├── services/           # API service layer
│   └── types/              # TypeScript types
├── server/                 # Backend (Express)
│   └── src/
│       ├── routes/         # API routes
│       ├── services/       # Backend services
│       └── lib/            # Shared utilities
├── member-portal/          # Member portal (separate Vite app, port 5100)
├── prisma/                 # Prisma schema (MongoDB)
├── migrations/             # SQL migrations (Supabase)
├── guides/                 # Step-by-step setup & deployment guides
├── install.sh              # Interactive installer
├── docker-compose.yml      # Docker orchestration
├── docker-compose.dokploy.yml # Dockploy orchestration
├── Dockerfile              # Frontend container
├── vercel.json             # Vercel config
├── netlify.toml            # Netlify config
└── nginx.conf              # Nginx config (Docker)
```

## Development

```bash
# Run both frontend and backend
npm run dev:all

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint
npm run lint

# E2E tests
npm run test:e2e
```

## License

MIT
