SLINGSHOTZ CRM — B17.4 Dock Tile Icon Add-On

Purpose:
Adds a distinct Slingshotz CRM tile/icon for browser bookmarks, mobile home screen, and desktop dock shortcuts.

Important:
This does not change CRM logic. It preserves the working B17.4 Meetings Booked behavior.

Files to upload to GitHub root, beside index.html:
- index.html  (use Slingshotz_index_B17_4_WITH_DOCK_TILE_ICON.html as the replacement content/file)
- favicon.ico
- slingshotz-tile-16.png
- slingshotz-tile-32.png
- slingshotz-tile-48.png
- slingshotz-tile-64.png
- slingshotz-tile-128.png
- slingshotz-tile-180.png
- slingshotz-tile-192.png
- slingshotz-tile-256.png
- slingshotz-tile-512.png
- manifest.webmanifest

Apps Script:
No backend change is needed. Do not touch api.gs for this icon update.

After upload:
1. Commit the files in GitHub.
2. Hard refresh the CRM.
3. Remove the old dock/home-screen shortcut if it already exists.
4. Add the app shortcut again so the device picks up the new icon.

Current CRM build preserved:
B17.4 MEETINGS BOOKED STABLE FILTER REBUILD
