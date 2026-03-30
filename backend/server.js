const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'menu.json');
const ADMIN_PASS = process.env.ADMIN_PASSWORD || '57ba1z72';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// GET /api/menu — публічне меню
app.get('/api/menu', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch {
    res.status(500).json({ error: 'Cannot read menu' });
  }
});

// POST /api/menu — зберегти меню (тільки для адміна)
app.post('/api/menu', (req, res) => {
  const pass = req.headers['x-admin-password'];
  if (pass !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Cannot write menu' });
  }
});

// POST /api/stats — записати перегляд
app.post('/api/stats', (req, res) => {
  const statsFile = path.join(__dirname, 'stats.json');
  try {
    let stats = {};
    if (fs.existsSync(statsFile)) stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    const today = new Date().toISOString().slice(0, 10);
    stats.total = (stats.total || 0) + 1;
    stats.days = stats.days || {};
    stats.days[today] = (stats.days[today] || 0) + 1;
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

// GET /api/stats — статистика (тільки для адміна)
app.get('/api/stats', (req, res) => {
  const pass = req.headers['x-admin-password'];
  if (pass !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
  const statsFile = path.join(__dirname, 'stats.json');
  try {
    const data = fs.existsSync(statsFile) ? JSON.parse(fs.readFileSync(statsFile, 'utf8')) : {};
    res.json(data);
  } catch {
    res.json({});
  }
});

app.listen(PORT, () => console.log(`PerkUP API running on port ${PORT}`));
