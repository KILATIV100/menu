import React, { useState, useEffect } from 'react';
import Menu from './Menu';
import Admin from './Admin';
import { fetchMenu, trackView } from './api';

export default function App() {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    trackView();
    fetchMenu()
      .then(data => { setMenuData(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  if (showAdmin) {
    return (
      <Admin
        menuData={menuData}
        setMenuData={setMenuData}
        onClose={() => setShowAdmin(false)}
      />
    );
  }

  return (
    <Menu
      menuData={menuData}
      loading={loading}
      onAdminClick={() => setShowAdmin(true)}
    />
  );
}
