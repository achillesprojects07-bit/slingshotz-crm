# Phase 3 Audit

**PASS — real-device audio QA pending**

Static checks passed for:
- Greek speech module
- recording module
- playback/retry
- self-rating
- speaking progress metadata
- safe cleanup
- no service worker

Manual GitHub Pages test:
1. Hear Greek.
2. Record Me and grant microphone permission.
3. Stop.
4. Play your recording.
5. Hear Greek again.
6. Record again.
7. Save a self-rating.
8. Move to another item and repeat.
