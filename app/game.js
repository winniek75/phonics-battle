"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════
   AUDIO — Sound effects via Web Audio API
   ═══════════════════════════════════════════════════════ */
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}

/** Correct answer: C-E-G major chord chime (sine, 0.2 gain, 0.3s) */
function playCorrectSound() {
  try {
    const ctx = getAudioCtx();
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + 0.35);
    });
  } catch (e) { /* audio not supported */ }
}

/** Wrong answer: square wave 150Hz->100Hz pitch drop (0.2 gain, 0.2s) */
function playWrongSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) { /* audio not supported */ }
}

/** TTS — speak English word using Web Speech API */
function speakEnglish(text) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.85;
    utter.pitch = 1.1;
    // Try to pick an English voice
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith("en"));
    if (enVoice) utter.voice = enVoice;
    window.speechSynthesis.speak(utter);
  } catch (e) { /* TTS not supported */ }
}

/* ═══════════════════════════════════════════════════════
   LOCAL STORAGE — persistence helpers
   ═══════════════════════════════════════════════════════ */
const LS_KEY_SCORES = "phonics-battle-scores";
const LS_KEY_WRONG = "phonics-battle-wrong-answers";

function loadScores() {
  try {
    const raw = localStorage.getItem(LS_KEY_SCORES);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveScore(stageId, mode, data) {
  try {
    const scores = loadScores();
    const key = `stage${stageId}_${mode}`;
    const prev = scores[key];
    // Keep best score and best combo
    scores[key] = {
      bestScore: Math.max(data.score || 0, prev?.bestScore || 0),
      bestCombo: Math.max(data.maxCombo || 0, prev?.bestCombo || 0),
      bestTime: prev?.bestTime ? Math.min(parseFloat(data.time) || Infinity, prev.bestTime) : parseFloat(data.time) || null,
      plays: (prev?.plays || 0) + 1,
      lastPlayed: Date.now(),
    };
    localStorage.setItem(LS_KEY_SCORES, JSON.stringify(scores));
  } catch { /* localStorage not available */ }
}

function loadWrongAnswers() {
  try {
    const raw = localStorage.getItem(LS_KEY_WRONG);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveWrongAnswers(mistakes, stageId) {
  try {
    const existing = loadWrongAnswers();
    const newEntries = mistakes.map(m => ({
      en: m.word.en,
      ja: m.word.ja,
      stageId,
      timestamp: Date.now(),
    }));
    // Keep last 200 entries, dedupe by en+stageId keeping latest
    const merged = [...newEntries, ...existing];
    const seen = new Set();
    const deduped = merged.filter(e => {
      const key = `${e.en}_${e.stageId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 200);
    localStorage.setItem(LS_KEY_WRONG, JSON.stringify(deduped));
  } catch { /* localStorage not available */ }
}

function getStageStats(stageId) {
  const scores = loadScores();
  return {
    solo: scores[`stage${stageId}_solo`] || null,
    battle: scores[`stage${stageId}_battle`] || null,
  };
}

/* ═══════════════════════════════════════════════════════
   WORD DATA — Japanese (with hiragana) + English
   ═══════════════════════════════════════════════════════ */
// ja: もんだいに出す日本語（学習記録にもこの文字列を送る）
// em: 意味をはっきりさせるための絵文字ヒント（画面表示のみ）
const W = (en, ja, em) => (em ? { en, ja, em } : { en, ja });
const STAGES = [
  {
    id: 1, label: "Stage 1", sub: "s, a, t, i, p, n のたんご", kind: "sound",
    words: [
      W("sat", "すわった", "🪑"), W("sit", "すわる", "🪑"),
      W("pin", "ピン（とめるもの）", "📌"), W("pan", "フライパン", "🍳"),
      W("tap", "すいどうの じゃぐち", "🚰"), W("tip", "えんぴつの さき（先）", "✏️"),
      W("tin", "かんづめの かん（缶）", "🥫"), W("nap", "ひるね", "😴"),
      W("sip", "ちょっとずつ のむ", "🥤"), W("pat", "やさしく なでる", "🤚"),
      W("ant", "アリ", "🐜"), W("pit", "じめんの あな（穴）", "🕳️"),
    ],
  },
  {
    id: 2, label: "Stage 2", sub: "c/k, e, h, r, m, d のたんご", kind: "sound",
    words: [
      W("cat", "ねこ", "🐱"), W("hat", "ぼうし", "👒"),
      W("rat", "ねずみ", "🐀"), W("hen", "めんどり", "🐔"),
      W("red", "あかい", "🔴"), W("map", "ちず", "🗺️"),
      W("mat", "マット（しきもの）"), W("man", "おとこのひと", "👨"),
      W("kid", "こども", "🧒"), W("dam", "ダム（かわの みずを ためる）"),
      W("met", "ひとに あった（会った）", "🤝"), W("den", "どうぶつの すあな", "🦊"),
      W("kit", "どうぐの セット", "🧰"), W("rim", "コップの ふち", "🥛"),
    ],
  },
  {
    id: 3, label: "Stage 3", sub: "g, o, u, l, f, b のたんご", kind: "sound",
    words: [
      W("dog", "いぬ", "🐶"), W("log", "まるた（きの みき）", "🪵"),
      W("fog", "きり（霧）", "🌫️"), W("fun", "たのしい", "😆"),
      W("sun", "たいよう", "☀️"), W("bug", "むし（虫）", "🐛"),
      W("mug", "マグカップ", "☕"), W("hug", "だきしめる", "🤗"),
      W("bus", "バス", "🚌"), W("bed", "ベッド", "🛏️"),
      W("big", "おおきい", "🐘"), W("bat", "コウモリ", "🦇"),
      W("box", "はこ", "📦"), W("fox", "キツネ", "🦊"),
      W("leg", "あし（足）", "🦵"), W("lip", "くちびる", "👄"),
    ],
  },
  {
    id: 4, label: "Stage 4", sub: "ai, j, oa, ie, ee, or のたんご", kind: "sound",
    words: [
      W("rain", "あめ（雨）", "☔"), W("tail", "しっぽ", "🐕"),
      W("mail", "てがみ", "✉️"), W("nail", "くぎ（釘）", "🔨"),
      W("jam", "ジャム", "🍓"), W("jet", "ジェットき", "✈️"),
      W("boat", "ボート", "🚣"), W("coat", "コート", "🧥"),
      W("road", "みち（道）", "🛣️"), W("pie", "パイ", "🥧"),
      W("tie", "ネクタイ", "👔"), W("bee", "ハチ", "🐝"),
      W("tree", "き（木）", "🌳"), W("fork", "フォーク", "🍴"),
      W("corn", "とうもろこし", "🌽"),
    ],
  },
  {
    id: 5, label: "Stage 5", sub: "うごきの ことば（どうし）", kind: "type",
    words: [
      W("eat", "たべる", "🍙"), W("drink", "のむ", "🥤"),
      W("run", "はしる", "🏃"), W("walk", "あるく", "🚶"),
      W("swim", "およぐ", "🏊"), W("jump", "ジャンプする"),
      W("sit", "すわる", "🪑"), W("stand", "たつ（立つ）", "🧍"),
      W("sleep", "ねむる", "😴"), W("stop", "とまる（止まる）", "🛑"),
      W("wash", "あらう", "🧼"), W("cook", "りょうりする", "🍳"),
      W("open", "あける（開ける）", "🚪"), W("close", "しめる（閉める）", "🚪"),
      W("go", "いく（行く）", "➡️"), W("come", "くる（来る）", "⬅️"),
      W("see", "みる・みえる", "👀"), W("look", "よく みる", "🔍"),
      W("read", "よむ", "📖"), W("write", "じを かく（書く）", "✏️"),
      W("draw", "えを かく（描く）", "🎨"), W("sing", "うたう", "🎤"),
      W("speak", "はなす（話す）", "🗣️"), W("listen", "きく（聞く）", "👂"),
      W("play", "あそぶ", "🧸"), W("study", "べんきょうする", "📚"),
      W("make", "つくる", "🛠️"), W("have", "もっている"),
      W("do", "する"), W("like", "すき", "❤️"),
      W("want", "ほしい"), W("know", "しっている"),
      W("think", "かんがえる", "🤔"), W("help", "たすける", "🤝"),
      W("give", "あげる（わたす）", "🎁"), W("take", "てに とる（取る）"),
      W("buy", "かう（買う）", "🛒"), W("use", "つかう"),
      W("get", "てに いれる"), W("meet", "ひとに あう（会う）", "🤝"),
      W("live", "すむ（住む）", "🏠"), W("work", "はたらく", "💼"),
      W("start", "はじめる"), W("try", "やってみる"),
      W("enjoy", "たのしむ", "😆"), W("wait", "まつ（待つ）", "⏳"),
      W("teach", "おしえる", "🧑‍🏫"), W("fly", "そらを とぶ（飛ぶ）", "🕊️"),
      W("ride", "のる（乗る）", "🚲"), W("watch", "テレビなどを みる", "📺"),
      W("find", "みつける", "🔎"), W("call", "でんわする", "📞"),
      W("ask", "たずねる（きく）", "❓"), W("show", "みせる"),
      W("clean", "そうじする", "🧹"), W("cut", "きる（切る）", "✂️"),
      W("rain", "あめが ふる", "☔"), W("snow", "ゆきが ふる", "❄️"),
    ],
  },
  {
    id: 6, label: "Stage 6", sub: "ようすの ことば（けいようし）", kind: "type",
    words: [
      W("big", "おおきい", "🐘"), W("small", "ちいさい", "🐭"),
      W("long", "ながい", "📏"), W("short", "みじかい"),
      W("tall", "せが たかい", "🦒"), W("new", "あたらしい", "✨"),
      W("old", "ふるい"), W("hot", "あつい（暑い・熱い）", "🥵"),
      W("cold", "さむい・つめたい", "🥶"), W("fast", "はやい（速い）", "🐇"),
      W("slow", "おそい", "🐢"), W("good", "よい", "👍"),
      W("bad", "わるい", "👎"), W("happy", "しあわせ・うれしい", "😊"),
      W("sad", "かなしい", "😢"), W("angry", "おこっている", "😠"),
      W("tired", "つかれた", "😩"), W("hungry", "おなかが すいた", "🍽️"),
      W("kind", "やさしい（しんせつ）", "💗"), W("nice", "すてき"),
      W("beautiful", "うつくしい", "🌸"), W("cute", "かわいい", "🐰"),
      W("red", "あかい", "🔴"), W("blue", "あおい", "🔵"),
      W("yellow", "きいろい", "🟡"), W("green", "みどりの", "🟢"),
      W("white", "しろい", "⚪"), W("black", "くろい", "⚫"),
      W("pink", "ピンクの", "🌸"), W("brown", "ちゃいろの", "🟤"),
      W("purple", "むらさきの", "🟣"), W("orange", "オレンジいろの", "🟠"),
      W("sunny", "はれの（てんき）", "☀️"), W("cloudy", "くもりの（てんき）", "☁️"),
      W("rainy", "あめの（てんき）", "☔"), W("windy", "かぜが つよい", "🌬️"),
      W("easy", "かんたん"), W("hard", "むずかしい"),
      W("busy", "いそがしい"), W("great", "すばらしい", "🎉"),
      W("many", "たくさんの"), W("important", "たいせつ"),
      W("popular", "にんきが ある"), W("favorite", "おきにいり", "⭐"),
      W("ready", "じゅんびが できた"), W("sorry", "ごめんなさい", "🙇"),
      W("right", "ただしい", "⭕"), W("wrong", "まちがっている", "❌"),
      W("sick", "びょうきの", "🤒"), W("special", "とくべつ"),
    ],
  },
  {
    id: 7, label: "Stage 7", sub: "ひとを さす ことば（だいめいし）", kind: "type",
    words: [
      W("I", "わたしは"), W("you", "あなた"),
      W("he", "かれは（おとこのひと）"), W("she", "かのじょは（おんなのひと）"),
      W("it", "それ"), W("we", "わたしたちは"),
      W("they", "かれらは"), W("me", "わたしを"),
      W("him", "かれを"), W("her", "かのじょを"),
      W("us", "わたしたちを"), W("them", "かれらを"),
    ],
  },
];

const STAGE_COLORS = ["#4ECDC4","#6C5CE7","#FF6B6B","#FFD93D","#E17055","#00B894","#fd79a8"];

/* ═══════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickChoices(correct, allWords, count = 4) {
  const others = allWords.filter((w) => w.en !== correct.en);
  const wrong = shuffle(others).slice(0, count - 1);
  return shuffle([correct, ...wrong]);
}

/* ═══════════════════════════════════════════════════════
   MODES / PORTAL LINK / DEEP LINK
   mode (内部キー):
     "practice" … れんしゅう（ひとり・じかんせいげんなし）
     "solo"     … タイムチャレンジ（ひとり・1もん15びょう）※保存キー互換のため "solo" のまま
     "battle"   … たいせん（2にん・40びょう）
   ═══════════════════════════════════════════════════════ */
const PORTAL_URL = "https://wise-english-portal.vercel.app";
const DEFAULT_COUNT = 10;
const MODE_INFO = {
  practice: { emoji: "📖", title: "れんしゅう", desc: "ひとりで ゆっくり（じかんせいげん なし）", color: "#4ECDC4" },
  solo: { emoji: "⏱️", title: "タイムチャレンジ", desc: "ひとりで 1もん15びょう", color: "#6C5CE7" },
  battle: { emoji: "⚔️", title: "たいせん", desc: "2にんで 40びょう スピードバトル！", color: "#FF6B6B" },
};

/** URL パラメータ（ディープリンク）を読む。
 *  ?stage=1..7（別名 group / unit） &mode=practice|challenge|battle &count=3..20 */
function readDeepLink() {
  try {
    const p = new URLSearchParams(window.location.search);
    const rawStage = p.get("stage") ?? p.get("group") ?? p.get("unit");
    const sid = parseInt(rawStage, 10);
    const stageId = STAGES.some((s) => s.id === sid) ? sid : null;
    const rawMode = (p.get("mode") || "").toLowerCase();
    const modeMap = {
      practice: "practice", renshu: "practice", learn: "practice",
      challenge: "solo", time: "solo", timed: "solo", solo: "solo",
      battle: "battle", vs: "battle",
    };
    const mode = modeMap[rawMode] || null;
    const n = parseInt(p.get("count"), 10);
    const count = Number.isFinite(n) ? Math.min(20, Math.max(3, n)) : null;
    return { stageId, mode, count };
  } catch { return { stageId: null, mode: null, count: null }; }
}

function PortalLink({ style }) {
  return (
    <a href={PORTAL_URL} style={{
      fontSize: 12, color: "#7a7aa8", fontWeight: 700, textDecoration: "none",
      padding: "8px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)",
      zIndex: 1, ...style,
    }}>🏠 学習ホームにもどる</a>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════ */
export default function PhonicsGame() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState(null);
  const [stageId, setStageId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [results, setResults] = useState(null);
  const [qCount, setQCount] = useState(DEFAULT_COUNT);
  const [presetStage, setPresetStage] = useState(null); // URLでステージだけ指定されたとき

  // Initialize WiseXP SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && window.WiseXP) {
      window.WiseXP.init('phonics-battle');
    }
  }, []);

  // Deep link: ?stage=2&mode=practice&count=10 など
  useEffect(() => {
    const dl = readDeepLink();
    if (dl.count) setQCount(dl.count);
    if (dl.stageId && dl.mode) {
      setStageId(dl.stageId); setMode(dl.mode); setScreen("ready");
    } else if (dl.mode) {
      setMode(dl.mode); setScreen("stages");
    } else if (dl.stageId) {
      setPresetStage(dl.stageId); setScreen("mode");
    }
  }, []);

  const stage = STAGES.find((s) => s.id === stageId);

  /* ── Solo game logic (practice = no timer / solo = timed) ── */
  const [learnWords, setLearnWords] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);

  const startSolo = (sid, m) => {
    const s = STAGES.find((st) => st.id === sid);
    const questions = shuffle(s.words).slice(0, Math.min(qCount, s.words.length));
    setStageId(sid);
    setGameState({
      questions,
      current: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      answers: [],
      recentResults: [],
      startTime: Date.now(),
      isReviewMode: false,
      timed: m === "solo",
      modeKey: m === "solo" ? "solo" : "practice",
    });
    // 覚えるフェーズ: 出題される単語の最初の5語を見せる
    setLearnWords(questions.slice(0, 5));
    setPendingMode(m);
    setScreen("learn");
  };

  const finishLearn = () => {
    setGameState((s) => ({ ...s, startTime: Date.now() }));
    setScreen("solo");
  };

  const startBattle = (sid) => {
    const s = STAGES.find((st) => st.id === sid);
    // Each player gets their own independently shuffled question queue
    // Repeat-shuffle so players never run out during timer
    const makeQueue = () => shuffle([...s.words, ...s.words, ...s.words]);
    const q1 = makeQueue(), q2 = makeQueue();
    setStageId(sid);
    setBattleState({
      p1: { questions: q1, current: 0, answered: 0, score: 0, combo: 0, maxCombo: 0,
            choices: pickChoices(q1[0], s.words), feedback: null, mistakes: [] },
      p2: { questions: q2, current: 0, answered: 0, score: 0, combo: 0, maxCombo: 0,
            choices: pickChoices(q2[0], s.words), feedback: null, mistakes: [] },
      phase: "playing",
      timer: 40,
    });
    setScreen("battle");
  };

  const startGame = (sid, m) => (m === "battle" ? startBattle(sid) : startSolo(sid, m));

  const startReview = (wrongWords) => {
    // 同じ単語が2回入らないようにする（たいせんでは P1/P2 が同じ語をまちがえることがある）
    const seen = new Set();
    const uniq = wrongWords.map((m) => m.word).filter((w) => (seen.has(w.en) ? false : (seen.add(w.en), true)));
    const questions = shuffle(uniq);
    setGameState({
      questions,
      current: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      answers: [],
      recentResults: [],
      startTime: Date.now(),
      isReviewMode: true,
      timed: false,
      modeKey: "review",
    });
    setScreen("solo");
  };

  const goHome = () => {
    setScreen("home");
    setGameState(null);
    setBattleState(null);
    setResults(null);
    setPresetStage(null);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a14",
      fontFamily: "'Nunito', 'Hiragino Sans', 'Meiryo', sans-serif",
      color: "#fff",
      userSelect: "none",
      WebkitUserSelect: "none",
      touchAction: "manipulation",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.05) } }
        @keyframes shake { 0%,100% { transform:translateX(0) } 25% { transform:translateX(-4px) } 75% { transform:translateX(4px) } }
        @keyframes popIn { from { transform:scale(0.5); opacity:0 } to { transform:scale(1); opacity:1 } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-8px) } }
        @keyframes confettiFall { from { transform:translateY(-20px) rotate(0deg); opacity:1 } to { transform:translateY(100vh) rotate(720deg); opacity:0 } }
        @keyframes comboMilestone { 0% { transform:scale(0); opacity:0 } 60% { transform:scale(1.1); opacity:1 } 80% { transform:scale(1); opacity:1 } 100% { transform:scale(1); opacity:0 } }
        .btn:active { transform:scale(0.95) !important; }
      `}</style>

      {screen === "home" && <HomeScreen onStart={() => setScreen("mode")} />}
      {screen === "mode" && <ModeSelect presetStage={STAGES.find((s) => s.id === presetStage)}
        onSelect={(m) => {
          setMode(m);
          if (presetStage) startGame(presetStage, m); else setScreen("stages");
        }} onBack={goHome} />}
      {screen === "stages" && <StageSelect mode={mode} onSelect={(sid) => startGame(sid, mode)} onBack={() => setScreen("mode")} />}
      {screen === "ready" && stage && (
        <ReadyScreen stage={stage} mode={mode} count={Math.min(qCount, stage.words.length)}
          onStart={() => startGame(stageId, mode)} onBack={goHome} />
      )}
      {screen === "learn" && learnWords && (
        <LearnPhase words={learnWords} onFinish={finishLearn} />
      )}
      {screen === "solo" && gameState && stage && (
        <SoloGame state={gameState} setState={setGameState} stage={stage}
          onFinish={(res) => {
            // ふくしゅう（まちがえた語のやりなおし）はベストスコアに入れない
            if (!res.isReviewMode) saveScore(stageId, res.modeKey, res);
            if (res.mistakes?.length) saveWrongAnswers(res.mistakes, stageId);
            // 学習記録には「えらんでまちがえた語」だけを送る（じかんぎれは別集計）
            const wrongPicked = (res.mistakes || []).filter((m) => !m.timedOut);
            // Report to WiseXP
            if (window.WiseXP) {
              try {
                window.WiseXP.reportGame({ score: res.score, correct: res.score, total: res.total, maxCombo: res.maxCombo, grade: 0 });
                wrongPicked.forEach((m) => {
                  window.WiseXP.reportWrong({ question: m.word?.ja ?? '', correct: m.word?.en ?? '', playerAnswer: m.selected ?? '' });
                });
              } catch (e) {}
            }
            // → MoWISE portal へスコア送信 (WiseGame Bridge)
            try {
              const acc = res.total > 0 ? Math.round((res.score / res.total) * 100) : 0;
              window.WiseGame && window.WiseGame.reportComplete({
                score: res.score, maxScore: res.total, accuracy: acc,
                metadata: { mode: res.modeKey, stage: stageId, maxCombo: res.maxCombo,
                  timeouts: (res.mistakes || []).length - wrongPicked.length,
                  wrongAnswers: wrongPicked.slice(0, 20).map(m => ({ q: m.word?.ja ?? '', correct: m.word?.en ?? '', chosen: m.selected ?? '', tag: 'sight_word' })) }
              });
            } catch(e) {}
            setResults(res); setScreen("result");
          }} />
      )}
      {screen === "battle" && battleState && stage && (
        <BattleGame state={battleState} setState={setBattleState} stage={stage}
          onFinish={(res) => {
            saveScore(stageId, "battle", { score: Math.max(res.p1Score, res.p2Score), maxCombo: Math.max(res.p1MaxCombo, res.p2MaxCombo) });
            if (res.mistakes?.length) saveWrongAnswers(res.mistakes, stageId);
            // かったほう（どうてんなら P1）の「せいかい数 / こたえた数」をそのまま送る。
            // 以前は「せいかい数 = かったほう」「もんだい数 = 2人のごうけい」で、正答率が実際より低く記録されていた。
            const top = res.p2Score > res.p1Score
              ? { score: res.p2Score, answered: res.p2Answered, combo: res.p2MaxCombo }
              : { score: res.p1Score, answered: res.p1Answered, combo: res.p1MaxCombo };
            // Report to WiseXP
            if (window.WiseXP) {
              try {
                window.WiseXP.reportGame({ score: top.score, correct: top.score, total: top.answered, maxCombo: top.combo, grade: 0 });
                (res.mistakes || []).forEach((m) => {
                  window.WiseXP.reportWrong({ question: m.word?.ja ?? '', correct: m.word?.en ?? '', playerAnswer: m.selected ?? '' });
                });
              } catch (e) {}
            }
            // → MoWISE portal へスコア送信 (WiseGame Bridge)
            try {
              window.WiseGame && window.WiseGame.reportComplete({
                score: top.score, maxScore: top.answered,
                accuracy: top.answered > 0 ? Math.round((top.score / top.answered) * 100) : 0,
                metadata: { mode: 'battle', stage: stageId,
                  wrongAnswers: (res.mistakes || []).slice(0, 20).map(m => ({ q: m.word?.ja ?? '', correct: m.word?.en ?? '', chosen: m.selected ?? '', tag: 'sight_word' })) }
              });
            } catch(e) {}
            setResults(res); setScreen("result");
          }} />
      )}
      {screen === "result" && results && (
        <ResultScreen results={results} mode={mode} stageId={stageId}
          onRetry={() => startGame(stageId, mode)}
          onHome={goHome}
          onReview={startReview} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HOME SCREEN
   ═══════════════════════════════════════════════════════ */
function HomeScreen({ onStart }) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop";
  // ランダム配置はマウント後に1回だけ決める（SSRとのずれ・再描画ごとの飛びを防ぐ）
  const [deco, setDeco] = useState([]);
  useEffect(() => {
    setDeco(letters.split("").map((l) => ({
      l, size: 16 + Math.random() * 20, top: Math.random() * 100, left: Math.random() * 100, rot: -30 + Math.random() * 60,
    })));
  }, []);
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      background: "radial-gradient(ellipse at 50% 30%, #1e1245 0%, #0a0a14 70%)",
      position: "relative", overflow: "hidden",
    }}>
      {deco.map((d, i) => (
        <div key={i} style={{
          position: "absolute", fontSize: d.size,
          color: STAGE_COLORS[i % 7], opacity: 0.06,
          top: `${d.top}%`, left: `${d.left}%`,
          fontWeight: 900, transform: `rotate(${d.rot}deg)`,
        }}>{d.l}</div>
      ))}
      <div style={{ fontSize: 56, animation: "float 3s ease-in-out infinite", zIndex: 1 }}>🦊</div>
      <div style={{ fontSize: 13, color: "#FFD93D", fontWeight: 800, letterSpacing: 2, zIndex: 1 }}>はじめての</div>
      <div style={{
        fontSize: 34, fontWeight: 900, lineHeight: 1.2, textAlign: "center", zIndex: 1, marginTop: -8,
        background: "linear-gradient(135deg, #FFD93D, #FF6B6B)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>えいたんご<br/>バトル</div>
      <div style={{ fontSize: 11, color: "#5a5a8a", letterSpacing: 2, fontWeight: 700, zIndex: 1 }}>
        はじめての英単語バトル
      </div>
      <div style={{ fontSize: 12, color: "#8a8ab0", marginTop: 4, zIndex: 1, textAlign: "center", lineHeight: 1.7 }}>
        にほんごを みて、あう えいたんごを えらぼう！<br/>
        <span style={{ fontSize: 10, color: "#5a5a8a" }}>📖 れんしゅう ・ ⏱️ タイムチャレンジ ・ ⚔️ 2にん たいせん</span>
      </div>
      <button className="btn" onClick={onStart} style={{
        marginTop: 20, padding: "18px 72px", border: "none", cursor: "pointer",
        background: "linear-gradient(135deg, #FF6B6B, #ee5a24)",
        borderRadius: 50, color: "#fff", fontWeight: 900, fontSize: 22,
        fontFamily: "'Nunito', sans-serif", letterSpacing: 3, zIndex: 1,
        boxShadow: "0 6px 30px rgba(255,107,107,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
        animation: "pulse 2s ease-in-out infinite",
      }}>START</button>
      <PortalLink style={{ marginTop: 12 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MODE SELECT
   ═══════════════════════════════════════════════════════ */
function ModeSelect({ onSelect, onBack, presetStage }) {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16, padding: 24,
      background: "radial-gradient(ellipse at 50% 80%, #1e1245 0%, #0a0a14 70%)",
    }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 20, background: "none", border: "none", color: "#555", fontSize: 16, cursor: "pointer" }}>◀ もどる</button>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>あそびかたを えらぼう！</div>
      {presetStage && (
        <div style={{ fontSize: 12, color: "#FFD93D", fontWeight: 800 }}>
          きょうは {presetStage.label}: {presetStage.sub}
        </div>
      )}
      {["practice", "solo", "battle"].map((key) => {
        const m = MODE_INFO[key];
        return (
          <button key={key} className="btn" onClick={() => onSelect(key)} style={{
            width: "100%", maxWidth: 360, padding: "20px 20px", position: "relative",
            background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`,
            borderRadius: 22, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 16, textAlign: "left",
            boxShadow: `0 6px 24px ${m.color}40`,
          }}>
            <span style={{ fontSize: 40 }}>{m.emoji}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{m.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>{m.desc}</div>
            </div>
            {key === "practice" && <span style={{
              position: "absolute", top: -8, right: 12,
              background: "#fff", color: "#0a8f86", fontSize: 10, fontWeight: 900,
              padding: "3px 10px", borderRadius: 20,
            }}>はじめての ひとは ここから</span>}
            {key === "battle" && <span style={{
              position: "absolute", top: -6, right: 12,
              background: "#FFD93D", color: "#0a0a14", fontSize: 10, fontWeight: 900,
              padding: "3px 10px", borderRadius: 20, transform: "rotate(8deg)",
            }}>2P</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   READY SCREEN — URLでステージとモードが指定されたとき
   ═══════════════════════════════════════════════════════ */
function ReadyScreen({ stage, mode, count, onStart, onBack }) {
  const m = MODE_INFO[mode] || MODE_INFO.practice;
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 14, padding: 24,
      background: "radial-gradient(ellipse at 50% 30%, #1e1245 0%, #0a0a14 70%)",
    }}>
      <div style={{ fontSize: 13, color: "#FFD93D", fontWeight: 800 }}>はじめての えいたんごバトル</div>
      <div style={{ fontSize: 48 }}>{m.emoji}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: m.color }}>{m.title}</div>
      <div style={{ fontSize: 12, color: "#8a8ab0" }}>{m.desc}</div>
      <div style={{
        padding: "14px 22px", borderRadius: 18, textAlign: "center",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>{stage.label}</div>
        <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{stage.sub}</div>
        <div style={{ fontSize: 12, color: "#FFD93D", marginTop: 6, fontWeight: 800 }}>
          {mode === "battle" ? "40びょう しょうぶ" : `${count} もん`}
        </div>
      </div>
      <button className="btn" onClick={onStart} style={{
        marginTop: 10, padding: "18px 64px", border: "none", cursor: "pointer",
        background: "linear-gradient(135deg, #FF6B6B, #ee5a24)",
        borderRadius: 50, color: "#fff", fontWeight: 900, fontSize: 22,
        boxShadow: "0 6px 30px rgba(255,107,107,0.4)",
      }}>スタート！</button>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#777", fontSize: 13, cursor: "pointer", padding: 8 }}>
        ほかの ステージを えらぶ
      </button>
      <PortalLink />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAGE SELECT
   ═══════════════════════════════════════════════════════ */
function StageSelect({ mode, onSelect, onBack }) {
  const [scores, setScores] = useState({});
  useEffect(() => { setScores(loadScores()); }, []);
  const m = MODE_INFO[mode] || MODE_INFO.practice;

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      padding: 20, gap: 10, overflow: "auto", boxSizing: "border-box",
      background: "radial-gradient(ellipse at 50% 0%, #0f2444 0%, #0a0a14 60%)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#555", fontSize: 16, cursor: "pointer" }}>◀</button>
        <span style={{ fontSize: 18, fontWeight: 900 }}>ステージ</span>
        <span style={{ fontSize: 11, color: "#888", marginLeft: "auto" }}>
          {m.emoji} {m.title}
        </span>
      </div>
      {STAGES.map((s, i) => {
        const stat = scores[`stage${s.id}_${mode}`];
        const header = i === 0 ? "🔤 もじの グループべつ（みじかい たんご）"
          : s.kind !== STAGES[i - 1].kind ? "📚 ことばの なかまべつ" : null;
        return (
          <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          {header && <div style={{ fontSize: 11, color: "#8a8ab0", fontWeight: 800, marginTop: i === 0 ? 0 : 8 }}>{header}</div>}
          <button className="btn" onClick={() => onSelect(s.id)} style={{
            padding: "14px 16px", borderRadius: 18, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${STAGE_COLORS[i]}18, ${STAGE_COLORS[i]}08)`,
            borderLeft: `4px solid ${STAGE_COLORS[i]}`,
            display: "flex", alignItems: "center", gap: 14, textAlign: "left",
            animation: `fadeIn 0.3s ease ${i * 0.06}s both`,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
              background: STAGE_COLORS[i], display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff",
              boxShadow: `0 3px 12px ${STAGE_COLORS[i]}44`,
            }}>{s.id}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{s.label}: {s.sub}</div>
              <div style={{ fontSize: 10, color: "#777", marginTop: 2 }}>ぜんぶで {s.words.length} たんご</div>
              {stat && (
                <div style={{ fontSize: 9, color: "#FFD93D", marginTop: 3, display: "flex", gap: 8 }}>
                  <span>Best: {stat.bestScore}</span>
                  {stat.bestCombo >= 2 && <span>x{stat.bestCombo}</span>}
                  <span>{stat.plays}かい</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 20, color: "#333" }}>▸</div>
          </button>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SOLO GAME — れんしゅう（タイマーなし）/ タイムチャレンジ / ふくしゅう
   ═══════════════════════════════════════════════════════ */
const BASE_TIME = 15;

/* ═══════════════════════════════════════════════════════
   LEARN PHASE — 5語を1つずつ見て覚える（音声つき）
   ═══════════════════════════════════════════════════════ */
function LearnPhase({ words, onFinish }) {
  const [idx, setIdx] = useState(0);
  const word = words[idx];

  useEffect(() => {
    speakEnglish(word.en);
  }, [idx, word.en]);

  const next = () => {
    if (idx + 1 >= words.length) {
      onFinish();
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse at 50% 20%, #1e1245 0%, #0a0a14 70%)",
      alignItems: "center", justifyContent: "center", gap: 20, padding: 20,
    }}>
      <div style={{ fontSize: 11, color: "#6C5CE7", fontWeight: 700, letterSpacing: 2 }}>
        まず おぼえよう（{idx + 1} / {words.length}）
      </div>

      <div style={{
        background: "rgba(255,255,255,0.06)", borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "40px 48px", textAlign: "center", minWidth: 280,
      }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#4ECDC4", fontFamily: "'Nunito', sans-serif", marginBottom: 12 }}>
          {word.en}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>
          {word.ja}
        </div>
      </div>

      <button onClick={() => speakEnglish(word.en)} style={{
        background: "rgba(108,92,231,0.3)", border: "1px solid rgba(108,92,231,0.5)",
        borderRadius: 16, padding: "12px 24px", color: "#a8a0e0",
        fontSize: 16, fontWeight: 700, cursor: "pointer",
      }}>
        🔊 もういちど きく
      </button>

      <button onClick={next} className="btn" style={{
        background: "linear-gradient(135deg, #6C5CE7, #a29bfe)",
        border: "none", borderRadius: 20, padding: "16px 48px",
        color: "#fff", fontSize: 20, fontWeight: 900, cursor: "pointer",
        boxShadow: "0 4px 20px rgba(108,92,231,0.4)",
      }}>
        {idx + 1 >= words.length ? "はじめる！ ▶" : "つぎへ →"}
      </button>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {words.map((_, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: "50%",
            background: i <= idx ? "#6C5CE7" : "rgba(255,255,255,0.15)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}

function SoloGame({ state, setState, stage, onFinish }) {
  const timed = !!state.timed && !state.isReviewMode;
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | "timeout"
  const [picked, setPicked] = useState(null);
  const [timeLeft, setTimeLeft] = useState(BASE_TIME);
  const [comboMilestone, setComboMilestone] = useState(null);
  const comboTimerRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const lockRef = useRef(false);       // 1もんにつき こたえは1回だけ
  const firstMissRef = useRef({});     // ふくしゅう: さいしょにまちがえた こたえ

  const q = state.questions[state.current];
  const choices = useMemo(() => pickChoices(q, stage.words), [state.current, state.questions]);

  // Adaptive difficulty: compute time limit based on last 5 answers
  const getAdaptiveTimeLimit = (recentResults) => {
    if (!recentResults || recentResults.length < 5) return BASE_TIME;
    const accuracy = recentResults.slice(-5).filter(Boolean).length / 5;
    if (accuracy < 0.4) return BASE_TIME + 3; // struggling: extend by 3s
    if (accuracy > 0.8) return Math.max(5, BASE_TIME - 2); // doing great: reduce by 2s
    return BASE_TIME;
  };
  const timeLimit = getAdaptiveTimeLimit(state.recentResults);

  // 新しいもんだいになったらリセット
  useEffect(() => {
    lockRef.current = false;
    setTimeLeft(getAdaptiveTimeLimit(state.recentResults));
    setFeedback(null);
    setPicked(null);
  }, [state.current]);

  // カウントダウン（タイムチャレンジのみ）。0になったら「じかんぎれ」として1回だけ処理する
  useEffect(() => {
    if (!timed || feedback) return;
    if (timeLeft <= 0) { handleAnswer(null); return; }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timed, feedback, timeLeft, state.current]);

  useEffect(() => () => {
    clearTimeout(advanceTimerRef.current);
    clearTimeout(comboTimerRef.current);
  }, []);

  // Combo milestone labels
  const COMBO_MILESTONES = { 3: "NICE! 🎯", 5: "GREAT! 🔥", 7: "AMAZING! ⚡", 10: "UNSTOPPABLE! 💥" };

  const handleAnswer = (selected) => {
    if (lockRef.current) return;
    lockRef.current = true;
    const timedOut = selected === null;
    const correct = selected === q.en;
    setPicked(selected);
    setFeedback(correct ? "correct" : timedOut ? "timeout" : "wrong");

    // Sound effects
    if (correct) playCorrectSound(); else playWrongSound();
    // TTS — speak the correct English word
    speakEnglish(q.en);

    // ふくしゅう: まちがえたら こたえを見せて、おなじもんだいをもういちど
    if (state.isReviewMode && !correct) {
      if (!(q.en in firstMissRef.current)) firstMissRef.current[q.en] = selected;
      advanceTimerRef.current = setTimeout(() => {
        setFeedback(null);
        setPicked(null);
        lockRef.current = false;
      }, 1200);
      return;
    }

    // ふくしゅうでは「1回目でせいかい」だけをせいかいに数える
    const missedFirst = state.isReviewMode && (q.en in firstMissRef.current);
    const counted = correct && !missedFirst;
    const newCombo = counted ? state.combo + 1 : 0;

    // Combo milestone celebration
    if (counted && COMBO_MILESTONES[newCombo]) {
      clearTimeout(comboTimerRef.current);
      setComboMilestone(COMBO_MILESTONES[newCombo]);
      comboTimerRef.current = setTimeout(() => setComboMilestone(null), 1500);
    }

    const entry = {
      word: q,
      selected: missedFirst ? firstMissRef.current[q.en] : selected,
      correct: counted,
      timedOut: !missedFirst && timedOut,
    };
    const updatedRecent = [...(state.recentResults || []), counted].slice(-5);
    // まちがえたときは こたえをよむ時間をとる（れんしゅうは長め）
    const delay = correct ? 700 : timed ? 1300 : 2000;

    advanceTimerRef.current = setTimeout(() => {
      // 間違えた問題をキューの末尾に追加（1回だけ再出題）
      let updatedQuestions = state.questions;
      if (!correct && !q._retry) {
        updatedQuestions = [...state.questions, { ...q, _retry: true }];
      }

      const next = state.current + 1;
      const allAnswers = [...state.answers, entry];
      if (next >= updatedQuestions.length) {
        onFinish({
          mode: "solo",
          modeKey: state.modeKey,
          timed,
          score: allAnswers.filter((a) => a.correct).length,
          total: updatedQuestions.length,
          maxCombo: Math.max(state.maxCombo, newCombo),
          mistakes: allAnswers.filter((a) => !a.correct).map((a) => ({ word: a.word, selected: a.selected, timedOut: a.timedOut })),
          time: ((Date.now() - state.startTime) / 1000).toFixed(1),
          isReviewMode: state.isReviewMode,
        });
      } else {
        setState((s) => ({
          ...s,
          questions: updatedQuestions,
          current: next,
          score: s.score + (counted ? 1 : 0),
          combo: newCombo,
          maxCombo: Math.max(s.maxCombo, newCombo),
          answers: allAnswers,
          recentResults: updatedRecent,
        }));
      }
    }, delay);
  };

  const pct = ((state.current) / state.questions.length) * 100;
  const showAnswer = !!feedback;
  const jaSize = q.ja.length > 12 ? 22 : q.ja.length > 7 ? 28 : 36;

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse at 50% 20%, #1e1245 0%, #0a0a14 70%)",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#777" }}>
          {stage.label} ・ {state.isReviewMode ? "🔄 ふくしゅう" : timed ? "⏱️ タイムチャレンジ" : "📖 れんしゅう"}
        </span>
        <span style={{ fontSize: 13, color: "#FFD93D", fontWeight: 800 }}>{state.current + 1}/{state.questions.length}</span>
      </div>
      {/* Progress */}
      <div style={{ height: 4, background: "#111", margin: "0 16px", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #4ECDC4, #FFD93D)", borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      {/* Timer (タイムチャレンジのみ) */}
      {timed && (
        <div style={{ height: 3, background: "#111", margin: "4px 16px 0", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${Math.max(0, Math.min(1, timeLeft / timeLimit)) * 100}%`, background: timeLeft <= 5 ? "#FF6B6B" : "#6C5CE7", borderRadius: 2, transition: "width 1s linear" }} />
        </div>
      )}
      {!timed && (
        <div style={{ textAlign: "center", fontSize: 11, color: "#7d6ff0", fontWeight: 700, marginTop: 6 }}>
          {state.isReviewMode
            ? "ふくしゅう — じかんせいげん なし・せいかいするまで チャレンジ"
            : "じかんせいげん なし — ゆっくり かんがえて いいよ"}
        </div>
      )}

      {/* Combo milestone overlay */}
      {comboMilestone && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, pointerEvents: "none",
        }}>
          <div style={{
            fontSize: 48, fontWeight: 900, color: "#FFD93D",
            textShadow: "0 0 40px rgba(255,217,61,0.5), 0 4px 20px rgba(0,0,0,0.5)",
            animation: "comboMilestone 1.5s ease-out forwards",
            textAlign: "center", lineHeight: 1.3,
          }}>
            {comboMilestone}
          </div>
        </div>
      )}

      {/* Question area */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12, padding: 20,
      }}>
        {state.combo >= 2 && (
          <div style={{ fontSize: 12, color: "#FFD93D", fontWeight: 800, animation: "popIn 0.3s ease" }}>
            🔥 x{state.combo} COMBO!
          </div>
        )}
        <div style={{ fontSize: 12, color: "#8a8ab0", letterSpacing: 1 }}>にほんごを みて えいたんごを えらぼう</div>
        <div style={{
          color: "#fff", textAlign: "center",
          padding: "16px 28px", borderRadius: 20,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          animation: feedback === "correct" ? "popIn 0.3s ease" : feedback ? "shake 0.3s ease" : "fadeIn 0.3s ease",
          boxShadow: feedback === "correct" ? "0 0 30px rgba(78,205,196,0.3)" : feedback ? "0 0 30px rgba(255,107,107,0.3)" : "none",
        }}>
          {q.em && <div style={{ fontSize: 44, lineHeight: 1.2 }} aria-hidden="true">{q.em}</div>}
          <div style={{ fontSize: jaSize, fontWeight: 900, lineHeight: 1.3 }}>{q.ja}</div>
        </div>
        {/* Feedback line: こたえを はっきり見せる */}
        <div style={{ minHeight: 24, fontSize: 15, fontWeight: 800, textAlign: "center",
          color: feedback === "correct" ? "#4ECDC4" : "#FF9F9F" }}>
          {feedback === "correct" && <>⭕ せいかい！ <b>{q.en}</b></>}
          {feedback === "wrong" && <>こたえは <b style={{ color: "#4ECDC4" }}>{q.en}</b> だよ</>}
          {feedback === "timeout" && <>⏰ じかんぎれ！ こたえは <b style={{ color: "#4ECDC4" }}>{q.en}</b></>}
        </div>

        {/* Choices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360 }}>
          {choices.map((c, i) => {
            const isAnswer = showAnswer && c.en === q.en;
            const isWrongPick = showAnswer && picked === c.en && c.en !== q.en;
            return (
              <button key={c.en + i} className="btn" disabled={showAnswer} onClick={() => handleAnswer(c.en)} style={{
                padding: "14px 20px", borderRadius: 16, border: "none", cursor: showAnswer ? "default" : "pointer",
                background: isAnswer ? "rgba(78,205,196,0.2)"
                  : isWrongPick ? "rgba(255,107,107,0.18)"
                  : showAnswer ? "rgba(255,255,255,0.02)"
                  : "rgba(255,255,255,0.07)",
                borderLeft: isAnswer ? "4px solid #4ECDC4" : isWrongPick ? "4px solid #FF6B6B" : "4px solid transparent",
                fontSize: 22, fontWeight: 800, color: isAnswer ? "#4ECDC4" : isWrongPick ? "#FF6B6B" : "#d0d0e0",
                fontFamily: "'Nunito', sans-serif", textAlign: "center",
                opacity: showAnswer && !isAnswer && !isWrongPick ? 0.4 : 1,
                transition: "all 0.2s",
                animation: `fadeIn 0.2s ease ${i * 0.05}s both`,
              }}>
                {c.en}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BATTLE GAME — 2 Player Independent Split Screen
   Each player gets their own random questions and
   progresses at their own pace. Fastest answerer wins!
   ═══════════════════════════════════════════════════════ */
function BattleGame({ state, setState, stage, onFinish }) {
  const timerRef = useRef(null);
  const feedbackTimers = useRef({ p1: null, p2: null });
  const finishedRef = useRef(false);

  const finishGame = useCallback((s) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearInterval(timerRef.current);
    clearTimeout(feedbackTimers.current.p1);
    clearTimeout(feedbackTimers.current.p2);
    const allMistakes = [...s.p1.mistakes, ...s.p2.mistakes];
    // Deduplicate mistakes by word
    const seen = new Set();
    const uniqueMistakes = allMistakes.filter((m) => {
      const key = m.word.en + m.player;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    onFinish({
      mode: "battle",
      p1Score: s.p1.score, p2Score: s.p2.score,
      p1Answered: s.p1.answered, p2Answered: s.p2.answered,
      p1MaxCombo: s.p1.maxCombo, p2MaxCombo: s.p2.maxCombo,
      total: Math.max(s.p1.answered, s.p2.answered),
      mistakes: uniqueMistakes,
    });
  }, [onFinish]);

  // Global countdown timer
  useEffect(() => {
    finishedRef.current = false;
    timerRef.current = setInterval(() => {
      setState((s) => {
        if (s.timer <= 1) {
          clearInterval(timerRef.current);
          setTimeout(() => finishGame({ ...s, timer: 0, phase: "done" }), 100);
          return { ...s, timer: 0, phase: "done" };
        }
        return { ...s, timer: s.timer - 1 };
      });
    }, 1000);
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(feedbackTimers.current.p1);
      clearTimeout(feedbackTimers.current.p2);
    };
  }, []);

  const handlePlayerAnswer = (player, selected) => {
    const pKey = player === 1 ? "p1" : "p2";

    setState((prev) => {
      if (prev.phase === "done" || prev[pKey].feedback) return prev;

      const pState = prev[pKey];
      const q = pState.questions[pState.current];
      const correct = selected === q.en;

      const newP = { ...pState };
      newP.feedback = correct ? "correct" : "wrong";
      newP.answered = (pState.answered || 0) + 1;

      // Sound effects
      if (correct) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
      // TTS — speak the correct English word
      speakEnglish(q.en);

      if (correct) {
        newP.score = pState.score + 1;
        newP.combo = pState.combo + 1;
        newP.maxCombo = Math.max(pState.maxCombo, newP.combo);
      } else {
        newP.combo = 0;
        newP.mistakes = [...pState.mistakes, { word: q, player, selected }];
      }

      // After brief feedback, advance to next question
      clearTimeout(feedbackTimers.current[pKey]);
      feedbackTimers.current[pKey] = setTimeout(() => {
        setState((s) => {
          if (s.phase === "done") return s;
          const p = s[pKey];
          const next = p.current + 1;
          const nextQ = p.questions[next];
          if (!nextQ) return s; // ran out of questions (unlikely with 3x pool)
          return {
            ...s,
            [pKey]: {
              ...p,
              current: next,
              choices: pickChoices(nextQ, stage.words),
              feedback: null,
            },
          };
        });
      }, 350);

      return { ...prev, [pKey]: newP };
    });
  };

  const PlayerSide = ({ player, pKey, colorA, colorB, align }) => {
    const pState = state[pKey];
    const q = pState.questions[pState.current];
    const isDone = state.phase === "done";

    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
        background: `linear-gradient(180deg, ${colorA}15 0%, #0a0a14 100%)`,
      }}>
        {/* Score header */}
        <div style={{
          padding: "8px 12px", display: "flex", alignItems: "center",
          justifyContent: "space-between",
          background: `${colorA}12`, borderBottom: `1px solid ${colorA}25`,
        }}>
          {align === "left" ? <>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 20 }}>{player === 1 ? "🦊" : "🐻"}</span>
              <span style={{ fontSize: 11, color: colorA, fontWeight: 800 }}>P{player}</span>
            </div>
            <div style={{
              background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
              borderRadius: 20, padding: "2px 14px", fontSize: 20, fontWeight: 900, color: "#fff",
            }}>{pState.score}</div>
          </> : <>
            <div style={{
              background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
              borderRadius: 20, padding: "2px 14px", fontSize: 20, fontWeight: 900, color: "#fff",
            }}>{pState.score}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: colorA, fontWeight: 800 }}>P{player}</span>
              <span style={{ fontSize: 20 }}>{player === 1 ? "🦊" : "🐻"}</span>
            </div>
          </>}
        </div>

        {/* Question + Choices */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 10px",
        }}>
          {pState.combo >= 2 && (
            <div style={{ fontSize: 10, color: "#FFD93D", fontWeight: 800, animation: "popIn 0.2s ease" }}>
              🔥 x{pState.combo}
            </div>
          )}

          {/* Progress indicator - how many answered */}
          <div style={{ fontSize: 9, color: "#444", fontWeight: 700, letterSpacing: 1 }}>
            Q.{pState.current + 1}
          </div>

          {/* Japanese word question */}
          <div key={pState.current} style={{
            fontSize: Math.min(26, Math.max(14, 170 / q.ja.length)), fontWeight: 900, color: "#fff", lineHeight: 1.3,
            padding: "10px 16px", borderRadius: 14,
            background: pState.feedback === "correct" ? `${colorA}20`
              : pState.feedback === "wrong" ? "rgba(255,70,70,0.15)"
              : "rgba(255,255,255,0.04)",
            border: pState.feedback === "correct" ? `2px solid ${colorA}`
              : pState.feedback === "wrong" ? "2px solid #FF6B6B"
              : "2px solid transparent",
            textAlign: "center", minWidth: 80,
            animation: pState.feedback === "correct" ? "popIn 0.3s ease"
              : pState.feedback === "wrong" ? "shake 0.3s ease"
              : "fadeIn 0.15s ease",
          }}>
            {q.em && <span aria-hidden="true">{q.em} </span>}{q.ja}
          </div>

          {/* Answer feedback flash */}
          {pState.feedback && (
            <div style={{
              fontSize: 18, fontWeight: 900, animation: "popIn 0.2s ease",
              color: pState.feedback === "correct" ? colorA : "#FF6B6B",
            }}>
              {pState.feedback === "correct" ? "◎" : "✕"}
            </div>
          )}

          {/* 4 choices */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "92%", marginTop: 4 }}>
            {pState.choices.map((c, i) => (
              <button key={`${pState.current}-${c.en}-${i}`} className="btn"
                disabled={!!pState.feedback || isDone}
                onClick={() => handlePlayerAnswer(player, c.en)}
                style={{
                  padding: "10px 8px", borderRadius: 12, border: "none",
                  cursor: pState.feedback || isDone ? "default" : "pointer",
                  background: pState.feedback && c.en === q.en ? `${colorA}25`
                    : pState.feedback ? "rgba(255,255,255,0.02)"
                    : "rgba(255,255,255,0.05)",
                  fontSize: 16, fontWeight: 800,
                  color: pState.feedback && c.en === q.en ? colorA : "#c0c0d0",
                  fontFamily: "'Nunito', sans-serif", textAlign: "center",
                  opacity: pState.feedback && c.en !== q.en ? 0.3 : 1,
                  transition: "all 0.15s",
                }}
              >{c.en}</button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: "100vh", display: "flex", position: "relative" }}>
      <PlayerSide player={1} pKey="p1" colorA="#FF6B6B" colorB="#ee5a24" align="left" />

      {/* Center divider + timer */}
      <div style={{
        width: 3, background: "linear-gradient(180deg, #FFD93D44, #FFD93D, #FFD93D44)",
        position: "relative", zIndex: 10,
        boxShadow: "0 0 12px rgba(255,217,61,0.2)",
      }}>
        {/* Timer circle */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 44, height: 44, borderRadius: "50%",
          background: state.timer <= 10 ? "linear-gradient(135deg, #FF6B6B, #ee5a24)" : "linear-gradient(135deg, #FFD93D, #f39c12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 900, color: "#0a0a14",
          boxShadow: "0 4px 20px rgba(255,217,61,0.4)",
          animation: state.timer <= 5 ? "pulse 0.5s ease infinite" : "none",
        }}>{state.timer}</div>
        {/* VS label */}
        <div style={{
          position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
          fontSize: 10, color: "#FFD93D", fontWeight: 900, whiteSpace: "nowrap",
          background: "#0a0a14", padding: "2px 10px", borderRadius: 10,
          border: "1px solid #FFD93D44",
        }}>VS</div>
        {/* Score comparison */}
        <div style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
          fontSize: 9, fontWeight: 800, whiteSpace: "nowrap",
          background: "#0a0a14", padding: "3px 8px", borderRadius: 10,
          border: "1px solid #FFD93D22",
        }}>
          <span style={{ color: "#FF6B6B" }}>{state.p1.score}</span>
          <span style={{ color: "#555" }}> - </span>
          <span style={{ color: "#4ECDC4" }}>{state.p2.score}</span>
        </div>
      </div>

      <PlayerSide player={2} pKey="p2" colorA="#4ECDC4" colorB="#00B894" align="right" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RESULT SCREEN
   ═══════════════════════════════════════════════════════ */
function ResultScreen({ results, mode, stageId, onRetry, onHome, onReview }) {
  const isBattle = results.mode === "battle";
  const winner = isBattle ? (results.p1Score > results.p2Score ? 1 : results.p2Score > results.p1Score ? 2 : 0) : null;
  const [wrongHistory, setWrongHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setWrongHistory(loadWrongAnswers().filter(w => w.stageId === stageId));
  }, [stageId]);

  const mistakes = results.mistakes || [];
  const timeoutCount = mistakes.filter((m) => m.timedOut).length;
  const wrongCount = mistakes.length - timeoutCount;
  // 紙ふぶきの位置はマウント時に1回だけ決める
  const confetti = useMemo(() => [...Array(30)].map((_, i) => ({
    size: 6 + Math.random() * 10, size2: 6 + Math.random() * 10, left: 5 + Math.random() * 90,
    dur: 2 + Math.random() * 3, delay: Math.random() * 2,
  })), []);

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 24px",
      background: "radial-gradient(ellipse at 50% 30%, #1e1245 0%, #0a0a14 70%)",
      position: "relative", overflow: "hidden auto", boxSizing: "border-box",
    }}>
      {/* Confetti */}
      {confetti.map((c, i) => (
        <div key={i} style={{
          position: "absolute", width: c.size, height: c.size2, pointerEvents: "none",
          background: STAGE_COLORS[i % 7], borderRadius: i % 3 === 0 ? "50%" : 2,
          top: -20, left: `${c.left}%`,
          animation: `confettiFall ${c.dur}s ease ${c.delay}s both`,
        }} />
      ))}

      <div style={{ fontSize: 48, animation: "popIn 0.5s ease" }}>🏆</div>

      {isBattle ? (
        <>
          <div style={{
            fontSize: 24, fontWeight: 900,
            background: "linear-gradient(135deg, #FFD93D, #FF6B6B)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {winner === 0 ? "ひきわけ！" : `Player ${winner} WIN!`}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 28, marginTop: 8 }}>
            {[
              { p: 1, emoji: "🦊", score: results.p1Score, color: "#FF6B6B", combo: results.p1MaxCombo, answered: results.p1Answered },
              { p: 2, emoji: "🐻", score: results.p2Score, color: "#4ECDC4", combo: results.p2MaxCombo, answered: results.p2Answered },
            ].map((d) => (
              <div key={d.p} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32 }}>{d.emoji}</div>
                <div style={{ fontSize: 11, color: d.color, fontWeight: 800 }}>P{d.p}</div>
                <div style={{
                  fontSize: 36, fontWeight: 900, color: winner === d.p ? "#FFD93D" : "#666",
                  textShadow: winner === d.p ? "0 0 16px rgba(255,217,61,0.3)" : "none",
                }}>{d.score}</div>
                <div style={{ fontSize: 9, color: "#555" }}>{d.score}/{d.answered} せいかい</div>
                {d.combo >= 2 && <div style={{ fontSize: 9, color: "#FFD93D" }}>🔥 max x{d.combo}</div>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{
            fontSize: 24, fontWeight: 900,
            background: "linear-gradient(135deg, #FFD93D, #4ECDC4)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {results.score}/{results.total} せいかい！
          </div>
          <div style={{ fontSize: 11, color: "#8a8ab0", fontWeight: 700 }}>
            {results.isReviewMode ? "🔄 ふくしゅう（1かいめで せいかいした かず）" : results.timed ? "⏱️ タイムチャレンジ" : "📖 れんしゅう"}
          </div>
          <div style={{ fontSize: 12, color: "#777" }}>
            {results.timed && <>⏱ {results.time}s ・ </>}🔥 max x{results.maxCombo}
            {mistakes.length > 0 && <> ・ ✕ まちがい {wrongCount}</>}
            {timeoutCount > 0 && <> ・ ⏰ じかんぎれ {timeoutCount}</>}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{ fontSize: 24, opacity: results.score / results.total >= (i + 1) / 3 ? 1 : 0.2 }}>★</span>
            ))}
          </div>
          {/* Near-miss / perfect feedback */}
          {!results.isReviewMode && results.score === results.total && (
            <div style={{
              fontSize: 28, fontWeight: 900, marginTop: 8, textAlign: "center",
              background: "linear-gradient(135deg, #FFD93D, #4ECDC4)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "popIn 0.5s ease",
            }}>PERFECT! 💎</div>
          )}
          {!results.isReviewMode && results.score < results.total && results.score / results.total >= 0.8 && (
            <div style={{
              fontSize: 14, fontWeight: 800, marginTop: 8, color: "#FFD93D",
              textAlign: "center", animation: "fadeIn 0.5s ease",
            }}>
              あと{results.total - results.score}もんで パーフェクト！
            </div>
          )}
        </>
      )}

      {/* Mistakes */}
      {results.mistakes && results.mistakes.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 14,
          width: "100%", maxWidth: 360, marginTop: 8,
          border: "1px solid rgba(255,255,255,0.05)", maxHeight: 140, overflow: "auto",
        }}>
          <div style={{ fontSize: 11, color: "#6C5CE7", fontWeight: 800, marginBottom: 6 }}>
            📝 もういちど みておこう
          </div>
          {results.mistakes.slice(0, 8).map((m, i) => (
            <div key={i} style={{ fontSize: 12, color: "#888", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#FF6B6B" }}>{m.timedOut ? "⏰" : "✕"}</span>
              <span>{m.word.em ? m.word.em + " " : ""}{m.word.ja}</span>
              <span>→</span>
              <span style={{ color: "#4ECDC4", fontWeight: 800 }}>{m.word.en}</span>
              <button onClick={() => speakEnglish(m.word.en)} style={{
                background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1,
              }}>🔊</button>
              {isBattle && <span style={{ fontSize: 9, color: "#555" }}>(P{m.player})</span>}
            </div>
          ))}
        </div>
      )}

      {/* Wrong answer history from localStorage */}
      {wrongHistory.length > 0 && (
        <div style={{ width: "100%", maxWidth: 360 }}>
          <button onClick={() => setShowHistory(!showHistory)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 11, color: "#6C5CE7", fontWeight: 800, padding: "4px 0",
          }}>
            {showHistory ? "▼" : "▸"} にがてな たんご ({wrongHistory.length})
          </button>
          {showHistory && (
            <div style={{
              background: "rgba(108,92,231,0.06)", borderRadius: 12, padding: 10,
              border: "1px solid rgba(108,92,231,0.15)", maxHeight: 120, overflow: "auto",
            }}>
              {wrongHistory.slice(0, 15).map((w, i) => (
                <div key={i} style={{ fontSize: 11, color: "#777", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{w.ja}</span>
                  <span style={{ color: "#555" }}>→</span>
                  <span style={{ color: "#4ECDC4", fontWeight: 700 }}>{w.en}</span>
                  <button onClick={() => speakEnglish(w.en)} style={{
                    background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, lineHeight: 1,
                  }}>🔊</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review mode button */}
      {results.mistakes && results.mistakes.length > 0 && !results.isReviewMode && onReview && (
        <button className="btn" onClick={() => onReview(results.mistakes)} style={{
          width: "100%", maxWidth: 360, padding: "14px 0", borderRadius: 50,
          border: "2px solid #6C5CE7", background: "rgba(108,92,231,0.1)",
          color: "#6C5CE7", fontWeight: 900, fontSize: 14, cursor: "pointer",
          marginTop: 8, animation: "fadeIn 0.5s ease 0.3s both",
        }}>🔄 にがてを ふくしゅう（じかんせいげん なし）</button>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: 12, marginTop: 12, width: "100%", maxWidth: 360 }}>
        <button className="btn" onClick={onHome} style={{
          flex: 1, padding: "14px 0", borderRadius: 50, border: "1px solid #222",
          background: "transparent", color: "#888", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>もどる</button>
        <button className="btn" onClick={onRetry} style={{
          flex: 1.3, padding: "14px 0", borderRadius: 50, border: "none",
          background: "linear-gradient(135deg, #FFD93D, #f39c12)",
          color: "#0a0a14", fontWeight: 900, fontSize: 14, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(255,217,61,0.25)",
        }}>もういちど！🔥</button>
      </div>
      <PortalLink style={{ marginTop: 4, flexShrink: 0 }} />
    </div>
  );
}
