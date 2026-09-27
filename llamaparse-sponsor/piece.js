// LlamaParse sponsor segment — every value is a pure function of T (seconds of voiceover).
(function () {
  const { W, cues: C, total: END } = window.TIMING;

  // ---------- helpers
  const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
  const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeOutBack = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const EZ = { enter: easeOutCubic, draw: easeInOutCubic, pop: easeOutBack, lin: (p) => p };
  function seq(T, keys) {
    if (T <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, k] = keys[i], [t0, v0] = keys[i - 1];
      if (T < t1) { const p = t1 === t0 ? 1 : (T - t0) / (t1 - t0); return v0 + (v1 - v0) * EZ[k || 'enter'](p); }
    }
    return keys[keys.length - 1][1];
  }
  function rectAt(T, keys) {
    const f = (k) => seq(T, keys.map(([t, r, e]) => [t, r[k], e]));
    return { x: f('x'), y: f('y'), w: f('w'), h: f('h'), r: f('r') };
  }
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const frac = (v) => v - Math.floor(v);
  const mix = (c, pct, base = 'transparent') => `color-mix(in oklch, ${c} ${pct}%, ${base})`;
  const UNITLESS = new Set(['opacity', 'zIndex', 'flex', 'fontWeight', 'lineHeight', 'flexShrink', 'flexGrow']);
  const css = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${typeof v === 'number' && !UNITLESS.has(k) ? v.toFixed(2) + 'px' : v}`).join(';');
  const div = (style, inner = '') => `<div style="${css(style)}">${inner}</div>`;
  const abs = (r, extra) => ({ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: r.r, ...extra });
  const FILL = { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 };
  const flexC = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

  // ---------- brand tokens (LlamaIndex: lavender-white canvas, near-black ink, pink → violet → blue gradient)
  const SANS = "'Geist', 'Inter', 'Helvetica Neue', Arial, sans-serif";
  const MONO = "'Geist Mono', ui-monospace, Menlo, monospace";
  const th = {
    bg: '#f6f4fb', dot: 'rgba(40,24,80,0.09)', ink: '#15121f', sub: '#6d6882', card: '#ffffff', line: '#e6e1ef',
    dark: '#15121f', darkInk: '#f6f4fb', darkSub: '#a39db6', darkLine: '#2c2740',
    shadow: '0 40px 80px -30px rgba(50,20,90,0.28), 0 2px 8px rgba(50,20,90,0.07)',
  };
  const PINK = '#ff5fa8', VIOLET = '#9a5cff', BLUEB = '#5b7cff';
  const ACCENT = VIOLET;
  const GRAD = `linear-gradient(100deg, ${PINK} 0%, ${VIOLET} 52%, ${BLUEB} 100%)`;
  const GREEN = 'oklch(0.64 0.14 155)';
  const RED = 'oklch(0.6 0.19 22)';
  const card = { background: th.card, border: `1px solid ${th.line}`, boxShadow: th.shadow, boxSizing: 'border-box' };
  const gradSpan = (t) => `<span style="background:${GRAD};-webkit-background-clip:text;background-clip:text;color:transparent">${t}</span>`;
  const gradText = { background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
  const skel = (w, c = mix(th.ink, 12, th.card), h = 12, extra = {}) => div({ width: w, height: h, borderRadius: h / 2, background: c, flexShrink: 0, ...extra });

  // ---------- small components
  const glyph = (text, size = 56, color = ACCENT) => div({ width: size, height: size, borderRadius: size * 0.25, flexShrink: 0, ...flexC,
    background: mix(color, 16), color, font: `600 ${size * (text.length > 2 ? 0.3 : 0.42)}px ${MONO}` }, text);
  const brandDot = (s) => div({ width: s, height: s, borderRadius: s / 2, background: GRAD, flexShrink: 0 });
  const person = (s, ring = 0, ringBg = GRAD) => div({ width: s, height: s, borderRadius: s / 2, flexShrink: 0, position: 'relative', background: ring ? ringBg : 'transparent', padding: ring, boxSizing: 'border-box' },
    div({ width: '100%', height: '100%', borderRadius: '50%', background: mix(VIOLET, 14, th.card), position: 'relative', overflow: 'hidden' },
      div({ position: 'absolute', left: '34%', top: '20%', width: '32%', height: '32%', borderRadius: '50%', background: mix(VIOLET, 70, th.ink) }) +
      div({ position: 'absolute', left: '18%', top: '58%', width: '64%', height: '60%', borderRadius: '50% 50% 0 0', background: mix(VIOLET, 70, th.ink) })));
  const check = (s, o = 1, bg = GREEN) => div({ width: s, height: s, borderRadius: s / 2, background: bg, color: '#fff', ...flexC, font: `700 ${s * 0.5}px ${SANS}`, opacity: clamp01(o), transform: `scale(${0.4 + 0.6 * o})`, flexShrink: 0 }, '✓');
  const cross = (s, o = 1) => check(s, o, RED).replace('✓', '✕');
  const winDots = (c = th.line) => [0, 1, 2].map(() => div({ width: 13, height: 13, borderRadius: 7, background: c })).join('');
  const stamp = (text, o, x, y, bg = GRAD, rot = -5, icon = '✓') => div({ position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 14, height: 76, padding: '0 32px 0 14px', borderRadius: 38,
    background: bg, color: '#fff', font: `600 32px ${SANS}`, letterSpacing: '-0.01em', whiteSpace: 'nowrap', boxShadow: th.shadow, opacity: clamp01(o), transform: `rotate(${rot}deg) scale(${0.4 + 0.6 * o})`, transformOrigin: 'center' },
    div({ width: 48, height: 48, borderRadius: 24, background: '#fff', color: VIOLET, ...flexC, font: `700 24px ${SANS}` }, icon) + text);
  // vertical roller: lines[] rolled to fractional index k
  const roller = (lines, k, lh, style) => div({ height: lh, overflow: 'hidden', position: 'relative', ...style },
    div({ transform: `translateY(${-k * lh}px)` }, lines.map((l) => div({ height: lh, lineHeight: lh + 'px', whiteSpace: 'nowrap' }, l)).join('')));
  const bez = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2; return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`; };
  function bezPt(x1, y1, x2, y2, p) {
    const mx = (x1 + x2) / 2, u = 1 - p;
    return [u * u * u * x1 + 3 * u * u * p * mx + 3 * u * p * p * mx + p * p * p * x2, u * u * u * y1 + 3 * u * u * p * y1 + 3 * u * p * p * y2 + p * p * p * y2];
  }
  const wire = (x1, y1, x2, y2, o, dr = 1, color = th.line) => `<path d="${bez(x1, y1, x2, y2)}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1 - dr}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="${o}"/>`;
  const particles = (T, x1, y1, x2, y2, o, n = 3, speed = 0.7, color = ACCENT, off = 0) => o <= 0 ? '' :
    Array.from({ length: n }, (_, i) => { const [x, y] = bezPt(x1, y1, x2, y2, frac(T * speed + i / n + off)); return `<circle cx="${x}" cy="${y}" r="7" fill="${color}" opacity="${o}"/>`; }).join('');

  // ---------- thread rects (the dark protagonist pill)
  const VID = { x: 360, y: 230, w: 1200, h: 660, r: 28 };
  const PAUSE = { x: 885, y: 465, w: 150, h: 150, r: 75 };
  const SPONSOR = { x: 770, y: 485, w: 380, h: 110, r: 55 };
  const LI_BIG = { x: 640, y: 470, w: 640, h: 140, r: 70 };
  const HUB = { x: 720, y: 485, w: 480, h: 110, r: 55 };
  const TOP = { x: 740, y: 200, w: 440, h: 96, r: 48 };
  const BIG = { x: 610, y: 400, w: 700, h: 160, r: 80 };
  const MID = { x: 770, y: 525, w: 380, h: 104, r: 52 };

  // PDF page geometry (shared by Pdfs → Trace)
  const PAGE = { x: 220, y: 300, w: 440, h: 580, r: 18 };
  const REG = {
    table: { x: 250, y: 372, w: 380, h: 170 },
    chart: { x: 250, y: 562, w: 180, h: 130 },
    scan: { x: 250, y: 712, w: 380, h: 140 },
  };
  const OUT = { x: 1260, y: 320, w: 440, h: 540, r: 22 };

  function render(T) {
    const s = (k) => seq(T, k);
    const fin = (t, d = 0.4) => s([[t, 0], [t + d, 1]]);
    const fout = (t, d = 0.35) => 1 - s([[t, 0], [t + d, 1]]);
    const win = (a, b, di = 0.4, dout = 0.35) => fin(a, di) * fout(b, dout);
    const pop = (t, d = 0.45) => s([[t, 0], [t + d, 1, 'pop']]);
    const draw = (t, d = 0.5) => s([[t, 0], [t + d, 1, 'draw']]);
    const early = (t) => t - 0.12; // land ~60% visible as the word starts
    const out = [];
    const add = (html) => out.push(html);

    // ---------- beat table (voiceover seconds)
    const b = {
      quick: W('Intro', 'Quick'), interruption: W('Intro', 'interruption'), future: W('Intro', 'future'), sponsor: W('Intro', 'sponsor'),
      podcast0: W('Intro', 'podcast'), ago: W('Intro', 'ago'), llamaindex: W('Intro', 'LlamaIndex'),
      rag: W('Rag', 'RAG'), jerry: W('Rag', 'Jerry'), founder: W('Rag', 'founder'), podcast1: W('Rag', 'podcast'), y2023: W('Rag', '2023'),
      llamaparse: W('Parse', 'LlamaParse'), agentic: W('Parse', 'agentic'),
      episode: W('Pdfs', 'episode'), pdfs: W('Pdfs', 'PDFs'), problem: W('Pdfs', 'problem'), long: W('Pdfs', 'long'),
      built: W('Pipeline', 'built'), powerful: W('Pipeline', 'powerful'), pipeline: W('Pipeline', 'pipeline'),
      personally: W('Personal', 'personally'),
      tables: W('Route', 'tables'), charts: W('Route', 'charts'), scans: W('Route', 'scans'), right: W('Route', 'right'),
      traces: W('Trace', 'traces'), value: W('Trace', 'value'), source: W('Trace', 'source'),
      benchmark: W('Bench', 'benchmark'), top: W('Bench', 'top'), fraction: W('Bench', 'fraction'), cost: W('Bench', 'cost'),
      code: W('Code', 'code'), gift: W('Code', 'SUMMERGIFT26'), usd: W('Code', '$250'), credits: W('Code', 'credits'),
      half: W('Discount', 'half'), three: W('Discount', 'three'), upgrade: W('Discount', 'upgrade'), days: W('Discount', 'days'),
      check: W('Link', 'Check'), first: W('Link', 'first'), link: W('Link', 'link'), below: W('Link', 'below'),
      support: W('Team', 'support'), jerry2: W('Team', 'Jerry'), team: W('Team', 'team'),
      whole: W('October', 'whole'), october: W('October', 'October'), month: W('October', 'month'),
      back: W('Outro', 'back'), video: W('Outro', 'video'),
    };

    // ---------- background: dot grid (static) + one slow glow
    add(div({ ...FILL, backgroundImage: `radial-gradient(${th.dot} 1.6px, transparent 1.6px)`, backgroundSize: '36px 36px' }));
    add(div({ position: 'absolute', width: 1500, height: 1500, left: 600 + 260 * Math.sin(T * 0.2), top: -520 + 160 * Math.cos(T * 0.17), borderRadius: '50%',
      background: `radial-gradient(closest-side, ${mix(VIOLET, 14)}, transparent)` }));
    add(div({ position: 'absolute', width: 1100, height: 1100, left: -300 + 200 * Math.cos(T * 0.15), top: 380 + 120 * Math.sin(T * 0.19), borderRadius: '50%',
      background: `radial-gradient(closest-side, ${mix(PINK, 9)}, transparent)` }));

    const fadeAll = s([[END - 0.5, 1], [END, 0, 'draw']]);
    out.push(`<div style="${css({ ...FILL, opacity: fadeAll })}">`);

    // ======================= INTRO + OUTRO: the video frame =======================
    {
      const oIn = win(early(b.quick), b.sponsor - 0.1, 0.45, 0.4);
      const oOut = win(b.back - 0.35, END + 1, 0.45);
      const o = Math.max(oIn, oOut);
      if (o > 0) {
        const dim = oIn > 0 ? s([[b.interruption - 0.05, 0], [b.interruption + 0.3, 1]]) : 1 - s([[b.back + 0.2, 0], [b.back + 0.6, 1]]);
        // playhead: plays, stops on "interruption", jumps forward on "future", resumes on "back"
        let p;
        if (T < C.Rag) p = s([[0, 0.28], [b.interruption, 0.28 + (b.interruption) * 0.012], [b.future, 0.28 + b.interruption * 0.012], [b.future + 0.6, 0.93, 'draw']]);
        else p = 0.41 + Math.max(0, T - (b.back + 0.4)) * 0.012;
        const lift = oIn > 0 ? (1 - oIn) * 40 : (1 - oOut) * 40;
        const ffO = pop(b.future - 0.1, 0.4) * fout(b.sponsor - 0.25, 0.3);
        add(div(abs({ ...VID, y: VID.y + lift }, { ...card, overflow: 'hidden', opacity: o }),
          // "video" content: soft abstract frame
          div({ position: 'absolute', left: 0, top: 0, width: VID.w, height: VID.h, background: `linear-gradient(160deg, ${mix(VIOLET, 10, th.card)}, ${mix(BLUEB, 6, th.card)})` },
            div({ position: 'absolute', left: 90, top: 110, display: 'flex', flexDirection: 'column', gap: 22 },
              skel(420, mix(th.ink, 16, th.card), 26) + skel(300, mix(th.ink, 10, th.card), 18) + skel(360, mix(th.ink, 10, th.card), 18)) +
            div({ position: 'absolute', right: 110, top: 120, width: 330, height: 330, borderRadius: 165, border: `2px dashed ${mix(VIOLET, 35, th.card)}` }) +
            div({ position: 'absolute', right: 180, top: 190, width: 190, height: 190, borderRadius: 95, background: mix(VIOLET, 14, th.card) })) +
          div({ ...FILL, background: mix(th.ink, 38), opacity: dim * 0.75 }) +
          // progress bar
          div({ position: 'absolute', left: 40, right: 40, bottom: 40, height: 8, borderRadius: 4, background: mix('#ffffff', 55) },
            div({ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p * 100}%`, borderRadius: 4, background: GRAD }) +
            div({ position: 'absolute', left: `calc(${p * 100}% - 11px)`, top: -7, width: 22, height: 22, borderRadius: 11, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.25)' })) +
          // fast-forward chip on "future self"
          div({ position: 'absolute', right: 40, bottom: 76, height: 60, padding: '0 24px', borderRadius: 30, background: th.card, color: th.ink, display: 'flex', alignItems: 'center', gap: 12,
            font: `600 26px ${SANS}`, opacity: clamp01(ffO), transform: `scale(${0.5 + 0.5 * ffO})`, transformOrigin: 'right center', whiteSpace: 'nowrap' },
            div({ color: VIOLET, font: `700 28px ${SANS}`, letterSpacing: '-0.2em' }, '▶▶') + 'Future me')));
      }
    }

    // ---------- Intro: years roll back on "a few years ago"
    {
      const o = win(b.podcast0 - 0.1, b.llamaindex - 0.1, 0.4, 0.3);
      if (o > 0) {
        const k = s([[b.podcast0 + 0.3, 0], [b.ago + 0.1, 3, 'draw']]);
        add(div({ position: 'absolute', left: 960 - 190, top: 640 + (1 - o) * 30, width: 380, height: 110, ...card, borderRadius: 26, display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px', opacity: o },
          // mic glyph
          div({ width: 60, height: 60, borderRadius: 15, background: mix(VIOLET, 16), position: 'relative', flexShrink: 0 },
            div({ position: 'absolute', left: 22, top: 10, width: 16, height: 26, borderRadius: 8, background: VIOLET }) +
            div({ position: 'absolute', left: 16, top: 24, width: 28, height: 18, borderRadius: '0 0 14px 14px', border: `3px solid ${VIOLET}`, borderTop: 'none', boxSizing: 'border-box' }) +
            div({ position: 'absolute', left: 28.5, top: 42, width: 3, height: 8, background: VIOLET })) +
          roller(['2026', '2025', '2024', '2023'], k, 70, { font: `600 56px ${MONO}`, color: th.ink, letterSpacing: '-0.04em', width: 160 }) +
          div({ color: th.sub, font: `600 30px ${SANS}`, transform: `rotate(${-k * 120}deg)` }, '↺')));
      }
    }

    // ======================= RAG: LlamaIndex as a framework =======================
    {
      const o = win(early(b.rag), b.jerry - 0.2, 0.45, 0.35);
      if (o > 0) {
        const dr = draw(b.rag + 0.2, 0.6);
        const docsIn = pop(b.rag - 0.05, 0.45), llmIn = pop(b.rag + 0.35, 0.45);
        let svg = wire(560, 540, 720, 540, o, dr) + wire(1200, 540, 1360, 540, o, dr);
        svg += particles(T, 560, 540, 720, 540, o * clamp01(dr), 3, 0.9) + particles(T, 1200, 540, 1360, 540, o * clamp01(dr), 3, 0.9, PINK);
        add(`<svg width="1920" height="1080" style="position:absolute;left:0;top:0">${svg}</svg>`);
        // docs stack
        add(div({ position: 'absolute', left: 300, top: 430, width: 260, height: 220, opacity: o * clamp01(docsIn), transform: `translateX(${(1 - docsIn) * -30}px)` },
          [2, 1, 0].map((i) => div({ ...card, position: 'absolute', left: i * 18, top: i * -14, width: 200, height: 220, borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 },
            skel('70%', mix(th.ink, 16, th.card), 14) + skel('90%') + skel('80%') + skel('60%') + skel('85%'))).join('')));
        // LLM + answer
        add(div({ position: 'absolute', left: 1360, top: 450, width: 260, height: 180, ...card, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
          opacity: o * clamp01(llmIn), transform: `translateX(${(1 - llmIn) * 30}px)` },
          glyph('LLM', 72) + div({ display: 'flex', gap: 8 }, [0, 1, 2].map((i) => div({ width: 12, height: 12, borderRadius: 6, background: VIOLET, opacity: 0.35 + 0.65 * frac(T * 1.4 - i * 0.2) })).join(''))));
        add(div({ position: 'absolute', left: 960 - 60, top: 640, height: 50, padding: '0 20px', borderRadius: 25, background: mix(VIOLET, 14), color: VIOLET, ...flexC,
          font: `600 26px ${MONO}`, opacity: o * clamp01(pop(b.rag + 0.1)) }, 'RAG'));
      }
    }

    // ---------- Rag: podcast episode card with Jerry
    {
      const o = win(early(b.jerry), C.Parse - 0.3, 0.45, 0.35);
      if (o > 0) {
        const tagO = pop(early(b.founder)), yrO = pop(early(b.y2023)), micO = pop(early(b.podcast1));
        const E = { x: 460, y: 390, w: 1000, h: 380 };
        add(div(abs({ ...E, y: E.y + (1 - o) * 40, r: 28 }, { ...card, opacity: o, overflow: 'hidden' }),
          div({ position: 'absolute', left: 60, top: 70, display: 'flex', alignItems: 'center', gap: 34 },
            person(200, 6) +
            div({ display: 'flex', flexDirection: 'column', gap: 18 },
              div({ font: `600 56px ${SANS}`, letterSpacing: '-0.03em', color: th.ink, whiteSpace: 'nowrap' }, 'Jerry Liu') +
              div({ alignSelf: 'flex-start', height: 50, padding: '0 22px', borderRadius: 25, background: th.dark, color: th.darkInk, display: 'flex', alignItems: 'center', gap: 12, font: `500 26px ${SANS}`,
                opacity: clamp01(tagO), transform: `scale(${0.6 + 0.4 * tagO})`, transformOrigin: 'left center', whiteSpace: 'nowrap' }, brandDot(14) + 'Founder'))) +
          // waveform strip
          div({ position: 'absolute', left: 60, right: 60, bottom: 46, height: 64, display: 'flex', alignItems: 'center', gap: 7, opacity: clamp01(micO) },
            Array.from({ length: 62 }, (_, i) => { const h = 10 + 50 * Math.abs(Math.sin(i * 0.7 + T * 5) * Math.sin(i * 0.23 + T * 1.3));
              return div({ flex: 1, height: h, borderRadius: 4, background: i / 62 < frac((T - b.podcast1) * 0.08) + 0.3 ? VIOLET : mix(th.ink, 14, th.card) }); }).join('')) +
          div({ position: 'absolute', right: 50, top: 50, height: 58, padding: '0 22px', borderRadius: 29, background: mix(VIOLET, 14), color: VIOLET, display: 'flex', alignItems: 'center', gap: 12,
            font: `600 30px ${MONO}`, opacity: clamp01(yrO), transform: `scale(${0.5 + 0.5 * yrO})` }, div({ width: 12, height: 12, borderRadius: 6, background: RED, opacity: 0.4 + 0.6 * (Math.floor(T * 2) % 2) }) + 'EP · 2023')));
      }
    }

    // ---------- Parse: "Agentic OCR" tag + scan beam
    {
      const o = pop(early(b.agentic), 0.5) * fout(b.episode - 0.3, 0.3);
      if (o > 0) {
        add(div({ position: 'absolute', left: 960 - 170, top: 600, width: 340, height: 76, borderRadius: 38, background: GRAD, color: '#fff', ...flexC, gap: 14,
          font: `600 32px ${SANS}`, opacity: clamp01(o), transform: `translateY(${(1 - clamp01(o)) * 20}px) scale(${0.6 + 0.4 * o})`, boxShadow: th.shadow },
          div({ width: 36, height: 36, borderRadius: 8, border: '3px solid #fff', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' },
            div({ position: 'absolute', left: 0, right: 0, height: 3, top: 3 + 24 * frac(T * 1.2), background: '#fff' })) + 'Agentic OCR'));
      }
    }

    // ======================= PDF PAGE (Pdfs → Trace) =======================
    const pageO = win(early(b.pdfs), C.Bench - 0.3, 0.45, 0.4);
    const hl = { table: win(early(b.tables), C.Trace + 0.3), chart: win(early(b.charts), C.Trace + 0.3), scan: win(early(b.scans), C.Trace + 0.3) };
    const cellHL = win(b.source - 0.1, C.Bench - 0.3, 0.3);
    if (pageO > 0) {
      const regBox = (r, k, inner) => div({ position: 'absolute', left: r.x - PAGE.x, top: r.y - PAGE.y, width: r.w, height: r.h, borderRadius: 12, boxSizing: 'border-box',
        border: `2px solid ${k > 0 ? mix(VIOLET, 60 * k, th.card) : 'transparent'}`, background: k > 0 ? mix(VIOLET, 6 * k, th.card) : 'transparent', padding: 12 }, inner);
      const tableCells = Array.from({ length: 12 }, (_, i) => {
        const isHL = i === 6;
        return div({ height: 30, borderRadius: 6, background: i < 3 ? mix(th.ink, 18, th.card) : mix(th.ink, 8, th.card),
          outline: isHL && cellHL > 0 ? `3px solid ${mix(GREEN, 100 * cellHL, 'transparent')}` : 'none', outlineOffset: 2 });
      }).join('');
      add(div(abs({ ...PAGE, y: PAGE.y + (1 - pageO) * 40 }, { ...card, opacity: pageO, overflow: 'hidden' }),
        div({ position: 'absolute', right: 20, top: 18, height: 34, padding: '0 12px', borderRadius: 8, background: mix(RED, 14), color: RED, ...flexC, font: `700 20px ${MONO}` }, 'PDF') +
        div({ position: 'absolute', left: 30, top: 28, display: 'flex', flexDirection: 'column', gap: 10 }, skel(220, mix(th.ink, 20, th.card), 16) + skel(140)) +
        regBox(REG.table, hl.table, div({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }, tableCells)) +
        regBox(REG.chart, hl.chart, div({ display: 'flex', alignItems: 'flex-end', gap: 12, height: '100%', padding: '0 6px', boxSizing: 'border-box' },
          [0.45, 0.8, 0.6, 0.95, 0.7].map((v, i) => div({ flex: 1, height: `${v * 100}%`, borderRadius: 5, background: i === 3 ? mix(VIOLET, 60, th.card) : mix(th.ink, 16, th.card) })).join(''))) +
        div({ position: 'absolute', left: REG.chart.x - PAGE.x + 200, top: REG.chart.y - PAGE.y + 16, width: 160, display: 'flex', flexDirection: 'column', gap: 14 }, skel('100%') + skel('80%') + skel('92%') + skel('60%')) +
        regBox(REG.scan, hl.scan, div({ transform: 'rotate(-2.2deg)', background: mix(th.ink, 7, th.card), borderRadius: 6, height: '100%', padding: '14px 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 11,
          filter: 'blur(0.6px)' }, skel('88%', mix(th.ink, 22, th.card), 10) + skel('70%', mix(th.ink, 22, th.card), 10) + skel('94%', mix(th.ink, 22, th.card), 10) + skel('50%', mix(th.ink, 22, th.card), 10) + skel('76%', mix(th.ink, 22, th.card), 10)))));
    }

    // ---------- Pdfs: generic OCR box fails, output garbled, years keep rolling
    const legacyO = win(early(b.problem) - 0.5, b.built + 0.1, 0.4, 0.3);
    const garbled = 1 - s([[b.powerful - 0.1, 0], [b.powerful + 0.4, 1, 'draw']]);
    const outO = win(b.problem - 0.35, C.Route - 0.3, 0.45, 0.35);
    const pipeFlow = win(b.built + 0.3, C.Bench - 0.3, 0.4);
    {
      let svg = '';
      const wo = Math.max(legacyO, pipeFlow) * pageO;
      if (wo > 0) {
        svg += wire(660, 590, 770, 577, wo, draw(b.problem - 0.4)) + wire(1150, 577, 1260, 590, wo * Math.max(outO, 0), draw(b.problem - 0.2));
        svg += particles(T, 660, 590, 770, 577, pipeFlow * (1 - s([[C.Route - 0.2, 0], [C.Route, 1]])), 3, 0.8);
        svg += particles(T, 1150, 577, 1260, 590, pipeFlow * outO, 3, 0.8, GREEN);
      }
      // router wires (Route) + trace (Trace)
      const rO = win(early(b.tables), C.Trace - 0.2, 0.3, 0.3);
      const regs = [['table', b.tables, 457], ['chart', b.charts, 627], ['scan', b.scans, 782]];
      regs.forEach(([k, t, y], i) => {
        const on = win(early(t), C.Trace - 0.2, 0.3, 0.3);
        if (on > 0) {
          svg += wire(REG[k].x + REG[k].w, y, 770, 577, on, draw(t - 0.1, 0.4), mix(VIOLET, 45, th.card)) + particles(T, REG[k].x + REG[k].w, y, 770, 577, on, 2, 0.9, VIOLET, i * 0.3);
          const cy = 380 + i * 175 + 60;
          svg += wire(1150, 577, 1260, cy, on, draw(t + 0.05, 0.4), mix(VIOLET, 45, th.card)) + particles(T, 1150, 577, 1260, cy, on, 2, 0.9, [PINK, VIOLET, BLUEB][i], i * 0.2);
        }
      });
      // trace back to source: JSON row → table cell (arcs over the hub)
      const trO = win(b.value, C.Bench - 0.3, 0.3);
      if (trO > 0) {
        const dr = draw(b.value + 0.1, 0.9);
        const x1 = 1260, y1 = 444, x2 = 319, y2 = 483; // row "revenue" → table cell 6
        // sample the cubic up to the draw progress so the dashed line grows from the value to its source
        const cub = (p0, p1, p2, p3, u) => (1 - u) ** 3 * p0 + 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u * u * p2 + u ** 3 * p3;
        const pts = [];
        for (let i = 0; i <= 60; i++) { const u = (i / 60) * dr; pts.push(`${cub(x1, 1000, 560, x2, u).toFixed(1)},${cub(y1, 250, 250, y2, u).toFixed(1)}`); }
        svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${GREEN}" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 12" stroke-dashoffset="${T * 40}" opacity="${trO}"/>`;
        const tip = dr;
        if (tip > 0.98) svg += `<circle cx="${x2}" cy="${y2}" r="10" fill="${GREEN}" opacity="${trO}"/><circle cx="${x2}" cy="${y2}" r="${10 + 14 * frac(T * 1.2)}" fill="none" stroke="${GREEN}" stroke-width="3" opacity="${trO * (1 - frac(T * 1.2))}"/>`;
      }
      if (svg) add(`<svg width="1920" height="1080" style="position:absolute;left:0;top:0;overflow:visible">${svg}</svg>`);
    }
    if (legacyO > 0) {
      const xo = pop(early(b.problem) + 0.25);
      const fall = s([[b.built - 0.1, 0], [b.built + 0.35, 1, 'draw']]);
      add(div(abs({ ...MID, y: MID.y + fall * 120 }, { ...card, borderRadius: MID.r, border: `2px dashed ${th.line}`, ...flexC, gap: 16, opacity: legacyO, font: `600 34px ${MONO}`, color: th.sub }),
        'OCR' + div({ position: 'absolute', right: -14, top: -14 }, cross(48, xo))));
      const yrs = win(early(b.long) - 0.3, b.built, 0.3, 0.3);
      if (yrs > 0) {
        const k = s([[b.long - 0.2, 0], [b.long + 1.2, 3, 'draw']]);
        add(div({ position: 'absolute', left: 960 - 130, top: 700, width: 260, height: 84, borderRadius: 42, background: th.dark, color: th.darkInk, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: yrs * (1 - fall),
          boxShadow: th.shadow }, div({ color: RED, font: `700 28px ${SANS}` }, '⧗') + roller(['2023', '2024', '2025', '2026'], k, 60, { font: `600 44px ${MONO}`, letterSpacing: '-0.04em' })));
      }
    }
    // output card: garbled → clean (Pdfs/Pipeline), model chips (Route), JSON (Trace)
    if (outO > 0) {
      const garb = ['Rev€nue ▯▯ 4,2|  %%', 'Q3 ǁǁ ⌐ 1.8M?? ¦¦', '¶¶ l0ss —— ▯ 0,,3', '~~ Ch@rt ▯▯▯▯', 'T0tal ║ ‡ 6 . 0'];
      const clean = [['Revenue', '4.2M'], ['Q3 growth', '18%'], ['Margin', '31%'], ['Chart', 'Figure 2'], ['Total', '6.0M']];
      const ok = pop(early(b.pipeline));
      add(div(abs({ ...OUT, y: OUT.y + (1 - outO) * 40 }, { ...card, opacity: outO, overflow: 'hidden' }),
        div({ height: 64, borderBottom: `1px solid ${th.line}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px' }, winDots() +
          div({ marginLeft: 12, font: `600 24px ${MONO}`, color: th.ink }, 'output.md')) +
        div({ position: 'absolute', left: 28, top: 96, right: 28, display: 'flex', flexDirection: 'column', gap: 16, opacity: garbled },
          garb.map((g, i) => div({ height: 60, borderRadius: 12, background: mix(RED, 7, th.card), color: RED, display: 'flex', alignItems: 'center', padding: '0 18px', font: `500 24px ${MONO}`, whiteSpace: 'nowrap', overflow: 'hidden',
            transform: `translateX(${Math.sin(T * 13 + i * 2) * 2}px)` }, g)).join('')) +
        div({ position: 'absolute', left: 28, top: 96, right: 28, display: 'flex', flexDirection: 'column', gap: 16, opacity: 1 - garbled },
          clean.map(([k, v], i) => { const rp = fin(b.powerful + 0.15 + i * 0.1, 0.3);
            return div({ height: 60, borderRadius: 12, background: mix(GREEN, 8 * rp, th.card), display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', font: `500 24px ${MONO}`, color: th.ink, opacity: rp },
              div({ color: th.sub }, k) + div({ fontWeight: 600 }, v)); }).join('')) +
        div({ position: 'absolute', right: 22, bottom: 22 }, check(56, ok))));
      if (legacyO > 0) {
        const xo = pop(early(b.problem) + 0.35);
        add(div({ position: 'absolute', left: OUT.x + OUT.w - 30, top: OUT.y - 22, opacity: 1 - s([[b.powerful - 0.1, 0], [b.powerful + 0.2, 1]]) }, cross(56, xo)));
      }
    }
    // Route: three model chips
    {
      const models = [['Table model', '▦', b.tables, PINK], ['Vision model', '◔', b.charts, VIOLET], ['OCR model', 'Aa', b.scans, BLUEB]];
      models.forEach(([label, g, t, col], i) => {
        const o = pop(early(t), 0.45) * fout(C.Trace - 0.2, 0.3);
        if (o <= 0) return;
        const ok = pop(early(b.right) + i * 0.08, 0.4);
        add(div({ position: 'absolute', left: 1260, top: 380 + i * 175, width: 440, height: 120, ...card, borderRadius: 24, display: 'flex', alignItems: 'center', gap: 22, padding: '0 26px',
          opacity: clamp01(o), transform: `translateX(${(1 - clamp01(o)) * 30}px)` },
          glyph(g, 64, col) + div({ flex: 1, font: `600 30px ${SANS}`, color: th.ink, whiteSpace: 'nowrap' }, label) + check(44, ok * fout(C.Trace - 0.2, 0.3))));
      });
    }
    // Trace: structured JSON with a highlighted value
    {
      const o = win(early(b.traces), C.Bench - 0.3, 0.45, 0.35);
      if (o > 0) {
        const hv = fin(b.value - 0.1, 0.3);
        const rows = [['"revenue"', '4.2M', true], ['"growth"', '18%'], ['"margin"', '31%'], ['"figure"', '"Fig. 2"'], ['"total"', '6.0M']];
        add(div(abs({ ...OUT, y: OUT.y + (1 - o) * 40 }, { ...card, opacity: o, overflow: 'hidden' }),
          div({ height: 64, borderBottom: `1px solid ${th.line}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px' }, winDots() +
            div({ marginLeft: 12, font: `600 24px ${MONO}`, color: th.ink }, 'result.json')) +
          div({ position: 'absolute', left: 28, top: 92, right: 28, display: 'flex', flexDirection: 'column', gap: 10, font: `500 26px ${MONO}` },
            rows.map(([k, v, hot], i) => { const rp = fin(b.traces + i * 0.08, 0.3);
              return div({ height: 64, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', opacity: rp,
                background: hot ? mix(GREEN, 12 * hv, th.card) : 'transparent', border: `2px solid ${hot ? mix(GREEN, 70 * hv, th.card) : 'transparent'}`, boxSizing: 'border-box' },
                div({ color: VIOLET }, k) + div({ color: th.sub }, ':') + div({ color: hot ? th.ink : th.ink, fontWeight: 600 }, v) +
                (hot ? div({ marginLeft: 'auto', font: `600 20px ${SANS}`, color: GREEN, opacity: fin(b.source, 0.3), whiteSpace: 'nowrap' }, 'p.1 · table') : '')); }).join(''))));
      }
    }

    // ---------- Personal: stamp
    {
      const o = pop(early(b.personally), 0.5) * fout(C.Route - 0.3, 0.3);
      if (o > 0) add(stamp('Took it personally', o, 1180, 880, GRAD, -5, '!'));
    }

    // ======================= BENCH =======================
    {
      const o = win(early(b.benchmark), C.Code - 0.3, 0.45, 0.4);
      if (o > 0) {
        // accuracy leaderboard: hero climbs from rank 4 → 1 on "top"
        const climb = s([[b.top - 0.3, 0], [b.top + 0.4, 1, 'draw']]);
        const heroBar = s([[b.benchmark + 0.3, 0.6], [b.top + 0.4, 0.94, 'draw']]);
        const others = [0.82, 0.76, 0.7, 0.58];
        const A = { x: 170, y: 330, w: 820, h: 560 };
        const rowY = (rank) => 110 + rank * 86;
        let rows = '';
        others.forEach((v, i) => {
          const rank = i < 3 ? i + climb : 4; // others shift down one as the hero passes them
          const r = rank;
          rows += div({ position: 'absolute', left: 36, right: 36, top: rowY(r), height: 64, display: 'flex', alignItems: 'center', gap: 18, opacity: fin(b.benchmark + 0.1 + i * 0.07, 0.3) },
            div({ width: 36, font: `600 26px ${MONO}`, color: th.sub }, `${Math.round(rank) + 1}`) + skel(150, mix(th.ink, 12, th.card), 16) +
            div({ flex: 1, minWidth: 0, height: 16, borderRadius: 8, background: mix(th.ink, 6, th.card) }, div({ width: `${v * 100}%`, height: '100%', borderRadius: 8, background: mix(th.ink, 26, th.card) })));
        });
        const heroRank = 3 * (1 - climb);
        rows += div({ position: 'absolute', left: 22, right: 22, top: rowY(heroRank) - 10, height: 84, borderRadius: 20, border: `2px solid ${mix(VIOLET, 60, th.card)}`, background: mix(VIOLET, 6, th.card),
          display: 'flex', alignItems: 'center', gap: 18, padding: '0 14px', boxSizing: 'border-box', opacity: fin(b.benchmark + 0.35, 0.3),
          transform: `scale(${1 + 0.04 * Math.sin(Math.PI * clamp01((T - b.top - 0.4) / 0.4))})` },
          div({ width: 36, font: `600 26px ${MONO}`, color: VIOLET }, `${Math.round(heroRank) + 1}`) +
          div({ width: 150, display: 'flex', alignItems: 'center', gap: 10, font: `600 24px ${SANS}`, color: th.ink, whiteSpace: 'nowrap' }, brandDot(12) + 'LlamaParse') +
          div({ flex: 1, minWidth: 0, height: 16, borderRadius: 8, background: mix(th.ink, 6, th.card) }, div({ width: `${heroBar * 100}%`, height: '100%', borderRadius: 8, background: GRAD })));
        add(div(abs({ ...A, y: A.y + (1 - o) * 40, r: 26 }, { ...card, opacity: o, overflow: 'hidden' }),
          div({ position: 'absolute', left: 36, top: 30, display: 'flex', alignItems: 'center', gap: 16 }, glyph('%', 50) + div({ font: `600 32px ${SANS}`, color: th.ink }, 'Accuracy')) +
          div({ position: 'absolute', right: 30, top: 34, height: 44, padding: '0 16px', borderRadius: 22, border: `1px solid ${th.line}`, ...flexC, font: `500 22px ${SANS}`, color: th.sub, whiteSpace: 'nowrap' }, 'Open benchmark') +
          rows));
        // crown / #1 stamp
        const one = pop(b.top + 0.35, 0.45);
        add(div({ position: 'absolute', left: A.x + A.w - 70, top: A.y + rowY(0) - 40, width: 100, height: 56, borderRadius: 28, background: GRAD, color: '#fff', ...flexC, font: `700 28px ${SANS}`,
          opacity: clamp01(one) * o, transform: `rotate(-6deg) scale(${0.4 + 0.6 * one})`, boxShadow: th.shadow }, '#1'));
        // cost bars
        const co = win(early(b.fraction) - 0.3, C.Code - 0.3, 0.45, 0.4);
        const shrink = s([[b.fraction - 0.1, 0.78], [b.cost + 0.3, 0.13, 'draw']]);
        const B = { x: 1060, y: 330, w: 690, h: 560 };
        const bars = [0.86, 0.7, 0.95, 0.62];
        add(div(abs({ ...B, y: B.y + (1 - co) * 40, r: 26 }, { ...card, opacity: co, overflow: 'hidden' }),
          div({ position: 'absolute', left: 36, top: 30, display: 'flex', alignItems: 'center', gap: 16 }, glyph('$', 50, PINK) + div({ font: `600 32px ${SANS}`, color: th.ink }, 'Cost')) +
          div({ position: 'absolute', left: 50, right: 50, bottom: 60, height: 360, display: 'flex', alignItems: 'flex-end', gap: 34, borderBottom: `2px solid ${th.line}` },
            bars.map((v) => div({ flex: 1, height: `${v * 100}%`, borderRadius: '12px 12px 0 0', background: mix(th.ink, 16, th.card) })).join('') +
            div({ flex: 1.2, height: `${shrink * 100}%`, borderRadius: '12px 12px 0 0', background: GRAD, position: 'relative' },
              div({ position: 'absolute', left: '50%', top: -58, transform: 'translateX(-50%)', whiteSpace: 'nowrap', font: `600 22px ${SANS}`, color: VIOLET, opacity: fin(b.cost + 0.2, 0.3), display: 'flex', alignItems: 'center', gap: 8 }, brandDot(10) + 'LlamaParse')))));
      }
    }

    // ======================= OFFER: code ticket + three perks =======================
    {
      const o = win(early(b.code), C.Link - 0.3, 0.45, 0.4);
      if (o > 0) {
        const code = 'SUMMERGIFT26';
        const typed = Math.floor(clamp01((T - (b.gift - 0.05)) / 1.3) * code.length);
        const copied = T > b.gift + 1.5;
        const cp = pop(b.gift + 1.5, 0.35);
        const K = { x: 460, y: 340, w: 1000, h: 190 };
        const caret = typed < code.length && Math.floor(T * 2.6) % 2 === 0;
        add(div(abs({ ...K, y: K.y + (1 - o) * 40, r: 28 }, { ...card, opacity: o, overflow: 'hidden', display: 'flex' }),
          div({ width: 200, background: GRAD, ...flexC, color: '#fff', font: `700 64px ${SANS}`, flexShrink: 0 }, '%') +
          div({ width: 0, borderLeft: `4px dashed ${th.line}`, margin: '18px 0' }) +
          div({ flex: 1, display: 'flex', alignItems: 'center', padding: '0 44px', gap: 24 },
            div({ flex: 1, font: `600 68px ${MONO}`, letterSpacing: '0.02em', color: th.ink, whiteSpace: 'nowrap' },
              code.slice(0, typed) + `<span style="color:${VIOLET};opacity:${caret ? 1 : 0}">|</span>`) +
            div({ height: 64, padding: '0 24px', borderRadius: 32, background: copied ? GREEN : th.dark, color: '#fff', ...flexC, gap: 10, font: `600 24px ${SANS}`, whiteSpace: 'nowrap',
              transform: `scale(${1 + 0.08 * Math.sin(Math.PI * clamp01((T - b.gift - 1.5) / 0.35))})`, opacity: fin(b.gift + 0.4, 0.3) }, copied ? '✓ Copied' : 'Copy'))));
        const cardsY = 580;
        const cw = 400, gap = 40, x0 = 960 - (3 * cw + 2 * gap) / 2;
        const perk = (i, t, inner) => { const po = pop(early(t), 0.45) * o; if (po <= 0) return;
          add(div({ position: 'absolute', left: x0 + i * (cw + gap), top: cardsY + (1 - clamp01(po)) * 40, width: cw, height: 330, ...card, borderRadius: 26, opacity: clamp01(po), padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }, inner)); };
        // $250 credits
        const n = Math.round(250 * s([[b.usd, 0], [b.usd + 1.0, 1, 'draw']]));
        perk(0, b.usd, glyph('$', 60, GREEN) + div({ font: `600 108px ${SANS}`, letterSpacing: '-0.05em', color: th.ink, lineHeight: 1 }, `$${n}`) +
          div({ font: `500 28px ${SANS}`, color: th.sub, opacity: fin(b.credits - 0.1) }, 'Free credits'));
        // 50% off × 3 months
        const m = [0, 1, 2].map((i) => fin(b.three - 0.1 + i * 0.15, 0.35));
        perk(1, b.half, div({ font: `600 108px ${SANS}`, letterSpacing: '-0.05em', lineHeight: 1, ...gradText }, '50%') +
          div({ display: 'flex', gap: 14 }, m.map((k, i) => div({ flex: 1, height: 88, borderRadius: 16, border: `2px solid ${th.line}`, position: 'relative', overflow: 'hidden', ...flexC, font: `600 22px ${MONO}`, color: th.sub },
            div({ position: 'absolute', left: 0, bottom: 0, width: '100%', height: `${50 * k}%`, background: mix(VIOLET, 22, th.card) }) + div({ position: 'relative' }, `M${i + 1}`))).join('')) +
          div({ font: `500 28px ${SANS}`, color: th.sub }, 'Off 3 months'));
        // 30-day window
        const ring = s([[b.upgrade - 0.1, 0], [b.days + 0.5, 1, 'draw']]);
        const R = 70, circ = 2 * Math.PI * R;
        perk(2, b.upgrade - 0.2, div({ display: 'flex', alignItems: 'center', gap: 26 },
          `<svg width="170" height="170" viewBox="0 0 170 170" style="flex-shrink:0"><circle cx="85" cy="85" r="${R}" fill="none" stroke="${th.line}" stroke-width="14"/>` +
          `<circle cx="85" cy="85" r="${R}" fill="none" stroke="${VIOLET}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - ring)}" transform="rotate(-90 85 85)"/>` +
          `<text x="85" y="100" text-anchor="middle" font-family="Geist, sans-serif" font-weight="600" font-size="46" fill="${th.ink}">${Math.round(30 * ring)}</text></svg>` +
          div({ font: `600 40px ${SANS}`, color: th.ink, lineHeight: 1.1, letterSpacing: '-0.02em' }, 'Days')) +
          div({ display: 'flex', alignItems: 'center', gap: 12, font: `500 28px ${SANS}`, color: th.sub }, div({ color: VIOLET, font: `700 28px ${SANS}` }, '↑') + 'To upgrade'));
      }
    }

    // ======================= LINK: description box =======================
    {
      const o = win(early(b.check), C.Team - 0.3, 0.45, 0.4);
      if (o > 0) {
        const D = { x: 460, y: 340, w: 1000, h: 540 };
        const lk = fin(b.first - 0.1, 0.35);
        const click = clamp01((T - (b.link + 0.25)) / 0.5);
        // cursor path
        const cx = s([[b.check + 0.2, 1560], [b.link + 0.2, D.x + 560, 'draw']]), cy = s([[b.check + 0.2, 960], [b.link + 0.2, D.y + 175, 'draw']]);
        add(div(abs({ ...D, y: D.y + (1 - o) * 40, r: 26 }, { ...card, opacity: o, overflow: 'hidden' }),
          div({ height: 68, borderBottom: `1px solid ${th.line}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px' }, winDots() +
            div({ marginLeft: 12, font: `600 26px ${SANS}`, color: th.ink }, 'Description') + div({ marginLeft: 'auto', color: th.sub, font: `600 28px ${SANS}`, transform: `translateY(${4 * Math.sin(T * 4)}px)`, opacity: fin(b.below - 0.1) }, '↓')) +
          div({ position: 'absolute', left: 50, top: 112, right: 50, display: 'flex', flexDirection: 'column', gap: 26 },
            div({ height: 92, borderRadius: 20, padding: 3, background: lk > 0 ? GRAD : th.line, boxSizing: 'border-box', transform: `scale(${1 - 0.03 * Math.sin(Math.PI * click)})` },
              div({ height: '100%', borderRadius: 17, background: th.card, display: 'flex', alignItems: 'center', gap: 20, padding: '0 24px' },
                div({ width: 50, height: 50, borderRadius: 14, background: GRAD, color: '#fff', ...flexC, font: `700 26px ${SANS}` }, '↗') +
                div({ font: `600 32px ${SANS}`, color: th.ink, whiteSpace: 'nowrap' }, 'LlamaParse') + div({ font: `500 24px ${SANS}`, color: th.sub, whiteSpace: 'nowrap' }, '· first link') +
                div({ marginLeft: 'auto' }, check(46, pop(b.link + 0.45, 0.4))))) +
            [88, 70, 82, 54, 76].map((w) => skel(`${w}%`, mix(th.ink, 10, th.card), 16)).join(''))));
        const co = o * fin(b.check + 0.1, 0.3);
        add(`<svg width="1920" height="1080" style="position:absolute;left:0;top:0;opacity:${co}">` +
          (click > 0 && click < 1 ? `<circle cx="${cx}" cy="${cy}" r="${10 + 40 * click}" fill="none" stroke="${VIOLET}" stroke-width="4" opacity="${1 - click}"/>` : '') +
          `<path transform="translate(${cx},${cy}) scale(1.6)" d="M0,0 L0,24 L6.5,18 L11,28 L15,26 L10.5,16.5 L19,16.5 Z" fill="${th.ink}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
      }
    }

    // ======================= TEAM =======================
    {
      const o = win(early(b.support), C.October - 0.3, 0.45, 0.4);
      if (o > 0) {
        const jo = pop(early(b.jerry2), 0.5);
        add(div({ position: 'absolute', left: 960 - 120, top: 360, width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, opacity: o * clamp01(jo), transform: `scale(${0.6 + 0.4 * jo})` },
          person(220, 7) + div({ font: `600 42px ${SANS}`, color: th.ink, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }, 'Jerry Liu')));
        const TEAM = [[540, 350], [430, 560], [560, 760], [1380, 350], [1490, 560], [1360, 760]];
        TEAM.forEach(([px, py], i) => {
          const po = pop(early(b.team) + i * 0.07, 0.4);
          add(div({ position: 'absolute', left: px - 60, top: py - 60, opacity: o * clamp01(po), transform: `scale(${0.4 + 0.6 * po})` }, person(120, 4, mix(VIOLET, 35, th.card))));
        });
        const so = pop(b.team + 0.6, 0.5);
        add(stamp('Go support', so * o, 960 - 150, 820, GRAD, -4, '♥'));
      }
    }

    // ======================= OCTOBER =======================
    {
      const o = win(early(b.whole) - 0.2, C.Outro - 0.25, 0.45, 0.35);
      if (o > 0) {
        const K = { x: 560, y: 335, w: 800, h: 600 };
        const hdr = fin(early(b.october), 0.35);
        let cells = '';
        const offset = 3; // Oct 1 2026 is a Thursday (Mon-first grid)
        for (let i = 0; i < 35; i++) {
          const d = i - offset + 1;
          const valid = d >= 1 && d <= 31;
          const k = valid ? fin(b.october + 0.1 + d * 0.028, 0.25) : 0;
          cells += div({ height: 64, borderRadius: 14, ...flexC, font: `500 24px ${MONO}`, color: valid ? (k > 0.5 ? '#fff' : th.sub) : 'transparent',
            background: valid ? (k > 0 ? mix(VIOLET, 20 + 60 * k, th.card) : mix(th.ink, 5, th.card)) : 'transparent' }, valid ? d : '');
        }
        add(div(abs({ ...K, y: K.y + (1 - o) * 40, r: 28 }, { ...card, opacity: o, padding: 36 }),
          div({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 },
            div({ font: `600 48px ${SANS}`, letterSpacing: '-0.03em', color: th.ink, opacity: hdr, transform: `translateY(${(1 - hdr) * 12}px)` }, 'October') +
            div({ height: 48, padding: '0 20px', borderRadius: 24, background: mix(VIOLET, 14), color: VIOLET, ...flexC, font: `600 22px ${MONO}`, opacity: fin(b.month - 0.1) }, 'SUMMERGIFT26')) +
          div({ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }, ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x) => div({ ...flexC, font: `600 20px ${SANS}`, color: th.sub, height: 30 }, x)).join('') + cells)));
        const allO = pop(b.month + 0.2, 0.45) * fout(C.Outro - 0.3, 0.3);
        add(stamp('All month', allO, K.x + K.w - 150, K.y + K.h - 40, GRAD, -5, '✓'));
      }
    }

    // ======================= THREAD PILL =======================
    {
      const pr = rectAt(T, [
        [0, PAUSE], [b.sponsor - 0.2, PAUSE], [b.sponsor + 0.35, SPONSOR, 'draw'],
        [b.llamaindex - 0.25, SPONSOR], [b.llamaindex + 0.3, LI_BIG, 'draw'],
        [early(b.rag) - 0.25, LI_BIG], [early(b.rag) + 0.3, HUB, 'draw'],
        [b.jerry - 0.3, HUB], [b.jerry + 0.3, TOP, 'draw'],
        [b.llamaparse - 0.35, TOP], [b.llamaparse + 0.25, BIG, 'draw'],
        [b.episode - 0.3, BIG], [b.episode + 0.35, TOP, 'draw'],
        [b.built - 0.2, TOP], [b.built + 0.4, MID, 'draw'],
        [C.Bench - 0.35, MID], [C.Bench + 0.25, TOP, 'draw'],
        [b.back - 0.35, TOP], [b.back + 0.25, PAUSE, 'draw'],
      ]);
      const appear = pop(early(b.interruption), 0.45);
      const gone = fout(b.video + 0.25, 0.35);
      const o = clamp01(appear) * gone;
      if (o > 0) {
        const lyPause = fout(b.sponsor - 0.2, 0.2);
        const lyPlay = fin(b.back - 0.15, 0.25);
        const lySponsor = fin(b.sponsor, 0.25) * fout(b.llamaindex - 0.25, 0.2);
        const lyBrand = fin(b.llamaindex - 0.05, 0.3) * fout(b.back - 0.35, 0.2);
        const suffix = s([[b.llamaparse - 0.1, 0], [b.llamaparse + 0.35, 1, 'draw']]);
        const fs = pr.h * 0.42;
        const pulse = 1 + 0.05 * Math.sin(Math.PI * clamp01((T - b.built - 0.4) / 0.4)) + 0.04 * Math.sin(Math.PI * clamp01((T - b.right) / 0.4));
        const glow = win(b.built + 0.4, C.Bench - 0.3, 0.3) * (0.5 + 0.5 * Math.sin(T * 3));
        add(div(abs(pr, { background: th.dark, border: `1px solid ${th.darkLine}`, boxShadow: `${th.shadow}${glow > 0 ? `, 0 0 ${30 + 20 * glow}px ${mix(VIOLET, 45 * glow)}` : ''}`,
          overflow: 'hidden', opacity: o, transform: `scale(${(T < b.sponsor ? 0.5 + 0.5 * appear : 1) * pulse})` }),
          div({ ...FILL, ...flexC, gap: 16, opacity: lyPause }, div({ width: 16, height: 54, borderRadius: 5, background: th.darkInk }) + div({ width: 16, height: 54, borderRadius: 5, background: th.darkInk })) +
          div({ ...FILL, ...flexC, opacity: lyPlay }, div({ width: 0, height: 0, borderTop: '30px solid transparent', borderBottom: '30px solid transparent', borderLeft: `48px solid ${th.darkInk}`, marginLeft: 12 })) +
          div({ ...FILL, ...flexC, gap: 16, opacity: lySponsor, font: `600 ${fs}px ${SANS}`, color: th.darkInk, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }, brandDot(18) + 'Sponsor') +
          div({ ...FILL, ...flexC, gap: fs * 0.38, opacity: lyBrand, font: `600 ${fs}px ${SANS}`, color: th.darkInk, letterSpacing: '-0.03em', whiteSpace: 'nowrap' },
            brandDot(fs * 0.5) + div({ display: 'flex', alignItems: 'center' }, 'Llama' + roller([gradSpan('Index'), gradSpan('Parse')], suffix, fs * 1.25, {})))));
      }
    }

    // ======================= CHROME: kicker + source chip =======================
    {
      const KICK = [
        [b.quick, b.sponsor - 0.2, 'Quick interruption'],
        [b.sponsor, C.Rag - 0.25, 'Today’s sponsor'],
        [C.Rag, C.Parse - 0.25, 'Back in 2023'],
        [C.Parse, C.Pdfs - 0.25, 'Now: LlamaParse'],
        [C.Pdfs, C.Pipeline - 0.25, 'PDFs: still a problem'],
        [C.Pipeline, C.Route - 0.25, 'Problem, solved'],
        [C.Route, C.Bench - 0.25, 'How it works'],
        [C.Bench, C.Code - 0.25, 'Open benchmark'],
        [C.Code, C.Link - 0.25, 'Your offer'],
        [C.Link, C.Team - 0.25, 'First link below'],
        [C.Team, C.October - 0.25, 'Support the team'],
        [C.October, C.Outro - 0.25, 'Valid all October'],
        [C.Outro, END + 1, 'Back to the video'],
      ];
      const xf = (a, c) => s([[a, 0], [a + 0.35, 1]]) * s([[c, 1], [c + 0.25, 0]]);
      add(div({ position: 'absolute', left: 110, top: 84, display: 'flex', alignItems: 'center', gap: 20, opacity: fin(0.1, 0.35) },
        div({ padding: '8px 16px', borderRadius: 10, background: th.ink, color: th.bg, font: `600 22px ${SANS}`, letterSpacing: '0.12em', whiteSpace: 'nowrap' }, 'SPONSOR') +
        div({ position: 'relative', height: 40, width: 900 }, KICK.map(([a, c, txt]) => { const k = xf(a, c); return k <= 0 ? '' :
          div({ position: 'absolute', left: 0, top: 0, font: `500 30px ${SANS}`, color: th.ink, whiteSpace: 'nowrap', opacity: k, transform: `translateY(${(1 - k) * 12}px)` }, txt); }).join(''))));
      add(div(abs({ x: 1500, y: 76, w: 310, h: 60, r: 30 }, { ...card, ...flexC, gap: 12, font: `500 22px ${SANS}`, color: th.ink, whiteSpace: 'nowrap', opacity: fin(0.4, 0.4) }),
        brandDot(12) + 'llamaindex.ai'));
    }

    out.push('</div>');
    return out.join('');
  }

  window.PIECE = { render, END, W: 1920, H: 1080 };
})();
