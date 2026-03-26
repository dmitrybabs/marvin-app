import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

const HAPPY_EMOJIS = ['😊', '🥰', '😄', '🤩', '😍', '🥳', '😁', '💫', '✨', '🌟'];
const SAD_EMOJIS = ['😢', '😭', '😞', '💔', '😔', '🥺', '😿', '😣', '😖', '☹️'];

// ===================== SCREEN: EARN =====================
function EarnScreen({ user, onBack, onCoinsEarned, initData }) {
  const [emojis, setEmojis] = useState([]);
  const [floats, setFloats] = useState([]);
  const [points, setPoints] = useState(user?.points || 0);
  const [coins, setCoins] = useState(user?.coins || 0);
  const [threshold, setThreshold] = useState(user?.coinsPerPoints || 10);
  const [level, setLevel] = useState(user?.level || 1);
  const [flash, setFlash] = useState(null);
  const [bump, setBump] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    setPoints(user?.points || 0);
    setCoins(user?.coins || 0);
    setThreshold(user?.coinsPerPoints || 10);
    setLevel(user?.level || 1);
  }, [user]);

  const spawnEmoji = useCallback(() => {
    const id = idRef.current++;
    const isHappy = Math.random() > 0.4;
    const x = 8 + Math.random() * 74;
    const y = 8 + Math.random() * 74;
    const emoji = isHappy
      ? HAPPY_EMOJIS[Math.floor(Math.random() * HAPPY_EMOJIS.length)]
      : SAD_EMOJIS[Math.floor(Math.random() * SAD_EMOJIS.length)];
    const size = 32 + Math.floor(Math.random() * 18);
    setEmojis(prev => [...prev.slice(-18), { id, emoji, x, y, isHappy, size }]);
  }, []);

  useEffect(() => {
    spawnEmoji();
    const interval = setInterval(spawnEmoji, 1200);
    return () => clearInterval(interval);
  }, [spawnEmoji]);

  const handleClick = async (e, emojiObj) => {
    e.stopPropagation();
    setEmojis(prev => prev.filter(em => em.id !== emojiObj.id));

    const type = emojiObj.isHappy ? 'happy' : 'sad';
    const delta = type === 'happy' ? 1 : -2;
    const label = type === 'happy' ? '+1' : '-2';
    const color = type === 'happy' ? '#4ade80' : '#f87171';

    // Optimistic update
    setPoints(prev => prev + delta);
    setBump(true);
    setTimeout(() => setBump(false), 250);

    const fid = idRef.current++;
    setFloats(prev => [...prev, { id: fid, x: emojiObj.x, y: emojiObj.y, label, color }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== fid)), 900);

    try {
      const r = await fetch('/api/earn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-init-data': initData || '' },
        body: JSON.stringify({ type }),
      });
      const d = await r.json();
      setPoints(d.points);
      setCoins(d.coins);
      if (d.threshold) setThreshold(d.threshold);
      if (d.level) setLevel(d.level);
      if (d.coinsEarned > 0) {
        setFlash(`🎉 +${d.coinsEarned} MARVIN coin${d.coinsEarned > 1 ? 's' : ''}!`);
        onCoinsEarned && onCoinsEarned(d.coins);
        setTimeout(() => setFlash(null), 2500);
      }
    } catch {}
  };

  const safePct = Math.max(0, Math.min(100, threshold > 0 ? (points / threshold) * 100 : 0));

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Назад</button>
        <span style={styles.headerTitle}>Заработать монеты</span>
        <span style={{ fontSize: 12, color: '#555' }}>Ур. {level}</span>
      </div>

      {/* Score panel */}
      <div style={styles.earnPanel}>
        <div style={styles.earnRow}>
          <div style={styles.earnStat}>
            <div style={{
              ...styles.earnBigNum,
              color: points < 0 ? '#f87171' : '#fff',
              transform: bump ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 0.15s ease, color 0.2s',
              display: 'inline-block',
            }}>
              {points}
            </div>
            <div style={styles.earnStatLabel}>очков</div>
          </div>

          <div style={styles.earnDivider}>
            <div style={{ color: '#555', fontSize: 11 }}>нужно {threshold}</div>
            <div style={{ color: '#444', fontSize: 20, margin: '2px 0' }}>→</div>
            <div style={{ color: '#555', fontSize: 11 }}>1 монета</div>
          </div>

          <div style={styles.earnStat}>
            <div style={{ ...styles.earnBigNum, color: '#f59e0b' }}>{coins}</div>
            <div style={styles.earnStatLabel}>монет 💰</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={styles.earnBarWrap}>
          <div style={{
            height: '100%',
            borderRadius: 6,
            width: `${safePct}%`,
            background: points < 0 ? '#ef4444' : 'linear-gradient(90deg, #f59e0b, #ef4444)',
            transition: 'width 0.3s ease',
            minWidth: safePct > 0 ? 6 : 0,
          }} />
        </div>
        <div style={styles.earnBarLabel}>
          {points < 0
            ? `⚠️ В минусе на ${Math.abs(points)} очков`
            : `${points} / ${threshold} очков до монеты`}
        </div>
      </div>

      <div style={styles.earnHints}>
        <span style={{ color: '#4ade80' }}>😊 = +1 очко</span>
        <span style={{ color: '#555' }}>·</span>
        <span style={{ color: '#f87171' }}>😢 = −2 очка</span>
      </div>

      {flash && <div style={styles.flash}>{flash}</div>}

      <div style={styles.emojiField}>
        {emojis.map(em => (
          <button
            key={em.id}
            onClick={(e) => handleClick(e, em)}
            style={{
              ...styles.emojiBtn,
              left: `${em.x}%`,
              top: `${em.y}%`,
              fontSize: em.size,
              animation: `floatAnim ${1.8 + Math.random() * 1.2}s ease-in-out infinite alternate`,
            }}
          >
            {em.emoji}
          </button>
        ))}
        {floats.map(f => (
          <div key={f.id} style={{ ...styles.floatLabel, left: `${f.x}%`, top: `${f.y}%`, color: f.color }}>
            {f.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== SCREEN: SEND =====================
function SendScreen({ user, onBack, onSent, initData }) {
  const [target, setTarget] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!target || !text) return setError('Заполни все поля');
    if (user?.coins < 1) return setError('Недостаточно монет! Иди зарабатывать 💰');
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-init-data': initData || '' },
        body: JSON.stringify({ text, targetUsername: target }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); }
      else { setSuccess(true); onSent && onSent(d); }
    } catch { setError('Ошибка отправки'); }
    setLoading(false);
  };

  if (success) return (
    <div style={styles.screen}>
      <div style={styles.centered}>
        <div style={{ fontSize: 64 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Отправлено!</div>
        <div style={{ color: '#999', fontSize: 14 }}>Получатель узнает в Telegram</div>
        <button onClick={onBack} style={styles.primaryBtn}>← На главную</button>
      </div>
    </div>
  );

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Назад</button>
        <span style={styles.headerTitle}>Анонимное сообщение</span>
        <span></span>
      </div>
      <div style={styles.coinsHint}>
        💰 У тебя: <b style={{ color: '#f59e0b' }}>{user?.coins || 0} монет</b>{'  '}· Стоимость: 1 монета
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Кому (Telegram username)</label>
        <input style={styles.input} placeholder="@dmitrybabs" value={target} onChange={e => setTarget(e.target.value)} />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Сообщение</label>
        <textarea style={{ ...styles.input, height: 140, resize: 'none' }} placeholder="Напиши что-нибудь анонимно..." value={text} maxLength={500} onChange={e => setText(e.target.value)} />
        <div style={styles.charCount}>{text.length}/500</div>
      </div>
      {error && <div style={styles.errorBox}>{error}</div>}
      <button onClick={handleSend} disabled={loading || !target || !text} style={{ ...styles.primaryBtn, opacity: (!target || !text || loading) ? 0.5 : 1 }}>
        {loading ? '...' : '🕵️ Отправить анонимно'}
      </button>
    </div>
  );
}

// ===================== SCREEN: LEADERBOARD =====================
function LeaderboardScreen({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Назад</button>
        <span style={styles.headerTitle}>Топ уровней</span>
        <span></span>
      </div>
      {loading ? (
        <div style={styles.centered}><div style={styles.spinner} /></div>
      ) : users.length === 0 ? (
        <div style={styles.empty}>Пока никого нет 👀</div>
      ) : (
        <div style={styles.list}>
          {users.map((u, i) => (
            <div key={i} style={{ ...styles.leaderRow, background: i === 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)' }}>
              <div style={styles.leaderRank}>{medals[i] || `#${i + 1}`}</div>
              <div style={styles.leaderName}>@{u.username}</div>
              <div style={styles.leaderLevel}><span style={styles.levelBadge}>Ур. {u.level}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== SCREEN: FEED =====================
function FeedScreen({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    fetch('/api/feed').then(r => r.json()).then(d => { setMessages(d.messages || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (messages.length < 2) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIdx(p => (p + 1) % messages.length); setFade(true); }, 400);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages]);

  const msg = messages[idx];

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Назад</button>
        <span style={styles.headerTitle}>Лента сообщений</span>
        <span></span>
      </div>
      {loading ? (
        <div style={styles.centered}><div style={styles.spinner} /></div>
      ) : messages.length === 0 ? (
        <div style={styles.empty}>Сообщений пока нет 🕊️</div>
      ) : (
        <>
          <div style={{ ...styles.feedCard, opacity: fade ? 1 : 0, transition: 'opacity 0.4s' }}>
            <div style={styles.feedTo}>{msg?.to}</div>
            <div style={styles.feedText}>{msg?.text}</div>
            <div style={styles.feedMeta}>
              <span>🕵️ Anonymous</span>
              <span>{msg?.time ? new Date(msg.time).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : ''}</span>
            </div>
          </div>
          <div style={styles.feedDots}>
            {messages.slice(0, Math.min(messages.length, 10)).map((_, i) => (
              <div key={i} style={{ ...styles.dot, background: i === idx % 10 ? '#f59e0b' : '#333' }} />
            ))}
          </div>
          <div style={styles.feedList}>
            {messages.slice(0, 20).map((m, i) => (
              <div key={m.id || i} style={styles.feedListItem}>
                <span style={{ color: '#f59e0b', fontWeight: 600, flexShrink: 0 }}>{m.to}</span>
                <span style={{ color: '#ccc', flex: 1, margin: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.text}</span>
                <span style={{ color: '#555', fontSize: 11, flexShrink: 0 }}>{m.time ? new Date(m.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ===================== MAIN =====================
export default function App() {
  const [screen, setScreen] = useState('home');
  const [initData, setInitData] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); setInitData(tg.initData || ''); }
  }, []);

  const fetchUser = useCallback(async (id) => {
    try {
      const r = await fetch('/api/user', { headers: { 'x-init-data': id || initData } });
      const d = await r.json();
      setUserData(d);
    } catch {}
  }, [initData]);

  useEffect(() => { if (initData !== undefined) fetchUser(initData); }, [initData, fetchUser]);

  const handleCoinsEarned = (coins) => setUserData(prev => ({ ...prev, coins }));
  const handleSent = (d) => {
    setUserData(prev => ({ ...prev, coins: d.coins, messagesSent: d.messagesSent, level: d.level }));
    setTimeout(() => setScreen('home'), 1500);
  };

  if (screen === 'earn') return <EarnScreen user={userData} onBack={() => { setScreen('home'); fetchUser(initData); }} onCoinsEarned={handleCoinsEarned} initData={initData} />;
  if (screen === 'send') return <SendScreen user={userData} onBack={() => setScreen('home')} onSent={handleSent} initData={initData} />;
  if (screen === 'leaderboard') return <LeaderboardScreen onBack={() => setScreen('home')} />;
  if (screen === 'feed') return <FeedScreen onBack={() => setScreen('home')} />;

  return (
    <>
      <Head>
        <title>MARVIN</title>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </Head>
      <div style={styles.screen}>
        <div style={styles.homeHeader}>
          <div style={styles.logo}>MARVIN</div>
          <div style={styles.logoSub}>анонимное приложение</div>
        </div>
        <div style={styles.userCard}>
          <div style={styles.userAvatar}>{userData?.username?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <div style={styles.userName}>@{userData?.username || '...'}</div>
            <div style={styles.userStats}>Уровень <b style={{ color: '#f59e0b' }}>{userData?.level || 1}</b>{'  '}·{'  '}<b style={{ color: '#f59e0b' }}>{userData?.coins || 0}</b> монет</div>
          </div>
        </div>
        <div style={styles.grid}>
          <button onClick={() => setScreen('earn')} style={styles.card}>
            <div style={styles.cardEmoji}>💰</div>
            <div style={styles.cardTitle}>Заработать MARVIN монеты</div>
            <div style={styles.cardDesc}>Лови смайлики и копи монеты</div>
          </button>
          <button onClick={() => setScreen('send')} style={styles.card}>
            <div style={styles.cardEmoji}>🕵️</div>
            <div style={styles.cardTitle}>Написать анонимное сообщение</div>
            <div style={styles.cardDesc}>1 монета за сообщение</div>
          </button>
          <button onClick={() => setScreen('leaderboard')} style={styles.card}>
            <div style={styles.cardEmoji}>🏆</div>
            <div style={styles.cardTitle}>Топ уровней</div>
            <div style={styles.cardDesc}>Рейтинг всех пользователей</div>
          </button>
          <button onClick={() => setScreen('feed')} style={styles.card}>
            <div style={styles.cardEmoji}>📡</div>
            <div style={styles.cardTitle}>Лента сообщений</div>
            <div style={styles.cardDesc}>Анонимный поток мыслей</div>
          </button>
        </div>
        <div style={styles.footer}>{userData?.messagesSent || 0} сообщений отправлено</div>
      </div>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; color: #fff; font-family: -apple-system, system-ui, sans-serif; }
        @keyframes floatAnim { 0% { transform: translate(-50%,-50%) rotate(-5deg); } 100% { transform: translate(-50%,-50%) translateY(-14px) rotate(5deg); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { 0% { opacity: 1; transform: translate(-50%,-50%) translateY(0); } 100% { opacity: 0; transform: translate(-50%,-50%) translateY(-36px); } }
        button { cursor: pointer; border: none; background: none; font-family: inherit; color: inherit; }
        input, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </>
  );
}

const styles = {
  screen: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', padding: '0 0 24px', overflowX: 'hidden' },
  homeHeader: { padding: '40px 20px 20px', textAlign: 'center' },
  logo: { fontSize: 42, fontWeight: 900, letterSpacing: 8, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  logoSub: { color: '#555', fontSize: 13, marginTop: 4, letterSpacing: 2 },
  userCard: { margin: '0 16px 24px', background: '#141414', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #222' },
  userAvatar: { width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: 16, fontWeight: 600, color: '#fff' },
  userStats: { fontSize: 13, color: '#777', marginTop: 2 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px', flex: 1 },
  card: { background: '#141414', border: '1px solid #222', borderRadius: 16, padding: '20px 16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' },
  cardEmoji: { fontSize: 28 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 },
  cardDesc: { fontSize: 12, color: '#555' },
  footer: { textAlign: 'center', color: '#333', fontSize: 12, marginTop: 20 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid #1a1a1a' },
  backBtn: { color: '#f59e0b', fontSize: 14, cursor: 'pointer' },
  headerTitle: { fontSize: 16, fontWeight: 700, color: '#fff' },

  // Earn
  earnPanel: { margin: '12px 16px 0', background: '#141414', border: '1px solid #222', borderRadius: 18, padding: '18px 16px 14px' },
  earnRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  earnStat: { textAlign: 'center', flex: 1 },
  earnBigNum: { fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -2 },
  earnStatLabel: { fontSize: 12, color: '#555', marginTop: 4 },
  earnDivider: { textAlign: 'center', padding: '0 8px' },
  earnBarWrap: { height: 10, background: '#0f0f0f', borderRadius: 6, overflow: 'hidden', border: '1px solid #222' },
  earnBarLabel: { textAlign: 'center', fontSize: 12, color: '#666', marginTop: 6 },
  earnHints: { display: 'flex', justifyContent: 'center', gap: 10, padding: '10px 16px 4px', fontSize: 13 },
  flash: { margin: '8px 16px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', color: '#f59e0b', fontWeight: 700, fontSize: 16 },
  emojiField: { flex: 1, position: 'relative', margin: '10px 16px 0', background: '#0f0f0f', borderRadius: 20, border: '1px solid #1a1a1a', minHeight: 260, overflow: 'hidden' },
  emojiBtn: { position: 'absolute', transform: 'translate(-50%, -50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1 },
  floatLabel: { position: 'absolute', transform: 'translate(-50%, -50%)', fontWeight: 900, fontSize: 20, pointerEvents: 'none', animation: 'fadeUp 0.9s ease-out forwards' },

  // Send
  coinsHint: { margin: '12px 16px', background: '#141414', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#777', border: '1px solid #222' },
  formGroup: { padding: '0 16px', marginBottom: 16 },
  label: { display: 'block', fontSize: 12, color: '#555', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' },
  input: { width: '100%', background: '#141414', border: '1px solid #222', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 15, outline: 'none' },
  charCount: { textAlign: 'right', fontSize: 11, color: '#333', marginTop: 4 },
  errorBox: { margin: '0 16px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 14 },
  primaryBtn: { display: 'block', width: 'calc(100% - 32px)', margin: '0 16px', padding: '14px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', borderRadius: 14, color: '#000', fontWeight: 800, fontSize: 15, cursor: 'pointer', border: 'none', textAlign: 'center' },

  // Leaderboard
  list: { padding: '8px 16px', flex: 1 },
  leaderRow: { display: 'flex', alignItems: 'center', padding: '14px 16px', borderRadius: 14, marginBottom: 8, border: '1px solid #1a1a1a' },
  leaderRank: { fontSize: 22, width: 40 },
  leaderName: { flex: 1, fontSize: 15, fontWeight: 600 },
  levelBadge: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 },

  // Feed
  feedCard: { margin: '16px', background: '#141414', border: '1px solid #222', borderRadius: 20, padding: '24px 20px', minHeight: 140 },
  feedTo: { color: '#f59e0b', fontWeight: 700, marginBottom: 12, fontSize: 15 },
  feedText: { fontSize: 17, color: '#fff', lineHeight: 1.6, marginBottom: 16 },
  feedMeta: { display: 'flex', justifyContent: 'space-between', color: '#444', fontSize: 12 },
  feedDots: { display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 },
  dot: { width: 6, height: 6, borderRadius: '50%', transition: 'background 0.3s' },
  feedList: { padding: '0 16px', flex: 1, overflowY: 'auto' },
  feedListItem: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #141414', fontSize: 13 },

  // Common
  centered: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  empty: { textAlign: 'center', color: '#444', padding: 40, fontSize: 16 },
  spinner: { width: 32, height: 32, border: '3px solid #222', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
