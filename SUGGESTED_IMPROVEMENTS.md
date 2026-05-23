# Suggested Improvements — MediSync HMS

This file captures all identified issues, technical debt, and improvement opportunities across the codebase. Items are grouped by category and ordered by priority within each section.

---

## 1. Critical Security Issues

---

## 2. Data Integrity

### 2.1 Race condition in appointment booking
- **File:** `backend/src/services/AppointmentService.ts`
- **Problem:** Slot conflict is checked with a `SELECT`, then the new appointment is `INSERT`ed in a separate statement. Two concurrent requests can both pass the check and both insert, creating a double-booking.
- **Fix:** Add a `UNIQUE` constraint on `(doctor_id, date, time)` filtered to non-cancelled appointments, or wrap the check-and-insert in a serializable transaction.

### 2.2 Doctor-staff name join is fragile
- **File:** `backend/src/services/NotificationService.ts`
- **Problem:** `LOWER(s.name) = LOWER(d.name)` links staff accounts to doctor profiles by name. Two people with the same name break this silently (wrong notifications) or miss it (no notifications).
- **Fix:** Add a `staff_id` foreign key column to the `doctors` table and join on that instead.

### 2.3 File deletion is fire-and-forget
- **File:** `backend/src/services/ImageService.ts`
- **Problem:** After deleting an image DB record, the file is deleted asynchronously without awaiting the result. If `fs.unlink` fails, the DB record is gone but the file remains, causing orphaned files.
- **Fix:** Either await `fs.unlink` and log/handle failures, or (safer) delete the file first and only delete the DB record after confirming success.

### 2.4 No past-date validation on appointments
- **File:** `backend/src/services/AppointmentService.ts`, `frontend/src/pages/Appointments.tsx`
- **Problem:** Appointments can be created or rescheduled to dates in the past. No validation exists on either the frontend form or the backend service.
- **Fix:** Backend: reject if `new Date(date + 'T' + time) < new Date()`. Frontend: set `min={new Date().toLocaleDateString('en-CA')}` on date inputs.

### 2.5 Unvalidated array contents stored as JSON
- **File:** `backend/src/services/PatientService.ts`
- **Problem:** `conditions` and `allergies` are accepted as arrays and stored via `JSON.stringify()` without validating individual elements. Malformed or excessively large values are persisted unchecked.
- **Fix:** Validate that each element is a non-empty string under a reasonable length limit before serializing.

### 2.6 Concurrent writes to patient records unchecked
- **File:** `backend/src/services/PatientService.ts`
- **Problem:** No optimistic locking or `updated_at` version check. Two staff members editing the same patient simultaneously will silently overwrite each other.
- **Fix:** Add an `updated_at` column, pass it with update requests, and reject if the DB value has changed since the client last read.

---

## 3. Input Validation & Sanitization

### 3.1 Email not validated on patient registration
- **File:** `backend/src/routes/patientAuthRoutes.ts`
- **Problem:** Email is only `.trim()`ed. Malformed values like `notanemail` or `@` are accepted and stored.
- **Fix:** Validate format: `if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json(...)`.

### 3.2 No length limits on free-text fields
- **Files:** `backend/src/routes/patientRoutes.ts`, `backend/src/routes/doctorRoutes.ts`, `backend/src/routes/staffRoutes.ts`
- **Problem:** Fields like `name`, `address`, `notes` accept unlimited length, enabling abnormally large inputs that waste storage and could cause issues with display components.
- **Fix:** Add server-side length validation: names ≤ 255 chars, addresses ≤ 500 chars, notes ≤ 2000 chars.

### 3.3 diseaseType field not sanitized
- **File:** `backend/src/routes/imageRoutes.ts`
- **Problem:** `diseaseType` is stored and later rendered in the UI without sanitization. If rendered with `dangerouslySetInnerHTML` anywhere (or in future), this is an XSS vector.
- **Fix:** Sanitize all user-supplied strings before storing. Validate `diseaseType` against a known enum if possible.

### 3.4 Pagination params not validated
- **File:** `backend/src/routes/appointmentRoutes.ts`, `backend/src/routes/patientRoutes.ts`
- **Problem:** `parseInt(page, 10) || 1` silently coerces invalid values. Negative pages or extremely large page numbers are not rejected.
- **Fix:** Explicitly validate: `if (!Number.isInteger(pageNum) || pageNum < 1) return res.status(400)...`.

### 3.5 Financial cost not validated against precision
- **File:** `backend/src/routes/financialRoutes.ts`
- **Problem:** Cost is accepted as a raw number. Floating-point inputs like `9.999999999999998` could create inconsistent stored values. Zero cost is accepted without business-logic check.
- **Fix:** Round to 2 decimal places server-side. Reject zero or negative costs if the business rule disallows them.

---

## 4. Performance

### 4.1 Unbounded audit log queries
- **File:** `backend/src/services/AuditService.ts`
- **Problem:** `getLogs()` uses a hard-coded `LIMIT 1000` with no pagination. `getLogsByStaff()` uses `LIMIT 500`. As the audit table grows, these queries return massive datasets in a single response.
- **Fix:** Accept `page` and `limit` query parameters. Default `limit` to 50, cap at 200.

### 4.2 Dual COUNT + SELECT for paginated lists
- **File:** `backend/src/services/PatientService.ts`, `backend/src/services/AppointmentService.ts`
- **Problem:** Paginated list endpoints execute two separate queries (one `COUNT(*)`, one `SELECT ... LIMIT/OFFSET`). On large tables this is expensive.
- **Fix:** Use a window function: `SELECT COUNT(*) OVER() AS total_count, * FROM patients ...` to get both in one pass. Alternatively, cache counts for short TTLs.

### 4.3 Notification polling interval
- **File:** `frontend/src/hooks/useNotifications.ts` (or wherever polling is configured)
- **Problem:** Notifications are polled via React Query. If the interval is short (e.g., 10–15s), this generates continuous backend traffic for all logged-in users.
- **Fix:** Increase interval to 60s, or replace polling with a WebSocket / Server-Sent Events connection.

### 4.4 Image stale time may be too long
- **File:** `frontend/src/hooks/useImages.ts`
- **Problem:** `staleTime: 1000 * 60 * 5` (5 minutes) means newly uploaded images may not appear for up to 5 minutes on a cached view.
- **Fix:** Reduce to 60–120s, or invalidate the query explicitly on successful upload (React Query `queryClient.invalidateQueries`).

### 4.5 No database indexes documented or enforced
- **File:** All migration / schema files
- **Problem:** Indexes on `appointments(doctor_id, date)`, `images(patient_id)`, `audit_logs(staff_id)`, `notifications(staff_id, is_read)` are not confirmed to exist. Missing indexes cause full-table scans.
- **Fix:** Audit `\di` in psql and add indexes for all foreign keys and common filter columns.

---

## 5. Code Quality & Maintainability

### 5.1 `error: any` in all catch blocks
- **Files:** All backend route and service files (30+ instances)
- **Problem:** Using `catch (error: any)` suppresses TypeScript's type safety. Accessing `error.message` on a non-Error value causes runtime issues.
- **Fix:** Use `catch (error: unknown)` and narrow: `const msg = error instanceof Error ? error.message : 'Unknown error'`.

### 5.2 No `asyncHandler` wrapper — repetitive try-catch
- **Files:** All backend route files
- **Problem:** Every route handler wraps its body in an identical try-catch pattern. This is ~200 lines of boilerplate.
- **Fix:** Create a utility:
  ```typescript
  const asyncHandler = (fn: RequestHandler): RequestHandler =>
    (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
  ```
  Then routes become: `router.get('/', asyncHandler(async (req, res) => { ... }))`.

### 5.3 `row: any` in service transform functions
- **Files:** `backend/src/routes/doctorRoutes.ts`, `backend/src/services/ImageService.ts`, `backend/src/services/AppointmentService.ts`
- **Problem:** `function transformRow(row: any)` gives up all type safety on DB result rows.
- **Fix:** Define interfaces for raw DB row shapes (e.g., `interface AppointmentRow { id: number; patient_id: number; ... }`) and type `row` explicitly.

### 5.4 Duplicate types across frontend and backend
- **Files:** `backend/src/models/types.ts`, `frontend/src/types/index.ts`
- **Problem:** Shared domain types (Patient, Appointment, Doctor, etc.) are defined twice and drift independently. A field added to the backend type is not automatically added to the frontend type.
- **Fix:** Extract to a shared `packages/types` workspace package (if using a monorepo), or generate frontend types from backend OpenAPI spec using `openapi-typescript`.

### 5.5 Inconsistent casing on route params
- **Files:** `backend/src/routes/imageRoutes.ts` vs. others
- **Problem:** Some routes use `patientID`, others use `patientId`. This causes subtle bugs when accessing `req.params`.
- **Fix:** Standardize to `camelCase` (`patientId`) across all routes.

### 5.6 Hard-coded role-to-prefix mapping duplicated
- **File:** `backend/src/services/StaffService.ts`
- **Problem:** `ROLE_PREFIX` mapping (`{ admin: 'ADM', doctor: 'DOC', ... }`) is duplicated and may diverge from constants elsewhere.
- **Fix:** Extract to a single shared `constants.ts` file and import where needed.

### 5.7 `ROLE_PREFIX` mapping duplicated
- **File:** `backend/src/services/StaffService.ts`
- **Problem:** Same as above — also appears in seeds/migrations. Single source of truth is cleaner.

### 5.8 No React error boundary
- **File:** `frontend/src/App.tsx`, `frontend/src/main.tsx`
- **Problem:** A runtime error in any component bubbles to a blank white screen with no user feedback.
- **Fix:** Wrap the app with a class-based `ErrorBoundary` component that renders a friendly "Something went wrong" message with a reload button.

### 5.9 No loading skeletons — abrupt content shifts
- **Files:** Most page components
- **Problem:** While data loads, pages render nothing or a spinner. This causes layout shifts and feels unpolished.
- **Fix:** Add skeleton placeholder components using Tailwind `animate-pulse` while queries are in `isLoading` state.

### 5.10 `toISOString().split('T')[0]` usage (potential leftover)
- **Files:** Any remaining places not yet updated
- **Problem:** `toISOString()` returns UTC time. In UTC+5:30, midnight local = 18:30 UTC previous day, so the date string is off by one.
- **Fix:** Always use `new Date().toLocaleDateString('en-CA')` for local-date strings (already fixed in dashboards and MySchedule, but verify no regressions elsewhere).

---

## 6. Missing Features & UX Gaps

### 6.1 No export / download for audit logs
- **File:** `backend/src/routes/auditRoutes.ts`, `frontend/src/pages/AuditLogs.tsx`
- **Problem:** Audit logs can only be viewed in the UI. For compliance and investigation purposes, admins typically need to export to CSV or PDF.
- **Fix:** Add a `GET /api/audit/export?format=csv` endpoint and a download button in the UI.

### 6.2 No appointment reminders
- **Problem:** Patients receive notifications in-app but no email or SMS reminder before an appointment.
- **Fix:** Add a background job (cron) that runs daily, finds appointments 24h away, and sends email reminders via a mail service (Nodemailer + SMTP or a transactional provider).

### 6.3 Doctor availability / working hours not modelled
- **Problem:** The booking system allows appointments at any time on any day. There is no concept of a doctor's working hours or non-working days.
- **Fix:** Add a `doctor_availability` table with `(doctor_id, day_of_week, start_time, end_time)` and validate against it when booking.

### 6.4 Appointment status transitions not guarded
- **File:** `backend/src/services/AppointmentService.ts`
- **Problem:** An appointment can be moved from `cancelled` back to `scheduled`, or `completed` to `cancelled`, without any guard on allowed state transitions.
- **Fix:** Define a state machine: `scheduled → confirmed → completed | cancelled`. Reject transitions that don't follow the allowed paths.

### 6.5 No soft delete for patients or doctors
- **File:** `backend/src/services/PatientService.ts`, `backend/src/services/DoctorService.ts`
- **Problem:** Deleting a patient or doctor is a hard delete, even with cascade. Accidental deletions are unrecoverable.
- **Fix:** Add `deleted_at TIMESTAMPTZ` column. Filter `WHERE deleted_at IS NULL` in queries. Add an admin-only restore endpoint.

### 6.6 No structured logging
- **Files:** All backend services
- **Problem:** The backend uses `console.log` / `console.error` for output. In production, these are unstructured and hard to aggregate.
- **Fix:** Replace with a structured logger like `pino`. Log at appropriate levels (`info`, `warn`, `error`) with context fields (`requestId`, `staffId`, `operation`).

### 6.7 No automated tests
- **Problem:** The codebase has no unit tests, integration tests, or E2E tests. Regressions are caught only by manual testing.
- **Fix (phased):**
  - Unit: Test service logic (AppointmentService, PatientService) with Jest and mocked DB.
  - Integration: Test routes with a real test database using Supertest.
  - E2E: Key user flows (login → book appointment → cancel) with Playwright.

### 6.8 Patient portal missing basic profile editing
- **File:** `frontend/src/pages/patient/`
- **Problem:** Patients cannot update their own contact information (phone, address) through the portal.
- **Fix:** Add a "My Profile" page in the patient portal with a form to update non-medical personal details.

### 6.9 No image annotation or notes
- **File:** `frontend/src/pages/PatientDetails.tsx`
- **Problem:** Medical images can be uploaded but doctors cannot attach notes or annotations to individual images.
- **Fix:** Add a `notes` text field to the image record and an editable notes panel in the image viewer.

### 6.10 Session timeout interval too coarse
- **File:** `frontend/src/hooks/useSessionTimeout.ts`
- **Problem:** The check interval is 60 seconds. A user whose session expires at minute 30 might not be logged out until minute 31.
- **Fix:** Reduce check interval to 15–30 seconds for snappier logout enforcement.

---

## 7. Accessibility & UI

### 7.1 No keyboard navigation on modals
- **Files:** Modal components throughout the frontend
- **Problem:** Modals do not trap focus and do not restore focus to the trigger element on close. Screen readers and keyboard-only users cannot use them.
- **Fix:** Use a library like `@radix-ui/react-dialog` or implement focus trapping manually using `tabIndex` and `useEffect`.

### 7.2 Color alone used to convey status
- **Files:** Appointment status badges, notification indicators
- **Problem:** Status colors (green/red/yellow) have no accompanying text or icon for colorblind users.
- **Fix:** Add text labels or icons alongside all color-coded status indicators.

### 7.3 Missing ARIA labels on icon buttons
- **Files:** Buttons that render only an icon (cancel X, edit pencil, etc.)
- **Problem:** Icon-only buttons have no accessible name. Screen readers announce "button" with no context.
- **Fix:** Add `aria-label="Cancel appointment"` (or similar) to all icon-only buttons.

### 7.4 No loading state on form submission buttons
- **Files:** All form components
- **Problem:** Submitting a form shows no visual feedback. Users may click multiple times, creating duplicate requests.
- **Fix:** Disable the submit button and show a spinner while the mutation is in flight (`isLoading` from `useMutation`).

---

## 8. Configuration & DevOps

### 8.1 API URL silently falls back to localhost
- **File:** `frontend/src/api/client.ts`
- **Problem:** `const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`. In production, a missing env var causes silent misdirection to localhost with no warning.
- **Fix:** In production builds, throw or log a loud warning if `VITE_API_URL` is not set.

### 8.2 No environment-specific configuration files
- **Problem:** `.env` is used for both development and production. There is no `.env.production` or staging config.
- **Fix:** Use Vite's built-in `.env.production` support and separate backend env files per environment.

### 8.3 No CI/CD pipeline
- **Problem:** No GitHub Actions or similar pipeline to run lint, type-check, and tests on every PR.
- **Fix:** Add a `.github/workflows/ci.yml` that runs `tsc --noEmit`, `eslint`, and the test suite on every push to `main` and on PRs.

### 8.4 Upload directory not in .gitignore
- **File:** `backend/uploads/` (if present)
- **Problem:** The uploads directory for patient images may contain real medical data. It should never be committed to version control.
- **Fix:** Add `backend/uploads/*` and `!backend/uploads/.gitkeep` to `.gitignore`.

### 8.5 Database migrations not automated
- **Problem:** Schema migrations are run manually as ad-hoc scripts. There is no migration runner to track which migrations have been applied.
- **Fix:** Adopt a migration tool (e.g., `node-pg-migrate`, `Knex migrations`, or `Flyway`) so schema history is versioned and reproducible.

---

## Summary Table

| Category | Item Count | Max Priority |
|---|---|---|
| Critical Security | 0 | — |
| Data Integrity | 6 | High |
| Input Validation | 5 | High |
| Performance | 5 | Medium |
| Code Quality | 10 | Medium |
| Missing Features / UX | 10 | Medium |
| Accessibility | 4 | Medium |
| Configuration / DevOps | 5 | Low–Medium |
| **Total** | **45** | — |

---

## Recommended First Pass (Highest ROI)

1. **#2.1** — Fix the appointment double-booking race condition (DB unique constraint)
3. **#2.2** — Replace doctor-staff name join with a `staff_id` foreign key
4. **#2.3** — Await file deletion and handle failure
5. **#2.4** — Add past-date validation on appointment create/reschedule
6. **#5.8** — Add a React error boundary
8. **#4.1** — Add pagination to audit log queries
9. **#6.5** — Soft-delete pattern for patients and doctors
10. **#8.3** — Add a basic CI pipeline (type-check + lint)
