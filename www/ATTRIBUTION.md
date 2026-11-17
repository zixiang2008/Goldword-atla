# Content Attribution / 内容署名

This application bundles the open dictionary, illustrations, and audio recordings
from **Word Atlas (词光)** under the **Creative Commons Attribution 4.0 International
License (CC BY 4.0)**.

- Project: https://github.com/H1DDENADM1N/word-atlas
- Upstream original: https://github.com/designfuchen/word-atlas
- Content: 7,298 headwords, original field-guide illustrations, example sentences,
  UK/US word recordings and example-sentence recordings.
- License: CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
- Attribution: **Word Atlas contributors (词光)**

Bundled assets live under `atlas/` (index.json, entries/, img/, thumb/, audio/),
`brand/`, and `sfx/` (seven looping ambience tracks and short UI cues), and are
used with the design system adapted into `atlas.css` / `wordatlas.js` / `ambience.js`.

The GoldWord application code, spaced-repetition logic, GPT integration, user
accounts and settings remain the original work of the GoldWord project.

Changes made: the Word Atlas design tokens were adapted to GoldWord's card-flip
study flow; atlas content is mapped into GoldWord's original front/back card
layout; offline atlas audio was added as a pronunciation source with the original
TTS/GPT pipeline retained as fallback.
