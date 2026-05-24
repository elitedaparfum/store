# Elite Da Parfum — Full-Stack Luxury Perfume E-Commerce

A production-ready luxury perfume e-commerce site with a full admin portal, session-based auth, WhatsApp checkout, and a dark/gold + light theme toggle.

---

## Architecture

**Monorepo (pnpm workspaces):**
- `artifacts/elite-de-parfum` — React + Vite frontend (SPA)
- `artifacts/api-server` — Express + Drizzle ORM backend API
- `lib/db` — Shared PostgreSQL schema and DB client (composite TS lib)
- `scripts` — Utility scripts (e.g. DB seeding)

**Stack:**
- Frontend: React 19, Vite, Wouter (routing), Framer Motion, TailwindCSS, shadcn/ui
- Backend: Express 5, Drizzle ORM, PostgreSQL, express-session + connect-pg-simple, bcryptjs, multer
- DB: Replit-managed PostgreSQL (connection via `DATABASE_URL`)

---

## Routing (Proxy at localhost:80)

| Path Prefix | Service | Port |
|---|---|---|
| `/api` | API Server | 8080 |
| `/` | Frontend (Vite) | 19998 |

---

## Key Features

### Public Site
- **Homepage** (`/`) — Hero section, featured collections, brand story
- **Shop** (`/shop`) — Product grid with Family/Gender filters and price sort; live data from DB
- **Product Detail** (`/product/:id`) — Size selector (30ml/50ml/100ml), Add to Cart, Order via WhatsApp
- **Contact** (`/contact`) — Store info page
- **Cart Drawer** — Slide-in cart with per-item quantities, WhatsApp checkout CTA
- **Theme Toggle** — Dark (default: near-black + gold) ↔ Light in navbar

### Authentication
- **Register** (`/register`) — Email + password (bcrypt, min 6 chars)
- **Login** (`/login`) — Session-based login
- **First user registered automatically becomes admin** (or any email in `ADMIN_EMAILS` env var)
- Session stored in PostgreSQL `session` table (connect-pg-simple)
- `AuthGuard` — Redirects logged-in users away from /login and /register
- `AdminGuard` — Redirects non-admin users from /admin/* to /login

### Admin Portal (`/admin/*`)
- **Dashboard** (`/admin`) — Stats: total products, families, avg price, account
- **Product List** (`/admin/products`) — Table of all products, edit/delete actions
- **Product Form** (`/admin/products/new`, `/admin/products/:id/edit`) — Add/edit fragrance with image upload (multer → base64) or URL, scent notes, family, gender, pricing

---

## Environment Variables / Secrets

| Name | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Auto-provisioned |
| `SESSION_SECRET` | Secret for express-session | ✅ Set as Replit secret |
| `ADMIN_EMAILS` | Comma-separated emails that always get admin rights | Optional (set: `eliteadmin@perfume.test`) |

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | defaultRandom() |
| email | text | unique, not null |
| password_hash | text | bcrypt hash |
| is_admin | boolean | default false |
| created_at | timestamp | defaultNow() |

### `products`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | defaultRandom() |
| name | text | not null |
| family | text | e.g. Oriental, Floral, Woody |
| gender | text | Men / Women / Unisex |
| price | integer | USD, base price (50ml) |
| image_url | text | base64 data URL or external URL |
| notes_top | text | Olfactory top notes |
| notes_heart | text | Olfactory heart notes |
| notes_base | text | Olfactory base notes |
| description | text | Long description |
| featured | text | "true" / "false" |
| created_at | timestamp | |
| updated_at | timestamp | |

### `session`
Standard connect-pg-simple session table (created manually via SQL).

---

## Seeding

8 sample products are seeded via:
```bash
pnpm --filter @workspace/scripts run seed:products
```
Skips seeding if products already exist.

---

## Customization Placeholders

Before going live, update:
- **WhatsApp number** in `artifacts/elite-de-parfum/src/pages/product.tsx` — replace `15550000000`
- **Contact info** in `artifacts/elite-de-parfum/src/components/layout.tsx` footer and `src/pages/contact.tsx`
- **Email** — `contact@elitedaparfum.com`
- **Phone** — `+1 (555) 000-0000`
- **Logo** — SVG text-based wordmark in `src/components/brand-logo.tsx` — no image dependency
- **Product images** — All 7 products use local `/public/images/*.png` files; Aqua Serenissima uses Unsplash

---

## Deployment Notes

- The `session` table must exist before the API server starts (already created; also re-created on fresh DB via migration)
- `SESSION_SECRET` must be set as a Replit secret before deploying
- Set `ADMIN_EMAILS` to the store owner's email so they can register as admin on a fresh production DB
- After deployment, the **first user to register** becomes admin
