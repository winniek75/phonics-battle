"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════
   WORD DATA — Japanese (with hiragana) + English
   ═══════════════════════════════════════════════════════ */
const STAGES = [
  {
    id: 1, label: "Stage 1", sub: "s, a, t, i, p, n",
    words: [
      { en: "sat", ja: "すわった" }, { en: "sit", ja: "すわる" },
      { en: "pin", ja: "ピン" }, { en: "pan", ja: "フライパン" },
      { en: "tap", ja: "じゃぐち" }, { en: "tip", ja: "さき" },
      { en: "tin", ja: "かん" }, { en: "nap", ja: "ひるね" },
      { en: "sip", ja: "すする" }, { en: "pat", ja: "なでる" },
      { en: "ant", ja: "アリ" }, { en: "pit", ja: "あな" },
    ],
  },
  {
    id: 2, label: "Stage 2", sub: "c/k, e, h, r, m, d",
    words: [
      { en: "cat", ja: "ねこ" }, { en: "hat", ja: "ぼうし" },
      { en: "rat", ja: "ねずみ" }, { en: "hen", ja: "めんどり" },
      { en: "red", ja: "あかい" }, { en: "map", ja: "ちず" },
      { en: "mat", ja: "マット" }, { en: "man", ja: "おとこのひと" },
      { en: "kid", ja: "こども" }, { en: "dam", ja: "ダム" },
      { en: "met", ja: "あった" }, { en: "den", ja: "すあな" },
      { en: "kit", ja: "どうぐ" }, { en: "rim", ja: "ふち" },
    ],
  },
  {
    id: 3, label: "Stage 3", sub: "g, o, u, l, f, b",
    words: [
      { en: "dog", ja: "いぬ" }, { en: "log", ja: "まるた" },
      { en: "fog", ja: "きり" }, { en: "fun", ja: "たのしい" },
      { en: "sun", ja: "たいよう" }, { en: "bug", ja: "むし" },
      { en: "mug", ja: "マグカップ" }, { en: "hug", ja: "だきしめる" },
      { en: "bus", ja: "バス" }, { en: "bed", ja: "ベッド" },
      { en: "big", ja: "おおきい" }, { en: "bat", ja: "コウモリ" },
      { en: "box", ja: "はこ" }, { en: "fox", ja: "キツネ" },
      { en: "leg", ja: "あし" }, { en: "lip", ja: "くちびる" },
    ],
  },
  {
    id: 4, label: "Stage 4", sub: "ai, j, oa, ie, ee, or",
    words: [
      { en: "rain", ja: "あめ" }, { en: "tail", ja: "しっぽ" },
      { en: "mail", ja: "てがみ" }, { en: "nail", ja: "くぎ" },
      { en: "jam", ja: "ジャム" }, { en: "jet", ja: "ジェットき" },
      { en: "boat", ja: "ボート" }, { en: "coat", ja: "コート" },
      { en: "road", ja: "みち" }, { en: "pie", ja: "パイ" },
      { en: "tie", ja: "ネクタイ" }, { en: "bee", ja: "ハチ" },
      { en: "tree", ja: "き" }, { en: "fork", ja: "フォーク" },
      { en: "corn", ja: "とうもろこし" },
    ],
  },
  {
    id: 5, label: "Stage 5", sub: "どうし (Verbs)",
    words: [
      { en: "eat", ja: "たべる" }, { en: "drink", ja: "のむ" },
      { en: "run", ja: "はしる" }, { en: "walk", ja: "あるく" },
      { en: "swim", ja: "およぐ" }, { en: "jump", ja: "ジャンプする" },
      { en: "sit", ja: "すわる" }, { en: "stand", ja: "たつ" },
      { en: "sleep", ja: "ねむる" }, { en: "stop", ja: "とまる" },
      { en: "wash", ja: "あらう" }, { en: "cook", ja: "りょうりする" },
      { en: "open", ja: "あける" }, { en: "close", ja: "しめる" },
      { en: "go", ja: "いく" }, { en: "come", ja: "くる" },
      { en: "see", ja: "みる" }, { en: "look", ja: "みる（よく）" },
      { en: "read", ja: "よむ" }, { en: "write", ja: "かく" },
      { en: "draw", ja: "えをかく" }, { en: "sing", ja: "うたう" },
      { en: "speak", ja: "はなす" }, { en: "listen", ja: "きく" },
      { en: "play", ja: "あそぶ" }, { en: "study", ja: "べんきょうする" },
      { en: "make", ja: "つくる" }, { en: "have", ja: "もっている" },
      { en: "do", ja: "する" }, { en: "like", ja: "すき" },
      { en: "want", ja: "ほしい" }, { en: "know", ja: "しっている" },
      { en: "think", ja: "かんがえる" }, { en: "help", ja: "たすける" },
      { en: "give", ja: "あげる" }, { en: "take", ja: "とる" },
      { en: "buy", ja: "かう" }, { en: "use", ja: "つかう" },
      { en: "get", ja: "てにいれる" }, { en: "meet", ja: "あう" },
      { en: "live", ja: "すむ" }, { en: "work", ja: "はたらく" },
      { en: "start", ja: "はじめる" }, { en: "try", ja: "やってみる" },
      { en: "enjoy", ja: "たのしむ" }, { en: "wait", ja: "まつ" },
      { en: "teach", ja: "おしえる" }, { en: "fly", ja: "とぶ" },
      { en: "ride", ja: "のる" }, { en: "watch", ja: "みる（テレビ）" },
      { en: "find", ja: "みつける" }, { en: "call", ja: "でんわする" },
      { en: "ask", ja: "たずねる" }, { en: "show", ja: "みせる" },
      { en: "clean", ja: "そうじする" }, { en: "cut", ja: "きる" },
      { en: "rain", ja: "あめがふる" }, { en: "snow", ja: "ゆきがふる" },
    ],
  },
  {
    id: 6, label: "Stage 6", sub: "けいようし (Adjectives)",
    words: [
      { en: "big", ja: "おおきい" }, { en: "small", ja: "ちいさい" },
      { en: "long", ja: "ながい" }, { en: "short", ja: "みじかい" },
      { en: "tall", ja: "せがたかい" }, { en: "new", ja: "あたらしい" },
      { en: "old", ja: "ふるい" }, { en: "hot", ja: "あつい" },
      { en: "cold", ja: "さむい" }, { en: "fast", ja: "はやい" },
      { en: "slow", ja: "おそい" }, { en: "good", ja: "よい" },
      { en: "bad", ja: "わるい" }, { en: "happy", ja: "しあわせ" },
      { en: "sad", ja: "かなしい" }, { en: "angry", ja: "おこっている" },
      { en: "tired", ja: "つかれた" }, { en: "hungry", ja: "おなかすいた" },
      { en: "kind", ja: "やさしい" }, { en: "nice", ja: "すてき" },
      { en: "beautiful", ja: "うつくしい" }, { en: "cute", ja: "かわいい" },
      { en: "red", ja: "あかい" }, { en: "blue", ja: "あおい" },
      { en: "yellow", ja: "きいろい" }, { en: "green", ja: "みどりの" },
      { en: "white", ja: "しろい" }, { en: "black", ja: "くろい" },
      { en: "pink", ja: "ピンクの" }, { en: "brown", ja: "ちゃいろの" },
      { en: "purple", ja: "むらさきの" }, { en: "orange", ja: "オレンジの" },
      { en: "sunny", ja: "はれ" }, { en: "cloudy", ja: "くもり" },
      { en: "rainy", ja: "あめ" }, { en: "windy", ja: "かぜがつよい" },
      { en: "easy", ja: "かんたん" }, { en: "hard", ja: "むずかしい" },
      { en: "busy", ja: "いそがしい" }, { en: "great", ja: "すばらしい" },
      { en: "many", ja: "たくさんの" }, { en: "important", ja: "たいせつ" },
      { en: "popular", ja: "にんき" }, { en: "favorite", ja: "おきにいり" },
      { en: "ready", ja: "じゅんびOK" }, { en: "sorry", ja: "ごめんなさい" },
      { en: "right", ja: "ただしい" }, { en: "wrong", ja: "まちがい" },
      { en: "sick", ja: "びょうき" }, { en: "special", ja: "とくべつ" },
    ],
  },
  {
    id: 7, label: "Stage 7", sub: "だいめいし (Pronouns)",
    words: [
      { en: "I", ja: "わたし" }, { en: "you", ja: "あなた" },
      { en: "he", ja: "かれ" }, { en: "she", ja: "かのじょ" },
      { en: "it", ja: "それ" }, { en: "we", ja: "わたしたち" },
      { en: "they", ja: "かれら" }, { en: "me", ja: "わたしを" },
      { en: "him", ja: "かれを" }, { en: "her", ja: "かのじょを" },
      { en: "us", ja: "わたしたちを" }, { en: "them", ja: "かれらを" },
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
   MAIN APP
   ═══════════════════════════════════════════════════════ */
export default function PhonicsGame() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState(null);
  const [stageId, setStageId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [results, setResults] = useState(null);

  const stage = STAGES.find((s) => s.id === stageId);

  /* ── Solo game logic ── */
  const startSolo = (sid) => {
    const s = STAGES.find((st) => st.id === sid);
    const questions = shuffle(s.words).slice(0, Math.min(10, s.words.length));
    setStageId(sid);
    setGameState({
      questions,
      current: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      answers: [],
      timeLeft: 0,
      startTime: Date.now(),
    });
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
      p1: { questions: q1, current: 0, score: 0, combo: 0, maxCombo: 0,
            choices: pickChoices(q1[0], s.words), feedback: null, mistakes: [] },
      p2: { questions: q2, current: 0, score: 0, combo: 0, maxCombo: 0,
            choices: pickChoices(q2[0], s.words), feedback: null, mistakes: [] },
      phase: "playing",
      timer: 40,
    });
    setScreen("battle");
  };

  const goHome = () => {
    setScreen("home");
    setGameState(null);
    setBattleState(null);
    setResults(null);
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
        .btn:active { transform:scale(0.95) !important; }
      `}</style>

      {screen === "home" && <HomeScreen onStart={() => setScreen("mode")} />}
      {screen === "mode" && <ModeSelect onSelect={(m) => { setMode(m); setScreen("stages"); }} onBack={goHome} />}
      {screen === "stages" && <StageSelect mode={mode} onSelect={(sid) => mode === "solo" ? startSolo(sid) : startBattle(sid)} onBack={() => setScreen("mode")} />}
      {screen === "solo" && gameState && stage && (
        <SoloGame state={gameState} setState={setGameState} stage={stage}
          onFinish={(res) => { setResults(res); setScreen("result"); }} />
      )}
      {screen === "battle" && battleState && stage && (
        <BattleGame state={battleState} setState={setBattleState} stage={stage}
          onFinish={(res) => { setResults(res); setScreen("result"); }} />
      )}
      {screen === "result" && results && (
        <ResultScreen results={results} mode={mode} stageId={stageId}
          onRetry={() => mode === "solo" ? startSolo(stageId) : startBattle(stageId)}
          onHome={goHome} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HOME SCREEN
   ═══════════════════════════════════════════════════════ */
function HomeScreen({ onStart }) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop";
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      background: "radial-gradient(ellipse at 50% 30%, #1e1245 0%, #0a0a14 70%)",
      position: "relative", overflow: "hidden",
    }}>
      {letters.split("").map((l, i) => (
        <div key={i} style={{
          position: "absolute", fontSize: 16 + Math.random() * 20,
          color: STAGE_COLORS[i % 7], opacity: 0.06,
          top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
          fontWeight: 900, transform: `rotate(${-30 + Math.random() * 60}deg)`,
        }}>{l}</div>
      ))}
      <div style={{ fontSize: 56, animation: "float 3s ease-in-out infinite", zIndex: 1 }}>🦊</div>
      <div style={{
        fontSize: 36, fontWeight: 900, lineHeight: 1.1, textAlign: "center", zIndex: 1,
        background: "linear-gradient(135deg, #FFD93D, #FF6B6B)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>PHONICS<br/>BATTLE</div>
      <div style={{ fontSize: 11, color: "#5a5a8a", letterSpacing: 3, fontWeight: 700, zIndex: 1 }}>
        フォニックス・バトル
      </div>
      <div style={{ fontSize: 10, color: "#444", marginTop: 4, zIndex: 1 }}>
        📝 かんいばん（にほんご → えいたんご）
      </div>
      <button className="btn" onClick={onStart} style={{
        marginTop: 28, padding: "18px 72px", border: "none", cursor: "pointer",
        background: "linear-gradient(135deg, #FF6B6B, #ee5a24)",
        borderRadius: 50, color: "#fff", fontWeight: 900, fontSize: 22,
        fontFamily: "'Nunito', sans-serif", letterSpacing: 3, zIndex: 1,
        boxShadow: "0 6px 30px rgba(255,107,107,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
        animation: "pulse 2s ease-in-out infinite",
      }}>START</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MODE SELECT
   ═══════════════════════════════════════════════════════ */
function ModeSelect({ onSelect, onBack }) {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20, padding: 24,
      background: "radial-gradient(ellipse at 50% 80%, #1e1245 0%, #0a0a14 70%)",
    }}>
      <button onClick={onBack} style={{ position: "absolute", top: 20, left: 20, background: "none", border: "none", color: "#555", fontSize: 16, cursor: "pointer" }}>◀ もどる</button>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>モードをえらぼう！</div>
      {[
        { mode: "solo", emoji: "📖", title: "れんしゅう", desc: "ひとりでチャレンジ", color: "#4ECDC4" },
        { mode: "battle", emoji: "⚔️", title: "たいせん", desc: "2にんでスピードバトル！", color: "#FF6B6B" },
      ].map((m) => (
        <button key={m.mode} className="btn" onClick={() => onSelect(m.mode)} style={{
          width: "100%", maxWidth: 360, padding: "24px 20px",
          background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`,
          borderRadius: 22, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 16, textAlign: "left",
          boxShadow: `0 6px 24px ${m.color}40`,
        }}>
          <span style={{ fontSize: 42 }}>{m.emoji}</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{m.title}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 3 }}>{m.desc}</div>
          </div>
          {m.mode === "battle" && <span style={{
            position: "absolute", top: -6, right: 12,
            background: "#FFD93D", color: "#0a0a14", fontSize: 10, fontWeight: 900,
            padding: "3px 10px", borderRadius: 20, transform: "rotate(8deg)",
          }}>2P</span>}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAGE SELECT
   ═══════════════════════════════════════════════════════ */
function StageSelect({ mode, onSelect, onBack }) {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      padding: 20, gap: 10, overflow: "auto",
      background: "radial-gradient(ellipse at 50% 0%, #0f2444 0%, #0a0a14 60%)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#555", fontSize: 16, cursor: "pointer" }}>◀</button>
        <span style={{ fontSize: 18, fontWeight: 900 }}>ステージ</span>
        <span style={{ fontSize: 11, color: "#555", marginLeft: "auto" }}>
          {mode === "battle" ? "⚔️ たいせん" : "📖 れんしゅう"}
        </span>
      </div>
      {STAGES.map((s, i) => (
        <button key={s.id} className="btn" onClick={() => onSelect(s.id)} style={{
          padding: "14px 16px", borderRadius: 18, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${STAGE_COLORS[i]}18, ${STAGE_COLORS[i]}08)`,
          borderLeft: `4px solid ${STAGE_COLORS[i]}`,
          display: "flex", alignItems: "center", gap: 14, textAlign: "left",
          animation: `fadeIn 0.3s ease ${i * 0.06}s both`,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: STAGE_COLORS[i], display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff",
            boxShadow: `0 3px 12px ${STAGE_COLORS[i]}44`,
          }}>{s.id}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{s.label}: {s.sub}</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{s.words.length} もんだい</div>
          </div>
          <div style={{ fontSize: 20, color: "#333" }}>▸</div>
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SOLO GAME
   ═══════════════════════════════════════════════════════ */
function SoloGame({ state, setState, stage, onFinish }) {
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef(null);

  const q = state.questions[state.current];
  const choices = useRef(pickChoices(q, stage.words));

  useEffect(() => {
    choices.current = pickChoices(state.questions[state.current], stage.words);
    setTimeLeft(15);
    setFeedback(null);
  }, [state.current]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { handleAnswer(null); return 15; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [state.current]);

  const handleAnswer = (selected) => {
    clearInterval(timerRef.current);
    const correct = selected === q.en;
    const newCombo = correct ? state.combo + 1 : 0;
    setFeedback(correct ? "correct" : "wrong");

    setTimeout(() => {
      const next = state.current + 1;
      if (next >= state.questions.length) {
        onFinish({
          mode: "solo",
          score: state.score + (correct ? 1 : 0),
          total: state.questions.length,
          maxCombo: Math.max(state.maxCombo, newCombo),
          mistakes: correct ? state.answers.filter((a) => !a.correct) : [...state.answers.filter((a) => !a.correct), { word: q, selected }],
          time: ((Date.now() - state.startTime) / 1000).toFixed(1),
        });
      } else {
        setState((s) => ({
          ...s,
          current: next,
          score: s.score + (correct ? 1 : 0),
          combo: newCombo,
          maxCombo: Math.max(s.maxCombo, newCombo),
          answers: [...s.answers, { word: q, selected, correct }],
        }));
      }
    }, 600);
  };

  const currentQ = state.questions[state.current];
  const pct = ((state.current) / state.questions.length) * 100;

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse at 50% 20%, #1e1245 0%, #0a0a14 70%)",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#555" }}>{stage.label}</span>
        <span style={{ fontSize: 13, color: "#FFD93D", fontWeight: 800 }}>{state.current + 1}/{state.questions.length}</span>
      </div>
      {/* Progress */}
      <div style={{ height: 4, background: "#111", margin: "0 16px", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #4ECDC4, #FFD93D)", borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      {/* Timer */}
      <div style={{ height: 3, background: "#111", margin: "4px 16px 0", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${(timeLeft / 15) * 100}%`, background: timeLeft <= 5 ? "#FF6B6B" : "#6C5CE7", borderRadius: 2, transition: "width 1s linear" }} />
      </div>

      {/* Question area */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16, padding: 20,
      }}>
        {state.combo >= 2 && (
          <div style={{ fontSize: 12, color: "#FFD93D", fontWeight: 800, animation: "popIn 0.3s ease" }}>
            🔥 x{state.combo} COMBO!
          </div>
        )}
        <div style={{ fontSize: 11, color: "#5a5a8a", letterSpacing: 1 }}>にほんごをみて えいたんごをえらぼう</div>
        <div style={{
          fontSize: 36, fontWeight: 900, color: "#fff", textAlign: "center",
          padding: "20px 32px", borderRadius: 20,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          animation: feedback === "correct" ? "popIn 0.3s ease" : feedback === "wrong" ? "shake 0.3s ease" : "fadeIn 0.3s ease",
          boxShadow: feedback === "correct" ? "0 0 30px rgba(78,205,196,0.3)" : feedback === "wrong" ? "0 0 30px rgba(255,107,107,0.3)" : "none",
        }}>
          {currentQ.ja}
        </div>

        {/* Choices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360, marginTop: 12 }}>
          {choices.current.map((c, i) => (
            <button key={c.en + i} className="btn" disabled={!!feedback} onClick={() => handleAnswer(c.en)} style={{
              padding: "14px 20px", borderRadius: 16, border: "none", cursor: feedback ? "default" : "pointer",
              background: feedback && c.en === q.en ? "rgba(78,205,196,0.2)"
                : feedback && c.en !== q.en ? "rgba(255,255,255,0.02)"
                : "rgba(255,255,255,0.04)",
              borderLeft: feedback && c.en === q.en ? "4px solid #4ECDC4" : "4px solid transparent",
              fontSize: 20, fontWeight: 800, color: feedback && c.en === q.en ? "#4ECDC4" : "#888",
              fontFamily: "'Nunito', sans-serif", textAlign: "center",
              opacity: feedback && c.en !== q.en ? 0.4 : 1,
              transition: "all 0.2s",
              animation: `fadeIn 0.2s ease ${i * 0.05}s both`,
            }}>
              {c.en}
            </button>
          ))}
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
      p1Answered: s.p1.current, p2Answered: s.p2.current,
      p1MaxCombo: s.p1.maxCombo, p2MaxCombo: s.p2.maxCombo,
      total: Math.max(s.p1.current, s.p2.current),
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

      if (correct) {
        newP.score = pState.score + 1;
        newP.combo = pState.combo + 1;
        newP.maxCombo = Math.max(pState.maxCombo, newP.combo);
      } else {
        newP.combo = 0;
        newP.mistakes = [...pState.mistakes, { word: q, player }];
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
            fontSize: Math.min(28, Math.max(18, 200 / q.ja.length)), fontWeight: 900, color: "#fff",
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
            {q.ja}
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
                  color: pState.feedback && c.en === q.en ? colorA : "#666",
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
function ResultScreen({ results, mode, stageId, onRetry, onHome }) {
  const isBattle = results.mode === "battle";
  const winner = isBattle ? (results.p1Score > results.p2Score ? 1 : results.p2Score > results.p1Score ? 2 : 0) : null;

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 12, padding: 24,
      background: "radial-gradient(ellipse at 50% 30%, #1e1245 0%, #0a0a14 70%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Confetti */}
      {[...Array(30)].map((_, i) => (
        <div key={i} style={{
          position: "absolute", width: 6 + Math.random() * 10, height: 6 + Math.random() * 10,
          background: STAGE_COLORS[i % 7], borderRadius: i % 3 === 0 ? "50%" : 2,
          top: -20, left: `${5 + Math.random() * 90}%`,
          animation: `confettiFall ${2 + Math.random() * 3}s ease ${Math.random() * 2}s both`,
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
          <div style={{ fontSize: 12, color: "#555" }}>⏱ {results.time}s ・ 🔥 max x{results.maxCombo}</div>
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{ fontSize: 24, opacity: results.score / results.total >= (i + 1) / 3 ? 1 : 0.2 }}>★</span>
            ))}
          </div>
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
            📝 まちがえた たんご
          </div>
          {results.mistakes.slice(0, 8).map((m, i) => (
            <div key={i} style={{ fontSize: 12, color: "#888", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#FF6B6B" }}>✕</span>
              <span>{m.word.ja}</span>
              <span>→</span>
              <span style={{ color: "#4ECDC4", fontWeight: 800 }}>{m.word.en}</span>
              {isBattle && <span style={{ fontSize: 9, color: "#555" }}>(P{m.player})</span>}
            </div>
          ))}
        </div>
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
    </div>
  );
}
