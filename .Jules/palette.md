## 2025-04-12 - Missing ARIA labels in custom map popups and drawers
**Learning:** In custom map popups (e.g., `PopupShell` in `MonitorMap.tsx`) and drawers (`LiveVideoDrawer.tsx`), icon-only close buttons (like '✕' or '✖') frequently lack `aria-label` attributes. This breaks screen reader accessibility as the button purpose is not announced.
**Action:** Always add `aria-label="Close popup"` or `aria-label="Close panel"` to icon-only close buttons in custom popup shells and drawers to ensure screen reader accessibility.
