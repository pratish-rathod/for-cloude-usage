# LlamaParse — sponsor segment animation

A 1920×1080, ~86 s motion piece for the LlamaParse (LlamaIndex) sponsor read. It's styled like a SaaS product video: a dark "LlamaIndex → LlamaParse" pill carries through the whole segment, each scene has one idea, and visuals land on the spoken words.

## Files

| File | What it is |
|---|---|
| `LlamaParse Sponsor.mp4` | Rendered video, 30 fps, **silent**. Lay the voiceover in your editor. |
| `LlamaParse Sponsor.html` | Single-file player: scrub, play, and **Add voiceover** (your audio becomes the master clock). |
| `index.html` + `timing.js` + `piece.js` | Source. `timing.js` holds the script and word timing, and `piece.js` holds the choreography. |
| `build.js` | Rebuilds the single-file HTML: `node build.js` |

Player keys: `Space` play/pause, `←/→` scrub 1 s (`Shift` for 5 s). URL flags: `?t=42` opens at 42 s, and `?render=1` hides the controls.

## Timing

No voiceover was supplied, so timing is estimated at ~2.7 spoken words/sec with pauses at punctuation. Every beat is keyed to a word via `W('Scene', 'word')`, so retiming is one change:

- To match a real VO, edit `WPS` or `SPOKEN` in `timing.js`, or override `cues`/word times with measured values. All beats follow automatically.

| Scene | Starts | Line |
|---|---|---|
| Intro | 0.6s | Quick interruption from my future self to present you a very nice sponsor for this video and one that I had on the podcast a few years ago, LlamaIndex. |
| Rag | 12.5s | Yes, the very same RAG framework where I had Jerry Liu, the founder, on my podcast in 2023. |
| Parse | 21.0s | Except now it's all about LlamaParse, their agentic OCR. |
| Pdfs | 25.7s | In the episode I recorded with Jerry, I told him that PDFs would remain a problem for a very long time, |
| Pipeline | 33.9s | and now they built the most powerful OCR pipeline I've ever seen. |
| Personal | 39.1s | I guess they might have took that a bit personally. |
| Route | 43.3s | LlamaParse sends tables, charts, and scans to the right model |
| Trace | 47.8s | and then traces every value back to its source. |
| Bench | 51.5s | On their open benchmark, it comes out on top for a fraction of the cost. |
| Code | 57.8s | Use the code SUMMERGIFT26 for $250 in free credits |
| Discount | 63.3s | and half off your first three months of subscription if you upgrade within 30 days. |
| Link | 69.4s | Check out LlamaParse with the first link in the description below, |
| Team | 74.3s | and go support my friend Jerry Liu and his amazing team. |
| October | 78.8s | The offer stands for the whole October month. |
| Outro | 82.1s | Now, let's get back to the video. |

## Storyboard

1. **Intro**: A video is playing and pauses on "interruption". It fast-forwards to "future me", then the pause button morphs into a *Sponsor* pill. The years roll 2026 → 2023 on "a few years ago", and the pill becomes **LlamaIndex**.
2. **Rag**: Docs → LlamaIndex → LLM, with data flowing along the wires. Then a podcast episode card: Jerry Liu, *Founder*, an `EP · 2023` chip and a live waveform.
3. **Parse**: "Index" rolls to "Parse" and the pill becomes **LlamaParse**. An *Agentic OCR* tag pops with a scan beam.
4. **Pdfs**: A PDF (table, chart, skewed scan) goes through generic OCR, which fails ✕ and produces garbled output. The years keep rolling 2023 → 2026.
5. **Pipeline**: The LlamaParse pill drops in and replaces the OCR box. The output turns into clean rows with a ✓.
6. **Personal**: A *Took it personally* stamp.
7. **Route**: Tables, charts and scans light up one by one and route to a table model, a vision model and an OCR model. Each gets a ✓ on "right model".
8. **Trace**: result.json. The highlighted value traces a dashed line back to its exact table cell (`p.1 · table`).
9. **Bench**: An accuracy leaderboard where LlamaParse climbs to #1, next to cost bars where LlamaParse's bar shrinks to a fraction.
10. **Code / Discount**: The coupon `SUMMERGIFT26` types in, then *Copied*. $250 counts up, 50% off fills M1–M3, and a 30-day ring appears.
11. **Link**: The video description with the first link highlighted, and the cursor clicks it.
12. **Team**: Jerry Liu in the center and his team pops in around him, with a *Go support* stamp.
13. **October**: The October 2026 calendar fills day by day, with an *All month* stamp.
14. **Outro**: The pill becomes a play button, the video resumes and fades out.

## Branding notes

- llamaindex.ai was not reachable from the build environment. The palette is a LlamaIndex-style pink → violet → blue gradient (`#ff5fa8 → #9a5cff → #5b7cff`) on a lavender-white canvas with near-black ink. It's defined in the tokens at the top of `piece.js`, so you can swap in exact brand hexes there.
- No logo was drawn. The wordmark is typographic ("Llama" + a gradient "Index/Parse") with a gradient dot. To use the real logo, put the file next to the HTML and replace `brandDot(...)` in the pill.
- Font: Geist / Geist Mono (Google Fonts).

## Illustrative / invented content (please check)

- The table values in the output card and result.json (4.2M, 18%, 31%, 6.0M) are placeholders.
- Model names (table / vision / OCR model) are illustrative of LlamaParse's routing, not official product names.
- The benchmark and cost charts have **no numbers or competitor names**. They only show "on top" and "a fraction of the cost", as the script says.
- Jerry Liu and the team are shown as neutral person glyphs, not likenesses.
- Script note: the code is "SUMMERGIFT26" while the offer runs "the whole October month". The on-screen text follows the script.
