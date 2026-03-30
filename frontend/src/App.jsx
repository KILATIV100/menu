import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Admin from './Admin';
import Print from './Print';
import { fetchMenu, trackView } from './api';

export default function App() {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('menu'); // 'menu' | 'admin' | 'print'

  useEffect(() => {
    trackView();
    fetchMenu()
      .then(data => { setMenuData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (view === 'admin') {
    return <Admin menuData={menuData} setMenuData={setMenuData} onClose={() => setView('menu')} onPrint={() => setView('print')} />;
  }
  if (view === 'print') {
    return <Print menuData={menuData} onClose={() => setView('admin')} />;
  }
  return <Menu menuData={menuData} loading={loading} onAdminClick={() => setView('admin')} />;
}
