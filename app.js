const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const app = express();

const PORT = 3000;
const newslettersDir = path.join(__dirname, 'public', 'newsletters');

// Set up SQLite DB
const db = new Database('views.db');
db.prepare(`
  CREATE TABLE IF NOT EXISTS views (
    filename TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0
  )
`).run();

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Get view count from DB
function getViews(filename) {
  const row = db.prepare('SELECT count FROM views WHERE filename = ?').get(filename);
  return row ? row.count : 0;
}

// Increment view count
function incrementView(filename) {
  const existing = getViews(filename);
  if (existing) {
    db.prepare('UPDATE views SET count = count + 1 WHERE filename = ?').run(filename);
  } else {
    db.prepare('INSERT INTO views (filename, count) VALUES (?, 1)').run(filename);
  }
}

app.get('/', (req, res) => {
  const meta = JSON.parse(fs.readFileSync('./newsletters.json'));

  const newsletters = meta.map(n => ({
    ...n,
    views: getViews(n.file)
  }));

  res.render('index', { newsletters });
});

app.get('/newsletter/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(newslettersDir, filename);

  if (fs.existsSync(filePath)) {
    incrementView(filename);
    res.render('newsletter', { filename });
  } else {
    res.status(404).send('Newsletter not found');
  }
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(newslettersDir, filename);

  if (fs.existsSync(filePath)) {
    incrementView(filename);
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
