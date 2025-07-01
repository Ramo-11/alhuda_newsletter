const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = 3000;
const newslettersDir = path.join(__dirname, 'public', 'newsletters');
const viewsFile = path.join(__dirname, 'views.json');
const feedbackFile = path.join(__dirname, 'feedback.json');

// Default view counts for newsletters
const defaultViews = {
  "AICI Newsletter - June 2025.pdf": 10,
  "AICI Newsletter - Eid Al-Adha 2025.pdf": 885,
  "AICI Newsletter - May 2025.pdf": 130,
  "AICI Newsletter - Eid Al-Fitr 2025.pdf": 128,
  "AICI Newsletter - March 2025.pdf": 55,
  "AICI Newsletter - February 2025.pdf": 58,
  "AICI Newsletter - January 2025.pdf": 76,
  "AICI Newsletter - Syria.pdf": 140,
  "AICI Newsletter - December 2024.pdf": 53,
  "AICI Newsletter - November 2024.pdf": 60,
  "AICI Newsletter - October 2024.pdf": 70,
  "AICI Newsletter - September 2024.pdf": 90,
  "AICI Newsletter - August 2024.pdf": 55,
  "AICI Newsletter - July 2024.pdf": 53,
  "AICI Newsletter - Eid Al-Adha 2024.pdf": 1013,
  "AICI Newsletter - June 2024.pdf": 56,
  "AICI Newsletter - May 2024.pdf": 60,
  "AICI Newsletter - Eid Al-Fitr 2024.pdf": 2020
};

// Initialize JSON files if they don't exist
if (!fs.existsSync(viewsFile)) {
  fs.writeFileSync(viewsFile, JSON.stringify(defaultViews, null, 2));
} else {
  // Only merge and write if there are actually missing newsletters
  const existingViews = getViews();
  const missingNewsletters = Object.keys(defaultViews).filter(key => !(key in existingViews));
  
  if (missingNewsletters.length > 0) {
    const mergedViews = { ...defaultViews, ...existingViews };
    fs.writeFileSync(viewsFile, JSON.stringify(mergedViews, null, 2));
  }
}

if (!fs.existsSync(feedbackFile)) {
  fs.writeFileSync(feedbackFile, '[]');
}

if (!fs.existsSync(feedbackFile)) {
  fs.writeFileSync(feedbackFile, '[]');
}

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Read views data
function getViews() {
  try {
    return JSON.parse(fs.readFileSync(viewsFile, 'utf8'));
  } catch {
    return {};
  }
}

// Save views data
function saveViews(views) {
  fs.writeFileSync(viewsFile, JSON.stringify(views, null, 2));
}

// Get view count for specific file
function getViewCount(filename) {
  const views = getViews();
  return views[filename] || 0;
}

// Increment view count
function incrementView(filename) {
  const views = getViews();
  views[filename] = (views[filename] || 0) + 1;
  saveViews(views);
}

// Read feedback data
function getFeedback() {
  try {
    return JSON.parse(fs.readFileSync(feedbackFile, 'utf8'));
  } catch {
    return [];
  }
}

// Save feedback data
function saveFeedback(filename, favoriteSection, resonated, generalFeedback) {
  const feedback = getFeedback();
  const newFeedback = {
    id: Date.now(), // Simple ID using timestamp
    filename,
    favoriteSection: favoriteSection || null,
    resonated: resonated || null,
    generalFeedback: generalFeedback || null,
    createdAt: new Date().toISOString()
  };
  feedback.push(newFeedback);
  fs.writeFileSync(feedbackFile, JSON.stringify(feedback, null, 2));
}

app.get('/', (req, res) => {
  const meta = JSON.parse(fs.readFileSync('./newsletters.json'));

  const newsletters = meta.map(n => ({
    ...n,
    views: getViewCount(n.file)
  }));

  res.render('index', { newsletters });
});

app.get('/newsletter/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(newslettersDir, filename);
  const success = req.query.success;

  if (fs.existsSync(filePath)) {
    incrementView(filename);
    res.render('newsletter', { filename, success });
  } else {
    res.status(404).send('Newsletter not found');
  }
});

app.post('/feedback/:filename', (req, res) => {
  const filename = req.params.filename;
  const { favoriteSection, resonated, generalFeedback } = req.body;
  
  // Only save if at least one field has content
  if (favoriteSection || resonated || generalFeedback) {
    saveFeedback(filename, favoriteSection, resonated, generalFeedback);
  }
  
  res.redirect(`/newsletter/${encodeURIComponent(filename)}?success=1`);
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

// Admin routes
const ADMIN_PASSWORD = 'alhuda2025'; // Change this to your desired password

app.get('/admin', (req, res) => {
  const authenticated = req.query.auth === 'true';
  
  if (authenticated) {
    const feedback = getFeedback().reverse(); // Show newest first
    const uniqueNewsletters = [...new Set(feedback.map(f => f.filename))].length;
    
    // Group feedback by newsletter filename
    const groupedFeedback = feedback.reduce((groups, item) => {
      const filename = item.filename;
      if (!groups[filename]) {
        groups[filename] = [];
      }
      groups[filename].push(item);
      return groups;
    }, {});
    
    res.render('admin', { authenticated: true, feedback, uniqueNewsletters, groupedFeedback });
  } else {
    res.render('admin', { authenticated: false });
  }
});

app.post('/admin', (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    res.redirect('/admin?auth=true');
  } else {
    res.render('admin', { authenticated: false, error: true });
  }
});

app.get('/admin/logout', (req, res) => {
  res.redirect('/admin');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));