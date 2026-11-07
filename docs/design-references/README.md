# DEX_Cal selected portrait design references

These are **static planning references**, not deployed application screens, verified event data or approved Dexter character art. They were converted from supplied/generated PNG screenshots into compact WebP for inclusion in the public documentation. The original PNGs remain in the originating conversation, outside this repository.

| Image | Status | Intended implementation use |
|---|---|---|
| [selected-phone-portrait.webp](selected-phone-portrait.webp) | **User-selected master** | Phone portrait, dark charcoal left rail, turquoise-framed white calendar, type and schedule band language. |
| [day-ruled-hours.webp](day-ruled-hours.webp) | Requested Day mockup | Straight hour rules, vertical day schedule with accurate event duration. |
| [week-seven-columns.webp](week-seven-columns.webp) | Requested Week mockup | Seven columns and shared hour lines, compact mobile event affordances. |
| [month-ruled-cells.webp](month-ruled-cells.webp) | Requested Month mockup | True 7-column month grid and subtle ruled-date cell style. |

## Correct the mockups' artifacts in production

- `Monday Nov 10` is a sample date consistent with **2025**, not 2026. Use the actual dynamic calendar date at runtime.
- Purple = **both Andrew and Greyson scheduled away simultaneously**; any illustrated purple `Both Home` is invalid. Home without an away event is an assumption, not an event.
- The sample blocks are **fictional**. The fact that they appear in artwork is not approval to preload real appointments or publish private records.
- Month cells do not have enough room for 24 real hourly lines; their delicate internal rules are decorative. Real time mapping is provided in Day and Week and in details sheets.
- Straight, uniform lines only: no intentional wavy sketch styling.
- Screenshots are aesthetic references, not screenshots of a running implementation. Compare future coded output at real phone viewport widths, with tap/scroll/pinch and accessible fallbacks verified separately.
- If any image contains a generic dog depiction, it is not Dexter's approved likeness and must not be extracted as a runtime asset.

**Executable full build contract:** [DEX_CAL_IMPLEMENTATION_HANDOFF.md](../DEX_CAL_IMPLEMENTATION_HANDOFF.md)
