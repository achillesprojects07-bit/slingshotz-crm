SLINGSHOTZ CRM — B17.1 AUDIT SAFETY PATCH

Build: B17.1 AUDIT SAFETY PATCH
Frontend file: Slingshotz_index_B17_1_AUDIT_SAFETY_PATCH.html
Backend file: api_build17_1_AUDIT_SAFETY_PATCH_COPY_PASTE.txt / api_build17_1_AUDIT_SAFETY_PATCH.gs
Base preserved: B17 FINAL UX POLISH + all prior protected features

PURPOSE
This build addresses the audit findings except the two items the owner explicitly confirmed as intentional:
- Upsert Company access for authenticated users is intentional.
- CONTACT PERSON NOT AVAILABLE as follow-up/nurture, not retry-cap, is intentional.

FIXED IN B17.1
1. seedUsers_ now writes DAILY TARGET = 40 into the USERS seed rows.
2. Health Check now checks EVENT MASTER, not a non-existent EVENT LEADS sheet.
3. Frontend phone cleanup now sends confirmToken: CONFIRM-CLEANUP.
4. verifyUser_ no longer blocks all normal session routes because of lockout; lockout remains enforced at login and manager-only actions.
5. DAILY_TARGET is now 40 to match per-user daily target defaults.
6. Added setupDailySummaryTrigger() so the DAILY SUMMARY refresh trigger can be created properly.
7. Demo Reset now also clears DEMO BID PIPELINE and DEMO MEETING PIPELINE.
8. Company edit/add now clears the phoneMap cache after phone/contact changes.
9. importBiddingRequirements is now manager-only.
10. DAILY SUMMARY remains one shared sheet with a MODE column by design. Managers should filter by DEMO/LIVE.

PRESERVED
- B17 Final UX Polish
- B16 Live Mode / Security Polish
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
1. GitHub: replace index.html with the B17.1 frontend file.
2. GitHub: upload this README beside index.html.
3. Apps Script: replace only api.gs with the B17.1 backend copy-paste file.
4. Do not keep backup .gs files inside Apps Script.
5. Apps Script: Save.
6. Deploy > Manage deployments > pencil/edit > New version > Deploy.
7. Hard refresh the CRM.
8. Confirm the UI shows: B17.1 AUDIT SAFETY PATCH.
9. Users / Settings > Deployment Safety Check > Run Health Check.
10. Optional: Run setupDailySummaryTrigger once in Apps Script if DAILY SUMMARY auto-refresh is needed.
