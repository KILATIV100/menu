import React, { useState, useEffect, useRef } from 'react';
import { saveMenu, fetchStats } from './api';
import styles from './Admin.module.css';

function hashStr(s) {
  let h = 0x12345678;
  for (let i = 0; i < s.length; i++) { h = Math.imul(31, h) + s.charCodeAt(i) | 0; h ^= (h >>> 16); }
  return (h >>> 0).toString(36);
}
const ADMIN_HASH = hashStr('57ba1z72');

// ─── Drag & Drop hook ─────────────────────────────────────────────────────────
function useDragList(list, onReorder) {
  const dragIdx = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragEnter = (i) => { if (i !== dragIdx.current) setDragOver(i); };
  const onDragEnd = () => { setDragOver(null); dragIdx.current = null; };
  const onDrop = (i) => {
    if (dragIdx.current === null || dragIdx.current === i) { setDragOver(null); return; }
    const next = [...list];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    onReorder(next);
    setDragOver(null);
    dragIdx.current = null;
  };

  const dragProps = (i) => ({
    draggable: true,
    onDragStart: () => onDragStart(i),
    onDragEnter: () => onDragEnter(i),
    onDragOver: e => e.preventDefault(),
    onDragEnd,
    onDrop: () => onDrop(i),
  });

  return { dragProps, dragOver };
}

export default function Admin({ menuData, setMenuData, onClose }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('pu_adm') === '1');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [activeTab, setActiveTab] = useState('stats');
  const [saveStatus, setSaveStatus] = useState('Всі зміни збережено');
  const [stats, setStats] = useState(null);
  const [localData, setLocalData] = useState(null);
  const [openSecs, setOpenSecs] = useState({});

  useEffect(() => {
    if (authed && menuData) setLocalData(JSON.parse(JSON.stringify(menuData)));
  }, [authed, menuData]);

  useEffect(() => {
    if (authed && activeTab === 'stats') loadStats();
  }, [authed, activeTab]); // eslint-disable-line

  const loadStats = async () => {
    try { const s = await fetchStats('57ba1z72'); setStats(s); } catch {}
  };

  const doLogin = () => {
    const now = Date.now();
    if (now < lockUntil) return;
    if (hashStr(password) === ADMIN_HASH) {
      sessionStorage.setItem('pu_adm', '1');
      setAuthed(true); setLoginErr('');
    } else {
      const a = loginAttempts + 1;
      setLoginAttempts(a); setPassword('');
      if (a >= 5) { setLockUntil(Date.now() + 30000); setLoginAttempts(0); setLoginErr('Заблоковано на 30 секунд'); }
      else setLoginErr(`Невірний пароль · Залишилось: ${5 - a}`);
    }
  };

  const doLogout = () => { sessionStorage.removeItem('pu_adm'); setAuthed(false); onClose(); };

  const markUnsaved = () => setSaveStatus('⚠ Є незбережені зміни');

  const doSave = async () => {
    setSaveStatus('⏳ Збереження...');
    try {
      await saveMenu(localData, '57ba1z72');
      setMenuData(localData);
      setSaveStatus('✓ Збережено для всіх');
      setTimeout(() => setSaveStatus('Всі зміни збережено'), 2500);
    } catch (e) { setSaveStatus('❌ Помилка: ' + e.message); }
  };

  // ─── Data mutators ───────────────────────────────────────────────────────────
  const mutate = (fn) => {
    setLocalData(prev => { const d = JSON.parse(JSON.stringify(prev)); fn(d); return d; });
    markUnsaved();
  };

  const reorderSections = (next) => mutate(d => { d.sections = next; });
  const reorderItems = (si, next) => mutate(d => { d.sections[si].items = next; });
  const updSec = (si, field, val) => mutate(d => { d.sections[si][field] = val; });
  const updItem = (si, ii, field, val) => mutate(d => { d.sections[si].items[ii][field] = val; });
  const delItem = (si, ii) => mutate(d => { d.sections[si].items.splice(ii, 1); });
  const addItem = (si) => mutate(d => { d.sections[si].items.push({ id: Date.now(), name: 'Нова позиція', nameEn: '', price: '0 ₴', photo: '', description: '', visible: true }); });
  const delSec = (si) => { if (!window.confirm('Видалити секцію?')) return; mutate(d => { d.sections.splice(si, 1); }); };
  const addSection = () => mutate(d => { d.sections.push({ id: 's' + Date.now(), icon: '🆕', title: 'Нова секція', titleEn: '', visible: true, items: [] }); });

  const toggleSec = id => setOpenSecs(p => ({ ...p, [id]: !p[id] }));

  // ─── Drag for sections ───────────────────────────────────────────────────────
  const { dragProps: secDragProps, dragOver: secDragOver } = useDragList(
    localData?.sections || [],
    reorderSections
  );

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginBox}>
          <div className={styles.loginLogo}>Perk<span>UP</span></div>
          <div className={styles.loginSub}>Адмін · Крона Парк 2</div>
          <label className={styles.loginLabel}>Пароль</label>
          <input type="password" className={styles.loginInput} placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doLogin()} autoFocus />
          {loginErr && <div className={styles.loginErr}>{loginErr}</div>}
          <button className={styles.loginBtn} onClick={doLogin}>Увійти</button>
          <button className={styles.backBtn} onClick={onClose}>← Повернутись до меню</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminPage}>
      <nav className={styles.nav}>
        <div className={styles.navTabs}>
          {['stats', 'edit', 'qr'].map(tab => (
            <button key={tab} className={`${styles.navTab} ${activeTab === tab ? styles.navTabActive : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'stats' ? '📊 Статистика' : tab === 'edit' ? '✏️ Меню' : 'QR-код'}
            </button>
          ))}
        </div>
        <button className={styles.logoutBtn} onClick={doLogout}>Вийти</button>
      </nav>

      {/* STATS */}
      {activeTab === 'stats' && (
        <div className={styles.tab}>
          <h2>Статистика</h2>
          {!stats ? <p className={styles.hint}>Завантаження...</p> : (
            <>
              <div className={styles.statsGrid}>
                {[
                  { num: stats.total || 0, label: 'Всього переглядів' },
                  { num: stats.days?.[new Date().toISOString().slice(0, 10)] || 0, label: 'Сьогодні' },
                  { num: Object.entries(stats.days || {}).filter(([d]) => Date.now() - new Date(d) < 7 * 86400000).reduce((s, [, v]) => s + v, 0), label: 'За 7 днів' },
                  { num: localData?.sections?.reduce((s, sec) => s + sec.items.filter(i => i.visible).length, 0) || 0, label: 'Активних позицій' },
                ].map(({ num, label }) => (
                  <div key={label} className={styles.statCard}>
                    <div className={styles.statNum}>{num}</div>
                    <div className={styles.statLabel}>{label}</div>
                  </div>
                ))}
              </div>
              <div className={styles.chart}>
                <h3>Перегляди по днях</h3>
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (6 - i));
                  const key = d.toISOString().slice(0, 10);
                  const val = stats.days?.[key] || 0;
                  const max = Math.max(1, ...Object.values(stats.days || {}));
                  return (
                    <div key={key} className={styles.barRow}>
                      <span className={styles.barLabel}>{key.slice(5)}</span>
                      <div className={styles.barWrap}><div className={styles.barFill} style={{ width: `${Math.round(val / max * 100)}%` }} /></div>
                      <span className={styles.barVal}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* EDITOR */}
      {activeTab === 'edit' && localData && (
        <div className={styles.tab}>
          <h2>Редагування меню</h2>
          <p className={styles.hint}>Тягни ⠿ щоб змінити порядок · Натисни 💾 щоб всі побачили зміни</p>

          {localData.sections.map((sec, si) => {
            const { dragProps: itemDragProps, dragOver: itemDragOver } = { // inline per section
              dragProps: () => ({}), dragOver: null
            };
            return (
              <SectionEditor
                key={sec.id || si}
                sec={sec}
                si={si}
                isOpen={!!openSecs[sec.id || si]}
                onToggle={() => toggleSec(sec.id || si)}
                dragProps={secDragProps(si)}
                isDragOver={secDragOver === si}
                onUpdSec={updSec}
                onUpdItem={updItem}
                onDelItem={delItem}
                onAddItem={addItem}
                onDelSec={delSec}
                onReorderItems={(next) => reorderItems(si, next)}
              />
            );
          })}

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className={styles.addSecBtn} onClick={addSection}>+ Додати секцію</button>
          </div>
        </div>
      )}

      {/* QR */}
      {activeTab === 'qr' && (
        <div className={`${styles.tab} ${styles.qrTab}`}>
          <h2>QR-код меню</h2>
          <p className={styles.hint}>Роздрукуй і постав на столик</p>
          <div className={styles.qrBox}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(window.location.origin)}&color=1C1A17&bgcolor=F9F5EF`} alt="QR" width={220} height={220} />
            <div className={styles.qrBrand}>Perk<span>UP</span></div>
            <div className={styles.qrSub}>Крона Парк 2</div>
          </div>
          <a className={styles.qrDownload} href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(window.location.origin)}&color=1C1A17&bgcolor=F9F5EF`} download="perkup-qr.png" target="_blank" rel="noreferrer">↓ Завантажити PNG</a>
          <div className={styles.qrUrl}>{window.location.origin}</div>
        </div>
      )}

      <div className={styles.saveBar}>
        <span className={styles.saveStatus}>{saveStatus}</span>
        <button className={styles.saveBtn} onClick={doSave}>💾 Зберегти</button>
      </div>
    </div>
  );
}

// ─── Section editor component with its own drag for items ─────────────────────
function SectionEditor({ sec, si, isOpen, onToggle, dragProps, isDragOver, onUpdSec, onUpdItem, onDelItem, onAddItem, onDelSec, onReorderItems }) {
  const { dragProps: itemDragProps, dragOver: itemDragOver } = useDragList(sec.items, onReorderItems);

  return (
    <div
      className={`${styles.secEditor} ${isDragOver ? styles.dragOverSec : ''}`}
      {...dragProps}
    >
      <div className={styles.secHdr}>
        <span className={styles.secDragHandle} title="Перетягнути секцію">⠿</span>
        <span className={styles.secTitle} onClick={onToggle} style={{ cursor: 'pointer', flex: 1 }}>
          {sec.icon} {sec.title} ({sec.items.length})
        </span>
        <div className={styles.secActions}>
          <button className={`${styles.visBtn} ${sec.visible ? styles.visBtnOn : styles.visBtnOff}`} onClick={() => onUpdSec(si, 'visible', !sec.visible)}>
            {sec.visible ? 'Видимо' : 'Приховано'}
          </button>
          <span className={styles.secChevron} onClick={onToggle}>{isOpen ? '▴' : '▾'}</span>
          <button className={styles.delSecBtn} onClick={() => onDelSec(si)}>✕</button>
        </div>
      </div>

      {isOpen && (
        <div className={styles.secBody}>
          <div className={styles.secMeta}>
            <div className={styles.fieldGroup}><label>Назва UA</label><input value={sec.title} onChange={e => onUpdSec(si, 'title', e.target.value)} /></div>
            <div className={styles.fieldGroup}><label>Назва EN</label><input value={sec.titleEn || ''} onChange={e => onUpdSec(si, 'titleEn', e.target.value)} /></div>
            <div className={styles.fieldGroup} style={{ flex: '0 0 60px' }}><label>Іконка</label><input value={sec.icon} onChange={e => onUpdSec(si, 'icon', e.target.value)} /></div>
          </div>

          <div className={styles.itemsHeader}>
            <span></span><span>Назва UA / EN</span><span>Ціна</span><span>Фото URL</span><span>Вид</span><span></span>
          </div>

          {sec.items.map((item, ii) => (
            <div
              key={item.id || ii}
              className={`${styles.itemRow} ${itemDragOver === ii ? styles.dragOverItem : ''}`}
              {...itemDragProps(ii)}
            >
              <span className={styles.itemDragHandle} title="Перетягнути позицію">⠿</span>
              <div>
                <input value={item.name} placeholder="Назва UA" onChange={e => onUpdItem(si, ii, 'name', e.target.value)} style={{ marginBottom: 3 }} />
                <input value={item.nameEn || ''} placeholder="Name EN" onChange={e => onUpdItem(si, ii, 'nameEn', e.target.value)} />
              </div>
              <input value={item.price} placeholder="₴" onChange={e => onUpdItem(si, ii, 'price', e.target.value)} style={{ width: 75 }} />
              <input value={item.photo || ''} placeholder="https://..." onChange={e => onUpdItem(si, ii, 'photo', e.target.value)} />
              <button className={`${styles.visToggle} ${item.visible ? styles.visOn : styles.visOff}`} onClick={() => onUpdItem(si, ii, 'visible', !item.visible)}>
                {item.visible ? '✓' : '✗'}
              </button>
              <button className={styles.delBtn} onClick={() => onDelItem(si, ii)}>✕</button>
            </div>
          ))}

          <button className={styles.addItemBtn} onClick={() => onAddItem(si)}>+ Додати позицію</button>
        </div>
      )}
    </div>
  );
}
