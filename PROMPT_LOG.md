# Engineering Prompt & Development Log

This document records the human-AI collaborative engineering trajectory, developer prompts, architectural feedback loops, code review adjustments, and human oversight decisions across all phases of the Ahoum marketplace platform.

---

## Development Phases & Prompt Trajectory

### Phase 1: Project Scaffolding & Database Infrastructure
- **Git Commits**: `3709208` (init), `70774ac` (.gitignore), `f174cf4` (backend scaffold), `d983773` (client scaffold), `9d8b087` (postgres config)
- **Tool / Model**: Antigravity AI (Claude 3.5 Sonnet / Gemini 2.5 Pro)
- **Developer Prompt Intent**:
  > *"Scaffold a decoupled monorepo with a Django 5 backend under `server/` and a React + Vite + TypeScript frontend under `client/`. Configure PostgreSQL 17 in Docker Compose using environment variables and a persistent named volume."*
- **What Was Accepted / Implemented**:
  - Clean separation between `server/` and `client/` directories.
  - Dedicated PostgreSQL service in `docker-compose.yml` with named volume `postgres_data:/var/lib/postgresql/data`.
  - Initial `settings.py` utilizing `os.getenv` for database credentials via `psycopg`.
- **What Was Rejected / Modified**:
  - Rejected storing database secrets directly in `settings.py`; enforced `.env` parsing via `python-dotenv`.
  - Rejected default SQLite fallback in development to guarantee PostgreSQL parity from day one.
- **Verification**:
  - Executed `docker compose up -d postgres` and verified connection with `python manage.py check`.

---

### Phase 2: Custom User Authentication & JWT Pipeline
- **Git Commits**: `8995a2f` (custom user model), `5d90910` (JWT auth)
- **Tool / Model**: Antigravity AI
- **Developer Prompt Intent**:
  > *"Implement a custom User model supporting `USER` (Learner) and `CREATOR` roles. Configure DRF with SimpleJWT for registration, login, and token refresh. Ensure email is the primary login identifier."*
- **What Was Accepted / Implemented**:
  - `User` model inheriting from `AbstractBaseUser` and `PermissionsMixin` with `USERNAME_FIELD = 'email'`.
  - `RegisterSerializer` and `LoginView` returning JWT pair (`access` 15m, `refresh` 7d) and serialized user profiles.
- **What Was Rejected / Modified**:
  - AI initially omitted `write_only=True` on password fields; manually corrected serializers to ensure password hashes are never exposed in user detail responses.
- **Verification**:
  - Created automated test cases in `server/authentication/tests.py` testing registration, login, and token issuance.

---

### Phase 3: GitHub OAuth Implementation & Upstream Handshake
- **Git Commits**: `a287086` (github oauth), `157b27c` (typing & import fixes)
- **Tool / Model**: Antigravity AI
- **Developer Prompt Intent**:
  > *"Implement server-side GitHub OAuth login. Exchange the authorization code with GitHub's access_token API, fetch the primary verified email, create or login the user, and issue our internal JWT tokens."*
- **What Was Accepted / Implemented**:
  - `GitHubLoginView` handling code exchange and email retrieval.
  - `is_new_user` boolean flag returned in OAuth response payload to support post-login onboarding flows.
- **What Was Rejected / Modified**:
  - AI initially proposed saving GitHub access tokens in the database. Rejected this to prevent security liability; internal JWT tokens are sufficient.
  - Added protection ensuring custom profile names edited by users are not overwritten by upstream GitHub display names during subsequent OAuth logins.
- **Verification**:
  - Implemented unit tests in `authentication.tests` with mocked upstream GitHub API calls verifying valid login, disabled user rejection, and missing email handling.

---

### Phase 4: Workshop Sessions, Capacity Constraints & Permissions
- **Git Commits**: `b059a04` (sessions & tests), `15fa3d6` (clean env & permissions)
- **Tool / Model**: Antigravity AI
- **Developer Prompt Intent**:
  > *"Build the Session model with title, description, start_time, end_time, capacity, and creator foreign key. Enforce that only users with the CREATOR role can create/edit sessions, and start_time must be in the future."*
- **What Was Accepted / Implemented**:
  - Model check constraints: `CheckConstraint(condition=Q(capacity__gt=0))` and `CheckConstraint(condition=Q(end_time__gt=F('start_time')))`.
  - Custom permissions `IsCreator` and `IsSessionCreator` restricting write/delete actions strictly to the session owner.
- **What Was Rejected / Modified**:
  - Added update validation preventing a creator from reducing session capacity below the number of already booked active seats.
- **Verification**:
  - 15 unit tests in `server/sessions/tests.py` verifying CRUD operations, filtering by past/upcoming, and permission boundaries.

---

### Phase 5: Concurrency-Safe Booking System & Atomic Row Locking
- **Git Commits**: `15fa3d6` (bookings & cancellation)
- **Tool / Model**: Antigravity AI
- **Developer Prompt Intent**:
  > *"Implement session booking and cancellation endpoints. Protect against race conditions and overbooking when multiple users book the final remaining seat simultaneously."*
- **What Was Accepted / Implemented**:
  - `POST /api/sessions/:id/book/` and `POST /api/bookings/:id/cancel/`.
  - `Session.objects.select_for_update().get(pk=pk)` inside `transaction.atomic()`.
  - Unique constraint on `['user', 'session']` where `status='ACTIVE'` to prevent duplicate active reservations.
- **What Was Rejected / Modified**:
  - Prevented booking or cancelling past sessions that have already started.
  - Ensured cancelled bookings free up capacity immediately.
- **Verification**:
  - Wrote a multi-threaded concurrency test (`test_concurrent_bookings_do_not_exceed_capacity`) using `ThreadPoolExecutor` and `threading.Barrier` in `server/bookings/tests.py`.

---

### Phase 6: Frontend SPA Architecture, Centralized API & Role Routing
- **Git Commits**: `8287858` (API centralization), `72b1b38` (app shell & routing), `4234339` (config decoupling)
- **Tool / Model**: Antigravity AI
- **Developer Prompt Intent**:
  > *"Build React/Vite frontend with Tailwind CSS, centralized API client under client/src/api/, AuthContext provider, and role-protected routes for /dashboard (Learner) and /creator (Host)."*
- **What Was Accepted / Implemented**:
  - Centralized `apiFetch` in `client/src/api/client.js` with automatic 401 token refresh interceptor.
  - Route guards: `PublicRoute`, `ProtectedRoute`, and `RoleProtectedRoute`.
- **What Was Rejected / Modified**:
  - AI initially placed TypeScript types and React Context in the same file, causing Vite Fast Refresh warnings. Refactored into separate `types.ts`, `AuthContext.ts`, and `useAuth.ts`.
- **Verification**:
  - Ran `npm run lint` (ESLint 0 errors) and `npm run build` (TypeScript compilation).

---

### Phase 7: Dashboards, Profile Editing & Interactive Modals
- **Git Commits**: `e67941f` (dashboard UI), `e38b7ab` (creator & learner split), `18e20de` (profile editing & modals)
- **Tool / Model**: Antigravity AI
- **Developer Prompt Intent**:
  > *"Separate Creator and Learner dashboards. Implement profile name editing and replace browser alerts with custom confirmation modals for seat cancellation and session deletion."*
- **What Was Accepted / Implemented**:
  - `CancelBookingModal` and `DeleteSessionModal` with accessible focus management.
  - Profile page allowing safe name updates via `PATCH /api/auth/me/`.
  - Navigation awareness (`location.state.from`) providing clean back buttons without duplicates.
- **What Was Rejected / Modified**:
  - AI initially attempted to show a role-selection popup modal after registration, but `PublicRoute` immediately redirected to `/dashboard`. Refactored role selection directly into interactive cards on the registration form.
- **Verification**:
  - Tested modal confirm/cancel flows and profile update persistence across re-logins.

---

### Phase 8: Onboarding Role Selection, Participant Roster & Token Recovery
- **Git Commits**: `0c53123` (seat full priority), `ca6cca9` (github role selection), `24b5a08` (creator attendee roster), `688ba31` (expired token tests), `661209e` (oauth cancellation UI)
- **Tool / Model**: Antigravity AI
- **Developer Prompt Intent**:
  > *"Add role selection for GitHub OAuth users, display live participant roster on creator's own session detail, handle OAuth cancellations, and verify expired JWT handling."*
- **What Was Accepted / Implemented**:
  - `SetRoleView` (`POST /api/auth/role/`) for safe onboarding role assignment.
  - `SessionSerializer.attendees` roster restricted strictly to session host creator.
  - OAuth cancellation screen handling `error=access_denied` with instant retry button.
- **What Was Rejected / Modified**:
  - AI test assertion expected `"Token is invalid or expired"` on expired tokens; corrected assertion to match SimpleJWT's exact `"Token is expired"` response payload.
- **Verification**:
  - 48/48 backend tests passing, `npm run lint` (0 errors), `npm run build` (0 errors).

---

### Phase 9: Multi-Container Docker Stack & Comprehensive Documentation
- **Git Commits**: Current Phase
- **Tool / Model**: Antigravity AI
- **Developer Prompt Intent**:
  > *"Implement full Docker Compose stack (Postgres, Backend, Frontend, Nginx), configure Nginx reverse proxy on port 80 with SPA fallback routing, and provide complete documentation."*
- **What Was Accepted / Implemented**:
  - `server/Dockerfile` with automated migration entrypoint and Gunicorn.
  - Multi-stage `client/Dockerfile` with relative `/api` base URL.
  - `nginx/nginx.conf` routing `/` to frontend and `/api/` to backend.
  - Root `README.md`, `PROMPT_LOG.md`, `DECISIONS.md`, and `DEBUGGING.md`.
- **What Was Rejected / Modified**:
  - Added port mapping `5432:5432` to `postgres` service and compose variable fallbacks `${DB_NAME:-ahoum}` to prevent compose interpolation warnings and support local CLI test runs.
- **Verification**:
  - `docker compose config` (0 warnings).
  - `docker compose up --build -d` (All 4 containers healthy and running).
  - HTTP `curl.exe -i http://localhost/` (HTTP 200), `http://localhost/api/sessions/` (HTTP 200), `http://localhost/sessions` (HTTP 200).
  - Executed full test suite inside container: 48/48 tests OK in 60s.

---

## What AI Got Wrong & Human Engineering Corrections

### 1. `read_only_fields` Collision During Onboarding Role Assignment
- **AI Initial Assumption**:
  The AI attempted to update user role during GitHub onboarding by sending `PATCH /api/auth/me/` with `{ "role": "CREATOR" }`.
- **What Failed**:
  `UserUpdateSerializer` properly configured `read_only_fields = ('id', 'email', 'role')` for API security, causing Django to silently ignore the role update and leave the user as `USER`.
- **Human Engineering Correction**:
  Recognized that making `role` mutable in `UserUpdateSerializer` would introduce a severe privilege escalation vulnerability (allowing any user to promote themselves to Creator via profile edit). Instead, created a dedicated, secure `SetRoleView` (`POST /api/auth/role/`) exclusively for onboarding role selection.

### 2. Docker Compose Environment Variable Interpolation Warnings
- **AI Initial Assumption**:
  The AI referenced `${DB_NAME}`, `${DB_USER}`, `${DB_PASSWORD}`, `${DB_PORT}` in `docker-compose.yml` expecting Docker Compose to load them from `server/.env`.
- **What Failed**:
  Docker Compose evaluates `${VAR}` variable interpolation in the root shell context *before* parsing container `env_file` directives, producing four warning messages: `"The DB_NAME variable is not set. Defaulting to a blank string."`.
- **Human Engineering Correction**:
  Added standard Compose fallback defaults (`${DB_NAME:-ahoum}`, `${DB_PORT:-5432}`) in `docker-compose.yml` and provided a safe root `.env.example` template, completely eliminating warnings while keeping secrets isolated in `server/.env`.

### 3. Conditional Priority Inversion on Full vs Expired Sessions
- **AI Initial Assumption**:
  The AI checked `if (isPast) ... else if (isFull) ...` when rendering session action buttons and badges.
- **What Failed**:
  When a session reached 100% capacity before its start date, it was incorrectly labeled as "Session Has Ended" rather than "Seat Is Full".
- **Human Engineering Correction**:
  Re-ordered the evaluation logic across `SessionDetailPage.tsx`, `SessionsPage.tsx`, and `UserDashboardPage.tsx` to prioritize `isFull` capacity checks over `isPast` scheduling checks.

### 4. SimpleJWT Error Payload Message Discrepancy in Automated Tests
- **AI Initial Assumption**:
  The AI wrote test assertions checking for `"Token is invalid or expired"` on expired access token requests.
- **What Failed**:
  The test failed because DRF SimpleJWT returns `"Token is expired"` when a token is well-formed but past expiration, reserving `"Token is invalid or expired"` for corrupted signatures.
- **Human Engineering Correction**:
  Updated the assertion in `server/authentication/tests.py` to match SimpleJWT's exact error schema: `self.assertIn("token is expired", str(response.data).lower())`.
