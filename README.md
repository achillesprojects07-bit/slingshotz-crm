SLINGSHOTZ CRM — B16 LIVE MODE / SECURITY POLISH

Build: B16 LIVE MODE / SECURITY POLISH
Backend version: 16.0.0
Base preserved from: B15 + all locked B8.8/B9.1/B10/B11/B12/B13/B14 features

WHAT CHANGED
1. DEMO vs LIVE mode is clearer in the UI.
2. LIVE/DEMO switch now requires manager access and typed confirmation.
3. Bulk Phone Cleanup requires manager access plus typed CLEANUP confirmation in the app.
4. Backend also requires CONFIRM-CLEANUP for bulk phone cleanup.
5. Demo reset requires manager access and typed RESET DEMO confirmation.
6. COMPANY MASTER protection is stated clearly in health/security checks.
7. Users / Settings includes Live Mode / Security Protection notes.
8. Health Check now expects backend version 16.x.

PRESERVED
- B15 Deployment Safety / Health Check
- B14 Users / Settings Manager Page
- B13 Events Leads Upgrade
- B12 Activity Log / Call History Upgrade
- B11.1 Company Database label cleanup
- B10 Agent Performance Dashboard
- B9.1 Manager Dashboard drilldown
- B8.8 Meeting Outcome Review
- B8.7 direct Save Call fix
- B8 retry cap rules
- B7 follow-up rules
- B6 Meetings Booked flow
- B5 Bid import / auto-create
- B4 Contact Cleanup
- Branded HTML meeting email template
- Correct API_URL

DEPLOYMENT CHECKLIST
1. GitHub: replace index.html with Slingshotz_index_B16_LIVE_MODE_SECURITY_POLISH.html
2. GitHub: keep this README beside index.html.
3. Apps Script: replace only api.gs with api_build16_LIVE_MODE_SECURITY_POLISH_COPY_PASTE.txt content.
4. Do not add backup .gs files inside Apps Script.
5. Save Apps Script.
6. Deploy > Manage deployments > Edit pencil > New version > Deploy.
7. Hard refresh CRM.
8. Confirm UI shows B16 LIVE MODE / SECURITY POLISH.
9. Go to Users / Settings > Run Health Check.
10. Confirm backend version is 16.0.0.

IMPORTANT
Backups must stay outside active Apps Script, as TXT/ZIP/GitHub files. Apps Script should only have active api.gs unless intentionally modularized.
