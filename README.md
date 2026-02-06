<div align="center">
	<h1>Shifty</h1>
	<p>Room shifting OS for Graphic Era & Clement Town students</p>
</div>

Shifty orchestrates room moves with a lightweight ML recommendation engine, live service maps and a payment workflow tuned for campus shifting seasons.

## Feature highlights

- 🔐 **Clerk-powered auth** – `/sign-up` and `/sign-in` use Clerk's hosted UI for a secure and smooth authentication flow.
- 🔮 **ML-guided pairing** – `src/lib/matchEngine.ts` blends rent affinity, travel time and vibe tags to rank verified hostels.
- 🧭 **Route-aware planning** – planner now asks for pickup + destination zones and rewards listings that match the declared corridor.
- 💸 **Planner → payment handoff** – reserving a suggested listing deep-links into `/payments` with the rent and corridor already pre-filled.
- 🗺️ **Live progress tracking** – After clicking "Reserve slot", a map automatically appears showing the move route and real-time progress simulation.
- 📍 **Interactive mapping** – `ServiceMap` plots campus nodes, hostel clusters and multi-drop routes over OpenStreetMap tiles.
- 💳 **Payment-ready** – `/api/payments/intent` mints booking references so you can plug Stripe/Razorpay keys without code churn.
- 🧪 **Vitest coverage** – unit tests guard the recommendation logic for regression-free tweaks.

## API endpoints

All contracts and payloads live in [`docs/endpoints.md`](docs/endpoints.md). Quick view:

- `GET /api/listings` – housing inventory for the map + match engine
- `POST /api/recommendations` – ML-scored listings for a student profile
- `GET /api/service-area` – checkpoints, fleet stats, polylines
- `POST /api/payments/intent` – booking reference (already integrated in the UI)
- `POST /api/payments/mock-webhook` – simulate gateway callbacks locally

## Stack

- Next.js App Router + Clerk
- Tailwind CSS
- React Leaflet + OpenStreetMap tiles
- Vitest for unit testing
- Razorpay Checkout script stub (can swap any gateway)

## Pages

- `/` – marketing overview, highlights, live service map
- `/signup` – Clerk-hosted signup form
- `/login` – Clerk-hosted signin form
- `/plan` – dedicated AI move planner (calls `/api/recommendations`) and links "Reserve slot" to `/payments`
- `/payments` – booking fee workflow + webhook simulator with AI-planner context pre-filled

## Quickstart

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore the dashboard.

## Testing & quality gates

```bash
npm run lint
npm test
```

`npm test` runs Vitest in CI-friendly mode while `npm run lint` ensures the Next.js ESLint config passes.

## Payment gateway notes

- The UI calls `/api/payments/intent` to simulate booking fee capture.
- Drop your production gateway keys into env vars and forward them to this route to go live.
- Webhook scaffolding can reuse the same handler – see comments inside `PaymentWidget`.

## Auth notes (Clerk)

- The app uses Clerk for authentication. You will need to create a Clerk account and a new project.
- Add your Clerk keys to a `.env.local` file in the root of the project:
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  ```
- The `/plan` and `/payments` pages are protected. You will be redirected to the login page if you are not authenticated.
- Public routes are `/`, `/login`, `/signup`, and the API routes for listings and service area.
- The middleware at `src/middleware.ts` handles the routing protection.

## Deployment

Deploy to Vercel or any Node 18+ host:

```bash
npm run build
npm start
```

Keep the `NEXT_PUBLIC_MAP_TILE_URL` (optional) and payment keys configured via your hosting provider for secure rollouts.
# shiftty
