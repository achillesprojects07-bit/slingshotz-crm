SLINGSHOTZ CRM — B17.7 RETRY FLOW CLEANUP

Purpose:
Clean up Retry Call behavior so retry attempts do not behave like follow-ups.

What changed:
1. NO ANSWER and BUSY / TRY AGAIN are treated as Retry Calls only.
2. Retry calls no longer show or use Follow-Up Date in the Log Call modal.
3. If a date is accidentally sent for a retry result, the backend clears it before saving.
4. Retry attempts continue to count toward the 3-attempt cap.
5. After 3 retry attempts, the target moves to RETRY CAP REACHED / Review Company Details instead of asking for another follow-up date.

Preserved:
- B17.6 Daily Target follow-up sync
- Bid follow-ups due today/overdue appear in My Daily Target
- B17.5 Demo Reset button
- B17.4 stable Meetings Booked filters
- B17.2 Bidding Requirement workflow
- B8.7 direct Save Call fix
- Branded meeting email template
- Correct API_URL
- Dock tile icon setup

Upload checklist:
1. GitHub: replace index.html with B17.7 frontend.
2. GitHub: upload this README.
3. Keep existing icon files, manifest.webmanifest, and favicon.ico.
4. Apps Script: replace api.gs with B17.7 backend copy-paste.
5. Save Apps Script.
6. Deploy > Manage deployments > pencil/edit > New version > Deploy.
7. Hard refresh CRM.
8. Confirm UI shows B17.7 RETRY FLOW CLEANUP.

Important rule:
Do not keep backup .gs files active inside Apps Script. Store backups in GitHub or as TXT/ZIP files only.
