import React, { useState, useRef } from 'react';
import s from './Print.module.css';
import { getBadge } from './badges';

export default function Print({ menuData, onClose }) {
  const [cols, setCols] = useState(2);
  const [showPrices, setShowPrices] = useState(true);
  const [showDesc, setShowDesc] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [qrUrl, setQrUrl] = useState('https://perkupmenu.netlify.app');
  const printRef = useRef();

  const sections = (menuData?.sections || []).filter(s => s.visible);

  const doPrint = () => window.print();

  const doDownload = () => {
    const html = buildPrintHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.download = 'perkup-menu.html';
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  const buildPrintHTML = () => {
    const items = sections.map(sec => {
      const its = sec.items.filter(i => i.visible).map(item => {
        const photoHtml = showPhotos && item.photo
          ? `<img class="pi" src="${item.photo}" alt="${item.name}"/>`
          : '';
        const descHtml = showDesc && item.description
          ? `<div class="pd">${item.description}</div>`
          : '';
        return `<div class="pr">
          ${photoHtml}
          <div class="pt">
            <div class="pn">${item.name}</div>
            ${descHtml}
          </div>
          ${showPrices ? `<div class="pp">${item.price}</div>` : ''}
        </div>`;
      }).join('');
      return `<div class="ps">
        <div class="ph"><span>${sec.icon}</span> ${sec.title}</div>
        ${its}
      </div>`;
    }).join('');

    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrUrl)}&color=1C1A17&bgcolor=FFFFFF`;

    return `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8">
<title>PerkUP Меню</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Jost',sans-serif;color:#1C1A17;background:white;padding:12mm}
.header{text-align:center;padding-bottom:16px;margin-bottom:18px;border-bottom:2px solid #1C1A17}
.logo{font-family:'Playfair Display',serif;font-size:42px;letter-spacing:-0.02em;color:#1C1A17}
.logo span{color:#C4973A}
.sub{font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#8B7B6B;margin-top:4px}
.grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:20px 28px}
.ps{}
.ph{font-family:'Playfair Display',serif;font-size:15px;color:#6B4F3A;border-bottom:1px solid #E8DDD0;padding-bottom:5px;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.pr{display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px dotted rgba(0,0,0,0.08);font-size:12px}
.pr:last-child{border-bottom:none}
.pi{width:36px;height:36px;object-fit:cover;border-radius:4px;flex-shrink:0}
.pt{flex:1}
.pn{font-weight:500;color:#1C1A17}
.pd{font-size:10px;color:#8B7B6B;font-style:italic;margin-top:1px}
.pp{font-weight:700;color:#6B4F3A;white-space:nowrap;flex-shrink:0}
.footer{margin-top:18px;padding-top:12px;border-top:1px solid #E8DDD0;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#8B7B6B}
.qrz{display:flex;align-items:center;gap:8px}
.qrl{font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#8B7B6B;margin-bottom:2px}
@media print{body{padding:0}@page{margin:12mm}}
</style></head><body>
<div class="header"><div class="logo">Perk<span>UP</span></div><div class="sub">Крона Парк 2 · Бровари</div></div>
<div class="grid">${items}</div>
<div class="footer">
  <div><div>Wi-Fi: <strong>PerkUP_guest</strong></div><div style="margin-top:3px">instagram: @perk_up_bro</div></div>
  <div class="qrz"><div><div class="qrl">Онлайн меню</div><img src="${qrImg}" width="64" height="64" alt="QR"/></div></div>
</div>
</body></html>`;
  };

  return (
    <div className={s.page}>
      {/* Controls */}
      <div className={s.controls} id="no-print">
        <div className={s.ctrlTop}>
          <button className={s.back} onClick={onClose}>← Назад</button>
          <div className={s.ctrlTitle}>🖨 Версія для друку</div>
          <div className={s.ctrlBtns}>
            <button className={s.btnPrint} onClick={doPrint}>🖨 Друкувати</button>
            <button className={s.btnDl} onClick={doDownload}>↓ HTML файл</button>
          </div>
        </div>
        <div className={s.ctrlRow}>
          <label>Колонки:</label>
          <select value={cols} onChange={e => setCols(+e.target.value)}>
            <option value={1}>1 колонка</option>
            <option value={2}>2 колонки</option>
            <option value={3}>3 колонки</option>
          </select>
          <label><input type="checkbox" checked={showPrices} onChange={e => setShowPrices(e.target.checked)} /> Ціни</label>
          <label><input type="checkbox" checked={showDesc} onChange={e => setShowDesc(e.target.checked)} /> Опис</label>
          <label><input type="checkbox" checked={showPhotos} onChange={e => setShowPhotos(e.target.checked)} /> Фото</label>
          <label>QR URL:</label>
          <input className={s.qrInput} value={qrUrl} onChange={e => setQrUrl(e.target.value)} placeholder="https://..." />
        </div>
      </div>

      {/* Preview */}
      <div className={s.preview} ref={printRef} id="print-area">
        <div className={s.pHeader}>
          <div className={s.pLogo}>Perk<span>UP</span></div>
          <div className={s.pSub}>Крона Парк 2 · Бровари</div>
        </div>

        <div className={s.pGrid} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {sections.map(sec => (
            <div key={sec.id} className={s.pSec}>
              <div className={s.pSecHead}><span>{sec.icon}</span>{sec.title}</div>
              {sec.items.filter(i => i.visible).map(item => (
                <div key={item.id} className={s.pItem}>
                  {showPhotos && item.photo && <img className={s.pThumb} src={item.photo} alt={item.name} />}
                  <div className={s.pItemBody}>
                    <div className={s.pName}>
                      {item.name}
                      {(item.badges || []).map(id => {
                        const b = getBadge(id);
                        return b ? <span key={id} className={s.pBadge} style={{ background: b.bg, color: b.color }}>{b.emoji} {b.labelUk}</span> : null;
                      })}
                    </div>
                    {showDesc && item.description && <div className={s.pDesc}>{item.description}</div>}
                  </div>
                  {showPrices && <div className={s.pPrice}>{item.price}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className={s.pFooter}>
          <div>
            <div>Wi-Fi: <strong>PerkUP_guest</strong></div>
            <div style={{ marginTop: 3 }}>instagram: @perk_up_bro</div>
          </div>
          <div className={s.pQr}>
            <div className={s.pQrLabel}>Онлайн меню</div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrUrl)}&color=1C1A17&bgcolor=FFFFFF`} width={64} height={64} alt="QR" />
          </div>
        </div>
      </div>
    </div>
  );
}
