import React, { useState, useEffect, useRef } from 'react';
import styles from './Menu.module.css';

const SOCIALS = {
  google: 'https://g.page/r/CRM3hZbwbH8FEAE/review',
  telegram: 'https://t.me/perkup_news',
  instagram: 'https://www.instagram.com/perk_up_bro/',
  wifi: 'PerkUP_guest',
};

export default function Menu({ menuData, loading, onAdminClick }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const searchRef = useRef();

  const sections = menuData?.sections?.filter(s => s.visible) || [];

  // Auto-open first 3 sections
  useEffect(() => {
    if (sections.length) {
      const init = {};
      sections.forEach((s, i) => { if (i < 3) init[s.id] = true; });
      setOpenSections(init);
    }
  }, [menuData]);

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSections = sections
    .filter(s => activeFilter === 'all' || s.id === activeFilter)
    .map(s => ({
      ...s,
      items: s.items.filter(item => {
        if (!item.visible) return false;
        if (!search) return true;
        return item.name.toLowerCase().includes(search.toLowerCase());
      }),
    }))
    .filter(s => s.items.length > 0);

  return (
    <div className={styles.page}>
      {/* TOP BAR */}
      <header className={styles.topbar}>
        <div className={styles.logo}>
          Perk<span>UP</span>
          <small>Крона Парк 2 · Бровари</small>
        </div>
      </header>

      {/* SEARCH */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          ref={searchRef}
          className={styles.searchInput}
          type="text"
          placeholder="Пошук по меню..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* FILTERS */}
      <div className={styles.filterScroll}>
        <button
          className={`${styles.chip} ${activeFilter === 'all' ? styles.chipActive : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          ✨ Все
        </button>
        {sections.map(s => (
          <button
            key={s.id}
            className={`${styles.chip} ${activeFilter === s.id ? styles.chipActive : ''}`}
            onClick={() => setActiveFilter(s.id)}
          >
            {s.icon} {s.title}
          </button>
        ))}
      </div>

      {/* MENU BODY */}
      <div className={styles.body}>
        {loading && (
          <div className={styles.loader}>
            <div className={styles.loaderIcon}>☕</div>
            <p>Завантаження меню...</p>
          </div>
        )}

        {!loading && filteredSections.length === 0 && (
          <div className={styles.empty}>
            <div>🔍</div>
            <p>Нічого не знайдено</p>
          </div>
        )}

        {filteredSections.map(sec => (
          <div key={sec.id} className={styles.section}>
            <button
              className={`${styles.sectionHeader} ${openSections[sec.id] ? styles.sectionOpen : ''}`}
              onClick={() => toggleSection(sec.id)}
            >
              <div className={styles.sectionLeft}>
                <span className={styles.sectionIcon}>{sec.icon}</span>
                <div>
                  <div className={styles.sectionTitle}>{sec.title}</div>
                  <div className={styles.sectionCount}>{sec.items.length} позицій</div>
                </div>
              </div>
              <span className={styles.chevron}>{openSections[sec.id] ? '▲' : '▼'}</span>
            </button>

            {openSections[sec.id] && (
              <div className={styles.sectionItems}>
                {sec.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={styles.card}
                    style={{ animationDelay: `${idx * 35}ms` }}
                    onClick={() => setModal({ item, sec })}
                  >
                    <div className={styles.cardImg}>
                      {item.photo
                        ? <img src={item.photo} alt={item.name} loading="lazy" onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = sec.icon; }} />
                        : <span>{sec.icon}</span>
                      }
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTop}>
                        <span className={styles.cardName}>{item.name}</span>
                        <span className={styles.cardPrice}>{item.price}</span>
                      </div>
                      {item.description && <div className={styles.cardDesc}>{item.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInfo}>
          <div className={styles.wifiRow}>
            <span>📶</span>
            <span>Wi-Fi: <strong>{SOCIALS.wifi}</strong> · Вільний доступ</span>
          </div>
          <div className={styles.socialRow}>
            <a href={SOCIALS.instagram} target="_blank" rel="noreferrer" className={styles.socialBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Instagram
            </a>
            <a href={SOCIALS.telegram} target="_blank" rel="noreferrer" className={styles.socialBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </a>
            <a href={SOCIALS.google} target="_blank" rel="noreferrer" className={`${styles.socialBtn} ${styles.reviewBtn}`}>
              ⭐ Залишити відгук
            </a>
          </div>
        </div>
        <button className={styles.adminTrigger} onClick={onAdminClick}>· · ·</button>
      </footer>

      {/* MODAL */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setModal(null)}>✕</button>
            {modal.item.photo
              ? <img className={styles.modalImg} src={modal.item.photo} alt={modal.item.name} onError={e => e.target.style.display = 'none'} />
              : <div className={styles.modalImgPlaceholder}>{modal.sec.icon}</div>
            }
            <div className={styles.modalName}>{modal.item.name}</div>
            <div className={styles.modalPrice}>{modal.item.price}</div>
            {modal.item.description && <div className={styles.modalDesc}>{modal.item.description}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
