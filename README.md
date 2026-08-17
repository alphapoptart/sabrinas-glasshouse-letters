# Sabrina's Garden II: The Glasshouse Letters

A mobile-first browser game about restoring a living glasshouse estate. It combines persistent simulation, procedural botanical art, branching story choices, deterministic migrations, and offline-friendly local saves in a static web application.

[Play the published build](https://alphapoptart.github.io/sabrinas-glasshouse-letters/)

## Engineering highlights

- Persistent simulation spanning plants, habitats, inventory, quests, rooms, companions, and seasonal events
- 64-species procedural botanical collection with per-leaf growth, variegation, finishes, and grow paths
- Versioned save migration with raw pre-upgrade backups, dual localStorage/IndexedDB persistence, and file export/import
- Responsive, mobile-first interface with changing weather and day/night presentation
- Deterministic automated checks covering migrations, expansion systems, estate state, and sequel behavior
- Synthesized sound effects and generative greenhouse music
- Static deployment with no server dependency for normal play

## The Fernery chapter

The opening sequel chapter is a persistent 14-anchor room rather than a menu wrapper. Players diagnose damaged infrastructure, solve Irrigation Rescue, choose permanent climate tradeoffs, and arrange canonical plants and decor into one of two guilds. Joey, Salem, and Trace uncover stored evidence; Pollinator's Waltz prepares an exhibition; and the visitor record reflects the room the player actually built. Completing three contextual letters unlocks a saved choice between Sunstone Walk and the Moon Room.

## Major systems

- Estate and Collection modes backed by the same canonical plant, care, and save state
- Three-area estate navigation across the Outside Garden, Greenhouse, and Fernery
- Plant movement, climate profiles, habitat-fit feedback, and daily condensation
- Water, feed, health, light, pests, pots, soils, supplies, decor, and slot upgrades
- Rotating market, currencies, XP, levels, quests, achievements, and passive income
- Propagation, potting-up, cross-species grafting, and chimera outcomes
- Repeatable activities and companion-controlled adventures
- Garden Legacy, seasonal events, judged shows, photo journal, visitor book, and Secret Garden progression
- Gentle Mode by default so ordinary absence cannot kill plants

## Run locally

From the parent project:

```bash
python3 serve.py 4173
```

Then open <http://localhost:4173/sequel/>.

## Run the deterministic checks

```bash
node tests/migration.test.js
node tests/expansion.test.js
node tests/estate.test.js
node tests/sequel-v5.test.js
node tests/estate-areas.test.js
```

## Save-data design

The game autosaves to both `localStorage` and IndexedDB, requests persistent browser storage, and supports backup export and restore. Versioned migrations preserve a raw pre-upgrade backup. Save data remains on the player's device.

Cross-player one-time gifts are intentionally disabled in the static build. Secure redemption would require an authenticated owner endpoint and a database transaction that atomically marks an opaque gift token as redeemed.

## Skills demonstrated

JavaScript · browser storage · data migration · procedural graphics · stateful simulation · responsive UI · automated testing · accessibility-minded game design · GitHub Pages deployment
