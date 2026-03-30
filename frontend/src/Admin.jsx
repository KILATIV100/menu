import React, { useState, useEffect, useRef } from 'react';
import { saveMenu, fetchStats } from './api';
import styles from './Admin.module.css';

function hashStr(s) {
  let h = 0x12345678;
  for (let i = 0; i < s.length; i++) { h = Math.imul(31, h) + s.charCodeAt(i) | 0; h ^= (h >>> 16); }
  return (h >>> 0).toString(36);
}
const ADMIN_HASH = hashStr('57ba1z72');

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
  const passRef = useRef();

  useEffect(() => {
    if (authed && menuData) setLocalData(JSON.parse(JSON.stringify(menuData)));
  }, [authed, menuData]);

  useEffect(() => {
    if (authed && activeTab === 'stats') loadStats();
  }, [authed, activeTab]);

  const loadStats = async () => {
    try { const s = await fetchStats('57ba1z72'); setStats(s); } catch {}
  };

  const doLogin = () => {
    const now = Date.now();
    if (now < lockUntil) return;
    if (hashStr(password) === ADMIN_HASH) {
      sessionStorage.setItem('pu_adm', '1');
      setAuthed(true);
      setLoginErr('');
    } else {
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);
      setPassword('');
      if (attempts >= 5) {
        setLockUntil(Date.now() + 30000);
        setLoginAttempts(0);
        setLoginErr('Заблоковано на 30 секунд');
      } else {
        setLoginErr(`Невірний пароль · Залишилось: ${5 - attempts}`);
      }
    }
  };

  const doLogout = () => {
    sessionStorage.removeItem('pu_adm');
    setAuthed(false);
    onClose();
  };

  const markUnsaved = () => setSaveStatus('⚠ Є незбережені зміни');

  const doSave = async () => {
    setSaveStatus('⏳ Збереження...');
    try {
      await saveMenu(localData, '57ba1z72');
      setMenuData(localData);
      setSaveStatus('✓ Збережено для всіх');
      setTimeout(() => setSaveStatus('Всі зміни збережено'), 2500);
    } catch (e) {
      setSaveStatus('❌ Помилка: ' + e.message);
    }
  };

  const updateSection = (si, field, val) => {
    const d = JSON.parse(JSON.stringify(localData));
    d.sections[si][field] = val;
    setLocalData(d); markUnsaved();
  };

  const updateItem = (si, ii, field, val) => {
    const d = JSON.parse(JSON.stringify(localData));
    d.sections[si].items[ii][field] = val;
    setLocalData(d); markUnsaved();
  };

  const deleteItem = (si, ii) => {
    const d = JSON.parse(JSON.stringify(localData));
    d.sections[si].items.splice(ii, 1);
    setLocalData(d); markUnsaved();
  };

  const addItem = (si) => {
    const d = JSON.parse(JSON.stringify(localData));
    d.sections[si].items.push({ id: Date.now(), name: 'Нова позиція', price: '0 ₴', photo: '', description: '', visible: true });
    setLocalData(d); markUnsaved();
  };

  const deleteSection = (si) => {
    if (!window.confirm('Видалити секцію?')) return;
    const d = JSON.parse(JSON.stringify(localData));
    d.sections.splice(si, 1);
    setLocalData(d); markUnsaved();
  };

  const addSection = () => {
    const d = JSON.parse(JSON.stringify(localData));
    d.sections.push({ id: 's' + Date.now(), icon: '🆕', title: 'Нова секція', visible: true, items: [] });
    setLocalData(d); markUnsaved();
  };

  const toggleSecVis = (si) => updateSection(si, 'visible', !localData.sections[si].visible);
  const toggleItemVis = (si, ii) => updateItem(si, ii, 'visible', !localData.sections[si].items[ii].visible);

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginBox}>
          <div className={styles.loginLogo}>Perk<span>UP</span></div>
          <div className={styles.loginSub}>Адмін · Крона Парк 2</div>
          <label className={styles.loginLabel}>Пароль</label>
          <input
            ref={passRef}
            type="password"
            className={styles.loginInput}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doLogin()}
            autoFocus
          />
          {loginErr && <div className={styles.loginErr}>{loginErr}</div>}
          <button className={styles.loginBtn} onClick={doLogin}>Увійти</button>
          <button className={styles.backBtn} onClick={onClose}>← Повернутись до меню</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminPage}>
      {/* TOP NAV */}
      <nav className={styles.nav}>
        <div className={styles.navTabs}>
          {['stats', 'edit', 'qr'].map(tab => (
            <button
              key={tab}
              className={`${styles.navTab} ${activeTab === tab ? styles.navTabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
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
                <div className={styles.statCard}>
                  <div className={styles.statNum}>{stats.total || 0}</div>
                  <div className={styles.statLabel}>Всього переглядів</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNum}>{stats.days?.[new Date().toISOString().slice(0,10)] || 0}</div>
                  <div className={styles.statLabel}>Сьогодні</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNum}>
                    {Object.entries(stats.days || {})
                      .filter(([d]) => Date.now() - new Date(d) < 7 * 86400000)
                      .reduce((s, [, v]) => s + v, 0)}
                  </div>
                  <div className={styles.statLabel}>За 7 днів</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNum}>
                    {localData?.sections?.reduce((s, sec) => s + sec.items.filter(i => i.visible).length, 0) || 0}
                  </div>
                  <div className={styles.statLabel}>Активних позицій</div>
                </div>
              </div>
              <div className={styles.chart}>
                <h3>Перегляди по днях</h3>
                {Array.from({length: 7}, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (6 - i));
                  const key = d.toISOString().slice(0, 10);
                  const val = stats.days?.[key] || 0;
                  const max = Math.max(1, ...Object.values(stats.days || {}));
                  return (
                    <div key={key} className={styles.barRow}>
                      <span className={styles.barLabel}>{key.slice(5)}</span>
                      <div className={styles.barWrap}>
                        <div className={styles.barFill} style={{ width: `${Math.round(val / max * 100)}%` }} />
                      </div>
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
          <p className={styles.hint}>Змінюй позиції — натисни 💾 Зберегти щоб всі побачили зміни</p>
          {localData.sections.map((sec, si) => (
            <div key={sec.id} className={styles.secEditor}>
              <div className={styles.secHdr}>
                <span className={styles.secTitle}>{sec.icon} {sec.title} ({sec.items.length})</span>
                <div className={styles.secActions}>
                  <button
                    className={`${styles.visBtn} ${sec.visible ? styles.visBtnOn : styles.visBtnOff}`}
                    onClick={() => toggleSecVis(si)}
                  >
                    {sec.visible ? 'Видимо' : 'Приховано'}
                  </button>
                  <button className={styles.delSecBtn} onClick={() => deleteSection(si)}>✕</button>
                </div>
              </div>
              <div className={styles.secMeta}>
                <div className={styles.fieldGroup}>
                  <label>Назва</label>
                  <input value={sec.title} onChange={e => updateSection(si, 'title', e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label>Іконка</label>
                  <input value={sec.icon} onChange={e => updateSection(si, 'icon', e.target.value)} style={{width: 60}} />
                </div>
              </div>
              <div className={styles.itemsHeader}>
                <span>Назва</span><span>Ціна</span><span>Фото URL</span><span>Опис</span><span>Вид</span><span></span>
              </div>
              {sec.items.map((item, ii) => (
                <div key={item.id} className={styles.itemRow}>
                  <input
                    value={item.name}
                    placeholder="Назва"
                    onChange={e => updateItem(si, ii, 'name', e.target.value)}
                  />
                  <input
                    value={item.price}
                    placeholder="₴"
                    style={{width: 80}}
                    onChange={e => updateItem(si, ii, 'price', e.target.value)}
                  />
                  <input
                    value={item.photo}
                    placeholder="https://..."
                    onChange={e => updateItem(si, ii, 'photo', e.target.value)}
                  />
                  <input
                    value={item.description}
                    placeholder="Опис"
                    onChange={e => updateItem(si, ii, 'description', e.target.value)}
                  />
                  <button
                    className={`${styles.visToggle} ${item.visible ? styles.visOn : styles.visOff}`}
                    onClick={() => toggleItemVis(si, ii)}
                  >
                    {item.visible ? '✓' : '✗'}
                  </button>
                  <button className={styles.delBtn} onClick={() => deleteItem(si, ii)}>✕</button>
                </div>
              ))}
              <button className={styles.addItemBtn} onClick={() => addItem(si)}>+ Додати позицію</button>
            </div>
          ))}
          <div style={{textAlign: 'center', marginTop: 16}}>
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
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(window.location.origin)}&color=1C1A17&bgcolor=F9F5EF`}
              alt="QR"
              width={220}
              height={220}
            />
            <div className={styles.qrBrand}>Perk<span>UP</span></div>
            <div className={styles.qrSub}>Крона Парк 2</div>
          </div>
          <a
            className={styles.qrDownload}
            href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(window.location.origin)}&color=1C1A17&bgcolor=F9F5EF`}
            download="perkup-qr.png"
            target="_blank"
            rel="noreferrer"
          >
            ↓ Завантажити PNG
          </a>
          <div className={styles.qrUrl}>{window.location.origin}</div>
        </div>
      )}

      {/* SAVE BAR */}
      <div className={styles.saveBar}>
        <span className={styles.saveStatus}>{saveStatus}</span>
        <button className={styles.saveBtn} onClick={doSave}>💾 Зберегти</button>
      </div>
    </div>
  );
}
