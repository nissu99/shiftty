# Shifty API Endpoint Plan

This document captures how the Shifty app is split across multiple endpoints so each feature can evolve independently and serve both the web UI and future mobile clients.

## Overview

| Area | Endpoint | Method | Purpose |
| --- | --- | --- | --- |
| Housing catalog | `/api/listings` | GET | Returns the curated list of verified hostels/PGs with metadata required by the UI and ML layer. |
| ML recommendations | `/api/recommendations` | POST | Accepts a student profile and returns scored listings using the match engine. |
| Service coverage map | `/api/service-area` | GET | Provides campus checkpoints, fleet telemetry, and optimized polyline data for the Leaflet map. |
| Payments | `/api/payments/intent` | POST | Generates a booking reference + amount payload used to initiate gateway checkout. |
| Payments | `/api/payments/mock-webhook` | POST | Simulates a gateway webhook so downstream automations can be tested locally. |

## Contracts

### `/api/listings` (GET)
- **Response**: `{ listings: HousingListing[] }`
- Includes: id, title, coordinates, rent, amenities, rating, travel time.
- Cached for 10 minutes via Next.js `revalidate` hint.

### `/api/recommendations` (POST)
- **Request**: `{ budget: number; moveDate: string; luggage: "light"|"medium"|"heavy"; vibe: "focus"|"balanced"|"social"; sourceArea: string; destinationArea: string; topN?: number }`
- **Response**: `{ recommendations: Recommendation[] }`
- Source & destination strings describe the student’s pickup and intended drop-off zones; the ML engine boosts listings that align with the requested corridor.

### `/api/service-area` (GET)
- **Response**: `{ checkpoints: CampusNode[]; activeFleet: FleetSummary; polyline: Array<[number, number]> }`
- Supplies map overlays and operational stats (active movers, cold storage trucks, ETA accuracy).

### `/api/payments/intent` (POST)
- Already implemented; returns `{ reference, amount }`. Will be extended to accept metadata (studentId, listingId) for reconciliation.

### `/api/payments/mock-webhook` (POST)
- **Request**: `{ reference: string; status: "captured"|"failed" }`
- **Response**: `{ ok: true }`
- Mimics gateway callbacks so we can test automation flows without hitting external services.

## Frontend consumption plan

- `MatchPlanner` will POST to `/api/recommendations` instead of running ML solely client-side, enabling server-side tuning and observability.
- `ServiceMap` hydrates via `/api/service-area` to decouple map content from the bundle and pave the way for real-time updates.
- `PaymentWidget` retains its call to `/api/payments/intent` and gains webhook testing via the mock endpoint.
- `MatchPlanner` now deep-links `Reserve slot` actions to `/payments?listing=<id>&amount=<rent>&pickup=<source>&dropoff=<destination>` so the payment workflow inherits all planner context.
- `/login` and `/signup` are handled by Clerk's hosted pages. The middleware protects routes and redirects unauthenticated users. The UI does not need to POST credentials directly.

## Next steps

1. Implement the three new route handlers (`listings`, `recommendations`, `service-area`) plus the mock webhook.
2. Wire relevant UI components to fetch from these routes.
3. Add smoke tests (Vitest or API contract tests) targeting each handler.
