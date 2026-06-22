SLINGSHOTZ CRM — B17.8 BID + MEETING FOLLOW-UP LOGIC

This build starts from B17.7 and preserves the working B17.4 Meetings Booked filters, B17.6 Daily Target follow-up sync, B17.7 retry cleanup, B17.5 reset demo, dock tile files, API URL, and all prior stable behavior.

What changed:
1. BIDDING REQUIREMENT creates Bid Pipeline + owner follow-up.
2. PROJECT BRIEFING MEETING SET creates Meetings Booked + Bid Pipeline.
3. COMPANY PROFILE MEETING SET remains Meetings Booked, and meeting follow-ups are handled through the meeting next action date.
4. SUBMITTED bids require a Next Follow-Up Date.
5. NO DECISION keeps the stage name, but now requires a reason and next step.
6. NO DECISION reasons: Client paused the project; Client has no update; Client said they will decide later; No final answer after follow-up.
7. NO DECISION next step can be Follow up again later, Long-term follow-up, or Parked - no active follow-up.
8. Long-Term Follow-Up is any follow-up dated 30+ days from today. It stays in My Follow-Ups and appears in My Daily Target only when due/overdue.
9. Added NO REQUIREMENT FOR NOW for clients with no current requirement but future follow-up.
10. QUALIFYING was NOT renamed.

Upload steps:
1. GitHub: replace index.html with the B17.8 frontend file.
2. GitHub: upload this README. Keep existing icon files / manifest / favicon.
3. Apps Script: replace api.gs with the B17.8 backend copy-paste file.
4. Save Apps Script.
5. Deploy > Manage deployments > pencil/edit > New version > Deploy.
6. Hard refresh the CRM.
7. Confirm the app shows B17.8 BID + MEETING FOLLOW-UP LOGIC.
