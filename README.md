SLINGSHOTZ CRM — B17.4 MEETINGS BOOKED STABLE FILTER REBUILD

Purpose:
Fix Meetings Booked behavior after B17.2/B17.3 filter issues.

Changes:
- Rebuilt Meetings Booked filter UI as a real form with direct submit/click handlers.
- Apply Filters and Refresh List now reload the filtered list.
- Status dropdown auto-applies.
- Status cards keep current date and agent filters.
- The meeting list now appears immediately after the filter summary, before status cards, so the user does not need to scroll through cards first.
- Meeting date filters use MEETING DATE only. They do not alter meeting records and do not fall back to Created At.
- Added user-facing note: filters only change what is shown; they never change stored meeting dates.

Preserved:
- B17.2 workflow rules including BIDDING REQUIREMENT = Bid Pipeline + owner follow-up action.
- Import Old Meeting Calls remains manager-only/admin-only.
- B17.1 audit safety patch.
- B17 UX polish, B16 security, B15 health check, B14 Users/Settings, B13 Events Leads, B12 Activity Log, B11 Company Database, B10 Agent Performance, B9.1 dashboard, B8.8 meetings outcome review, B8.7 direct Save Call, branded email template, correct API_URL.

Deployment:
1. Replace GitHub index.html with the B17.4 frontend.
2. Replace Apps Script api.gs with the B17.4 backend copy-paste text.
3. Do not keep backup .gs files inside Apps Script.
4. Save Apps Script.
5. Deploy > Manage deployments > Edit pencil > New version > Deploy.
6. Hard refresh CRM.
7. Confirm the app shows B17.4 MEETINGS BOOKED STABLE FILTER REBUILD.
