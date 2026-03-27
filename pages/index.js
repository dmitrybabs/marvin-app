import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

const HAPPY_EMOJIS = ['😊','🥰','😄','🤩','😍','🥳','😁','🌟','💫','✨'];
const SAD_EMOJIS   = ['😢','😭','😞','💔','😔','🥺','😿','😣','😖','☹️'];
const FREE_AVATARS = ['👤','🐶','🐱','🦊','🐸','🐧','🦉','🐻','🐼','🐯'];

const AVATAR_SHOP = [
  {id:'dragon',emoji:'🐉',name:'Дракон',price:100},{id:'crown',emoji:'👑',name:'Корона',price:150},
  {id:'alien',emoji:'👽',name:'Пришелец',price:120},{id:'ghost',emoji:'👻',name:'Призрак',price:100},
  {id:'robot',emoji:'🤖',name:'Робот',price:130},{id:'skull',emoji:'💀',name:'Череп',price:200},
  {id:'fire',emoji:'🔥',name:'Огонь',price:180},{id:'diamond',emoji:'💎',name:'Алмаз',price:250},
  {id:'crystal',emoji:'🔮',name:'Кристалл',price:220},{id:'thunder',emoji:'⚡',name:'Молния',price:160},
  {id:'shark',emoji:'🦈',name:'Акула',price:140},{id:'wolf',emoji:'🐺',name:'Волк',price:110},
  {id:'lion',emoji:'🦁',name:'Лев',price:130},{id:'phoenix',emoji:'🦅',name:'Феникс',price:300},
  {id:'ninja',emoji:'🥷',name:'Ниндзя',price:200},{id:'zombie',emoji:'🧟',name:'Зомби',price:170},
  {id:'mage',emoji:'🧙',name:'Маг',price:190},{id:'angel',emoji:'😇',name:'Ангел',price:160},
  {id:'devil',emoji:'😈',name:'Дьявол',price:180},{id:'snow',emoji:'❄️',name:'Снежинка',price:120},
];

const ITEMS = [
  {id:'mask_hacker',emoji:'🎭',name:'Маска Хакера',desc:'Ты невидим в сети',price:80,category:'Маски'},
  {id:'mask_ghost',emoji:'👺',name:'Маска Призрака',desc:'Пугай анонимно',price:100,category:'Маски'},
  {id:'mask_spy',emoji:'🕵️',name:'Маска Шпиона',desc:'Никто не узнает',price:120,category:'Маски'},
  {id:'mask_joker',emoji:'🃏',name:'Маска Джокера',desc:'Хаос — твой стиль',price:150,category:'Маски'},
  {id:'mask_anon',emoji:'😶',name:'Маска Анонима',desc:'Лицо без лица',price:90,category:'Маски'},
  {id:'phone_burner',emoji:'📱',name:'Одноразовый телефон',desc:'Следов не оставляет',price:110,category:'Гаджеты'},
  {id:'vpn',emoji:'🔒',name:'Супер-VPN',desc:'Сквозное шифрование',price:130,category:'Гаджеты'},
  {id:'radio',emoji:'📡',name:'Секретная антенна',desc:'Ловит всё',price:95,category:'Гаджеты'},
  {id:'usb',emoji:'💾',name:'Флешка-призрак',desc:'Самоуничтожение через 5с',price:160,category:'Гаджеты'},
  {id:'camera',emoji:'📷',name:'Скрытая камера',desc:'Видит всё, незаметно',price:200,category:'Гаджеты'},
  {id:'laptop',emoji:'💻',name:'Ноутбук без следов',desc:'RAM only, диска нет',price:250,category:'Гаджеты'},
  {id:'walkie',emoji:'📻',name:'Рация-шифровальщик',desc:'Кодирует на лету',price:140,category:'Гаджеты'},
  {id:'status_shadow',emoji:'🌑',name:'Тень',desc:'Тебя нет. Ты везде.',price:300,category:'Статусы'},
  {id:'status_cipher',emoji:'🔐',name:'Шифровальщик',desc:'Читаешь всё зашифрованное',price:280,category:'Статусы'},
  {id:'status_leak',emoji:'💧',name:'Утечка',desc:'Знает всё раньше всех',price:350,category:'Статусы'},
  {id:'status_void',emoji:'🕳️',name:'Пустота',desc:'Не существует в системе',price:400,category:'Статусы'},
  {id:'status_echo',emoji:'🌀',name:'Эхо',desc:'Твои слова везде',price:220,category:'Статусы'},
  {id:'note_burn',emoji:'🔥',name:'Горящая записка',desc:'Сгорит после прочтения',price:170,category:'Артефакты'},
  {id:'envelope',emoji:'✉️',name:'Конверт без адреса',desc:'Никаких следов',price:85,category:'Артефакты'},
  {id:'invisible_ink',emoji:'🖊️',name:'Невидимые чернила',desc:'Только для своих',price:115,category:'Артефакты'},
  {id:'dead_drop',emoji:'📦',name:'Тайник',desc:'Секретная точка сброса',price:190,category:'Артефакты'},
  {id:'codebook',emoji:'📖',name:'Кодовая книга',desc:'Расшифруй, если сможешь',price:210,category:'Артефакты'},
  {id:'mirror',emoji:'🪞',name:'Зеркало слежки',desc:'Видит за стеной',price:240,category:'Артефакты'},
  {id:'rank_agent',emoji:'🥷',name:'Агент',desc:'Лицензия на анонимность',price:500,category:'Звания'},
  {id:'rank_ghost',emoji:'👻',name:'Призрак сети',desc:'Легенда мессенджера',price:750,category:'Звания'},
  {id:'rank_architect',emoji:'🌐',name:'Архитектор',desc:'Построил эту систему',price:1000,category:'Звания'},
];

function getAuraColor(level) {
  if (level >= 20) return ['#a855f7','#ec4899'];
  if (level >= 15) return ['#ef4444','#f97316'];
  if (level >= 10) return ['#3b82f6','#06b6d4'];
  if (level >= 5)  return ['#f59e0b','#eab308'];
  return ['#22c55e','#16a34a'];
}

function vibrate(ms) {
  try { navigator?.vibrate?.(ms); } catch {}
  try {
    const tg = window?.Telegram?.WebApp;
    if (ms >= 500) tg?.HapticFeedback?.notificationOccurred('error');
    else tg?.HapticFeedback?.impactOccurred('light');
  } catch {}
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{background:'none',border:'none',cursor:'pointer'}}>
      <span style={S.backBtnInner}>← Назад</span>
    </button>
  );
}

// ===================== ITEMS DISPLAY (profile column) =====================
function ItemsDisplay({ ownedItemIds, maxVisible = 5, onShowAll }) {
  const owned = ITEMS.filter(i => ownedItemIds?.includes(i.id));
  if (!owned.length) return null;
  const visible = owned.slice(0, maxVisible);
  const hasMore = owned.length > maxVisible;

  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6,alignItems:'center'}}>
      {visible.map(item => (
        <span key={item.id} title={item.name} style={{fontSize:18,lineHeight:1}}>{item.emoji}</span>
      ))}
      {hasMore && (
        <button onClick={onShowAll} style={{fontSize:12,color:'#64748b',background:'#1e293b',border:'1px solid #334155',borderRadius:10,padding:'2px 7px',cursor:'pointer',fontWeight:700}}>
          +{owned.length - maxVisible}
        </button>
      )}
    </div>
  );
}

// ===================== EARN =====================
function EarnScreen({ user, onBack, onCoinsEarned, initData }) {
  const [emojis, setEmojis]   = useState([]);
  const [floats, setFloats]   = useState([]);
  const [points, setPoints]   = useState(user?.points || 0);
  const [coins, setCoins]     = useState(user?.coins || 0);
  const [level, setLevel]     = useState(user?.level || 1);
  const [flash, setFlash]     = useState(null);
  const [coinFlash, setCoinFlash] = useState(null);
  const idRef = useRef(0);

  useEffect(() => { setPoints(user?.points||0); setCoins(user?.coins||0); setLevel(user?.level||1); }, [user]);

  const threshold = 10 + (level - 1) * 5;

  const spawnEmoji = useCallback(() => {
    const id = idRef.current++;
    const isHappy = Math.random() > 0.42;
    const emoji = isHappy ? HAPPY_EMOJIS[Math.floor(Math.random()*HAPPY_EMOJIS.length)] : SAD_EMOJIS[Math.floor(Math.random()*SAD_EMOJIS.length)];
    const x = 10 + Math.random() * 72, y = 10 + Math.random() * 72;
    const size = 34 + Math.floor(Math.random() * 16);
    setEmojis(prev => [...prev.slice(-14), { id, emoji, x, y, isHappy, size }]);
    setTimeout(() => setEmojis(prev => prev.filter(e => e.id !== id)), 1000);
  }, []);

  useEffect(() => { spawnEmoji(); const iv = setInterval(spawnEmoji, 900); return () => clearInterval(iv); }, [spawnEmoji]);

  const handleClick = async (e, em) => {
    e.stopPropagation();
    setEmojis(prev => prev.filter(x => x.id !== em.id));
    const type = em.isHappy ? 'happy' : 'sad';
    const delta = type === 'happy' ? 1 : -2;

    // Vibration: short for happy, long for sad
    if (type === 'happy') vibrate(80);
    else vibrate(1000);

    setFlash(type === 'happy' ? 'green' : 'red');
    setTimeout(() => setFlash(null), 300);
    setPoints(prev => prev + delta);

    const fid = idRef.current++;
    setFloats(prev => [...prev, { id: fid, x: em.x, y: em.y, label: type==='happy'?'+1':'-2', color: type==='happy'?'#4ade80':'#f87171' }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== fid)), 900);

    try {
      const r = await fetch('/api/earn', {
        method:'POST', headers:{'Content-Type':'application/json','x-init-data':initData||''},
        body: JSON.stringify({ type }),
      });
      const d = await r.json();
      setPoints(d.points); setCoins(d.coins);
      if (d.level) setLevel(d.level);
      if (d.coinsEarned > 0) {
        vibrate(200);
        setCoinFlash(`+${d.coinsEarned} COIN 🎉`);
        onCoinsEarned && onCoinsEarned(d.coins);
        setTimeout(() => setCoinFlash(null), 2500);
      }
    } catch {}
  };

  const pct = Math.max(0, Math.min(100, threshold > 0 ? (points / threshold) * 100 : 0));

  return (
    <div style={S.screen}>
      <div style={S.header}><BackBtn onClick={onBack}/><span style={S.headerTitle}>Заработать MARVIN COIN</span><span style={{fontSize:12,color:'#64748b'}}>Ур.{level}</span></div>
      <div style={S.earnStrip}>
        <div style={S.earnStripItem}><span style={{...S.earnBigNum,color:points<0?'#f87171':'#f1f5f9'}}>{points}</span><span style={S.earnStripLabel}>очков</span></div>
        <div style={S.earnStripSep}/>
        <div style={S.earnStripItem}><span style={{...S.earnBigNum,color:'#f59e0b'}}>{coins}</span><span style={S.earnStripLabel}>COIN 💰</span></div>
        <div style={S.earnStripSep}/>
        <div style={S.earnStripItem}><span style={{fontSize:18,fontWeight:700,color:'#64748b'}}>{threshold}</span><span style={S.earnStripLabel}>очков/coin</span></div>
      </div>
      <div style={{padding:'0 16px 4px'}}>
        <div style={S.earnBarWrap}><div style={{height:'100%',borderRadius:6,width:`${pct}%`,background:points<0?'#ef4444':'linear-gradient(90deg,#f59e0b,#ef4444)',transition:'width 0.25s'}}/></div>
        <div style={S.earnBarLabel}>{points<0?`⚠️ минус ${Math.abs(points)} очков`:`${points} / ${threshold} до монеты`}</div>
      </div>
      {coinFlash && <div style={S.coinFlash}>{coinFlash}</div>}
      <div style={{...S.emojiField,boxShadow:flash==='green'?'0 0 0 3px #22c55e inset':flash==='red'?'0 0 0 3px #ef4444 inset':'none',background:flash==='green'?'rgba(34,197,94,0.07)':flash==='red'?'rgba(239,68,68,0.07)':'#0d1117',transition:'box-shadow 0.12s,background 0.12s'}}>
        {emojis.map(em => <button key={em.id} onClick={e=>handleClick(e,em)} style={{...S.emojiBtn,left:`${em.x}%`,top:`${em.y}%`,fontSize:em.size}}>{em.emoji}</button>)}
        {floats.map(f => <div key={f.id} style={{...S.floatLabel,left:`${f.x}%`,top:`${f.y}%`,color:f.color}}>{f.label}</div>)}
      </div>
    </div>
  );
}

// ===================== SEND =====================
function SendScreen({ user, onBack, onSent, initData }) {
  const [target, setTarget] = useState('');
  const [text, setText]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!target||!text) return setError('Заполни все поля');
    if ((user?.coins||0)<1) return setError('Недостаточно MARVIN COIN 💰');
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/send',{method:'POST',headers:{'Content-Type':'application/json','x-init-data':initData||''},body:JSON.stringify({text,targetUsername:target})});
      const d = await r.json();
      if (d.error) setError(d.error); else {setSuccess(true); onSent&&onSent(d);}
    } catch {setError('Ошибка отправки');}
    setLoading(false);
  };

  if (success) return <div style={S.screen}><div style={S.centered}><div style={{fontSize:64}}>✅</div><div style={{fontSize:20,fontWeight:700,color:'#fff'}}>Отправлено!</div><div style={{color:'#888',fontSize:14}}>Получатель получит уведомление</div><button onClick={onBack} style={S.primaryBtn}>← На главную</button></div></div>;

  return (
    <div style={S.screen}>
      <div style={S.header}><BackBtn onClick={onBack}/><span style={S.headerTitle}>Анонимное сообщение</span><span/></div>
      <div style={S.coinsHint}>💰 У тебя: <b style={{color:'#f59e0b'}}>{user?.coins||0} COIN</b> · Стоимость: 1 COIN</div>
      <div style={S.formGroup}><label style={S.label}>Кому (Telegram username)</label><input style={S.input} placeholder="@НИК (скопируй в профиле)" value={target} onChange={e=>setTarget(e.target.value)}/></div>
      <div style={S.formGroup}><label style={S.label}>Сообщение</label><textarea style={{...S.input,height:140,resize:'none'}} placeholder="Напиши что-нибудь анонимно..." value={text} maxLength={500} onChange={e=>setText(e.target.value)}/><div style={S.charCount}>{text.length}/500</div></div>
      {error && <div style={S.errorBox}>{error}</div>}
      <button onClick={handleSend} disabled={loading||!target||!text} style={{...S.primaryBtn,opacity:(!target||!text||loading)?0.5:1}}>{loading?'...':'🕵️ Отправить анонимно'}</button>
    </div>
  );
}

// ===================== LEADERBOARD =====================
function LeaderboardScreen({ onBack, onViewProfile }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch('/api/leaderboard').then(r=>r.json()).then(d=>{setUsers(d.users||[]);setLoading(false);}).catch(()=>setLoading(false)); }, []);

  const medals = ['🥇','🥈','🥉'];

  return (
    <div style={S.screen}>
      <div style={S.header}><BackBtn onClick={onBack}/><span style={S.headerTitle}>Топ уровней</span><span/></div>
      {loading?<div style={S.centered}><div style={S.spinner}/></div>
      :users.length===0?<div style={S.empty}>Пока никого нет 👀<br/><span style={{fontSize:13,color:'#334155'}}>Открой приложение через бота чтобы появиться</span></div>
      :<div style={{padding:'8px 16px',overflowY:'auto',flex:1}}>
        {users.map((u,i)=>{
          const [c1,c2]=getAuraColor(u.level);
          return (
            <button key={i} onClick={()=>onViewProfile&&onViewProfile(u.username)} style={{...S.leaderRow,width:'100%',textAlign:'left',cursor:'pointer',background:i===0?'rgba(245,158,11,0.06)':'rgba(255,255,255,0.02)'}}>
              <div style={{fontSize:20,width:32}}>{medals[i]||`#${i+1}`}</div>
              <div style={{fontSize:22,marginRight:8}}>{u.avatar||'👤'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,color:'#f1f5f9'}}>@{u.username}</div>
                {u.bio&&<div style={{fontSize:11,color:'#64748b'}}>{u.bio}</div>}
                {u.topItems&&u.topItems.length>0&&<div style={{display:'flex',gap:3,marginTop:2}}>{u.topItems.map(e=><span key={e} style={{fontSize:14}}>{e}</span>)}</div>}
              </div>
              <div style={{background:`linear-gradient(135deg,${c1},${c2})`,borderRadius:20,padding:'3px 10px',fontSize:12,fontWeight:700,color:'#000',flexShrink:0}}>Ур.{u.level}</div>
            </button>
          );
        })}
      </div>}
    </div>
  );
}

// ===================== FEED =====================
function FeedScreen({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => { fetch('/api/feed').then(r=>r.json()).then(d=>{setMessages(d.messages||[]);setLoading(false);}).catch(()=>setLoading(false)); }, []);

  const startAuto = useCallback((msgs) => {
    clearInterval(timerRef.current);
    if (msgs.length<2) return;
    timerRef.current = setInterval(() => { setFade(false); setTimeout(()=>{setActiveIdx(p=>(p+1)%msgs.length);setFade(true);},400); },4000);
  },[]);

  useEffect(() => { startAuto(messages); return ()=>clearInterval(timerRef.current); },[messages]);

  const selectMsg = (i) => { clearInterval(timerRef.current); setFade(false); setTimeout(()=>{setActiveIdx(i);setFade(true);startAuto(messages);},200); };
  const msg = messages[activeIdx];

  return (
    <div style={S.screen}>
      <div style={S.header}><BackBtn onClick={onBack}/><span style={S.headerTitle}>Лента сообщений</span><span/></div>
      {loading?<div style={S.centered}><div style={S.spinner}/></div>
      :messages.length===0?<div style={S.empty}>Сообщений пока нет 🕊️</div>
      :<>
        <div style={{...S.feedCard,opacity:fade?1:0,transition:'opacity 0.4s'}}>
          <div style={{color:'#f59e0b',fontWeight:700,fontSize:15,marginBottom:10}}>{msg?.to}</div>
          <div style={{fontSize:17,color:'#e2e8f0',lineHeight:1.6,marginBottom:14}}>{msg?.text}</div>
          <div style={{display:'flex',justifyContent:'space-between',color:'#475569',fontSize:12}}>
            <span>🕵️ Anonymous</span>
            <span>{msg?.time?new Date(msg.time).toLocaleString('ru-RU',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}):''}</span>
          </div>
        </div>
        <div style={{padding:'0 16px',flex:1,overflowY:'auto'}}>
          {messages.slice(0,60).map((m,i)=>(
            <button key={m.id||i} onClick={()=>selectMsg(i)} style={{...S.feedListItem,background:i===activeIdx?'rgba(245,158,11,0.07)':'transparent',borderLeft:i===activeIdx?'3px solid #f59e0b':'3px solid transparent',width:'100%',textAlign:'left'}}>
              <span style={{color:'#f59e0b',fontWeight:600,flexShrink:0,fontSize:13}}>{m.to}</span>
              <span style={{color:'#94a3b8',flex:1,margin:'0 8px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:13}}>{m.text}</span>
              <span style={{color:'#475569',fontSize:11,flexShrink:0}}>{m.time?new Date(m.time).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):''}</span>
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}

// ===================== AVATAR SHOP =====================
function AvatarShopScreen({ user, onBack, onBought, initData }) {
  const [owned, setOwned] = useState(user?.ownedAvatars||[]);
  const [coins, setCoins] = useState(user?.coins||0);
  const [buying, setBuying] = useState(null);
  const [msg, setMsg] = useState(null);

  const handleBuy = async (item) => {
    if (owned.includes(item.id)||coins<item.price) { setMsg(owned.includes(item.id)?'Уже куплено':`Нужно ${item.price} COIN`); setTimeout(()=>setMsg(null),2000); return; }
    setBuying(item.id);
    try {
      const r = await fetch('/api/shop',{method:'POST',headers:{'Content-Type':'application/json','x-init-data':initData||''},body:JSON.stringify({itemId:item.id})});
      const d = await r.json();
      if (d.error) {setMsg(d.error);setTimeout(()=>setMsg(null),2000);}
      else {setOwned(d.owned);setCoins(d.coins);onBought&&onBought(d.coins,d.owned);setMsg(`${item.emoji} куплено!`);setTimeout(()=>setMsg(null),2000);}
    } catch {setMsg('Ошибка');}
    setBuying(null);
  };

  return (
    <div style={S.screen}>
      <div style={S.header}><BackBtn onClick={onBack}/><span style={S.headerTitle}>Магазин аватаров</span><span style={{color:'#f59e0b',fontWeight:700,fontSize:14}}>{coins} 💰</span></div>
      {msg&&<div style={S.coinFlash}>{msg}</div>}
      <div style={{padding:'8px 16px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,overflowY:'auto',flex:1}}>
        {AVATAR_SHOP.map(item=>{
          const isOwned=owned.includes(item.id);const canBuy=coins>=item.price;
          return (
            <button key={item.id} onClick={()=>handleBuy(item)} disabled={buying===item.id} style={{background:isOwned?'rgba(34,197,94,0.08)':'linear-gradient(135deg,#0f172a,#131c2e)',border:isOwned?'1px solid #22c55e':canBuy?'1px solid #334155':'1px solid #1e293b',borderRadius:16,padding:'14px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:6,cursor:isOwned?'default':'pointer',opacity:buying===item.id?0.6:1}}>
              <span style={{fontSize:32}}>{item.emoji}</span>
              <span style={{fontSize:11,fontWeight:600,color:'#94a3b8'}}>{item.name}</span>
              {isOwned?<span style={{fontSize:11,color:'#22c55e',fontWeight:700}}>✓ Есть</span>:<span style={{fontSize:12,fontWeight:700,color:canBuy?'#f59e0b':'#475569'}}>{item.price} 💰</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===================== ITEMS SHOP =====================
function ItemsShopScreen({ user, onBack, onBought, initData }) {
  const [ownedItems, setOwnedItems] = useState(user?.ownedItems||[]);
  const [coins, setCoins] = useState(user?.coins||0);
  const [buying, setBuying] = useState(null);
  const [msg, setMsg] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Все');

  const categories = ['Все', ...Array.from(new Set(ITEMS.map(i=>i.category)))];
  const filtered = activeCategory==='Все' ? ITEMS : ITEMS.filter(i=>i.category===activeCategory);

  const handleBuy = async (item) => {
    if (ownedItems.includes(item.id)||coins<item.price) {setMsg(ownedItems.includes(item.id)?'Уже куплено':`Нужно ${item.price} COIN`);setTimeout(()=>setMsg(null),2000);return;}
    setBuying(item.id);
    try {
      const r = await fetch('/api/items-shop',{method:'POST',headers:{'Content-Type':'application/json','x-init-data':initData||''},body:JSON.stringify({itemId:item.id})});
      const d = await r.json();
      if (d.error){setMsg(d.error);setTimeout(()=>setMsg(null),2000);}
      else{setOwnedItems(d.ownedItems);setCoins(d.coins);onBought&&onBought(d.coins,d.ownedItems);setMsg(`${item.emoji} ${item.name} куплено!`);setTimeout(()=>setMsg(null),2500);}
    } catch{setMsg('Ошибка');}
    setBuying(null);
  };

  return (
    <div style={S.screen}>
      <div style={S.header}><BackBtn onClick={onBack}/><span style={S.headerTitle}>Магазин вещей</span><span style={{color:'#f59e0b',fontWeight:700,fontSize:14}}>{coins} 💰</span></div>
      {msg&&<div style={S.coinFlash}>{msg}</div>}
      <div style={{display:'flex',gap:8,padding:'8px 16px',overflowX:'auto',flexShrink:0}}>
        {categories.map(cat=>(
          <button key={cat} onClick={()=>setActiveCategory(cat)} style={{background:activeCategory===cat?'#3b82f6':'#1e293b',border:'none',borderRadius:20,padding:'5px 12px',color:activeCategory===cat?'#fff':'#94a3b8',fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>{cat}</button>
        ))}
      </div>
      <div style={{padding:'4px 16px',overflowY:'auto',flex:1}}>
        {filtered.map(item=>{
          const isOwned=ownedItems.includes(item.id);const canBuy=coins>=item.price;
          return (
            <button key={item.id} onClick={()=>handleBuy(item)} disabled={buying===item.id} style={{width:'100%',display:'flex',alignItems:'center',gap:12,background:isOwned?'rgba(34,197,94,0.05)':'rgba(255,255,255,0.02)',border:isOwned?'1px solid rgba(34,197,94,0.3)':'1px solid #1e293b',borderRadius:14,padding:'12px 14px',marginBottom:8,cursor:isOwned?'default':'pointer',textAlign:'left',opacity:buying===item.id?0.6:1}}>
              <span style={{fontSize:28,flexShrink:0}}>{item.emoji}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,color:'#f1f5f9'}}>{item.name}</div>
                <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{item.desc}</div>
                <div style={{fontSize:11,color:'#334155',marginTop:2}}>{item.category}</div>
              </div>
              {isOwned?<span style={{color:'#22c55e',fontWeight:700,fontSize:13,flexShrink:0}}>✓ Есть</span>:<span style={{fontWeight:700,fontSize:13,color:canBuy?'#f59e0b':'#475569',flexShrink:0}}>{item.price} 💰</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===================== PROFILE VIEW =====================
function ProfileScreen({ username, currentUser, onBack, initData }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/profile-view?username=${encodeURIComponent(username)}`)
      .then(r=>r.json()).then(d=>{setProfile(d);setLoading(false);}).catch(()=>setLoading(false));
  },[username]);

  useEffect(()=>{load();},[load]);

  const handlePost = async () => {
    if (!postText.trim()||!profile) return;
    setPosting(true);
    try {
      const r = await fetch('/api/wall-post',{method:'POST',headers:{'Content-Type':'application/json','x-init-data':initData||''},body:JSON.stringify({targetUserId:profile.userId,text:postText})});
      const d = await r.json();
      if (d.ok){setPostText('');setProfile(prev=>({...prev,posts:[d.post,...(prev.posts||[])]}));}
    } catch {}
    setPosting(false);
  };

  if (loading) return <div style={S.screen}><div style={S.centered}><div style={S.spinner}/></div></div>;
  if (!profile||profile.error) return <div style={S.screen}><div style={S.header}><BackBtn onClick={onBack}/><span style={S.headerTitle}>Профиль</span><span/></div><div style={S.empty}>Пользователь не найден 👻<br/><span style={{fontSize:12,color:'#334155'}}>Они ещё не заходили в MARVIN</span></div></div>;

  const [c1,c2]=getAuraColor(profile.level);
  const isOwn=currentUser?.username===profile.username;
  const ownedItemEmojis = ITEMS.filter(i=>profile.ownedItemIds?.includes(i.id)).map(i=>i.emoji);
  const visibleItems = showAllItems ? ownedItemEmojis : ownedItemEmojis.slice(0,8);

  return (
    <div style={S.screen}>
      <div style={S.header}><BackBtn onClick={onBack}/><span style={S.headerTitle}>@{profile.username}</span><span/></div>
      <div style={{margin:'12px 16px',background:'linear-gradient(135deg,#0f172a,#131c2e)',borderRadius:20,padding:'18px',border:'1px solid #1e293b'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{position:'absolute',width:64,height:64,borderRadius:'50%',top:'50%',left:'50%',background:`conic-gradient(${c1},${c2},${c1})`,animation:'auraRot 3s linear infinite',zIndex:0,filter:'blur(2px)',opacity:0.85}}/>
            <div style={{position:'relative',zIndex:1,width:52,height:52,borderRadius:'50%',background:'#0d1117',border:'2px solid #1e293b',display:'flex',alignItems:'center',justifyContent:'center',margin:5,fontSize:28}}>{profile.avatar}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:17,fontWeight:700,color:'#f1f5f9'}}>@{profile.username}</div>
            {profile.bio&&<div style={{fontSize:13,color:'#64748b',marginTop:2}}>{profile.bio}</div>}
            <div style={{marginTop:8,display:'flex',gap:16}}>
              <div><div style={{fontWeight:700,color:c1,fontSize:18}}>{profile.level}</div><div style={{fontSize:10,color:'#475569'}}>уровень</div></div>
              <div><div style={{fontWeight:700,color:'#f1f5f9',fontSize:18}}>{profile.messagesSent}</div><div style={{fontSize:10,color:'#475569'}}>сообщений</div></div>
            </div>
            {ownedItemEmojis.length>0&&(
              <div style={{marginTop:8}}>
                <div style={{fontSize:10,color:'#334155',marginBottom:4,letterSpacing:1,textTransform:'uppercase'}}>Предметы</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4,alignItems:'center'}}>
                  {visibleItems.map((e,i)=><span key={i} style={{fontSize:20}}>{e}</span>)}
                  {!showAllItems&&ownedItemEmojis.length>8&&<button onClick={()=>setShowAllItems(true)} style={{fontSize:12,color:'#64748b',background:'#1e293b',border:'1px solid #334155',borderRadius:10,padding:'2px 7px',cursor:'pointer',fontWeight:700}}>+{ownedItemEmojis.length-8}</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{padding:'0 16px',flex:1,overflowY:'auto'}}>
        <div style={{fontSize:12,fontWeight:700,color:'#334155',letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>Стена</div>
        {!isOwn&&(
          <div style={{marginBottom:14}}>
            <textarea style={{...S.input,height:76,resize:'none',fontSize:14}} placeholder="Написать на стене..." value={postText} maxLength={300} onChange={e=>setPostText(e.target.value)}/>
            <button onClick={handlePost} disabled={posting||!postText.trim()} style={{...S.primaryBtn,marginTop:8,width:'100%',padding:'10px',fontSize:14,opacity:(!postText.trim()||posting)?0.5:1}}>{posting?'...':'📝 Опубликовать'}</button>
          </div>
        )}
        {(!profile.posts||profile.posts.length===0)?<div style={{color:'#1e293b',textAlign:'center',padding:'16px 0',fontSize:14}}>На стене пока пусто</div>:
          profile.posts.map((p,i)=>(
            <div key={p.id||i} style={{background:'rgba(255,255,255,0.02)',border:'1px solid #1e293b',borderRadius:14,padding:'11px 14px',marginBottom:9}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{color:'#3b82f6',fontWeight:600,fontSize:13}}>@{p.authorUsername}</span>
                <span style={{color:'#1e293b',fontSize:11}}>{p.time?new Date(p.time).toLocaleString('ru-RU',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}):''}</span>
              </div>
              <div style={{color:'#cbd5e1',fontSize:14,lineHeight:1.5}}>{p.text}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ===================== AVATAR PICKER =====================
function AvatarPicker({ current, owned, onSelect, onClose, onOpenAvatarShop }) {
  const allOwned = [...FREE_AVATARS, ...AVATAR_SHOP.filter(i=>owned.includes(i.id)).map(i=>i.emoji)];
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e=>e.stopPropagation()}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:4,color:'#fff'}}>Выбери аватар</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',maxHeight:200,overflowY:'auto',marginBottom:12}}>
          {allOwned.map((av,i)=>(
            <button key={i} onClick={()=>{onSelect(av);onClose();}} style={{fontSize:28,background:av===current?'rgba(245,158,11,0.2)':'#1a2233',border:av===current?'2px solid #f59e0b':'2px solid #1e293b',borderRadius:12,width:50,height:50,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{av}</button>
          ))}
        </div>
        <button onClick={()=>{onClose();onOpenAvatarShop();}} style={{...S.primaryBtn,width:'100%',background:'linear-gradient(135deg,#f59e0b,#ef4444)',color:'#000'}}>🛒 Магазин аватаров</button>
      </div>
    </div>
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
  const [profileUsername, setProfileUsername] = useState(null);
  const [profileBackScreen, setProfileBackScreen] = useState('home');
  const [wallPosts, setWallPosts] = useState([]);
  const [wallText, setWallText]   = useState('');
  const [postingWall, setPostingWall] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); setInitData(tg.initData||''); }
  }, []);

  const fetchUser = useCallback(async (id) => {
    try {
      const r = await fetch('/api/user',{headers:{'x-init-data':id||initData}});
      const d = await r.json();
      setUserData(d); setBio(d.bio||'');
    } catch {}
  }, [initData]);

  useEffect(()=>{fetchUser(initData);},[initData]);

  useEffect(()=>{
    if (!userData?.username) return;
    fetch(`/api/profile-view?username=${userData.username}`).then(r=>r.json()).then(d=>setWallPosts(d.posts||[])).catch(()=>{});
  },[userData?.username]);

  const openProfile = (username, backScreen = 'home') => {
    setProfileUsername(username);
    setProfileBackScreen(backScreen);
    setScreen('profile');
  };

  const handleSelectAvatar = async (av) => {
    setUserData(prev=>({...prev,avatar:av}));
    try { await fetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json','x-init-data':initData||''},body:JSON.stringify({avatar:av})}); } catch {}
  };

  const handleSaveBio = async () => {
    const newBio = bioInput.slice(0,20);
    setBio(newBio); setUserData(prev=>({...prev,bio:newBio})); setEditingBio(false);
    try { await fetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json','x-init-data':initData||''},body:JSON.stringify({bio:newBio})}); } catch {}
  };

  const handleWallPost = async () => {
    if (!wallText.trim()||!userData) return;
    setPostingWall(true);
    try {
      const r = await fetch('/api/wall-post',{method:'POST',headers:{'Content-Type':'application/json','x-init-data':initData||''},body:JSON.stringify({targetUserId:userData.id,text:wallText})});
      const d = await r.json();
      if (d.ok){setWallPosts(prev=>[d.post,...prev]);setWallText('');}
    } catch {}
    setPostingWall(false);
  };

  if (screen==='earn') return <EarnScreen user={userData} onBack={()=>{setScreen('home');fetchUser(initData);}} onCoinsEarned={c=>setUserData(p=>({...p,coins:c}))} initData={initData}/>;
  if (screen==='send') return <SendScreen user={userData} onBack={()=>setScreen('home')} onSent={d=>{setUserData(p=>({...p,coins:d.coins,messagesSent:d.messagesSent,level:d.level}));setTimeout(()=>setScreen('home'),1500);}} initData={initData}/>;
  if (screen==='leaderboard') return <LeaderboardScreen onBack={()=>setScreen('home')} onViewProfile={u=>openProfile(u,'leaderboard')}/>;
  if (screen==='feed') return <FeedScreen onBack={()=>setScreen('home')}/>;
  if (screen==='avatar-shop') return <AvatarShopScreen user={userData} onBack={()=>setScreen('home')} onBought={(c,o)=>setUserData(p=>({...p,coins:c,ownedAvatars:o}))} initData={initData}/>;
  if (screen==='items-shop') return <ItemsShopScreen user={userData} onBack={()=>setScreen('home')} onBought={(c,o)=>setUserData(p=>({...p,coins:c,ownedItems:o}))} initData={initData}/>;
  if (screen==='profile') return <ProfileScreen username={profileUsername} currentUser={userData} onBack={()=>setScreen(profileBackScreen)} initData={initData}/>;

  const level=userData?.level||1;
  const [auraC1,auraC2]=getAuraColor(level);
  const avatar=userData?.avatar||'👤';
  const myItems=ITEMS.filter(i=>(userData?.ownedItems||[]).includes(i.id));
  const visibleItems=showAllItems?myItems:myItems.slice(0,5);

  return (
    <>
      <Head>
        <title>MARVIN</title>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
        <script src="https://telegram.org/js/telegram-web-app.js"/>
      </Head>
      <div style={S.screen}>
        <div style={S.homeTop}>
          <div style={S.marvinTitle}><span style={S.marvinM}>M</span><span style={S.marvinArvin}>ARVIN</span></div>
          <div style={S.marvinSub}>анонимный мессенджер</div>
        </div>

        {/* User card */}
        <div style={S.userCard}>
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{position:'absolute',width:68,height:68,borderRadius:'50%',top:'50%',left:'50%',background:`conic-gradient(${auraC1},${auraC2},${auraC1})`,animation:'auraRot 3s linear infinite',zIndex:0,filter:'blur(2px)',opacity:0.9}}/>
            <button onClick={()=>setShowAvatarPicker(true)} style={{position:'relative',zIndex:1,width:54,height:54,borderRadius:'50%',background:'#0d1117',border:'2px solid #1e293b',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',margin:6,fontSize:28}}>
              {avatar}
            </button>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={S.userName}>@{userData?.username||'...'}</div>
            <div style={S.userStats}><span style={{color:auraC1,fontWeight:700}}>Ур.{level}</span>{'  ·  '}<span style={{color:'#f59e0b',fontWeight:700}}>{userData?.coins||0}</span><span style={{color:'#475569'}}> COIN</span></div>
            {editingBio?(
              <div style={{display:'flex',gap:6,marginTop:6}}>
                <input autoFocus maxLength={20} value={bioInput} onChange={e=>setBioInput(e.target.value)} style={{...S.bioInput,flex:1}} placeholder="До 20 символов" onKeyDown={e=>e.key==='Enter'&&handleSaveBio()}/>
                <button onClick={handleSaveBio} style={S.bioSaveBtn}>✓</button>
                <button onClick={()=>setEditingBio(false)} style={S.bioCancelBtn}>✕</button>
              </div>
            ):(
              <button onClick={()=>{setBioInput(bio);setEditingBio(true);}} style={S.bioEditBtn}>{bio||'+ добавить статус'}</button>
            )}
            {/* Items display */}
            {myItems.length>0&&(
              <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:3,alignItems:'center'}}>
                {visibleItems.map(item=><span key={item.id} title={item.name} style={{fontSize:18}}>{item.emoji}</span>)}
                {!showAllItems&&myItems.length>5&&<button onClick={()=>setShowAllItems(true)} style={{fontSize:11,color:'#64748b',background:'#1e293b',border:'1px solid #334155',borderRadius:10,padding:'2px 7px',cursor:'pointer',fontWeight:700}}>+{myItems.length-5}</button>}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div style={S.grid}>
          {[
            {key:'earn',emoji:'💰',title:'Заработать MARVIN COIN',desc:'Лови смайлики, копи монеты'},
            {key:'send',emoji:'🕵️',title:'Написать анонимно',desc:'1 COIN за сообщение'},
            {key:'leaderboard',emoji:'🏆',title:'Топ уровней',desc:'Нажми на игрока → профиль'},
            {key:'feed',emoji:'📡',title:'Лента сообщений',desc:'Анонимный поток мыслей'},
            {key:'avatar-shop',emoji:'🎭',title:'Магазин аватаров',desc:'Уникальные аватарки'},
            {key:'items-shop',emoji:'🕳️',title:'Магазин вещей',desc:'Артефакты и звания'},
          ].map(item=>(
            <button key={item.key} onClick={()=>setScreen(item.key)} style={S.card}>
              <div style={{fontSize:24,marginBottom:5}}>{item.emoji}</div>
              <div style={S.cardTitle}>{item.title}</div>
              <div style={S.cardDesc}>{item.desc}</div>
            </button>
          ))}
        </div>

        {/* Own wall */}
        <div style={{padding:'10px 16px 0'}}>
          <div style={{fontSize:11,fontWeight:700,color:'#1e293b',letterSpacing:1,textTransform:'uppercase',marginBottom:8}}>МОЯ СТЕНА</div>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <input style={{...S.bioInput,flex:1,fontSize:13}} placeholder="Написать на своей стене..." value={wallText} maxLength={300} onChange={e=>setWallText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleWallPost()}/>
            <button onClick={handleWallPost} disabled={postingWall||!wallText.trim()} style={{background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',border:'none',borderRadius:10,padding:'6px 14px',color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',opacity:(!wallText.trim()||postingWall)?0.5:1}}>→</button>
          </div>
          {wallPosts.slice(0,4).map((p,i)=>(
            <div key={p.id||i} style={{background:'rgba(255,255,255,0.02)',border:'1px solid #1e293b',borderRadius:12,padding:'9px 12px',marginBottom:7}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                <span style={{color:'#3b82f6',fontSize:12,fontWeight:600}}>@{p.authorUsername}</span>
                <span style={{color:'#1e293b',fontSize:11}}>{p.time?new Date(p.time).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):''}</span>
              </div>
              <div style={{color:'#64748b',fontSize:13}}>{p.text}</div>
            </div>
          ))}
        </div>

        <div style={S.footer}>{userData?.messagesSent||0} сообщений отправлено</div>
      </div>

      {showAvatarPicker&&<AvatarPicker current={avatar} owned={userData?.ownedAvatars||[]} onSelect={handleSelectAvatar} onClose={()=>setShowAvatarPicker(false)} onOpenAvatarShop={()=>setScreen('avatar-shop')}/>}

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#0d1117;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
        button{cursor:pointer;border:none;background:none;font-family:inherit;color:inherit;}
        input,textarea{font-family:inherit;color:#e2e8f0;}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#0d1117}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes auraRot{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes floatAnim{0%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.1) translateY(-5px)}100%{transform:translate(-50%,-50%) scale(1)}}
        @keyframes fadeUp{0%{opacity:1;transform:translate(-50%,-50%) translateY(0)}100%{opacity:0;transform:translate(-50%,-50%) translateY(-40px)}}
      `}</style>
    </>
  );
}

const S = {
  screen:{minHeight:'100vh',background:'#0d1117',display:'flex',flexDirection:'column',paddingBottom:28,overflowX:'hidden'},
  homeTop:{padding:'28px 20px 10px',textAlign:'center'},
  marvinTitle:{display:'flex',alignItems:'baseline',justifyContent:'center'},
  marvinM:{fontSize:48,fontWeight:900,color:'#fff',letterSpacing:-2,lineHeight:1},
  marvinArvin:{fontSize:48,fontWeight:200,color:'#475569',letterSpacing:6,lineHeight:1},
  marvinSub:{fontSize:11,color:'#334155',letterSpacing:3,marginTop:3,textTransform:'uppercase'},
  userCard:{margin:'0 16px 14px',background:'linear-gradient(135deg,#0f172a,#131c2e)',borderRadius:20,padding:'14px',display:'flex',alignItems:'flex-start',gap:12,border:'1px solid #1e293b',boxShadow:'0 4px 24px rgba(0,0,0,0.5)'},
  userName:{fontSize:15,fontWeight:700,color:'#f1f5f9',marginBottom:2},
  userStats:{fontSize:13,color:'#475569',marginBottom:3},
  bioEditBtn:{fontSize:12,color:'#334155',background:'none',border:'none',cursor:'pointer',padding:0,textAlign:'left',display:'block'},
  bioInput:{background:'#1e293b',border:'1px solid #334155',borderRadius:8,padding:'5px 9px',fontSize:13,outline:'none',color:'#e2e8f0'},
  bioSaveBtn:{background:'#22c55e',color:'#000',borderRadius:8,padding:'5px 9px',fontWeight:700,fontSize:13,border:'none',cursor:'pointer'},
  bioCancelBtn:{background:'#1e293b',color:'#64748b',borderRadius:8,padding:'5px 9px',fontSize:13,border:'none',cursor:'pointer'},
  grid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,padding:'0 16px 4px'},
  card:{background:'linear-gradient(135deg,#0f172a,#131c2e)',border:'1px solid #1e293b',borderRadius:16,padding:'14px 12px',textAlign:'left',display:'flex',flexDirection:'column',cursor:'pointer'},
  cardTitle:{fontSize:13,fontWeight:700,color:'#f1f5f9',lineHeight:1.3,marginBottom:3},
  cardDesc:{fontSize:11,color:'#334155'},
  footer:{textAlign:'center',color:'#1e293b',fontSize:11,marginTop:12,letterSpacing:1},
  header:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #1e293b',background:'#0d1117'},
  headerTitle:{fontSize:15,fontWeight:700,color:'#f1f5f9'},
  backBtnInner:{display:'inline-flex',alignItems:'center',gap:4,background:'linear-gradient(135deg,#1e293b,#0f172a)',border:'1px solid #334155',borderRadius:20,padding:'6px 14px',fontSize:13,fontWeight:600,color:'#94a3b8',boxShadow:'0 2px 8px rgba(0,0,0,0.3)'},
  earnStrip:{display:'flex',alignItems:'center',margin:'10px 16px 8px',background:'linear-gradient(135deg,#0f172a,#131c2e)',borderRadius:16,border:'1px solid #1e293b'},
  earnStripItem:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'12px 6px'},
  earnBigNum:{fontSize:34,fontWeight:900,lineHeight:1,letterSpacing:-1},
  earnStripLabel:{fontSize:10,color:'#334155',marginTop:3,textTransform:'uppercase',letterSpacing:1},
  earnStripSep:{width:1,height:36,background:'#1e293b'},
  earnBarWrap:{height:8,background:'#1e293b',borderRadius:6,overflow:'hidden',marginBottom:3},
  earnBarLabel:{fontSize:11,color:'#334155',textAlign:'center',marginBottom:4},
  coinFlash:{margin:'4px 16px',background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:12,padding:'10px',textAlign:'center',color:'#f59e0b',fontWeight:700,fontSize:16},
  emojiField:{flex:1,position:'relative',margin:'4px 16px 0',borderRadius:18,border:'1px solid #1e293b',minHeight:260,overflow:'hidden'},
  emojiBtn:{position:'absolute',transform:'translate(-50%,-50%)',background:'none',border:'none',cursor:'pointer',padding:4,lineHeight:1,animation:'floatAnim 2s ease-in-out infinite'},
  floatLabel:{position:'absolute',transform:'translate(-50%,-50%)',fontWeight:900,fontSize:22,pointerEvents:'none',animation:'fadeUp 0.9s ease-out forwards'},
  coinsHint:{margin:'10px 16px',background:'#0f172a',borderRadius:12,padding:'9px 14px',fontSize:14,color:'#475569',border:'1px solid #1e293b'},
  formGroup:{padding:'0 16px',marginBottom:12},
  label:{display:'block',fontSize:11,color:'#334155',marginBottom:5,letterSpacing:1,textTransform:'uppercase'},
  input:{width:'100%',background:'#0f172a',border:'1px solid #1e293b',borderRadius:12,padding:'11px 14px',fontSize:15,outline:'none'},
  charCount:{textAlign:'right',fontSize:11,color:'#1e293b',marginTop:3},
  errorBox:{margin:'0 16px 10px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,padding:'9px 14px',color:'#f87171',fontSize:14},
  primaryBtn:{display:'block',width:'calc(100% - 32px)',margin:'0 16px',padding:'13px',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',borderRadius:14,color:'#fff',fontWeight:800,fontSize:15,cursor:'pointer',border:'none',textAlign:'center'},
  leaderRow:{display:'flex',alignItems:'center',padding:'11px 14px',borderRadius:14,marginBottom:7,border:'1px solid #1e293b'},
  feedCard:{margin:'12px 16px 8px',background:'linear-gradient(135deg,#0f172a,#131c2e)',border:'1px solid #1e293b',borderRadius:18,padding:'18px'},
  feedListItem:{display:'flex',alignItems:'center',padding:'9px 10px',borderRadius:10,marginBottom:3,cursor:'pointer'},
  modalOverlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:100},
  modal:{background:'#131c2e',border:'1px solid #1e293b',borderRadius:'22px 22px 0 0',padding:'22px 18px 32px',width:'100%',maxWidth:480},
  centered:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,gap:16},
  empty:{textAlign:'center',color:'#334155',padding:40,fontSize:16},
  spinner:{width:30,height:30,border:'3px solid #1e293b',borderTop:'3px solid #3b82f6',borderRadius:'50%',animation:'spin 0.8s linear infinite'},
};
