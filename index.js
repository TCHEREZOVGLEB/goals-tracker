const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const bcrypt = require('bcrypt'); // Moved bcrypt import here

const app = express();
app.use(bodyParser.json());

// Регистрация пользователя
app.post('/register', (req, res) => {
  const { username, password, role } = req.body;
  const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
  const saltRounds = 10;

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      return res.status(500).send('Ошибка при хешировании пароля');
    }
    db.run(sql, [username, hash, role], function(err) {
      if (err) {
        return res.status(400).send('Пользователь уже существует!');
      }
      res.status(201).send({ id: this.lastID, username, role });
    });
  });
});

// Логин пользователя
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ?';

  db.get(sql, [username], (err, user) => {
    if (err || !user) {
      return res.status(401).send('Неверные учетные данные');
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).send('Неверные учетные данные');
      }
      res.send(user);
    });
  });
});

// Добавление цели
app.post('/goals', (req, res) => {
  const { topicName, text, description, progress } = req.body;
  const sql = 'INSERT INTO goals (topicName, text, description, progress) VALUES (?, ?, ?, ?)';
  db.run(sql, [topicName, text, description, progress], function(err) {
    if (err) {
      return res.status(400).send('Ошибка при добавлении цели');
    }
    res.status(201).send({ id: this.lastID, topicName, text, description, progress });
  });
});

// Получение всех целей
app.get('/goals', (req, res) => {
  const sql = 'SELECT * FROM goals';
  db.all(sql, [], (err, goals) => {
    if (err) {
      return res.status(500).send('Ошибка при получении целей');
    }
    res.send(goals);
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
