import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

const HAPPY_EMOJIS = ['😊','🥰','😄','🤩','😍','🥳','😁','🌟','💫','✨'];
const SAD_EMOJIS   = ['😢','😭','😞','💔','😔','🥺','😿','😣','😖','☹️'];

const AVATAR_LIST = ['🐶','🐱','🦊','🐺','🐻','🐼','🦁','🐯','🦝','🐸','🐧','🦉','🦋','🐉','👾','🤖','👻','💀','🎭','🌚','🌝','🍄','💎','🔮','⚡','🌈','🎃','🧸','🎯','🚀'];

function getAuraColor(level) {
  if (level >= 20) return ['#a855f7','#ec4899'];
  if (level >= 15) return ['#ef4444','#f97316'];
  if (level >= 10) return ['#3b82f6','#06b6d4'];
  if (level >= 5)  return ['#f59e0b','#eab308'];
  return ['#22c55e','#16a34a'];
}

function getLevel(msgSent) { return Math.floor(msgSent / 3) + 1; }
function getThreshold(level) { return 10 + (level - 1) * 5; }

// ===================== EARN SCREEN =====================
function EarnScreen({ user, onBack, onCoinsEarned, initData }) {
  const [emojis, setEmojis]   = useState([]);
  const [floats, setFloats]   = useState([]);
  const [points, setPoints]   = useState(user?.points || 0);
  const [coins, setCoins]     = useState(user?.coins || 0);
  const [level, setLevel]     = useState(user?.level || 1);
  const [flash, setFlash]     = useState(null); // 'green' | 'red' | null
  const [coinFlash, setCoinFlash] = useState(null);
  const idRef = useRef(0);

  useEffect(() => {
    setPoints(user?.points || 0);
    setCoins(user?.coins || 0);
    setLevel(user?.level || 1);
  }, [user]);

  const threshold = getThreshold(level);

  const spawnEmoji = useCallback(() => {
    const id = idRef.current++;
    const isHappy = Math.random() > 0.42;
    const emoji = isHappy
      ? HAPPY_EMOJIS[Math.floor(Math.random() * HAPPY_EMOJIS.length)]
      : SAD_EMOJIS[Math.floor(Math.random() * SAD_EMOJIS.length)];
    const x = 10 + Math.random() * 72;
    const y = 10 + Math.random() * 72;
    const size = 34 + Math.floor(Math.random() * 16);
    const ttl = 2000 + Math.random() * 1000;
    setEmojis(prev => [...prev.slice(-16), { id, emoji, x, y, isHappy, size, ttl, born: Date.now() }]);
    setTimeout(() => setEmojis(prev => prev.filter(e => e.id !== id)), ttl);
  }, []);

  useEffect(() => {
    spawnEmoji();
    const iv = setInterval(spawnEmoji, 1400);
    return () => clearInterval(iv);
  }, [spawnEmoji]);

  const handleClick = async (e, em) => {
    e.stopPropagation();
    setEmojis(prev => prev.filter(x => x.id !== em.id));
    const type = em.isHappy ? 'happy' : 'sad';
    const delta = type === 'happy' ? 1 : -2;
    const label = type === 'happy' ? '+1' : '-2';
    const color = type === 'happy' ? '#4ade80' : '#f87171';

    setFlash(type === 'happy' ? 'green' : 'red');
    setTimeout(() => setFlash(null), 350);

    setPoints(prev => prev + delta);
    const fid = idRef.current++;
    setFloats(prev => [...prev, { id: fid, x: em.x, y: em.y, label, color }]);
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
      if (d.level) setLevel(d.level);
      if (d.coinsEarned > 0) {
        setCoinFlash(`+${d.coinsEarned} COIN 🎉`);
        onCoinsEarned && onCoinsEarned(d.coins);
        setTimeout(() => setCoinFlash(null), 2500);
      }
    } catch {}
  };

  const pct = Math.max(0, Math.min(100, threshold > 0 ? (points / threshold) * 100 : 0));

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <BackBtn onClick={onBack} />
        <span style={S.headerTitle}>Заработать MARVIN COIN</span>
        <span style={{ fontSize: 12, color: '#888' }}>Ур. {level}</span>
      </div>

      {/* Stats strip */}
      <div style={S.earnStrip}>
        <div style={S.earnStripItem}>
          <span style={{ ...S.earnStripNum, color: points < 0 ? '#f87171' : '#e2e8f0' }}>{points}</span>
          <span style={S.earnStripLabel}>очков</span>
        </div>
        <div style={S.earnStripSep} />
        <div style={S.earnStripItem}>
          <span style={{ ...S.earnStripNum, color: '#f59e0b' }}>{coins}</span>
          <span style={S.earnStripLabel}>COIN 💰</span>
        </div>
        <div style={S.earnStripSep} />
        <div style={S.earnStripItem}>
          <span style={{ ...S.earnStripNum, color: '#94a3b8', fontSize: 18 }}>{threshold}</span>
          <span style={S.earnStripLabel}>очков/coin</span>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '0 16px 4px' }}>
        <div style={S.earnBarWrap}>
          <div style={{ height: '100%', borderRadius: 6, width: `${pct}%`, background: points < 0 ? '#ef4444' : 'linear-gradient(90deg,#f59e0b,#ef4444)', transition: 'width 0.3s' }} />
        </div>
        <div style={S.earnBarLabel}>{points < 0 ? `⚠️ минус ${Math.abs(points)} очков` : `${points} / ${threshold} до монеты`}</div>
      </div>

      {coinFlash && <div style={S.coinFlash}>{coinFlash}</div>}

      {/* Field */}
      <div style={{
        ...S.emojiField,
        boxShadow: flash === 'green' ? '0 0 0 3px #22c55e inset' : flash === 'red' ? '0 0 0 3px #ef4444 inset' : 'none',
        background: flash === 'green' ? 'rgba(34,197,94,0.08)' : flash === 'red' ? 'rgba(239,68,68,0.08)' : '#0d0d0d',
        transition: 'box-shadow 0.15s, background 0.15s',
      }}>
        {emojis.map(em => (
          <button key={em.id} onClick={e => handleClick(e, em)} style={{ ...S.emojiBtn, left: `${em.x}%`, top: `${em.y}%`, fontSize: em.size }}>
            {em.emoji}
          </button>
        ))}
        {floats.map(f => (
          <div key={f.id} style={{ ...S.floatLabel, left: `${f.x}%`, top: `${f.y}%`, color: f.color }}>{f.label}</div>
        ))}
        {emojis.length === 0 && <div style={S.emojiFieldHint}>Смайлики появятся через секунду...</div>}
      </div>
    </div>
  );
}

// ===================== SEND SCREEN =====================
function SendScreen({ user, onBack, onSent, initData }) {
  const [target, setTarget] = useState('');
  const [text, setText]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!target || !text) return setError('Заполни все поля');
    if ((user?.coins || 0) < 1) return setError('Недостаточно MARVIN COIN 💰');
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-init-data': initData || '' },
        body: JSON.stringify({ text, targetUsername: target }),
      });
      const d = await r.json();
      if (d.error) setError(d.error);
      else { setSuccess(true); onSent && onSent(d); }
    } catch { setError('Ошибка отправки'); }
    setLoading(false);
  };

  if (success) return (
    <div style={S.screen}>
      <div style={S.centered}>
        <div style={{ fontSize: 64 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Отправлено!</div>
        <div style={{ color: '#888', fontSize: 14 }}>Получатель получит уведомление в Telegram</div>
        <button onClick={onBack} style={S.primaryBtn}>← На главную</button>
      </div>
    </div>
  );

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <BackBtn onClick={onBack} />
        <span style={S.headerTitle}>Анонимное сообщение</span>
        <span />
      </div>
      <div style={S.coinsHint}>💰 У тебя: <b style={{ color: '#f59e0b' }}>{user?.coins || 0} COIN</b> · Стоимость: 1 COIN</div>
      <div style={S.formGroup}>
        <label style={S.label}>Кому (Telegram username)</label>
        <input style={S.input} placeholder="@НИК (скопируй в профиле)" value={target} onChange={e => setTarget(e.target.value)} />
      </div>
      <div style={S.formGroup}>
        <label style={S.label}>Сообщение</label>
        <textarea style={{ ...S.input, height: 140, resize: 'none' }} placeholder="Напиши что-нибудь анонимно..." value={text} maxLength={500} onChange={e => setText(e.target.value)} />
        <div style={S.charCount}>{text.length}/500</div>
      </div>
      {error && <div style={S.errorBox}>{error}</div>}
      <button onClick={handleSend} disabled={loading || !target || !text} style={{ ...S.primaryBtn, opacity: (!target || !text || loading) ? 0.5 : 1 }}>
        {loading ? '...' : '🕵️ Отправить анонимно'}
      </button>
    </div>
  );
}

// ===================== LEADERBOARD =====================
function LeaderboardScreen({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const medals = ['🥇','🥈','🥉'];

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <BackBtn onClick={onBack} />
        <span style={S.headerTitle}>Топ уровней</span>
        <span />
      </div>
      {loading ? <div style={S.centered}><div style={S.spinner} /></div>
      : users.length === 0 ? <div style={S.empty}>Пока никого нет 👀</div>
      : (
        <div style={{ padding: '8px 16px', overflowY: 'auto', flex: 1 }}>
          {users.map((u, i) => {
            const [c1, c2] = getAuraColor(u.level);
            return (
              <div key={i} style={{ ...S.leaderRow, background: i === 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: 22, width: 36 }}>{medals[i] || `#${i+1}`}</div>
                <div style={{ fontSize: 22, marginRight: 10 }}>{u.avatar || '👤'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>@{u.username}</div>
                  {u.bio && <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>{u.bio}</div>}
                </div>
                <div style={{ background: `linear-gradient(135deg,${c1},${c2})`, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: '#000' }}>
                  Ур. {u.level}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== FEED =====================
function FeedScreen({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fade, setFade]         = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/feed').then(r => r.json()).then(d => { setMessages(d.messages || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const startAuto = useCallback((msgs, cur) => {
    clearInterval(timerRef.current);
    if (msgs.length < 2) return;
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => { setActiveIdx(p => (p + 1) % msgs.length); setFade(true); }, 400);
    }, 4000);
  }, []);

  useEffect(() => { startAuto(messages, activeIdx); return () => clearInterval(timerRef.current); }, [messages]);

  const selectMsg = (i) => {
    clearInterval(timerRef.current);
    setFade(false);
    setTimeout(() => { setActiveIdx(i); setFade(true); startAuto(messages, i); }, 200);
  };

  const msg = messages[activeIdx];

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <BackBtn onClick={onBack} />
        <span style={S.headerTitle}>Лента сообщений</span>
        <span />
      </div>
      {loading ? <div style={S.centered}><div style={S.spinner} /></div>
      : messages.length === 0 ? <div style={S.empty}>Сообщений пока нет 🕊️</div>
      : (
        <>
          <div style={{ ...S.feedCard, opacity: fade ? 1 : 0, transition: 'opacity 0.4s' }}>
            <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{msg?.to}</div>
            <div style={{ fontSize: 17, color: '#e2e8f0', lineHeight: 1.6, marginBottom: 14 }}>{msg?.text}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', fontSize: 12 }}>
              <span>🕵️ Anonymous</span>
              <span>{msg?.time ? new Date(msg.time).toLocaleString('ru-RU',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}) : ''}</span>
            </div>
          </div>

          <div style={{ padding: '0 16px', flex: 1, overflowY: 'auto' }}>
            {messages.slice(0, 50).map((m, i) => (
              <button key={m.id || i} onClick={() => selectMsg(i)} style={{
                ...S.feedListItem,
                background: i === activeIdx ? 'rgba(245,158,11,0.08)' : 'transparent',
                borderLeft: i === activeIdx ? '3px solid #f59e0b' : '3px solid transparent',
                width: '100%', textAlign: 'left',
              }}>
                <span style={{ color: '#f59e0b', fontWeight: 600, flexShrink: 0 }}>{m.to}</span>
                <span style={{ color: '#aaa', flex: 1, margin: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{m.text}</span>
                <span style={{ color: '#555', fontSize: 11, flexShrink: 0 }}>{m.time ? new Date(m.time).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}) : ''}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ===================== AVATAR PICKER =====================
function AvatarPicker({ current, onSelect, onClose }) {
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: '#fff' }}>Выбери аватар</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {AVATAR_LIST.map(av => (
            <button key={av} onClick={() => onSelect(av)} style={{
              fontSize: 30, background: av === current ? 'rgba(245,158,11,0.2)' : '#1a1a1a',
              border: av === current ? '2px solid #f59e0b' : '2px solid #222',
              borderRadius: 12, width: 52, height: 52, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{av}</button>
          ))}
        </div>
        <button onClick={onClose} style={{ ...S.primaryBtn, marginTop: 16, width: '100%' }}>Готово</button>
      </div>
    </div>
  );
}

// ===================== BACK BUTTON =====================
function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={S.backBtn}>
      <span style={S.backBtnInner}>← Назад</span>
    </button>
  );
}

// ===================== MAIN =====================
export default function App() {
  const [screen, setScreen]       = useState('home');
  const [initData, setInitData]   = useState('');
  const [userData, setUserData]   = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [bio, setBio]             = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput]   = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); setInitData(tg.initData || ''); }
  }, []);

  const fetchUser = useCallback(async (id) => {
    try {
      const r = await fetch('/api/user', { headers: { 'x-init-data': id || initData } });
      const d = await r.json();
      setUserData(d);
      setBio(d.bio || '');
    } catch {}
  }, [initData]);

  useEffect(() => { fetchUser(initData); }, [initData]);

  const handleCoinsEarned = (coins) => setUserData(prev => ({ ...prev, coins }));
  const handleSent = (d) => {
    setUserData(prev => ({ ...prev, coins: d.coins, messagesSent: d.messagesSent, level: d.level }));
    setTimeout(() => setScreen('home'), 1600);
  };

  const handleSelectAvatar = async (av) => {
    setSavingAvatar(true);
    setUserData(prev => ({ ...prev, avatar: av }));
    setShowAvatarPicker(false);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-init-data': initData || '' },
        body: JSON.stringify({ avatar: av }),
      });
    } catch {}
    setSavingAvatar(false);
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    const newBio = bioInput.slice(0, 20);
    setBio(newBio);
    setUserData(prev => ({ ...prev, bio: newBio }));
    setEditingBio(false);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-init-data': initData || '' },
        body: JSON.stringify({ bio: newBio }),
      });
    } catch {}
    setSavingBio(false);
  };

  if (screen === 'earn') return <EarnScreen user={userData} onBack={() => { setScreen('home'); fetchUser(initData); }} onCoinsEarned={handleCoinsEarned} initData={initData} />;
  if (screen === 'send') return <SendScreen user={userData} onBack={() => setScreen('home')} onSent={handleSent} initData={initData} />;
  if (screen === 'leaderboard') return <LeaderboardScreen onBack={() => setScreen('home')} />;
  if (screen === 'feed') return <FeedScreen onBack={() => setScreen('home')} />;

  const level = userData?.level || 1;
  const [auraC1, auraC2] = getAuraColor(level);
  const avatar = userData?.avatar || '👤';

  return (
    <>
      <Head>
        <title>MARVIN</title>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </Head>

      <div style={S.screen}>
        {/* Header */}
        <div style={S.homeTop}>
          <div style={S.marvinTitle}>
            <span style={S.marvinM}>M</span>
            <span style={S.marvinArvin}>ARVIN</span>
          </div>
          <div style={S.marvinSub}>анонимный мессенджер</div>
        </div>

        {/* User card */}
        <div style={S.userCard}>
          {/* Avatar with aura */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ ...S.auraRing, background: `conic-gradient(${auraC1}, ${auraC2}, ${auraC1})` }} />
            <button onClick={() => setShowAvatarPicker(true)} style={S.avatarBtn}>
              <span style={{ fontSize: 28 }}>{avatar}</span>
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.userName}>@{userData?.username || '...'}</div>
            <div style={S.userStats}>
              <span style={{ color: auraC1, fontWeight: 700 }}>Ур. {level}</span>
              {'  ·  '}
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>{userData?.coins || 0}</span>
              <span style={{ color: '#666' }}> COIN</span>
            </div>
            {/* Bio */}
            {editingBio ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input
                  autoFocus
                  maxLength={20}
                  value={bioInput}
                  onChange={e => setBioInput(e.target.value)}
                  style={{ ...S.bioInput, flex: 1 }}
                  placeholder="До 20 символов"
                />
                <button onClick={handleSaveBio} style={S.bioSaveBtn}>✓</button>
                <button onClick={() => setEditingBio(false)} style={S.bioCancelBtn}>✕</button>
              </div>
            ) : (
              <button onClick={() => { setBioInput(bio); setEditingBio(true); }} style={S.bioEditBtn}>
                {bio ? bio : '+ добавить статус'}
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div style={S.grid}>
          {[
            { key: 'earn', emoji: '💰', title: 'Заработать MARVIN COIN', desc: 'Лови смайлики, копи монеты' },
            { key: 'send', emoji: '🕵️', title: 'Написать анонимно', desc: '1 COIN за сообщение' },
            { key: 'leaderboard', emoji: '🏆', title: 'Топ уровней', desc: 'Кто круче всех?' },
            { key: 'feed', emoji: '📡', title: 'Лента сообщений', desc: 'Анонимный поток мыслей' },
          ].map(item => (
            <button key={item.key} onClick={() => setScreen(item.key)} style={S.card}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{item.emoji}</div>
              <div style={S.cardTitle}>{item.title}</div>
              <div style={S.cardDesc}>{item.desc}</div>
            </button>
          ))}
        </div>

        <div style={S.footer}>{userData?.messagesSent || 0} сообщений отправлено</div>
      </div>

      {showAvatarPicker && (
        <AvatarPicker current={avatar} onSelect={handleSelectAvatar} onClose={() => setShowAvatarPicker(false)} />
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0d1117; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; color: inherit; }
        input, textarea { font-family: inherit; color: #e2e8f0; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: #0d1117; } ::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 2px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes auraRot { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes floatAnim { 0% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.1) translateY(-6px); } 100% { transform: translate(-50%,-50%) scale(1); } }
        @keyframes fadeUp { 0% { opacity: 1; transform: translate(-50%,-50%) translateY(0); } 100% { opacity: 0; transform: translate(-50%,-50%) translateY(-40px); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }

        .card-hover:hover { border-color: #334155 !important; background: #1a2233 !important; }
      `}</style>
    </>
  );
}

// ===================== STYLES =====================
const S = {
  screen: { minHeight: '100vh', background: '#0d1117', display: 'flex', flexDirection: 'column', paddingBottom: 28, overflowX: 'hidden' },

  // Home header
  homeTop: { padding: '36px 20px 16px', textAlign: 'center' },
  marvinTitle: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0 },
  marvinM: { fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: -2, lineHeight: 1 },
  marvinArvin: { fontSize: 52, fontWeight: 200, color: '#94a3b8', letterSpacing: 6, lineHeight: 1 },
  marvinSub: { fontSize: 12, color: '#475569', letterSpacing: 3, marginTop: 4, textTransform: 'uppercase' },

  // User card
  userCard: { margin: '0 16px 20px', background: 'linear-gradient(135deg, #131c2e 0%, #1a1f2e 100%)', borderRadius: 20, padding: '16px', display: 'flex', alignItems: 'flex-start', gap: 14, border: '1px solid #1e293b', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' },
  auraRing: { position: 'absolute', width: 64, height: 64, borderRadius: '50%', top: '50%', left: '50%', animation: 'auraRot 3s linear infinite', zIndex: 0, filter: 'blur(2px)', opacity: 0.85 },
  avatarBtn: { position: 'relative', zIndex: 1, width: 52, height: 52, borderRadius: '50%', background: '#0d1117', border: '2px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 5 },
  userName: { fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 },
  userStats: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  bioEditBtn: { fontSize: 12, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'block' },
  bioInput: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '4px 8px', fontSize: 13, outline: 'none', color: '#e2e8f0' },
  bioSaveBtn: { background: '#22c55e', color: '#000', borderRadius: 8, padding: '4px 8px', fontWeight: 700, fontSize: 13 },
  bioCancelBtn: { background: '#374151', color: '#aaa', borderRadius: 8, padding: '4px 8px', fontSize: 13 },

  // Grid
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px', flex: 1 },
  card: { background: 'linear-gradient(135deg,#131c2e,#161f30)', border: '1px solid #1e293b', borderRadius: 18, padding: '18px 14px', textAlign: 'left', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'border-color 0.2s' },
  cardTitle: { fontSize: 13, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3, marginBottom: 4 },
  cardDesc: { fontSize: 11, color: '#475569' },
  footer: { textAlign: 'center', color: '#2d3748', fontSize: 11, marginTop: 16, letterSpacing: 1 },

  // Common header
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px', borderBottom: '1px solid #1e293b', background: '#0d1117' },
  headerTitle: { fontSize: 15, fontWeight: 700, color: '#f1f5f9' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  backBtnInner: { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: '1px solid #334155', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#94a3b8', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },

  // Earn
  earnStrip: { display: 'flex', alignItems: 'center', margin: '12px 16px 8px', background: 'linear-gradient(135deg,#131c2e,#161f30)', borderRadius: 16, border: '1px solid #1e293b', overflow: 'hidden' },
  earnStripItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px' },
  earnStripNum: { fontSize: 28, fontWeight: 900, lineHeight: 1, letterSpacing: -1 },
  earnStripLabel: { fontSize: 10, color: '#475569', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 },
  earnStripSep: { width: 1, height: 40, background: '#1e293b' },
  earnBarWrap: { height: 8, background: '#1e293b', borderRadius: 6, overflow: 'hidden', marginBottom: 4 },
  earnBarLabel: { fontSize: 11, color: '#475569', textAlign: 'center', marginBottom: 6 },
  coinFlash: { margin: '4px 16px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 12, padding: '10px', textAlign: 'center', color: '#f59e0b', fontWeight: 700, fontSize: 18 },
  emojiField: { flex: 1, position: 'relative', margin: '6px 16px 0', borderRadius: 20, border: '1px solid #1e293b', minHeight: 260, overflow: 'hidden' },
  emojiFieldHint: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#2d3748', fontSize: 14 },
  emojiBtn: { position: 'absolute', transform: 'translate(-50%,-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1, animation: 'floatAnim 2.2s ease-in-out infinite' },
  floatLabel: { position: 'absolute', transform: 'translate(-50%,-50%)', fontWeight: 900, fontSize: 22, pointerEvents: 'none', animation: 'fadeUp 0.9s ease-out forwards' },

  // Send
  coinsHint: { margin: '12px 16px', background: '#131c2e', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#64748b', border: '1px solid #1e293b' },
  formGroup: { padding: '0 16px', marginBottom: 14 },
  label: { display: 'block', fontSize: 11, color: '#475569', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' },
  input: { width: '100%', background: '#131c2e', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 14px', fontSize: 15, outline: 'none' },
  charCount: { textAlign: 'right', fontSize: 11, color: '#334155', marginTop: 4 },
  errorBox: { margin: '0 16px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 14 },
  primaryBtn: { display: 'block', width: 'calc(100% - 32px)', margin: '0 16px', padding: '14px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', border: 'none', textAlign: 'center' },

  // Leaderboard
  leaderRow: { display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: 14, marginBottom: 8, border: '1px solid #1e293b' },

  // Feed
  feedCard: { margin: '14px 16px 10px', background: 'linear-gradient(135deg,#131c2e,#161f30)', border: '1px solid #1e293b', borderRadius: 20, padding: '20px' },
  feedListItem: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 10, marginBottom: 4, cursor: 'pointer' },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#131c2e', border: '1px solid #1e293b', borderRadius: '24px 24px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 480 },

  // Common
  centered: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  empty: { textAlign: 'center', color: '#334155', padding: 40, fontSize: 16 },
  spinner: { width: 32, height: 32, border: '3px solid #1e293b', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
