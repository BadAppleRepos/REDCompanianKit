# Intro
Hi this was created with the intention of just a few friends and I using it as a first time Cyberpunk RED player. Not intended as a commercial product. It is more a rough prototype or a proof of concept rather than an End-To-End App.

# RED Kit

*A companion app for use with Cyberpunk RED.*

An installable web app (PWA) for use with Cyberpunk RED. It runs on Windows, iPhone and Android from the same code, works offline, and keeps all data on the device.

## Features

**Character builder**
- Handle, role and role ability rank, all 10 stats, and every core skill grouped by category. Includes the basic-skill minimums, x2 skill costs and custom skills (languages, Local Expert, Martial Arts forms…).
- Optional *Complete Package* checks: 62 stat points (2–8 each) and 86 skill points (max 6).
- Derived values update as you edit: HP, Seriously Wounded, Death Save, Humanity, current EMP and armor SP.
- **Ripperdoc view** for cyberware, styled after the video game's cyberware screen. A body scan sits in the middle with body systems around it. Slot tiles are color-coded by Humanity cost, and the Humanity bar is drawn as EMP blocks. Tap a slot to open a shop panel with a full description, effects, cost, Humanity Loss and slot use for each piece. You can pay from your eurobucks and replace or remove chrome, and pieces that can't be combined are blocked. Toggle to the **List / dropdowns** view any time.
- **Cyberware by body part, picked from dropdowns**: neuralware, chipware, each eye, ears, each arm, each leg, internal, external, fashionware and borgware. A foundation (Neural Link, Cybereye, Cyberarm…) unlocks its option slots. Slot use is tracked, and options that don't fit are greyed out. Humanity Loss uses the average by default; you can roll it (🎲) or type your own number. A **Custom…** entry is available everywhere.
- Weapons, armor (with SP ablation), gear, money, IP, reputation, lifepath and notes.
- **Prices:** weapons and armor show their core-rulebook base price (standard quality) when you pick them, with an editable Cost for better, worse or second-hand gear. The Gear tab totals weapons, armor and cyberware, and an optional "pay from eurobucks" setting deducts purchases automatically. Older saves get base prices filled in for standard items.
- **Export**: a `.json` character file (re-importable on any device), Print / Save as PDF, plain text, or copy to clipboard.

**Rolling from the character sheet (Play tab)**
- Characters open on a table-ready **Play** tab. Tap a stat, skill or weapon to roll it. Checks are STAT + Skill + 1d10, where a 10 rolls again and adds and a 1 rolls again and subtracts.
- Weapons have **Hit** and **Damage** buttons. Two or more 6s on damage is flagged as a Critical Injury. Guns track ammo and have a Reload button, and Autofire weapons get an Autofire roll that uses 10 rounds. Brawling damage is set by BODY.
- **Initiative** includes Kerenzikov. **Death Save** tracks the rising penalty while Mortally Wounded.
- Damage/Heal buttons adjust HP. Armor SP can be worn down 1 point at a time.
- Penalties apply automatically: Seriously Wounded −2 (cancelled by a Pain Editor), Mortally Wounded −4, and heavy-armor penalties on REF and DEX.
- The floating **🎲 dice tray** shows each result with its math and has a situational modifier and roll history.
- If the character is in the combat tracker, initiative updates their spot, HP stays in sync, and every roll appears in the GM's combat log.

**Homebrew cyberware (GM)**
- The **Homebrew** page lets the GM design custom chrome. Each piece has a name, description, effect tags, cost, Humanity Loss (average and dice), slots used, playstyle, and the slot types it fits in (one or more).
- Optional **roll bonuses**: initiative, armor SP, stat bonuses and skill bonuses. These are added to Play-tab rolls (with the source named in the breakdown) and to combat-tracker initiative.
- Homebrew pieces appear marked with ★ in every character's Ripperdoc and dropdowns. A live preview shows how players will see them.
- **Sharing:** *Export library* (or ⇩ for a single piece) and players *Import* the file. Each installed piece also stores a copy inside the character, so an exported character works on any device. Importing that character adds the piece to the importing device's library.

**Edgerunners Mission Kit support**
- **Built-in cyberware:** Gorilla Arms, Mantis Blades and Monowire are standard Cyberarm options in the Ripperdoc and dropdowns. When their numbers are filled in, they get Hit and Damage buttons on the Play tab automatically, as the core blades (Wolvers, Rippers…) already do.
- **Weapon types:** Power, Tech and Smart, set on the Gear tab. The GM writes each type's rule on the Homebrew page, and it's shown on that weapon's rolls.
- **Fill in the numbers once:** Mission Kit values go in **one table at the top of [`js/data.js`](js/data.js)** (`MISSION_KIT_CYBERWARE` and `MISSION_KIT_QUICKHACKS`). Anything still empty is flagged in the app with exactly what's missing, and nothing is guessed.
  - **Gorilla Arms** (complete): 500eb, 2d6 Humanity Loss and 2 option slots per arm (4d6 for a pair), 3d6 damage (Brawling), BODY counts as 11 for Choke, Slam and strength. A pair lets you force open doors, move Thick Cover objects, and Choke and Slam opponents.
  - **Mantis Blades, Monowire:** not entered yet.

**Netrunning tab**
- Every character has a **⌁ Netrunning** tab showing their Interface rank and whether they have Interface Plugs.
- **Interface abilities** (Backdoor, Cloak, Control, Eye-Dee, Pathfinder, Scanner, Slide, Virus, Zap): one tap rolls Interface + 1d10. Booster programs (Eraser, See Ya, Worm) add their +2 automatically while they have REZ.
- **Cyberdeck:** pick Poor / Standard / Excellent; program slots are tracked.
- **Programs:** the core rulebook Boosters, Defenders and Attackers, with ATK/DEF/REZ, attack and damage rolls, and REZ tracking (take hits, see when a program derezzes, restore all). Effects are short summaries; check values against your book. Black ICE isn't included, since the Homebrew Content Policy rules out reproducing enemy stat blocks.
- **Quickhacks:** nine built-in *prototype* quickhacks in four tiers. Simple: Sonic Shock (DV 6). Standard: Short Circuit, Overheat (DV 8). Difficult: Cyberware Malfunction, Slow, Synapse Burnout (DV 10). Advanced: Shard Ejection, System Reset, Puppet (DV 12). GM-made quickhacks from the Homebrew page appear alongside them. A *How quickhacking works* panel covers the 50m range and the three steps:
  - **Jack In:** Interface + 1d10 vs the target's WILL + 1d10. Base Firewall DV 6, passed automatically at Interface 3+. Failing only alerts the target.
  - **Run a quickhack:** Interface + 1d10 must be greater than its DV. The roll says SUCCESS or FAILED. One quickhack per target per turn.
  - **Force Out** (for anyone being hacked): WILL + Concentration + 1d10 vs the Netrunner's Interface + 1d10. Costs 1 Action (ROF 1); winning forces an unsafe jack-out and a 60-minute lockout.
  - Every Jack In, Force Out and quickhack row has its own **Mod** box for situational modifiers, saved per character.
- **Prototype strain:** every quickhack attempt costs DV ÷ 2 (rounded down) − Interface + 1d6 temporary Humanity, minimum 1. The tracker adds it automatically, lowers current Humanity (and EMP), has −1/+1 to adjust by hand, and a **Clear (long rest)** button. Each quickhack shows the strain range the character can expect.

**Weapon damage Override & Modifier**
- On the Gear tab, **Override** replaces a weapon's base damage dice (e.g. a 3d6 pistol rolled as 4d6). **Modifier** adds a flat amount to every damage roll (+2, −1…).
- The Play tab shows the result (e.g. `DMG* 4d6+2`, where * means overridden). The roll breakdown lists the modifier and notes the base damage.

**GM tools**
- **Combat tracker**: initiative (REF + 1d10, plus Kerenzikov), turn and round order, damage with armor (head ×2, ½ SP for melee, +5 crit injury, SP ablation), wound states, death saves, heal, conditions and a combat log. Player HP syncs back to the character sheet.
- **Maps**: **square or hex grid** (switchable), terrain painting (brush or rectangle), tokens (or place everyone from the combat tracker, with HP bars), measuring in cells and meters (2m per cell), fog of war with a player view, background image upload, undo, and PNG / map-file export.
- **Dice roller**: skill checks with exploding/imploding d10 against a DV, and damage dice that flag critical injuries.

## Running it

### Install it like an app (Windows, Android, iPhone)
Once it's hosted (GitHub Pages, see below), an **⇩ Install** button appears in the top bar:
- **Windows (Edge / Chrome) and Android (Chrome):** click **Install**. RED Kit gets its own window, a Start-menu / home-screen icon, and works offline.
- **iPhone / iPad (Safari):** tap **Install** for the steps: Share → **Add to Home Screen**.

You can also open `index.html` directly on a PC with no install. Everything works, but there's no offline install.

### Hosting on GitHub Pages
All the files are static, so there's no build step. Push this folder to a GitHub repository, then go to **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save. The app is then at `https://<your-username>.github.io/<repo-name>/`.
After changing files, bump `VERSION` in `sw.js` so installed copies pick up the update.

### Local server (testing on your network)
```bash
python -m http.server 8642
```
Then open `http://localhost:8642` on the PC. Phones on the same Wi-Fi can use `http://<your-PC-IP>:8642`. Offline caching only works over HTTPS or on localhost, but the app itself runs fine over LAN.

## Data & backups
Everything is saved in the browser's local storage **on that device**. Each device or browser keeps its own copy. To move or back up characters, use **Export** (or *Export all*) and **Import**. Maps export as `.redmap.json`.

## Editing game data
All rules data — skills, cyberware (cost / Humanity Loss / slots), weapons, armor, NPC templates and terrain — lives in [`js/data.js`](js/data.js). The values follow the core rulebook from memory, so check them against your book and edit freely. After changing files on a hosted copy, bump `VERSION` in `sw.js` so installed apps pick up the update.

## Project layout
```
index.html            app shell
css/styles.css        theme + responsive layout
js/data.js            game data (edit me)
js/store.js           local storage
js/ui.js              modal, toast, file save/load, dice
js/character.js       character builder + export
js/combat.js          combat tracker
js/map.js             grid map editor
js/dice.js            dice roller
js/app.js             navigation + service worker registration
sw.js, manifest.webmanifest, icons/   installable-app (PWA) support
```

## Legal

RED Kit is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.

RED Kit is free and always will be. It contains no text, art or logos from R. Talsorian Games products: cyberware and rule descriptions are short summaries written for this app. Fonts: Rajdhani (SIL Open Font License, via Google Fonts). Icons were made for this project.
