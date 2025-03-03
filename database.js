const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./goals.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the goals database.');
});

// Создание таблиц
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topicName TEXT NOT NULL,
    text TEXT NOT NULL,
    description TEXT,
    progress INTEGER,
    completed BOOLEAN NOT NULL DEFAULT 0
  )`);
});

module.exports = db;