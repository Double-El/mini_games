// ---- utils: seeded RNG (xorshift32) ----
function hashStringToUint32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seedStr) {
  let x = hashStringToUint32(seedStr || "seed");
  return function rand() {
    // xorshift32
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 1_000_000) / 1_000_000;
  };
}

function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function qs() {
  const p = new URLSearchParams(location.search);
  return {
    seed: (p.get("seed") || "").trim(),
    tab: (p.get("tab") || "").trim(),
  };
}

function randomSeed() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const r = crypto?.getRandomValues ? crypto.getRandomValues(new Uint8Array(10)) : null;
  for (let i = 0; i < 10; i++) {
    const n = r ? r[i] : Math.floor(Math.random() * 256);
    s += alphabet[n % alphabet.length];
  }
  return s;
}

// ---- DOM ----
const els = {
  tabs: Array.from(document.querySelectorAll(".tab")),
  panels: {
    balance: document.getElementById("tab-balance"),
    mission: document.getElementById("tab-mission"),
    bingo: document.getElementById("tab-bingo"),
    roulette: document.getElementById("tab-roulette"),
  },

  // balance
  balanceCounter: document.getElementById("balanceCounter"),
  balanceQuestion: document.getElementById("balanceQuestion"),
  balanceA: document.getElementById("balanceA"),
  balanceB: document.getElementById("balanceB"),
  balancePrev: document.getElementById("balancePrev"),
  balanceNext: document.getElementById("balanceNext"),
  balanceShuffle: document.getElementById("balanceShuffle"),

  // mission
  missionText: document.getElementById("missionText"),
  missionPick: document.getElementById("missionPick"),
  missionAgain: document.getElementById("missionAgain"),

  // bingo
  bingoGrid: document.getElementById("bingoGrid"),
  bingoResetMarks: document.getElementById("bingoResetMarks"),
  bingoRegenerate: document.getElementById("bingoRegenerate"),

  // roulette
  wheel: document.getElementById("wheel"),
  rouletteItems: document.getElementById("rouletteItems"),
  spinBtn: document.getElementById("spinBtn"),
  rouletteReset: document.getElementById("rouletteReset"),
  rouletteResult: document.getElementById("rouletteResult"),
};

// ---- game data ----
const BALANCE_QUESTIONS = [
  { a: "평생 여름만 살기", b: "평생 겨울만 살기" },
  { a: "커피 없이 살기", b: "탄산 없이 살기" },
  { a: "알람 없이 매일 늦잠", b: "매일 칼같이 일찍 기상" },
  { a: "여행은 무조건 즉흥", b: "여행은 분 단위 계획" },
  { a: "아침형 인간으로 강제 개조", b: "밤형 인간으로 고정" },
  { a: "평생 좋아하는 노래 1곡만 반복", b: "매일 랜덤 음악" },
  { a: "친구랑 항상 붙어 다니기", b: "혼자만의 시간 무제한" },
  { a: "비주얼 최악·맛 미친 음식", b: "비주얼 미친·맛 무난" },
  { a: "평생 사진 찍히는 담당", b: "평생 사진 기사" },
  { a: "평생 같은 메뉴만 먹기", b: "매 끼니 랜덤 메뉴" },
  { a: "소원 한 번에 올인", b: "소원 소액 분할 10번" },
  { a: "한 번에 대박·짧음", b: "천천히 성공·오래감" },
  { a: "말 안 해도 눈빛 통함", b: "수다 폭발 케미" },
  { a: "지금 기억 유지하고 다시 태어나기", b: "기억 리셋하고 다시 시작하기" },
];

const MISSION_LIST = [
  "옆 사람에게 한 문장 칭찬하기",
  "최근 가장 웃겼던 일 한 가지 말하기",
  "오늘 제일 맛있었던 음식 말하기",
  "지금 기분을 한 단어로 표현하기",
  "좋아하는 영화나 드라마 하나 추천하기",
  "감사한 사람 한 명 떠올려 말하기",
  "요즘 자주 듣는 노래 제목 말하기",
  "가장 좋아하는 음식 한 가지 고르기",
  "휴대폰 배경화면 주제만 공개하기",
  "최근 소소하게 잘한 일 하나 말하기",
  "오늘 하루를 점수로 매기기 (10점 만점)",
  "요즘 나를 행복하게 하는 것 하나 말하기",
  "다음 회식 때 하고 싶은 것 한 가지 말하기",
  "지금 가장 하고 싶은 일 한 가지 말하기",
];

const BINGO_PHRASES = [
  "말 없이 챙겨주는 사람",
  "분위기 메이커",
  "정리왕",
  "질문 잘하는 사람",
  "설명 잘하는 사람",
  "약속 잘 지키는 사람",
  "배려가 느껴지는 사람",
  "피드백이 따뜻한 사람",
  "일이 빠른 사람",
  "꼼꼼한 사람",
  "문제 해결사",
  "긍정왕",
  "아이디어 뱅크",
  "팀을 편하게 만드는 사람",
  "웃음 버튼",
  "리액션 천재",
  "학습 속도 빠른 사람",
  "도움 요청하면 바로 오는 사람",
  "메모/기록 잘하는 사람",
  "침착한 사람",
  "센스 있는 사람",
  "말투가 고운 사람",
  "듣는 걸 잘하는 사람",
  "책임감 있는 사람",
  "성장 중인 사람",
  "믿음직한 사람",
  "존중이 느껴지는 사람",
  "유머 있는 사람",
  "프로답게 마무리하는 사람",
  "새로운 시도하는 사람",
];

const DEFAULT_ROULETTE_ITEMS = [
  "건배사 한 마디",
  "옆사람 칭찬 1개",
  "오늘의 한 줄 소감",
  "최근에 웃긴 일 1개",
  "팀에게 고마운 점 1개",
  "다음 게임 선택권",
  "물 한 잔 마시기(건강)",
  "셀카 포즈 제안하기",
];

// ---- tabs ----
function getActiveTab() {
  const t = els.tabs.find((b) => b.classList.contains("isActive"));
  return t ? t.dataset.tab : "balance";
}

function setActiveTab(tab) {
  for (const b of els.tabs) {
    b.classList.toggle("isActive", b.dataset.tab === tab);
  }
  Object.entries(els.panels).forEach(([k, panel]) => {
    panel.classList.toggle("hidden", k !== tab);
  });
}

els.tabs.forEach((b) => {
  b.addEventListener("click", () => setActiveTab(b.dataset.tab));
});

// ---- state ----
const state = {
  seed: "",
  // balance
  balanceDeck: [],
  balanceIdx: 0,

  // mission
  missionDeck: [],
  missionIdx: 0,

  // bingo
  bingoWords: [],
  bingoMarks: new Set(),

  // roulette
  wheelItems: [],
  wheelAngle: 0,
  wheelSpinning: false,
};

// ---- balance ----
function initBalanceDeck() {
  const rand = makeRng(`${state.seed}:balance`);
  state.balanceDeck = shuffle(BALANCE_QUESTIONS, rand);
  state.balanceIdx = 0;
  renderBalance();
}

function renderBalance() {
  const n = state.balanceDeck.length;
  const i = Math.max(0, Math.min(state.balanceIdx, n - 1));
  state.balanceIdx = i;
  const item = state.balanceDeck[i];
  els.balanceCounter.textContent = `${i + 1} / ${n}`;
  els.balanceQuestion.textContent = item.q || `${item.a} vs ${item.b}`;
  els.balanceA.textContent = `A) ${item.a}`;
  els.balanceB.textContent = `B) ${item.b}`;
  els.balancePrev.disabled = i === 0;
  els.balanceNext.disabled = i === n - 1;
}

els.balancePrev.addEventListener("click", () => {
  state.balanceIdx -= 1;
  renderBalance();
});
els.balanceNext.addEventListener("click", () => {
  state.balanceIdx += 1;
  renderBalance();
});
els.balanceShuffle.addEventListener("click", () => {
  initBalanceDeck();
});
els.balanceA.addEventListener("click", () => {
  els.balanceA.blur();
});
els.balanceB.addEventListener("click", () => {
  els.balanceB.blur();
});

// ---- mission ----
function initMissionDeck() {
  const rand = makeRng(`${state.seed}:mission`);
  state.missionDeck = shuffle(MISSION_LIST, rand);
  state.missionIdx = 0;
  els.missionText.textContent = "버튼을 눌러 뽑기";
}

function pickMission() {
  if (!state.missionDeck.length) return;
  const item = state.missionDeck[state.missionIdx % state.missionDeck.length];
  state.missionIdx += 1;
  els.missionText.textContent = item;
}

els.missionPick.addEventListener("click", pickMission);
els.missionAgain.addEventListener("click", pickMission);

// ---- bingo ----
function bingoStorageKey(seed) {
  return `dinner_bingo_marks:${seed}`;
}

function saveBingoMarks() {
  try {
    localStorage.setItem(bingoStorageKey(state.seed), JSON.stringify([...state.bingoMarks]));
  } catch (_) {
    // ignore
  }
}

function loadBingoMarks() {
  state.bingoMarks = new Set();
  try {
    const raw = localStorage.getItem(bingoStorageKey(state.seed));
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) arr.forEach((x) => state.bingoMarks.add(String(x)));
  } catch (_) {
    // ignore
  }
}

function initBingoCard() {
  const rand = makeRng(`${state.seed}:bingo`);
  const picks = shuffle(BINGO_PHRASES, rand).slice(0, 25);
  state.bingoWords = picks;
  loadBingoMarks();
  renderBingo();
}

function renderBingo() {
  els.bingoGrid.innerHTML = "";
  state.bingoWords.forEach((word, idx) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "bingoCell";
    cell.setAttribute("role", "gridcell");
    cell.dataset.key = `${idx}:${word}`;
    cell.textContent = word;
    cell.classList.toggle("isMarked", state.bingoMarks.has(cell.dataset.key));
    cell.addEventListener("click", () => {
      const key = cell.dataset.key;
      if (state.bingoMarks.has(key)) state.bingoMarks.delete(key);
      else state.bingoMarks.add(key);
      cell.classList.toggle("isMarked");
      saveBingoMarks();
    });
    els.bingoGrid.appendChild(cell);
  });
}

els.bingoResetMarks.addEventListener("click", () => {
  state.bingoMarks = new Set();
  saveBingoMarks();
  renderBingo();
});

els.bingoRegenerate.addEventListener("click", () => {
  // regenerate a new card locally
  state.seed = randomSeed();
  hydrateFromSeed();
});

// ---- roulette ----
function parseRouletteItems(text) {
  return (text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function drawWheel() {
  const canvas = els.wheel;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const items = state.wheelItems.length ? state.wheelItems : ["-"];
  const n = items.length;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 10;

  // pointer
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.moveTo(0, -r - 6);
  ctx.lineTo(-10, -r + 12);
  ctx.lineTo(10, -r + 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // wheel
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.wheelAngle);

  for (let i = 0; i < n; i++) {
    const start = (i * 2 * Math.PI) / n;
    const end = ((i + 1) * 2 * Math.PI) / n;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, start, end);
    ctx.closePath();
    const hue = (i * 360) / n;
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, 0.55)`;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.stroke();

    // label
    ctx.save();
    ctx.rotate(start + (end - start) / 2);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "700 13px 'Noto Sans KR', sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const label = items[i].length > 16 ? `${items[i].slice(0, 15)}…` : items[i];
    ctx.fillText(label, r - 10, 0);
    ctx.restore();
  }

  // center cap
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(10, 16, 34, 0.75)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.stroke();

  ctx.restore();
}

function getSelectedWheelItem() {
  const items = state.wheelItems;
  if (!items.length) return "";
  const n = items.length;
  // pointer at top (-pi/2). Normalize angle so 0 means pointer at slice 0 boundary.
  const a = (-(state.wheelAngle) + Math.PI / 2) % (Math.PI * 2);
  const norm = (a + Math.PI * 2) % (Math.PI * 2);
  const idx = Math.floor((norm / (Math.PI * 2)) * n) % n;
  return items[idx];
}

function spinWheel() {
  if (state.wheelSpinning) return;
  state.wheelSpinning = true;
  els.spinBtn.disabled = true;
  els.rouletteResult.textContent = "돌리는 중…";

  const rand = makeRng(`${state.seed}:roulette:${Date.now()}`);
  const extra = (Math.PI * 2) * (4 + Math.floor(rand() * 3)); // 4~6 rotations
  const target = (Math.PI * 2) * rand();
  const startAngle = state.wheelAngle;
  const endAngle = startAngle + extra + target;
  const duration = 2300;
  const start = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    state.wheelAngle = startAngle + (endAngle - startAngle) * easeOutCubic(t);
    drawWheel();
    if (t < 1) requestAnimationFrame(frame);
    else {
      state.wheelSpinning = false;
      els.spinBtn.disabled = false;
      const picked = getSelectedWheelItem();
      els.rouletteResult.textContent = picked ? `결과: ${picked}` : "결과 없음";
    }
  }

  requestAnimationFrame(frame);
}

function setRouletteItems(items) {
  state.wheelItems = items;
  els.rouletteItems.value = items.join(", ");
  drawWheel();
  els.rouletteResult.textContent = "";
}

els.spinBtn.addEventListener("click", () => {
  state.wheelItems = parseRouletteItems(els.rouletteItems.value);
  drawWheel();
  spinWheel();
});

els.rouletteReset.addEventListener("click", () => {
  setRouletteItems(DEFAULT_ROULETTE_ITEMS);
});

// ---- seed hydrate ----
function hydrateFromSeed() {
  // init modules
  initBalanceDeck();
  initMissionDeck();
  initBingoCard();

  // roulette items: keep local edits per seed
  const key = `dinner_roulette_items:${state.seed}`;
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(key) || "null");
  } catch (_) {
    saved = null;
  }
  const items = Array.isArray(saved) && saved.length ? saved : DEFAULT_ROULETTE_ITEMS;
  setRouletteItems(items);

  els.rouletteItems.addEventListener("change", () => {
    const next = parseRouletteItems(els.rouletteItems.value);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch (_) {
      // ignore
    }
  });
}

// ---- boot ----
function boot() {
  const { seed, tab } = qs();
  state.seed = seed || randomSeed();
  hydrateFromSeed();
  setActiveTab(tab || "balance");
}

boot();


