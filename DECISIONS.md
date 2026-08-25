# Engineering Architecture & Design Decisions

This document records the key architectural and engineering decisions made during the design and development of the Ahoum marketplace platform.

---

## Decision 1 — Pessimistic Row-Level Locking (`select_for_update`) for Atomic Booking Concurrency

### Problem / Ambiguity
In a live session marketplace, popular workshops with limited capacity (e.g., 1 or 2 seats remaining) experience high-frequency simultaneous reservation attempts. Under concurrent load, multiple requests can concurrently query `active_count < capacity`, evaluate to true, and create duplicate booking records, resulting in oversubscription and race conditions.

### Options Considered
1. **Application-Level In-Memory Locking**: Using Python threading locks (e.g. `threading.Lock`).
2. **Optimistic Concurrency Control (OCC)**: Using a version column / timestamp check where transactions retry if state changed before commit.
3. **Distributed Redis Locks**: Using Redlock / Redis mutex keys before hitting the database.
4. **Pessimistic Row-Level Database Locking (`select_for_update`) within Atomic Transactions**: Utilizing PostgreSQL's native row-level exclusive locks during capacity evaluation and booking creation.

### Choice Made
**Option 4: Pessimistic Row-Level Locking in PostgreSQL**.  
In `SessionViewSet.book()`, the session record is fetched using `Session.objects.select_for_update().get(pk=pk)` inside `with transaction.atomic():`. This instructs PostgreSQL to acquire an exclusive row lock on the session row until the transaction completes, forcing concurrent reservation requests for the same session to queue deterministically.

### Trade-off
- *Trade-off*: Concurrent booking attempts for the *same* session briefly wait on the database row lock (a few milliseconds). However, it avoids introducing an external infrastructure dependency (Redis), avoids client retry overhead associated with OCC, and guarantees 100% mathematical prevention of seat oversubscription.

---

## Decision 2 — Single-Origin Reverse Proxy Gateway (Nginx) Architecture

### Problem / Ambiguity
In containerized multi-service deployments (React SPA frontend + Django REST API backend), routing requests across different ports (e.g., 5173 and 8000) requires complex Cross-Origin Resource Sharing (CORS) configurations, exposes internal backend service ports directly to the host network, and causes 404 errors on browser page refreshes when using client-side routing (React Router).

### Options Considered
1. **Direct Multi-Port Exposure with CORS**: Exposing Django on port 8000 and Vite on port 5173 directly on the host machine.
2. **Monolithic Server-Side Rendering (SSR)**: Serving the React SPA directly through Django template views and `staticfiles`.
3. **Dedicated Nginx Reverse Proxy Gateway on Port 80**: Utilizing an Nginx reverse proxy container as the single entry point, routing `/` to the React container and `/api/` to Django.

### Choice Made
**Option 3: Dedicated Nginx Reverse Proxy Gateway**.  
Configured Nginx on port `80` to proxy `/api/` and `/admin/` requests internally to `backend:8000` while serving the frontend SPA with `try_files $uri $uri/ /index.html;`.

### Trade-off
- *Trade-off*: Adds a lightweight Nginx container to the Compose stack. In return, it completely eliminates cross-origin CORS complications in production, keeps internal services unexposed on the host network, provides sub-millisecond static asset delivery, and guarantees that deep client-side routes (e.g. `/sessions/5`, `/auth/callback`) resolve cleanly on page refresh.

---

## Decision 3 — Interceptor-Based Transparent JWT Refresh with Graceful Session Recovery

### Problem / Ambiguity
To maintain high security, JWT access tokens have a short lifespan (15 minutes), while refresh tokens last 7 days. If an access token expires during active user navigation, standard API requests will fail with HTTP 401 Unauthorized. Forcing the user to manually log in again ruins the user experience, while refreshing on fixed client-side timers can cause unnecessary network traffic or token desynchronization across tabs.

### Options Considered
1. **Fixed-Interval Proactive Refresh**: Running a client-side `setInterval` timer that requests a new token every 14 minutes.
2. **Hard Session Termination**: Immediately clearing authentication state and redirecting to `/login` whenever any 401 is encountered.
3. **Reactive Request Interceptor with Automatic Retry**: Intercepting 401 responses in the centralized API client (`apiFetch`), asynchronously calling `POST /api/auth/refresh/`, updating stored tokens, and transparently retrying the original API call.

### Choice Made
**Option 3: Reactive Request Interceptor with Automatic Retry**.  
Implemented in `client/src/api/client.js`. When any authenticated endpoint returns 401, `apiFetch` intercepts the error, calls `performTokenRefresh()`, updates `localStorage`, and retries the pending request. If the refresh token is also invalid or expired, it triggers `auth:expired` to cleanly log out the user.

### Trade-off
- *Trade-off*: Requires robust concurrency handling within the API client to prevent multiple simultaneous 401s from triggering redundant refresh requests. In return, it delivers a seamless user experience where sessions stay active without interruption for up to 7 days.

---

## Decision 4 — Separation of Profile Editing (`PATCH /api/auth/me/`) and Onboarding Role Assignment (`POST /api/auth/role/`)

### Problem / Ambiguity
Users registering via GitHub OAuth enter the system authenticated but need to choose their role (`USER` or `CREATOR`). However, allowing `role` to be modified on the standard profile update endpoint (`PATCH /api/auth/me/`) would introduce a critical security flaw, enabling arbitrary privilege escalation by regular users after account creation.

### Options Considered
1. **Allow `role` in `UserUpdateSerializer`**: Making the `role` field writable on `PATCH /api/auth/me/`.
2. **Pass Role via Query Parameter during OAuth Initiation**: Storing the role in GitHub OAuth state and creating the user with that role.
3. **Dedicated Onboarding Endpoint (`POST /api/auth/role/`) with Immutable Profile Fields**: Keeping `role` strictly read-only on `PATCH /api/auth/me/`, and introducing a dedicated endpoint for initial role confirmation.

### Choice Made
**Option 3: Dedicated `SetRoleView` (`POST /api/auth/role/`)**.  
`UserUpdateSerializer` maintains `read_only_fields = ('id', 'email', 'role')` so normal user profile updates can only modify safe fields (`name`). The dedicated `SetRoleView` validates and sets the role during onboarding, keeping profile editing secure.

### Trade-off
- *Trade-off*: Requires maintaining a separate endpoint and serializer method for onboarding. In return, it strictly enforces backend principle of least privilege and eliminates role-tampering vectors.

---

## Decision 5 — Strict Role Separation Between Creators and Attendees

### Problem / Ambiguity
Should a Creator account be allowed to book sessions hosted by other creators, or should Creator and Attendee roles be strictly separated?

### Options Considered
1. **Unified Dual-Role Accounts**: Allowing all accounts to create sessions and book sessions interchangeably.
2. **Self-Exclusion Only**: Allowing Creators to book any session except their own.
3. **Strict Separation of Concerns**: Enforcing that only accounts with `role='USER'` can book sessions, while accounts with `role='CREATOR'` host sessions.

### Choice Made
**Option 3: Strict Separation of Concerns**.  
The backend enforces `IsUserRole` on booking endpoints (`/api/sessions/:id/book/`), while `IsCreator` is enforced on session management endpoints (`/api/sessions/`, `/api/sessions/:id/`).

### Trade-off
- *Trade-off*: A user who wants to host workshops and book other workshops must register distinct Creator and Attendee profiles. In return, this prevents ambiguous dashboard routing, simplifies permission enforcement, prevents booking conflict bugs, and keeps the UI clean and tailored for each role's distinct workflow.
