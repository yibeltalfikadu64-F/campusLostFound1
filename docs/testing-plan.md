# Testing Plan: Injibara Campus Lost & Found

## 1. Overview
The testing strategy validates the integrity of business logic, state machines, permission boundaries, and mobile UI rendering across the system.

## 2. Test Pyramid
1. **Unit Tests (Backend & Mobile):**
   - Zod schema validation (date limits, phone numbers, UUIDs).
   - JWT generation, hash verification, password comparison.
   - Localization dictionary key consistency.
2. **Integration Tests (Backend):**
   - REST API endpoints using Supertest and Jest.
   - Authentication gates: 401 on missing tokens, 403 on role mismatch.
   - Claim conflict prevention and state transitions.
3. **Manual Scenarios (End-to-End):**
   - Full lifecycle test: register → report found item → feed display → claim submission → security review → approval → handover schedule → return confirmation.

## 3. Running Automated Checks
- Backend Tests: `npm --workspace=backend run test`
- Mobile Typecheck: `npm --workspace=mobile run typecheck`
- Backend Typecheck: `npm --workspace=backend run typecheck`
