# Engineering Debugging Log

This document records real engineering issues, diagnosis procedures, root causes, fixes, and verification evidence encountered during the implementation and testing of the Ahoum platform.

---

## Issue 1 — Race Condition & Seat Oversubscription in Simultaneous Workshop Bookings

### Symptom
Under high concurrency, when multiple users attempted to book the last remaining seat of a workshop simultaneously, the database recorded more active bookings than the session's configured `capacity`.

### Diagnosis
Code inspection of the initial booking handler revealed:
```python
# Unprotected read-modify-write pattern
active_count = Booking.objects.filter(session=session, status='ACTIVE').count()
if active_count < session.capacity:
    Booking.objects.create(session=session, user=user, status='ACTIVE')
```
Under multi-threaded execution, Thread A and Thread B both queried `active_count` before either thread committed a new booking. Both threads evaluated `active_count < capacity` as true, and both inserted a booking.

### Root Cause
Under PostgreSQL's default `READ COMMITTED` transaction isolation level, concurrent queries read the committed snapshot at query start. Without an explicit row-level exclusive lock, concurrent transactions do not block each other from reading the same remaining seat count.

### Fix
Wrapped the capacity check and booking creation inside `transaction.atomic()`, acquiring an exclusive row-level lock on the session row:
```python
with transaction.atomic():
    session = Session.objects.select_for_update().get(pk=pk)
    active_count = Booking.objects.filter(session=session, status=Booking.Status.ACTIVE).count()
    if active_count >= session.capacity:
        return Response({"detail": "This session is fully booked. No remaining seats."}, status=status.HTTP_400_BAD_REQUEST)
    booking = Booking.objects.create(session=session, user=user, status=Booking.Status.ACTIVE)
```

### Verification
Created a multi-threaded automated test in `server/bookings/tests.py` (`test_concurrent_bookings_do_not_exceed_capacity`) utilizing `ThreadPoolExecutor` and `threading.Barrier(2)` to synchronize simultaneous booking attempts against a session with `capacity=1`.
- **Command**: `docker compose exec backend python manage.py test bookings.tests.BookingAPITests.test_concurrent_bookings_do_not_exceed_capacity`
- **Result**: Exactly one request returned HTTP 201 Created, the second returned HTTP 400 Bad Request, and the final database active booking count equaled exactly 1.

---

## Issue 2 — Docker Compose Environment Variable Interpolation Warnings

### Symptom
Executing `docker compose` commands produced four warning messages on the terminal:
```text
WARN[0000] The "DB_NAME" variable is not set. Defaulting to a blank string.
WARN[0000] The "DB_USER" variable is not set. Defaulting to a blank string.
WARN[0000] The "DB_PASSWORD" variable is not set. Defaulting to a blank string.
WARN[0000] The "DB_PORT" variable is not set. Defaulting to a blank string.
```

### Diagnosis
Inspecting `docker-compose.yml` revealed:
```yaml
services:
  postgres:
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```
Docker Compose processes `${VAR}` variable interpolation in the shell context where the command is executed (the project root) *before* parsing container-level `env_file: server/.env` directives.

### Root Cause
Environment variables were properly defined in `server/.env`, but no `.env` file existed at the repository root where `docker compose` was executed, triggering interpolation warnings.

### Fix
1. Added fallback default values in `docker-compose.yml`:
   ```yaml
   POSTGRES_DB: ${DB_NAME:-ahoum}
   POSTGRES_USER: ${DB_USER:-ahoum}
   POSTGRES_PASSWORD: ${DB_PASSWORD:-ahoum_secure_password}
   ```
2. Created a safe root `.env.example` template for Docker Compose.

### Verification
- **Command**: `docker compose config`
- **Result**: Exit code 0 with 0 warnings; all services, ports, and volumes parsed cleanly.

---

## Issue 3 — Priority Collision Between "Seat Is Full" and "Session Has Ended" States

### Symptom
When an upcoming workshop reached 100% capacity before its start date, the user interface incorrectly displayed "Session Has Ended" on the reservation button and badge, confusing learners about workshop availability.

### Diagnosis
Inspecting `SessionDetailPage.tsx` and `SessionsPage.tsx` revealed the conditional evaluation order:
```tsx
// Incorrect ordering:
if (isPast) {
  return <Button disabled>Session Has Ended</Button>
} else if (isFull) {
  return <Button disabled>Seat Is Full</Button>
}
```
Because `isPast` was evaluated first, any edge-case timing or boolean evaluation overshadowed the capacity status.

### Root Cause
Boolean condition ordering prioritized time checks over capacity checks without explicit isolation of active upcoming full sessions.

### Fix
Re-ordered and structured the priority checks across `SessionDetailPage.tsx`, `SessionsPage.tsx`, and `UserDashboardPage.tsx`:
```tsx
// Corrected priority:
{isUserRole && !isBooked && isFull && (
  <Button variant="secondary" size="md" disabled className="bg-red-50 text-red-700 border-red-200">
    Seat Is Full
  </Button>
)}
{isUserRole && !isBooked && !isFull && isPast && (
  <Button variant="secondary" size="md" disabled>
    Session Has Ended
  </Button>
)}
```

### Verification
- **Command**: `npm run lint` && `npm run build`
- **Result**: Tested full upcoming sessions; badge correctly displays `"SEAT IS FULL"` and button displays `"Seat Is Full"` in disabled state.

---

## Issue 4 — SimpleJWT Token Expiration Message Mismatch in Regression Tests

### Symptom
Running `py manage.py test authentication` produced an assertion error in `test_expired_access_token_rejected_with_401`:
```text
AssertionError: 'token is invalid or expired' not found in "{'detail': errordetail(string='given token not valid for any token type', code='token_not_valid'), ... 'messages': [{'message': errordetail(string='token is expired', code='token_not_valid')}]}"
```

### Diagnosis
The test created an `AccessToken` with `token.set_exp(lifetime=-timedelta(minutes=10))` and checked `self.assertIn("token is invalid or expired", str(response.data).lower())`.

### Root Cause
Django REST Framework SimpleJWT distinguishes between malformed tokens (`"Token is invalid or expired"`) and validly formatted tokens that have passed their expiration timestamp (`"Token is expired"`). The assertion string was expecting the malformed token error message.

### Fix
Updated the test assertion in `server/authentication/tests.py`:
```python
self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
self.assertEqual(response.data.get('code'), 'token_not_valid')
self.assertIn("token is expired", str(response.data).lower())
```

### Verification
- **Command**: `docker compose exec backend python manage.py test authentication.tests.StandardAuthRegressionTests.test_expired_access_token_rejected_with_401`
- **Result**: `Ran 1 test in 0.420s ... OK`. Full suite `Ran 48 tests ... OK`.
