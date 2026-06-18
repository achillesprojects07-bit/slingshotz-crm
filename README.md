SLINGSHOTZ CRM — B15 DATA SAFETY / BACKUP / DEPLOYMENT PROTECTION

Build number:
B15 DATA SAFETY / BACKUP / DEPLOYMENT PROTECTION

Backend version:
APP_VERSION = '15.0.0'

Base preserved:
B14 Users / Settings Manager Page
B13 Events Leads Upgrade
B12 Activity Log / Call History Upgrade
B11.1 Company Database Label Cleanup
B10 Agent Performance Dashboard
B9.1 Manager Dashboard Drilldown + Simplify
B8.8 Meeting Outcome Review
B8.7 Direct Save Call Fix
B8 retry cap rules
B7 follow-up rules
B6 Meetings Booked flow with PREPARING removed
B5 Bid import / auto-create
B4 Contact Cleanup
Beautiful branded HTML meeting email template
Correct API_URL

What changed in B15:
1. Visible app build updated to B15.
2. Users / Settings now includes Deployment Safety Check.
3. Backend now includes manager-only healthCheck / getBackendHealth route.
4. Health Check reports backend version, Company Master row count, active users, important sheets, and missing required routes.
5. Users / Settings now includes deployment protection rules.
6. README included in ZIP.
7. Explicit warning: do not keep backup .gs files active inside Apps Script.

Deployment checklist:
1. In GitHub, replace the live file named index.html with Slingshotz_index_B15_DATA_SAFETY_BACKUP_DEPLOYMENT_PROTECTION.html contents.
2. In Apps Script, replace active api.gs with api_build15_DATA_SAFETY_BACKUP_DEPLOYMENT_PROTECTION_COPY_PASTE.txt contents.
3. Do not add backup .gs files inside the Apps Script project.
4. Save Apps Script.
5. Deploy > Manage deployments > pencil/edit > Version: New version > Deploy.
6. Hard refresh the CRM.
7. Confirm the app shows B15 DATA SAFETY / BACKUP / DEPLOYMENT PROTECTION.
8. Go to Users / Settings > Deployment Safety Check > Run Health Check.
9. Confirm backend version is 15.0.0 and Company Master row count is visible.

Backup rule:
Backups must be stored as TXT, ZIP, GitHub history, or outside the active Apps Script project. Do not keep active backup .gs files in Apps Script because all .gs files run and can cause duplicate constants/functions or old code to override new code.
