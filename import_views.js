const Database = require('better-sqlite3');
const db = new Database('newsletter.db');

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

const stmt = db.prepare('UPDATE newsletters SET views = ? WHERE filename = ?');

for (const [filename, views] of Object.entries(existingViews)) {
    stmt.run(views, filename);
    console.log(`Updated ${filename}: ${views} views`);
}

console.log('All views imported successfully!');
db.close();
