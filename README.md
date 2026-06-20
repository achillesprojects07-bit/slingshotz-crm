SLINGSHOTZ CRM — B17.5 DEMO RESET BUTTON RESTORE

Purpose:
Restore the visible manager-only Reset Demo Data button in Users / Settings while preserving the working B17.4 Meetings Booked filter behavior and dock tile icon setup.

What changed:
1. Added visible Users / Settings → Reset Demo Data panel in DEMO mode.
2. Button is manager-only because Users / Settings is manager-only.
3. Reset still requires typed confirmation: RESET DEMO.
4. Reset calls backend resetDemoActivity with confirmToken=CONFIRM-RESET.
5. Backend version updated to 17.5.0.
6. Health Check now expects B17.5 backend.

What is preserved:
- B17.4 Meetings Booked stable filter rebuild
- Working date/status/agent meeting filters
- Direct Apply Filters / Refresh List handlers
- Meeting filters never alter stored meeting dates
- Dock tile icon files and manifest
- B17.2 bidding requirement workflow
- B17.1 audit safety patch
- B8.7 direct Save Call fix
- Branded HTML meeting email template
- Correct API_URL

Deployment checklist:
1. Replace GitHub index.html with Slingshotz_index_B17_5_DEMO_RESET_BUTTON_RESTORE.html.
2. Keep/upload the existing icon files, favicon.ico, and manifest.webmanifest beside index.html.
3. Replace Apps Script api.gs with api_build17_5_DEMO_RESET_BUTTON_RESTORE_COPY_PASTE.txt.
4. Do not add backup .gs files inside Apps Script.
5. Save Apps Script.
6. Deploy → Manage deployments → pencil/edit → New version → Deploy.
7. Hard refresh the CRM.
8. Confirm the app shows: B17.5 DEMO RESET BUTTON RESTORE.
9. In DEMO mode as manager, go to Users / Settings and confirm Reset Demo Data appears.

Safety note:
Reset Demo Data clears only DEMO working sheets. It does not clear COMPANY MASTER, USERS, or LIVE sheets.
