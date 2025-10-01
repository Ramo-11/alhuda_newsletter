const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const app = express();

const PORT = 3000;
const newslettersDir = path.join(__dirname, 'public', 'newsletters');
const dbPath = process.env.NODE_ENV === 'production' ? '/data/newsletter.db' : 'newsletter.db';
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS newsletters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    favorite_section TEXT,
    resonated TEXT,
    general_feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    session_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(filename, session_id)
  );
`);

// Initialize newsletters from JSON
const initializeNewsletters = () => {
    const meta = JSON.parse(fs.readFileSync('./newsletters.json'));

    const existingViews = {
        'AICI Newsletter - June 2025.pdf': 10,
        'AICI Newsletter - Eid Al-Adha 2025.pdf': 930,
        'AICI Newsletter - May 2025.pdf': 162,
        'AICI Newsletter - Eid Al-Fitr 2025.pdf': 151,
        'AICI Newsletter - March 2025.pdf': 83,
        'AICI Newsletter - February 2025.pdf': 78,
        'AICI Newsletter - January 2025.pdf': 103,
        'AICI Newsletter - Syria.pdf': 165,
        'AICI Newsletter - December 2024.pdf': 77,
        'AICI Newsletter - November 2024.pdf': 85,
        'AICI Newsletter - October 2024.pdf': 109,
        'AICI Newsletter - September 2024.pdf': 120,
        'AICI Newsletter - August 2024.pdf': 84,
        'AICI Newsletter - July 2024.pdf': 86,
        'AICI Newsletter - Eid Al-Adha 2024.pdf': 1038,
        'AICI Newsletter - June 2024.pdf': 77,
        'AICI Newsletter - May 2024.pdf': 88,
        'AICI Newsletter - Eid Al-Fitr 2024.pdf': 2042,
        'AICI Newsletter - August 2025.pdf': 336,
        'AICI Newsletter - September 2025.pdf': 300,
        'AICI Newsletter - July 2025.pdf': 771,
        'AICI Newsletter - October 2025.pdf': 1,
    };

    const insertStmt = db.prepare(
        'INSERT OR IGNORE INTO newsletters (filename, views, likes) VALUES (?, ?, 0)'
    );

    const updateStmt = db.prepare(
        'UPDATE newsletters SET views = ? WHERE filename = ? AND views = 0'
    );

    meta.forEach((newsletter) => {
        const views = existingViews[newsletter.file] || 0;
        insertStmt.run(newsletter.file, views);
        updateStmt.run(views, newsletter.file);
    });
};

initializeNewsletters();

// Admin password
const ADMIN_PASSWORD = 'alhuda2025';

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
    session({
        store: new SqliteStore({
            client: db,
            expired: {
                clear: true,
                intervalMs: 900000, // 15 minutes
            },
        }),
        secret: 'alhuda-newsletter-secret-key-2025',
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 },
    })
);

// Helper to generate unique session ID
const generateSessionId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Database queries
const getNewsletterStats = (filename) => {
    const stmt = db.prepare('SELECT views, likes FROM newsletters WHERE filename = ?');
    return stmt.get(filename) || { views: 0, likes: 0 };
};

const incrementViews = (filename) => {
    const stmt = db.prepare('UPDATE newsletters SET views = views + 1 WHERE filename = ?');
    stmt.run(filename);
};

const checkUserLike = (filename, sessionId) => {
    const stmt = db.prepare('SELECT id FROM user_likes WHERE filename = ? AND session_id = ?');
    return stmt.get(filename, sessionId) !== undefined;
};

const toggleLike = (filename, sessionId) => {
    const hasLiked = checkUserLike(filename, sessionId);

    if (hasLiked) {
        db.prepare('DELETE FROM user_likes WHERE filename = ? AND session_id = ?').run(
            filename,
            sessionId
        );
        db.prepare('UPDATE newsletters SET likes = likes - 1 WHERE filename = ?').run(filename);
        return false;
    } else {
        db.prepare('INSERT INTO user_likes (filename, session_id) VALUES (?, ?)').run(
            filename,
            sessionId
        );
        db.prepare('UPDATE newsletters SET likes = likes + 1 WHERE filename = ?').run(filename);
        return true;
    }
};

const saveFeedback = (filename, favoriteSection, resonated, generalFeedback) => {
    const stmt = db.prepare(`
    INSERT INTO feedback (filename, favorite_section, resonated, general_feedback)
    VALUES (?, ?, ?, ?)
  `);
    stmt.run(filename, favoriteSection || null, resonated || null, generalFeedback || null);
};

const getAllFeedback = () => {
    const stmt = db.prepare('SELECT * FROM feedback ORDER BY created_at DESC');
    return stmt.all();
};

const getFeedbackByNewsletter = (filename) => {
    const stmt = db.prepare('SELECT * FROM feedback WHERE filename = ? ORDER BY created_at DESC');
    return stmt.all(filename);
};

// Routes
app.get('/', (req, res) => {
    const meta = JSON.parse(fs.readFileSync('./newsletters.json'));

    // Ensure session ID exists
    if (!req.session.userId) {
        req.session.userId = generateSessionId();
    }

    const newsletters = meta.map((n) => {
        const stats = getNewsletterStats(n.file);
        const hasLiked = checkUserLike(n.file, req.session.userId);
        return {
            ...n,
            views: stats.views,
            likes: stats.likes,
            hasLiked,
        };
    });

    res.render('index', { newsletters });
});

app.get('/newsletter/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(newslettersDir, filename);
    const success = req.query.success;

    if (fs.existsSync(filePath)) {
        incrementViews(filename);
        const stats = getNewsletterStats(filename);

        // Ensure session ID exists
        if (!req.session.userId) {
            req.session.userId = generateSessionId();
        }

        const hasLiked = checkUserLike(filename, req.session.userId);
        const feedback = getFeedbackByNewsletter(filename);

        res.render('newsletter', {
            filename,
            success,
            views: stats.views,
            likes: stats.likes,
            hasLiked,
            feedback,
        });
    } else {
        res.status(404).send('Newsletter not found');
    }
});

app.post('/api/like/:filename', (req, res) => {
    const filename = req.params.filename;

    // Ensure session ID exists
    if (!req.session.userId) {
        req.session.userId = generateSessionId();
    }

    const liked = toggleLike(filename, req.session.userId);
    const stats = getNewsletterStats(filename);

    res.json({
        success: true,
        liked,
        likes: stats.likes,
    });
});

app.post('/feedback/:filename', (req, res) => {
    const filename = req.params.filename;
    const { favoriteSection, resonated, generalFeedback } = req.body;

    if (favoriteSection || resonated || generalFeedback) {
        saveFeedback(filename, favoriteSection, resonated, generalFeedback);
    }

    res.redirect(`/newsletter/${encodeURIComponent(filename)}?success=1`);
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(newslettersDir, filename);

    if (fs.existsSync(filePath)) {
        incrementViews(filename);
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Admin routes
app.get('/admin', (req, res) => {
    const authenticated = req.query.auth === 'true';

    if (authenticated) {
        const feedback = getAllFeedback();
        const uniqueNewsletters = [...new Set(feedback.map((f) => f.filename))].length;

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
