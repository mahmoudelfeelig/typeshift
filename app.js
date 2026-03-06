const STORAGE_CUSTOM = "typeshift.customWords";
const STORAGE_BEST = "typeshift.bestScores";
const LARGE_DICTIONARY_PATH = "data/english-2-12.txt";
const LARGE_DICTIONARY_LIMIT = 50000;

const MODE_INFO = {
  time: "Time Trial: push max WPM before countdown reaches zero.",
  quote: "Quote Rush: finish the full passage with clean accuracy.",
  meteor: "Meteor: shoot down falling words before your hull breaks.",
  zen: "Zen Flow: no timer, no pressure, just sustained rhythm.",
};

const QUOTES = [
  "Fast hands are built from calm repetition and clear focus.",
  "Precision first speed second then both become one habit.",
  "The keyboard rewards rhythm more than panic.",
  "Every perfect line starts as one intentional keystroke.",
  "You do not chase flow state you type your way into it.",
  "Practice makes progress visible before it makes it impressive.",
  "Keep your shoulders loose and your thoughts ahead of your fingers.",
];

const DICTIONARIES = {
  core: [
    "planet",
    "signal",
    "stream",
    "random",
    "orange",
    "breeze",
    "canvas",
    "border",
    "flight",
    "pixel",
    "silver",
    "neon",
    "object",
    "motion",
    "forest",
    "mirror",
    "chamber",
    "corner",
    "rocket",
    "vector",
    "engine",
    "galaxy",
    "crystal",
    "future",
    "window",
    "anchor",
    "velvet",
    "station",
    "memory",
    "fusion",
    "marble",
    "sunset",
    "vertex",
    "photon",
    "summit",
    "thunder",
    "module",
    "harbor",
    "vessel",
    "ladder",
  ],
  tech: [
    "latency",
    "runtime",
    "dataset",
    "async",
    "kernel",
    "virtual",
    "interface",
    "feature",
    "database",
    "package",
    "network",
    "sandbox",
    "compiler",
    "syntax",
    "pointer",
    "routing",
    "terminal",
    "cluster",
    "payload",
    "request",
    "session",
    "storage",
    "iterator",
    "backend",
    "frontend",
    "websocket",
    "render",
    "protocol",
    "service",
    "monitor",
    "thread",
    "cache",
    "engineer",
    "binary",
    "function",
    "library",
    "pipeline",
    "testing",
    "release",
    "refactor",
  ],
  myth: [
    "dragon",
    "oracle",
    "artifact",
    "griffin",
    "labyrinth",
    "ember",
    "spellbound",
    "citadel",
    "warden",
    "whisper",
    "phoenix",
    "moonstone",
    "relic",
    "shadow",
    "tempest",
    "voyager",
    "goblet",
    "rune",
    "myriad",
    "arcane",
    "starlight",
    "titan",
    "voyage",
    "mythic",
    "enchanted",
    "kingdom",
    "prophecy",
    "legend",
    "scepter",
    "sorcery",
    "dungeon",
    "mystic",
    "fable",
    "sentinel",
    "beacon",
    "vortex",
    "specter",
    "cascade",
    "astral",
  ],
  blitz: [
    "dash",
    "zip",
    "flash",
    "drift",
    "boost",
    "snap",
    "clutch",
    "phase",
    "blink",
    "crank",
    "flux",
    "shock",
    "rally",
    "flick",
    "press",
    "burst",
    "pivot",
    "whip",
    "glide",
    "spark",
    "storm",
    "kick",
    "smash",
    "vault",
    "hyper",
    "quick",
    "draft",
    "chase",
    "drive",
    "streak",
    "blast",
    "scope",
    "shift",
    "slice",
    "swerve",
    "turbo",
    "trace",
    "rush",
    "rapid",
    "thrust",
  ],
};

function byId(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing required element #${id}`);
  }
  return el;
}

const ui = {
  modeCards: [...document.querySelectorAll(".mode-card")],
  modeCaption: byId("mode-caption"),
  modeChip: byId("mode-chip"),
  phaseLabel: byId("phase-label"),
  timerLabel: byId("timer-label"),
  promptZone: byId("prompt-zone"),
  meteorZone: byId("meteor-zone"),
  typeInput: byId("type-input"),
  startBtn: byId("start-btn"),
  restartBtn: byId("restart-btn"),
  newSeedBtn: byId("new-seed-btn"),
  durationSelect: byId("duration-select"),
  dictionaryPack: byId("dictionary-pack"),
  optPunctuation: byId("opt-punctuation"),
  optNumbers: byId("opt-numbers"),
  optLowercase: byId("opt-lowercase"),
  optCustomOnly: byId("opt-custom-only"),
  customWords: byId("custom-words"),
  saveCustomBtn: byId("save-custom-btn"),
  clearCustomBtn: byId("clear-custom-btn"),
  customStatus: byId("custom-status"),
  report: byId("session-report"),
  statWpm: byId("stat-wpm"),
  statRaw: byId("stat-raw"),
  statAcc: byId("stat-acc"),
  statStreak: byId("stat-streak"),
  statErrors: byId("stat-errors"),
  statLives: byId("stat-lives"),
};

const state = {
  mode: "time",
  status: "idle",
  settings: {
    duration: 60,
    punctuation: false,
    numbers: false,
    lowercase: false,
    customOnly: false,
  },
  selectedPack: "core",
  customDictionary: [],
  bestScores: {},
  activePool: [],
  externalWords: [],

  promptWords: [],
  quoteWords: [],
  wordResults: [],
  currentIndex: 0,

  visibleStart: 0,
  visibleEnd: 0,
  visibleEls: new Map(),
  previewRaf: 0,
  pendingPreviewValue: "",
  lastPreviewValue: "",

  startTime: 0,
  finishTime: 0,
  hudRaf: 0,
  lastHudPaint: 0,

  correctChars: 0,
  wrongChars: 0,
  rawChars: 0,
  errors: 0,
  streak: 0,
  maxStreak: 0,

  meteorWords: [],
  meteorLives: 5,
  meteorId: 0,
  meteorSpawnClock: 0,
  meteorRaf: 0,
  meteorLastTs: 0,
  meteorLockRaf: 0,
  meteorPendingInput: "",
  meteorLastLockInput: "",
  meteorLockedId: null,
};

init();

function init() {
  loadLocalState();
  bindEvents();
  syncSettingsFromInputs();
  setMode("time");
  hydrateLargeDictionary();
}

function bindEvents() {
  ui.modeCards.forEach((card) => {
    card.addEventListener("click", () => {
      setMode(card.dataset.mode || "time");
    });
  });

  ui.durationSelect.addEventListener("change", () => {
    state.settings.duration = Number(ui.durationSelect.value);
    if ((state.mode === "time" || state.mode === "meteor") && state.status !== "running") {
      ui.timerLabel.textContent = `${state.settings.duration}s`;
    }
  });

  ui.dictionaryPack.addEventListener("change", () => {
    state.selectedPack = ui.dictionaryPack.value;
    resetSession(true);
  });

  ui.optPunctuation.addEventListener("change", () => {
    state.settings.punctuation = ui.optPunctuation.checked;
    resetSession(true);
  });

  ui.optNumbers.addEventListener("change", () => {
    state.settings.numbers = ui.optNumbers.checked;
    resetSession(true);
  });

  ui.optLowercase.addEventListener("change", () => {
    state.settings.lowercase = ui.optLowercase.checked;
    resetSession(true);
  });

  ui.optCustomOnly.addEventListener("change", () => {
    state.settings.customOnly = ui.optCustomOnly.checked;
    resetSession(true);
  });

  ui.saveCustomBtn.addEventListener("click", saveCustomDictionary);
  ui.clearCustomBtn.addEventListener("click", clearCustomDictionary);

  ui.startBtn.addEventListener("click", () => {
    if (state.status !== "running") {
      startSession();
    }
    ui.typeInput.focus();
  });

  ui.restartBtn.addEventListener("click", () => {
    resetSession(true);
    ui.typeInput.focus();
  });

  ui.newSeedBtn.addEventListener("click", () => {
    resetSession(true);
    ui.typeInput.focus();
  });

  ui.typeInput.addEventListener("keydown", onInputKeyDown);
  ui.typeInput.addEventListener("input", onInputChange, { passive: true });
}

function loadLocalState() {
  try {
    const rawCustom = localStorage.getItem(STORAGE_CUSTOM);
    if (rawCustom) {
      const parsed = JSON.parse(rawCustom);
      if (Array.isArray(parsed)) {
        state.customDictionary = parsed.filter(Boolean);
      }
    }
  } catch (_error) {
    state.customDictionary = [];
  }

  try {
    const rawBest = localStorage.getItem(STORAGE_BEST);
    if (rawBest) {
      const parsed = JSON.parse(rawBest);
      if (parsed && typeof parsed === "object") {
        state.bestScores = parsed;
      }
    }
  } catch (_error) {
    state.bestScores = {};
  }
}

function syncSettingsFromInputs() {
  ui.durationSelect.value = String(state.settings.duration);
  ui.dictionaryPack.value = state.selectedPack;
  ui.optPunctuation.checked = state.settings.punctuation;
  ui.optNumbers.checked = state.settings.numbers;
  ui.optLowercase.checked = state.settings.lowercase;
  ui.optCustomOnly.checked = state.settings.customOnly;
  ui.customWords.value = state.customDictionary.join("\n");
}

function saveCustomDictionary() {
  const words = splitWords(ui.customWords.value);
  state.customDictionary = words;
  localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(words));
  ui.customStatus.textContent = `Saved ${words.length} custom words.`;
  resetSession(true);
}

function clearCustomDictionary() {
  state.customDictionary = [];
  ui.customWords.value = "";
  localStorage.setItem(STORAGE_CUSTOM, JSON.stringify([]));
  ui.customStatus.textContent = "Custom dictionary cleared.";
  resetSession(true);
}

async function hydrateLargeDictionary() {
  try {
    const response = await fetch(LARGE_DICTIONARY_PATH, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Dictionary fetch failed: ${response.status}`);
    }

    const raw = await response.text();
    const words = [...new Set(raw.split(/\r?\n/).map((word) => word.trim().toLowerCase()))]
      .filter((word) => /^[a-z]{2,12}$/.test(word))
      .slice(0, LARGE_DICTIONARY_LIMIT);

    if (!words.length) {
      return;
    }

    state.externalWords = words;
    ui.customStatus.textContent = `Loaded large dictionary: ${words.length.toLocaleString()} words`;

    if (state.status !== "running") {
      resetSession(true);
    }
  } catch (_error) {
    ui.customStatus.textContent =
      "Large dictionary not available. Using built-in themed dictionaries.";
  }
}

function setMode(mode) {
  if (!MODE_INFO[mode]) {
    mode = "time";
  }
  state.mode = mode;

  ui.modeCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.mode === mode);
  });

  ui.modeCaption.textContent = MODE_INFO[mode];
  ui.modeChip.textContent = mode.toUpperCase();
  ui.report.classList.add("hidden");
  ui.phaseLabel.textContent = "Ready";

  const meteor = mode === "meteor";
  ui.promptZone.classList.toggle("hidden", meteor);
  ui.meteorZone.classList.toggle("hidden", !meteor);

  if (meteor) {
    ui.typeInput.placeholder = "Type a falling word then press space...";
  } else if (mode === "quote") {
    ui.typeInput.placeholder = "Replicate the quote exactly...";
  } else if (mode === "zen") {
    ui.typeInput.placeholder = "Flow without a timer...";
  } else {
    ui.typeInput.placeholder = "Type to start...";
  }

  resetSession(true);
}

function resetSession(newPrompt) {
  stopSessionLoops();
  clearMeteor();
  cancelPreviewFrame();

  state.status = "idle";
  state.currentIndex = 0;
  state.wordResults = [];
  state.startTime = 0;
  state.finishTime = 0;
  state.correctChars = 0;
  state.wrongChars = 0;
  state.rawChars = 0;
  state.errors = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.lastPreviewValue = "";
  state.visibleStart = 0;
  state.visibleEnd = 0;
  state.visibleEls.clear();
  state.meteorLives = 5;

  ui.typeInput.value = "";
  ui.report.classList.add("hidden");
  ui.phaseLabel.textContent = "Ready";

  if (newPrompt) {
    preparePrompt();
  }

  if (state.mode === "time" || state.mode === "meteor") {
    ui.timerLabel.textContent = `${state.settings.duration}s`;
  } else {
    ui.timerLabel.textContent = "∞";
  }

  if (state.mode === "meteor") {
    ui.promptZone.textContent = "";
  } else {
    renderPromptWindow(true);
  }
  updateStats();
}

function preparePrompt() {
  state.activePool = buildPool();

  if (state.mode === "quote") {
    let quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    if (!state.settings.punctuation) {
      quote = quote.replace(/[.,!?;:]/g, "");
    }
    if (state.settings.lowercase) {
      quote = quote.toLowerCase();
    }
    state.quoteWords = quote.split(/\s+/).filter(Boolean);
    state.promptWords = [];
    return;
  }

  state.quoteWords = [];
  state.promptWords = generateWords(state.mode === "zen" ? 260 : 220);
}

function startSession() {
  if (state.status === "running") {
    return;
  }
  state.status = "running";
  state.startTime = performance.now();
  state.finishTime = 0;
  ui.phaseLabel.textContent = "Live";
  ui.report.classList.add("hidden");

  state.lastHudPaint = 0;
  state.hudRaf = requestAnimationFrame(hudTick);

  if (state.mode === "meteor") {
    runMeteorLoop();
  }
}

function stopSessionLoops() {
  if (state.hudRaf) {
    cancelAnimationFrame(state.hudRaf);
    state.hudRaf = 0;
  }
  state.lastHudPaint = 0;
}

function hudTick(ts) {
  if (state.status !== "running") {
    return;
  }

  if (ts - state.lastHudPaint >= 60) {
    if (isTimedMode()) {
      const remain = Math.max(state.settings.duration - getElapsedSeconds(), 0);
      ui.timerLabel.textContent = `${remain.toFixed(1)}s`;
      if (remain <= 0) {
        endSession("Time up");
        return;
      }
    } else {
      ui.timerLabel.textContent = `${getElapsedSeconds().toFixed(1)}s`;
    }
    updateStats();
    state.lastHudPaint = ts;
  }

  state.hudRaf = requestAnimationFrame(hudTick);
}

function endSession(reason) {
  if (state.status !== "running") {
    return;
  }

  state.status = "finished";
  state.finishTime = performance.now();
  stopSessionLoops();
  clearMeteor();
  ui.phaseLabel.textContent = reason;

  const summary = buildSummary();
  persistBest(summary.wpm);
  renderReport(summary, reason);
  updateStats();
}

function persistBest(wpm) {
  const modeKey = state.mode;
  const prev = Number(state.bestScores[modeKey] || 0);
  if (wpm > prev) {
    state.bestScores[modeKey] = Number(wpm.toFixed(1));
    localStorage.setItem(STORAGE_BEST, JSON.stringify(state.bestScores));
  }
}

function renderReport(summary, reason) {
  const best = Number(state.bestScores[state.mode] || summary.wpm);
  ui.report.innerHTML = `
    <h3>Session Report</h3>
    <p>Result: ${escapeHtml(reason)}</p>
    <p>WPM: ${summary.wpm.toFixed(1)} | Raw: ${summary.raw.toFixed(1)}</p>
    <p>Accuracy: ${summary.acc.toFixed(1)}% | Errors: ${state.errors}</p>
    <p>Longest streak: ${state.maxStreak} | Best (${state.mode}): ${best.toFixed(1)} WPM</p>
  `;
  ui.report.classList.remove("hidden");
}

function buildSummary() {
  const elapsed = Math.max(getElapsedSeconds(), 1 / 60);
  const wpm = (state.correctChars / 5 / elapsed) * 60;
  const raw = (state.rawChars / 5 / elapsed) * 60;
  const accDenominator = state.correctChars + state.wrongChars;
  const acc = accDenominator ? (state.correctChars / accDenominator) * 100 : 100;
  return { elapsed, wpm, raw, acc };
}

function getElapsedSeconds() {
  if (!state.startTime) {
    return 0;
  }
  const end = state.finishTime || performance.now();
  return (end - state.startTime) / 1000;
}

function updateStats() {
  const summary = buildSummary();
  ui.statWpm.textContent = summary.wpm.toFixed(1);
  ui.statRaw.textContent = summary.raw.toFixed(1);
  ui.statAcc.textContent = `${summary.acc.toFixed(1)}%`;
  ui.statStreak.textContent = String(state.streak);
  ui.statErrors.textContent = String(state.errors);
  ui.statLives.textContent = state.mode === "meteor" ? String(state.meteorLives) : "-";
}

function onInputChange() {
  if (state.settings.lowercase) {
    const lower = ui.typeInput.value.toLowerCase();
    if (lower !== ui.typeInput.value) {
      ui.typeInput.value = lower;
    }
  }

  if (state.status === "idle" && ui.typeInput.value.length > 0) {
    startSession();
  }

  if (state.mode === "meteor") {
    scheduleMeteorLockUpdate();
    return;
  }
  schedulePreviewUpdate();
}

function onInputKeyDown(event) {
  if (event.isComposing) {
    return;
  }

  if (event.key === "Escape") {
    resetSession(true);
    return;
  }

  if (state.mode === "meteor") {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      commitMeteorWord();
    }
    return;
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    commitCurrentWord();
  }
}

function cancelPreviewFrame() {
  if (state.previewRaf) {
    cancelAnimationFrame(state.previewRaf);
    state.previewRaf = 0;
  }
  state.pendingPreviewValue = "";
  state.lastPreviewValue = "";
}

function schedulePreviewUpdate() {
  state.pendingPreviewValue = ui.typeInput.value;
  if (state.previewRaf) {
    return;
  }
  state.previewRaf = requestAnimationFrame(() => {
    state.previewRaf = 0;
    updateCurrentWordPreview(state.pendingPreviewValue);
  });
}

function updateCurrentWordPreview(typed) {
  if (state.mode === "meteor") {
    return;
  }

  const words = activeWords();
  const target = words[state.currentIndex];
  if (!target) {
    return;
  }
  if (typed === state.lastPreviewValue) {
    return;
  }

  let currentEl = state.visibleEls.get(state.currentIndex);
  if (!currentEl) {
    renderPromptWindow(true);
    currentEl = state.visibleEls.get(state.currentIndex);
    if (!currentEl) {
      return;
    }
  }

  paintCurrentWord(currentEl, target, typed);
  state.lastPreviewValue = typed;
}

function commitCurrentWord() {
  const typed = ui.typeInput.value.trim();
  if (!typed) {
    return;
  }
  if (state.status === "idle") {
    startSession();
  }

  const words = activeWords();
  const target = words[state.currentIndex];
  if (!target) {
    return;
  }

  const result = compareWords(typed, target);
  state.correctChars += result.correct;
  state.wrongChars += result.wrong;
  state.rawChars += typed.length;

  const isPerfect = typed === target;
  if (isPerfect) {
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.wordResults[state.currentIndex] = "good";
  } else {
    state.streak = 0;
    state.errors += 1;
    state.wordResults[state.currentIndex] = "bad";
  }

  const prevIndex = state.currentIndex;
  state.currentIndex += 1;
  ui.typeInput.value = "";
  state.pendingPreviewValue = "";
  state.lastPreviewValue = "";

  if (state.mode !== "quote" && state.currentIndex > words.length - 60) {
    appendPromptWords(100);
  }

  if (state.mode === "quote" && state.currentIndex >= words.length) {
    endSession("Quote complete");
    return;
  }

  updatePromptAfterCommit(prevIndex, isPerfect);
  updateStats();
}

function appendPromptWords(amount) {
  if (state.mode === "quote" || state.mode === "meteor") {
    return;
  }
  state.promptWords.push(...generateWords(amount));
}

function updatePromptAfterCommit(prevIndex, wasPerfect) {
  const words = activeWords();
  const prevWord = words[prevIndex];
  const prevEl = state.visibleEls.get(prevIndex);

  if (prevEl && prevWord) {
    paintCompletedWord(prevEl, prevWord, wasPerfect);
  }

  const nextWord = words[state.currentIndex];
  if (!nextWord) {
    return;
  }

  const nearEdge =
    state.currentIndex <= state.visibleStart + 2 || state.currentIndex >= state.visibleEnd - 10;

  if (nearEdge) {
    renderPromptWindow(true);
    return;
  }

  const nextEl = state.visibleEls.get(state.currentIndex);
  if (!nextEl) {
    renderPromptWindow(true);
    return;
  }

  paintCurrentWord(nextEl, nextWord, "");
}

function renderPromptWindow(force) {
  if (state.mode === "meteor") {
    return;
  }

  const words = activeWords();
  if (!words.length) {
    ui.promptZone.textContent = "";
    state.visibleEls.clear();
    state.visibleStart = 0;
    state.visibleEnd = 0;
    return;
  }

  const start = Math.max(0, state.currentIndex - 18);
  const end = Math.min(words.length, state.currentIndex + 70);
  if (!force && start === state.visibleStart && end === state.visibleEnd) {
    return;
  }

  const typed = ui.typeInput.value;
  const fragment = document.createDocumentFragment();
  const nextVisibleMap = new Map();

  for (let i = start; i < end; i += 1) {
    const word = words[i];
    const el = document.createElement("span");
    el.classList.add("prompt-word");

    if (i < state.currentIndex) {
      paintCompletedWord(el, word, state.wordResults[i] === "good");
    } else if (i === state.currentIndex) {
      paintCurrentWord(el, word, typed);
    } else {
      paintFutureWord(el, word);
    }

    nextVisibleMap.set(i, el);
    fragment.appendChild(el);
  }

  ui.promptZone.replaceChildren(fragment);
  state.visibleStart = start;
  state.visibleEnd = end;
  state.visibleEls = nextVisibleMap;
  state.lastPreviewValue = typed;
}

function paintCompletedWord(el, word, isGood) {
  el.className = `prompt-word ${isGood ? "done-good" : "done-bad"}`;
  el.textContent = word;
}

function paintFutureWord(el, word) {
  el.className = "prompt-word future";
  el.textContent = word;
}

function paintCurrentWord(el, word, typed) {
  el.className = "prompt-word current";
  el.innerHTML = renderCurrentWord(word, typed);
}

function renderCurrentWord(target, typed) {
  const chars = [];
  for (let i = 0; i < target.length; i += 1) {
    const expected = target[i];
    const actual = typed[i];

    if (actual === undefined) {
      chars.push(`<span class="char-pending">${escapeHtml(expected)}</span>`);
      continue;
    }
    if (actual === expected) {
      chars.push(`<span class="char-good">${escapeHtml(expected)}</span>`);
    } else {
      chars.push(`<span class="char-bad">${escapeHtml(expected)}</span>`);
    }
  }

  if (typed.length > target.length) {
    chars.push(`<span class="char-extra">${escapeHtml(typed.slice(target.length))}</span>`);
  }

  return chars.join("");
}

function activeWords() {
  return state.mode === "quote" ? state.quoteWords : state.promptWords;
}

function compareWords(typed, target) {
  let correct = 0;
  let wrong = 0;
  const maxLen = Math.max(typed.length, target.length);

  for (let i = 0; i < maxLen; i += 1) {
    const a = typed[i];
    const b = target[i];
    if (a === b && a !== undefined) {
      correct += 1;
    } else {
      wrong += 1;
    }
  }

  return { correct, wrong };
}

function runMeteorLoop() {
  state.meteorSpawnClock = 0;
  state.meteorLastTs = 0;
  spawnMeteor();
  spawnMeteor();

  const frame = (timestamp) => {
    if (state.status !== "running" || state.mode !== "meteor") {
      return;
    }

    if (!state.meteorLastTs) {
      state.meteorLastTs = timestamp;
    }
    const delta = Math.min((timestamp - state.meteorLastTs) / 1000, 0.05);
    state.meteorLastTs = timestamp;
    state.meteorSpawnClock += delta;

    let changed = false;
    while (state.meteorSpawnClock >= 0.92) {
      spawnMeteor();
      state.meteorSpawnClock -= 0.92;
      changed = true;
    }

    const zoneHeight = ui.meteorZone.clientHeight;
    const survivors = [];

    for (const item of state.meteorWords) {
      if (state.status !== "running") {
        break;
      }

      item.y += item.speed * delta;
      if (item.y >= zoneHeight - 42) {
        item.el.remove();
        state.wrongChars += item.text.length;
        state.errors += 1;
        state.streak = 0;
        state.meteorLives -= 1;
        changed = true;

        if (state.meteorLives <= 0) {
          endSession("Hull breached");
        }
      } else {
        item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;
        survivors.push(item);
      }
    }

    if (state.status === "running") {
      state.meteorWords = survivors;
      if (changed) {
        scheduleMeteorLockUpdate(true);
        updateStats();
      }
      state.meteorRaf = requestAnimationFrame(frame);
    }
  };

  state.meteorRaf = requestAnimationFrame(frame);
}

function spawnMeteor() {
  const pool = state.activePool.length ? state.activePool : buildPool();
  const text = pool[Math.floor(Math.random() * pool.length)];
  const el = document.createElement("div");
  el.className = "meteor-word";
  el.textContent = text;
  ui.meteorZone.appendChild(el);

  const zoneWidth = Math.max(ui.meteorZone.clientWidth - 120, 40);
  const x = Math.floor(Math.random() * zoneWidth) + 8;
  const y = -24;
  const speed = 46 + Math.random() * 74;

  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

  state.meteorWords.push({
    id: ++state.meteorId,
    text,
    x,
    y,
    speed,
    el,
    locked: false,
    lockPrefix: "",
  });
}

function commitMeteorWord() {
  const typed = ui.typeInput.value.trim();
  if (!typed) {
    return;
  }

  if (state.status === "idle") {
    startSession();
  }

  state.rawChars += typed.length;
  const exact = state.meteorWords
    .filter((item) => item.text === typed)
    .sort((a, b) => b.y - a.y);

  if (exact.length > 0) {
    const target = exact[0];
    target.el.remove();
    state.meteorWords = state.meteorWords.filter((item) => item.id !== target.id);
    state.correctChars += target.text.length;
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
  } else {
    state.wrongChars += typed.length;
    state.errors += 1;
    state.streak = 0;
    state.meteorLives -= 1;
    if (state.meteorLives <= 0) {
      ui.typeInput.value = "";
      endSession("Hull breached");
      return;
    }
  }

  ui.typeInput.value = "";
  scheduleMeteorLockUpdate(true);
  updateStats();
}

function scheduleMeteorLockUpdate(force = false) {
  if (state.mode !== "meteor") {
    return;
  }

  const nextInput = ui.typeInput.value.trim();
  if (!force && nextInput === state.meteorLastLockInput && !state.meteorLockRaf) {
    return;
  }

  state.meteorPendingInput = nextInput;
  if (state.meteorLockRaf) {
    return;
  }

  state.meteorLockRaf = requestAnimationFrame(() => {
    state.meteorLockRaf = 0;
    updateMeteorLocks(state.meteorPendingInput);
  });
}

function updateMeteorLocks(typed) {
  if (state.mode !== "meteor") {
    return;
  }

  const candidates = typed
    ? state.meteorWords.filter((item) => item.text.startsWith(typed)).sort((a, b) => b.y - a.y)
    : [];
  const targetId = candidates.length ? candidates[0].id : null;

  for (const item of state.meteorWords) {
    const shouldLock = typed.length > 0 && item.id === targetId;

    if (item.locked !== shouldLock) {
      item.locked = shouldLock;
      item.el.classList.toggle("locked", shouldLock);
    }

    if (shouldLock) {
      if (item.lockPrefix !== typed) {
        const head = escapeHtml(item.text.slice(0, typed.length));
        const tail = escapeHtml(item.text.slice(typed.length));
        item.el.innerHTML = `<span class="typed">${head}</span>${tail}`;
        item.lockPrefix = typed;
      }
    } else if (item.lockPrefix) {
      item.el.textContent = item.text;
      item.lockPrefix = "";
    }
  }

  state.meteorLockedId = targetId;
  state.meteorLastLockInput = typed;
}

function clearMeteor() {
  if (state.meteorRaf) {
    cancelAnimationFrame(state.meteorRaf);
    state.meteorRaf = 0;
  }
  if (state.meteorLockRaf) {
    cancelAnimationFrame(state.meteorLockRaf);
    state.meteorLockRaf = 0;
  }

  state.meteorWords.forEach((item) => item.el.remove());
  state.meteorWords = [];
  state.meteorSpawnClock = 0;
  state.meteorLastTs = 0;
  state.meteorPendingInput = "";
  state.meteorLastLockInput = "";
  state.meteorLockedId = null;
}

function isTimedMode() {
  return state.mode === "time" || state.mode === "meteor";
}

function buildPool() {
  const base = DICTIONARIES[state.selectedPack] || DICTIONARIES.core;
  const pool = [];

  if (!state.settings.customOnly) {
    pool.push(...base);
    if (state.externalWords.length > 0) {
      pool.push(...state.externalWords);
    }
  }
  if (state.customDictionary.length > 0) {
    pool.push(...state.customDictionary);
  }
  if (state.settings.customOnly && state.customDictionary.length === 0) {
    pool.push(...base);
  }

  if (state.settings.numbers) {
    pool.push("404", "2026", "7x7", "12bit", "3d", "808", "24fps", "99");
  }

  let words = [...new Set(pool.filter(Boolean))];
  if (state.settings.punctuation) {
    words = words.map(maybePunctuate);
  }

  if (state.settings.lowercase) {
    words = words.map((word) => word.toLowerCase());
  }

  return words.length ? words : DICTIONARIES.core.slice();
}

function generateWords(count) {
  const pool = state.activePool.length ? state.activePool : buildPool();
  const words = [];
  for (let i = 0; i < count; i += 1) {
    words.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return words;
}

function maybePunctuate(word) {
  const marks = [".", ",", "!", "?", ":", ";"];
  if (Math.random() < 0.25) {
    return `${word}${marks[Math.floor(Math.random() * marks.length)]}`;
  }
  return word;
}

function splitWords(text) {
  return [...new Set(text.split(/[\s,]+/).map((word) => word.trim()).filter(Boolean))];
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char];
  });
}
