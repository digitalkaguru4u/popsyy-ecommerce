# POPSYY — full-stack ecommerce

Gen-Z ice-pop brand store: React/Vite/Tailwind/Framer Motion storefront + admin panel, Node/Express/MongoDB API, Razorpay + COD payments, Cloudinary images, Nodemailer emails.

```
popsyy/
├─ client/                 React 19 + Vite + Tailwind v4 + Framer Motion (storefront AND /admin, code-split)
│  ├─ public/images/       brand/ (reference photos) · products/ (flavour art — replace freely)
│  └─ src/
│     ├─ components/       layout/ home/ product/ box/ ui/
│     ├─ context/          Auth, Cart (+fly-to-cart), Settings (CMS), Toast
│     ├─ hooks/            useFetch, usePayment (Razorpay Checkout / test simulator) …
│     ├─ pages/            storefront pages · account/ · admin/
│     └─ services/api.js   fetch wrapper (cookies, errors)
├─ server/                 Express 4 + Mongoose 9
│  ├─ src/config/          env, db, razorpay, cloudinary
│  ├─ src/models/          18 collections (see below)
│  ├─ src/services/        cart, coupon, order, payment, inventory, email, invoice, upload, settings
│  ├─ src/controllers/     thin HTTP layer
│  ├─ src/routes/          REST routes (validation + auth middleware)
│  ├─ src/middleware/      auth/RBAC, zod validation, sanitize (NoSQL + XSS), rate limits, upload, errors
│  ├─ src/seed/            seed.js + brand defaults
│  └─ tests/               Jest + Supertest (40 tests)
└─ render.yaml             API blueprint · client/vercel.json + netlify.toml for the frontend
```
digitalkaguru4u_db_user
mVAvcltjDdIZjHKe
## Run it locally

Requirements: Node 20+ and a MongoDB (local `mongod`, Docker `docker run -p 27017:27017 mongo:7`, or a free Atlas cluster).

```bash
npm install                                  # installs client + server (npm workspaces)
cp server/.env.example server/.env           # set MONGODB_URI, JWT_SECRET, ADMIN_PASSWORD
cp client/.env.example client/.env
npm run seed -- --fresh                      # products, variants, stock, coupons, FAQs, CMS, admin
npm run dev                                  # API :5000 + web :5173 (Vite proxies /api)
```

- Store: http://localhost:5173 — demo customer `demo@popsyy.in / Demo@12345` (dev seed only)
- Admin: http://localhost:5173/admin — `ADMIN_EMAIL / ADMIN_PASSWORD` from `.env`
- Coupons seeded: `POPFIRST` (15%, max ₹100), `CHILL50` (₹50 off ≥ ₹499), `SQUAD20` (20% off ≥ ₹999)

### Without credentials
| Integration | If not configured |
|---|---|
| Razorpay | In development only, a clearly-labelled **payment simulator** replaces Razorpay Checkout (success / failure / cancel) so the full order → verify → confirm flow can be tested. In production it's disabled and checkout offers COD only. The admin sidebar shows the live mode. |
| Cloudinary | Uploads are saved to `server/uploads/` and served from `/uploads`. Fine for one server; use Cloudinary for anything with multiple instances or ephemeral disks (Render/Railway free tiers). |
| SMTP | Emails are generated but only logged (`[mail:dev] …`). |

## Tests
```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/ npm test      # or `npm i -D mongodb-memory-server -w server` and omit the var
```
Covers auth (register/login/cookies/reset/change/blocked/NoSQL-injection), product CRUD + admin authorization, cart (server-side pricing, stock limits, box rules, coupons, guest→user merge), orders (COD, stock deduction/restore, status flow, tracking, invoice, COD limit, ownership), coupons, Razorpay signature/amount verification + webhook idempotency + refund (SDK stubbed), simulator failure/retry, reviews moderation + XSS.

## How the important parts work

**Pricing & stock** — prices are always recomputed on the server from DB variants; the client never sends a price. Stock is tracked in *individual pops* per flavour (a Pack of 12 consumes 12), so packs and Build-Your-Box share one inventory. Stock is deducted when an order is **confirmed** (COD immediately; online after verified payment) using atomic conditional decrements, restored on cancel/refund, and every movement is written to the `Inventory` ledger. Unpaid online orders auto-cancel after 24 h.

**Payments** — `POST /api/orders` → `POST /api/payments/create` (Razorpay order in paise) → Checkout → `POST /api/payments/verify` checks the HMAC signature, re-fetches the payment from Razorpay, compares the amount and captures if only authorised. `POST /api/payments/webhook` (raw body, HMAC-verified) handles `payment.captured`, `order.paid`, `payment.failed`, `refund.*` idempotently. Cancelling or refunding a paid order calls the Razorpay refund API. Failed/cancelled payments keep the order + cart so the customer can retry from checkout or *My Orders*.

**Auth** — JWT in an http-only `SameSite=Lax` cookie (Bearer also accepted for API clients), bcrypt (cost 12), tokens invalidated on password change, hashed single-use reset tokens (30 min). Roles: `customer` / `admin` on the `User` model (admin is a role rather than a separate collection so one auth path covers both); every `/api/admin/*` route is protected server-side.

**Security** — helmet, CORS allow-list, rate limits (API / auth / strict for forgot-password & forms), zod validation on every write, recursive `$`/`.` key stripping + HTML stripping on all input, 1 MB body cap, image-only uploads (no SVG) ≤ 5 MB, secrets only in env.

**SEO** — per-page `<title>`, description, canonical, Open Graph, Twitter cards (React 19 head hoisting); JSON-LD for Organization, WebSite search, Product (offers + rating), BreadcrumbList, FAQPage; dynamic `/sitemap.xml` from the API; `robots.txt`. This is a client-rendered SPA: Google renders it fine, but for social link previews add a prerender service (e.g. Vercel/Netlify prerendering or prerender.io) or move the storefront to SSR later.

**Performance** — route-level code splitting (admin + charts load only in /admin), lazy images, SVG flavour art, motion honouring `prefers-reduced-motion`, immutable asset caching, API compression.

## Collections
`User, Category, Product, ProductVariant, Cart, Wishlist, Review, Coupon, Address, Order, OrderItem, Payment, Inventory (stock ledger), Banner, FAQ, Notification, SiteSettings (CMS singleton), Newsletter`.

## Main API
```
POST /api/auth/register | login | logout | forgot-password | reset-password | admin/login
GET  /api/auth/me          PUT /api/auth/profile | change-password
GET  /api/products?search=&flavour=&mood=&packSize=&minPrice=&maxPrice=&inStock=&bestseller=&new=&minRating=&sort=&page=
GET  /api/products/flavours          GET /api/products/:slug
GET|POST|DELETE /api/cart   PUT|DELETE /api/cart/:item   POST|DELETE /api/cart/coupon
POST /api/orders   GET /api/orders   GET /api/orders/:id   POST /api/orders/:id/cancel   GET /api/orders/:id/invoice
POST /api/orders/track
GET  /api/payments/config   POST /api/payments/create | verify | failed | webhook
GET  /api/reviews?product=  GET /api/reviews/featured   POST /api/reviews   POST /api/reviews/images
GET  /api/account/wishlist | addresses | coupons | recently-viewed | summary   (+ CRUD)
GET  /api/content/settings | banners | faqs    POST /api/content/newsletter | contact
/api/admin/* dashboard, analytics?range=today|7d|30d|90d|custom, products, uploads, orders (+status, notes, tracking, invoice),
             customers (+block), coupons, inventory (+adjust, bulk, history), reviews, cms, banners, faqs, notifications, system
```

## Deploy

**Database** — MongoDB Atlas → create cluster → user → allow Render's egress (or 0.0.0.0/0) → copy URI.

**API (Render)** — New → Blueprint → this repo (`render.yaml`), or a Web Service with root `server`, build `npm install --omit=dev`, start `npm start`. Set env vars from `server/.env.example` (`NODE_ENV=production`, `CLIENT_URL=https://your-site`, `SERVER_URL=https://your-api.onrender.com`). Then run the seed once from the Render shell: `npm run seed` (production skips sample reviews/demo customer automatically).

**Frontend (Vercel or Netlify)** — root `client`, build `npm run build`, output `dist`. Edit `client/vercel.json` (or `netlify.toml`) and replace `YOUR-API-HOST.onrender.com`. The frontend *proxies* `/api`, `/uploads` and `/sitemap.xml` to the API, so the auth cookie is first-party (works in Safari/iOS) and `VITE_API_URL` stays empty. Set `VITE_SITE_URL=https://your-site`.
If you instead call the API cross-domain, set `VITE_API_URL`, `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true` and add the site to `CORS_ORIGINS`.

**Razorpay** — add live keys; Dashboard → Webhooks → `https://your-api.onrender.com/api/payments/webhook`, events `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `refund.failed`; paste the secret into `RAZORPAY_WEBHOOK_SECRET`. Enable auto-capture (the API also captures authorised payments itself).

**Cloudinary / SMTP** — add keys; any SMTP works (Zoho, SES, Brevo, Gmail app password).

## Before going live — checklist
- [ ] Replace sample content: seeded reviews are flagged **SAMPLE** (delete them in Admin → Reviews); nutrition, ingredients, prices and stock are placeholders — use your lab-tested values and FSSAI-compliant labelling.
- [ ] Confirm GST rate and HSN code with your CA (`GST_RATE`, `PRODUCT_HSN`) and fill `SELLER_GSTIN`, `SELLER_FSSAI`.
- [ ] Replace `/images/products/*.svg` with real product photography (Admin → Products → Upload) and swap the IRL feed/social links in Admin → Content.
- [ ] Update policies (Shipping, Returns, Privacy, Terms) in Admin → Content → Pages with your legal text.
- [ ] Set real Razorpay keys + webhook, SMTP and Cloudinary; strong `JWT_SECRET` and `ADMIN_PASSWORD`.
- [ ] Set your real serviceable pincodes/cities policy (delivery is not pincode-restricted in code).
