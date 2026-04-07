## PALETTE'S JOURNAL

## 2025-04-07 - Add ARIA Labels to Close Buttons in Map/Drawers

**Learning:** Found multiple custom popups and drawers (like `MonitorMap`'s `PopupShell` and `LiveVideoDrawer`) using `✕` or `✖` as a close button icon without any screen reader-friendly text. This violates the a11y rule for icon-only close buttons.
**Action:** Always ensure any close buttons consisting purely of a cross symbol (e.g. `✕`) have a descriptive `aria-label` like "Close popup" or "Close drawer".
