import React, { useState, useEffect } from 'react';
import s from './Menu.module.css';

const LINKS = {
  google: 'https://g.page/r/CRM3hZbwbH8FEAE/review',
  telegram: 'https://t.me/perkup_news',
  instagram: 'https://www.instagram.com/perk_up_bro/',
  wifi: 'PerkUP_guest',
};

const T = {
  uk: { search: 'Пошук по меню...', all: 'Все', items: 'позицій', nothing: 'Нічого не знайдено', loading: 'Завантаження меню...', wifi: 'Вільний доступ', review: 'Залишити відгук' },
  en: { search: 'Search menu...', all: 'All', items: 'items', nothing: 'Nothing found', loading: 'Loading...', wifi: 'Free access', review: 'Leave a review' },
};

export default function Menu({ menuData, loading, onAdminClick }) {
  const [lang, setLang] = useState('uk');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [open, setOpen] = useState({});
  const t = T[lang];
  const sections = menuData?.sections?.filter(s => s.visible) || [];

  useEffect(() => {
    if (sections.length) {
      const init = {};
      sections.forEach((s, i) => { if (i < 3) init[s.id] = true; });
      setOpen(init);
    }
  }, [menuData]); // eslint-disable-line

  const name = item => (lang === 'en' && item.nameEn) ? item.nameEn : item.name;
  const title = sec => (lang === 'en' && sec.titleEn) ? sec.titleEn : sec.title;
  const desc = item => (lang === 'en' && item.descriptionEn) ? item.descriptionEn : (item.description || '');

  const shown = sections
    .filter(sec => filter === 'all' || sec.id === filter)
    .map(sec => ({ ...sec, items: sec.items.filter(i => i.visible && (!search || name(i).toLowerCase().includes(search.toLowerCase()))) }))
    .filter(sec => sec.items.length > 0);

  return (
    <div className={s.page}>
      <header className={s.bar}>
        <div className={s.logo}>Perk<span>UP</span><small>Крона Парк 2 · Бровари</small></div>
        <div className={s.lang}>
          <button className={`${s.lb} ${lang === 'uk' ? s.la : ''}`} onClick={() => setLang('uk')}>UA</button>
          <button className={`${s.lb} ${lang === 'en' ? s.la : ''}`} onClick={() => setLang('en')}>EN</button>
        </div>
      </header>

      <div className={s.searchBox}>
        <span className={s.si}>🔍</span>
        <input className={s.si2} placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className={s.sc} onClick={() => setSearch('')}>✕</button>}
      </div>

      <div className={s.filters}>
        <button className={`${s.chip} ${filter === 'all' ? s.chipOn : ''}`} onClick={() => setFilter('all')}>✨ {t.all}</button>
        {sections.map(sec => (
          <button key={sec.id} className={`${s.chip} ${filter === sec.id ? s.chipOn : ''}`} onClick={() => setFilter(sec.id)}>
            {sec.icon} {title(sec)}
          </button>
        ))}
      </div>

      <div className={s.body}>
        {loading && <div className={s.center}><div className={s.spin}>☕</div><p>{t.loading}</p></div>}
        {!loading && shown.length === 0 && <div className={s.center}><div>🔍</div><p>{t.nothing}</p></div>}
        {shown.map(sec => (
          <div key={sec.id} className={s.sec}>
            <button className={`${s.secBtn} ${open[sec.id] ? s.secOpen : ''}`} onClick={() => setOpen(p => ({ ...p, [sec.id]: !p[sec.id] }))}>
              <div className={s.secL}>
                <span className={s.secIco}>{sec.icon}</span>
                <div><div className={s.secName}>{title(sec)}</div><div className={s.secCnt}>{sec.items.filter(i => i.visible).length} {t.items}</div></div>
              </div>
              <span className={s.chev}>{open[sec.id] ? '▲' : '▼'}</span>
            </button>
            {open[sec.id] && (
              <div className={s.items}>
                {sec.items.map((item, idx) => (
                  <div key={item.id} className={s.card} style={{ animationDelay: `${idx * 30}ms` }} onClick={() => setModal({ item, sec })}>
                    <div className={s.cardImg}>
                      {item.photo
                        ? <img src={item.photo} alt={name(item)} loading="lazy" onError={e => { e.target.style.display = 'none'; e.target.parentNode.textContent = sec.icon; }} />
                        : <span>{sec.icon}</span>}
                    </div>
                    <div className={s.cardBody}>
                      <div className={s.cardRow}>
                        <span className={s.cardName}>{name(item)}</span>
                        <span className={s.cardPrice}>{item.price}</span>
                      </div>
                      {desc(item) && <div className={s.cardDesc}>{desc(item)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <footer className={s.footer}>
        <div>
          <div className={s.wifi}>📶 Wi-Fi: <strong>{LINKS.wifi}</strong> · {t.wifi}</div>
          <div className={s.socials}>
            <a href={LINKS.instagram} target="_blank" rel="noreferrer" className={s.soc}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Instagram
            </a>
            <a href={LINKS.telegram} target="_blank" rel="noreferrer" className={s.soc}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </a>
            <a href={LINKS.google} target="_blank" rel="noreferrer" className={`${s.soc} ${s.review}`}>⭐ {t.review}</a>
          </div>
        </div>
        <button className={s.adminBtn} onClick={onAdminClick}>· · ·</button>
      </footer>

      {modal && (
        <div className={s.overlay} onClick={() => setModal(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <button className={s.mClose} onClick={() => setModal(null)}>✕</button>
            {modal.item.photo
              ? <img className={s.mImg} src={modal.item.photo} alt={name(modal.item)} onError={e => e.target.style.display = 'none'} />
              : <div className={s.mPlaceholder}>{modal.sec.icon}</div>}
            <div className={s.mName}>{name(modal.item)}</div>
            <div className={s.mPrice}>{modal.item.price}</div>
            {desc(modal.item) && <div className={s.mDesc}>{desc(modal.item)}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
