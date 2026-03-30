import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveMenu, fetchStats } from './api';
import { BADGES } from './badges';
import s from './Admin.module.css';

const CLOUD = 'dljcgfm0i';
const PRESET = 'PerkUP';

function hash(str) {
  let h = 0x12345678;
  for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; h ^= h >>> 16; }
  return (h >>> 0).toString(36);
}
const HASH = hash('57ba1z72');

async function uploadPhoto(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);
  fd.append('folder', 'perkup');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Помилка завантаження');
  return (await res.json()).secure_url;
}

function useDrag(list, onChange) {
  const from = useRef(null);
  const [over, setOver] = useState(null);
  const getProps = useCallback((i) => ({
    draggable: true,
    onDragStart: () => { from.current = i; },
    onDragEnter: (e) => { e.preventDefault(); setOver(i); },
    onDragOver: (e) => e.preventDefault(),
    onDragEnd: () => { setOver(null); from.current = null; },
    onDrop: () => {
      if (from.current === null || from.current === i) { setOver(null); return; }
      const next = [...list];
      const [m] = next.splice(from.current, 1);
      next.splice(i, 0, m);
      onChange(next);
      setOver(null); from.current = null;
    },
  }), [list, onChange]); // eslint-disable-line
  return { getProps, over };
}

export default function Admin({ menuData, setMenuData, onClose, onPrint }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('pu_adm') === '1');
  const [pw, setPw] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [tries, setTries] = useState(0);
  const [lock, setLock] = useState(0);
  const [tab, setTab] = useState('stats');
  const [status, setStatus] = useState('Всі зміни збережено');
  const [stats, setStats] = useState(null);
  const [data, setData] = useState(null);
  const [openSecs, setOpenSecs] = useState({});

  useEffect(() => { if (authed && menuData) setData(JSON.parse(JSON.stringify(menuData))); }, [authed, menuData]);
  useEffect(() => { if (authed && tab === 'stats') fetchStats('57ba1z72').then(setStats).catch(() => {}); }, [authed, tab]); // eslint-disable-line

  const login = () => {
    if (Date.now() < lock) return;
    if (hash(pw) === HASH) { sessionStorage.setItem('pu_adm', '1'); setAuthed(true); setLoginErr(''); }
    else {
      const t = tries + 1; setTries(t); setPw('');
      if (t >= 5) { setLock(Date.now() + 30000); setTries(0); setLoginErr('Заблоковано 30 сек'); }
      else setLoginErr(`Невірний пароль · Залишилось: ${5 - t}`);
    }
  };
  const logout = () => { sessionStorage.removeItem('pu_adm'); setAuthed(false); onClose(); };

  const mut = (fn) => {
    setData(p => { const d = JSON.parse(JSON.stringify(p)); fn(d); return d; });
    setStatus('⚠ Незбережено');
  };
  const save = async () => {
    setStatus('⏳ Збереження...');
    try { await saveMenu(data, '57ba1z72'); setMenuData(data); setStatus('✓ Збережено для всіх'); setTimeout(() => setStatus('Всі зміни збережено'), 2500); }
    catch (e) { setStatus('❌ ' + e.message); }
  };

  const reorderSecs = useCallback((next) => mut(d => { d.sections = next; }), []); // eslint-disable-line
  const { getProps: secDrag, over: secOver } = useDrag(data?.sections || [], reorderSecs);

  if (!authed) return (
    <div className={s.loginPage}>
      <div className={s.loginBox}>
        <div className={s.loginLogo}>Perk<span>UP</span></div>
        <div className={s.loginSub}>Адмін · Крона Парк 2</div>
        <label className={s.loginLabel}>Пароль</label>
        <input type="password" className={s.loginInput} placeholder="••••••••" value={pw}
          onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} autoFocus />
        {loginErr && <div className={s.loginErr}>{loginErr}</div>}
        <button className={s.loginBtn} onClick={login}>Увійти</button>
        <button className={s.backBtn} onClick={onClose}>← Повернутись до меню</button>
      </div>
    </div>
  );

  return (
    <div className={s.adminPage}>
      <nav className={s.nav}>
        <div className={s.tabs}>
          {['stats', 'edit', 'print', 'qr'].map(t => (
            <button key={t} className={`${s.tab} ${tab === t ? s.tabOn : ''}`}
              onClick={() => { if (t === 'print') { onPrint(); } else setTab(t); }}>
              {t === 'stats' ? '📊 Статистика' : t === 'edit' ? '✏️ Меню' : t === 'print' ? '🖨 Друк' : 'QR'}
            </button>
          ))}
        </div>
        <button className={s.logoutBtn} onClick={logout}>Вийти</button>
      </nav>

      {/* STATS */}
      {tab === 'stats' && (
        <div className={s.tabContent}>
          <h2>Статистика</h2>
          {!stats ? <p className={s.hint}>Завантаження...</p> : <>
            <div className={s.statsGrid}>
              {[
                [stats.total || 0, 'Всього переглядів'],
                [stats.days?.[new Date().toISOString().slice(0, 10)] || 0, 'Сьогодні'],
                [Object.entries(stats.days || {}).filter(([d]) => Date.now() - new Date(d) < 7 * 86400000).reduce((a, [, v]) => a + v, 0), 'За 7 днів'],
                [data?.sections?.reduce((a, sec) => a + sec.items.filter(i => i.visible).length, 0) || 0, 'Активних позицій'],
              ].map(([n, l]) => (
                <div key={l} className={s.statCard}><div className={s.statN}>{n}</div><div className={s.statL}>{l}</div></div>
              ))}
            </div>
            <div className={s.chart}>
              <h3>Перегляди по днях</h3>
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i));
                const k = d.toISOString().slice(0, 10), v = stats.days?.[k] || 0;
                const mx = Math.max(1, ...Object.values(stats.days || {}));
                return <div key={k} className={s.barRow}>
                  <span className={s.barL}>{k.slice(5)}</span>
                  <div className={s.barW}><div className={s.barF} style={{ width: `${Math.round(v / mx * 100)}%` }} /></div>
                  <span className={s.barV}>{v}</span>
                </div>;
              })}
            </div>
          </>}
        </div>
      )}

      {/* EDITOR */}
      {tab === 'edit' && data && (
        <div className={s.tabContent}>
          <h2>Редагування меню</h2>
          <p className={s.hint}>Тягни ⠿ для зміни порядку · 💾 Зберегти щоб всі побачили зміни</p>
          {data.sections.map((sec, si) => (
            <SecEditor key={sec.id || si} sec={sec} si={si}
              isOpen={!!openSecs[sec.id || si]}
              onToggle={() => setOpenSecs(p => ({ ...p, [sec.id || si]: !p[sec.id || si] }))}
              dragProps={secDrag(si)} isDragOver={secOver === si}
              onSec={(f, v) => mut(d => { d.sections[si][f] = v; })}
              onItem={(ii, f, v) => mut(d => { d.sections[si].items[ii][f] = v; })}
              onDel={(ii) => mut(d => { d.sections[si].items.splice(ii, 1); })}
              onAdd={() => mut(d => { d.sections[si].items.push({ id: Date.now(), name: 'Нова позиція', nameEn: '', price: '0 ₴', photo: '', description: '', descriptionEn: '', badges: [], visible: true }); })}
              onDelSec={() => { if (window.confirm('Видалити секцію?')) mut(d => { d.sections.splice(si, 1); }); }}
              onReorderItems={(next) => mut(d => { d.sections[si].items = next; })}
            />
          ))}
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button className={s.addSecBtn} onClick={() => mut(d => { d.sections.push({ id: 's' + Date.now(), icon: '🆕', title: 'Нова секція', titleEn: '', visible: true, items: [] }); })}>
              + Додати секцію
            </button>
          </div>
        </div>
      )}

      {/* QR */}
      {tab === 'qr' && (
        <div className={`${s.tabContent} ${s.qrTab}`}>
          <h2>QR-код меню</h2>
          <p className={s.hint}>Роздрукуй і постав на столик</p>
          <div className={s.qrBox}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(window.location.origin)}&color=1C1A17&bgcolor=F9F5EF`} alt="QR" width={220} height={220} />
            <div className={s.qrBrand}>Perk<span>UP</span></div>
            <div className={s.qrSub}>Крона Парк 2</div>
          </div>
          <a className={s.qrDl} href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(window.location.origin)}&color=1C1A17&bgcolor=F9F5EF`} download="perkup-qr.png" target="_blank" rel="noreferrer">↓ Завантажити PNG</a>
          <div className={s.qrUrl}>{window.location.origin}</div>
        </div>
      )}

      <div className={s.saveBar}>
        <span className={s.saveStatus}>{status}</span>
        <button className={s.saveBtn} onClick={save}>💾 Зберегти</button>
      </div>
    </div>
  );
}

// ── Section editor ─────────────────────────────────────────────────────────────
function SecEditor({ sec, si, isOpen, onToggle, dragProps, isDragOver, onSec, onItem, onDel, onAdd, onDelSec, onReorderItems }) {
  const { getProps: itemDrag, over: itemOver } = useDrag(sec.items, onReorderItems);
  return (
    <div className={`${s.secBox} ${isDragOver ? s.dragOver : ''}`} {...dragProps}>
      <div className={s.secHdr}>
        <span className={s.dh}>⠿</span>
        <span className={s.secTitle} onClick={onToggle}>{sec.icon} {sec.title} ({sec.items.length})</span>
        <button className={`${s.visBtn} ${sec.visible ? s.visBtnOn : s.visBtnOff}`} onClick={() => onSec('visible', !sec.visible)}>
          {sec.visible ? 'Видимо' : 'Приховано'}
        </button>
        <span className={s.secChev} onClick={onToggle}>{isOpen ? '▴' : '▾'}</span>
        <button className={s.delSec} onClick={onDelSec}>✕</button>
      </div>
      {isOpen && (
        <div className={s.secBody}>
          <div className={s.secMeta}>
            <div className={s.fg}><label>Назва UA</label><input value={sec.title} onChange={e => onSec('title', e.target.value)} /></div>
            <div className={s.fg}><label>Назва EN</label><input value={sec.titleEn || ''} onChange={e => onSec('titleEn', e.target.value)} /></div>
            <div className={s.fg} style={{ flex: '0 0 62px' }}><label>Іконка</label><input value={sec.icon} onChange={e => onSec('icon', e.target.value)} /></div>
          </div>
          {sec.items.map((item, ii) => (
            <ItemEditor key={item.id || ii} item={item}
              dragProps={itemDrag(ii)} isDragOver={itemOver === ii}
              onUpd={(f, v) => onItem(ii, f, v)}
              onDel={() => onDel(ii)}
            />
          ))}
          <button className={s.addItem} onClick={onAdd}>+ Додати позицію</button>
        </div>
      )}
    </div>
  );
}

// ── Item editor ────────────────────────────────────────────────────────────────
function ItemEditor({ item, dragProps, isDragOver, onUpd, onDel }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setUploadErr('');
    try { onUpd('photo', await uploadPhoto(file)); }
    catch (err) { setUploadErr(err.message); }
    finally { setUploading(false); }
  };

  const toggleBadge = (id) => {
    const current = item.badges || [];
    const next = current.includes(id) ? current.filter(b => b !== id) : [...current, id];
    onUpd('badges', next);
  };

  return (
    <div className={`${s.itemCard} ${isDragOver ? s.dragOver : ''}`} {...dragProps}>
      {/* Main row */}
      <div className={s.itemRow}>
        <span className={s.dh}>⠿</span>
        <div className={s.photoCell}>
          {item.photo
            ? <img src={item.photo} alt="" className={s.thumb} onClick={() => fileRef.current?.click()} />
            : <div className={s.photoPlaceholder} onClick={() => fileRef.current?.click()}>{uploading ? '⏳' : '📷'}</div>}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          {item.photo && <button className={s.photoRm} onClick={() => onUpd('photo', '')}>✕</button>}
        </div>
        <div className={s.itemNames}>
          <input value={item.name} placeholder="Назва UA" onChange={e => onUpd('name', e.target.value)} />
          <input value={item.nameEn || ''} placeholder="Name EN" onChange={e => onUpd('nameEn', e.target.value)} />
        </div>
        <input className={s.itemPrice} value={item.price} placeholder="₴" onChange={e => onUpd('price', e.target.value)} />
        <div className={s.itemActs}>
          <button className={`${s.visToggle} ${item.visible ? s.vOn : s.vOff}`} onClick={() => onUpd('visible', !item.visible)}>
            {item.visible ? '✓' : '✗'}
          </button>
          <button className={`${s.expandBtn} ${expanded ? s.expandBtnOn : ''}`} onClick={() => setExpanded(p => !p)} title="Редагувати">✎</button>
          <button className={s.delBtn} onClick={onDel}>✕</button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className={s.itemExpand}>
          {/* Badges */}
          <div className={s.badgeSection}>
            <div className={s.badgeLabel}>Мітки:</div>
            <div className={s.badgePicker}>
              {BADGES.map(b => {
                const active = (item.badges || []).includes(b.id);
                return (
                  <button
                    key={b.id}
                    className={`${s.badgeChip} ${active ? s.badgeChipOn : ''}`}
                    style={active ? { background: b.bg, color: b.color, borderColor: b.color } : {}}
                    onClick={() => toggleBadge(b.id)}
                  >
                    {b.emoji} {b.labelUk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className={s.descRow}>
            <div className={s.fg}>
              <label>Опис UA</label>
              <textarea rows={2} value={item.description || ''} placeholder="Склад, особливості..." onChange={e => onUpd('description', e.target.value)} />
            </div>
            <div className={s.fg}>
              <label>Description EN</label>
              <textarea rows={2} value={item.descriptionEn || ''} placeholder="Ingredients..." onChange={e => onUpd('descriptionEn', e.target.value)} />
            </div>
          </div>

          {/* Photo upload */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className={s.uploadBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? '⏳ Завантаження...' : '📷 ' + (item.photo ? 'Змінити фото' : 'Завантажити фото')}
            </button>
            {uploadErr && <span style={{ fontSize: 11, color: '#C44' }}>{uploadErr}</span>}
            {item.photo && !uploadErr && <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ Фото є</span>}
          </div>
        </div>
      )}
    </div>
  );
}
