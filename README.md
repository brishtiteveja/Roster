# Roster

**Unlimited options. Finite human attention.**
A dating market that clears once a week — where everyone you meet actually has room to meet you.

Roster is a React Native (Expo) app implementing the Roster **Mechanism Specification v5.2.2** —
the R2 *availability-clearing* design: declared weekly openings → reciprocal boards of six →
sealed picks → quota-respecting reciprocal clearing → a capped, checkpointed connection that is
never allowed to trail off.

You play one participant through a six-week Season 0 against a deterministic, seeded cohort of ~34.
The same pure-TypeScript engine that runs the app is the one that runs the "digital twin."

---

## Run it

```bash
npm install
npm run web        # open in a browser (fastest way to see it)
npm run ios        # or: press i / a in the Expo CLI
npm run android
npm start          # Expo dev server (scan the QR with Expo Go)
```

## Play it on your phone

**Fastest — Expo Go (no account needed):** install [Expo Go](https://expo.dev/go) on your phone, then

```bash
npm start          # add --tunnel if your phone isn't on the same Wi-Fi
```

and scan the QR code. The season autosaves on-device, so you can close the app and pick the week back up.

**Shareable preview — EAS (one-time login):**

```bash
npm i -g eas-cli
eas login          # free Expo account
eas init           # links the project (writes projectId into app.json)
eas update --branch preview --message "Roster preview"   # shareable QR/link via expo.dev
# or a standalone Android APK anyone can install:
eas build --profile preview --platform android
```

`eas.json` is already configured (`preview` builds an installable APK). These commands need your Expo
account, so run them from your machine — everything else is set up.

Verify the mechanism logic without launching the UI:

```bash
npm test           # typecheck + engine unit checks + a full headless season
npm run test:engine
npm run test:season
```

---

## What you do, week by week

The whole app is one weekly heartbeat (Mechanism Spec §1):

| Moment | In the app |
| --- | --- |
| **Persona** | A local model *proposes* profile evidence from a photo + listening export. You approve, edit, or **delete** each item (the two over-reaching inferences are there so you delete them). Agency is the product, not extraction. |
| **Mon 12:00 — Declare** | Say **In** or **Paused**. Only people who declared appear on anyone's board. Pausing is silent and costless. |
| **Mon 18:00 — Board** | Six people *with room*. Pick up to **three**, **sealed**. |
| **Clearing / Recoupling** | Mutual picks are matched against real capacity — **at most one new connection per person, per week**. Unpicked and picked-without-room are indistinguishable, so a quiet week is never a verdict. |
| **The connection** | **At most two** at once. A checkpoint every 7 days: *keep · more time · close*. Miss two check-ins with nothing said and it closes — silence gets an ending instead of becoming one. **Graduating** is the celebrated exit. |
| **Observatory** | The market watched live: introductions per week and the zero-connection *starvation* guardrail (K falls 2→3 at ≥15%). |

---

## Architecture

```
src/
  engine/            market-engine — pure TS, zero I/O, deterministic (reproducible from a seed)
    rng.ts           seedable RNG + commit–reveal seed helpers (§2.2)
    eligibility.ts   symmetric hard eligibility E + affinity a(u,v) (§2.1)
    board.ts         reciprocal (undirected) board construction (§2.2 / §2.6 worked procedure)
    clearing.ts      quota-respecting reciprocal clearing = max matching + fairness hierarchy (§3)
    checkpoint.ts    connection & checkpoint state machine, anti-ghost + graduation (§4)
    params.ts        frozen Season 0 parameters (§1)
  data/              seeded cohort, simulated declarations/picks/votes, propose–approve persona, generated avatars
  state/             React reducer store + the weekly orchestration loop
  components/        design-system primitives + the Tinder-style swipe Deck (the lamp-lit slide palette)
  screens/           Onboarding · Declare · Board · Results/Recoupling · Connections · Observatory · Season end
```

### Faithful to the spec (and to its refusals)

- **Reciprocal boards** — the board graph is undirected and symmetric *by construction*, so every
  pick is structurally reciprocable (spec §0 supersession #2).
- **No borrowed prestige** — clearing is capacity-constrained maximum matching with a lexicographic
  fairness hierarchy (introductions → zero-connection first → longest-waiting → seed), **not**
  "stable matching" (§0 #1, §3.2).
- **No pick history, ever, in board weights** — affinity is only shared windows + shared interests (§2.1).
- **Commit–reveal seed** — every board and clearing is reproducible; the operator can't re-roll after
  seeing picks (§2.2).
- **Feasibility over filler** — infeasible cohorts get rollover/refund/notice, **never filler
  profiles** (§2.2 / §5.2).
- **The two-stage promise** — "everyone has made room" before clearing; "every introduction is
  mutual" after (§5.1).
- **Silence is protected** — not clearing is never a verdict; the closer is never named; the
  protection is scheduling + symmetry, not secrecy (§3.4, §4).

### Look & feel
The board is a **Tinder-style swipe deck** — full-bleed cards with story-style progress segments,
gradient scrims, name/age/bio, interest chips, and swipe-right-to-seal (preserving the sealed-pick
mechanic and its "nobody learns they were passed over" guarantee). Clearing an introduction triggers a
full-screen **"It's mutual."** recoupling overlay. There's an icon tab bar with a **Profile** tab
(portrait, persona receipts, windows/interests, the market's terms) and a gold-ringed new-matches strip
on Connections. Profile faces are generated **offline** with [DiceBear](https://www.dicebear.com/)'s
`lorelei` style (MIT) on per-person gradients — free, no attribution, no network, and no real person's
face on a synthetic profile. Drop your own images into `assets/` and point `src/data/avatars.ts` at them
to swap the source in one place.

This is a demo of the *mechanism* and the *experience*. No real people, no network, no cloud path —
everything runs locally, exactly as the twin does.
