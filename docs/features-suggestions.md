# Feature suggestions for Housing Ads

This file lists suggested features and microcopy for the "Features" step (Basic features and More details). Use these as content ideas, optional defaults, or to help choose icons and labels.

## Basic features (must-have / primary)

These are common amenities that users expect to see quickly. Keep these prominent and easy to toggle.

- Furnished — quick on/off; useful for search filters and price expectations.
- Elevator — show when building has elevator access (important for accessibility and higher floors).
- Private bathroom — clarifies whether bathroom is en-suite or shared.
- Kitchen equipped — indicates presence of cooking appliances and basic utensils.
- Balcony — outdoor private space (moved from More details into Basic features).

Notes / UX tips:

- Order items by how often they're searched in your marketplace (furnished, elevator, private bathroom usually top queries).
- Keep labels short and readable (2–3 words).
- Show prominent selected state for chips (color + subtle X icon to unselect).

## More details (secondary / optional)

Extra amenities and property specifics that often matter but are secondary in filtering.

- Wi‑Fi — indicate included or available (if included, consider a required field for speed/limit later).
- Washing machine — on-site washer/dryer in the unit.
- Dishwasher — presence of a dishwasher.
- Double-glazed windows — noise / thermal insulation selling point.
- Air conditioning — cooling system available.

Property specifics (structured inputs nearby):

- Floor number — use a compact counter control; allow negative floors (basement) if needed.
- Heating type — selectable list (e.g., Central, Radiator, Underfloor, Electric).

Notes / UX tips:

- Consider grouping "property specifics" (floor number, heating) separately from appliance-style features.
- Provide microcopy or tooltips for ambiguous items (e.g., "double-glazed: reduces noise and improves insulation").

## Advanced / optional features to consider later

These are useful for specific property types and power users.

- Parking (private / street) — consider sub-options.
- Pets allowed / Pet policy — allow small text for restriction notes.
- Accessible (wheelchair) — accessibility features.
- Storage / Basement — dedicated storage availability.
- Gardening / Shared outdoor areas — communal green space.
- Near public transit / Shops nearby — could be a linked toggle that opens a quick map to add items.

## Icon & label suggestions

- Use a consistent icon set and size across the form (e.g., Lucide or Feather) so UI feels cohesive.
- Prefer simple line icons for unselected state and filled/colored background for selected chips.
- Suggested mapping (example):
  - Furnished — sofa / couch icon
  - Elevator — arrow up / elevator outline
  - Private bathroom — bath / shower
  - Kitchen equipped — stove / utensils
  - Balcony — leaf / plant or balcony outline
  - Wi‑Fi — wifi signal
  - Washing machine — washer icon
  - Dishwasher — dish / plate or dishwasher icon
  - Double-glazed — window icon
  - Air conditioning — snowflake / AC icon

## Accessibility & keyboard

- Ensure chips are focusable and toggle with Enter / Space.
- Icons should have aria-hidden and the button should include aria-pressed.
- Counter buttons must be type="button" to avoid accidental form submits.

## Implementation notes

- Use the same SelectableChip component for all chips so behavior and a11y are consistent.
- Keep the property specifics (floor, heating) visually distinct (e.g., card with small form controls) from chips.
- Provide an inline "why this matters" tooltip for uncommon features.

---

If you'd like, I can now:

- Replace the emoji placeholders in `housing-create-dialog.tsx` with icon components from either `lucide-react` (already used in the codebase) or from `react-icons` (you previously mentioned). Tell me which pack you prefer and I'll make the change and run a typecheck.
- Or I can propose exact icon component names for the chosen pack first for your approval.
