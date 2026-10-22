# Manual Test Cases Matrix: Injibara Campus Lost & Found

| Test ID | Module | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-01 | Registration | App open on Welcome screen | 1. Click "Create Account"<br>2. Enter name, valid phone, password & confirm<br>3. Provide university ID | Account created; JWT tokens saved in SecureStore; navigated to Home screen | Verified |
| TC-02 | Login | Registered user | 1. Enter email/ID and correct password<br>2. Tap "Log In" | Session initialized; profile retrieved; Home feed displayed | Verified |
| TC-03 | Login Failure | Registered user | 1. Enter valid email with wrong password<br>2. Tap "Log In" | Friendly error message displayed; credentials rejected; no crash | Verified |
| TC-04 | Report Found Item | Authenticated user | 1. Tap Report tab<br>2. Select "FOUND"<br>3. Fill title, select Central Library, description, enter secret detail<br>4. Submit | Report saved to DB; appears on Home feed; secret detail excluded from public view | Verified |
| TC-05 | Search & Filter | Active reports exist | 1. Tap Search tab<br>2. Type "Samsung"<br>3. Toggle "FOUND"<br>4. Tap Central Library chip | Filtered live results update; non-matching items hidden | Verified |
| TC-06 | Submit Claim | User is NOT the reporter | 1. Open found item details<br>2. Tap "Claim This Item"<br>3. Fill ownership proof & clue answers<br>4. Submit | Claim saved; item status becomes `CLAIM_PENDING`; reporter notified | Verified |
| TC-07 | Prevent Self-Claim | User IS the reporter | 1. Open own reported item details | "Claim This Item" button is hidden; only edit/remove actions visible | Verified |
| TC-08 | Admin Review | User has role `ADMIN` or `SECURITY_OFFICER` | 1. Open Admin tab<br>2. Navigate to Claims Queue<br>3. Tap "Approve" on pending claim | Item marked `APPROVED`; conflicting claims rejected; claimant notified | Verified |
| TC-09 | Schedule Handover | Approved claim | 1. Tap "Schedule Handover"<br>2. Specify campus location (Security Office #102)<br>3. Confirm | Claim marked `HANDOVER_SCHEDULED`; claimant receives collection alert | Verified |
| TC-10 | Confirm Return | Scheduled handover | 1. Tap "Confirm Handover Completed" | Item and Claim status become `RETURNED`; audit log recorded | Verified |
| TC-11 | Offline Handling | Device disconnected | 1. Enable Airplane mode<br>2. Launch app | Red offline banner displays at top; app does not crash; shows cached items | Verified |
| TC-12 | Language Toggle | Any screen | 1. Open Profile tab<br>2. Tap "አማርኛ" | All headers, tabs, buttons switch to Amharic instantly; preference saved | Verified |
