const BASE = process.env.REACT_APP_API_URL || '';

export async function fetchMenu() {
  const res = await fetch(`${BASE}/api/menu`);
  if (!res.ok) throw new Error('Cannot load menu');
  return res.json();
}

export async function saveMenu(data, password) {
  const res = await fetch(`${BASE}/api/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Save failed');
  }
  return res.json();
}

export async function fetchStats(password) {
  const res = await fetch(`${BASE}/api/stats`, {
    headers: { 'x-admin-password': password },
  });
  if (!res.ok) throw new Error('Cannot load stats');
  return res.json();
}

export async function trackView() {
  try {
    await fetch(`${BASE}/api/stats`, { method: 'POST' });
  } catch {}
}
