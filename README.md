SLINGSHOTZ CRM — B17.3 MEETINGS FILTER CLICK FIX

BUILD NUMBER
B17.3 MEETINGS FILTER CLICK FIX

PURPOSE
Fix the Meetings Booked filter UX after B17.2:
- Apply Filters button must be clickable and visibly work.
- Refresh List must reload the filtered meeting list.
- Status/card clicks must keep the current date and agent filters.
- Clicking filters/cards should move the user down to the meeting list so they do not need to scroll manually.

FILES
1. Slingshotz_index_B17_3_MEETINGS_FILTER_CLICK_FIX.html
   - Rename/paste as GitHub index.html.
2. api_build17_3_MEETINGS_FILTER_CLICK_FIX_COPY_PASTE.txt
   - Paste into Apps Script api.gs.
3. api_build17_3_MEETINGS_FILTER_CLICK_FIX.gs
   - Backup copy only. Do not add as extra .gs file in Apps Script.

PRESERVED FROM B17.2 / B17.1 / B17
- BIDDING REQUIREMENT = Bid Pipeline + owner follow-up action.
- BIDDING REQUIREMENT should not remain as ordinary 0/3 cold-call target.
- Import Old Meeting Calls remains manager-only/admin-only.
- B17.1 audit safety patch.
- B16 security polish.
- B15 health check.
- B14 users/settings.
- B13 events leads.
- B12 activity log/call history.
- B11.1 company database label cleanup.
- B10 agent performance dashboard.
- B9.1 manager dashboard drilldown.
- B8.8 meeting outcome review.
- B8.7 direct Save Call fix.
- Branded HTML meeting email template.
- Correct API_URL.

DEPLOYMENT CHECKLIST
1. In GitHub, replace the live index.html with Slingshotz_index_B17_3_MEETINGS_FILTER_CLICK_FIX.html.
2. In GitHub, upload this README.
3. In Apps Script, replace only api.gs with api_build17_3_MEETINGS_FILTER_CLICK_FIX_COPY_PASTE.txt.
4. Do not add backup .gs files inside Apps Script.
5. Save Apps Script.
6. Deploy > Manage deployments > pencil/edit > Version: New version > Deploy.
7. Hard refresh the CRM.
8. Confirm the UI shows: B17.3 MEETINGS FILTER CLICK FIX.
9. Test Meetings Booked:
   - Select a date range.
   - Click Apply Filters.
   - Confirm the list updates and scrolls into view.
   - Click a status card.
   - Confirm the same date/agent filters remain and the list scrolls into view.
