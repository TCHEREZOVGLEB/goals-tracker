let currentTopic = null;
let currentUser  = null;
let db;

const initDB = () => {
  const request = indexedDB.open('GoalsTrackerDB', 4);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('users')) {
      db.createObjectStore('users', { keyPath: 'username' });
    }
    if (!db.objectStoreNames.contains('topics')) {
      db.createObjectStore('topics', { keyPath: 'name' });
    }
    if (!db.objectStoreNames.contains('goals')) {
      const goalsStore = db.createObjectStore('goals', { keyPath: 'id', autoIncrement: true });
      goalsStore.createIndex('topicName', 'topicName', { unique: false });
    }
    if (!db.objectStoreNames.contains('shifts')) {
      const shiftsStore = db.createObjectStore('shifts', { keyPath: 'id', autoIncrement: true });
      shiftsStore.createIndex('fio', 'fio', { unique: false });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    showAuthPage(); // Показываем страницу авторизации по умолчанию
  };

  request.onerror = (event) => {
    console.error('Ошибка при открытии базы данных:', event.target.error);
  };
};

const showAuthPage = () => {
  hideAllPages();
  document.getElementById('authPage').classList.remove('hidden');
};

const showRegisterPage = () => {
  hideAllPages();
  document.getElementById('registerPage').classList.remove('hidden');
};

const showMainPage = () => {
  hideAllPages();
  document.getElementById('mainPage').classList.remove('hidden');
};

const showTopicPage = (topicName) => {
  hideAllPages();
  document.getElementById('topicPage').classList.remove('hidden');
  document.getElementById('topicTitle').textContent = topicName;
  renderGoals();
};

const showShiftPage = () => {
  hideAllPages();
  document.getElementById('shiftPage').classList.remove('hidden');
  renderShifts();
};

const showShiftReportPage = () => {
  hideAllPages();
  document.getElementById('shiftReportPage').classList.remove('hidden');
  renderShiftReport();
};

const showProfilePage = (username) => {
  hideAllPages();
  document.getElementById('profilePage').classList.remove('hidden');

  const transaction = db.transaction(['users'], 'readonly');
  const store = transaction.objectStore('users');
  store.get(username).onsuccess = (event) => {
    const user = event.target.result;
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileRole').textContent = user.role;

    // Проверяем роль текущего пользователя
    if (currentUser  && (user.role === 'капитан' || user.role === 'админ')) {
      document.querySelector('#profilePage button:nth-child(1)').style.display = 'inline-block'; // Кнопка повышения
      document.querySelector('#profilePage button:nth-child(2)').style.display = 'inline-block'; // Кнопка понижения
    } else {
      document.querySelector('#profilePage button:nth-child(1)').style.display = 'none'; // Скрыть кнопку повышения
      document.querySelector('#profilePage button:nth-child(2)').style.display = 'none'; // Скрыть кнопку понижения
    }
  };
};

const hideAllPages = () => {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('registerPage').classList.add('hidden');
  document.getElementById('mainPage').classList.add('hidden');
  document.getElementById('topicPage').classList.add('hidden');
  document.getElementById('shiftPage').classList.add('hidden');
  document.getElementById('shiftReportPage').classList.add('hidden');
  document.getElementById('profilePage').classList.add('hidden');
};

const register = () => {
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const role = document.getElementById('regRole').value;

  if (!username || !password || !role) return alert('Заполните все поля!');

  const transaction = db.transaction(['users'], 'readwrite');
  const store = transaction.objectStore('users');
  store.add({ username, password, role }).onsuccess = () => {
    alert('Регистрация успешна!');
    showAuthPage(); // Переход на страницу авторизации после регистрации
  };

  transaction.onerror = () => {
    alert('Пользователь уже существует!');
  };
};

const login = () => {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const role = document.getElementById('loginRole').value;

  if (!username || !password || !role) return alert('Заполните все поля!');

  const transaction = db.transaction(['users'], 'readonly');
  const store = transaction.objectStore('users');
  store.get(username).onsuccess = (event) => {
    const user = event.target.result;
    if (user && user.password === password && user.role === role) {
      currentUser  = username;
      showMainPage(); // Переход на основную страницу после авторизации
    } else {
      alert('Неверное имя пользователя, пароль или должность!');
    }
  };
};

const createTopic = () => {
  const topicName = document.getElementById('topicName').value.trim();
  if (!topicName) return alert('Введите имя и фамилию!');

  const transaction = db.transaction(['topics'], 'readwrite');
  const store = transaction.objectStore('topics');
  store.add({ name: topicName, user: currentUser  });
  showTopicPage(topicName);
};

const addGoal = () => {
  const goalText = document.getElementById('newGoal').value.trim();
  const goalDescription = document.getElementById('goalDescription').value.trim();
  const goalProgress = parseInt(document.getElementById('newGoalProgress').value, 10);

  if (!goalText) return alert('Введите цель!');
  if (isNaN(goalProgress) || goalProgress < 0 || goalProgress > 100) {
    return alert('Введите процент выполнения от 0 до 100!');
  }

  const transaction = db.transaction(['goals'], 'readwrite');
  const store = transaction.objectStore('goals');
  store.add({
    topicName: currentTopic,
    text: goalText,
    description: goalDescription,
    progress: goalProgress,
    completed: false
  }).onsuccess = () => {
    renderGoals();
    resetGoalInputs();
  };
};

const resetGoalInputs = () => {
  document.getElementById('newGoal').value = '';
  document.getElementById('goalDescription').value = '';
  document.getElementById('newGoalProgress').value = '';
};

const renderGoals = () => {
  const goalsList = document.getElementById('goalsList');
  goalsList.innerHTML = '';

  const transaction = db.transaction(['goals'], 'readonly');
  const store = transaction.objectStore('goals');
  const index = store.index('topicName');
  index.getAll(currentTopic).onsuccess = (event) => {
    const goals = event.target.result;
    goals.forEach((goal) => {
      const goalRow = document.createElement('tr');
      goalRow.className = `goal ${goal.completed ? 'completed' : ''}`;
      goalRow.innerHTML = `
        <td>${goal.text}</td>
        <td>${goal.description}</td>
        <td>${goal.progress}%</td>
        <td>
          <button onclick="toggleGoal(${goal.id})">${goal.completed ? 'Восстановить' : 'Закрыть'}</button>
          <button onclick="deleteGoal(${goal.id})">Удалить</button>
        </td>
      `;
      goalsList.appendChild(goalRow);
    });
  };
};

const toggleGoal = (id) => {
  const transaction = db.transaction(['goals'], 'readwrite');
  const store = transaction.objectStore('goals');
  store.get(id).onsuccess = (event) => {
    const goal = event.target.result;
    goal.completed = !goal.completed;
    store.put(goal).onsuccess = renderGoals;
  };
};

const deleteGoal = (id) => {
  const transaction = db.transaction(['goals'], 'readwrite');
  const store = transaction.objectStore('goals');
  store.delete(id).onsuccess = renderGoals;
};

const saveShift = () => {
  const fio = document.getElementById('shiftFIO').value.trim();
  const shiftNumber = document.getElementById('shiftNumber').value;
  const shiftDate = document.getElementById('shiftDate').value;

  if (!fio || !shiftNumber || !shiftDate) return alert('Заполните все поля!');

  const transaction = db.transaction(['shifts'], 'readwrite');
  const store = transaction.objectStore('shifts');
  store.add({ fio, shiftNumber, shiftDate }).onsuccess = () => {
    renderShifts();
    resetShiftInputs();
  };
};

const resetShiftInputs = () => {
  document.getElementById('shiftFIO').value = '';
  document.getElementById('shiftNumber').value = '';
  document.getElementById('shiftDate').value = '';
};

const renderShifts = () => {
  const shiftList = document.getElementById('shiftList');
  shiftList.innerHTML = '';

  const transaction = db.transaction(['shifts'], 'readonly');
  const store = transaction.objectStore('shifts');
  store.getAll().onsuccess = (event) => {
    const shifts = event.target.result;
    shifts.forEach((shift) => {
      const shiftRow = document.createElement('tr');
      shiftRow.innerHTML = `
        <td>${shift.fio}</td>
        <td>${shift.shiftNumber}</td>
        <td>${shift.shiftDate}</td>
      `;
      shiftList.appendChild(shiftRow);
    });
  };
};

const renderShiftReport = () => {
  const shiftReportList = document.getElementById('shiftReportList');
  shiftReportList.innerHTML = '';

  const transaction = db.transaction(['shifts'], 'readonly');
  const store = transaction.objectStore('shifts');
  store.getAll().onsuccess = (event) => {
    const shifts = event.target.result;
    shifts.forEach((shift) => {
      const shiftRow = document.createElement('tr');
      shiftRow.innerHTML = `
        <td>${shift.fio}</td>
        <td>${shift.shiftNumber}</td>
        <td>${shift.shiftDate}</td>
      `;
      shiftReportList.appendChild(shiftRow);
    });
  };
};

const clearShiftData = () => {
  const transaction = db.transaction(['shifts'], 'readwrite');
  const store = transaction.objectStore('shifts');
  store.clear().onsuccess = () => {
    renderShifts(); // Обновляем отображение после очистки
    alert('Данные успешно очищены!');
  };
};

const exportToExcel = () => {
  const transaction = db.transaction(['shifts'], 'readonly');
  const store = transaction.objectStore('shifts');
  store.getAll().onsuccess = (event) => {
    const shifts = event.target.result;
    const csvContent = "data:text/csv;charset=utf-8," 
      + shifts.map(shift => `${shift.fio},${shift.shiftNumber},${shift.shiftDate}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "shifts_report.csv");
    document.body.appendChild(link);
    link.click();
  };
};

const exportShiftsToExcel = () => {
  const transaction = db.transaction(['shifts'], 'readonly');
  const store = transaction.objectStore('shifts');
  store.getAll().onsuccess = (event) => {
    const shifts = event.target.result;

    // Создаем CSV контент
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ФИО,Номер смены,Дата\n"; // Заголовки столбцов
    shifts.forEach(shift => {
      const row = `${shift.fio},${shift.shiftNumber},${shift.shiftDate}`;
      csvContent += row + "\n";
    });

    // Создаем ссылку для скачивания
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "shifts_report.csv");
    document.body.appendChild(link);
    link.click();
  };
};

const promoteUser  = () => {
  const username = document.getElementById('profileUsername').textContent;
  const transaction = db.transaction(['users'], 'readwrite');
  const store = transaction.objectStore('users');
  store.get(username).onsuccess = (event) => {
    const user = event.target.result;
    if (user.role === 'сержант') {
      user.role = 'старший сержант';
    } else if (user.role === 'старший сержант') {
      user.role = 'капитан';
    } else if (user.role === 'капитан') {
      user.role = 'админ';
    } else {
      alert('Достигнуто максимальное звание!');
      return;
    }
    store.put(user).onsuccess = () => {
      alert('Звание повышено!');
      showProfilePage(username); // Обновляем страницу профиля
    };
  };
};

const demoteUser  = () => {
  const username = document.getElementById('profileUsername').textContent;
  const transaction = db.transaction(['users'], 'readwrite');
  const store = transaction.objectStore('users');
  store.get(username).onsuccess = (event) => {
    const user = event.target.result;
    if (user.role === 'админ') {
      user.role = 'капитан';
    } else if (user.role === 'капитан') {
      user.role = 'старший сержант';
    } else if (user.role === 'старший сержант') {
      user.role = 'сержант';
    } else {
      alert('Достигнуто минимальное звание!');
      return;
    }
    store.put(user).onsuccess = () => {
      alert('Звание понижено!');
      showProfilePage(username); // Обновляем страницу профиля
    };
  };
};

window.onload = () => {
  initDB();
};