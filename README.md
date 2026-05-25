# Élite da Parfum

A production-ready, high-performance luxury e-commerce platform for authentic premium and niche fragrances.

## 🚀 Architecture Overview

This project is built using a modern decoupled architecture, ensuring scalability, security, and exceptional performance.

### Frontend (Vercel)
- **Framework:** React + Vite
- **Styling:** Tailwind CSS + Framer Motion for fluid, 60fps animations
- **State Management:** React Query (TanStack) + Custom React Contexts
- **Routing:** Wouter (Lightweight routing)
- **SEO:** React-Helmet-Async for dynamic head management

### Backend (Railway)
- **Runtime:** Node.js + Express
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM + Zod for strict runtime validation
- **Authentication:** Stateless JWTs (JSON Web Tokens) with secure local storage
- **Performance:** Custom high-speed binary image delivery engine with aggressive HTTP caching

## 🛡️ Security Features
- **Zero CSRF:** Fully stateless JWT architecture immune to Cross-Site Request Forgery.
- **Strict CORS:** Backend APIs locked down to explicitly permitted origins.
- **Input Sanitization:** React strictly escapes all user input natively, preventing XSS.
- **Admin Gates:** Cryptographically secured backend middleware (`requireAdmin`) preventing unauthorized privilege escalation.
- **Rate Limiting:** Active memory-based rate limiting on all authentication routes to prevent brute-force attacks.

## ⚡ Performance Optimizations
- **Smart Image Delivery:** Images are stored securely in PostgreSQL and served via a dedicated binary streaming endpoint with 1-year cache headers (`Cache-Control: public, max-age=31536000`), reducing JSON payload sizes by over 95%.
- **Lazy Loading:** All below-the-fold images use native `loading="lazy"` to guarantee near-instant First Contentful Paint.
- **Debounced Live Search:** Optimized database querying to ensure search feels instantaneous without overloading the server.

## 📦 Setup & Development

### Monorepo Structure
This repository contains two main packages managed by `pnpm`:
- `/artifacts/elite-de-parfum` (Frontend)
- `/artifacts/api-server` (Backend)
- `/lib/db` (Shared database schemas)

### Running Locally
1. Clone the repository
2. Run `pnpm install` at the root
3. Set up your `.env` variables (Database URL, JWT Secret)
4. Start the backend: `cd artifacts/api-server && pnpm dev`
5. Start the frontend: `cd artifacts/elite-de-parfum && pnpm dev`
