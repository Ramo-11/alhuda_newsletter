const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = 3000;
const viewCountFile = './viewCount.json';
const newslettersDir = path.join(__dirname, 'public', 'newsletters');

app.set('view engine', 'ejs');
app.use(express.static('public'));

if (!fs.existsSync(viewCountFile)) fs.writeFileSync(viewCountFile, '{}');

app.get('/', (req, res) => {
  const meta = JSON.parse(fs.readFileSync('./newsletters.json'));
  const views = JSON.parse(fs.readFileSync(viewCountFile));

  const newsletters = meta.map(n => ({
    ...n,
    views: views[n.file] || 0
  }));

  res.render('index', { newsletters });
});

app.get('/newsletter/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(newslettersDir, filename);
  if (fs.existsSync(filePath)) {
    const views = JSON.parse(fs.readFileSync(viewCountFile));
    views[filename] = (views[filename] || 0) + 1;
    fs.writeFileSync(viewCountFile, JSON.stringify(views));
    res.render('newsletter', { filename });
  } else {
    res.status(404).send('Newsletter not found');
  }
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(newslettersDir, filename);
  if (fs.existsSync(filePath)) {
    const views = JSON.parse(fs.readFileSync(viewCountFile));
    views[filename] = (views[filename] || 0) + 1;
    fs.writeFileSync(viewCountFile, JSON.stringify(views));
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));