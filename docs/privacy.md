# Privacy & Data Policy: Injibara Campus Lost & Found

## 1. Information Collected
Injibara University Campus Lost & Found collects institutional identification and personal contact data solely for verifying and recovering lost property:
- **Full Legal Name:** Used for identity verification during handovers.
- **University / Student ID:** Ensures all participants are legitimate members of Injibara University.
- **Phone Number:** Facilitates urgent contact once ownership of valuable items has been verified.
- **Photos & Item Details:** Descriptions and images used to locate and identify misplaced property.

---

## 2. Protection of Sensitive Ownership Evidence
- **Secret Verification Details:** For found items, finders provide secret verification details (such as passcode hints, internal contents, or hidden markings). These details are **never published on public item feeds** or returned via public APIs.
- **Restricted Access:** Only the item reporter and verified campus security officers holding `ADMIN` or `SECURITY_OFFICER` roles can view private verification details and claimant answers.

---

## 3. Data Retention & Handover Logs
- When an item is handed over to its owner, the event is permanently recorded in an immutable `StatusHistory` and `AuditLog` table with reviewer ID, timestamp, and handover notes.
- Users may request account deactivation through campus security administration.
