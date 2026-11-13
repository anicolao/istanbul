# Istanbul UX design principles

Players should interact with the bazaar and its pieces, not manage a web form. These principles adapt the sibling game standards while retaining Istanbul's approved direct-manipulation flow.

- **Use the components that ship.** The gallery and lab provide fixtures and playback controls to production renderers, never parallel mock interfaces. Game authority stays in the existing rules/projection layer.
- **Make the object the control.** Tap a destination, actual Bonus card, resource well or mosque power. Keep the same identity and live state through zoom, rotation, selection and return. Avoid substituting card titles, dropdowns or detached action menus for components.
- **Act directly, then offer Undo.** Do automatic destination effects without another button. Keep Undo near the affected room and preserve full state restoration. Do not confirm routine reversible choices. Preserve deliberate rolls/draws and the existing warnings for intentionally skipping a meaningful destination, visitor or repeat-card opportunity.
- **Keep the overview useful.** Room expansion provides precision and detail; it must not be the sole way to compare ordinary destination choices. Recompose for devices instead of assuming a scaled desktop is readable.
- **Complete the input journey.** Keyboard activation enters the expanded room; Back or Escape restores the same board tile. Maintain visible object focus. Do not steal focus from pointer users or a different player's action. Reduced motion preserves identity and outcomes and also applies to drawer scrolling.
- **Help only when requested.** Keep help opt-in. Explain owner, location, live quantity, source and relevant rule rather than repeating a symbol name. Tapping an icon inside a live component must retain its enclosing context. Help must not spend resources or activate the underlying piece; Escape leaves help before closing the room.
- **Keep explanations readable and nearby.** Fit help to its actual content and viewport, permit keyboard scrolling, and retain it until dismissed or replaced. Use concise player-facing language. Do not expose implementation state or viewing-angle labels.
- **Preserve meaningful state and privacy.** Do not invent targeting/confirmation phases to satisfy a checklist. Keep existing direct choices, opponent information boundaries, animation anchors, cards and undo identity intact.
- **Separate motion from pace.** Reduced motion is not a substitute for reviewing outcomes. Retain the game log after transient flights. Any future automatic-play pacing control must preserve the current decision and make pause/review discoverable.

Before shipping, exercise direct action, complete Undo, rejected choices, relevant skip warnings, help, keyboard return and reduced motion. Review the real shared components at actual sizes, and report missing hardware/recognition checks honestly. See [VISUAL_DESIGN.md](VISUAL_DESIGN.md) for the visual standard.
