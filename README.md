# Sabrina’s Garden II: The Glasshouse Letters

A full mobile-first sequel built on the complete original game engine, with a scene-first living garden and a playable estate-restoration story.

## Fernery chapter

The opening sequel chapter is a persistent 14-anchor room, not a menu wrapper. Diagnose a broken pane, dry bench and blocked drain; solve Irrigation Rescue; choose permanent infrastructure with different climate tradeoffs; and arrange canonical plants and decor into either a fern-understory or Sunstone dry guild. Joey, Salem and Trace uncover stored evidence, Pollinator's Waltz prepares a 3–5 plant exhibition, and a visitor record is written from the room the player actually built. Completing the three contextual letters opens a saved choice between Sunstone Walk and the Moon Room as the next estate shell.

## Included systems

- prominent Estate and Collection garden modes backed by the same canonical plants, care state and save
- a three-area Estate navigator with a weathered Outside Garden, climate-controlled working Greenhouse, and the story-driven Fernery
- persistent plant movement between outside and greenhouse, three free greenhouse climate profiles, visible habitat-fit feedback, and a gentle daily condensation round
- distinct Moonrose presentation for Princess Sabrina and Sunstone presentation for Prince Sean, with equal affinity bonuses and starter spaces
- every owned garden furnishing automatically arranged in the living estate while retaining its original slot, laboratory, income or cosiness effect
- 64-species procedural botanical collection with per-leaf growth, variegation, finishes and grow paths
- 18-species Sunstone Almanac spanning columnar, globular, jointed, trailing and rosette desert forms, with four claimable collection milestones
- independent water, feed, health, light, pests, pots, soils, supplies, decor and slot upgrades
- rotating plant market, coins, gems, XP, levels, quests, achievements and passive stall income
- timed propagation, potting-up, cross-species grafting and chimera outcomes
- Perfect Pour, Bug Blitz and Leaf Match repeatable activities with tickets and rewards, the Fernery-integrated Irrigation Rescue and Pollinator's Waltz, and three pet-controlled adventures for Joey, Salem and Trace
- synthesized sound effects and generative greenhouse music
- immediate dual localStorage/IndexedDB autosaves, versioned estate migration with a pre-upgrade raw backup, persistence request, file backup/restore and shareable garden visits
- living garden scene with paged garden beds, changing weather and day/night atmosphere, Princess Sabrina or Prince Sean, Sunstone Cactus Walk, Joey, Salem and Trace
- Garden Legacy, four rotating seasonal events with real challenges, five-category judged plant shows, daily companion moments, personality requests, photo journal, visitor book, surprise seeds, room-by-room glasshouse mechanics and Secret Garden progression
- Gentle Mode permanently defaulted on: ordinary absence cannot kill plants

Run locally from the parent project with `python3 serve.py 4173`, then open `http://localhost:4173/sequel/`.

Run the deterministic checks from this directory:

```sh
node tests/migration.test.js
node tests/expansion.test.js
node tests/estate.test.js
node tests/sequel-v5.test.js
node tests/estate-areas.test.js
```

The sequel is also published separately at <https://alphapoptart.github.io/sabrinas-glasshouse-letters/>. Save data stays on the device; use the Royal screen’s backup export when moving between devices.

Cross-player one-time gifts are intentionally not enabled in the static build. Secure redemption requires an authenticated owner endpoint and a database transaction that atomically marks an opaque gift token as redeemed. Local drafts are not public codes and cannot be redeemed until that service exists.
