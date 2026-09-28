// Script → word timing (no VO yet: ~2.7 spoken words/sec, pauses at punctuation).
(function (root) {
  const SCRIPT = [
    ['Intro',     "Quick interruption from my future self to present you a very nice sponsor for this video and one that I had on the podcast a few years ago, LlamaIndex."],
    ['Rag',       "Yes, the very same RAG framework where I had Jerry Liu, the founder, on my podcast in 2023."],
    ['Parse',     "Except now it's all about LlamaParse, their agentic OCR."],
    ['Pdfs',      "In the episode I recorded with Jerry, I told him that PDFs would remain a problem for a very long time,"],
    ['Pipeline',  "and now they built the most powerful OCR pipeline I've ever seen."],
    ['Personal',  "I guess they might have took that a bit personally."],
    ['Route',     "LlamaParse sends tables, charts, and scans to the right model"],
    ['Trace',     "and then traces every value back to its source."],
    ['Bench',     "On their open benchmark, it comes out on top for a fraction of the cost."],
    ['Code',      "Use the code SUMMERGIFT26 for $250 in free credits"],
    ['Discount',  "and half off your first three months of subscription if you upgrade within 30 days."],
    ['Link',      "Check out LlamaParse with the first link in the description below,"],
    ['Team',      "and go support my friend Jerry Liu and his amazing team."],
    ['October',   "The offer stands for the whole October month."],
    ['Outro',     "Now, let's get back to the video."],
  ];
  // spoken length in "words" for tokens read out long
  const SPOKEN = { 'SUMMERGIFT26': 4, '$250': 4, '2023': 3, 'LlamaIndex': 2, 'LlamaParse': 2, 'OCR': 2, 'RAG': 1.3, "I've": 1, 'interruption': 1.6, 'subscription': 1.4, 'description': 1.4, 'personally': 1.3, 'benchmark': 1.2 };
  const WPS = 2.7, LEAD = 0.6, HOLD = 1.1;
  const words = [];      // {s, w, t}
  const cues = {};       // scene name -> start
  let t = LEAD;
  SCRIPT.forEach(([name, text], si) => {
    cues[name] = t;
    text.split(/\s+/).forEach((raw) => {
      const w = raw.replace(/[.,!?]+$/, '');
      words.push({ s: name, w, t });
      t += (SPOKEN[w] || 1) / WPS;
      if (/,$/.test(raw)) t += 0.18;
      if (/[.!?]$/.test(raw)) t += 0.42;
    });
    if (/,$/.test(text)) t += 0.05;
  });
  const lastWord = t - 0.42;
  const total = +(lastWord + HOLD).toFixed(2);
  // W('Scene', 'word', n) → time the n-th occurrence (0-based) of word starts within that scene
  function W(scene, word, n = 0) {
    const hits = words.filter((x) => x.s === scene && x.w.toLowerCase() === word.toLowerCase());
    if (!hits[n]) throw new Error(`timing: "${word}" not in ${scene}`);
    return hits[n].t;
  }
  root.TIMING = { SCRIPT, words, cues, total, lastWord, W };
  if (typeof module !== 'undefined') module.exports = root.TIMING;
})(typeof window !== 'undefined' ? window : globalThis);
