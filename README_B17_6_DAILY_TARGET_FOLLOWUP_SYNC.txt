SLINGSHOTZ CRM — B17.6 DAILY TARGET FOLLOW-UP SYNC

Purpose:
Make My Daily Target the agent's real daily work queue.

What changed:
1. My Daily Target now includes fresh targets from DAILY ACTION LIST.
2. My Daily Target now includes retry calls due for NO ANSWER / BUSY.
3. My Daily Target now includes owner-only follow-ups due today or overdue from CALL LOG.
4. BIDDING REQUIREMENT follow-ups appear as BID FOLLOW-UP in My Daily Target when due.
5. Bid follow-ups stay connected to Bid Pipeline and include a Bid Pipeline action button.
6. If the same company is both a fresh target and a due follow-up, the due follow-up appears once so the list is not cluttered.

Preserved:
- B17.5 Demo Reset Button Restore
- B17.4 working Meetings Booked stable filters
- B17.2 BIDDING REQUIREMENT = Bid Pipeline + owner follow-up
- B17.1 audit safety patch
- B16 live/security polish
- B15 health check
- B14 users/settings
- B13 events leads
- B12 activity log/call history
- B11.1 company database label cleanup
- B10 agent performance
- B9.1 manager dashboard
- B8.8 meeting outcome review
- B8.7 direct Save Call fix
- branded HTML meeting email template
- correct API_URL

Upload instructions:
1. GitHub index.html = B17.6 frontend.
2. GitHub README = this README.
3. Apps Script api.gs = B17.6 backend copy-paste.
4. Do not add backup .gs files inside Apps Script.
5. Save Apps Script.
6. Deploy → Manage deployments → pencil/edit → New version → Deploy.
7. Hard refresh the CRM.
8. Confirm the app shows B17.6 DAILY TARGET FOLLOW-UP SYNC.

Test:
1. In DEMO, log BIDDING REQUIREMENT with today's follow-up date or no follow-up date.
2. Confirm it appears in Bid Pipeline.
3. Confirm it appears in My Follow-Ups.
4. Confirm it appears in My Daily Target as BID FOLLOW-UP when due today/overdue.
5. Confirm it does not appear as a normal 0/3 cold-call target.
