# DROP MACHINE B'S COMPLETED PHASE-1 WORK IN THIS FOLDER

Put the finished folder from Machine B here — the whole thing is fine, or just these parts:

    INBOX_MachineB_Phase1_COMPLETED/
        authored_OUTPUT/        <- required (the payload)
        corrected_OUTPUT/       <- if Machine B produced one (this wins over authored_OUTPUT)
        committee_OUTPUT/       <- the audit trail
        COMPLETION_NOTES.md     <- if present

Nesting is fine (e.g. `HANDOFF_MachineB_2026_07_18/authored_OUTPUT/...`) — the folders
will be found either way. Do not rename the JSON files.

Expected: 3,609 terms across 431 packets (mb0001 … mb0431).

## What happens next (Machine A does all of this)
1. Validate every returned term against the 3,609 assigned IDs — no extras, no missing, no altered `id`/`term`
2. Check field types (list fields must be JSON arrays) and that nothing outside `empty_fields` was written
3. Run the readability gate (plain_english must be grade <= 9)
4. Check the source-quality rule (no Wikipedia/forums/blogs as cited sources)
5. Confirm no placeholder text survived
6. Back up the affected rows, apply, checksum-verify every row, write a before/after changelog
