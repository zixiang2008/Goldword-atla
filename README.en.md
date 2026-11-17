# Goldword-atlas 🪙📖

[![Version](https://img.shields.io/badge/version-0.1-orange)](https://github.com/zixiang2008/Goldword-atla/releases)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Web%20%7C%20PWA-brightgreen)](#)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.6.2-blue)](#)

> **Every word you remember is a gold coin.**

Goldword-atlas is an **offline-first** English vocabulary app. It keeps the original GoldWord flip-card spaced-repetition flow and integrates the entire ["paper & ink" UI](https://github.com/H1DDENADM1N/word-atlas), a 7,298-headword dataset, original illustrations, and offline UK/US recordings from the open-source **Word Atlas (词光)** project. Words outside the dataset still fall back to the original GPT / OpenAI-compatible API enrichment.

**中文文档:** [README.md](README.md) · **Build guide:** [docs/BUILD.md](docs/BUILD.md) · **Disclaimer:** [docs/DISCLAIMER.md](docs/DISCLAIMER.md)

---

## ⚠️ Disclaimer (summary)

The interface design, dataset, illustrations and recordings in this project are **adapted from and bundled with the open-source project [Word Atlas (词光)](https://github.com/H1DDENADM1N/word-atlas)** (upstream: [designfuchen/word-atlas](https://github.com/designfuchen/word-atlas)).

- Word Atlas source code and UI design are **MIT licensed**; its dataset, illustrations and recordings are [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), attributed to **Word Atlas contributors (词光)**.
- This project is an independent integration, **not affiliated with or endorsed by** the Word Atlas maintainers, IELTS partners, or any voice provider.
- Bundled content was generated with AI models and automatically checked; it was **not proofread entry by entry and is provided as-is without warranty of accuracy**.
- GPT enrichment uses a user-supplied API key stored locally only; third-party model output is not warranted by this project.

**Read the full terms: [docs/DISCLAIMER.md](docs/DISCLAIMER.md) and [docs/ATTRIBUTION.md](docs/ATTRIBUTION.md).**

---

## Features

**From the original GoldWord app**
- Flip-card study flow: autoplay, countdown, flip, remember/forget, memory cycle and review queue.
- Pronunciation styles: UK/US accent, Chinese voice, speech rate, repeat count and sequence — grouped in a compact "Language Style" secondary menu.
- GPT fallback: OpenAI-compatible API fills in definitions and memory tips for headwords absent from the dataset. Keys stay on device and are never compiled into the APK.
- All progress, accounts and word lists are stored locally; the core experience works offline.

**From Word Atlas**
- "Paper & ink" visual system: warm cream background, serif headings, paper grain, terracotta/teal accents, light and dark themes.
- 7,298 headwords with CEFR levels A1–C2 and 19 topics, 7,298 illustrations plus thumbnails.
- 22,905 offline recordings: UK/US word pronunciation, everyday examples and IELTS-style examples.
- Atlas gallery with level/topic filters, Chinese/English search, detail sheet and one-tap add to study deck.
- Card back maps the full entry: senses, English definitions, examples and translations, collocations, word family, synonyms/antonyms, memory tips, level and topic tags.

## Quick start

```bash
git clone https://github.com/zixiang2008/Goldword-atla.git
cd Goldword-atla
npm install
bash scripts/fetch-atlas-assets.sh   # Windows: double-click scripts\fetch-atlas-assets.cmd
npx serve www                         # or: npx cap sync android && cd android && ./gradlew assembleRelease
```

The 726 MB asset set is **not committed** to this repository; the fetch script downloads and verifies it from the [official Word Atlas repository](https://github.com/H1DDENADM1N/word-atlas). See [docs/BUILD.md](docs/BUILD.md) for full build, signing, installation and troubleshooting instructions.

## Credits and licensing

| Content | Source | License |
| :--- | :--- | :--- |
| UI design, dataset, illustrations, recordings | [Word Atlas (词光)](https://github.com/H1DDENADM1N/word-atlas) | Code MIT / Content [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Original upstream | [designfuchen/word-atlas](https://github.com/designfuchen/word-atlas) | Same |
| Fraunces typeface | Bundled with Word Atlas | SIL Open Font License 1.1 |
| Card memory engine, GPT integration, account system | Original GoldWord project | Original work of this project |

Thanks to **Word Atlas contributors (词光)** for open-sourcing the dictionary, illustrations and recordings that make the fully offline word-card experience possible.

Full third-party license text, attribution, AI-content notes, recording scope and non-IELTS statement are in [docs/DISCLAIMER.md](docs/DISCLAIMER.md).
