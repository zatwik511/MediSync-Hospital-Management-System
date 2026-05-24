# Suggested Improvements — MediSync HMS

This file captures all identified issues, technical debt, and improvement opportunities across the codebase. Items are grouped by category and ordered by priority within each section.

---

## 1. Critical Security Issues

---

## 2. Data Integrity

---

## 3. Input Validation & Sanitization

---

## 4. Performance

---

## 5. Code Quality & Maintainability

---

## 6. Missing Features & UX Gaps

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
| Data Integrity | 0 | — |
| Input Validation | 0 | — |
| Performance | 0 | — |
| Code Quality | 0 | — |
| Missing Features / UX | 7 | Medium |
| Accessibility | 4 | Medium |
| Configuration / DevOps | 5 | Low–Medium |
| **Total** | **16** | — |

---

## Recommended First Pass (Highest ROI)

1. **#5.8** — Add a React error boundary
2. **#6.5** — Soft-delete pattern for patients and doctors
3. **#8.3** — Add a basic CI pipeline (type-check + lint)
