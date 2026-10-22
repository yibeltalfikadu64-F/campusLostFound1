# Bug Log & Quality Tracking: Injibara Campus Lost & Found

## Resolved Issues

### BUG-001: Windows PowerShell npm.ps1 Security Policy Block
- **Severity:** Medium (Local development environment blocker)
- **Description:** Running `npm` on Windows PowerShell failed because execution of `.ps1` scripts was restricted by system execution policy.
- **Resolution:** Used `npm.cmd` directly for commands and ensured scripts run cleanly via standard command wrappers.

### BUG-002: Accidental Secret Detail Exposure in Public Queries
- **Severity:** High (Security & privacy leak)
- **Description:** If `item.service.ts` included all fields in `listItems`, `hiddenDetail` would be exposed over public REST responses, allowing fraudulent claimants to guess the secret clue.
- **Resolution:** Explicitly tailored `prisma.item.findMany` select projections in `listItems` to exclude `hiddenDetail`. In `getItemById`, conditionally strip `hiddenDetail` unless the requester is the item's reporter or an authorized security officer.

### BUG-003: Claimant Self-Approval Vulnerability
- **Severity:** Critical (State machine integrity)
- **Description:** A security officer who claimed an item could theoretically approve their own claim.
- **Resolution:** Added explicit guard check in `claim.service.ts`: `if (claim.claimantId === reviewer.id) throw new ForbiddenError('A reviewer cannot approve their own claim')`.
