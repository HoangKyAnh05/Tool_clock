// renderer.js – Task Countdown with quantity tracking, %, sound effects

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// -------------------------------------------------------
// Sound Engine (Web Audio API – no external files needed)
// -------------------------------------------------------
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* ignore audio errors */ }
}

// Sound presets
const SFX = {
  tick() { playTone(880, 0.08, 'sine', 0.15); },
  milestone25() {
    playTone(523, 0.15);
    setTimeout(() => playTone(659, 0.15), 120);
  },
  milestone50() {
    playTone(523, 0.15);
    setTimeout(() => playTone(659, 0.15), 100);
    setTimeout(() => playTone(784, 0.2), 200);
  },
  milestone75() {
    playTone(659, 0.12);
    setTimeout(() => playTone(784, 0.12), 100);
    setTimeout(() => playTone(988, 0.18), 200);
  },
  complete() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.25, 'sine', 0.35), i * 100)
    );
  },
  delete() { playTone(220, 0.12, 'triangle', 0.2); },
  add() { playTone(440, 0.1, 'sine', 0.2); setTimeout(() => playTone(550, 0.15), 80); },
  alarm() {
    [523, 659, 784, 1047, 1318].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.18, 'sine', 0.35), i * 140)
    );
  }
};

// -------------------------------------------------------
// Time helpers
// -------------------------------------------------------
function getDayProgress() {
  const now = new Date();
  const start = new Date(now); start.setHours(7, 0, 0, 0);
  const end = new Date(now); end.setHours(24, 0, 0, 0);
  if (now < start) return 0;
  if (now >= end) return 1;
  return (now - start) / (end - start);
}

function formatMs(ms) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function getTimeLeft() {
  const now = new Date();
  const end = new Date(now); end.setHours(24, 0, 0, 0);
  const start = new Date(now); start.setHours(7, 0, 0, 0);
  if (now < start) return { elapsed: 0, left: end - now };
  if (now >= end) return { elapsed: end - start, left: 0 };
  return { elapsed: now - start, left: end - now };
}

function formatClockTime() {
  const now = new Date();
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(v => String(v).padStart(2, '0')).join(':');
}

function formatDate() {
  const now = new Date();
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return `${days[now.getDay()]}, ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
}

// -------------------------------------------------------
// Task Storage (Separated by Date)
// -------------------------------------------------------
function getCurrentDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadAllTasksGrouped() {
  try {
    return JSON.parse(localStorage.getItem('tasks_by_date') || '{}');
  } catch {
    return {};
  }
}

function saveAllTasksGrouped(grouped) {
  localStorage.setItem('tasks_by_date', JSON.stringify(grouped));
}

function migrateOldTasks() {
  const oldTasksJson = localStorage.getItem('tasks');
  if (oldTasksJson) {
    try {
      const oldTasks = JSON.parse(oldTasksJson);
      if (Array.isArray(oldTasks) && oldTasks.length > 0) {
        const grouped = loadAllTasksGrouped();
        const todayKey = getCurrentDateKey();
        if (!grouped[todayKey]) {
          grouped[todayKey] = oldTasks;
          saveAllTasksGrouped(grouped);
        }
      }
      localStorage.removeItem('tasks');
    } catch (e) {
      console.error('Migration failed:', e);
    }
  }
}

// Perform migration
migrateOldTasks();

function loadTasks() {
  const grouped = loadAllTasksGrouped();
  const todayKey = getCurrentDateKey();
  return grouped[todayKey] || [];
}

function saveTasks(tasks) {
  const grouped = loadAllTasksGrouped();
  const todayKey = getCurrentDateKey();
  grouped[todayKey] = tasks;
  saveAllTasksGrouped(grouped);
}

// -------------------------------------------------------
// Progress badge class
// -------------------------------------------------------
function badgeClass(pct) {
  if (pct >= 100) return 'badge-pct milestone-100';
  if (pct >= 75) return 'badge-pct milestone-75';
  if (pct >= 50) return 'badge-pct milestone-50';
  if (pct >= 25) return 'badge-pct milestone-25';
  return 'badge-pct';
}

// -------------------------------------------------------
// Render a single task card
// -------------------------------------------------------
function createTaskCard(task, idx) {
  const pct = task.target > 0
    ? Math.min(100, Math.round((task.completed / task.target) * 100))
    : 0;
  const isDone = pct >= 100;
  const { elapsed, left } = getTimeLeft();

  const li = document.createElement('li');
  li.className = 'task-card' + (isDone ? ' done' : '');
  li.dataset.idx = idx;

  const unitLabel = task.unit ? ` ${task.unit}` : '';

  li.innerHTML = `
    <div class="card-header">
      <span class="task-name-text">${escHtml(task.name)}</span>
      <span class="${badgeClass(pct)}">${pct}%</span>
    </div>

    <div class="progress-wrap">
      <div class="progress-fill ${isDone ? 'done-fill' : ''}" style="width:${pct}%"></div>
    </div>

    <div class="counter-row">
      <div class="counter-controls">
        <button class="cnt-btn minus" data-action="dec" data-idx="${idx}" title="Giảm">−</button>
        <span class="counter-val">${task.completed}${unitLabel}</span>
        <button class="cnt-btn plus" data-action="inc" data-idx="${idx}" title="Tăng">+</button>
      </div>
      <span class="counter-target">/ ${task.target}${unitLabel}</span>
    </div>

    <div class="card-footer">
      <span class="time-remaining">⏱ Đã qua: ${formatMs(elapsed)} (Còn ${formatMs(left)})</span>
      ${isDone
      ? '<span class="done-label">✅ Hoàn thành!</span>'
      : ''}
      <button class="btn-delete" data-action="del" data-idx="${idx}" title="Xóa task">🗑</button>
    </div>
  `;

  return li;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// -------------------------------------------------------
// Render all tasks
// -------------------------------------------------------
function updateSummary(tasks) {
  const totalTasks = tasks.length;
  let completedTasks = 0;
  let totalTargetSum = 0;
  let totalCompletedSum = 0;

  tasks.forEach(t => {
    const pct = t.target > 0 ? (t.completed / t.target) : 0;
    if (pct >= 1) {
      completedTasks++;
    }
    totalTargetSum += t.target;
    totalCompletedSum += t.completed;
  });

  const overallPct = totalTargetSum > 0 ? Math.round((totalCompletedSum / totalTargetSum) * 100) : 0;

  document.getElementById('sumTasks').textContent = totalTasks;
  document.getElementById('sumCompleted').textContent = completedTasks;
  document.getElementById('sumPct').textContent = `${overallPct}%`;
}

function renderTasks() {
  const rawTasks = loadTasks();

  // Attach original index so actions still target the correct index
  const tasksWithIndex = rawTasks.map((t, idx) => ({ ...t, originalIdx: idx }));

  // Sort: incomplete first, completed (pct >= 100) last
  tasksWithIndex.sort((a, b) => {
    const aPct = a.target > 0 ? (a.completed / a.target) >= 1 : false;
    const bPct = b.target > 0 ? (b.completed / b.target) >= 1 : false;
    if (aPct && !bPct) return 1;
    if (!aPct && bPct) return -1;
    return 0; // maintain relative order
  });

  const list = document.getElementById('taskList');
  const empty = document.getElementById('emptyState');
  list.innerHTML = '';
  if (tasksWithIndex.length === 0) {
    empty.classList.add('visible');
    updateSummary(rawTasks);
    return;
  }
  empty.classList.remove('visible');
  tasksWithIndex.forEach((t) => list.appendChild(createTaskCard(t, t.originalIdx)));

  updateSummary(rawTasks);
}

// -------------------------------------------------------
// Update time header
// -------------------------------------------------------
function updateHeader() {
  const progress = getDayProgress();
  const { elapsed, left } = getTimeLeft();
  const pct = Math.round(progress * 100);

  document.getElementById('clock').textContent = formatClockTime();
  document.getElementById('dateStr').textContent = formatDate();
  document.getElementById('dayPct').textContent = `${pct}%`;
  document.getElementById('dayFill').style.width = `${pct}%`;
  document.getElementById('timeElapsed').textContent = formatMs(elapsed);
  document.getElementById('timeLeft').textContent = formatMs(left);
}

// -------------------------------------------------------
// Add task
// -------------------------------------------------------
function handleAdd() {
  const nameEl = document.getElementById('taskName');
  const targetEl = document.getElementById('taskTarget');
  const unitEl = document.getElementById('taskUnit');

  const name = nameEl.value.trim();
  const target = parseInt(targetEl.value) || 1;
  const unit = unitEl.value.trim();

  if (!name) { nameEl.focus(); nameEl.style.borderColor = '#ef4444'; return; }
  nameEl.style.borderColor = '';

  const tasks = loadTasks();
  tasks.push({ name, target, completed: 0, unit });
  saveTasks(tasks);

  nameEl.value = '';
  targetEl.value = '';
  unitEl.value = '';

  SFX.add();
  renderTasks();
}

// -------------------------------------------------------
// Event delegation for +/−/delete buttons
// -------------------------------------------------------
let confirmCallback = null;

function showConfirm(title, message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMsg').textContent = message;
  modal.classList.add('active');
  confirmCallback = onConfirm;
}

function hideConfirm() {
  const modal = document.getElementById('confirmModal');
  modal.classList.remove('active');
  confirmCallback = null;
}

function showIncompleteModal() {
  const modal = document.getElementById('incompleteModal');
  const list = document.getElementById('incompleteList');
  const emptyState = document.getElementById('noIncompleteState');

  list.innerHTML = '';
  modal.classList.add('active');

  const grouped = loadAllTasksGrouped();
  const todayKey = getCurrentDateKey();

  // Sort dates latest first
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  let count = 0;

  dates.forEach(dateKey => {
    // Skip today's tasks
    if (dateKey === todayKey) return;

    const dayTasks = grouped[dateKey] || [];
    dayTasks.forEach(task => {
      const pct = task.target > 0 ? Math.min(100, Math.round((task.completed / task.target) * 100)) : 0;
      if (pct < 100) {
        count++;
        const li = document.createElement('li');
        li.className = 'incomplete-item';

        const parts = dateKey.split('-');
        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateKey;
        const unitLabel = task.unit ? ` ${task.unit}` : '';

        li.innerHTML = `
          <div class="incomplete-header-row">
            <span class="incomplete-date">📅 ${formattedDate}</span>
            <span class="incomplete-pct">${pct}% hoàn thành</span>
          </div>
          <div class="incomplete-name">${escHtml(task.name)}</div>
          <div class="incomplete-qty-row">
            <span>Đã làm: <strong>${task.completed}/${task.target}</strong>${unitLabel}</span>
          </div>
          <div class="incomplete-progress-bar-bg">
            <div class="incomplete-progress-bar-fill" style="width:${pct}%"></div>
          </div>
        `;
        list.appendChild(li);
      }
    });
  });

  if (count === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
  }
}

function hideIncompleteModal() {
  const modal = document.getElementById('incompleteModal');
  modal.classList.remove('active');
}

function handleListClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const idx = parseInt(btn.dataset.idx);
  const tasks = loadTasks();
  const task = tasks[idx];
  if (!task) return;

  const prevPct = task.target > 0 ? Math.round((task.completed / task.target) * 100) : 0;

  if (action === 'inc') {
    task.completed = Math.min(task.target, task.completed + 1);
    SFX.tick();
  } else if (action === 'dec') {
    task.completed = Math.max(0, task.completed - 1);
    SFX.tick();
  } else if (action === 'del') {
    showConfirm('Xóa nhiệm vụ', `Bạn có chắc chắn muốn xóa nhiệm vụ "${task.name}" không?`, () => {
      const currentTasks = loadTasks();
      currentTasks.splice(idx, 1);
      saveTasks(currentTasks);
      SFX.delete();
      renderTasks();
    });
    return;
  }

  const newPct = task.target > 0 ? Math.round((task.completed / task.target) * 100) : 0;

  // Sound milestones (only going upward)
  if (action === 'inc' && newPct > prevPct) {
    if (newPct >= 100 && prevPct < 100) {
      SFX.complete();
      // Flash animation on the card
      setTimeout(() => {
        const card = document.querySelector(`[data-idx="${idx}"]`);
        if (card) { card.classList.add('flash-done'); setTimeout(() => card.classList.remove('flash-done'), 700); }
      }, 50);
    } else if (newPct >= 75 && prevPct < 75) { SFX.milestone75(); }
    else if (newPct >= 50 && prevPct < 50) { SFX.milestone50(); }
    else if (newPct >= 25 && prevPct < 25) { SFX.milestone25(); }
  }

  saveTasks(tasks);
  renderTasks();
}

// -------------------------------------------------------
// Window controls (frameless window)
// -------------------------------------------------------
function setupWindowControls() {
  const api = window.taskAPI;
  const minimize = document.getElementById('btnMinimize');
  const maximize = document.getElementById('btnMaximize');
  const close = document.getElementById('btnClose');
  const reload = document.getElementById('btnReload');
  const openWeb = document.getElementById('btnOpenInBrowser');
  if (minimize && api && api.minimize) minimize.addEventListener('click', () => api.minimize());
  if (maximize && api && api.maximize) maximize.addEventListener('click', () => api.maximize());
  if (close && api && api.close) close.addEventListener('click', () => api.close());
  if (reload) reload.addEventListener('click', () => window.location.reload());
  if (openWeb) {
    if (api && api.openExternal) {
      openWeb.addEventListener('click', () => api.openExternal(window.location.href));
    } else {
      openWeb.style.display = 'none';
    }
  }

  if (api && api.onMaximized) {
    api.onMaximized((isMax) => {
      if (maximize) {
        maximize.textContent = isMax ? '❐' : '▢';
        maximize.title = isMax ? 'Thu nhỏ cửa sổ' : 'Phóng to';
      }
    });
  }
}
// =========================================================
// IELTS 9.0 Study Vault Module
// =========================================================
let ieltsVaultData = {
  challengeStartDate: '',
  items: []
};
let activeIeltsItemId = null;
let selectedIeltsItemIds = new Set();
let uploadedImages = [];
let activeWebAiPrompt = '';
let selectedFilterDate = null;

// =========================================================
// General Study Vault Module
// =========================================================
let generalVaultData = {
  challengeStartDate: '',
  items: [],
  folders: ["Mặc định"]
};
let activeGeneralItemId = null;
let activeGenWebAiPrompt = '';

// =========================================================
// Speaking Topics Vault Module
// =========================================================
let speakingVaultData = {
  items: []
};
let activeSpeakingLinkId = null;

function getChallengeDayNumber(startDateStr) {
  if (!startDateStr) return 1;
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
}

function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function loadIeltsData() {
  let data = null;
  if (window.taskAPI && window.taskAPI.loadIeltsVault) {
    data = await window.taskAPI.loadIeltsVault();
  } else {
    const stored = localStorage.getItem('web_ielts_vault');
    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored web_ielts_vault', e);
      }
    }
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    ieltsVaultData = data;
  } else if (data && Array.isArray(data)) {
    ieltsVaultData = {
      challengeStartDate: getCurrentDateKey(),
      items: data
    };
  }

  if (!ieltsVaultData || typeof ieltsVaultData !== 'object' || Array.isArray(ieltsVaultData)) {
    ieltsVaultData = {
      challengeStartDate: getCurrentDateKey(),
      items: []
    };
  }

  if (!ieltsVaultData.items || !Array.isArray(ieltsVaultData.items)) {
    ieltsVaultData.items = [];
  }
  if (!ieltsVaultData.challengeStartDate) {
    ieltsVaultData.challengeStartDate = getCurrentDateKey();
  }
  if (!ieltsVaultData.folders || !Array.isArray(ieltsVaultData.folders) || ieltsVaultData.folders.length === 0) {
    ieltsVaultData.folders = ["Mặc định"];
  }
  if (!ieltsVaultData.customSkills || !Array.isArray(ieltsVaultData.customSkills)) {
    ieltsVaultData.customSkills = [];
  }

  // Automatic Migration from General Study Vault
  if (window.taskAPI && window.taskAPI.loadGeneralVault) {
    try {
      const generalData = await window.taskAPI.loadGeneralVault();
      if (generalData && generalData.items && generalData.items.length > 0) {
        generalData.items.forEach(genItem => {
          const alreadyMigrated = ieltsVaultData.items.some(ieltsItem => ieltsItem.id === `migrated-${genItem.id}`);
          if (!alreadyMigrated) {
            const skill = genItem.subject || 'other';
            const f = genItem.fields || {};
            const fields = {
              images: f.images || [],
              image: f.image || '',
            };

            if (skill === 'math') {
              fields.mathProblem = f.problem || '';
              fields.mathTheory = f.theory || '';
              fields.mathSteps = f.steps || '';
              fields.mathSolution = f.solution || '';
            } else if (skill === 'korean') {
              fields.koreanVocab = f.vocab || '';
              fields.koreanDialogue = f.dialogue || '';
              fields.koreanPron = f.pron || '';
              fields.koreanTranslation = f.translation || '';
            } else if (skill === 'japanese') {
              fields.japaneseVocab = f.vocab || '';
              fields.japaneseDialogue = f.dialogue || '';
              fields.japaneseTranslation = f.translation || '';
            } else if (skill === 'coding') {
              fields.codingProblem = f.problem || '';
              fields.codingConcept = f.concept || '';
              fields.codingSolution = f.solution || '';
              fields.codingAnalysis = f.analysis || '';
            } else {
              fields.genTheory = f.theory || '';
              fields.genExercise = f.exercise || '';
              fields.genSolution = f.solution || '';
            }

            ieltsVaultData.items.push({
              id: `migrated-${genItem.id}`,
              title: genItem.title || 'Tài liệu tự học',
              skill: skill,
              date: genItem.date || getCurrentDateKey(),
              mastery: genItem.mastery || 0,
              folder: genItem.folder || 'Tự học cũ',
              link: genItem.link || '',
              fields: fields
            });
          }
        });

        await window.taskAPI.saveGeneralVault({ items: [] });
        const savedData = await window.taskAPI.saveIeltsVault(ieltsVaultData);
        if (savedData && typeof savedData === 'object') {
          ieltsVaultData = savedData;
        }
      }
    } catch (migErr) {
      console.error('Migration from general vault failed:', migErr);
    }
  }
}

async function saveIeltsData() {
  if (window.taskAPI && window.taskAPI.saveIeltsVault) {
    const savedData = await window.taskAPI.saveIeltsVault(ieltsVaultData);
    if (savedData && typeof savedData === 'object') {
      ieltsVaultData = savedData;
    }
  } else {
    localStorage.setItem('web_ielts_vault', JSON.stringify(ieltsVaultData));
  }
  renderChallengeGrid();
  renderIeltsList();
}

async function loadGeneralData() {
  let data = null;
  if (window.taskAPI && window.taskAPI.loadGeneralVault) {
    data = await window.taskAPI.loadGeneralVault();
  } else {
    const stored = localStorage.getItem('web_general_vault');
    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored web_general_vault', e);
      }
    }
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    generalVaultData = data;
  } else if (data && Array.isArray(data)) {
    generalVaultData = {
      challengeStartDate: getCurrentDateKey(),
      items: data,
      folders: ["Mặc định"]
    };
  }

  if (!generalVaultData || typeof generalVaultData !== 'object' || Array.isArray(generalVaultData)) {
    generalVaultData = {
      challengeStartDate: getCurrentDateKey(),
      items: [],
      folders: ["Mặc định"]
    };
  }

  if (!generalVaultData.items || !Array.isArray(generalVaultData.items)) {
    generalVaultData.items = [];
  }
  if (!generalVaultData.challengeStartDate) {
    generalVaultData.challengeStartDate = getCurrentDateKey();
  }
  if (!generalVaultData.folders || !Array.isArray(generalVaultData.folders) || generalVaultData.folders.length === 0) {
    generalVaultData.folders = ["Mặc định"];
  }
}

async function saveGeneralData() {
  if (window.taskAPI && window.taskAPI.saveGeneralVault) {
    const savedData = await window.taskAPI.saveGeneralVault(generalVaultData);
    if (savedData && typeof savedData === 'object') {
      generalVaultData = savedData;
    }
  } else {
    localStorage.setItem('web_general_vault', JSON.stringify(generalVaultData));
  }
  renderGenChallengeGrid();
  renderGeneralList();
}

async function loadSpeakingData() {
  let data = null;
  if (window.taskAPI && window.taskAPI.loadSpeakingVault) {
    data = await window.taskAPI.loadSpeakingVault();
  } else {
    const stored = localStorage.getItem('web_speaking_vault');
    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored web_speaking_vault', e);
      }
    }
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    speakingVaultData = data;
  }

  if (!speakingVaultData || typeof speakingVaultData !== 'object' || Array.isArray(speakingVaultData)) {
    speakingVaultData = {
      items: []
    };
  }

  if (!speakingVaultData.items || !Array.isArray(speakingVaultData.items)) {
    speakingVaultData.items = [];
  }
}

async function saveSpeakingData() {
  if (window.taskAPI && window.taskAPI.saveSpeakingVault) {
    const savedData = await window.taskAPI.saveSpeakingVault(speakingVaultData);
    if (savedData && typeof savedData === 'object') {
      speakingVaultData = savedData;
    }
  } else {
    localStorage.setItem('web_speaking_vault', JSON.stringify(speakingVaultData));
  }
  renderSpeakingList();
}

// LocalStorage key for API Key
const GEMINI_KEY_STORAGE = 'ielts_gemini_api_key';

function initApiKeyBox() {
  const btnToggle = document.getElementById('btnToggleApiKey');
  const settingsBox = document.getElementById('apiKeySettingsBox');
  const inputKey = document.getElementById('geminiApiKey');
  const btnSave = document.getElementById('btnSaveApiKey');

  if (btnToggle && settingsBox && inputKey && btnSave) {
    const savedKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
    if (savedKey) {
      inputKey.value = savedKey;
    }

    btnToggle.addEventListener('click', () => {
      if (settingsBox.style.display === 'none') {
        settingsBox.style.display = 'flex';
      } else {
        settingsBox.style.display = 'none';
      }
    });

    btnSave.addEventListener('click', () => {
      const key = inputKey.value.trim();
      localStorage.setItem(GEMINI_KEY_STORAGE, key);
      settingsBox.style.display = 'none';
      playTone(600, 0.1, 'sine', 0.15);
      alert('Đã lưu API Key thành công!');
    });
  }
}

function updateFolderSelects(selectedFolder = 'Mặc định') {
  const filterFolder = document.getElementById('filterFolder');
  const ieltsFolder = document.getElementById('ieltsFolder');

  if (!ieltsVaultData.folders) {
    ieltsVaultData.folders = ["Mặc định"];
  }

  if (filterFolder) {
    const prevFilterVal = filterFolder.value || 'all';
    filterFolder.innerHTML = '<option value="all">📁 Tất cả Thư mục</option>';
    ieltsVaultData.folders.forEach(folder => {
      const opt = document.createElement('option');
      opt.value = folder;
      opt.textContent = `📁 ${folder}`;
      filterFolder.appendChild(opt);
    });
    filterFolder.value = prevFilterVal;
  }

  if (ieltsFolder) {
    ieltsFolder.innerHTML = '';
    ieltsVaultData.folders.forEach(folder => {
      const opt = document.createElement('option');
      opt.value = folder;
      opt.textContent = `📁 ${folder}`;
      ieltsFolder.appendChild(opt);
    });
    ieltsFolder.value = selectedFolder;
  }
}

async function handleCreateFolderPrompt() {
  const name = await showCustomPrompt('Nhập tên thư mục mới:');
  if (!name) return;

  const trimmed = name.trim();
  if (!ieltsVaultData.folders.includes(trimmed)) {
    ieltsVaultData.folders.push(trimmed);
    saveIeltsData();
    updateFolderSelects(trimmed);
    playTone(550, 0.1, 'sine', 0.1);
  } else {
    alert('Thư mục đã tồn tại!');
  }
}

function updateSkillSelects(selectedSkill = 'writing') {
  const filterSkill = document.getElementById('filterSkill');
  const ieltsSkill = document.getElementById('ieltsSkill');

  if (!ieltsVaultData.customSkills) {
    ieltsVaultData.customSkills = [];
  }

  const defaultSkills = [
    { value: 'writing', label: '✍️ Writing' },
    { value: 'speaking', label: '🗣️ Speaking' },
    { value: 'conversation', label: '🎙️ Nói & Giao Tiếp (Charisma)' },
    { value: 'reading', label: '📖 Reading' },
    { value: 'listening', label: '🎧 Listening' },
    { value: 'math', label: '📐 Toán Học' },
    { value: 'korean', label: '🇰🇷 Tiếng Hàn' },
    { value: 'japanese', label: '🇯🇵 Tiếng Nhật' },
    { value: 'coding', label: '💻 Lập Trình' },
    { value: 'other', label: '📚 Môn học khác' }
  ];

  const allSkills = [...defaultSkills];
  ieltsVaultData.customSkills.forEach(cs => {
    const val = cs.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
    if (!allSkills.some(s => s.value === val)) {
      allSkills.push({ value: val, label: `📚 ${cs}` });
    }
  });

  if (filterSkill) {
    const currentFilterVal = filterSkill.value || 'all';
    filterSkill.innerHTML = '<option value="all">📚 Tất cả Môn học / Kỹ năng</option>';
    allSkills.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.value;
      opt.textContent = s.label;
      filterSkill.appendChild(opt);
    });
    if (currentFilterVal && allSkills.some(s => s.value === currentFilterVal)) {
      filterSkill.value = currentFilterVal;
    } else {
      filterSkill.value = 'all';
    }
  }

  if (ieltsSkill) {
    const currentFormVal = ieltsSkill.value || selectedSkill;
    ieltsSkill.innerHTML = '';
    allSkills.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.value;
      opt.textContent = s.label;
      ieltsSkill.appendChild(opt);
    });
    if (allSkills.some(s => s.value === currentFormVal)) {
      ieltsSkill.value = currentFormVal;
    } else {
      ieltsSkill.value = 'writing';
    }
  }
}

async function handleCreateSkillPrompt() {
  const name = await showCustomPrompt('Nhập tên môn học hoặc kỹ năng mới:');
  if (!name) return;

  const trimmed = name.trim();
  if (!ieltsVaultData.customSkills) {
    ieltsVaultData.customSkills = [];
  }

  if (!ieltsVaultData.customSkills.includes(trimmed)) {
    ieltsVaultData.customSkills.push(trimmed);
    const val = trimmed.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
    saveIeltsData();
    updateSkillSelects(val);
    document.querySelectorAll('.skill-fields-group').forEach(el => {
      el.classList.remove('active');
    });
    const activeGroup = document.getElementById('fields-other');
    if (activeGroup) {
      activeGroup.classList.add('active');
    }
    if (typeof playTone === 'function') playTone(550, 0.1, 'sine', 0.1);
  } else {
    alert('Môn học / kỹ năng đã tồn tại!');
  }
}

function updateBulkFolderActionsVisibility() {
  const container = document.getElementById('bulkFolderActions');
  const countEl = document.getElementById('selectedCount');
  if (!container || !countEl) return;

  if (selectedIeltsItemIds.size > 0) {
    container.style.display = 'block';
    countEl.textContent = selectedIeltsItemIds.size;
  } else {
    container.style.display = 'none';
  }
}

async function handleBulkMoveToFolder() {
  if (selectedIeltsItemIds.size === 0) return;

  if (!ieltsVaultData.folders) {
    ieltsVaultData.folders = ["Mặc định"];
  }

  const foldersList = ieltsVaultData.folders.join(', ');
  const name = await showCustomPrompt(`Nhập tên thư mục để di chuyển các mục đã chọn:\n(Các thư mục hiện có: ${foldersList})`);
  if (name === null) return;
  const trimmed = name.trim();
  if (!trimmed) {
    alert('Tên thư mục không được để trống!');
    return;
  }

  const itemsToMove = ieltsVaultData.items.filter(item => selectedIeltsItemIds.has(item.id));
  if (itemsToMove.length > 0) {
    itemsToMove.forEach(item => {
      item.folder = trimmed;
    });
    if (!ieltsVaultData.folders.includes(trimmed)) {
      ieltsVaultData.folders.push(trimmed);
    }
    selectedIeltsItemIds.clear();
    saveIeltsData();
    updateFolderSelects(trimmed);
    updateBulkFolderActionsVisibility();
    if (typeof playTone === 'function') playTone(550, 0.1, 'sine', 0.1);
    alert(`Đã di chuyển thành công ${itemsToMove.length} mục vào thư mục "${trimmed}"!`);
  }
}

function updateGenFolderSelects(selectedFolder = 'Mặc định') {
  const filterGenFolder = document.getElementById('filterGenFolder');
  const generalFolder = document.getElementById('generalFolder');

  if (!generalVaultData.folders) {
    generalVaultData.folders = ["Mặc định"];
  }

  if (filterGenFolder) {
    const currentFilterVal = filterGenFolder.value;
    filterGenFolder.innerHTML = '<option value="all">📁 Tất cả Thư mục</option>';
    generalVaultData.folders.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = `📁 ${f}`;
      filterGenFolder.appendChild(opt);
    });
    if (generalVaultData.folders.includes(currentFilterVal)) {
      filterGenFolder.value = currentFilterVal;
    } else {
      filterGenFolder.value = 'all';
    }
  }

  if (generalFolder) {
    generalFolder.innerHTML = '';
    generalVaultData.folders.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      generalFolder.appendChild(opt);
    });
    generalFolder.value = selectedFolder;
  }
}

async function handleGenCreateFolderPrompt() {
  const name = await showCustomPrompt('Nhập tên thư mục mới:');
  if (name === null) return;
  const trimmed = name.trim();
  if (!trimmed) {
    alert('Tên thư mục không được để trống!');
    return;
  }
  if (!generalVaultData.folders.includes(trimmed)) {
    generalVaultData.folders.push(trimmed);
    saveGeneralData();
    updateGenFolderSelects(trimmed);
    playTone(550, 0.1, 'sine', 0.1);
  } else {
    alert('Thư mục đã tồn tại!');
  }
}

function showCustomPrompt(message, defaultValue = '') {
  return new Promise((resolve) => {
    const modal = document.getElementById('customPromptModal');
    const title = document.getElementById('customPromptTitle');
    const input = document.getElementById('customPromptInput');
    const btnCancel = document.getElementById('btnCustomPromptCancel');
    const btnOK = document.getElementById('btnCustomPromptOK');

    if (!modal || !title || !input || !btnCancel || !btnOK) {
      resolve(prompt(message, defaultValue));
      return;
    }

    title.textContent = message;
    input.value = defaultValue;
    modal.classList.add('active');
    input.focus();
    input.select();

    const cleanup = () => {
      modal.classList.remove('active');
      btnOK.removeEventListener('click', onOK);
      btnCancel.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKeyDown);
    };

    const onOK = () => {
      cleanup();
      resolve(input.value.trim());
    };

    const onCancel = () => {
      cleanup();
      resolve(null);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Enter') {
        onOK();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };

    btnOK.addEventListener('click', onOK);
    btnCancel.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKeyDown);
  });
}

function escapeJsonControlCharacters(jsonString) {
  let inString = false;
  let escaped = false;
  let result = '';

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];

    if (char === '"' && !escaped) {
      inString = !inString;
      result += char;
    } else if (inString) {
      if (char === '\\') {
        escaped = !escaped;
        result += char;
      } else {
        escaped = false;
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else {
          result += char;
        }
      }
    } else {
      escaped = false;
      result += char;
    }
  }

  return result;
}

function extractBalancedJson(text) {
  const startIdx = text.indexOf('{');
  if (startIdx === -1) return text;

  let braceCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];

    if (char === '"' && !escaped) {
      inString = !inString;
    }

    if (inString) {
      if (char === '\\') {
        escaped = !escaped;
      } else {
        escaped = false;
      }
    } else {
      escaped = false;
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return text.substring(startIdx, i + 1);
        }
      }
    }
  }

  const jsonMatch = text.trim().match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return text;
}

function stripJsonComments(str) {
  let inString = false;
  let escaped = false;
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '"' && !escaped) {
      inString = !inString;
      result += char;
    } else if (inString) {
      if (char === '\\') {
        escaped = !escaped;
      } else {
        escaped = false;
      }
      result += char;
    } else {
      escaped = false;
      if (char === '/' && str[i + 1] === '/') {
        while (i < str.length && str[i] !== '\n') {
          i++;
        }
        if (i < str.length) {
          result += str[i];
        }
      } else if (char === '/' && str[i + 1] === '*') {
        i += 2;
        while (i < str.length && !(str[i] === '*' && str[i + 1] === '/')) {
          i++;
        }
        i++;
      } else {
        result += char;
      }
    }
  }
  return result;
}

function parseAiJsonResponse(text) {
  let cleaned = text.trim();

  // 1. Extract balanced JSON block { ... } starting from the first '{'
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace !== -1) {
    let braceCount = 0;
    let inString = false;
    let escaped = false;
    let stringChar = null;
    let foundEnd = false;

    for (let i = firstBrace; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"' || char === "'") {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
      } else if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            cleaned = cleaned.substring(firstBrace, i + 1);
            foundEnd = true;
            break;
          }
        }
      }
    }
    // Fallback in case we couldn't find balanced braces:
    if (!foundEnd) {
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
    }
  }

  // 2. Strip comments (both single-line // and multi-line /* ... */)
  cleaned = stripJsonComments(cleaned);

  // 3. Try standard JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (firstErr) {
    console.warn('Standard JSON parse failed, trying repair...', firstErr);
  }

  // 4. Advanced state-machine-based JSON Repair:
  try {
    let repaired = '';
    let inString = false;
    let stringChar = null;
    let escaped = false;

    let containerStack = [];
    let isExpectKey = false;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (!inString) {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
          repaired += '"';
        } else if (char === '“' || char === '”') {
          inString = true;
          stringChar = '"';
          repaired += '"';
        } else {
          repaired += char;
          // Track nesting structure to differentiate keys vs values
          if (char === '{') {
            containerStack.push('OBJECT');
            isExpectKey = true;
          } else if (char === '[') {
            containerStack.push('ARRAY');
            isExpectKey = false;
          } else if (char === '}') {
            containerStack.pop();
            isExpectKey = (containerStack[containerStack.length - 1] === 'OBJECT');
          } else if (char === ']') {
            containerStack.pop();
            isExpectKey = (containerStack[containerStack.length - 1] === 'OBJECT');
          } else if (char === ':') {
            isExpectKey = false;
          } else if (char === ',') {
            isExpectKey = (containerStack[containerStack.length - 1] === 'OBJECT');
          }
        }
      } else {
        // Inside string
        if (escaped) {
          repaired += char;
          escaped = false;
        } else if (char === '\\') {
          repaired += char;
          escaped = true;
        } else if (char === stringChar || (stringChar === '"' && (char === '“' || char === '”'))) {
          // Check if this is the closing quote
          const remaining = cleaned.substring(i + 1).trim();
          let isClosing = false;

          if (remaining.length === 0) {
            isClosing = true;
          } else {
            if (isExpectKey) {
              // Key closing quote must be followed by ':'
              isClosing = remaining.startsWith(':');
            } else {
              // Value closing quote must be followed by ',' or '}' or ']'
              isClosing = remaining.startsWith(',') ||
                remaining.startsWith('}') ||
                remaining.startsWith(']');
            }
          }

          if (isClosing) {
            inString = false;
            stringChar = null;
            repaired += '"';
          } else {
            repaired += '\\"'; // Escape the inner quote
          }
        } else if (char === '\n') {
          repaired += '\\n';
        } else if (char === '\r') {
          repaired += '\\r';
        } else if (char === '\t') {
          repaired += '\\t';
        } else {
          repaired += char;
        }
      }
    }

    // 5. Post-process to remove trailing commas (e.g. ,} or ,])
    repaired = repaired.replace(/,\s*\}/g, '}').replace(/,\s*\]/g, ']');

    return JSON.parse(repaired);
  } catch (secondErr) {
    console.error('State-machine JSON repair failed, using ultimate split-key fallback...', secondErr);

    // Ultimate Key-Splitting Parser Fallback
    const result = {};
    const targetKeys = [
      'title', 'prompt', 'grammar', 'vocab', 'analysis', 'ideas',
      'sample', 'solution', 'question', 'outline', 'pron', 'passage',
      'keywords', 'sentence', 'tips', 'explanation', 'context',
      'spelling', 'transcript', 'problem', 'theory', 'steps',
      'concept', 'exercise', 'dialogue', 'translation'
    ];

    const keyPositions = [];
    targetKeys.forEach(key => {
      const regex = new RegExp(`(["'“]?)${key}\\1\\s*:`, 'gi');
      let match;
      while ((match = regex.exec(cleaned)) !== null) {
        keyPositions.push({
          key: key,
          start: match.index,
          valueStart: match.index + match[0].length
        });
      }
    });

    keyPositions.sort((a, b) => a.start - b.start);

    for (let idx = 0; idx < keyPositions.length; idx++) {
      const current = keyPositions[idx];
      const end = (idx + 1 < keyPositions.length) ? keyPositions[idx + 1].start : cleaned.length;

      let rawVal = cleaned.substring(current.valueStart, end).trim();

      // Clean up surrounding quotes, brackets, trailing commas, braces
      rawVal = rawVal.replace(/,[\s\n]*$/, '').trim();
      if (rawVal.endsWith('}') || rawVal.endsWith(']')) {
        rawVal = rawVal.substring(0, rawVal.length - 1).trim();
      }
      rawVal = rawVal.replace(/,[\s\n]*$/, '').trim();

      if ((rawVal.startsWith('"') && rawVal.endsWith('"')) ||
        (rawVal.startsWith("'") && rawVal.endsWith("'")) ||
        (rawVal.startsWith('“') && rawVal.endsWith('”'))) {
        rawVal = rawVal.substring(1, rawVal.length - 1).trim();
      }

      rawVal = rawVal
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');

      result[current.key] = rawVal;
    }

    if (Object.keys(result).length > 0) {
      return result;
    }
    throw new Error('Không thể phân tích dữ liệu AI. Chi tiết: ' + secondErr.message);
  }
}

function formatInputValue(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        const keys = Object.keys(item);
        if (keys.length === 2) {
          const val1 = item[keys[0]];
          const val2 = item[keys[1]];
          return `${val1}: ${val2}`;
        }
        return Object.entries(item)
          .map(([k, v]) => `${v}`)
          .join(' - ');
      }
      return String(item);
    }).join('\n');
  }
  if (typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  }
  return String(val);
}

function setInputValue(id, newVal) {
  const el = document.getElementById(id);
  if (el) {
    el.value = formatInputValue(newVal);
  }
}

function setInputValueIfEmpty(id, newVal) {
  const el = document.getElementById(id);
  if (el) {
    const currentVal = el.value.trim();
    if (!currentVal) {
      el.value = formatInputValue(newVal);
    }
  }
}

function cleanHtml(html) {
  let text = html;
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<\/tr>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n+/g, '\n\n');
  return text.trim();
}

async function handleFetchFromLink(type) {
  const linkEl = document.getElementById(type === 'ielts' ? 'ieltsLink' : 'generalLink');
  if (!linkEl || !linkEl.value.trim()) {
    alert('Vui lòng nhập hoặc dán liên kết trang web vào ô "Link đề thi" trước.');
    linkEl.focus();
    return;
  }

  const url = linkEl.value.trim();
  const btn = document.getElementById(type === 'ielts' ? 'btnFetchLink' : 'btnGenFetchLink');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Đang tải...';

  try {
    if (!window.taskAPI || !window.taskAPI.fetchUrl) {
      throw new Error('Tính năng tải link chỉ khả dụng trong ứng dụng Electron.');
    }

    let skill = '';
    let subject = '';
    if (type === 'ielts') {
      const ieltsSkillEl = document.getElementById('ieltsSkill');
      skill = ieltsSkillEl ? ieltsSkillEl.value : 'writing';
    } else {
      const generalSubjectEl = document.getElementById('generalSubject');
      subject = generalSubjectEl ? generalSubjectEl.value : '';
    }

    const fetchResult = await window.taskAPI.fetchUrl(url, { skill, subject });
    let html = '';
    let fetchedImages = [];
    if (fetchResult && typeof fetchResult === 'object') {
      html = fetchResult.html || '';
      fetchedImages = fetchResult.base64Images || [];
    } else {
      html = fetchResult || '';
    }

    const cleanText = cleanHtml(html);

    if (!cleanText) {
      throw new Error('Không thể trích xuất nội dung văn bản từ trang web này.');
    }

    let inputEl = null;

    if (type === 'ielts') {
      if (skill === 'writing') inputEl = document.getElementById('writePrompt');
      else if (skill === 'speaking') inputEl = document.getElementById('speakQuestion');
      else if (skill === 'conversation') inputEl = document.getElementById('convScenario');
      else if (skill === 'reading') inputEl = document.getElementById('readPassage');
      else if (skill === 'listening') inputEl = document.getElementById('listenContext');
    } else {
      const subject = document.getElementById('generalSubject').value;
      if (subject === 'math') inputEl = document.getElementById('mathProblem');
      else if (subject === 'korean') inputEl = document.getElementById('koreanVocab');
      else if (subject === 'japanese') inputEl = document.getElementById('japaneseVocab');
      else if (subject === 'coding') inputEl = document.getElementById('codingProblem');
      else if (subject === 'other') inputEl = document.getElementById('genTheory');
    }

    if (inputEl) {
      inputEl.value = cleanText;

      // Auto-populate extracted images for Writing
      if (type === 'ielts' && skill === 'writing' && fetchedImages.length > 0) {
        uploadedImages = [...uploadedImages, ...fetchedImages];
        renderImagePreviews();
      }

      playTone(550, 0.1, 'sine', 0.15);

      alert('Đã tải thành công nội dung trang web!');
    }
  } catch (err) {
    console.error('Fetch Link Error:', err);
    alert(`Lỗi khi tải trang web: ${err.message}\n\nLưu ý: Một số trang web bảo mật cao có thể chặn yêu cầu trực tiếp.`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function compileIeltsPrompt(skill, rawInput, targetBand = '9.0') {
  if (skill === 'writing') {
    return `You are an expert IELTS ${targetBand} writing teacher.
The user has pasted a block of text containing an IELTS Writing question/prompt and optionally other notes, outlines, and sample answers.
Input block:
${rawInput}

You MUST analyze or generate a complete Writing practice session containing BOTH IELTS Writing Task 1 and Writing Task 2.
- Writing Task 1: Academic report (describing a graph, chart, table, map, or process).
- Writing Task 2: Social issue essay (opinion, discussion, double question, or problem-solution essay).
If the input block only contains Task 1 or Task 2, you must generate a high-quality, realistic IELTS exam question for the missing task based on a relevant or related theme.

Analyze this block and extract/generate the following fields in Vietnamese. Provide highly detailed, high-quality, academic information:
1. "prompt": The clean, primary IELTS Writing Task 1 and Task 2 prompts/questions. Format clearly with "Task 1:" and "Task 2:" sub-headings.
2. "title": A short catchy title representing both tasks (e.g. "Writing Task 1 & 2 - Carbon Emissions & Global Warming").
3. "grammar": Grammar structures used or recommended for describing trends (Task 1) and expressing arguments/opinions (Task 2) to achieve Band ${targetBand}. Format with "Task 1:" and "Task 2:" headers.
4. "vocab": List of topic vocabulary (appropriate for Band ${targetBand}) with English definitions or Vietnamese translations for both Task 1 and Task 2.
5. "analysis": How to analyze the graph/essay question type step-by-step for both tasks.
6. "ideas": Key ideas/outlines to deploy for both Task 1 and Task 2.
7. "sample": Band ${targetBand} model sample essays for both Task 1 and Task 2. Write a pristine, full-length report for Task 1 and a complete, well-reasoned essay for Task 2, written exactly at Band ${targetBand} level. Separate them clearly with "Task 1:" and "Task 2:" headers.
8. "solution": Detailed analysis of the solution, notes, or tips for both Task 1 and Task 2.

Format your response strictly as a single JSON object. Do not wrap in markdown code blocks like \`\`\`json. Do not use ellipses (...) as values in the JSON object. The output must be valid JSON:
{
  "prompt": "[Task 1: Đề bài viết tả biểu đồ/sơ đồ chi tiết]\\n\\n[Task 2: Đề bài viết luận nghị luận xã hội chi tiết]",
  "title": "[Tiêu đề chung cho cả Task 1 và Task 2]",
  "grammar": "Task 1:\\n- [Các cấu trúc tả số liệu, xu hướng]\\nTask 2:\\n- [Các cấu trúc lập luận, nhượng bộ, đảo ngữ]",
  "vocab": "Task 1 (Tả số liệu):\\n- [Danh sách từ vựng]\\n\\nTask 2 (Viết luận):\\n- [Danh sách từ vựng]",
  "analysis": "Task 1:\\n- [Hướng dẫn phân tích đề]\\nTask 2:\\n- [Hướng dẫn phân tích đề]",
  "ideas": "Task 1:\\n- [Dàn ý chi tiết]\\nTask 2:\\n- [Dàn ý chi tiết]",
  "sample": "Task 1:\\n[Bài viết mẫu tả biểu đồ hoàn chỉnh Band ${targetBand}]\\n\\nTask 2:\\n[Bài viết luận mẫu hoàn chỉnh Band ${targetBand}]",
  "solution": "Task 1:\\n- [Lời khuyên và nhận xét]\\nTask 2:\\n- [Lời khuyên và nhận xét]"
}`;
  } else if (skill === 'speaking') {
    return `You are an expert IELTS ${targetBand} speaking coach.
The user has pasted a block of text containing an IELTS Speaking question, topic, or lesson notes.
Input block:
${rawInput}

You MUST generate or extract a complete, robust Speaking practice session containing ALL 3 PARTS of the IELTS Speaking exam (Part 1, Part 2, and Part 3):
- Part 1: Warm-up and introduction questions (3-4 questions with detailed sample answers).
- Part 2: Cue card topic question (1 topic card with 3-4 bullet points, outline, and sample answer).
- Part 3: Discussion questions related to the Part 2 topic (3-4 analytical questions with detailed sample answers).

Analyze this block and extract/generate speaking practice content in Vietnamese:
1. "question": The clean, structured IELTS speaking questions for Part 1, Part 2, and Part 3. You MUST format this clearly with section headers: "Part 1:", "Part 2:", and "Part 3:". If the input block only contains a single Part 2 cue card or a general topic, you must generate the missing Part 1 and Part 3 questions from scratch based on that topic.
2. "title": A short title for this speaking topic.
3. "vocab": Vocabulary (appropriate for Band ${targetBand}) to use for all parts.
4. "colloc": Collocations and idioms (appropriate for Band ${targetBand}) to use for all parts.
5. "outline": Detailed speaking outline and brainstorming ideas for the parts (especially Part 2 using the A.R.E.A framework: Answer, Reason, Example, Alternative).
6. "sample": A high-quality Band ${targetBand} model sample answer response for all 3 parts (Part 1 answers, Part 2 monologue, and Part 3 answers). If a sample response exists in the input block, adjust it to Band ${targetBand}; otherwise generate the answers from scratch at Band ${targetBand} level.
7. "pron": Pronunciation notes, stress, intonation, and connected speech highlights for the sample answers.

Format your response strictly as a single JSON object without markdown code blocks. Do not use ellipses (...) as values in the JSON object. The output must be valid JSON:
{
  "question": "[Trọn bộ câu hỏi IELTS Speaking Part 1, Part 2, Part 3 chi tiết]",
  "title": "[Tiêu đề chủ đề nói ngắn gọn]",
  "vocab": "[Từ vựng hay dùng nâng cao B2-C2]",
  "colloc": "[Cụm từ cố định Collocations và Idioms đắt giá]",
  "outline": "[Dàn bài và ý tưởng nói cho các phần theo cấu trúc A.R.E.A]",
  "sample": "[Toàn bộ bài mẫu trả lời Band ${targetBand} cho cả 3 phần Speaking]",
  "pron": "[Hướng dẫn phát âm, nối âm và ngữ điệu nổi bật]"
}`;
  } else if (skill === 'conversation') {
    return `You are a World-Class Charisma & High-Status Communication Mentor (Bậc Thầy Giao Tiếp Đẳng Cấp, Sức Hút Vị Thế Cao & Tạo Sự Ngưỡng Mộ Tuyệt Đối).
The user has provided a topic, scenario, conversational draft, or question:
Input block:
${rawInput}

TÔN CHỈ CỐT LÕI:
Mục tiêu tối thượng của bài phân tích là biến người nói thành một hình mẫu giao tiếp đỉnh cao (HIGH-VALUE, DEEPLY ADMIRED & INTELLECTUALLY FASCINATING). Khi người nói cất lời, người nghe phải lập tức CẢM THẤY NGƯỠNG MỘ, NỂ PHỤC, BỊ CUỐN HÚT VÀ TÔN TRỌNG SỰ THÔNG MINH, CHIỀU SÂU BẢN LĨNH CỦA HỌ.
Không phải khoe mẽ tự phụ, mà là phong thái tự tin điềm đạm (Quiet Confidence), góc nhìn khai phóng (Paradigm Shift), khiếu hài hước tinh tế (Subtle Wit) và sức hút của người có vị thế cao.

Analyze this block and create a comprehensive, highly admired conversational playbook in Vietnamese:

1. "title": Tiêu đề chiến lược nói chuyện đắt giá khiến người nghe ngưỡng mộ (Ví dụ: "Nghệ Thuật Nói Về [Chủ đề] Khiến Đối Phương Nể Phục & Cuốn Hút Tuyệt Đối").
2. "scenario": Bối cảnh & Tầm vóc tương tác (First date tinh tế, Gặp gỡ đối tác lớn, Trò chuyện nhóm bạn, Phỏng vấn đỉnh cao, Thảo luận bàn tiệc, Tranh luận vị thế cao...).
3. "opener": Mở đầu cuốn hút & Các câu hỏi "Level Triệu Đô" (High-Status Openers & Mind-Expanding Questions) - Câu hỏi mở khai phóng tư duy khiến đối phương lập tức nhận ra người nói có tầm nhìn khác biệt.
4. "knowledgeAngle": Đòn bẩy tri thức & Góc nhìn tinh hoa (Intellectual Hook & Trend Connection) - Cách kết nối kiến thức công nghệ/tâm lý/kinh tế/trend mạng xã hội một cách tự nhiên như hơi thở, đưa ra quy luật phi trực giác khiến người nghe thầm thốt lên: "Người này quá uyên bác và nhạy bén!".
5. "story": Story Bank Đẳng Cấp (Hero's Journey & Vulnerable Triumph) - Câu chuyện cá nhân ngắn có cấu trúc: Bối cảnh chân thực ➔ Thách thức/xung đột ➔ Chi tiết tự trào (Self-deprecating) hóm hỉnh ➔ Bước ngoặt tư duy bất ngờ (Twist) ➔ Bài học & Triết lý nhân sinh khiến người nghe nể phục bản lĩnh sống.
6. "humor": Humor Bank - Khiếu hài hước thông minh & Sắc sảo (High-EQ Wit, Subtle Sarcasm, Callback, Wordplay, Unexpected Punchline) kèm chỉ số an toàn Humor Risk (1-5) để giữ không khí lôi cuốn mà vẫn thanh lịch.
7. "perspective": Góc nhìn cá nhân sắc bén & Tầm nhìn lãnh đạo (Visionary Perspective & Deep Reasoning) - Phá vỡ tư duy nhị nguyên trắng/đen, nhìn thấu bản chất vấn đề từ nguyên lý gốc (First Principles), thể hiện chiều sâu của một người dẫn dắt tư tưởng.
8. "upgrades": Nâng cấp câu trả lời theo 5 CẤP ĐỘ đột phá:
   • Level 1 (Basic / NPC): Câu trả lời nhạt nhòa, thông thường của 90% số đông.
   • Level 2 (Polite / Natural): Lịch sự, tự nhiên, dễ chịu.
   • Level 3 (Smart & Interesting): Thú vị, có kiến thức, gợi sự tò mò.
   • Level 4 (Charismatic & Magnetic): Phong thái cuốn hút, sắc sảo, có năng lượng tích cực và cảm xúc kết nối.
   • Level 5 (Mind-Blowing & Admired - ĐỈNH CAO KHIẾN NGƯỜI NGHE NGƯỠNG MỘ & NỂ PHỤC): Đưa ra góc nhìn thay đổi nhận thức, vừa khiêm tốn vừa quyền lực, kết hợp triết lý sâu sắc khiến người nghe phải 'WOW' và nhớ mãi.
9. "socialEq": Đọc vị tâm lý đối phương & Quy tắc vị thế cao (Social Dynamics & Charisma Mastery) - Tỷ lệ nói/nghe (Talking Ratio), kiểm soát khoảng lặng quyền lực (Power Pause), cách làm người đối diện cảm thấy được thấu hiểu nhưng ngầm ngưỡng mộ bạn.

Format your response strictly as a single JSON object without markdown code blocks. Do not use ellipses (...) as values in the JSON object. The output must be valid JSON:
{
  "title": "[Tiêu đề bài luyện nói chuyện cuốn hút khiến người nghe ngưỡng mộ]",
  "scenario": "[Bối cảnh và đối tượng giao tiếp cụ thể]",
  "opener": "[Câu mở đầu cuốn hút và các câu hỏi mở đắt giá gợi chuyện]",
  "knowledgeAngle": "[Kiến thức / Trend và cách chuyển hóa mượt mà vào câu chuyện]",
  "story": "[Câu chuyện cá nhân ngắn có Hook, Twist và cảm xúc kết nối]",
  "humor": "[Miếng hài hước / Callback / Punchline thông minh kèm mức độ rủi ro Risk 1-5]",
  "perspective": "[Góc nhìn cá nhân độc đáo, sâu sắc và đa chiều]",
  "upgrades": "• Level 1 (Basic): [Câu trả lời cơ bản]\\n• Level 2 (Natural): [Tự nhiên]\\n• Level 3 (Interesting): [Thú vị, khơi mở]\\n• Level 4 (Charismatic): [Phong thái, thông minh]\\n• Level 5 (Magnetic & Admired): [Đỉnh cao sức hút khiến người nghe nể phục]",
  "socialEq": "[Lời khuyên đọc vị cảm xúc, điều chỉnh nhịp nói và nguyên tắc Charisma vàng]"
}`;
  } else if (skill === 'reading') {
    return `You are an expert IELTS reading instructor.
The user has pasted a block of text containing an IELTS reading passage and optionally other notes, questions, and guides.
Input block:
${rawInput}

Analyze this block and extract/generate study notes in Vietnamese:
1. "passage": The clean reading passage text extracted from the input block.
2. "title": A short title for this reading passage.
3. "keywords": Keyword matching table (vocabulary paraphrased in question vs text).
4. "sentence": Complex sentence breakdown (structural explanation & translation).
5. "tips": Reading tips and common traps for this type of reading passage.
6. "explanation": Detailed answers and explanations. For each question present in the input block, identify the correct answer, the exact sentence/context from the passage containing the answer, and explain why it is correct.

Format your response strictly as a single JSON object without markdown code blocks. Do not use ellipses (...) as values in the JSON object. The output must be valid JSON:
{
  "passage": "[Nội dung đoạn văn đọc chi tiết]",
  "title": "[Tiêu đề bài đọc]",
  "keywords": "[Bảng đối chiếu từ khóa trong câu hỏi và bài đọc]",
  "sentence": "[Phân tích cấu trúc các câu phức tạp và dịch nghĩa]",
  "tips": "[Mẹo làm bài và các bẫy cần tránh]",
  "explanation": "[Đáp án và giải thích chi tiết lý do chọn]"
}`;
  } else if (skill === 'listening') {
    return `You are an expert IELTS listening instructor.
The user has pasted a block of text containing an IELTS listening question context/transcript and optionally other notes.
Input block:
${rawInput}

Analyze this block and extract/generate listening study notes in Vietnamese:
1. "context": The clean listening question context extracted from the input block.
2. "title": A short title for this listening section.
3. "spelling": Spelling and sound traps (e.g. spelling of names, double letters, tricky numbers, homophones).
4. "vocab": Key vocabulary list.
5. "transcript": Transcript analysis or tips on identifying distractors.
6. "explanation": Detailed answers and explanations. For each question present in the input block, identify the correct answer, the exact sentence/transcript quote containing the answer, and explain why it is correct.

Format your response strictly as a single JSON object without markdown code blocks. Do not use ellipses (...) as values in the JSON object. The output must be valid JSON:
{
  "context": "[Nội dung ngữ cảnh câu hỏi nghe]",
  "title": "[Tiêu đề bài nghe]",
  "spelling": "[Các cạm bẫy phát âm, chính tả và cách nhận biết]",
  "vocab": "[Danh sách từ vựng trọng tâm bài nghe kèm nghĩa]",
  "transcript": "[Phân tích bản ghi âm Transcript và các bẫy làm nhiễu]",
  "explanation": "[Đáp án và giải thích chi tiết nguồn chứa câu trả lời]"
}`;
  }
  return '';
}

async function handleAiAnalyze() {
  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  if (!apiKey) {
    alert('Vui lòng cài đặt Gemini API Key ở khung "Gemini API Key" trước khi dùng tính năng AI.');
    const settingsBox = document.getElementById('apiKeySettingsBox');
    if (settingsBox) settingsBox.style.display = 'flex';
    return;
  }

  const skill = document.getElementById('ieltsSkill').value;
  let rawInput = '';

  if (skill === 'writing') {
    rawInput = document.getElementById('writePrompt').value.trim();
    if (!rawInput) rawInput = document.getElementById('writeSample').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán nội dung Đề bài / Bài mẫu vào ô đầu tiên hoặc Bài mẫu.');
      document.getElementById('writePrompt').focus();
      return;
    }
  } else if (skill === 'speaking') {
    rawInput = document.getElementById('speakQuestion').value.trim();
    if (!rawInput) rawInput = document.getElementById('speakSample').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán nội dung Câu hỏi / Bài nói vào ô đầu tiên hoặc Bài nói mẫu.');
      document.getElementById('speakQuestion').focus();
      return;
    }
  } else if (skill === 'conversation') {
    rawInput = document.getElementById('convScenario').value.trim();
    if (!rawInput) rawInput = document.getElementById('convOpener').value.trim();
    if (!rawInput) rawInput = document.getElementById('convKnowledgeAngle').value.trim();
    if (!rawInput) rawInput = document.getElementById('convStory').value.trim();
    if (!rawInput) rawInput = document.getElementById('convPerspective').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán nội dung Bối cảnh, Chủ đề trò chuyện hoặc Câu hỏi cần luyện nói.');
      document.getElementById('convScenario').focus();
      return;
    }
  } else if (skill === 'reading') {
    rawInput = document.getElementById('readPassage').value.trim();
    if (!rawInput) rawInput = document.getElementById('readExplanation').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán đoạn văn đọc vào ô đầu tiên hoặc Giải đề chi tiết.');
      document.getElementById('readPassage').focus();
      return;
    }
  } else if (skill === 'listening') {
    rawInput = document.getElementById('listenContext').value.trim();
    if (!rawInput) rawInput = document.getElementById('listenTranscript').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán nội dung nghe vào ô đầu tiên hoặc Phân tích Transcript.');
      document.getElementById('listenContext').focus();
      return;
    }
  }

  const btn = document.getElementById('btnAiAnalyze');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '🤖 Đang phân tích...';

  const bandEl = document.getElementById('selectAiBand');
  const targetBand = bandEl ? bandEl.value : '9.0';
  const fullPrompt = compileIeltsPrompt(skill, rawInput, targetBand);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.error && errJson.error.message) {
          errorMsg = errJson.error.message;
        }
      } catch (e) { }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    const rawText = result.candidates[0].content.parts[0].text.trim();
    const data = parseAiJsonResponse(rawText);
    if (data.title) {
      setInputValue('ieltsTitle', data.title);
    }

    if (skill === 'writing') {
      if (data.prompt) setInputValue('writePrompt', data.prompt);
      if (data.grammar) setInputValue('writeGrammar', data.grammar);
      if (data.vocab) setInputValue('writeVocab', data.vocab);
      if (data.analysis) setInputValue('writeAnalysis', data.analysis);
      if (data.ideas) setInputValue('writeIdeas', data.ideas);
      if (data.sample) setInputValue('writeSample', data.sample);
      if (data.solution) setInputValue('writeSolution', data.solution);
    } else if (skill === 'speaking') {
      if (data.question) setInputValue('speakQuestion', data.question);
      if (data.vocab) setInputValue('speakVocab', data.vocab);
      if (data.colloc) setInputValue('speakColloc', data.colloc);
      if (data.outline) setInputValue('speakOutline', data.outline);
      if (data.sample) setInputValue('speakSample', data.sample);
      if (data.pron) setInputValue('speakPron', data.pron);
    } else if (skill === 'conversation') {
      if (data.scenario) setInputValue('convScenario', data.scenario);
      if (data.opener) setInputValue('convOpener', data.opener);
      if (data.knowledgeAngle) setInputValue('convKnowledgeAngle', data.knowledgeAngle);
      if (data.story) setInputValue('convStory', data.story);
      if (data.humor) setInputValue('convHumor', data.humor);
      if (data.perspective) setInputValue('convPerspective', data.perspective);
      if (data.upgrades) setInputValue('convUpgrades', data.upgrades);
      if (data.socialEq) setInputValue('convSocialEq', data.socialEq);
    } else if (skill === 'reading') {
      if (data.passage) setInputValue('readPassage', data.passage);
      if (data.keywords) setInputValue('readKeywords', data.keywords);
      if (data.sentence) setInputValue('readSentence', data.sentence);
      if (data.tips) setInputValue('readTips', data.tips);
      if (data.explanation) setInputValue('readExplanation', data.explanation);
    } else if (skill === 'listening') {
      if (data.context) setInputValue('listenContext', data.context);
      if (data.spelling) setInputValue('listenSpelling', data.spelling);
      if (data.vocab) setInputValue('listenVocab', data.vocab);
      if (data.transcript) setInputValue('listenTranscript', data.transcript);
      if (data.explanation) setInputValue('listenExplanation', data.explanation);
    }
    playTone(800, 0.15, 'sine', 0.2);
    SFX.complete();
    alert('AI đã tự động phân tích, phân tách và điền vào các ô nội dung thành công!');

  } catch (err) {
    console.error('AI Error:', err);
    alert(`Lỗi AI Gemini: ${err.message}\n\nVui lòng kiểm tra lại API Key (Key hợp lệ của Google thường bắt đầu bằng chữ "AIzaSy") hoặc kết nối mạng của bạn.`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function copyTextToClipboard(text) {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(resolve).catch(() => {
        fallbackCopyText(text) ? resolve() : reject();
      });
    } else {
      fallbackCopyText(text) ? resolve() : reject();
    }
  });
}

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  let successful = false;
  try {
    successful = document.execCommand('copy');
  } catch (err) {
    successful = false;
  }
  document.body.removeChild(textArea);
  return successful;
}

function openExternalLink(url) {
  if (window.taskAPI && window.taskAPI.openExternal) {
    window.taskAPI.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

function handleWebAiPromptCopy() {
  const paneGeneral = document.getElementById('paneGeneral');
  const promptToCopy = (paneGeneral && paneGeneral.classList.contains('active')) ? activeGenWebAiPrompt : activeWebAiPrompt;
  if (!promptToCopy) {
    alert('Không tìm thấy Prompt để sao chép. Vui lòng đóng và thực hiện lại.');
    return;
  }
  copyTextToClipboard(promptToCopy).then(() => {
    playTone(550, 0.1, 'sine', 0.15);
    alert('Đã sao chép prompt vào Clipboard!');
  }).catch(() => {
    alert('Thao tác sao chép thất bại.');
  });
}

function handleWebAiImageCopy() {
  const paneGeneral = document.getElementById('paneGeneral');
  if (paneGeneral && paneGeneral.classList.contains('active')) {
    alert('Không tìm thấy ảnh để sao chép.');
    return;
  }
  const skill = document.getElementById('ieltsSkill').value;
  if (skill === 'writing' && uploadedImages.length > 0) {
    if (window.taskAPI && window.taskAPI.copyImage) {
      window.taskAPI.copyImage(uploadedImages[0]);
      playTone(550, 0.1, 'sine', 0.15);
      alert('Đã sao chép ảnh vào Clipboard!');
    } else {
      alert('Tính năng sao chép ảnh chỉ khả dụng trong ứng dụng Electron.');
    }
  } else {
    alert('Không có ảnh để sao chép.');
  }
}

function handleWebAiAssist() {
  const skill = document.getElementById('ieltsSkill').value;
  let rawInput = '';

  if (skill === 'writing') {
    rawInput = document.getElementById('writePrompt').value.trim();
    if (!rawInput) rawInput = document.getElementById('writeSample').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán nội dung Đề bài / Bài mẫu vào ô đầu tiên hoặc Bài mẫu.');
      document.getElementById('writePrompt').focus();
      return;
    }
  } else if (skill === 'speaking') {
    rawInput = document.getElementById('speakQuestion').value.trim();
    if (!rawInput) rawInput = document.getElementById('speakSample').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán nội dung Câu hỏi / Bài nói vào ô đầu tiên hoặc Bài nói mẫu.');
      document.getElementById('speakQuestion').focus();
      return;
    }
  } else if (skill === 'conversation') {
    rawInput = document.getElementById('convScenario').value.trim();
    if (!rawInput) rawInput = document.getElementById('convOpener').value.trim();
    if (!rawInput) rawInput = document.getElementById('convKnowledgeAngle').value.trim();
    if (!rawInput) rawInput = document.getElementById('convStory').value.trim();
    if (!rawInput) rawInput = document.getElementById('convPerspective').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán nội dung Bối cảnh, Chủ đề trò chuyện hoặc Câu hỏi cần luyện nói.');
      document.getElementById('convScenario').focus();
      return;
    }
  } else if (skill === 'reading') {
    rawInput = document.getElementById('readPassage').value.trim();
    if (!rawInput) rawInput = document.getElementById('readExplanation').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán đoạn văn đọc vào ô đầu tiên hoặc Giải đề chi tiết.');
      document.getElementById('readPassage').focus();
      return;
    }
  } else if (skill === 'listening') {
    rawInput = document.getElementById('listenContext').value.trim();
    if (!rawInput) rawInput = document.getElementById('listenTranscript').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán nội dung nghe vào ô đầu tiên hoặc Phân tích Transcript.');
      document.getElementById('listenContext').focus();
      return;
    }
  }

  const bandEl = document.getElementById('selectAiBand');
  const targetBand = bandEl ? bandEl.value : '9.0';
  activeWebAiPrompt = compileIeltsPrompt(skill, rawInput, targetBand);

  const copyImageBtn = document.getElementById('btnCopyWebAiImage');
  if (copyImageBtn) {
    if (skill === 'writing' && uploadedImages.length > 0) {
      copyImageBtn.style.display = 'inline-block';
    } else {
      copyImageBtn.style.display = 'none';
    }
  }

  copyTextToClipboard(activeWebAiPrompt).then(() => {
    document.getElementById('webAiJsonInput').value = '';
    document.getElementById('webAiModal').classList.add('active');
    playTone(440, 0.1, 'sine', 0.2);
  }).catch(err => {
    document.getElementById('webAiJsonInput').value = '';
    document.getElementById('webAiModal').classList.add('active');
    alert('Không thể tự động sao chép vào Clipboard. Vui lòng bấm nút "Copy lại Prompt" để copy thủ công.');
  });
}

function handleWebAiApply() {
  const paneGeneral = document.getElementById('paneGeneral');
  if (paneGeneral && paneGeneral.classList.contains('active')) {
    handleGenWebAiApply();
    return;
  }

  const skill = document.getElementById('ieltsSkill').value;
  let text = document.getElementById('webAiJsonInput').value.trim();
  if (!text) {
    alert('Vui lòng dán nội dung JSON phản hồi từ Gemini vào ô nhập liệu.');
    return;
  }

  try {
    const data = parseAiJsonResponse(text);
    if (data.title) {
      setInputValue('ieltsTitle', data.title);
    }

    if (skill === 'writing') {
      if (data.prompt) setInputValueIfEmpty('writePrompt', data.prompt);
      if (data.grammar) setInputValue('writeGrammar', data.grammar);
      if (data.vocab) setInputValue('writeVocab', data.vocab);
      if (data.analysis) setInputValue('writeAnalysis', data.analysis);
      if (data.ideas) setInputValue('writeIdeas', data.ideas);
      if (data.sample) setInputValue('writeSample', data.sample);
      if (data.solution) setInputValue('writeSolution', data.solution);
    } else if (skill === 'speaking') {
      if (data.question) setInputValueIfEmpty('speakQuestion', data.question);
      if (data.vocab) setInputValue('speakVocab', data.vocab);
      if (data.colloc) setInputValue('speakColloc', data.colloc);
      if (data.outline) setInputValue('speakOutline', data.outline);
      if (data.sample) setInputValue('speakSample', data.sample);
      if (data.pron) setInputValue('speakPron', data.pron);
    } else if (skill === 'conversation') {
      const sc = data.scenario || data.convScenario || data.context || data.situation || '';
      const op = data.opener || data.convOpener || data.questions || data.openerQuestions || '';
      const ka = data.knowledgeAngle || data.convKnowledgeAngle || data.knowledge || data.trend || '';
      const st = data.story || data.convStory || data.storytelling || '';
      const hu = data.humor || data.convHumor || data.joke || '';
      const ps = data.perspective || data.convPerspective || data.opinion || '';
      const up = data.upgrades || data.convUpgrades || data.responseUpgrades || data.levels || '';
      const eq = data.socialEq || data.convSocialEq || data.eq || data.takeaway || data.charismaRule || '';

      if (sc) setInputValue('convScenario', sc);
      if (op) setInputValue('convOpener', op);
      if (ka) setInputValue('convKnowledgeAngle', ka);
      if (st) setInputValue('convStory', st);
      if (hu) setInputValue('convHumor', hu);
      if (ps) setInputValue('convPerspective', ps);
      if (up) setInputValue('convUpgrades', up);
      if (eq) setInputValue('convSocialEq', eq);
    } else if (skill === 'reading') {
      if (data.passage) setInputValueIfEmpty('readPassage', data.passage);
      if (data.keywords) setInputValue('readKeywords', data.keywords);
      if (data.sentence) setInputValue('readSentence', data.sentence);
      if (data.tips) setInputValue('readTips', data.tips);
      if (data.explanation) setInputValue('readExplanation', data.explanation);
    } else if (skill === 'listening') {
      if (data.context) setInputValueIfEmpty('listenContext', data.context);
      if (data.spelling) setInputValue('listenSpelling', data.spelling);
      if (data.vocab) setInputValue('listenVocab', data.vocab);
      if (data.transcript) setInputValue('listenTranscript', data.transcript);
      if (data.explanation) setInputValue('listenExplanation', data.explanation);
    }
    document.getElementById('webAiModal').classList.remove('active');
    playTone(800, 0.15, 'sine', 0.2);
    SFX.complete();
    alert('Áp dụng kết quả phân tích từ Web AI thành công!');
  } catch (e) {
    alert('Không thể phân tích dữ liệu JSON vừa dán. Chi tiết lỗi: ' + e.message + '\n\nHướng dẫn: Hãy đảm bảo bạn copy toàn bộ khối JSON bắt đầu từ dấu { và kết thúc ở dấu } từ Gemini Web.');
  }
}

function saveInputStateForReload() {
  const state = {
    paneGeneralActive: document.getElementById('paneGeneral') ? document.getElementById('paneGeneral').classList.contains('active') : false,
    paneIeltsActive: document.getElementById('paneIelts') ? document.getElementById('paneIelts').classList.contains('active') : false,
    ieltsSkill: document.getElementById('ieltsSkill') ? document.getElementById('ieltsSkill').value : 'writing',
    generalSubject: document.getElementById('generalSubject') ? document.getElementById('generalSubject').value : 'math',

    writePrompt: document.getElementById('writePrompt') ? document.getElementById('writePrompt').value : '',
    speakQuestion: document.getElementById('speakQuestion') ? document.getElementById('speakQuestion').value : '',
    convScenario: document.getElementById('convScenario') ? document.getElementById('convScenario').value : '',
    convOpener: document.getElementById('convOpener') ? document.getElementById('convOpener').value : '',
    convKnowledgeAngle: document.getElementById('convKnowledgeAngle') ? document.getElementById('convKnowledgeAngle').value : '',
    convStory: document.getElementById('convStory') ? document.getElementById('convStory').value : '',
    convHumor: document.getElementById('convHumor') ? document.getElementById('convHumor').value : '',
    convPerspective: document.getElementById('convPerspective') ? document.getElementById('convPerspective').value : '',
    convUpgrades: document.getElementById('convUpgrades') ? document.getElementById('convUpgrades').value : '',
    convSocialEq: document.getElementById('convSocialEq') ? document.getElementById('convSocialEq').value : '',
    readPassage: document.getElementById('readPassage') ? document.getElementById('readPassage').value : '',
    listenContext: document.getElementById('listenContext') ? document.getElementById('listenContext').value : '',

    mathProblem: document.getElementById('mathProblem') ? document.getElementById('mathProblem').value : '',
    codingProblem: document.getElementById('codingProblem') ? document.getElementById('codingProblem').value : '',
    koreanVocab: document.getElementById('koreanVocab') ? document.getElementById('koreanVocab').value : '',
    japaneseVocab: document.getElementById('japaneseVocab') ? document.getElementById('japaneseVocab').value : '',
    genTheory: document.getElementById('genTheory') ? document.getElementById('genTheory').value : '',

    uploadedImages: uploadedImages || [],

    ieltsTitle: document.getElementById('ieltsTitle') ? document.getElementById('ieltsTitle').value : '',
    generalTitle: document.getElementById('generalTitle') ? document.getElementById('generalTitle').value : '',

    ieltsLink: document.getElementById('ieltsLink') ? document.getElementById('ieltsLink').value : '',
    generalLink: document.getElementById('generalLink') ? document.getElementById('generalLink').value : ''
  };

  localStorage.setItem('reload_preserved_state', JSON.stringify(state));
}

function restoreInputStateAfterReload() {
  const saved = localStorage.getItem('reload_preserved_state');
  if (!saved) return;

  try {
    const state = JSON.parse(saved);
    if (!state) return;

    if (state.writePrompt && document.getElementById('writePrompt')) document.getElementById('writePrompt').value = state.writePrompt;
    if (state.speakQuestion && document.getElementById('speakQuestion')) document.getElementById('speakQuestion').value = state.speakQuestion;
    if (state.convScenario && document.getElementById('convScenario')) document.getElementById('convScenario').value = state.convScenario;
    if (state.convOpener && document.getElementById('convOpener')) document.getElementById('convOpener').value = state.convOpener;
    if (state.convKnowledgeAngle && document.getElementById('convKnowledgeAngle')) document.getElementById('convKnowledgeAngle').value = state.convKnowledgeAngle;
    if (state.convStory && document.getElementById('convStory')) document.getElementById('convStory').value = state.convStory;
    if (state.convHumor && document.getElementById('convHumor')) document.getElementById('convHumor').value = state.convHumor;
    if (state.convPerspective && document.getElementById('convPerspective')) document.getElementById('convPerspective').value = state.convPerspective;
    if (state.convUpgrades && document.getElementById('convUpgrades')) document.getElementById('convUpgrades').value = state.convUpgrades;
    if (state.convSocialEq && document.getElementById('convSocialEq')) document.getElementById('convSocialEq').value = state.convSocialEq;
    if (state.readPassage && document.getElementById('readPassage')) document.getElementById('readPassage').value = state.readPassage;
    if (state.listenContext && document.getElementById('listenContext')) document.getElementById('listenContext').value = state.listenContext;

    if (state.mathProblem && document.getElementById('mathProblem')) document.getElementById('mathProblem').value = state.mathProblem;
    if (state.codingProblem && document.getElementById('codingProblem')) document.getElementById('codingProblem').value = state.codingProblem;
    if (state.koreanVocab && document.getElementById('koreanVocab')) document.getElementById('koreanVocab').value = state.koreanVocab;
    if (state.japaneseVocab && document.getElementById('japaneseVocab')) document.getElementById('japaneseVocab').value = state.japaneseVocab;
    if (state.genTheory && document.getElementById('genTheory')) document.getElementById('genTheory').value = state.genTheory;

    if (state.ieltsTitle && document.getElementById('ieltsTitle')) document.getElementById('ieltsTitle').value = state.ieltsTitle;
    if (state.generalTitle && document.getElementById('generalTitle')) document.getElementById('generalTitle').value = state.generalTitle;

    if (state.ieltsLink && document.getElementById('ieltsLink')) document.getElementById('ieltsLink').value = state.ieltsLink;
    if (state.generalLink && document.getElementById('generalLink')) document.getElementById('generalLink').value = state.generalLink;

    if (Array.isArray(state.uploadedImages) && state.uploadedImages.length > 0) {
      uploadedImages = state.uploadedImages;
      renderImagePreviews();
    }

    if (state.ieltsSkill && document.getElementById('ieltsSkill')) {
      document.getElementById('ieltsSkill').value = state.ieltsSkill;
      document.getElementById('ieltsSkill').dispatchEvent(new Event('change'));
    }
    if (state.generalSubject && document.getElementById('generalSubject')) {
      document.getElementById('generalSubject').value = state.generalSubject;
      document.getElementById('generalSubject').dispatchEvent(new Event('change'));
    }

    if (state.paneGeneralActive && document.getElementById('tabBtnGeneral')) {
      document.getElementById('tabBtnGeneral').click();
    } else if (state.paneIeltsActive && document.getElementById('tabBtnIelts')) {
      document.getElementById('tabBtnIelts').click();
    }

    setTimeout(() => {
      document.getElementById('webAiModal').classList.add('active');
    }, 100);

  } catch (e) {
    console.error('Failed to restore state after reload:', e);
  } finally {
    localStorage.removeItem('reload_preserved_state');
  }
}

function handleWebAiReload() {
  saveInputStateForReload();
  if (window.taskAPI && window.taskAPI.relaunchApp) {
    window.taskAPI.relaunchApp();
  } else {
    location.reload();
  }
}

// =========================================================
// 100-Day Video Challenge Module
// =========================================================
let videoProjectsData = { projects: [] };
let activeVideoProjectId = null;
let activeDayNumber = null;

async function loadVideoData() {
  let data = null;
  if (window.taskAPI && window.taskAPI.loadVideoChallenge) {
    data = await window.taskAPI.loadVideoChallenge();
  } else {
    const stored = localStorage.getItem('web_video_challenge');
    if (stored) {
      try { data = JSON.parse(stored); } catch (e) { console.error(e); }
    }
  }
  if (data && typeof data === 'object' && Array.isArray(data.projects)) {
    videoProjectsData = data;
  } else {
    videoProjectsData = { projects: [] };
  }
}

async function saveVideoData() {
  if (window.taskAPI && window.taskAPI.saveVideoChallenge) {
    await window.taskAPI.saveVideoChallenge(videoProjectsData);
  } else {
    localStorage.setItem('web_video_challenge', JSON.stringify(videoProjectsData));
  }
  renderVideoProjectsList();
}

function initVideoChallenge() {
  const btnNewVideoProject = document.getElementById('btnNewVideoProject');
  const btnSaveVideoProj = document.getElementById('btnSaveVideoProj');
  const btnLoadVideoJson = document.getElementById('btnLoadVideoJson');
  const btnDeleteVideoProj = document.getElementById('btnDeleteVideoProj');
  const btnVideoDayCancel = document.getElementById('btnVideoDayCancel');
  const btnVideoDaySave = document.getElementById('btnVideoDaySave');
  const btnCopyVideoPrompt = document.getElementById('btnCopyVideoPrompt');

  if (btnNewVideoProject) btnNewVideoProject.addEventListener('click', handleCreateVideoProject);
  if (btnSaveVideoProj) btnSaveVideoProj.addEventListener('click', handleSaveVideoProjConfig);
  if (btnLoadVideoJson) btnLoadVideoJson.addEventListener('click', handleLoadVideoJson);
  if (btnDeleteVideoProj) btnDeleteVideoProj.addEventListener('click', handleDeleteVideoProj);
  if (btnVideoDayCancel) btnVideoDayCancel.addEventListener('click', () => {
    document.getElementById('videoDayModal').classList.remove('active');
  });
  if (btnVideoDaySave) btnVideoDaySave.addEventListener('click', handleSaveVideoDayChanges);
  if (btnCopyVideoPrompt) btnCopyVideoPrompt.addEventListener('click', handleCopyVideoPrompt);

  renderVideoProjectsList();
}

function renderVideoProjectsList() {
  const list = document.getElementById('videoProjectList');
  if (!list) return;
  list.innerHTML = '';

  if (videoProjectsData.projects.length === 0) {
    list.innerHTML = `<li style="color: var(--muted); font-size: 11px; text-align: center; padding: 10px;">Chưa có dự án nào</li>`;
    return;
  }

  videoProjectsData.projects.forEach(proj => {
    const li = document.createElement('li');
    li.className = 'ielts-item-card';
    if (proj.id === activeVideoProjectId) {
      li.classList.add('active');
    }

    // Calculate progress
    const completedCount = proj.days ? proj.days.filter(d => d.completed).length : 0;

    li.innerHTML = `
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 600; font-size: 12px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escHtml(proj.name)}</div>
        <div style="font-size: 10px; color: var(--muted); margin-top: 4px; display: flex; justify-content: space-between;">
          <span>🎯 Tiến độ: ${completedCount}/100</span>
        </div>
      </div>
    `;

    li.addEventListener('click', () => {
      activeVideoProjectId = proj.id;
      renderVideoProjectsList();
      renderVideoProjectDetail();
      if (typeof playTone === 'function') playTone(500, 0.08, 'sine', 0.1);
    });

    list.appendChild(li);
  });
}

async function handleCreateVideoProject() {
  const name = await showCustomPrompt('Nhập tên dự án 100 ngày làm video:');
  if (!name) return;

  const newProj = {
    id: 'vid-' + Date.now(),
    name: name.trim(),
    topic: '',
    budget: '',
    sources: '',
    skills: '',
    props: '',
    env: '',
    edit: '',
    tech: '',
    days: []
  };

  // Pre-generate 100 empty days
  for (let i = 1; i <= 100; i++) {
    newProj.days.push({
      day: i,
      title: `Ngày ${i}: Chưa cấu hình`,
      outline: 'Dán kết quả JSON hoặc tự điền kịch bản cho ngày này.',
      cost: 0,
      props: '',
      filter: '',
      sound: '',
      hook: '',
      completed: false,
      notes: ''
    });
  }

  videoProjectsData.projects.push(newProj);
  activeVideoProjectId = newProj.id;
  saveVideoData();
  renderVideoProjectDetail();
  if (typeof playTone === 'function') playTone(550, 0.1, 'sine', 0.1);
}

function renderVideoProjectDetail() {
  const welcome = document.getElementById('videoWelcomeState');
  const activeState = document.getElementById('videoActiveState');
  const formContainer = document.getElementById('videoProjectFormContainer');

  if (!activeVideoProjectId) {
    if (welcome) welcome.classList.add('active');
    if (activeState) activeState.style.display = 'none';
    if (formContainer) formContainer.style.display = 'none';
    return;
  }

  const proj = videoProjectsData.projects.find(p => p.id === activeVideoProjectId);
  if (!proj) {
    activeVideoProjectId = null;
    renderVideoProjectsList();
    renderVideoProjectDetail();
    return;
  }

  if (welcome) welcome.classList.remove('active');
  if (activeState) activeState.style.display = 'flex';
  if (formContainer) formContainer.style.display = 'flex';

  // Set form fields
  document.getElementById('videoProjName').value = proj.name || '';
  document.getElementById('videoProjTopic').value = proj.topic || '';
  document.getElementById('videoProjBudget').value = proj.budget || '';
  document.getElementById('videoProjSources').value = proj.sources || '';
  document.getElementById('videoProjSkills').value = proj.skills || '';
  document.getElementById('videoProjProps').value = proj.props || '';
  document.getElementById('videoProjEnv').value = proj.env || '';
  document.getElementById('videoProjEdit').value = proj.edit || '';
  document.getElementById('videoProjTech').value = proj.tech || '';

  // Render header info
  document.getElementById('activeProjTitle').textContent = proj.name;
  document.getElementById('activeProjSub').textContent = `Chủ đề: ${proj.topic || 'Chưa điền'} | Ngân sách: ${proj.budget ? parseInt(proj.budget).toLocaleString() + ' VND' : 'Chưa thiết lập'}`;

  // Calculate stats & progress
  const totalDays = 100;
  const completedCount = proj.days ? proj.days.filter(d => d.completed).length : 0;
  const progressPercent = Math.min(100, Math.round((completedCount / totalDays) * 100));

  document.getElementById('videoProgressText').textContent = `Hoàn thành: ${completedCount} / 100 video`;
  document.getElementById('videoProgressFill').style.width = `${progressPercent}%`;

  // Render 100-day grid
  const grid = document.getElementById('videoDaysGrid');
  if (grid) {
    grid.innerHTML = '';

    // Make sure days array has elements
    if (!proj.days || proj.days.length === 0) {
      proj.days = [];
      for (let i = 1; i <= 100; i++) {
        proj.days.push({
          day: i,
          title: `Ngày ${i}: Chưa cấu hình`,
          outline: 'Dán kết quả JSON hoặc tự điền kịch bản cho ngày này.',
          cost: 0,
          props: '',
          filter: '',
          sound: '',
          hook: '',
          completed: false,
          notes: ''
        });
      }
    }

    proj.days.forEach(dayItem => {
      const card = document.createElement('div');
      card.className = 'video-day-card';
      if (dayItem.completed) {
        card.classList.add('completed');
      }

      card.innerHTML = `
        <div class="video-day-num">Ngày ${dayItem.day}</div>
        <div class="video-day-title" title="${escHtml(dayItem.title)}">${escHtml(dayItem.title)}</div>
        <div class="video-day-meta">
          <span>💰 ${dayItem.cost ? parseInt(dayItem.cost).toLocaleString() : '0'}đ</span>
          <input type="checkbox" class="video-day-checkbox" ${dayItem.completed ? 'checked' : ''} />
        </div>
      `;

      // Checkbox click
      const cb = card.querySelector('.video-day-checkbox');
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      cb.addEventListener('change', (e) => {
        dayItem.completed = cb.checked;
        saveVideoData();
        renderVideoProjectDetail();
      });

      // Card click opens detail modal
      card.addEventListener('click', () => {
        showVideoDayModal(dayItem.day);
      });

      grid.appendChild(card);
    });
  }
}

function handleSaveVideoProjConfig() {
  if (!activeVideoProjectId) return;
  const proj = videoProjectsData.projects.find(p => p.id === activeVideoProjectId);
  if (!proj) return;

  proj.name = document.getElementById('videoProjName').value.trim() || proj.name;
  proj.topic = document.getElementById('videoProjTopic').value.trim();
  proj.budget = document.getElementById('videoProjBudget').value.trim();
  proj.sources = document.getElementById('videoProjSources').value.trim();
  proj.skills = document.getElementById('videoProjSkills').value.trim();
  proj.props = document.getElementById('videoProjProps').value.trim();
  proj.env = document.getElementById('videoProjEnv').value.trim();
  proj.edit = document.getElementById('videoProjEdit').value.trim();
  proj.tech = document.getElementById('videoProjTech').value.trim();

  saveVideoData();
  renderVideoProjectDetail();
  alert('Đã lưu cấu hình dự án thành công!');
}

function handleCopyVideoPrompt() {
  if (!activeVideoProjectId) return;

  const topic = document.getElementById('videoProjTopic').value.trim() || '(Chưa điền)';
  const budgetVal = document.getElementById('videoProjBudget').value.trim();
  const budget = budgetVal ? parseInt(budgetVal).toLocaleString() + ' VND' : '(Chưa điền)';
  const sources = document.getElementById('videoProjSources').value.trim() || '(Chưa điền)';
  const skills = document.getElementById('videoProjSkills').value.trim() || '(Chưa điền)';
  const props = document.getElementById('videoProjProps').value.trim() || '(Chưa điền)';
  const env = document.getElementById('videoProjEnv').value.trim() || '(Chưa điền)';
  const edit = document.getElementById('videoProjEdit').value.trim() || '(Chưa điền)';
  const tech = document.getElementById('videoProjTech').value.trim() || '(Chưa điền)';

  const promptText = `Hãy giúp tôi lên ý tưởng cực kỳ chi tiết, dài và đầy đủ nhất có thể cho chuỗi thử thách 100 ngày, mỗi ngày làm 1 video ngắn (dưới 60 giây). Mục tiêu là mỗi ngày nhìn vào kịch bản là có thể hình dung ra góc quay, lời thoại, âm thanh và thực hiện quay được ngay lập tức mà không cần suy nghĩ thêm.

Dưới đây là thông tin về các tài nguyên hiện tại của tôi (hãy sử dụng chúng làm cơ sở dữ liệu để lên kế hoạch):
- Chủ đề chính: ${topic}
- Ngân sách tổng (Budget): ${budget}
- Các nguồn tài nguyên / chủ đề tôi có thể làm: ${sources}
- Kỹ năng / Khả năng của tôi: ${skills}
- Vật phẩm sẵn có / Đạo cụ: ${props}
- Môi trường & Địa điểm quay: ${env}
- Cách edit / Editing styles: ${edit}
- Kỹ năng làm video / Quay chụp: ${tech}

Kế hoạch phải được trả về DƯỚI DẠNG MỘT ĐỐI TƯỢNG JSON HỢP LỆ (valid JSON object) duy nhất, không thêm bất kỳ văn bản giải thích nào khác ngoài JSON.

Cấu trúc đối tượng JSON phải như sau:
{
  "name": "[Tên dự án thu hút, ví dụ: 100 Ngày Chinh Phục Javascript Thực Chiến]",
  "topic": "${topic}",
  "budget": ${budgetVal ? parseInt(budgetVal) : 1000000},
  "sources": "${sources}",
  "skills": "${skills}",
  "props": "${props}",
  "env": "${env}",
  "edit": "${edit}",
  "tech": "${tech}",
  "days": [
    {
      "day": 1,
      "title": "[Tiêu đề video ngắn gọn, cực kỳ thu hút, giật tít và tò mò]",
      "outline": "[Kịch bản chi tiết từng phân cảnh quay (mô tả rõ góc máy, hành động) kèm theo lời thoại (voice-over hoặc thoại trực tiếp) thật dài, chi tiết để nhìn vào là hình dung được video luôn]",
      "cost": [Chi phí ước tính cụ thể cho ngày này dưới dạng số],
      "props": "[Đạo cụ chi tiết cần chuẩn bị cho ngày này]",
      "filter": "[Tên bộ lọc màu sắc hình ảnh gợi ý, mô tả chi tiết phong cách màu/ánh sáng phù hợp với kịch bản]",
      "sound": "[Nhạc nền, hiệu ứng âm thanh sound effect chi tiết tại từng phân cảnh gợi ý]",
      "hook": "[Câu thoại mở đầu video (3 giây đầu) thật giật gân, cuốn hút viết chi tiết nguyên văn]"
    }
  ]
}

Hãy trả về chính xác chuỗi JSON để tôi có thể sao chép trực tiếp.`;

  navigator.clipboard.writeText(promptText).then(() => {
    alert('Đã sao chép prompt AI thành công! Bạn có thể dán (Ctrl+V) vào Gemini hoặc ChatGPT để sinh lịch trình.');
  }).catch(err => {
    console.error('Failed to copy prompt:', err);
    alert('Không thể sao chép tự động. Hãy sao chép tay.');
  });
}

async function handleAutoFillVideoAi() {
  if (!activeVideoProjectId) {
    alert('Vui lòng chọn hoặc tạo một dự án trước.');
    return;
  }
  const proj = videoProjectsData.projects.find(p => p.id === activeVideoProjectId);
  if (!proj) return;

  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  if (!apiKey) {
    alert('Vui lòng cài đặt Gemini API Key ở khung "Gemini API Key" trước khi dùng tính năng AI.');
    const settingsBox = document.getElementById('apiKeySettingsBox');
    if (settingsBox) settingsBox.style.display = 'flex';
    return;
  }

  const topic = proj.topic || '(Chưa điền)';
  const budget = proj.budget ? parseInt(proj.budget).toLocaleString() + ' VND' : '(Chưa điền)';
  const sources = proj.sources || '(Chưa điền)';
  const skills = proj.skills || '(Chưa điền)';
  const props = proj.props || '(Chưa điền)';
  const env = proj.env || '(Chưa điền)';
  const edit = proj.edit || '(Chưa điền)';
  const tech = proj.tech || '(Chưa điền)';

  const promptText = `Hãy giúp tôi lên ý tưởng chi tiết cho chuỗi thử thách 100 ngày, mỗi ngày làm 1 video ngắn (dưới 60 giây). 
Dưới đây là thông tin về các tài nguyên của tôi:
- Chủ đề chính: ${topic}
- Ngân sách tổng (Budget): ${budget}
- Các nguồn tài nguyên / chủ đề tôi có thể làm: ${sources}
- Kỹ năng / Khả năng của tôi: ${skills}
- Vật phẩm sẵn có / Đạo cụ: ${props}
- Môi trường & Địa điểm quay: ${env}
- Cách edit / Editing styles: ${edit}
- Kỹ năng làm video / Quay chụp: ${tech}

Hãy lập kế hoạch cho 100 ngày sao cho phân bổ ngân sách hợp lý nhất, tận dụng tối đa đạo cụ và môi trường tôi có, đồng thời phù hợp với khả năng của tôi để duy trì chuỗi 100 ngày mỗi ngày 1 video. Kế hoạch phải được trả về DƯỚI DẠNG MỘT MẢNG JSON HỢP LỆ (valid JSON array) duy nhất, không thêm bất kỳ văn bản giải thích nào khác ngoài JSON.

Mỗi phần tử trong mảng JSON có định dạng như sau:
{
  "day": 1,
  "title": "[Tiêu đề video ngắn gọn, thu hút]",
  "outline": "[Ý tưởng chính và dàn ý ngắn cho kịch bản/nội dung]",
  "cost": [Chi phí ước tính cho ngày này dưới dạng số],
  "props": "[Đạo cụ cần dùng cho video này]"
}

Hãy trả về chính xác chuỗi JSON để tôi có thể sao chép trực tiếp.`;

  const btn = document.getElementById('btnAutoFillVideoAi');
  if (!btn) return;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '🤖 Đang lập lịch trình bằng AI...';

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.error && errJson.error.message) {
          errorMsg = errJson.error.message;
        }
      } catch (e) { }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    const rawText = result.candidates[0].content.parts[0].text.trim();

    const startIdx = rawText.indexOf('[');
    const endIdx = rawText.lastIndexOf(']');
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      throw new Error('Không tìm thấy mảng JSON hợp lệ từ kết quả AI. Hãy thử lại.');
    }
    const cleanJson = rawText.substring(startIdx, endIdx + 1);
    const parsed = JSON.parse(cleanJson);

    if (!Array.isArray(parsed)) {
      throw new Error('Kết quả trả về không phải là mảng JSON hợp lệ.');
    }

    const cleanedDays = [];
    for (let i = 1; i <= 100; i++) {
      const dayItem = parsed.find(d => parseInt(d.day) === i);
      if (dayItem) {
        cleanedDays.push({
          day: i,
          title: dayItem.title || `Video Ngày ${i}`,
          outline: dayItem.outline || dayItem.idea || 'Chưa điền',
          cost: parseInt(dayItem.cost) || 0,
          props: dayItem.props || '',
          completed: false,
          notes: ''
        });
      } else {
        cleanedDays.push({
          day: i,
          title: `Ngày ${i}: Chưa có lịch trình`,
          outline: 'Không có dữ liệu từ AI cho ngày này.',
          cost: 0,
          props: '',
          completed: false,
          notes: ''
        });
      }
    }

    proj.days = cleanedDays;
    saveVideoData();
    renderVideoProjectDetail();

    if (typeof playTone === 'function') {
      playTone(800, 0.15, 'sine', 0.2);
    }
    if (typeof SFX !== 'undefined' && SFX.complete) {
      SFX.complete();
    }
    alert('AI đã tự động lập lịch trình 100 ngày thành công!');
  } catch (err) {
    console.error('Video AI Error:', err);
    alert(`Lỗi AI Gemini: ${err.message}\n\nVui lòng kiểm tra lại API Key hoặc kết nối mạng của bạn.`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function handleLoadVideoJson() {
  if (!activeVideoProjectId) return;
  const proj = videoProjectsData.projects.find(p => p.id === activeVideoProjectId);
  if (!proj) return;

  const jsonArea = document.getElementById('videoJsonInput');
  const jsonText = jsonArea ? jsonArea.value.trim() : '';
  if (!jsonText) {
    alert('Vui lòng dán chuỗi JSON nhận được từ AI trước!');
    return;
  }

  try {
    const firstChar = jsonText.match(/[\[\{]/);
    if (!firstChar) {
      throw new Error('Không tìm thấy định dạng JSON hợp lệ (thiếu ký tự [ hoặc {).');
    }
    const startIdx = jsonText.indexOf(firstChar[0]);
    const endChar = firstChar[0] === '[' ? ']' : '}';
    const endIdx = jsonText.lastIndexOf(endChar);
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      throw new Error(`Không tìm thấy ký tự đóng tương ứng (${endChar}).`);
    }
    const cleanJson = jsonText.substring(startIdx, endIdx + 1);

    const parsed = JSON.parse(cleanJson);
    let daysArray = null;

    if (Array.isArray(parsed)) {
      daysArray = parsed;
    } else if (parsed && typeof parsed === 'object') {
      // It's a project object containing metadata & days
      if (parsed.name) proj.name = parsed.name;
      if (parsed.topic) proj.topic = parsed.topic;
      if (parsed.budget) proj.budget = String(parsed.budget);
      if (parsed.sources) proj.sources = parsed.sources;
      if (parsed.skills) proj.skills = parsed.skills;
      if (parsed.props) proj.props = parsed.props;
      if (parsed.env) proj.env = parsed.env;
      if (parsed.edit) proj.edit = parsed.edit;
      if (parsed.tech) proj.tech = parsed.tech;

      // Update the DOM elements in left column immediately
      if (parsed.name) document.getElementById('videoProjName').value = parsed.name;
      if (parsed.topic) document.getElementById('videoProjTopic').value = parsed.topic;
      if (parsed.budget) document.getElementById('videoProjBudget').value = String(parsed.budget);
      if (parsed.sources) document.getElementById('videoProjSources').value = parsed.sources;
      if (parsed.skills) document.getElementById('videoProjSkills').value = parsed.skills;
      if (parsed.props) document.getElementById('videoProjProps').value = parsed.props;
      if (parsed.env) document.getElementById('videoProjEnv').value = parsed.env;
      if (parsed.edit) document.getElementById('videoProjEdit').value = parsed.edit;
      if (parsed.tech) document.getElementById('videoProjTech').value = parsed.tech;

      if (Array.isArray(parsed.days)) {
        daysArray = parsed.days;
      }
    }

    if (!daysArray) {
      throw new Error('Dữ liệu JSON không chứa danh sách kịch bản 100 ngày (mảng days).');
    }

    const cleanedDays = [];
    for (let i = 1; i <= 100; i++) {
      const dayItem = daysArray.find(d => parseInt(d.day) === i);
      const existingDay = proj.days.find(d => d.day === i);
      if (dayItem) {
        cleanedDays.push({
          day: i,
          title: dayItem.title || (existingDay ? existingDay.title : `Video Ngày ${i}`),
          outline: dayItem.outline || dayItem.idea || (existingDay ? existingDay.outline : 'Chưa điền'),
          cost: parseInt(dayItem.cost) || (existingDay ? existingDay.cost : 0),
          props: dayItem.props || (existingDay ? existingDay.props : ''),
          filter: dayItem.filter || (existingDay ? existingDay.filter : ''),
          sound: dayItem.sound || dayItem.sound_effect || (existingDay ? existingDay.sound : ''),
          hook: dayItem.hook || (existingDay ? existingDay.hook : ''),
          completed: existingDay ? existingDay.completed : false,
          notes: existingDay ? existingDay.notes : ''
        });
      } else {
        cleanedDays.push({
          day: i,
          title: existingDay ? existingDay.title : `Ngày ${i}: Chưa có kịch bản`,
          outline: existingDay ? existingDay.outline : 'Không có kịch bản cho ngày này.',
          cost: existingDay ? existingDay.cost : 0,
          props: existingDay ? existingDay.props : '',
          filter: existingDay ? existingDay.filter : '',
          sound: existingDay ? existingDay.sound : '',
          hook: existingDay ? existingDay.hook : '',
          completed: existingDay ? existingDay.completed : false,
          notes: existingDay ? existingDay.notes : ''
        });
      }
    }

    proj.days = cleanedDays;
    saveVideoData();
    renderVideoProjectDetail();
    if (jsonArea) jsonArea.value = '';
    alert('Nhập lịch trình kịch bản và cấu hình dự án thành công!');
  } catch (e) {
    alert('Lỗi phân tích JSON: ' + e.message + '\nHãy chắc chắn bạn sao chép toàn bộ văn bản JSON hợp lệ.');
  }
}

function handleDeleteVideoProj() {
  if (!activeVideoProjectId) return;
  if (confirm('Bạn có chắc chắn muốn xóa dự án này? Toàn bộ 100 ngày đã lưu sẽ mất.')) {
    videoProjectsData.projects = videoProjectsData.projects.filter(p => p.id !== activeVideoProjectId);
    activeVideoProjectId = null;
    saveVideoData();
    renderVideoProjectDetail();
  }
}

function showVideoDayModal(dayNum) {
  if (!activeVideoProjectId) return;
  const proj = videoProjectsData.projects.find(p => p.id === activeVideoProjectId);
  if (!proj || !proj.days) return;

  const dayItem = proj.days.find(d => d.day === dayNum);
  if (!dayItem) return;

  activeDayNumber = dayNum;

  document.getElementById('videoDayModalHeader').textContent = `Chi tiết Video Ngày ${dayNum}`;
  document.getElementById('videoDayTitle').value = dayItem.title || '';
  document.getElementById('videoDayOutline').value = dayItem.outline || '';
  document.getElementById('videoDayCost').value = dayItem.cost || 0;
  document.getElementById('videoDayProps').value = dayItem.props || '';
  document.getElementById('videoDayFilter').value = dayItem.filter || '';
  document.getElementById('videoDaySound').value = dayItem.sound || '';
  document.getElementById('videoDayHook').value = dayItem.hook || '';
  document.getElementById('videoDayNotes').value = dayItem.notes || '';

  document.getElementById('videoDayModal').classList.add('active');
}

function handleSaveVideoDayChanges() {
  if (!activeVideoProjectId || !activeDayNumber) return;
  const proj = videoProjectsData.projects.find(p => p.id === activeVideoProjectId);
  if (!proj || !proj.days) return;

  const dayItem = proj.days.find(d => d.day === activeDayNumber);
  if (!dayItem) return;

  dayItem.title = document.getElementById('videoDayTitle').value.trim() || `Ngày ${activeDayNumber}: Chưa cấu hình`;
  dayItem.outline = document.getElementById('videoDayOutline').value.trim();
  dayItem.cost = parseInt(document.getElementById('videoDayCost').value) || 0;
  dayItem.props = document.getElementById('videoDayProps').value.trim();
  dayItem.filter = document.getElementById('videoDayFilter').value.trim();
  dayItem.sound = document.getElementById('videoDaySound').value.trim();
  dayItem.hook = document.getElementById('videoDayHook').value.trim();
  dayItem.notes = document.getElementById('videoDayNotes').value.trim();

  document.getElementById('videoDayModal').classList.remove('active');
  saveVideoData();
  renderVideoProjectDetail();
  if (typeof playTone === 'function') playTone(500, 0.08, 'sine', 0.1);
}

function initTabs() {
  const tabs = [
    { btn: document.getElementById('tabBtnTasks'), pane: document.getElementById('paneTasks') },
    { btn: document.getElementById('tabBtnTimer'), pane: document.getElementById('paneTimer'), onOpen: () => { if (typeof initTimerTab === 'function') initTimerTab(); } },
    { btn: document.getElementById('tabBtnIelts'), pane: document.getElementById('paneIelts'), onOpen: () => { renderChallengeGrid(); renderIeltsList(); } },
    { btn: document.getElementById('tabBtnSpeaking'), pane: document.getElementById('paneSpeaking'), onOpen: () => { renderSpeakingList(); } },
    { btn: document.getElementById('tabBtnVideoChallenge'), pane: document.getElementById('paneVideoChallenge'), onOpen: () => { renderVideoProjectsList(); } },
    { btn: document.getElementById('tabBtnTiktokFlashcard'), pane: document.getElementById('paneTiktokFlashcard'), onOpen: () => { if (typeof initTiktokFlashcardTab === 'function') initTiktokFlashcardTab(); } },
    { btn: document.getElementById('tabBtnMiniGemini'), pane: document.getElementById('paneMiniGemini'), onOpen: () => { if (typeof initMiniGeminiTab === 'function') initMiniGeminiTab(); } },
    { btn: document.getElementById('tabBtnCommentsVault'), pane: document.getElementById('paneCommentsVault'), onOpen: () => { if (typeof initCommentsVaultTab === 'function') initCommentsVaultTab(); } },
    { btn: document.getElementById('tabBtnBrainChain'), pane: document.getElementById('paneBrainChain'), onOpen: () => { if (typeof initBrainChainTab === 'function') initBrainChainTab(); } }
  ];

  tabs.forEach(tab => {
    if (tab.btn && tab.pane) {
      tab.btn.addEventListener('click', () => {
        tabs.forEach(t => {
          if (t.btn) t.btn.classList.remove('active');
          if (t.pane) t.pane.classList.remove('active');
        });
        tab.btn.classList.add('active');
        tab.pane.classList.add('active');
        if (typeof playTone === 'function') playTone(700, 0.08, 'sine', 0.1);
        if (tab.onOpen) {
          try { tab.onOpen(); } catch (e) { console.error('Tab onOpen error:', e); }
        }
      });
    }
  });
}

function renderChallengeGrid() {
  const grid = document.getElementById('challengeGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const startStr = ieltsVaultData.challengeStartDate || getCurrentDateKey();
  const todayStr = getCurrentDateKey();
  const dayNum = getChallengeDayNumber(startStr);

  document.getElementById('challengeDaysText').textContent = `Ngày ${dayNum > 0 ? dayNum : 1} / 60`;

  const itemsByDate = {};
  ieltsVaultData.items.forEach(item => {
    const d = item.date;
    itemsByDate[d] = (itemsByDate[d] || 0) + 1;
  });

  let targetDaysMet = 0;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 60; i++) {
    const cellDate = addDays(startStr, i);
    const count = itemsByDate[cellDate] || 0;

    if (count >= 100) {
      targetDaysMet++;
    }

    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.textContent = i + 1;

    if (count === 0) {
      cell.classList.add('level-0');
    } else if (count < 50) {
      cell.classList.add('level-1');
    } else if (count < 100) {
      cell.classList.add('level-2');
    } else {
      cell.classList.add('level-3');
    }

    // Highlight if selected
    if (selectedFilterDate === cellDate) {
      cell.classList.add('selected-cell');
    }

    const parts = cellDate.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : cellDate;
    cell.title = `Ngày ${i + 1} (${formattedDate}): Đã lưu ${count} / 100 tài liệu`;

    cell.addEventListener('click', () => {
      // Toggle date filter
      if (selectedFilterDate === cellDate) {
        selectedFilterDate = null;
      } else {
        selectedFilterDate = cellDate;
      }

      const dateInp = document.getElementById('ieltsDate');
      if (dateInp) {
        dateInp.value = cellDate;
      }
      playTone(600, 0.1, 'sine', 0.1);
      renderChallengeGrid();
      renderIeltsList();
    });

    fragment.appendChild(cell);
  }
  grid.appendChild(fragment);

  const todayCount = itemsByDate[todayStr] || 0;

  const activeDate = selectedFilterDate || todayStr;
  const activeCount = itemsByDate[activeDate] || 0;
  const activePct = Math.min(100, Math.round((activeCount / 100) * 100));
  const activeParts = activeDate.split('-');
  const formattedActiveDate = activeParts.length === 3 ? `${activeParts[2]}/${activeParts[1]}/${activeParts[0]}` : activeDate;

  const todayLbl = document.querySelector('.ielts-challenge-card .stat-box:nth-child(1) .stat-lbl');
  if (todayLbl) {
    if (selectedFilterDate) {
      const dayIdx = Math.round((new Date(selectedFilterDate) - new Date(startStr)) / (1000 * 60 * 60 * 24)) + 1;
      todayLbl.textContent = `Xem ngày ${dayIdx} (${formattedActiveDate})`;
    } else {
      todayLbl.textContent = "Lưu hôm nay";
    }
  }

  document.getElementById('ieltsTodayCount').textContent = `${activeCount} / 100`;
  document.getElementById('ieltsTodayProgress').style.width = `${activePct}%`;
  document.getElementById('ieltsGoalDays').textContent = `${targetDaysMet} / 60`;
  document.getElementById('ieltsTotalSaved').textContent = ieltsVaultData.items.length;
}

function renderIeltsList() {
  const searchInp = document.getElementById('ieltsSearch');
  const skillFilter = document.getElementById('filterSkill');
  const masteryFilter = document.getElementById('filterMastery');
  const list = document.getElementById('ieltsList');

  if (!list) return;
  list.innerHTML = '';

  // Date filter indicator update
  const dateFilterStatus = document.getElementById('ieltsDateFilterStatus');
  const selectedDateText = document.getElementById('ieltsSelectedDateText');
  if (dateFilterStatus && selectedDateText) {
    if (selectedFilterDate) {
      dateFilterStatus.style.display = 'flex';
      const parts = selectedFilterDate.split('-');
      selectedDateText.textContent = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : selectedFilterDate;
    } else {
      dateFilterStatus.style.display = 'none';
    }
  }

  const searchVal = searchInp ? searchInp.value.toLowerCase() : '';
  const filterSkill = skillFilter ? skillFilter.value : 'all';
  const filterMastery = masteryFilter ? masteryFilter.value : 'all';
  const filterFolder = document.getElementById('filterFolder') ? document.getElementById('filterFolder').value : 'all';

  const filtered = ieltsVaultData.items.filter(item => {
    const f = item.fields || {};
    const searchMatch = !searchVal ||
      item.title.toLowerCase().includes(searchVal) ||
      (f.prompt && f.prompt.toLowerCase().includes(searchVal)) ||
      (f.question && f.question.toLowerCase().includes(searchVal)) ||
      (f.vocab && f.vocab.toLowerCase().includes(searchVal)) ||
      (f.mathProblem && f.mathProblem.toLowerCase().includes(searchVal)) ||
      (f.koreanVocab && f.koreanVocab.toLowerCase().includes(searchVal)) ||
      (f.japaneseVocab && f.japaneseVocab.toLowerCase().includes(searchVal)) ||
      (f.codingProblem && f.codingProblem.toLowerCase().includes(searchVal)) ||
      (f.genTheory && f.genTheory.toLowerCase().includes(searchVal));

    const skillMatch = filterSkill === 'all' || item.skill === filterSkill;
    const mVal = item.mastery || 0;
    const masteryMatch = filterMastery === 'all' ||
      (filterMastery === '3' ? mVal >= 3 : mVal === parseInt(filterMastery));

    const itemFolder = item.folder || 'Mặc định';
    const folderMatch = filterFolder === 'all' || itemFolder === filterFolder;

    const dateMatch = !selectedFilterDate || item.date === selectedFilterDate;

    return searchMatch && skillMatch && masteryMatch && folderMatch && dateMatch;
  });

  filtered.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id.localeCompare(a.id);
  });

  const empty = document.getElementById('ieltsEmptyState');
  if (filtered.length === 0) {
    if (empty) empty.classList.add('visible');
    return;
  }
  if (empty) empty.classList.remove('visible');

  const skillIcons = {
    writing: '✍️ Writing',
    speaking: '🗣️ Speaking',
    conversation: '🎙️ Nói & Giao Tiếp',
    reading: '📖 Reading',
    listening: '🎧 Listening',
    math: '📐 Toán Học',
    korean: '🇰🇷 Tiếng Hàn',
    japanese: '🇯🇵 Tiếng Nhật',
    coding: '💻 Lập Trình',
    other: '📚 Môn khác'
  };

  const fragment = document.createDocumentFragment();
  filtered.forEach(item => {
    const li = document.createElement('li');
    li.className = 'ielts-item-card';
    if (item.id === activeIeltsItemId) {
      li.classList.add('active');
    }

    const parts = item.date.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.date;

    const isChecked = selectedIeltsItemIds.has(item.id);

    li.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 8px; width: 100%;">
        <input type="checkbox" class="ielts-item-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''} style="margin-top: 5px; cursor: pointer; width: 16px; height: 16px; flex-shrink: 0; accent-color: var(--purple2);" />
        <div style="flex: 1; min-width: 0;">
          <div class="item-card-header">
            <span class="skill-badge ${item.skill}">${skillIcons[item.skill] || item.skill}</span>
            <span class="item-card-date">${formattedDate}</span>
          </div>
          <div class="item-card-title">${escHtml(item.title)}</div>
          <div class="item-card-footer">
            <span>
              <span class="mastery-dot level-${Math.min(3, item.mastery || 0)}"></span>
              ${getMasteryLabel(item.mastery)}
            </span>
          </div>
        </div>
      </div>
    `;

    const cb = li.querySelector('.ielts-item-checkbox');
    cb.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    cb.addEventListener('change', (e) => {
      if (cb.checked) {
        selectedIeltsItemIds.add(item.id);
      } else {
        selectedIeltsItemIds.delete(item.id);
      }
      updateBulkFolderActionsVisibility();
    });

    li.addEventListener('click', () => {
      document.querySelectorAll('.ielts-item-card').forEach(el => el.classList.remove('active'));
      li.classList.add('active');
      activeIeltsItemId = item.id;
      renderIeltsDetail(item.id);
      playTone(500, 0.08, 'sine', 0.1);
    });

    fragment.appendChild(li);
  });
  list.appendChild(fragment);
}

function getMasteryLabel(level) {
  const l = level || 0;
  if (l === 0) return 'Chưa đọc';
  return `Đã đọc ${l} lần`;
}

function showIeltsState(state) {
  const welcome = document.getElementById('ieltsWelcomeState');
  const form = document.getElementById('ieltsFormState');
  const detail = document.getElementById('ieltsDetailState');

  if (!welcome || !form || !detail) return;

  welcome.classList.remove('active');
  form.classList.remove('active');
  detail.classList.remove('active');

  if (state === 'welcome') {
    welcome.classList.add('active');
    activeIeltsItemId = null;
    document.querySelectorAll('.ielts-item-card').forEach(el => el.classList.remove('active'));
  } else if (state === 'form') {
    form.classList.add('active');
  } else if (state === 'detail') {
    detail.classList.add('active');
  }
}

function initSkillFormToggle() {
  const skillSelect = document.getElementById('ieltsSkill');
  if (skillSelect) {
    skillSelect.addEventListener('change', () => {
      const val = skillSelect.value;
      document.querySelectorAll('.skill-fields-group').forEach(el => {
        el.classList.remove('active');
      });
      const activeGroup = document.getElementById(`fields-${val}`);
      if (activeGroup) {
        activeGroup.classList.add('active');
      } else {
        // Fallback to fields-other for custom subjects
        const otherGroup = document.getElementById('fields-other');
        if (otherGroup) {
          otherGroup.classList.add('active');
        }
      }
    });
  }
}

function compressImage(file, callback) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      callback(compressedDataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function setupImageUpload() {
  const uploadArea = document.getElementById('imageUploadArea');
  const fileInput = document.getElementById('writeImageFile');
  const previewContainer = document.getElementById('imagePreviewContainer');

  if (!uploadArea || !fileInput || !previewContainer) return;

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--purple)';
    uploadArea.style.background = 'rgba(139, 92, 246, 0.08)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'rgba(139, 92, 246, 0.3)';
    uploadArea.style.background = 'rgba(255, 255, 255, 0.01)';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(139, 92, 246, 0.3)';
    uploadArea.style.background = 'rgba(255, 255, 255, 0.01)';
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        processImageFile(file);
      }
    });
  });

  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    files.forEach(file => {
      if (file) {
        processImageFile(file);
      }
    });
    fileInput.value = '';
  });

  const handlePaste = (e) => {
    const form = document.getElementById('ieltsFormState');
    if (form && form.classList.contains('active')) {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          processImageFile(file);
        }
      }
    }
  };

  document.removeEventListener('paste', handlePaste);
  document.addEventListener('paste', handlePaste);

  function processImageFile(file) {
    compressImage(file, (base64) => {
      uploadedImages.push(base64);
      renderImagePreviews();
    });
  }
}

function renderImagePreviews() {
  const previewContainer = document.getElementById('imagePreviewContainer');
  if (!previewContainer) return;

  previewContainer.innerHTML = '';

  if (uploadedImages.length === 0) {
    previewContainer.style.display = 'none';
    return;
  }

  previewContainer.style.display = 'flex';

  uploadedImages.forEach((imgBase64, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'image-preview-thumbnail-wrapper';

    const img = document.createElement('img');
    img.src = imgBase64;
    img.className = 'image-preview-thumbnail';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove-thumbnail';
    removeBtn.textContent = '✕';
    removeBtn.title = 'Xóa ảnh này';

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      uploadedImages.splice(idx, 1);
      renderImagePreviews();
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn-copy-thumbnail';
    copyBtn.innerHTML = '📋';
    copyBtn.title = 'Sao chép ảnh này vào Clipboard';

    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        if (window.taskAPI && window.taskAPI.copyImage) {
          window.taskAPI.copyImage(imgBase64);
        } else {
          const response = await fetch(imgBase64);
          const blob = await response.blob();
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
        }
        if (typeof playTone === 'function') playTone(660, 0.08, 'sine', 0.15);
        alert('Đã sao chép ảnh vào Clipboard!');
      } catch (err) {
        console.error('Failed to copy preview image:', err);
      }
    });

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    wrapper.appendChild(copyBtn);
    previewContainer.appendChild(wrapper);
  });
}

function resetIeltsForm() {
  const idEl = document.getElementById('editItemId');
  const titleEl = document.getElementById('ieltsTitle');
  const skillEl = document.getElementById('ieltsSkill');
  const dateEl = document.getElementById('ieltsDate');
  const masteryEl = document.getElementById('ieltsMastery');
  const folderEl = document.getElementById('ieltsFolder');

  if (idEl) idEl.value = '';
  if (titleEl) titleEl.value = '';
  if (skillEl) skillEl.value = 'writing';
  if (dateEl) dateEl.value = getCurrentDateKey();
  if (masteryEl) masteryEl.value = '0';
  if (folderEl) folderEl.value = 'Mặc định';

  const linkEl = document.getElementById('ieltsLink');
  if (linkEl) linkEl.value = '';

  const testNoEl = document.getElementById('ieltsTestNo');
  if (testNoEl) testNoEl.value = '';

  document.querySelectorAll('#ieltsForm textarea').forEach(textarea => {
    textarea.value = '';
  });

  uploadedImages = [];
  const fileInput = document.getElementById('writeImageFile');
  if (fileInput) fileInput.value = '';

  renderImagePreviews();

  document.querySelectorAll('.skill-fields-group').forEach(el => {
    el.classList.remove('active');
  });
  const writeFields = document.getElementById('fields-writing');
  if (writeFields) writeFields.classList.add('active');
}

function handleNewIeltsClick() {
  resetIeltsForm();
  const formTitle = document.getElementById('formTitle');
  if (formTitle) formTitle.textContent = '📝 Thêm tài liệu IELTS mới';
  showIeltsState('form');
  playTone(500, 0.1, 'sine', 0.15);
}

function handleSaveIelts() {
  const titleEl = document.getElementById('ieltsTitle');
  const skillEl = document.getElementById('ieltsSkill');
  const dateEl = document.getElementById('ieltsDate');
  const masteryEl = document.getElementById('ieltsMastery');
  const editIdEl = document.getElementById('editItemId');
  const folderEl = document.getElementById('ieltsFolder');
  const linkEl = document.getElementById('ieltsLink');
  const testNoEl = document.getElementById('ieltsTestNo');

  if (!titleEl || !skillEl) return;

  const title = titleEl.value.trim();
  const skill = skillEl.value;
  const date = (dateEl && dateEl.value) ? dateEl.value : getCurrentDateKey();
  const mastery = masteryEl ? parseInt(masteryEl.value) : 0;
  const editId = editIdEl ? editIdEl.value : '';
  const folder = folderEl ? folderEl.value : 'Mặc định';
  const link = linkEl ? linkEl.value.trim() : '';
  const testNo = testNoEl ? testNoEl.value.trim() : '';

  if (!title) {
    titleEl.focus();
    titleEl.style.borderColor = '#ef4444';
    return;
  }
  titleEl.style.borderColor = '';

  const fields = {};
  if (skill === 'writing') {
    fields.prompt = document.getElementById('writePrompt').value.trim();
    fields.grammar = document.getElementById('writeGrammar').value.trim();
    fields.vocab = document.getElementById('writeVocab').value.trim();
    fields.analysis = document.getElementById('writeAnalysis').value.trim();
    fields.ideas = document.getElementById('writeIdeas').value.trim();
    fields.sample = document.getElementById('writeSample').value.trim();
    fields.solution = document.getElementById('writeSolution').value.trim();
  } else if (skill === 'speaking') {
    fields.question = document.getElementById('speakQuestion').value.trim();
    fields.vocab = document.getElementById('speakVocab').value.trim();
    fields.colloc = document.getElementById('speakColloc').value.trim();
    fields.outline = document.getElementById('speakOutline').value.trim();
    fields.sample = document.getElementById('speakSample').value.trim();
    fields.pron = document.getElementById('speakPron').value.trim();
  } else if (skill === 'conversation') {
    fields.convScenario = document.getElementById('convScenario') ? document.getElementById('convScenario').value.trim() : '';
    fields.convOpener = document.getElementById('convOpener') ? document.getElementById('convOpener').value.trim() : '';
    fields.convKnowledgeAngle = document.getElementById('convKnowledgeAngle') ? document.getElementById('convKnowledgeAngle').value.trim() : '';
    fields.convStory = document.getElementById('convStory') ? document.getElementById('convStory').value.trim() : '';
    fields.convHumor = document.getElementById('convHumor') ? document.getElementById('convHumor').value.trim() : '';
    fields.convPerspective = document.getElementById('convPerspective') ? document.getElementById('convPerspective').value.trim() : '';
    fields.convUpgrades = document.getElementById('convUpgrades') ? document.getElementById('convUpgrades').value.trim() : '';
    fields.convSocialEq = document.getElementById('convSocialEq') ? document.getElementById('convSocialEq').value.trim() : '';
  } else if (skill === 'reading') {
    fields.passage = document.getElementById('readPassage').value.trim();
    fields.keywords = document.getElementById('readKeywords').value.trim();
    fields.sentence = document.getElementById('readSentence').value.trim();
    fields.tips = document.getElementById('readTips').value.trim();
    fields.explanation = document.getElementById('readExplanation').value.trim();
  } else if (skill === 'listening') {
    fields.context = document.getElementById('listenContext').value.trim();
    fields.spelling = document.getElementById('listenSpelling').value.trim();
    fields.vocab = document.getElementById('listenVocab').value.trim();
    fields.transcript = document.getElementById('listenTranscript').value.trim();
    fields.explanation = document.getElementById('listenExplanation').value.trim();
  } else if (skill === 'math') {
    fields.mathProblem = document.getElementById('mathProblem') ? document.getElementById('mathProblem').value.trim() : '';
    fields.mathTheory = document.getElementById('mathTheory') ? document.getElementById('mathTheory').value.trim() : '';
    fields.mathSteps = document.getElementById('mathSteps') ? document.getElementById('mathSteps').value.trim() : '';
    fields.mathSolution = document.getElementById('mathSolution') ? document.getElementById('mathSolution').value.trim() : '';
  } else if (skill === 'korean') {
    fields.koreanVocab = document.getElementById('koreanVocab') ? document.getElementById('koreanVocab').value.trim() : '';
    fields.koreanDialogue = document.getElementById('koreanDialogue') ? document.getElementById('koreanDialogue').value.trim() : '';
    fields.koreanPron = document.getElementById('koreanPron') ? document.getElementById('koreanPron').value.trim() : '';
    fields.koreanTranslation = document.getElementById('koreanTranslation') ? document.getElementById('koreanTranslation').value.trim() : '';
  } else if (skill === 'japanese') {
    fields.japaneseVocab = document.getElementById('japaneseVocab') ? document.getElementById('japaneseVocab').value.trim() : '';
    fields.japaneseDialogue = document.getElementById('japaneseDialogue') ? document.getElementById('japaneseDialogue').value.trim() : '';
    fields.japaneseTranslation = document.getElementById('japaneseTranslation') ? document.getElementById('japaneseTranslation').value.trim() : '';
  } else if (skill === 'coding') {
    fields.codingProblem = document.getElementById('codingProblem') ? document.getElementById('codingProblem').value.trim() : '';
    fields.codingConcept = document.getElementById('codingConcept') ? document.getElementById('codingConcept').value.trim() : '';
    fields.codingSolution = document.getElementById('codingSolution') ? document.getElementById('codingSolution').value.trim() : '';
    fields.codingAnalysis = document.getElementById('codingAnalysis') ? document.getElementById('codingAnalysis').value.trim() : '';
  } else {
    fields.genTheory = document.getElementById('genTheory') ? document.getElementById('genTheory').value.trim() : '';
    fields.genExercise = document.getElementById('genExercise') ? document.getElementById('genExercise').value.trim() : '';
    fields.genSolution = document.getElementById('genSolution') ? document.getElementById('genSolution').value.trim() : '';
  }
  fields.images = uploadedImages;
  fields.image = uploadedImages.length > 0 ? uploadedImages[0] : '';
  fields.testNo = testNo;
  if (editId) {
    const idx = ieltsVaultData.items.findIndex(item => item.id === editId);
    if (idx !== -1) {
      ieltsVaultData.items[idx] = {
        id: editId,
        title,
        skill,
        date,
        mastery,
        folder,
        link,
        testNo,
        fields
      };
      activeIeltsItemId = editId;
    }
  } else {
    const newItemId = 'ielts-' + Date.now();
    const newItem = {
      id: newItemId,
      title,
      skill,
      date,
      mastery,
      folder,
      link,
      testNo,
      fields
    };
    ieltsVaultData.items.push(newItem);
    activeIeltsItemId = newItemId;
  }

  saveIeltsData();
  SFX.add();
  renderIeltsDetail(activeIeltsItemId);
}

function handleEditIelts() {
  const item = ieltsVaultData.items.find(item => item.id === activeIeltsItemId);
  if (!item) return;

  resetIeltsForm();
  const formTitle = document.getElementById('formTitle');
  if (formTitle) formTitle.textContent = '✏️ Chỉnh sửa tài liệu IELTS';

  document.getElementById('editItemId').value = item.id;
  document.getElementById('ieltsTitle').value = item.title;
  document.getElementById('ieltsSkill').value = item.skill;
  document.getElementById('ieltsDate').value = item.date;
  document.getElementById('ieltsMastery').value = item.mastery;

  const linkEl = document.getElementById('ieltsLink');
  if (linkEl) {
    linkEl.value = item.link || '';
  }

  const folderEl = document.getElementById('ieltsFolder');
  if (folderEl) {
    folderEl.value = item.folder || 'Mặc định';
  }

  const testNoEl = document.getElementById('ieltsTestNo');
  if (testNoEl) {
    testNoEl.value = item.testNo || (item.fields ? item.fields.testNo : '') || '';
  }

  const skillSelect = document.getElementById('ieltsSkill');
  if (skillSelect) {
    skillSelect.dispatchEvent(new Event('change'));
  }

  const f = item.fields;

  uploadedImages = f.images || (f.image ? [f.image] : []);
  renderImagePreviews();

  if (item.skill === 'writing') {
    document.getElementById('writePrompt').value = f.prompt || '';
    document.getElementById('writeGrammar').value = f.grammar || '';
    document.getElementById('writeVocab').value = f.vocab || '';
    document.getElementById('writeAnalysis').value = f.analysis || '';
    document.getElementById('writeIdeas').value = f.ideas || '';
    document.getElementById('writeSample').value = f.sample || '';
    document.getElementById('writeSolution').value = f.solution || '';
  } else if (item.skill === 'speaking') {
    document.getElementById('speakQuestion').value = f.question || '';
    document.getElementById('speakVocab').value = f.vocab || '';
    document.getElementById('speakColloc').value = f.colloc || '';
    document.getElementById('speakOutline').value = f.outline || '';
    document.getElementById('speakSample').value = f.sample || '';
    document.getElementById('speakPron').value = f.pron || '';
  } else if (item.skill === 'conversation') {
    if (document.getElementById('convScenario')) document.getElementById('convScenario').value = f.convScenario || f.scenario || '';
    if (document.getElementById('convOpener')) document.getElementById('convOpener').value = f.convOpener || f.opener || '';
    if (document.getElementById('convKnowledgeAngle')) document.getElementById('convKnowledgeAngle').value = f.convKnowledgeAngle || f.knowledgeAngle || '';
    if (document.getElementById('convStory')) document.getElementById('convStory').value = f.convStory || f.story || '';
    if (document.getElementById('convHumor')) document.getElementById('convHumor').value = f.convHumor || f.humor || '';
    if (document.getElementById('convPerspective')) document.getElementById('convPerspective').value = f.convPerspective || f.perspective || '';
    if (document.getElementById('convUpgrades')) document.getElementById('convUpgrades').value = f.convUpgrades || f.upgrades || '';
    if (document.getElementById('convSocialEq')) document.getElementById('convSocialEq').value = f.convSocialEq || f.socialEq || '';
  } else if (item.skill === 'reading') {
    document.getElementById('readPassage').value = f.passage || '';
    document.getElementById('readKeywords').value = f.keywords || '';
    document.getElementById('readSentence').value = f.sentence || '';
    document.getElementById('readTips').value = f.tips || '';
    document.getElementById('readExplanation').value = f.explanation || '';
  } else if (item.skill === 'listening') {
    document.getElementById('listenContext').value = f.context || '';
    document.getElementById('listenSpelling').value = f.spelling || '';
    document.getElementById('listenVocab').value = f.vocab || '';
    document.getElementById('listenTranscript').value = f.transcript || '';
    document.getElementById('listenExplanation').value = f.explanation || '';
  } else if (item.skill === 'math') {
    if (document.getElementById('mathProblem')) document.getElementById('mathProblem').value = f.mathProblem || '';
    if (document.getElementById('mathTheory')) document.getElementById('mathTheory').value = f.mathTheory || '';
    if (document.getElementById('mathSteps')) document.getElementById('mathSteps').value = f.mathSteps || '';
    if (document.getElementById('mathSolution')) document.getElementById('mathSolution').value = f.mathSolution || '';
  } else if (item.skill === 'korean') {
    if (document.getElementById('koreanVocab')) document.getElementById('koreanVocab').value = f.koreanVocab || '';
    if (document.getElementById('koreanDialogue')) document.getElementById('koreanDialogue').value = f.koreanDialogue || '';
    if (document.getElementById('koreanPron')) document.getElementById('koreanPron').value = f.koreanPron || '';
    if (document.getElementById('koreanTranslation')) document.getElementById('koreanTranslation').value = f.koreanTranslation || '';
  } else if (item.skill === 'japanese') {
    if (document.getElementById('japaneseVocab')) document.getElementById('japaneseVocab').value = f.japaneseVocab || '';
    if (document.getElementById('japaneseDialogue')) document.getElementById('japaneseDialogue').value = f.japaneseDialogue || '';
    if (document.getElementById('japaneseTranslation')) document.getElementById('japaneseTranslation').value = f.japaneseTranslation || '';
  } else if (item.skill === 'coding') {
    if (document.getElementById('codingProblem')) document.getElementById('codingProblem').value = f.codingProblem || '';
    if (document.getElementById('codingConcept')) document.getElementById('codingConcept').value = f.codingConcept || '';
    if (document.getElementById('codingSolution')) document.getElementById('codingSolution').value = f.codingSolution || '';
    if (document.getElementById('codingAnalysis')) document.getElementById('codingAnalysis').value = f.codingAnalysis || '';
  } else {
    if (document.getElementById('genTheory')) document.getElementById('genTheory').value = f.genTheory || '';
    if (document.getElementById('genExercise')) document.getElementById('genExercise').value = f.genExercise || '';
    if (document.getElementById('genSolution')) document.getElementById('genSolution').value = f.genSolution || '';
  }
  showIeltsState('form');
  playTone(500, 0.1, 'sine', 0.1);
}

function handleDeleteIelts() {
  const item = ieltsVaultData.items.find(item => item.id === activeIeltsItemId);
  if (!item) return;

  showConfirm('Xóa tài liệu', `Bạn có chắc chắn muốn xóa tài liệu "${item.title}" không?`, () => {
    const idx = ieltsVaultData.items.findIndex(el => el.id === activeIeltsItemId);
    if (idx !== -1) {
      ieltsVaultData.items.splice(idx, 1);
      saveIeltsData();
      SFX.delete();
      showIeltsState('welcome');
    }
  });
}

// Removed handleQuickMasterySelect in favor of read count button controls

let ieltsScrollClickHandler = null;

function renderIeltsDetail(itemId) {
  const item = ieltsVaultData.items.find(item => item.id === itemId);
  if (!item) {
    showIeltsState('welcome');
    return;
  }

  showIeltsState('detail');

  const f = item.fields;
  let vocabText = '';
  if (f.vocab) vocabText += '\n' + f.vocab;
  if (f.keywords) vocabText += '\n' + f.keywords;
  if (f.colloc) vocabText += '\n' + f.colloc;
  if (f.spelling) vocabText += '\n' + f.spelling;
  if (f.grammar) vocabText += '\n' + f.grammar;
  if (f.koreanVocab) vocabText += '\n' + f.koreanVocab;
  if (f.japaneseVocab) vocabText += '\n' + f.japaneseVocab;
  currentVocabMap = buildVocabMap(vocabText);

  const skillIcons = {
    writing: '✍️ Writing',
    speaking: '🗣️ Speaking',
    conversation: '🎙️ Nói & Giao Tiếp (Charisma)',
    reading: '📖 Reading',
    listening: '🎧 Listening',
    math: '📐 Toán Học',
    korean: '🇰🇷 Tiếng Hàn',
    japanese: '🇯🇵 Tiếng Nhật',
    coding: '💻 Lập Trình',
    other: '📚 Môn học khác'
  };

  const detailSkill = document.getElementById('detailSkill');
  if (detailSkill) {
    detailSkill.className = `skill-badge ${item.skill}`;
    detailSkill.textContent = skillIcons[item.skill] || item.skill;
  }

  const titleEl = document.getElementById('detailTitle');
  if (titleEl) titleEl.textContent = item.title;

  const parts = item.date.split('-');
  const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.date;
  const dateEl = document.getElementById('detailDate');
  if (dateEl) dateEl.textContent = `📅 Ngày lưu: ${formattedDate}`;
  const detailFolderEl = document.getElementById('detailFolder');
  if (detailFolderEl) detailFolderEl.textContent = `📁 Thư mục: ${item.folder || 'Mặc định'}`;

  const linkContainer = document.getElementById('detailLinkContainer');
  const linkEl = document.getElementById('detailLink');
  if (linkContainer && linkEl) {
    if (item.link) {
      linkContainer.style.display = 'block';
      linkEl.textContent = 'Mở đề thi ➔';
      linkEl.setAttribute('data-url', item.link);
    } else {
      linkContainer.style.display = 'none';
      linkEl.removeAttribute('data-url');
    }
  }

  const lblReadCountMain = document.getElementById('lblReadCountMain');
  if (lblReadCountMain) {
    lblReadCountMain.textContent = item.mastery || 0;
  }

  const scroll = document.getElementById('detailContentScroll');
  if (!scroll) return;
  scroll.innerHTML = '';

  const detailImages = f.images || (f.image ? [f.image] : []);
  if (detailImages && detailImages.length > 0) {
    detailImages.forEach((imgBase64, idx) => {
      scroll.appendChild(createDetailSectionImage(imgBase64, idx, detailImages.length));
    });
  }

  if (item.skill === 'writing') {
    if (f.prompt) scroll.appendChild(createDetailSection('Đề bài / Prompt', f.prompt));
    if (f.grammar) scroll.appendChild(createDetailSection('Cấu trúc ngữ pháp hay dùng', f.grammar));
    if (f.vocab) scroll.appendChild(createDetailSection('Từ vựng chủ đề (Band 8.0 - 9.0)', f.vocab));
    if (f.analysis) scroll.appendChild(createDetailSection('Cách phân tích biểu đồ / Đề bài', f.analysis));
    if (f.ideas) scroll.appendChild(createDetailSection('Các ý cần triển khai (Brainstorming)', f.ideas));
    if (f.sample) scroll.appendChild(createDetailSection('Bài mẫu Sample Band 9.0', f.sample));
    if (f.solution) scroll.appendChild(createDetailSection('Phân tích hướng giải & Nhận xét', f.solution));
  } else if (item.skill === 'speaking') {
    if (f.question) scroll.appendChild(createDetailSection('Câu hỏi / Đề tài Speaking (Part 1/2/3)', f.question));
    if (f.vocab) scroll.appendChild(createDetailSection('Từ vựng hay dùng (B2 - C2)', f.vocab));
    if (f.colloc) scroll.appendChild(createDetailSection('Collocations & Idioms nổi bật', f.colloc));
    if (f.outline) scroll.appendChild(createDetailSection('Ý tưởng & Dàn bài nói', f.outline));
    if (f.sample) scroll.appendChild(createDetailSection('Bài nói mẫu (Sample Answer)', f.sample));
    if (f.pron) scroll.appendChild(createDetailSection('Ghi chú phát âm & Ngữ điệu', f.pron));
  } else if (item.skill === 'conversation') {
    const sc = f.convScenario || f.scenario;
    const op = f.convOpener || f.opener;
    const ka = f.convKnowledgeAngle || f.knowledgeAngle;
    const st = f.convStory || f.story;
    const hu = f.convHumor || f.humor;
    const ps = f.convPerspective || f.perspective;
    const up = f.convUpgrades || f.upgrades;
    const eq = f.convSocialEq || f.socialEq;

    if (sc) scroll.appendChild(createDetailSection('🎭 Tình huống & Bối cảnh giao tiếp', sc));
    if (op) scroll.appendChild(createDetailSection('🎯 Mở đầu & Câu hỏi đắt giá (Opener & Open-ended Questions)', op));
    if (ka) scroll.appendChild(createDetailSection('🧠 Kiến thức / Trend & Cách lồng ghép (Knowledge Angle)', ka));
    if (st) scroll.appendChild(createDetailSection('📖 Story Bank - Câu chuyện cá nhân & Twist (Storytelling)', st));
    if (hu) scroll.appendChild(createDetailSection('😂 Humor Bank & Miếng hài thông minh (Humor & Timing - Risk 1-5)', hu));
    if (ps) scroll.appendChild(createDetailSection('💡 Góc nhìn cá nhân & Chiều sâu (Perspective)', ps));
    if (up) scroll.appendChild(createDetailSection('🚀 Nâng cấp câu trả lời 5 Cấp Độ (5-Level Response Upgrade)', up));
    if (eq) scroll.appendChild(createDetailSection('👑 Đọc vị tâm lý & Quy tắc Charisma (Social & Emotional Intelligence)', eq));
  } else if (item.skill === 'reading') {
    if (f.passage) scroll.appendChild(createDetailSection('Đoạn văn đọc / Tiêu đề bài đọc', f.passage));
    if (f.keywords) scroll.appendChild(createDetailSection('Bảng Từ khóa & Paraphrase (Keyword Table)', f.keywords));
    if (f.sentence) scroll.appendChild(createDetailSection('Phân tích câu phức tạp / Dịch nghĩa', f.sentence));
    if (f.tips) scroll.appendChild(createDetailSection('Mẹo làm bài & Bẫy đề cần tránh', f.tips));
    if (f.explanation) scroll.appendChild(createDetailSection('Giải đề chi tiết (Đáp án & Câu chứa đáp án)', f.explanation));
  } else if (item.skill === 'listening') {
    if (f.context) scroll.appendChild(createDetailSection('Nội dung câu hỏi nghe / Bối cảnh', f.context));
    if (f.spelling) scroll.appendChild(createDetailSection('Từ vựng & Cạm bẫy phát âm (Luyện phát âm/Chính tả)', f.spelling));
    if (f.vocab) scroll.appendChild(createDetailSection('Từ vựng trọng tâm bài nghe', f.vocab));
    if (f.explanation) scroll.appendChild(createDetailSection('Giải đề chi tiết (Đáp án & Lời thoại chứa đáp án)', f.explanation));
  } else if (item.skill === 'math') {
    if (f.mathProblem) scroll.appendChild(createDetailSection('Đề bài / Bài toán mẫu', f.mathProblem));
    if (f.mathTheory) scroll.appendChild(createDetailSection('Công thức & Lý thuyết liên quan', f.mathTheory));
    if (f.mathSteps) scroll.appendChild(createDetailSection('Phương pháp & Các bước giải quyết', f.mathSteps));
    if (f.mathSolution) scroll.appendChild(createDetailSection('Lời giải chi tiết & Lưu ý quan trọng', f.mathSolution));
  } else if (item.skill === 'korean') {
    if (f.koreanVocab) scroll.appendChild(createDetailSection('Từ vựng & Ngữ pháp mới', f.koreanVocab));
    if (f.koreanDialogue) scroll.appendChild(createDetailSection('Hội thoại mẫu & Ví dụ', f.koreanDialogue));
    if (f.koreanPron) scroll.appendChild(createDetailSection('Ghi chú phát âm & Ngữ điệu', f.koreanPron));
    if (f.koreanTranslation) scroll.appendChild(createDetailSection('Bản dịch nghĩa tiếng Việt & Văn hóa', f.koreanTranslation));
  } else if (item.skill === 'japanese') {
    if (f.japaneseVocab) scroll.appendChild(createDetailSection('Kanji, Từ vựng & Ngữ pháp (N5 - N1)', f.japaneseVocab));
    if (f.japaneseDialogue) scroll.appendChild(createDetailSection('Hội thoại / Câu ví dụ thực tế', f.japaneseDialogue));
    if (f.japaneseTranslation) scroll.appendChild(createDetailSection('Dịch nghĩa & Giải thích chi tiết', f.japaneseTranslation));
  } else if (item.skill === 'coding') {
    if (f.codingProblem) scroll.appendChild(createDetailSection('Yêu cầu thuật toán / Bài toán code', f.codingProblem));
    if (f.codingConcept) scroll.appendChild(createDetailSection('Khái niệm cốt lõi & Cấu trúc dữ liệu', f.codingConcept));
    if (f.codingSolution) {
      const codeSec = createDetailSection('Mã nguồn mẫu / Snippet Code', f.codingSolution);
      const valDiv = codeSec.querySelector('.detail-section-val');
      if (valDiv) {
        valDiv.style.fontFamily = 'monospace';
        valDiv.style.whiteSpace = 'pre-wrap';
        valDiv.style.background = 'rgba(0,0,0,0.2)';
        valDiv.style.padding = '10px';
        valDiv.style.borderRadius = '6px';
        valDiv.style.border = '1px solid rgba(255,255,255,0.05)';
      }
      scroll.appendChild(codeSec);
    }
    if (f.codingAnalysis) scroll.appendChild(createDetailSection('Giải thích thuật toán & Độ phức tạp (Big O)', f.codingAnalysis));
  } else {
    if (f.genTheory) scroll.appendChild(createDetailSection('Lý thuyết trọng tâm & Nội dung bài học', f.genTheory));
    if (f.genExercise) scroll.appendChild(createDetailSection('Bài tập tự luyện & Câu hỏi', f.genExercise));
    if (f.genSolution) scroll.appendChild(createDetailSection('Đáp án & Giải thích chi tiết', f.genSolution));
  }

  // Setup search delegation and text selection for study details
  if (ieltsScrollClickHandler) {
    scroll.removeEventListener('click', ieltsScrollClickHandler);
  }
  ieltsScrollClickHandler = (e) => {
    const btn = e.target.closest('.vocab-search-btn');
    if (btn) {
      const word = btn.dataset.search;
      performSearch(word, scroll);
    }
  };
  scroll.addEventListener('click', ieltsScrollClickHandler);

  setupTextSelectionSearch(scroll, 'ielts');
  setupVocabHoverTooltips(scroll);
}

let currentVocabMap = {};

function buildVocabMap(vocabText) {
  const map = {};
  if (!vocabText) return map;

  const lines = vocabText.split('\n');
  lines.forEach(line => {
    if (line.trim() === '') return;
    const term = extractSearchTerm(line);
    if (term && term.length > 1) {
      let definition = line.trim();
      const clean = line.trim();
      if (clean.startsWith('|') && clean.endsWith('|')) {
        const parts = clean.split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          definition = `${parts[0]} ➔ ${parts[1]}`;
        }
      }
      map[term.toLowerCase()] = definition;
    }
  });

  return map;
}

function shouldEnrichSection(label) {
  const lbl = label.toLowerCase();
  return lbl.includes('bài mẫu') ||
    lbl.includes('bài nói mẫu') ||
    lbl.includes('đoạn văn đọc') ||
    lbl.includes('transcript') ||
    lbl.includes('hội thoại') ||
    lbl.includes('lý thuyết');
}

function enrichScriptWithVocab(scriptText, vocabMap) {
  const keys = Object.keys(vocabMap).sort((a, b) => b.length - a.length);
  if (keys.length === 0) return escHtml(scriptText);

  let text = scriptText;
  const placeholders = [];

  keys.forEach((key, index) => {
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b(${escapedKey})\\b`, 'gi');

    text = text.replace(regex, (match) => {
      const placeholder = `___VOCAB_${index}_${placeholders.length}___`;
      placeholders.push({
        placeholder: placeholder,
        word: match,
        vocabKey: key,
        definition: vocabMap[key]
      });
      return placeholder;
    });
  });

  let escapedHtml = escHtml(text);

  placeholders.forEach(p => {
    const spanHtml = `<span class="vocab-inline-hover" data-vocab="${escHtml(p.vocabKey)}" data-definition="${escHtml(p.definition)}">${escHtml(p.word)}</span>`;
    escapedHtml = escapedHtml.replace(p.placeholder, spanHtml);
  });

  return escapedHtml;
}

let hoverTooltip = null;
let currentMouseEnterHandler = null;
let currentMouseLeaveHandler = null;

function setupVocabHoverTooltips(containerEl) {
  if (currentMouseEnterHandler) {
    containerEl.removeEventListener('mouseenter', currentMouseEnterHandler, { capture: true });
  }
  if (currentMouseLeaveHandler) {
    containerEl.removeEventListener('mouseleave', currentMouseLeaveHandler, { capture: true });
  }

  const handleMouseEnter = (e) => {
    const el = e.target.closest('.vocab-inline-hover');
    if (!el) return;

    const def = el.dataset.definition;
    if (!def) return;

    showHoverTooltip(el, def);
  };

  const handleMouseLeave = (e) => {
    const el = e.target.closest('.vocab-inline-hover');
    if (!el) return;

    hideHoverTooltip();
  };

  currentMouseEnterHandler = handleMouseEnter;
  currentMouseLeaveHandler = handleMouseLeave;

  containerEl.addEventListener('mouseenter', handleMouseEnter, { capture: true });
  containerEl.addEventListener('mouseleave', handleMouseLeave, { capture: true });

  function showHoverTooltip(targetEl, text) {
    if (!hoverTooltip) {
      hoverTooltip = document.createElement('div');
      hoverTooltip.className = 'vocab-hover-tooltip';
      Object.assign(hoverTooltip.style, {
        position: 'fixed',
        zIndex: '10000',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(8px)',
        color: '#f8fafc',
        padding: '8px 14px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '500',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
        pointerEvents: 'none',
        maxWidth: '300px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'inherit',
        opacity: '0',
        transition: 'opacity 0.15s, transform 0.15s',
        transform: 'translateY(5px)'
      });
      document.body.appendChild(hoverTooltip);
    }

    hoverTooltip.textContent = text;

    const rect = targetEl.getBoundingClientRect();

    const tooltipHeight = hoverTooltip.offsetHeight || 42;
    const tooltipWidth = hoverTooltip.offsetWidth || 220;

    let top = rect.top - tooltipHeight - 8;
    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);

    if (top < 8) {
      top = rect.bottom + 8;
    }
    if (left < 8) left = 8;
    if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 8;

    hoverTooltip.style.top = `${top}px`;
    hoverTooltip.style.left = `${left}px`;
    hoverTooltip.style.opacity = '1';
    hoverTooltip.style.transform = 'translateY(0)';
  }

  function hideHoverTooltip() {
    if (hoverTooltip) {
      hoverTooltip.style.opacity = '0';
      hoverTooltip.style.transform = 'translateY(5px)';
    }
  }
}

function createDetailSection(label, val) {
  const div = document.createElement('div');
  div.className = 'detail-section';

  const isVocab = label.toLowerCase().includes('từ vựng') || label.toLowerCase().includes('vocab');

  if (isVocab && val) {
    const lines = val.split('\n');
    let htmlContent = '';
    lines.forEach(line => {
      if (line.trim() === '') {
        htmlContent += '<div style="height: 10px;"></div>';
        return;
      }
      const searchTerm = extractSearchTerm(line);
      if (searchTerm && searchTerm.length > 1) {
        htmlContent += `
          <div class="vocab-line">
            <span class="vocab-text">${escHtml(line)}</span>
            <button class="vocab-search-btn" data-search="${escHtml(searchTerm)}" title="Tìm trong bài mẫu">🔍</button>
          </div>
        `;
      } else {
        htmlContent += `<div style="padding: 4px 8px; margin-bottom: 2px;">${escHtml(line)}</div>`;
      }
    });

    div.innerHTML = `
      <div class="detail-section-lbl">${escHtml(label)}</div>
      <div class="detail-section-val" style="white-space: normal;">${htmlContent}</div>
    `;
  } else {
    let contentHtml;
    if (currentVocabMap && shouldEnrichSection(label)) {
      contentHtml = enrichScriptWithVocab(val, currentVocabMap);
    } else {
      contentHtml = escHtml(val);
    }

    div.innerHTML = `
      <div class="detail-section-lbl">${escHtml(label)}</div>
      <div class="detail-section-val">${contentHtml}</div>
    `;
  }

  return div;
}

function extractSearchTerm(line) {
  let clean = line.trim();

  if (clean.startsWith('|') && clean.endsWith('|')) {
    const parts = clean.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      if (parts[0].includes('Từ khóa') || parts[0].includes('---')) {
        return '';
      }
      return parts[0];
    }
  }

  clean = clean.replace(/^[\d\s.\-*•+]+/g, '');
  const parts = clean.split(/[:\-–—(（]/);
  if (parts.length > 0) {
    return parts[0].trim();
  }
  return clean;
}

function isInsideSelectableArea(node) {
  if (!node) return false;
  let curr = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    if (curr.classList) {
      if (
        curr.tagName === 'INPUT' ||
        curr.tagName === 'TEXTAREA' ||
        curr.classList.contains('selection-search-tooltip') ||
        curr.classList.contains('btn-modal') ||
        curr.classList.contains('btn-primary-glow') ||
        curr.classList.contains('btn-delete-red')
      ) {
        return false;
      }
      if (
        curr.classList.contains('detail-section-val') ||
        curr.classList.contains('bc-node-content') ||
        curr.classList.contains('bc-why-step') ||
        curr.classList.contains('bc-tab-content') ||
        curr.classList.contains('bc-chain-flow') ||
        curr.classList.contains('comment-content') ||
        curr.classList.contains('comment-card') ||
        curr.classList.contains('vocab-inline-hover') ||
        curr.classList.contains('selectable-text') ||
        curr.id === 'bcEventContext' ||
        curr.id === 'bcEventTitle' ||
        curr.id === 'bcActiveWorkspace' ||
        curr.id === 'bcVaultGoldenInsight' ||
        curr.id === 'bcVaultTakeawaysList' ||
        curr.id === 'ieltsDetailScroll' ||
        curr.id === 'generalDetailScroll' ||
        curr.id === 'bcMainStudio'
      ) {
        return true;
      }
    }
    curr = curr.parentNode;
  }
  return false;
}

function showTkToast(msg) {
  let toast = document.getElementById('tkCustomFloatingToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tkCustomFloatingToast';
    toast.style.cssText = 'position: fixed; bottom: 25px; right: 25px; background: linear-gradient(135deg, #1e1b2e 0%, #2d1b4e 100%); border: 1.5px solid #00f2fe; color: #fff; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; box-shadow: 0 10px 25px rgba(0,0,0,0.6); z-index: 9999999; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(20px); opacity: 0; pointer-events: none; display: flex; align-items: center; gap: 8px;';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="font-size: 16px;">✨</span> <span>${msg}</span>`;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
  }, 3500);
}

function getBestVoiceForLang(langCode) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  let match = voices.find(v => v.lang.toLowerCase().startsWith(langCode.substring(0, 2).toLowerCase()));
  if (!match) {
    match = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
  }
  return match;
}

function speakPronunciation(text) {
  if (!text) return;
  text = text.trim();
  if (text.length === 0) return;

  text = text.replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"']+|[.,\/#!$%\^&\*;:{}=\-_`~()?"']+$/g, "");
  if (text.length === 0) return;

  const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const lang = viRegex.test(text) ? 'vi-VN' : 'en-US';

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const bestVoice = getBestVoiceForLang(lang);
  if (bestVoice) {
    utterance.voice = bestVoice;
  }
  utterance.lang = lang;
  utterance.rate = 1.0;

  window.speechSynthesis.speak(utterance);
}

async function saveWordToTiktokFlashcardDirect(word, translation) {
  if (!word || !word.trim()) return;
  const cleanWord = word.trim();
  let cleanTrans = (translation || '').trim();

  if (!cleanTrans || cleanTrans === 'Đang cập nhật' || cleanTrans.includes('Không tìm thấy')) {
    if (window.taskAPI && window.taskAPI.translateText) {
      try {
        const rawRes = await window.taskAPI.translateText(cleanWord, 'vi');
        if (typeof rawRes === 'string') {
          cleanTrans = rawRes;
        } else if (Array.isArray(rawRes) && Array.isArray(rawRes[0])) {
          cleanTrans = rawRes[0].map(item => item && item[0] ? item[0] : '').filter(Boolean).join(' ');
        }
      } catch (e) { }
    }
  }
  if (!cleanTrans || cleanTrans.includes('Không tìm thấy')) cleanTrans = 'Đang cập nhật';

  let notes = [
    `🗣️ Speaking 1: "In daily life, I often encounter the need to ${cleanWord} to reach my goals."`,
    `🗣️ Speaking 2: "From my perspective, using the word '${cleanWord}' makes answers sound natural."`,
    `✍️ Writing 1: "In academic discussions, the concept of '${cleanWord}' is frequently highlighted."`,
    `✍️ Writing 2: "Numerous studies demonstrate how '${cleanWord}' can significantly influence results."`,
    `✍️ Writing 3: "Therefore, gaining a deep understanding of '${cleanWord}' is essential."`
  ].join('\n');

  let vaultData = { items: [] };
  if (window.taskAPI && window.taskAPI.loadMemorizeVault) {
    try {
      const loaded = await window.taskAPI.loadMemorizeVault();
      if (loaded && Array.isArray(loaded.items)) vaultData = loaded;
    } catch (e) { }
  }

  let tiktokUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(cleanWord)}`;
  let chosenMusicUrl = localStorage.getItem('tk_last_chosen_music_url') || '';
  if (window.taskAPI && window.taskAPI.loadTiktokMusic) {
    try {
      const musicData = await window.taskAPI.loadTiktokMusic();
      if (musicData && musicData.lastChosenUrl) {
        chosenMusicUrl = musicData.lastChosenUrl;
      }
    } catch (e) { }
  }
  if (!chosenMusicUrl) chosenMusicUrl = 'https://www.tiktok.com/music/Perfect-6655492047723563778';
  if (window.taskAPI && window.taskAPI.extractTiktokMusicVideos) {
    try {
      const res = await window.taskAPI.extractTiktokMusicVideos(chosenMusicUrl);
      if (res && res.success && Array.isArray(res.videos) && res.videos.length > 0) {
        const randomIndex = Math.floor(Math.random() * res.videos.length);
        tiktokUrl = res.videos[randomIndex];
      }
    } catch (e) { }
  }

  let existing = vaultData.items.find(x => x.word && x.word.toLowerCase().trim() === cleanWord.toLowerCase());
  if (existing) {
    existing.translation = cleanTrans;
    existing.notes = notes;
    existing.tiktokUrl = tiktokUrl;
    existing.linkType = 'direct';
  } else {
    const newItem = {
      id: 'tk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      word: cleanWord,
      translation: cleanTrans,
      notes: notes,
      tiktokUrl: tiktokUrl,
      linkType: 'direct',
      level: 1,
      interval: 1,
      nextReviewDate: new Date().toISOString().split('T')[0]
    };
    vaultData.items.unshift(newItem);
  }

  if (window.taskAPI && window.taskAPI.saveMemorizeVault) {
    await window.taskAPI.saveMemorizeVault(vaultData);
  }

  if (typeof playTone === 'function') {
    playTone(523, 0.08, 'sine', 0.1);
    setTimeout(() => playTone(784, 0.12, 'sine', 0.15), 100);
  }

  showTkToast(`Đã tự động lưu từ "${cleanWord}" vào Flashcard TikTok!`);
}

function highlightWordInDetailSection(sectionEl, word) {
  if (!word || word.trim() === "") return false;

  const valDiv = sectionEl.querySelector ? (sectionEl.querySelector('.detail-section-val') || sectionEl) : sectionEl;
  if (!valDiv) return false;

  if (!valDiv.dataset.originalText) {
    valDiv.dataset.originalText = valDiv.innerText;
  }

  const originalText = valDiv.dataset.originalText;
  const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedWord})`, 'gi');

  if (!regex.test(originalText)) {
    return false;
  }

  const highlightedHtml = escHtml(originalText).replace(
    new RegExp(`(${escHtml(word)})`, 'gi'),
    '<mark class="search-highlight" style="background: #f59e0b; color: #000; font-weight: bold; border-radius: 4px; padding: 2px 4px; box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);">$1</mark>'
  );

  valDiv.innerHTML = highlightedHtml;

  const mark = valDiv.querySelector('.search-highlight');
  if (mark) {
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    mark.style.animation = 'pulse-highlight 1.5s infinite';

    if (!document.getElementById('pulse-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'pulse-highlight-style';
      style.innerHTML = `
        @keyframes pulse-highlight {
          0% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.6); }
          50% { box-shadow: 0 0 16px rgba(245, 158, 11, 1); transform: scale(1.05); }
          100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.6); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  return true;
}

function clearHighlights(containerEl) {
  if (!containerEl) return;
  const sections = containerEl.querySelectorAll ? containerEl.querySelectorAll('.detail-section, .bc-node-card, .bc-why-step, #bcEventContext') : [];
  sections.forEach(sectionEl => {
    const valDiv = sectionEl.querySelector ? (sectionEl.querySelector('.detail-section-val') || sectionEl) : sectionEl;
    if (valDiv && valDiv.dataset && valDiv.dataset.originalText) {
      valDiv.textContent = valDiv.dataset.originalText;
      delete valDiv.dataset.originalText;
    }
  });
}

function performSearch(word, containerEl) {
  if (!word || word.trim() === "") return;

  const targetContainer = containerEl || document.getElementById('bcActiveWorkspace') || document.body;
  clearHighlights(targetContainer);

  const sections = targetContainer.querySelectorAll ? targetContainer.querySelectorAll('.detail-section, .bc-node-content, .bc-why-step, #bcEventContext, #bcVaultGoldenInsight') : [];
  let found = false;

  for (const sec of sections) {
    const valDiv = sec.querySelector ? (sec.querySelector('.detail-section-val') || sec) : sec;
    if (valDiv) {
      const txt = valDiv.textContent || '';
      const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'i');
      if (regex.test(txt)) {
        highlightWordInDetailSection(sec, word);
        found = true;
        break;
      }
    }
  }

  if (!found) {
    alert(`Không tìm thấy cụm từ "${word}" trong nội dung chi tiết.`);
  }
}

async function addWordToVocabularyDirect(word, translation, type) {
  const activeId = type === 'ielts' ? activeIeltsItemId : activeGeneralItemId;
  if (!activeId) return;

  const vaultData = type === 'ielts' ? ieltsVaultData : generalVaultData;
  const item = vaultData.items.find(i => i.id === activeId);
  if (!item) return;

  const isReading = type === 'ielts' && item.skill === 'reading';

  if (isReading) {
    const newRow = `| ${word} | ${translation} |`;
    if (!item.fields.keywords || !item.fields.keywords.trim()) {
      item.fields.keywords = `| Từ khóa trong Câu hỏi | Từ đồng nghĩa / Cụm từ trong Bài đọc |\n|---|---|\n${newRow}`;
    } else {
      const lines = item.fields.keywords.split('\n');
      const exists = lines.some(line => {
        const term = extractSearchTerm(line);
        return term.toLowerCase() === word.toLowerCase();
      });
      if (exists) {
        alert(`Từ "${word}" đã có trong bảng từ khóa.`);
        return;
      }
      item.fields.keywords = item.fields.keywords.trim() + '\n' + newRow;
    }
  } else {
    const newVocabLine = `${word}: ${translation}`;
    if (!item.fields.vocab) {
      item.fields.vocab = newVocabLine;
    } else {
      const lines = item.fields.vocab.split('\n');
      const exists = lines.some(line => {
        const term = extractSearchTerm(line);
        return term.toLowerCase() === word.toLowerCase();
      });
      if (exists) {
        alert(`Từ "${word}" đã có trong danh sách từ vựng.`);
        return;
      }
      item.fields.vocab = item.fields.vocab.trim() + '\n' + newVocabLine;
    }
  }

  if (type === 'ielts') {
    await saveIeltsData();
    renderIeltsDetail(activeId);
  } else {
    await saveGeneralData();
    renderGeneralDetail(activeId);
  }

  playTone(800, 0.1, 'sine', 0.2);
  alert(`Đã thêm thành công "${word}" vào ${isReading ? 'bảng từ khóa' : 'danh sách từ vựng'}!`);
}

function isInsideSelectableArea(node) {
  if (!node) return false;
  let curr = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  if (!curr || !curr.closest) return false;

  // Ignore interactive controls & buttons
  if (curr.closest('input, textarea, button, select, .selection-search-tooltip, .titlebar-controls, .modal-actions, .bc-nav-item, .nav-btn, .tab-btn')) {
    return false;
  }
  if (curr.closest(
    '.selectable-text, .detail-section-val, #studyDetailContent, #detailContentScroll, ' +
    '#bcActiveWorkspace, #bcEventContext, #bcEventQuestionBox, #bcEventTitle, ' +
    '.bc-node-content, .bc-why-step, .bc-tab-content, .bc-main, .bc-main-panel, ' +
    '.bc-workspace, #bcVaultGoldenInsight, #bcVaultTakeawaysList, .comment-content, ' +
    '.comment-card, .cm-card, .vocab-inline-hover, .ielts-detail, .general-detail, ' +
    '#ieltsDetailScroll, #generalDetailScroll, .ielts-section'
  )) {
    return true;
  }

  return false;
}

let currentSelectionHandler = null;
let currentMouseDownHandler = null;
let currentDblClickHandler = null;
let currentMouseUpHandler = null;
let currentKeyDownHandler = null;
let anchorWordRange = null;
let ttsPronounceTimeout = null;
let selectionTooltip = null;
let activeSelectionContainer = null;
let activeSelectionType = 'ielts';
let activeTooltipText = '';

function findFirstTextNode(el) {
  if (!el) return null;
  if (el.nodeType === Node.TEXT_NODE) return el;
  for (let i = 0; i < el.childNodes.length; i++) {
    const res = findFirstTextNode(el.childNodes[i]);
    if (res) return res;
  }
  return null;
}

function getWordRangeAtPoint(x, y) {
  let range = null;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (pos && pos.offsetNode) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.setEnd(pos.offsetNode, pos.offset);
    }
  }

  if (!range) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      range = sel.getRangeAt(0);
    }
  }

  if (!range) return null;

  let node = range.startContainer;
  let offset = range.startOffset;

  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.childNodes.length > 0) {
      const idx = Math.max(0, Math.min(offset, node.childNodes.length - 1));
      const child = node.childNodes[idx];
      if (child.nodeType === Node.TEXT_NODE) {
        node = child;
        offset = 0;
      } else {
        const textChild = findFirstTextNode(child);
        if (textChild) {
          node = textChild;
          offset = 0;
        }
      }
    }
  }

  if (node.nodeType !== Node.TEXT_NODE) {
    return range;
  }

  const text = node.nodeValue || '';
  if (!text) return range;

  const isWordChar = (c) => Boolean(c && /[\p{L}\p{N}_'\-]/u.test(c));

  let pos = Math.min(offset, text.length);
  if (pos > 0 && !isWordChar(text[pos]) && isWordChar(text[pos - 1])) {
    pos--;
  } else if (!isWordChar(text[pos])) {
    if (pos + 1 < text.length && isWordChar(text[pos + 1])) {
      pos++;
    } else if (pos > 0 && isWordChar(text[pos - 1])) {
      pos--;
    }
  }

  let start = pos;
  while (start > 0 && isWordChar(text[start - 1])) {
    start--;
  }

  let end = pos;
  while (end < text.length && isWordChar(text[end])) {
    end++;
  }

  if (start === end) {
    start = Math.max(0, pos);
    end = Math.min(text.length, pos + 1);
  }

  const wordRange = document.createRange();
  wordRange.setStart(node, start);
  wordRange.setEnd(node, end);
  return wordRange;
}

function mergeRanges(rangeA, rangeB) {
  if (!rangeA) return rangeB;
  if (!rangeB) return rangeA;

  const newRange = document.createRange();
  try {
    const startComp = rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB);
    if (startComp <= 0) {
      newRange.setStart(rangeA.startContainer, rangeA.startOffset);
    } else {
      newRange.setStart(rangeB.startContainer, rangeB.startOffset);
    }

    const endComp = rangeA.compareBoundaryPoints(Range.END_TO_END, rangeB);
    if (endComp >= 0) {
      newRange.setEnd(rangeA.endContainer, rangeA.endOffset);
    } else {
      newRange.setEnd(rangeB.endContainer, rangeB.endOffset);
    }
    return newRange;
  } catch (e) {
    console.warn('mergeRanges error:', e);
    return rangeB || rangeA;
  }
}

function setupTextSelectionSearch(containerEl, type) {
  activeSelectionContainer = containerEl;
  activeSelectionType = type || 'ielts';

  if (currentSelectionHandler) {
    document.removeEventListener('selectionchange', currentSelectionHandler);
  }
  if (currentMouseDownHandler) {
    document.removeEventListener('mousedown', currentMouseDownHandler);
  }
  if (currentDblClickHandler) {
    document.removeEventListener('dblclick', currentDblClickHandler);
  }
  if (currentMouseUpHandler) {
    document.removeEventListener('mouseup', currentMouseUpHandler);
  }
  if (currentKeyDownHandler) {
    document.removeEventListener('keydown', currentKeyDownHandler);
  }

  const handleSelection = () => {
    if (selectionTooltip && (selectionTooltip.contains(document.activeElement) || (window.event && window.event.target && selectionTooltip.contains(window.event.target)))) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      if (ttsPronounceTimeout) {
        clearTimeout(ttsPronounceTimeout);
        ttsPronounceTimeout = null;
      }
      hideTooltip();
      return;
    }
    const selectedText = selection.toString().trim();

    if (!selectedText || selectedText.length < 1) {
      if (ttsPronounceTimeout) {
        clearTimeout(ttsPronounceTimeout);
        ttsPronounceTimeout = null;
      }
      hideTooltip();
      return;
    }

    if (activeTooltipText === selectedText && selectionTooltip && selectionTooltip.style.display === 'flex') {
      return;
    }

    if (!isInsideSelectableArea(selection.anchorNode) && !isInsideSelectableArea(selection.focusNode)) {
      if (ttsPronounceTimeout) {
        clearTimeout(ttsPronounceTimeout);
        ttsPronounceTimeout = null;
      }
      hideTooltip();
      return;
    }

    // Debounced pronunciation trigger
    if (typeof speakPronunciation === 'function') {
      if (ttsPronounceTimeout) {
        clearTimeout(ttsPronounceTimeout);
      }
      ttsPronounceTimeout = setTimeout(() => {
        speakPronunciation(selectedText);
      }, 350);
    }

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showTooltip(rect, selectedText, activeSelectionContainer || containerEl);
    }
  };

  let hideSelectionTimeout = null;

  const handleMouseDown = (e) => {
    if (selectionTooltip && selectionTooltip.contains(e.target)) {
      return;
    }
    if (selectionTooltip && !selectionTooltip.contains(e.target)) {
      if (hideSelectionTimeout) clearTimeout(hideSelectionTimeout);
      hideSelectionTimeout = setTimeout(hideTooltip, 150);
    }

    const isModifierPressed = Boolean(e.ctrlKey || e.metaKey || e.shiftKey);
    const clickedWordRange = getWordRangeAtPoint(e.clientX, e.clientY);

    if (isModifierPressed && isInsideSelectableArea(e.target) && clickedWordRange) {
      const existingSel = window.getSelection();
      const existingRange = (existingSel && existingSel.rangeCount > 0 && !existingSel.isCollapsed)
        ? existingSel.getRangeAt(0)
        : null;
      const activeAnchor = anchorWordRange || existingRange;

      if (activeAnchor) {
        e.preventDefault();
        try {
          const combinedRange = mergeRanges(activeAnchor, clickedWordRange);
          anchorWordRange = activeAnchor;
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(combinedRange);
          handleSelection();
          return;
        } catch (err) {
          console.warn('Error expanding range on Ctrl+click:', err);
        }
      }
    }

    if (!isModifierPressed) {
      if (clickedWordRange && isInsideSelectableArea(e.target)) {
        anchorWordRange = clickedWordRange.cloneRange();
      } else {
        anchorWordRange = null;
      }
    }
  };

  const handleDblClick = (e) => {
    if (!isInsideSelectableArea(e.target)) return;

    const clickedWordRange = getWordRangeAtPoint(e.clientX, e.clientY);
    if (!clickedWordRange) return;

    const isModifierPressed = Boolean(e.ctrlKey || e.metaKey || e.shiftKey);
    const existingSel = window.getSelection();
    const existingRange = (existingSel && existingSel.rangeCount > 0 && !existingSel.isCollapsed)
      ? existingSel.getRangeAt(0)
      : null;

    const activeAnchor = anchorWordRange || existingRange;

    if (isModifierPressed && activeAnchor) {
      try {
        const combinedRange = mergeRanges(activeAnchor, clickedWordRange);
        anchorWordRange = activeAnchor; // keep origin anchor
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(combinedRange);
        handleSelection();
        e.preventDefault();
        return;
      } catch (err) {
        console.warn('Error expanding range on Ctrl+dblclick:', err);
      }
    }

    // Single word double-click sets the anchor
    anchorWordRange = clickedWordRange.cloneRange();
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(clickedWordRange);
    handleSelection();
    e.preventDefault();
  };

  const handleMouseUp = (e) => {
    if (selectionTooltip && selectionTooltip.contains(e.target)) {
      return;
    }
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      if (isInsideSelectableArea(sel.anchorNode) || isInsideSelectableArea(e.target)) {
        if (sel.rangeCount > 0) {
          anchorWordRange = sel.getRangeAt(0).cloneRange();
        }
        handleSelection();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      hideTooltip();
    }
  };

  currentSelectionHandler = handleSelection;
  currentMouseDownHandler = handleMouseDown;
  currentDblClickHandler = handleDblClick;
  currentMouseUpHandler = handleMouseUp;
  currentKeyDownHandler = handleKeyDown;

  document.addEventListener('selectionchange', handleSelection);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('dblclick', handleDblClick);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('keydown', handleKeyDown);

  async function showTooltip(rect, text, containerEl) {
    if (hideSelectionTimeout) {
      clearTimeout(hideSelectionTimeout);
      hideSelectionTimeout = null;
    }

    if (activeTooltipText === text && selectionTooltip && selectionTooltip.style.display === 'flex') {
      return;
    }
    activeTooltipText = text;

    if (!selectionTooltip) {
      selectionTooltip = document.createElement('div');
      selectionTooltip.className = 'selection-search-tooltip';
      document.body.appendChild(selectionTooltip);
    }

    const tooltipHeight = 110;
    const tooltipWidth = 270;

    let top = rect.top + window.scrollY - tooltipHeight - 12;
    let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);

    if (top < window.scrollY + 10) top = rect.bottom + window.scrollY + 12;
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;

    selectionTooltip.style.top = `${top}px`;
    selectionTooltip.style.left = `${left}px`;
    selectionTooltip.style.display = 'flex';

    selectionTooltip.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="tooltip-header" style="font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">DỊCH NGHĨA</span>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="tooltip-copy-btn" style="background: none; border: none; color: #38bdf8; font-size: 11px; cursor: pointer; padding: 0; outline: none; font-weight: 700; display: flex; align-items: center; gap: 3px;" title="Sao chép từ tiếng Anh này vào Clipboard">📋 Copy Từ</button>
          <button class="tooltip-speak-btn" style="background: none; border: none; color: #38bdf8; font-size: 11px; cursor: pointer; padding: 0; outline: none; font-weight: 700; display: flex; align-items: center; gap: 3px;" title="Phát âm từ/đoạn này">🔊 Nghe</button>
        </div>
      </div>
      <div class="translation-text" style="font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.35; margin: 4px 0 10px 0;">⏳ Đang dịch...</div>
      <div class="tooltip-btn-row" style="display: flex; gap: 6px; align-items: center;">
        <button class="tooltip-search-btn" style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; flex: 1; outline: none; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">🔍 Tìm</button>
        <button class="tooltip-add-btn" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border: none; color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; flex: 1.1; outline: none; display: none; align-items: center; justify-content: center; gap: 4px;">➕ Thêm từ</button>
        <button class="tooltip-tk-btn" style="background: linear-gradient(135deg, #ff0050 0%, #00f2fe 100%); border: none; color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; flex: 1.2; outline: none; display: inline-flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap;">🎵 Flashcard</button>
      </div>
    `;

    const copyBtn = selectionTooltip.querySelector('.tooltip-copy-btn');
    if (copyBtn) {
      copyBtn.onclick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        try {
          if (window.taskAPI && window.taskAPI.writeClipboardText) {
            await window.taskAPI.writeClipboardText(text);
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
          }
          if (typeof playTone === 'function') playTone(880, 0.08, 'sine', 0.15);
          const originalHtml = copyBtn.innerHTML;
          copyBtn.innerHTML = '✅ Đã Copy';
          copyBtn.style.color = '#34d399';
          setTimeout(() => {
            if (copyBtn) {
              copyBtn.innerHTML = originalHtml;
              copyBtn.style.color = '#38bdf8';
            }
          }, 1500);
        } catch (err) {
          console.error('Failed to copy word:', err);
        }
      };
    }

    const speakBtn = selectionTooltip.querySelector('.tooltip-speak-btn');
    if (speakBtn) {
      speakBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        speakPronunciation(text);
      };
    }

    const searchBtn = selectionTooltip.querySelector('.tooltip-search-btn');
    if (searchBtn) {
      searchBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        performSearch(text, activeSelectionContainer || containerEl);
        hideTooltip();
      };
    }

    try {
      let resJson;
      if (window.taskAPI && window.taskAPI.translateText) {
        resJson = await window.taskAPI.translateText(text, 'vi');
      } else {
        // Fallback in browser
        let success = false;
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=at&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
          const res = await fetch(url);
          if (res.ok) {
            resJson = await res.json();
            success = true;
          }
        } catch (e) {
          console.warn('[RENDERER] Browser translation fetch failed:', e);
        }

        if (!success) {
          try {
            const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`;
            const res = await fetch(myMemoryUrl);
            if (res.ok) {
              const data = await res.json();
              if (data && data.responseData && data.responseData.translatedText) {
                resJson = [[[data.responseData.translatedText, text]], null, 'en'];
                success = true;
              }
            }
          } catch (e) {
            console.error('[RENDERER] Browser fallback MyMemory API failed:', e);
          }
        }

        if (!success) {
          throw new Error('All browser-side translation fallbacks failed');
        }
      }

      let translation = '';
      if (typeof resJson === 'string') {
        translation = resJson;
      } else if (Array.isArray(resJson) && Array.isArray(resJson[0])) {
        translation = resJson[0].map(item => item && item[0] ? item[0] : '').filter(Boolean).join(' ');
      }

      if (translation && translation.toLowerCase().trim() !== text.toLowerCase().trim()) {
        const transEl = selectionTooltip.querySelector('.translation-text');
        if (transEl) transEl.textContent = translation;

        const addBtn = selectionTooltip.querySelector('.tooltip-add-btn');
        if (addBtn && (activeSelectionType === 'ielts' || activeSelectionType === 'general')) {
          addBtn.style.display = 'block';
          addBtn.onclick = async (e) => {
            e.stopPropagation();
            e.preventDefault();
            hideTooltip();
            await addWordToVocabularyDirect(text, translation, activeSelectionType);
          };
        }

        const tkBtn = selectionTooltip.querySelector('.tooltip-tk-btn');
        if (tkBtn) {
          tkBtn.style.display = 'block';
          tkBtn.onclick = async (e) => {
            e.stopPropagation();
            e.preventDefault();
            hideTooltip();
            await saveWordToTiktokFlashcardDirect(text, translation);
          };
        }
      } else {
        const transEl = selectionTooltip.querySelector('.translation-text');
        if (transEl) transEl.textContent = 'Không tìm thấy bản dịch.';
      }
    } catch (err) {
      console.error('Translation error:', err);
      const transEl = selectionTooltip.querySelector('.translation-text');
      if (transEl) transEl.textContent = 'Lỗi kết nối dịch thuật.';
    }
  }

  function hideTooltip() {
    if (selectionTooltip) {
      selectionTooltip.style.display = 'none';
    }
  }
}

function createDetailSectionImage(base64, index = 0, total = 1) {
  const div = document.createElement('div');
  div.className = 'detail-image-box';
  div.style.position = 'relative';

  const img = document.createElement('img');
  img.src = base64;
  img.alt = 'Biểu đồ đính kèm';

  img.addEventListener('click', () => {
    if (img.style.transform === 'scale(1.5)') {
      img.style.transform = 'scale(1)';
      img.style.zIndex = '1';
    } else {
      img.style.transform = 'scale(1.5)';
      img.style.zIndex = '100';
    }
  });

  // Top header overlay container for image (Numbering Input + Copy Button)
  const headerOverlay = document.createElement('div');
  headerOverlay.className = 'image-header-overlay';
  Object.assign(headerOverlay.style, {
    position: 'absolute',
    top: '8px',
    left: '8px',
    right: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: '101'
  });

  // Left side: Number Input container
  const numContainer = document.createElement('div');
  numContainer.className = 'img-number-container';
  Object.assign(numContainer.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    color: '#fbbf24',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    pointerEvents: 'auto'
  });

  const numLabel = document.createElement('span');
  numLabel.textContent = total > 1 ? `Số ảnh (${index + 1}/${total}):` : 'Số ảnh:';
  numLabel.style.color = '#f59e0b';
  numLabel.style.whiteSpace = 'nowrap';

  const numInput = document.createElement('input');
  numInput.type = 'text';
  numInput.inputMode = 'numeric';
  numInput.value = index + 1;
  numInput.title = 'Điền / đánh số ảnh (Nhập số bất kỳ)';
  Object.assign(numInput.style, {
    width: '48px',
    background: 'rgba(0, 0, 0, 0.65)',
    border: '1px solid rgba(245, 158, 11, 0.6)',
    color: '#ffffff',
    borderRadius: '4px',
    padding: '2px 4px',
    fontSize: '12px',
    fontWeight: '700',
    textAlign: 'center',
    outline: 'none',
    boxSizing: 'border-box'
  });

  numInput.addEventListener('focus', () => {
    numInput.style.borderColor = '#f59e0b';
    numInput.style.boxShadow = '0 0 6px rgba(245, 158, 11, 0.6)';
  });
  numInput.addEventListener('blur', () => {
    numInput.style.borderColor = 'rgba(245, 158, 11, 0.6)';
    numInput.style.boxShadow = 'none';
  });

  const stopProp = (e) => e.stopPropagation();
  numInput.addEventListener('keydown', stopProp);
  numInput.addEventListener('keyup', stopProp);
  numInput.addEventListener('click', stopProp);

  numContainer.appendChild(numLabel);
  numContainer.appendChild(numInput);

  // Right side: Copy Button
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'copy-img-btn';
  copyBtn.innerHTML = '📋 Sao chép ảnh';
  Object.assign(copyBtn.style, {
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#f1f5f9',
    padding: '5px 9px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    pointerEvents: 'auto',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    outline: 'none'
  });

  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.background = 'rgba(30, 41, 59, 0.95)';
    copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.25)';
  });
  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.background = 'rgba(15, 23, 42, 0.85)';
    copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  });

  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      if (window.taskAPI && window.taskAPI.copyImage) {
        window.taskAPI.copyImage(base64);
      } else {
        const response = await fetch(base64);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
      }
      if (typeof playTone === 'function') playTone(660, 0.08, 'sine', 0.15);
      if (typeof SFX !== 'undefined' && SFX.complete) SFX.complete();
      alert('Đã sao chép ảnh vào Clipboard!');
    } catch (err) {
      console.error('Failed to copy image:', err);
      alert('Không thể sao chép ảnh: ' + err.message);
    }
  });

  headerOverlay.appendChild(numContainer);
  headerOverlay.appendChild(copyBtn);

  div.appendChild(img);
  div.appendChild(headerOverlay);
  return div;
}

// =========================================================
// General Study Vault Functions
// =========================================================
function showGeneralState(state) {
  const welcome = document.getElementById('generalWelcomeState');
  const form = document.getElementById('generalFormState');
  const detail = document.getElementById('generalDetailState');

  if (!welcome || !form || !detail) return;

  welcome.classList.remove('active');
  form.classList.remove('active');
  detail.classList.remove('active');

  if (state === 'welcome') {
    welcome.classList.add('active');
    activeGeneralItemId = null;
    document.querySelectorAll('#generalList .ielts-item-card').forEach(el => el.classList.remove('active'));
  } else if (state === 'form') {
    form.classList.add('active');
  } else if (state === 'detail') {
    detail.classList.add('active');
  }
}

function initGeneralSkillFormToggle() {
  const subjectSelect = document.getElementById('generalSubject');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', () => {
      const val = subjectSelect.value;
      document.querySelectorAll('.skill-fields-group').forEach(el => {
        el.classList.remove('active');
      });
      const activeGroup = document.getElementById(`fields-${val}`);
      if (activeGroup) {
        activeGroup.classList.add('active');
      }
    });
  }
}

function resetGeneralForm() {
  const idEl = document.getElementById('editGenItemId');
  const titleEl = document.getElementById('generalTitle');
  const subjectEl = document.getElementById('generalSubject');
  const dateEl = document.getElementById('generalDate');
  const masteryEl = document.getElementById('generalMastery');
  const folderEl = document.getElementById('generalFolder');
  const linkEl = document.getElementById('generalLink');

  if (idEl) idEl.value = '';
  if (titleEl) titleEl.value = '';
  if (subjectEl) subjectEl.value = 'korean';
  if (dateEl) dateEl.value = getCurrentDateKey();
  if (masteryEl) masteryEl.value = '0';
  if (folderEl) folderEl.value = 'Mặc định';
  if (linkEl) linkEl.value = '';

  document.querySelectorAll('#generalForm textarea').forEach(textarea => {
    textarea.value = '';
  });

  document.querySelectorAll('.skill-fields-group').forEach(el => {
    el.classList.remove('active');
  });
  const koreanFields = document.getElementById('fields-korean');
  if (koreanFields) koreanFields.classList.add('active');
}

function handleNewGeneralClick() {
  resetGeneralForm();
  const formTitle = document.getElementById('genFormTitle');
  if (formTitle) formTitle.textContent = '📝 Thêm tài liệu học tập mới';
  showGeneralState('form');
  playTone(500, 0.1, 'sine', 0.15);
}

function handleSaveGeneral() {
  const titleEl = document.getElementById('generalTitle');
  const subjectEl = document.getElementById('generalSubject');
  const dateEl = document.getElementById('generalDate');
  const masteryEl = document.getElementById('generalMastery');
  const editIdEl = document.getElementById('editGenItemId');
  const folderEl = document.getElementById('generalFolder');
  const linkEl = document.getElementById('generalLink');

  if (!titleEl || !subjectEl) return;

  const title = titleEl.value.trim();
  const subject = subjectEl.value;
  const date = (dateEl && dateEl.value) ? dateEl.value : getCurrentDateKey();
  const mastery = masteryEl ? parseInt(masteryEl.value) : 0;
  const editId = editIdEl ? editIdEl.value : '';
  const folder = folderEl ? folderEl.value : 'Mặc định';
  const link = linkEl ? linkEl.value.trim() : '';

  if (!title) {
    titleEl.focus();
    titleEl.style.borderColor = '#ef4444';
    return;
  }
  titleEl.style.borderColor = '';

  const fields = {};
  if (subject === 'math') {
    fields.problem = document.getElementById('mathProblem').value.trim();
    fields.theory = document.getElementById('mathTheory').value.trim();
    fields.steps = document.getElementById('mathSteps').value.trim();
    fields.solution = document.getElementById('mathSolution').value.trim();
  } else if (subject === 'korean') {
    fields.vocab = document.getElementById('koreanVocab').value.trim();
    fields.dialogue = document.getElementById('koreanDialogue').value.trim();
    fields.pron = document.getElementById('koreanPron').value.trim();
    fields.translation = document.getElementById('koreanTranslation').value.trim();
  } else if (subject === 'japanese') {
    fields.vocab = document.getElementById('japaneseVocab').value.trim();
    fields.dialogue = document.getElementById('japaneseDialogue').value.trim();
    fields.translation = document.getElementById('japaneseTranslation').value.trim();
  } else if (subject === 'coding') {
    fields.problem = document.getElementById('codingProblem').value.trim();
    fields.concept = document.getElementById('codingConcept').value.trim();
    fields.solution = document.getElementById('codingSolution').value.trim();
    fields.analysis = document.getElementById('codingAnalysis').value.trim();
  } else if (subject === 'other') {
    fields.theory = document.getElementById('genTheory').value.trim();
    fields.exercise = document.getElementById('genExercise').value.trim();
    fields.solution = document.getElementById('genSolution').value.trim();
  }

  if (editId) {
    const idx = generalVaultData.items.findIndex(item => item.id === editId);
    if (idx !== -1) {
      generalVaultData.items[idx] = {
        id: editId,
        title,
        subject,
        date,
        mastery,
        folder,
        link,
        fields
      };
      activeGeneralItemId = editId;
    }
  } else {
    const newItemId = 'general-' + Date.now();
    const newItem = {
      id: newItemId,
      title,
      subject,
      date,
      mastery,
      folder,
      link,
      fields
    };
    generalVaultData.items.push(newItem);
    activeGeneralItemId = newItemId;
  }

  saveGeneralData();
  SFX.add();
  renderGeneralDetail(activeGeneralItemId);
}

function handleEditGeneral() {
  const item = generalVaultData.items.find(item => item.id === activeGeneralItemId);
  if (!item) return;

  resetGeneralForm();
  const formTitle = document.getElementById('genFormTitle');
  if (formTitle) formTitle.textContent = '✏️ Chỉnh sửa tài liệu học tập';

  document.getElementById('editGenItemId').value = item.id;
  document.getElementById('generalTitle').value = item.title;
  document.getElementById('generalSubject').value = item.subject;
  document.getElementById('generalDate').value = item.date;
  document.getElementById('generalMastery').value = item.mastery;

  const linkEl = document.getElementById('generalLink');
  if (linkEl) {
    linkEl.value = item.link || '';
  }

  const folderEl = document.getElementById('generalFolder');
  if (folderEl) {
    folderEl.value = item.folder || 'Mặc định';
  }

  const subjectSelect = document.getElementById('generalSubject');
  if (subjectSelect) {
    subjectSelect.dispatchEvent(new Event('change'));
  }

  const f = item.fields;
  if (item.subject === 'math') {
    document.getElementById('mathProblem').value = f.problem || '';
    document.getElementById('mathTheory').value = f.theory || '';
    document.getElementById('mathSteps').value = f.steps || '';
    document.getElementById('mathSolution').value = f.solution || '';
  } else if (item.subject === 'korean') {
    document.getElementById('koreanVocab').value = f.vocab || '';
    document.getElementById('koreanDialogue').value = f.dialogue || '';
    document.getElementById('koreanPron').value = f.pron || '';
    document.getElementById('koreanTranslation').value = f.translation || '';
  } else if (item.subject === 'japanese') {
    document.getElementById('japaneseVocab').value = f.vocab || '';
    document.getElementById('japaneseDialogue').value = f.dialogue || '';
    document.getElementById('japaneseTranslation').value = f.translation || '';
  } else if (item.subject === 'coding') {
    document.getElementById('codingProblem').value = f.problem || '';
    document.getElementById('codingConcept').value = f.concept || '';
    document.getElementById('codingSolution').value = f.solution || '';
    document.getElementById('codingAnalysis').value = f.analysis || '';
  } else if (item.subject === 'other') {
    document.getElementById('genTheory').value = f.theory || '';
    document.getElementById('genExercise').value = f.exercise || '';
    document.getElementById('genSolution').value = f.solution || '';
  }
  showGeneralState('form');
  playTone(500, 0.1, 'sine', 0.1);
}

function handleDeleteGeneral() {
  const item = generalVaultData.items.find(item => item.id === activeGeneralItemId);
  if (!item) return;

  showConfirm('Xóa tài liệu', `Bạn có chắc chắn muốn xóa tài liệu "${item.title}" không?`, () => {
    const idx = generalVaultData.items.findIndex(el => el.id === activeGeneralItemId);
    if (idx !== -1) {
      generalVaultData.items.splice(idx, 1);
      saveGeneralData();
      SFX.delete();
      showGeneralState('welcome');
    }
  });
}

function renderGenChallengeGrid() {
  const grid = document.getElementById('genChallengeGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const startStr = generalVaultData.challengeStartDate || getCurrentDateKey();
  const todayStr = getCurrentDateKey();
  const dayNum = getChallengeDayNumber(startStr);

  const daysText = document.getElementById('genChallengeDaysText');
  if (daysText) daysText.textContent = `Ngày ${dayNum > 0 ? dayNum : 1} / 60`;

  const itemsByDate = {};
  generalVaultData.items.forEach(item => {
    const d = item.date;
    itemsByDate[d] = (itemsByDate[d] || 0) + 1;
  });

  let targetDaysMet = 0;

  for (let i = 0; i < 60; i++) {
    const cellDate = addDays(startStr, i);
    const count = itemsByDate[cellDate] || 0;

    if (count >= 100) {
      targetDaysMet++;
    }

    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.textContent = i + 1;

    if (count === 0) {
      cell.classList.add('level-0');
    } else if (count < 50) {
      cell.classList.add('level-1');
    } else if (count < 100) {
      cell.classList.add('level-2');
    } else {
      cell.classList.add('level-3');
    }

    const parts = cellDate.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : cellDate;
    cell.title = `Ngày ${i + 1} (${formattedDate}): Đã lưu ${count} / 100 tài liệu`;

    cell.addEventListener('click', () => {
      const dateInp = document.getElementById('generalDate');
      if (dateInp) {
        dateInp.value = cellDate;
        playTone(600, 0.1, 'sine', 0.1);
      }
    });

    grid.appendChild(cell);
  }

  const todayCount = itemsByDate[todayStr] || 0;
  const todayPct = Math.min(100, Math.round((todayCount / 100) * 100));

  const todayCountEl = document.getElementById('genTodayCount');
  if (todayCountEl) todayCountEl.textContent = `${todayCount} / 100`;

  const todayProgressEl = document.getElementById('genTodayProgress');
  if (todayProgressEl) todayProgressEl.style.width = `${todayPct}%`;

  const goalDaysEl = document.getElementById('genGoalDays');
  if (goalDaysEl) goalDaysEl.textContent = `${targetDaysMet} / 60`;

  const totalSavedEl = document.getElementById('genTotalSaved');
  if (totalSavedEl) totalSavedEl.textContent = generalVaultData.items.length;
}

function renderGeneralList() {
  const searchInp = document.getElementById('generalSearch');
  const subjectFilter = document.getElementById('filterGenSubject');
  const masteryFilter = document.getElementById('filterGenMastery');
  const folderFilter = document.getElementById('filterGenFolder');
  const list = document.getElementById('generalList');

  if (!list) return;
  list.innerHTML = '';

  const searchVal = searchInp ? searchInp.value.toLowerCase() : '';
  const filterSubject = subjectFilter ? subjectFilter.value : 'all';
  const filterMastery = masteryFilter ? masteryFilter.value : 'all';
  const filterFolder = folderFilter ? folderFilter.value : 'all';

  const filtered = generalVaultData.items.filter(item => {
    const searchMatch = !searchVal ||
      item.title.toLowerCase().includes(searchVal) ||
      (item.fields.problem && item.fields.problem.toLowerCase().includes(searchVal)) ||
      (item.fields.vocab && item.fields.vocab.toLowerCase().includes(searchVal)) ||
      (item.fields.theory && item.fields.theory.toLowerCase().includes(searchVal)) ||
      (item.fields.concept && item.fields.concept.toLowerCase().includes(searchVal));

    const subjectMatch = filterSubject === 'all' || item.subject === filterSubject;
    const masteryMatch = filterMastery === 'all' || item.mastery === parseInt(filterMastery);

    const itemFolder = item.folder || 'Mặc định';
    const folderMatch = filterFolder === 'all' || itemFolder === filterFolder;

    return searchMatch && subjectMatch && masteryMatch && folderMatch;
  });

  filtered.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id.localeCompare(a.id);
  });

  const empty = document.getElementById('generalEmptyState');
  if (filtered.length === 0) {
    if (empty) empty.classList.add('visible');
    return;
  }
  if (empty) empty.classList.remove('visible');

  const subjectIcons = {
    math: '📐 Toán',
    korean: '🗣️ Tiếng Hàn',
    japanese: '🎌 Tiếng Nhật',
    coding: '💻 Lập trình',
    other: '📚 Môn khác'
  };

  filtered.forEach(item => {
    const li = document.createElement('li');
    li.className = 'ielts-item-card';
    if (item.id === activeGeneralItemId) {
      li.classList.add('active');
    }

    const parts = item.date.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.date;

    li.innerHTML = `
      <div class="item-card-header">
        <span class="skill-badge ${item.subject}">${subjectIcons[item.subject] || item.subject}</span>
        <span class="item-card-date">${formattedDate}</span>
      </div>
      <div class="item-card-title">${escHtml(item.title)}</div>
      <div class="item-card-footer">
        <span>
          <span class="mastery-dot level-${item.mastery}"></span>
          ${getMasteryLabel(item.mastery)}
        </span>
      </div>
    `;

    li.addEventListener('click', () => {
      document.querySelectorAll('#generalList .ielts-item-card').forEach(el => el.classList.remove('active'));
      li.classList.add('active');
      activeGeneralItemId = item.id;
      renderGeneralDetail(item.id);
      playTone(500, 0.08, 'sine', 0.1);
    });

    list.appendChild(li);
  });
}

function handleGenQuickMasterySelect(e) {
  const btn = e.target.closest('.m-gen-select-btn');
  if (!btn) return;
  const level = parseInt(btn.dataset.level);
  if (isNaN(level)) return;

  const item = generalVaultData.items.find(el => el.id === activeGeneralItemId);
  if (!item) return;

  item.mastery = level;
  saveGeneralData();

  document.querySelectorAll('#generalDetailState .m-gen-select-btn').forEach(b => {
    if (parseInt(b.dataset.level) === level) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  playTone(550, 0.08, 'sine', 0.15);
}

let generalScrollClickHandler = null;

function renderGeneralDetail(itemId) {
  const item = generalVaultData.items.find(el => el.id === itemId);
  if (!item) {
    showGeneralState('welcome');
    return;
  }

  showGeneralState('detail');

  const f = item.fields;
  let vocabText = '';
  if (f.vocab) vocabText += '\n' + f.vocab;
  currentVocabMap = buildVocabMap(vocabText);

  const detailTitleEl = document.getElementById('detailGenTitle');
  if (detailTitleEl) detailTitleEl.textContent = item.title;

  const detailSubjectEl = document.getElementById('detailGenSubject');
  if (detailSubjectEl) {
    const subjectIcons = {
      math: '📐 Toán',
      korean: '🗣️ Tiếng Hàn',
      japanese: '🎌 Tiếng Nhật',
      coding: '💻 Lập trình',
      other: '📚 Môn khác'
    };
    detailSubjectEl.className = `skill-badge ${item.subject}`;
    detailSubjectEl.textContent = subjectIcons[item.subject] || item.subject;
  }

  const detailDateEl = document.getElementById('detailGenDate');
  if (detailDateEl) {
    const parts = item.date.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.date;
    detailDateEl.textContent = `📅 Ngày lưu: ${formattedDate}`;
  }

  const detailFolderEl = document.getElementById('detailGenFolder');
  if (detailFolderEl) detailFolderEl.textContent = `📁 Thư mục: ${item.folder || 'Mặc định'}`;

  const linkContainer = document.getElementById('detailGenLinkContainer');
  const linkEl = document.getElementById('detailGenLink');
  if (linkContainer && linkEl) {
    if (item.link) {
      linkContainer.style.display = 'block';
      linkEl.textContent = 'Mở liên kết ➔';
      linkEl.setAttribute('data-url', item.link);
    } else {
      linkContainer.style.display = 'none';
      linkEl.removeAttribute('data-url');
    }
  }

  document.querySelectorAll('#generalDetailState .m-gen-select-btn').forEach(btn => {
    const btnLvl = parseInt(btn.dataset.level);
    if (btnLvl === item.mastery) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const scroll = document.getElementById('detailGenContentScroll');
  if (!scroll) return;
  scroll.innerHTML = '';


  if (item.subject === 'math') {
    if (f.problem) scroll.appendChild(createDetailSection('Đề bài / Bài toán mẫu', f.problem));
    if (f.theory) scroll.appendChild(createDetailSection('Công thức & Lý thuyết liên quan', f.theory));
    if (f.steps) scroll.appendChild(createDetailSection('Phương pháp & Các bước giải quyết', f.steps));
    if (f.solution) scroll.appendChild(createDetailSection('Lời giải chi tiết & Lưu ý quan trọng', f.solution));
  } else if (item.subject === 'korean') {
    if (f.vocab) scroll.appendChild(createDetailSection('Từ vựng & Ngữ pháp mới', f.vocab));
    if (f.dialogue) scroll.appendChild(createDetailSection('Hội thoại mẫu & Ví dụ', f.dialogue));
    if (f.pron) scroll.appendChild(createDetailSection('Ghi chú phát âm & Ngữ điệu', f.pron));
    if (f.translation) scroll.appendChild(createDetailSection('Bản dịch nghĩa tiếng Việt & Văn hóa', f.translation));
  } else if (item.subject === 'japanese') {
    if (f.vocab) scroll.appendChild(createDetailSection('Kanji, Từ vựng & Ngữ pháp (N5 - N1)', f.vocab));
    if (f.dialogue) scroll.appendChild(createDetailSection('Hội thoại / Câu ví dụ thực tế', f.dialogue));
    if (f.translation) scroll.appendChild(createDetailSection('Dịch nghĩa & Giải thích chi tiết', f.translation));
  } else if (item.subject === 'coding') {
    if (f.problem) scroll.appendChild(createDetailSection('Yêu cầu thuật toán / Bài toán code', f.problem));
    if (f.concept) scroll.appendChild(createDetailSection('Khái niệm cốt lõi & Cấu trúc dữ liệu', f.concept));
    if (f.solution) {
      const codeSec = createDetailSection('Mã nguồn mẫu / Snippet Code', f.solution);
      const valDiv = codeSec.querySelector('.detail-section-val');
      if (valDiv) {
        valDiv.style.fontFamily = 'monospace';
        valDiv.style.whiteSpace = 'pre-wrap';
        valDiv.style.background = 'rgba(0,0,0,0.2)';
        valDiv.style.padding = '10px';
        valDiv.style.borderRadius = '6px';
        valDiv.style.border = '1px solid rgba(255,255,255,0.05)';
      }
      scroll.appendChild(codeSec);
    }
    if (f.analysis) scroll.appendChild(createDetailSection('Giải thích thuật toán & Độ phức tạp (Big O)', f.analysis));
  } else if (item.subject === 'other') {
    if (f.theory) scroll.appendChild(createDetailSection('Lý thuyết trọng tâm & Nội dung bài học', f.theory));
    if (f.exercise) scroll.appendChild(createDetailSection('Bài tập tự luyện & Câu hỏi', f.exercise));
    if (f.solution) scroll.appendChild(createDetailSection('Đáp án & Giải thích chi tiết', f.solution));
  }

  // Setup search delegation and text selection for study details
  if (generalScrollClickHandler) {
    scroll.removeEventListener('click', generalScrollClickHandler);
  }
  generalScrollClickHandler = (e) => {
    const btn = e.target.closest('.vocab-search-btn');
    if (btn) {
      const word = btn.dataset.search;
      performSearch(word, scroll);
    }
  };
  scroll.addEventListener('click', generalScrollClickHandler);

  setupTextSelectionSearch(scroll, 'general');
  setupVocabHoverTooltips(scroll);
}

function compileGeneralPrompt(subject, rawInput) {
  if (subject === 'math') {
    return `You are an expert Math teacher.
The user has pasted a block of text containing mathematical concepts, exercises, formulas, or notes.
Input block:
${rawInput}

Analyze this block and extract/generate Math study notes in Vietnamese:
1. "title": A short title for this document.
2. "problem": Đề bài / Bài toán mẫu.
3. "theory": Công thức & Lý thuyết liên quan.
4. "steps": Phương pháp & Các bước giải quyết.
5. "solution": Lời giải chi tiết & Lưu ý quan trọng.

Format your response strictly as a single JSON object without markdown code blocks. Do not use ellipses (...) as values in the JSON object. The output must be valid JSON:
{
  "title": "[Tiêu đề bài học toán học ngắn gọn]",
  "problem": "[Đề bài toán mẫu hoặc yêu cầu]",
  "theory": "[Các định lý, công thức và lý thuyết cần nhớ]",
  "steps": "[Phương pháp và các bước giải cụ thể]",
  "solution": "[Lời giải chi tiết từng bước và lưu ý]"
}`;
  } else if (subject === 'korean') {
    return `You are an expert Korean language instructor.
The user has pasted a block of text containing Korean vocab, grammar points, expressions, or conversations.
Input block:
${rawInput}

Analyze this block and extract/generate Korean study notes in Vietnamese:
1. "title": A short title for this study session.
2. "vocab": Từ vựng & Ngữ pháp mới.
3. "dialogue": Hội thoại mẫu & Ví dụ.
4. "pron": Ghi chú phát âm & Ngữ điệu.
5. "translation": Bản dịch nghĩa tiếng Việt & Văn hóa.

Format your response strictly as a single JSON object without markdown code blocks. Do not use ellipses (...) as values in the JSON object. The output must be valid JSON:
{
  "title": "[Tiêu đề buổi học tiếng Hàn]",
  "vocab": "[Danh sách từ vựng và cấu trúc ngữ pháp mới kèm giải thích]",
  "dialogue": "[Đoạn hội thoại mẫu hoặc câu ví dụ tiếng Hàn]",
  "pron": "[Hướng dẫn phát âm, biến âm và ngữ điệu]",
  "translation": "[Bản dịch nghĩa tiếng Việt và ghi chú văn hóa nếu có]"
}`;
  } else if (subject === 'japanese') {
    return `You are an expert Japanese language instructor.
The user has pasted a block of text containing Japanese vocab, kanji, grammar points, or listening/reading transcript.
Input block:
${rawInput}

Analyze this block and extract/generate Japanese study notes in Vietnamese:
1. "title": A short title for this study session.
2. "vocab": Kanji, Từ vựng & Ngữ pháp (N5 - N1).
3. "dialogue": Hội thoại / Câu ví dụ thực tế.
4. "translation": Dịch nghĩa & Giải thích chi tiết.

Format your response strictly as a single JSON object without markdown code blocks. Do not use ellipses (...) as values in the JSON object. The output must be valid JSON:
{
  "title": "[Tiêu đề học tiếng Nhật]",
  "vocab": "[Danh sách chữ Kanji, từ vựng và cấu trúc ngữ pháp mới kèm giải thích]",
  "dialogue": "[Các mẫu hội thoại hoặc câu ví dụ thực tế bằng tiếng Nhật]",
  "translation": "[Bản dịch nghĩa tiếng Việt và giải thích chi tiết ngữ cảnh sử dụng]"
}`;
  } else if (subject === 'coding') {
    return `You are an expert Coding instructor.
The user has pasted a block of text containing coding concepts, tasks, snippet ideas, or logs.
Input block:
${rawInput}

Analyze this block and extract/generate Coding study notes in Vietnamese:
1. "title": A short title for this snippet/concept.
2. "problem": Yêu cầu thuật toán / Bài toán code.
3. "concept": Phái niệm cốt lõi & Cấu trúc dữ liệu.
4. "solution": Mã nguồn mẫu / Snippet Code.
5. "analysis": Giải thích thuật toán & Độ phức tạp (Big O).

Format your response strictly as a single JSON object without markdown code blocks. Do not use ellipses (...) as values in the JSON object. The output must be valid JSON:
{
  "title": "[Tiêu đề snippet hoặc bài học lập trình]",
  "problem": "[Yêu cầu của thuật toán hoặc bài toán lập trình]",
  "concept": "[Phân tích khái niệm cốt lõi và các cấu trúc dữ liệu sử dụng]",
  "solution": "[Đoạn mã nguồn mẫu code tối ưu]",
  "analysis": "[Giải thích chi tiết thuật toán và độ phức tạp Big O]"
}`;
  } else if (subject === 'other') {
    return `You are an expert general learning tutor.
The user has pasted a block of text for a general subject.
Input block:
${rawInput}

Analyze this block and extract/generate study notes in Vietnamese:
1. "title": A short title.
2. "theory": Lý thuyết trọng tâm & Nội dung bài học.
3. "exercise": Bài tập tự luyện & Câu hỏi.
4. "solution": Đáp án & Giải thích chi tiết.

Format your response strictly as a single JSON object without markdown code blocks. Do not use ellipses (...) as values in the JSON object. The output must be valid JSON:
{
  "title": "[Tiêu đề tài liệu học tập]",
  "theory": "[Nội dung lý thuyết trọng tâm lý thuyết cần nắm vững]",
  "exercise": "[Các câu hỏi bài tập tự luyện củng cố]",
  "solution": "[Đáp án và hướng dẫn giải thích chi tiết bài tập]"
}`;
  }
  return '';
}

async function handleGenAiAnalyze() {
  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  if (!apiKey) {
    alert('Vui lòng cài đặt Gemini API Key ở khung "Gemini API Key" trước khi dùng tính năng AI.');
    const settingsBox = document.getElementById('apiKeySettingsBox');
    if (settingsBox) settingsBox.style.display = 'flex';
    return;
  }

  const subject = document.getElementById('generalSubject').value;
  let rawInput = '';

  if (subject === 'math') {
    rawInput = document.getElementById('mathProblem').value.trim();
    if (!rawInput) rawInput = document.getElementById('mathSolution').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán nội dung Đề bài vào ô đầu tiên hoặc Lời giải.');
      document.getElementById('mathProblem').focus();
      return;
    }
  } else if (subject === 'korean') {
    rawInput = document.getElementById('koreanVocab').value.trim();
    if (!rawInput) rawInput = document.getElementById('koreanDialogue').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán từ vựng vào ô đầu tiên hoặc Hội thoại mẫu.');
      document.getElementById('koreanVocab').focus();
      return;
    }
  } else if (subject === 'japanese') {
    rawInput = document.getElementById('japaneseVocab').value.trim();
    if (!rawInput) rawInput = document.getElementById('japaneseDialogue').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán Kanji/từ vựng vào ô đầu tiên hoặc Hội thoại.');
      document.getElementById('japaneseVocab').focus();
      return;
    }
  } else if (subject === 'coding') {
    rawInput = document.getElementById('codingProblem').value.trim();
    if (!rawInput) rawInput = document.getElementById('codingSolution').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập Yêu cầu thuật toán vào ô đầu tiên hoặc Mã nguồn mẫu.');
      document.getElementById('codingProblem').focus();
      return;
    }
  } else if (subject === 'other') {
    rawInput = document.getElementById('genTheory').value.trim();
    if (!rawInput) rawInput = document.getElementById('genSolution').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập Lý thuyết trọng tâm vào ô đầu tiên hoặc Đáp án.');
      document.getElementById('genTheory').focus();
      return;
    }
  }

  const btn = document.getElementById('btnGenAiAnalyze');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '🤖 Đang phân tích...';

  const fullPrompt = compileGeneralPrompt(subject, rawInput);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.error && errJson.error.message) {
          errorMsg = errJson.error.message;
        }
      } catch (e) { }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    const rawText = result.candidates[0].content.parts[0].text.trim();
    const data = parseAiJsonResponse(rawText);

    if (data.title) {
      setInputValue('generalTitle', data.title);
    }

    if (subject === 'math') {
      if (data.problem) setInputValue('mathProblem', data.problem);
      if (data.theory) setInputValue('mathTheory', data.theory);
      if (data.steps) setInputValue('mathSteps', data.steps);
      if (data.solution) setInputValue('mathSolution', data.solution);
    } else if (subject === 'korean') {
      if (data.vocab) setInputValue('koreanVocab', data.vocab);
      if (data.dialogue) setInputValue('koreanDialogue', data.dialogue);
      if (data.pron) setInputValue('koreanPron', data.pron);
      if (data.translation) setInputValue('koreanTranslation', data.translation);
    } else if (subject === 'japanese') {
      if (data.vocab) setInputValue('japaneseVocab', data.vocab);
      if (data.dialogue) setInputValue('japaneseDialogue', data.dialogue);
      if (data.translation) setInputValue('japaneseTranslation', data.translation);
    } else if (subject === 'coding') {
      if (data.problem) setInputValue('codingProblem', data.problem);
      if (data.concept) setInputValue('codingConcept', data.concept);
      if (data.solution) setInputValue('codingSolution', data.solution);
      if (data.analysis) setInputValue('codingAnalysis', data.analysis);
    } else if (subject === 'other') {
      if (data.theory) setInputValue('genTheory', data.theory);
      if (data.exercise) setInputValue('genExercise', data.exercise);
      if (data.solution) setInputValue('genSolution', data.solution);
    }
    playTone(800, 0.15, 'sine', 0.2);
    SFX.complete();
    alert('AI đã tự động phân tích, phân tách và điền vào các ô nội dung thành công!');

  } catch (err) {
    console.error('AI Error:', err);
    alert(`Lỗi AI Gemini: ${err.message}\n\nVui lòng kiểm tra lại API Key hoặc kết nối mạng.`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function handleGenWebAiAssist() {
  const subject = document.getElementById('generalSubject').value;
  let rawInput = '';

  if (subject === 'math') {
    rawInput = document.getElementById('mathProblem').value.trim();
    if (!rawInput) rawInput = document.getElementById('mathSolution').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán nội dung Đề bài vào ô đầu tiên hoặc Lời giải.');
      document.getElementById('mathProblem').focus();
      return;
    }
  } else if (subject === 'korean') {
    rawInput = document.getElementById('koreanVocab').value.trim();
    if (!rawInput) rawInput = document.getElementById('koreanDialogue').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán từ vựng vào ô đầu tiên hoặc Hội thoại mẫu.');
      document.getElementById('koreanVocab').focus();
      return;
    }
  } else if (subject === 'japanese') {
    rawInput = document.getElementById('japaneseVocab').value.trim();
    if (!rawInput) rawInput = document.getElementById('japaneseDialogue').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập hoặc dán Kanji/từ vựng vào ô đầu tiên hoặc Hội thoại.');
      document.getElementById('japaneseVocab').focus();
      return;
    }
  } else if (subject === 'coding') {
    rawInput = document.getElementById('codingProblem').value.trim();
    if (!rawInput) rawInput = document.getElementById('codingSolution').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập Yêu cầu thuật toán vào ô đầu tiên hoặc Mã nguồn mẫu.');
      document.getElementById('codingProblem').focus();
      return;
    }
  } else if (subject === 'other') {
    rawInput = document.getElementById('genTheory').value.trim();
    if (!rawInput) rawInput = document.getElementById('genSolution').value.trim();
    if (!rawInput) {
      alert('Vui lòng nhập Lý thuyết trọng tâm vào ô đầu tiên hoặc Đáp án.');
      document.getElementById('genTheory').focus();
      return;
    }
  }

  activeGenWebAiPrompt = compileGeneralPrompt(subject, rawInput);

  const copyImageBtn = document.getElementById('btnCopyWebAiImage');
  if (copyImageBtn) {
    copyImageBtn.style.display = 'none';
  }

  copyTextToClipboard(activeGenWebAiPrompt).then(() => {
    document.getElementById('webAiJsonInput').value = '';
    document.getElementById('webAiModal').classList.add('active');
    playTone(440, 0.1, 'sine', 0.2);
  }).catch(err => {
    document.getElementById('webAiJsonInput').value = '';
    document.getElementById('webAiModal').classList.add('active');
    alert('Không thể tự động sao chép vào Clipboard. Vui lòng bấm nút "Copy lại Prompt" để copy thủ công.');
  });
}

function handleGenWebAiApply() {
  const subject = document.getElementById('generalSubject').value;
  let text = document.getElementById('webAiJsonInput').value.trim();
  if (!text) {
    alert('Vui lòng dán nội dung JSON phản hồi từ Gemini vào ô nhập liệu.');
    return;
  }

  try {
    const data = parseAiJsonResponse(text);
    if (data.title) {
      setInputValue('generalTitle', data.title);
    }

    if (subject === 'math') {
      if (data.problem) setInputValueIfEmpty('mathProblem', data.problem);
      if (data.theory) setInputValue('mathTheory', data.theory);
      if (data.steps) setInputValue('mathSteps', data.steps);
      if (data.solution) setInputValue('mathSolution', data.solution);
    } else if (subject === 'korean') {
      if (data.vocab) setInputValueIfEmpty('koreanVocab', data.vocab);
      if (data.dialogue) setInputValue('koreanDialogue', data.dialogue);
      if (data.pron) setInputValue('koreanPron', data.pron);
      if (data.translation) setInputValue('koreanTranslation', data.translation);
    } else if (subject === 'japanese') {
      if (data.vocab) setInputValueIfEmpty('japaneseVocab', data.vocab);
      if (data.dialogue) setInputValue('japaneseDialogue', data.dialogue);
      if (data.translation) setInputValue('japaneseTranslation', data.translation);
    } else if (subject === 'coding') {
      if (data.problem) setInputValueIfEmpty('codingProblem', data.problem);
      if (data.concept) setInputValue('codingConcept', data.concept);
      if (data.solution) setInputValue('codingSolution', data.solution);
      if (data.analysis) setInputValue('codingAnalysis', data.analysis);
    } else if (subject === 'other') {
      if (data.theory) setInputValueIfEmpty('genTheory', data.theory);
      if (data.exercise) setInputValue('genExercise', data.exercise);
      if (data.solution) setInputValue('genSolution', data.solution);
    }
    document.getElementById('webAiModal').classList.remove('active');
    playTone(800, 0.15, 'sine', 0.2);
    SFX.complete();
    alert('Áp dụng kết quả phân tích từ Web AI thành công!');
  } catch (e) {
    alert('Không thể phân tích dữ liệu JSON vừa dán. Chi tiết lỗi: ' + e.message);
  }
}

// =========================================================
// Web Links Vault Helpers
// =========================================================
function getCategoryBadgeLabel(cat) {
  switch (cat) {
    case 'speaking': return '🗣️ Speaking';
    case 'writing': return '✍️ Writing';
    case 'reading': return '📖 Reading';
    case 'listening': return '🎧 Listening';
    default: return '🌐 General';
  }
}

function showSpeakingState(state) {
  const welcome = document.getElementById('speakingWelcomeState');
  const detail = document.getElementById('speakingDetailState');

  if (state === 'welcome') {
    if (welcome) welcome.style.display = 'block';
    if (detail) detail.style.display = 'none';
    activeSpeakingLinkId = null;
    document.querySelectorAll('#speakingList li').forEach(li => li.classList.remove('active'));
  } else if (state === 'detail') {
    if (welcome) welcome.style.display = 'none';
    if (detail) detail.style.display = 'block';
  }
}

function resetSpeakingForm() {
  document.getElementById('speakingForm').reset();
  document.getElementById('editSpeakLinkId').value = '';
  const categoryEl = document.getElementById('speakLinkCategory');
  if (categoryEl) categoryEl.value = 'all';
  const cancelBtn = document.getElementById('btnCancelSpeakLink');
  if (cancelBtn) cancelBtn.style.display = 'none';
  const saveBtn = document.getElementById('btnSaveSpeakLink');
  if (saveBtn) saveBtn.textContent = 'Lưu lại';
}

function renderSpeakingList() {
  const list = document.getElementById('speakingList');
  const emptyState = document.getElementById('speakingEmptyState');
  const totalSavedText = document.getElementById('speakingTotalSaved');

  if (!list) return;
  list.innerHTML = '';

  const searchVal = document.getElementById('speakingSearch').value.trim().toLowerCase();
  const filterCatEl = document.getElementById('filterSpeakCategory');
  const filterCat = filterCatEl ? filterCatEl.value : 'all';

  const totalCount = speakingVaultData.items.length;
  if (totalSavedText) totalSavedText.textContent = `Đã lưu: ${totalCount} trang web`;

  const filtered = speakingVaultData.items.filter(item => {
    // 1. Search Query filter
    const titleMatch = item.title.toLowerCase().includes(searchVal);
    const urlMatch = item.url.toLowerCase().includes(searchVal);
    const textMatch = titleMatch || urlMatch;

    // 2. Category filter
    let catMatch = true;
    if (filterCat !== 'all') {
      const itemCat = item.category || 'all';
      if (filterCat === 'other') {
        catMatch = itemCat === 'all';
      } else {
        catMatch = itemCat === filterCat;
      }
    }

    return textMatch && catMatch;
  });

  if (filtered.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
  } else {
    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach(item => {
      const li = document.createElement('li');
      li.className = 'ielts-item' + (item.id === activeSpeakingLinkId ? ' active' : '');
      li.dataset.id = item.id;

      const catLabel = getCategoryBadgeLabel(item.category);

      li.innerHTML = `
        <div class="item-title" style="font-weight: 600; color: #fff;">${escHtml(item.title)}</div>
        <div class="item-meta" style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 11px; color: var(--muted);">
          <span>${catLabel} • 📅 ${item.date}</span>
          <button class="open-link-btn" data-url="${escHtml(item.url)}" title="Mở liên kết trực tiếp" style="background: transparent; border: none; color: #ec4899; cursor: pointer; font-size: 12px; padding: 2px 5px;">🌐 Mở nhanh</button>
        </div>
      `;

      li.addEventListener('click', (e) => {
        if (e.target.classList.contains('open-link-btn')) {
          e.stopPropagation();
          const url = e.target.getAttribute('data-url');
          if (url) openExternalLink(url);
          return;
        }

        activeSpeakingLinkId = item.id;
        document.querySelectorAll('#speakingList li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        renderSpeakingDetail(item.id);
      });

      list.appendChild(li);
    });
  }
}

function renderSpeakingDetail(itemId) {
  const item = speakingVaultData.items.find(el => el.id === itemId);
  if (!item) {
    showSpeakingState('welcome');
    return;
  }

  document.getElementById('detailSpeakTitle').textContent = item.title;
  document.getElementById('detailSpeakDate').textContent = `📅 Ngày lưu: ${item.date}`;

  const catBadge = document.getElementById('detailSpeakCategory');
  if (catBadge) {
    catBadge.textContent = getCategoryBadgeLabel(item.category);
  }

  const linkAnchor = document.getElementById('detailSpeakLink');
  if (linkAnchor) {
    linkAnchor.textContent = item.url;
    linkAnchor.setAttribute('data-url', item.url);
    linkAnchor.href = '#';
  }

  showSpeakingState('detail');
}

async function handleSaveSpeaking() {
  const titleInput = document.getElementById('speakLinkTitle');
  const urlInput = document.getElementById('speakLinkUrl');
  const categoryInput = document.getElementById('speakLinkCategory');
  const editIdInput = document.getElementById('editSpeakLinkId');

  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  const category = categoryInput ? categoryInput.value : 'all';
  const editId = editIdInput.value;

  if (!title || !url) return;

  if (editId) {
    const idx = speakingVaultData.items.findIndex(item => item.id === editId);
    if (idx !== -1) {
      speakingVaultData.items[idx].title = title;
      speakingVaultData.items[idx].url = url;
      speakingVaultData.items[idx].category = category;
    }
  } else {
    const newItem = {
      id: 'speak_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: title,
      url: url,
      category: category,
      date: getCurrentDateKey()
    };
    speakingVaultData.items.push(newItem);
  }

  await saveSpeakingData();
  resetSpeakingForm();

  if (editId) {
    renderSpeakingDetail(editId);
  } else {
    showSpeakingState('welcome');
  }

  playTone(800, 0.15, 'sine', 0.2);
}

function handleDeleteSpeaking() {
  if (!activeSpeakingLinkId) return;

  const item = speakingVaultData.items.find(el => el.id === activeSpeakingLinkId);
  if (!item) return;

  showConfirm(
    'Xóa trang web',
    `Bạn có chắc chắn muốn xóa liên kết trang web "${item.title}"?`,
    async () => {
      const idx = speakingVaultData.items.findIndex(el => el.id === activeSpeakingLinkId);
      if (idx !== -1) {
        speakingVaultData.items.splice(idx, 1);
        await saveSpeakingData();
        showSpeakingState('welcome');
        resetSpeakingForm();
        playTone(300, 0.15, 'sawtooth', 0.15);
      }
    }
  );
}

function handleEditSpeaking() {
  if (!activeSpeakingLinkId) return;

  const item = speakingVaultData.items.find(el => el.id === activeSpeakingLinkId);
  if (!item) return;

  document.getElementById('speakLinkTitle').value = item.title;
  document.getElementById('speakLinkUrl').value = item.url;
  document.getElementById('editSpeakLinkId').value = item.id;

  const categoryEl = document.getElementById('speakLinkCategory');
  if (categoryEl) {
    categoryEl.value = item.category || 'all';
  }

  document.getElementById('btnCancelSpeakLink').style.display = 'inline-block';
  document.getElementById('btnSaveSpeakLink').textContent = 'Cập nhật';
  document.getElementById('speakLinkTitle').focus();
}

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// -------------------------------------------------------
// Init
// -------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Disable spellcheck on all textareas to prevent Electron typing lag
  document.querySelectorAll('textarea').forEach(textarea => {
    textarea.setAttribute('spellcheck', 'false');
  });

  // Add task button
  document.getElementById('addBtn').addEventListener('click', handleAdd);

  // Enter key in task name triggers add
  document.getElementById('taskName').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAdd();
  });

  // View incomplete tasks button
  document.getElementById('btnViewIncomplete').addEventListener('click', showIncompleteModal);

  // Close incomplete modal
  document.getElementById('btnIncompleteClose').addEventListener('click', hideIncompleteModal);

  // Modal actions
  document.getElementById('btnConfirmOK').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    hideConfirm();
  });
  document.getElementById('btnConfirmCancel').addEventListener('click', () => {
    hideConfirm();
  });

  // Delegation for +/−/delete
  document.getElementById('taskList').addEventListener('click', handleListClick);

  // Header updates every second
  updateHeader();
  setInterval(updateHeader, 1000);

  // Task list refreshes every 60s (time-remaining label)
  setInterval(renderTasks, 60000);

  // Initial render
  renderTasks();

  // Window controls
  setupWindowControls();

  // Initialize IELTS Module
  initTabs();
  initSkillFormToggle();
  setupImageUpload();

  // Listeners for IELTS Vault
  const btnNewIelts = document.getElementById('btnNewIelts');
  const btnCancelIelts = document.getElementById('btnCancelIelts');
  const btnSaveIelts = document.getElementById('btnSaveIelts');
  const btnEditIelts = document.getElementById('btnEditIelts');
  const btnDeleteIelts = document.getElementById('btnDeleteIelts');
  const btnExpandIelts = document.getElementById('btnExpandIelts');

  if (btnNewIelts) btnNewIelts.addEventListener('click', handleNewIeltsClick);
  if (btnCancelIelts) btnCancelIelts.addEventListener('click', () => showIeltsState('welcome'));
  if (btnSaveIelts) btnSaveIelts.addEventListener('click', handleSaveIelts);
  if (btnEditIelts) btnEditIelts.addEventListener('click', handleEditIelts);
  if (btnDeleteIelts) btnDeleteIelts.addEventListener('click', handleDeleteIelts);
  if (btnExpandIelts) {
    btnExpandIelts.addEventListener('click', () => {
      if (activeIeltsItemId && window.taskAPI && window.taskAPI.openStudyWindow) {
        window.taskAPI.openStudyWindow(activeIeltsItemId, 'ielts');
      }
    });
  }

  const btnDecReadCountMain = document.getElementById('btnDecReadCountMain');
  const btnIncReadCountMain = document.getElementById('btnIncReadCountMain');

  if (btnDecReadCountMain && btnIncReadCountMain) {
    btnDecReadCountMain.addEventListener('click', () => {
      const item = ieltsVaultData.items.find(el => el.id === activeIeltsItemId);
      if (item) {
        let count = item.mastery || 0;
        if (count > 0) {
          count--;
          item.mastery = count;
          const lbl = document.getElementById('lblReadCountMain');
          if (lbl) lbl.textContent = count;
          playTone(400, 0.1, 'sine', 0.15);
          saveIeltsData();
          renderIeltsList();
        }
      }
    });

    btnIncReadCountMain.addEventListener('click', () => {
      const item = ieltsVaultData.items.find(el => el.id === activeIeltsItemId);
      if (item) {
        let count = item.mastery || 0;
        count++;
        item.mastery = count;
        const lbl = document.getElementById('lblReadCountMain');
        if (lbl) lbl.textContent = count;
        playTone(600, 0.1, 'sine', 0.15);
        saveIeltsData();
        renderIeltsList();
      }
    });
  }

  // Search & Filter listeners
  const searchInp = document.getElementById('ieltsSearch');
  const filterSkill = document.getElementById('filterSkill');
  const filterMastery = document.getElementById('filterMastery');
  const filterFolder = document.getElementById('filterFolder');

  if (searchInp) searchInp.addEventListener('input', debounce(renderIeltsList, 250));
  if (filterSkill) filterSkill.addEventListener('change', renderIeltsList);
  if (filterMastery) filterMastery.addEventListener('change', renderIeltsList);
  if (filterFolder) filterFolder.addEventListener('change', renderIeltsList);

  // Folder Creation Listeners
  const btnCreateFolder = document.getElementById('btnCreateFolder');
  const btnFormNewFolder = document.getElementById('btnFormNewFolder');
  if (btnCreateFolder) btnCreateFolder.addEventListener('click', handleCreateFolderPrompt);
  if (btnFormNewFolder) btnFormNewFolder.addEventListener('click', handleCreateFolderPrompt);

  const btnFormNewSkill = document.getElementById('btnFormNewSkill');
  if (btnFormNewSkill) btnFormNewSkill.addEventListener('click', handleCreateSkillPrompt);

  const btnBulkMove = document.getElementById('btnBulkMove');
  if (btnBulkMove) btnBulkMove.addEventListener('click', handleBulkMoveToFolder);

  const btnBulkExportHtml = document.getElementById('btnBulkExportHtml');
  if (btnBulkExportHtml) btnBulkExportHtml.addEventListener('click', handleBulkExportHtml);

  const btnCopyExportUrl = document.getElementById('btnCopyExportUrl');
  if (btnCopyExportUrl) {
    btnCopyExportUrl.addEventListener('click', () => {
      const urlInput = document.getElementById('exportMobileUrl');
      if (urlInput) {
        if (window.taskAPI && window.taskAPI.writeClipboardText) {
          window.taskAPI.writeClipboardText(urlInput.value);
        } else {
          navigator.clipboard.writeText(urlInput.value);
        }
        if (typeof playTone === 'function') playTone(880, 0.1, 'sine', 0.2);
        alert('Đã sao chép liên kết vào Clipboard!');
      }
    });
  }

  const btnExportMobileClose = document.getElementById('btnExportMobileClose');
  if (btnExportMobileClose) {
    btnExportMobileClose.addEventListener('click', () => {
      const modal = document.getElementById('exportMobileModal');
      if (modal) modal.classList.remove('active');
    });
  }

  const btnBulkCopyPrompt = document.getElementById('btnBulkCopyPrompt');
  if (btnBulkCopyPrompt) {
    btnBulkCopyPrompt.addEventListener('click', async () => {
      if (selectedIeltsItemIds.size === 0) {
        alert('Vui lòng chọn ít nhất 1 mục để tạo prompt!');
        return;
      }
      const items = (ieltsVaultData.items || []).filter(item => selectedIeltsItemIds.has(item.id));
      if (items.length === 0) return;

      const lines = items.map((it, idx) => `${idx + 1}. **${it.title || 'Mục ' + (idx + 1)}** (${it.skill || 'English'}): ${(it.content || '').substring(0, 150)}...`).join('\n');
      const promptText = `Bạn là một chuyên gia ngôn ngữ và giảng viên IELTS xuất sắc.

🎯 NHIỆM VỤ:
Hãy đặt câu hoặc viết một đoạn văn ngắn tự nhiên (1 - 3 câu) bằng tiếng Anh, kết nối logic và sử dụng toàn bộ các từ vựng / chủ đề sau:

📋 DANH SÁCH ${items.length} MỤC ĐÃ CHỌN:
${lines}

✨ YÊU CẦU ĐẦU RA:
1. 📝 ĐOẠN VĂN / CÂU TIẾNG ANH HOÀN CHỈNH: Tự nhiên, học thuật (in đậm từ/ý chính).
2. 🇻🇳 BẢN DỊCH TIẾNG VIỆT TRỌN VẸN.
3. 💡 PHÂN TÍCH CẤU TRÚC & COLLOCATIONS ĐẮT GIÁ.`;

      let copied = false;
      if (window.taskAPI && window.taskAPI.writeClipboardText) {
        try {
          await window.taskAPI.writeClipboardText(promptText);
          copied = true;
        } catch (e) { }
      }
      if (!copied && navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(promptText);
          copied = true;
        } catch (e) { }
      }

      if (typeof playTone === 'function') playTone(880, 0.08, 'sine', 0.15);

      const origHtml = btnBulkCopyPrompt.innerHTML;
      btnBulkCopyPrompt.innerHTML = `✅ Đã copy (${items.length})!`;
      setTimeout(() => {
        btnBulkCopyPrompt.innerHTML = origHtml;
      }, 2000);
    });
  }

  const btnCancelBulk = document.getElementById('btnCancelBulk');
  if (btnCancelBulk) {
    btnCancelBulk.addEventListener('click', () => {
      selectedIeltsItemIds.clear();
      renderIeltsList();
      updateBulkFolderActionsVisibility();
    });
  }

  // AI Analyze listener
  const btnAiAnalyze = document.getElementById('btnAiAnalyze');
  if (btnAiAnalyze) btnAiAnalyze.addEventListener('click', handleAiAnalyze);

  // Clear Date Filter listener
  const btnClearIeltsDateFilter = document.getElementById('btnClearIeltsDateFilter');
  if (btnClearIeltsDateFilter) {
    btnClearIeltsDateFilter.addEventListener('click', () => {
      selectedFilterDate = null;
      renderChallengeGrid();
      renderIeltsList();
    });
  }

  const btnFetchLink = document.getElementById('btnFetchLink');
  if (btnFetchLink) btnFetchLink.addEventListener('click', () => handleFetchFromLink('ielts'));

  // Web AI Assist listeners
  const btnWebAiAssist = document.getElementById('btnWebAiAssist');
  if (btnWebAiAssist) btnWebAiAssist.addEventListener('click', handleWebAiAssist);

  const btnWebAiCancel = document.getElementById('btnWebAiCancel');
  if (btnWebAiCancel) btnWebAiCancel.addEventListener('click', () => {
    document.getElementById('webAiModal').classList.remove('active');
  });

  const btnWebAiApply = document.getElementById('btnWebAiApply');
  if (btnWebAiApply) btnWebAiApply.addEventListener('click', handleWebAiApply);

  const btnOpenGeminiWeb = document.getElementById('btnOpenGeminiWeb');
  if (btnOpenGeminiWeb) {
    btnOpenGeminiWeb.addEventListener('click', () => openExternalLink('https://gemini.google.com/'));
  }

  const btnOpenAiStudioWeb = document.getElementById('btnOpenAiStudioWeb');
  if (btnOpenAiStudioWeb) {
    btnOpenAiStudioWeb.addEventListener('click', () => openExternalLink('https://aistudio.google.com/'));
  }

  const btnCopyWebAiPrompt = document.getElementById('btnCopyWebAiPrompt');
  if (btnCopyWebAiPrompt) {
    btnCopyWebAiPrompt.addEventListener('click', handleWebAiPromptCopy);
  }

  const btnCopyWebAiImage = document.getElementById('btnCopyWebAiImage');
  if (btnCopyWebAiImage) {
    btnCopyWebAiImage.addEventListener('click', handleWebAiImageCopy);
  }

  const btnWebAiReload = document.getElementById('btnWebAiReload');
  if (btnWebAiReload) {
    btnWebAiReload.addEventListener('click', handleWebAiReload);
  }



  const detailLink = document.getElementById('detailLink');
  if (detailLink) {
    detailLink.addEventListener('click', (e) => {
      e.preventDefault();
      const url = detailLink.getAttribute('data-url');
      if (url) {
        openExternalLink(url);
      }
    });
  }

  // Listeners for Speaking Links Vault
  const speakingForm = document.getElementById('speakingForm');
  const btnCancelSpeakLink = document.getElementById('btnCancelSpeakLink');
  const btnEditSpeakLink = document.getElementById('btnEditSpeakLink');
  const btnDeleteSpeakLink = document.getElementById('btnDeleteSpeakLink');
  const btnOpenSpeakLink = document.getElementById('btnOpenSpeakLink');
  const speakingSearch = document.getElementById('speakingSearch');
  const detailSpeakLink = document.getElementById('detailSpeakLink');

  if (speakingForm) {
    speakingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSaveSpeaking();
    });
  }
  if (btnCancelSpeakLink) {
    btnCancelSpeakLink.addEventListener('click', () => {
      resetSpeakingForm();
      showSpeakingState('welcome');
    });
  }
  if (btnEditSpeakLink) btnEditSpeakLink.addEventListener('click', handleEditSpeaking);
  if (btnDeleteSpeakLink) btnDeleteSpeakLink.addEventListener('click', handleDeleteSpeaking);
  if (btnOpenSpeakLink) {
    btnOpenSpeakLink.addEventListener('click', () => {
      if (activeSpeakingLinkId) {
        const item = speakingVaultData.items.find(el => el.id === activeSpeakingLinkId);
        if (item && item.url) openExternalLink(item.url);
      }
    });
  }
  if (speakingSearch) speakingSearch.addEventListener('input', debounce(renderSpeakingList, 250));
  const filterSpeakCategory = document.getElementById('filterSpeakCategory');
  if (filterSpeakCategory) filterSpeakCategory.addEventListener('change', renderSpeakingList);
  if (detailSpeakLink) {
    detailSpeakLink.addEventListener('click', (e) => {
      e.preventDefault();
      const url = detailSpeakLink.getAttribute('data-url');
      if (url) openExternalLink(url);
    });
  }

  // Initialize API Key box
  initApiKeyBox();

  // Load data & initial render for all tabs
  Promise.all([
    loadIeltsData(),
    loadSpeakingData(),
    loadVideoData(),
    loadTkFlashcardData(),
    loadTkSavedMusic(),
    loadCommentsVaultData(),
    loadBrainChainData()
  ]).then(() => {
    try { updateFolderSelects(); } catch (e) { console.error('Folder selects error:', e); }
    try { updateSkillSelects(); } catch (e) { console.error('Skill selects error:', e); }
    try { initVideoChallenge(); } catch (e) { console.error('Video challenge error:', e); }
    try { renderChallengeGrid(); } catch (e) { console.error('Challenge grid error:', e); }
    try { renderIeltsList(); } catch (e) { console.error('Ielts list error:', e); }
    try { renderSpeakingList(); } catch (e) { console.error('Speaking list error:', e); }

    // Initialize TikTok Flashcard tab
    try { initTiktokFlashcardTab(); } catch (e) { console.error('TikTok Flashcard tab error:', e); }

    // Initialize Comments Vault tab
    try { initCommentsVaultTab(); } catch (e) { console.error('Comments Vault tab error:', e); }

    // Initialize Brain Chain tab
    try { initBrainChainTab(); } catch (e) { console.error('Brain Chain tab error:', e); }

    // Restore preserved inputs if we just reloaded
    try { restoreInputStateAfterReload(); } catch (e) { console.error('Restore state error:', e); }
  });

  if (window.taskAPI && window.taskAPI.onVaultUpdated) {
    window.taskAPI.onVaultUpdated((info) => {
      if (info.type === 'ielts') {
        ieltsVaultData = info.data;
        updateSkillSelects();
        updateFolderSelects();
        if (activeIeltsItemId) {
          renderIeltsDetail(activeIeltsItemId);
        }
        renderIeltsList();
        renderChallengeGrid();
      } else if (info.type === 'speaking') {
        speakingVaultData = info.data;
        if (activeSpeakingLinkId) {
          renderSpeakingDetail(activeSpeakingLinkId);
        }
        renderSpeakingList();
      } else if (info.type === 'video-challenge') {
        videoProjectsData = info.data;
        renderVideoProjectsList();
        renderVideoProjectDetail();
      } else if (info.type === 'memorize') {
        tkFlashcardData = info.data || { items: [] };
        updateTkDashboardStats();
        renderTkFlashcardList();
        const currentItem = (tkFlashcardData.items || []).find(x => x.id === activeTkCardId) || tkFlashcardData.items[0];
        if (currentItem) renderTkPlayer(currentItem);
      } else if (info.type === 'comments-vault') {
        commentsVaultData = info.data || { activeProjectId: 'proj_1', projects: [] };
        ensureCmProjectsInitialized();
        renderCmProjectSelect();
        updateCmDashboardStats();
        updateCmCategorySelects();
        renderCmCommentsList();
      }
    });
  }
});

async function handleBulkExportHtml() {
  if (selectedIeltsItemIds.size === 0) {
    alert('Vui lòng chọn ít nhất một đề thi để xuất bản!');
    return;
  }

  const btn = document.getElementById('btnBulkExportHtml');
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Đang xuất bản...';

  try {
    const itemIds = Array.from(selectedIeltsItemIds);
    console.log('[RENDER] Exporting items to mobile page:', itemIds);

    const result = await window.taskAPI.exportMobilePage(itemIds);

    if (result && result.success && result.url) {
      const modal = document.getElementById('exportMobileModal');
      const qrImg = document.getElementById('exportMobileQr');
      const urlInput = document.getElementById('exportMobileUrl');

      if (modal && qrImg && urlInput) {
        urlInput.value = result.url;
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.url)}`;
        modal.classList.add('active');

        if (typeof playTone === 'function') {
          playTone(523, 0.08, 'sine', 0.15);
          setTimeout(() => playTone(659, 0.08, 'sine', 0.15), 80);
          setTimeout(() => playTone(784, 0.15, 'sine', 0.15), 160);
        }
      }
    } else {
      alert('Không thể xuất bản trang di động: ' + (result ? result.error : 'Lỗi không xác định.'));
    }
  } catch (err) {
    console.error('Export mobile page failed:', err);
    alert('Có lỗi xảy ra: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

// =========================================================
// =========================================================
// 🎵 TIKTOK FLASHCARD MODULE (Học từ vựng & câu qua Video)
// =========================================================

let tkFlashcardData = { items: [] };
let tkLastChosenMusicUrl = '';
let tkSavedMusicList = [
  { id: 'm_1', name: 'âm thanh gốc shanghai9992', url: 'https://www.tiktok.com/music/%C3%A2m-thanh-g%E1%BB%91c-shanghai9992-7668519855653784338' },
  { id: 'm_2', name: 'Fuera del Planeta', url: 'https://www.tiktok.com/music/Fuera-del-Planeta-7532902301028764421' },
  { id: 'm_3', name: 'RITMO AGRESSIVO', url: 'https://www.tiktok.com/music/RITMO-AGRESSIVO-7409071300436281361' },
  { id: 'm_4', name: 'Perfect - Ed Sheeran', url: 'https://www.tiktok.com/music/Perfect-6655492047723563778' }
];

let activeTkCardId = null;
let selectedTkCardIds = new Set();
let lastSelectedTkId = null;
let tkInitialized = false;

function getTkSelectedItems() {
  if (!tkFlashcardData || !Array.isArray(tkFlashcardData.items)) return [];
  const filtered = (typeof getTkFilteredItems === 'function') ? getTkFilteredItems() : tkFlashcardData.items;
  const selected = filtered.filter(x => selectedTkCardIds.has(x.id));
  if (selected.length > 0) return selected;
  return tkFlashcardData.items.filter(x => selectedTkCardIds.has(x.id));
}

function buildPromptForSelectedWords(items) {
  if (!items || items.length === 0) return '';

  const wordLines = items.map((item, idx) => {
    let line = `${idx + 1}. **${item.word || 'Unknown'}**`;
    if (item.phonetic) line += ` /${item.phonetic}/`;
    if (item.translation) line += ` : ${item.translation}`;
    return line;
  }).join('\n');

  return `Bạn là một chuyên gia khảo thí và giảng dạy tiếng Anh IELTS / Academic English xuất sắc.

🎯 NHIỆM VỤ:
Hãy đặt câu hoặc viết một đoạn văn ngắn tự nhiên (1 - 3 câu) bằng tiếng Anh, trong đó BẮT BUỘC SỬ DỤNG VÀ KẾT NỐI TẤT CẢ ${items.length} từ vựng sau đây trong cùng một ngữ cảnh logic, mạch lạc:

📋 DANH SÁCH ${items.length} TỪ VỰNG CẦN SỬ DỤNG:
${wordLines}

⛔ QUY TẮC BẮT BUỘC (TUYỆT ĐỐI KHÔNG DÙNG DẤU BA CHẤM "..."):
- TUYỆT ĐỐI KHÔNG dùng dấu ba chấm "..." để viết tắt, bỏ lửng câu hay cắt bớt ý.
- Viết trọn vẹn 100% từng câu chữ tiếng Anh và bản dịch tiếng Việt đầy đủ.

✨ YÊU CẦU ĐẦU RA:
1. 📝 ĐOẠN VĂN / CÂU TIẾNG ANH HOÀN CHỈNH:
   - Viết câu/đoạn văn liền mạch, tự nhiên theo chuẩn văn phong học thuật / IELTS Speaking & Writing hoặc giao tiếp thực tế nâng cao.
   - IN ĐẬM (**từ vựng**) mỗi khi từ trong danh sách trên xuất hiện.

2. 🇻🇳 BẢN DỊCH TIẾNG VIỆT TRỌN VẸN:
   - Dịch nghĩa mượt mà, chính xác và sát văn cảnh tiếng Việt (viết đầy đủ, không dùng "...").

3. 💡 PHÂN TÍCH COLLOCATIONS & ĐIỂM SÁNG NGỮ PHÁP:
   - Chỉ ra cụm từ kết hợp (collocation) hoặc cấu trúc ghi điểm của từng từ trong câu.
   - Gợi ý cách ứng dụng các từ này vào bài thi IELTS Speaking/Writing.`;
}

function updateTkSelectionUI() {
  const bar = document.getElementById('tkSelectionBar');
  const countEl = document.getElementById('tkSelectedCount');
  const btnSync = document.getElementById('btnTkSyncWeb');
  const btnPlayerSync = document.getElementById('btnTkPlayerSyncWeb');

  if (selectedTkCardIds.size > 1) {
    if (bar) bar.style.display = 'flex';
    if (countEl) countEl.textContent = selectedTkCardIds.size;
    if (btnSync) {
      btnSync.innerHTML = `🌐 Đẩy ${selectedTkCardIds.size} từ đã chọn lên Web`;
      btnSync.style.background = 'linear-gradient(135deg, #00f2fe 0%, #10b981 100%)';
    }
    if (btnPlayerSync) {
      btnPlayerSync.innerHTML = `🌐 Đẩy ${selectedTkCardIds.size} từ`;
    }
  } else {
    if (bar) bar.style.display = 'none';
    if (btnSync) {
      btnSync.innerHTML = '🌐 Đẩy lên Web Mobile';
      btnSync.style.background = 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)';
    }
    if (btnPlayerSync) {
      btnPlayerSync.innerHTML = '🌐 Web Mobile';
    }
  }
}

async function loadTkFlashcardData() {
  if (window.taskAPI && window.taskAPI.loadMemorizeVault) {
    try {
      const data = await window.taskAPI.loadMemorizeVault();
      if (data && Array.isArray(data.items)) {
        tkFlashcardData = data;
        return tkFlashcardData;
      }
    } catch (e) {
      console.error('Failed to load flashcards via API:', e);
    }
  }

  try {
    const raw = localStorage.getItem('task_countdown_tiktok_flashcards');
    if (raw) {
      tkFlashcardData = JSON.parse(raw);
    }
  } catch (e) {
    tkFlashcardData = { items: [] };
  }
  return tkFlashcardData;
}

async function saveTkFlashcardData() {
  if (window.taskAPI && window.taskAPI.saveMemorizeVault) {
    try {
      await window.taskAPI.saveMemorizeVault(tkFlashcardData);
    } catch (e) {
      console.error('Failed to save flashcards via API:', e);
    }
  }
  try {
    localStorage.setItem('task_countdown_tiktok_flashcards', JSON.stringify(tkFlashcardData));
  } catch (e) { }
}

async function loadTkSavedMusic() {
  const loadFn = (window.taskAPI && (window.taskAPI.loadTiktokMusic || window.taskAPI.loadTikTokMusic));
  if (loadFn) {
    try {
      const data = await loadFn();
      let rawList = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (data && typeof data === 'object') {
        if (data.lastChosenUrl) tkLastChosenMusicUrl = data.lastChosenUrl;
        if (Array.isArray(data.items)) rawList = data.items;
      }
      if (rawList.length > 0) {
        tkSavedMusicList = rawList.map((m, idx) => ({
          id: m.id || ('m_' + Date.now() + '_' + idx),
          name: (m.name || m.title || 'Nhạc TikTok').replace(/^🎵\s*/, ''),
          url: m.url || ''
        })).filter(m => m.url);
        if (!tkLastChosenMusicUrl && tkSavedMusicList[0]) {
          tkLastChosenMusicUrl = tkSavedMusicList[0].url;
        }
        return tkSavedMusicList;
      }
    } catch (e) {
      console.error('Failed to load tiktok music via API:', e);
    }
  }

  try {
    const raw = localStorage.getItem('task_countdown_tiktok_music');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.lastChosenUrl) {
        tkLastChosenMusicUrl = parsed.lastChosenUrl;
      }
      const rawList = Array.isArray(parsed) ? parsed : (parsed.items || []);
      tkSavedMusicList = rawList.map((m, idx) => ({
        id: m.id || ('m_' + Date.now() + '_' + idx),
        name: (m.name || m.title || 'Nhạc TikTok').replace(/^🎵\s*/, ''),
        url: m.url || ''
      })).filter(m => m.url);
    }
  } catch (e) { }

  if (!tkLastChosenMusicUrl && tkSavedMusicList[0]) {
    tkLastChosenMusicUrl = tkSavedMusicList[0].url;
  }
  return tkSavedMusicList;
}

async function saveTkSavedMusic() {
  const currentInpVal = document.getElementById('tkUrlInput')?.value;
  if (currentInpVal) tkLastChosenMusicUrl = currentInpVal;

  const savePayload = {
    lastChosenUrl: tkLastChosenMusicUrl || (tkSavedMusicList[0] ? tkSavedMusicList[0].url : ''),
    items: tkSavedMusicList.map(m => ({
      id: m.id,
      title: `🎵 ${m.name}`,
      url: m.url
    }))
  };

  const saveFn = (window.taskAPI && (window.taskAPI.saveTiktokMusic || window.taskAPI.saveTikTokMusic));
  if (saveFn) {
    try {
      await saveFn(savePayload);
    } catch (e) {
      console.error('Failed to save tiktok music via API:', e);
    }
  }
  try {
    localStorage.setItem('task_countdown_tiktok_music', JSON.stringify(savePayload));
  } catch (e) { }
}

function updateTkDashboardStats() {
  const total = (tkFlashcardData.items || []).length;
  const today = new Date().toISOString().split('T')[0];
  const due = (tkFlashcardData.items || []).filter(x => !x.nextReviewDate || x.nextReviewDate <= today).length;

  const totalEl = document.getElementById('tkTotalCount');
  if (totalEl) totalEl.textContent = total;

  const dueEl = document.getElementById('tkDueCount');
  if (dueEl) dueEl.textContent = due;
}

function getTkFilteredItems() {
  const query = (document.getElementById('tkSearchInput')?.value || '').trim().toLowerCase();
  const filterStatus = document.getElementById('tkFilterStatus')?.value || 'all';
  const today = new Date().toISOString().split('T')[0];

  let items = (tkFlashcardData.items || []).slice();

  if (filterStatus === 'due') {
    items = items.filter(x => !x.nextReviewDate || x.nextReviewDate <= today);
  } else if (filterStatus === 'mastered') {
    items = items.filter(x => (x.level || 1) >= 5);
  }

  if (query) {
    items = items.filter(x => {
      const w = (x.word || '').toLowerCase();
      const t = (x.translation || '').toLowerCase();
      const n = (x.notes || '').toLowerCase();
      return w.includes(query) || t.includes(query) || n.includes(query);
    });
  }

  return items;
}

function renderTkMusicSelect() {
  const select = document.getElementById('tkMusicHistorySelect');
  if (!select) return;

  const activeUrl = tkLastChosenMusicUrl || select.value || (tkSavedMusicList[0] ? tkSavedMusicList[0].url : '');
  select.innerHTML = '';
  if (tkSavedMusicList.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '-- Chưa có nhạc nào được lưu --';
    select.appendChild(opt);
    return;
  }

  tkSavedMusicList.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.url;
    opt.textContent = `🎵 ${m.name}`;
    if (m.url === activeUrl) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderTkFlashcardList() {
  const listEl = document.getElementById('tkFlashcardList');
  const emptyEl = document.getElementById('tkEmptyState');
  if (!listEl) return;

  const items = getTkFilteredItems();

  if (items.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    const playerState = document.getElementById('tkPlayerState');
    if (playerState) playerState.style.display = 'none';
    updateTkSelectionUI();
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  listEl.innerHTML = '';

  items.forEach((item, idx) => {
    const li = document.createElement('li');
    const isSelected = selectedTkCardIds.has(item.id);
    const isActive = item.id === activeTkCardId;

    li.className = `ielts-item-card ${isActive ? 'active' : ''}`;
    if (isSelected) {
      li.style.background = 'rgba(0, 242, 254, 0.16)';
      li.style.borderColor = '#00f2fe';
      li.style.boxShadow = '0 0 10px rgba(0, 242, 254, 0.3)';
    }

    const lvl = item.level || 1;
    const isDue = !item.nextReviewDate || item.nextReviewDate <= new Date().toISOString().split('T')[0];

    li.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 6px; flex: 1; overflow: hidden;">
          ${isSelected ? '<span style="font-size: 13px; color: #00f2fe; flex-shrink: 0;">☑️</span>' : ''}
          <span style="font-weight: 700; font-size: 13.5px; color: ${isSelected ? '#00f2fe' : '#fff'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.word)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <button class="tk-quick-video-btn" data-url="${escapeHtml(item.tiktokUrl || '')}" data-word="${escapeHtml(item.word)}" title="🎬 Xem video TikTok ngay" style="background: rgba(255, 0, 80, 0.15); border: 1px solid rgba(255, 0, 80, 0.4); color: #ff0050; border-radius: 5px; padding: 2px 7px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 3px; transition: all 0.2s;">
            🎬 Xem
          </button>
          <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${isDue ? 'background: rgba(239,68,68,0.2); color: #fca5a5; border: 1px solid rgba(239,68,68,0.4);' : 'background: rgba(16,185,129,0.2); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.4);'}">
            ${isDue ? '🔴 Cần ôn' : `Lớp ${lvl}`}
          </span>
        </div>
      </div>
      <div style="font-size: 12px; color: var(--muted); margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${escapeHtml(item.translation || '(Chưa có bản dịch)')}
      </div>
    `;

    li.addEventListener('click', (e) => {
      const quickBtn = e.target.closest('.tk-quick-video-btn');
      if (quickBtn) {
        e.stopPropagation();
        let url = quickBtn.getAttribute('data-url');
        const word = quickBtn.getAttribute('data-word');
        if (!url || !url.trim()) {
          url = `https://www.tiktok.com/search?q=${encodeURIComponent(word || '')}`;
        }
        if (window.taskAPI && window.taskAPI.openExternal) {
          window.taskAPI.openExternal(url);
        } else {
          window.open(url, '_blank');
        }
        if (typeof playTone === 'function') playTone(600, 0.08, 'sine', 0.1);
        return;
      }

      if ((e.ctrlKey || e.metaKey || e.shiftKey) && lastSelectedTkId && lastSelectedTkId !== item.id) {
        // Range select with Ctrl or Shift: Select ALL words from start to end (including words in between)
        const startIdx = items.findIndex(x => x.id === lastSelectedTkId);
        const endIdx = items.findIndex(x => x.id === item.id);
        if (startIdx !== -1 && endIdx !== -1) {
          const min = Math.min(startIdx, endIdx);
          const max = Math.max(startIdx, endIdx);
          selectedTkCardIds.clear();
          for (let i = min; i <= max; i++) {
            selectedTkCardIds.add(items[i].id);
          }
        }
        if (typeof playTone === 'function') playTone(700, 0.05, 'sine', 0.1);
      } else {
        // Normal click: pick this as the start anchor
        selectedTkCardIds.clear();
        selectedTkCardIds.add(item.id);
        lastSelectedTkId = item.id;
      }

      activeTkCardId = item.id;
      updateTkSelectionUI();
      renderTkFlashcardList();
      renderTkCurrentCard(item);
    });

    listEl.appendChild(li);
  });

  updateTkSelectionUI();

  if (!activeTkCardId && items.length > 0) {
    activeTkCardId = items[0].id;
    renderTkCurrentCard(items[0]);
  } else if (activeTkCardId) {
    const current = items.find(x => x.id === activeTkCardId);
    if (current) renderTkCurrentCard(current);
    else if (items.length > 0) {
      activeTkCardId = items[0].id;
      renderTkCurrentCard(items[0]);
    }
  }

  // Smooth scroll active item in list
  setTimeout(() => {
    const activeLi = listEl.querySelector('li.active');
    if (activeLi) {
      activeLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 40);
}

// State & Toggle for Language Order in Flashcard (English first vs Vietnamese first)
let tkLangOrder = localStorage.getItem('task_countdown_tk_lang_order') || 'en_first';

function getTkLangOrder() {
  return tkLangOrder;
}

function setTkLangOrder(order, currentItem = null) {
  tkLangOrder = (order === 'vi_first') ? 'vi_first' : 'en_first';
  try {
    localStorage.setItem('task_countdown_tk_lang_order', tkLangOrder);
  } catch (e) {}
  
  const item = currentItem || (typeof activeTkCardId !== 'undefined' ? getTkFilteredItems().find(x => x.id === activeTkCardId) : null);
  if (item) {
    renderTkPlayer(item);
  } else {
    updateTkLangOrderUI(null);
  }
}

function toggleTkLangOrder(currentItem = null) {
  const newOrder = (tkLangOrder === 'en_first') ? 'vi_first' : 'en_first';
  setTkLangOrder(newOrder, currentItem);
  if (typeof playTone === 'function') playTone(650, 0.05, 'sine', 0.1);
}

function updateTkLangOrderUI(item = null) {
  const isEnFirst = (tkLangOrder === 'en_first');
  const btnLabel = isEnFirst ? '🔀 Anh ➔ Việt' : '🔀 Việt ➔ Anh';
  const tooltip = isEnFirst ? 'Đang hiển thị Tiếng Anh trên Tiếng Việt (Bấm để đổi Tiếng Việt lên trước)' : 'Đang hiển thị Tiếng Việt trên Tiếng Anh (Bấm để đổi Tiếng Anh lên trước)';

  // Update all swap button texts
  ['lblTkGlobalSwapLangText', 'lblTkFrontSwapLangText', 'lblTkSwapLangText', 'lblTkModalSwapLangText'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = btnLabel;
  });

  ['btnTkGlobalSwapLang', 'btnTkFrontSwapLang', 'btnTkSwapLangOrder', 'btnTkModalSwapLangOrder'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.title = tooltip;
  });

  // Reorder sections in flashcard back face
  const enSection = document.getElementById('tkBackEnSection');
  const viSection = document.getElementById('tkBackViSection');
  if (enSection && viSection) {
    if (isEnFirst) {
      enSection.style.order = '1';
      viSection.style.order = '2';
    } else {
      viSection.style.order = '1';
      enSection.style.order = '2';
    }
  }

  // Update Modal Header & Content if modal is open
  const modal = document.getElementById('tkExpandModal');
  if (modal && (modal.classList.contains('active') || modal.classList.contains('visible'))) {
    const curItem = item || (typeof activeTkCardId !== 'undefined' ? getTkFilteredItems().find(x => x.id === activeTkCardId) : null);
    if (curItem) {
      renderTkExpandModalHeader(curItem);
      renderTkExpandModalExamples(curItem);
    }
  }
}

function renderTkExpandModalHeader(item) {
  const wordEl = document.getElementById('tkExpandModalWord');
  const transEl = document.getElementById('tkExpandModalTrans');
  const isEnFirst = (tkLangOrder === 'en_first');

  if (isEnFirst) {
    // English on top, Vietnamese below
    if (wordEl) {
      wordEl.textContent = item.word || '---';
      wordEl.style.color = '';
      wordEl.style.background = 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)';
      wordEl.style.webkitBackgroundClip = 'text';
      wordEl.style.webkitTextFillColor = 'transparent';
    }
    if (transEl) {
      transEl.textContent = item.translation || '(Chưa có bản dịch)';
      transEl.style.color = '#34d399';
    }
  } else {
    // Vietnamese on top, English below
    if (wordEl) {
      wordEl.textContent = item.translation || '(Chưa có bản dịch)';
      wordEl.style.color = '#34d399';
      wordEl.style.background = 'none';
      wordEl.style.webkitBackgroundClip = 'unset';
      wordEl.style.webkitTextFillColor = 'unset';
    }
    if (transEl) {
      transEl.textContent = item.word || '---';
      transEl.style.color = '#60a5fa';
    }
  }
}

function renderTkExpandModalExamples(item) {
  const contentEl = document.getElementById('tkExpandModalContent');
  if (!contentEl || !item) return;

  contentEl.innerHTML = '';
  const rawNotes = (item.notes || '').trim();
  const isEnFirst = (tkLangOrder === 'en_first');

  if (!rawNotes) {
    contentEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted);">Chưa có ví dụ nào được ghi lại cho từ này. Bấm Sửa để bổ sung thêm!</div>';
    return;
  }

  const lines = rawNotes.split('\n').map(l => l.trim()).filter(Boolean);
  const speakingItems = [];
  const writingItems = [];
  let otherItems = [];

  let currentSection = 'speaking';
  let currentCard = null;

  lines.forEach(line => {
    if (line.includes('Speaking') || line.startsWith('🗣️')) {
      currentSection = 'speaking';
      if (currentCard) {
        if (currentCard.section === 'speaking') speakingItems.push(currentCard);
        else writingItems.push(currentCard);
      }
      currentCard = { section: 'speaking', en: line.replace(/^🗣️\s*Speaking\s*\d*[:.]*\s*/i, '').replace(/^"|"$/g, '').trim(), vi: '' };
    } else if (line.includes('Writing') || line.startsWith('✍️')) {
      currentSection = 'writing';
      if (currentCard) {
        if (currentCard.section === 'speaking') speakingItems.push(currentCard);
        else writingItems.push(currentCard);
      }
      currentCard = { section: 'writing', en: line.replace(/^✍️\s*Writing\s*\d*[:.]*\s*/i, '').replace(/^"|"$/g, '').trim(), vi: '' };
    } else if (line.includes('👉 Dịch:') || line.includes('Dịch:')) {
      if (currentCard) {
        currentCard.vi = line.replace(/.*(?:👉\s*Dịch:|Dịch:)\s*/i, '').trim();
      } else {
        otherItems.push({ en: '', vi: line });
      }
    } else {
      if (currentCard && !currentCard.vi) {
        currentCard.en += ' ' + line;
      } else {
        if (currentCard) {
          if (currentCard.section === 'speaking') speakingItems.push(currentCard);
          else writingItems.push(currentCard);
          currentCard = null;
        }
        otherItems.push({ en: line, vi: '' });
      }
    }
  });

  if (currentCard) {
    if (currentCard.section === 'speaking') speakingItems.push(currentCard);
    else writingItems.push(currentCard);
  }

  // Section 1: Speaking Examples
  if (speakingItems.length > 0) {
    const sec1 = document.createElement('div');
    sec1.innerHTML = `<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 800; color: #a78bfa; display: flex; align-items: center; gap: 6px;">🗣️ 5 CÂU VÍ DỤ IELTS SPEAKING THỰC TẾ</h4>`;
    const wrap1 = document.createElement('div');
    wrap1.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

    speakingItems.forEach((c, idx) => {
      const cardDiv = document.createElement('div');
      cardDiv.style.cssText = 'background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px;';
      if (isEnFirst) {
        cardDiv.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <span style="font-weight: 700; font-size: 13.5px; color: #fff; line-height: 1.4;">${idx + 1}. "${escapeHtml(c.en)}"</span>
            <button type="button" class="ctrl-btn speak-sentence-btn" data-text="${escapeHtml(c.en)}" style="background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 26px; height: 26px; font-size: 12px; cursor: pointer; color: #fff; flex-shrink: 0; display: flex; align-items: center; justify-content: center;" title="Phát âm câu này">🔊</button>
          </div>
          ${c.vi ? `<div style="font-size: 12.5px; color: #34d399; font-style: italic; padding-left: 14px;">👉 Dịch: ${escapeHtml(c.vi)}</div>` : ''}
        `;
      } else {
        cardDiv.innerHTML = `
          ${c.vi ? `<div style="font-size: 13.5px; color: #34d399; font-weight: 700; line-height: 1.4;">${idx + 1}. 👉 ${escapeHtml(c.vi)}</div>` : ''}
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-top: 2px;">
            <span style="font-weight: 600; font-size: 13px; color: #e2e8f0; font-style: italic; line-height: 1.4; padding-left: 14px;">"${escapeHtml(c.en)}"</span>
            <button type="button" class="ctrl-btn speak-sentence-btn" data-text="${escapeHtml(c.en)}" style="background: rgba(255,255,255,0.1); border: none; border-radius: 50%; width: 26px; height: 26px; font-size: 12px; cursor: pointer; color: #fff; flex-shrink: 0; display: flex; align-items: center; justify-content: center;" title="Phát âm câu này">🔊</button>
          </div>
        `;
      }
      wrap1.appendChild(cardDiv);
    });
    sec1.appendChild(wrap1);
    contentEl.appendChild(sec1);
  }

  // Section 2: Writing Examples
  if (writingItems.length > 0) {
    const sec2 = document.createElement('div');
    sec2.innerHTML = `<h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 6px;">✍️ WRITING</h4>`;
    const wrap2 = document.createElement('div');
    wrap2.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

    writingItems.forEach((c, idx) => {
      const cardDiv = document.createElement('div');
      cardDiv.style.cssText = 'background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 12px 14px;';
      if (isEnFirst) {
        cardDiv.innerHTML = `<div style="font-weight: 700; color: #fff;">${idx + 1}. "${escapeHtml(c.en)}"</div>${c.vi ? `<div style="font-size: 12.5px; color: #34d399; margin-top:4px;">👉 ${escapeHtml(c.vi)}</div>` : ''}`;
      } else {
        cardDiv.innerHTML = `${c.vi ? `<div style="font-weight: 700; color: #34d399;">${idx + 1}. 👉 ${escapeHtml(c.vi)}</div>` : ''}<div style="font-size: 13px; color: #e2e8f0; margin-top:4px; font-style: italic;">"${escapeHtml(c.en)}"</div>`;
      }
      wrap2.appendChild(cardDiv);
    });
    sec2.appendChild(wrap2);
    contentEl.appendChild(sec2);
  }
}

function openTkExpandModal(item) {
  const modal = document.getElementById('tkExpandModal');
  if (!modal || !item) return;

  renderTkExpandModalHeader(item);
  renderTkExpandModalExamples(item);
  updateTkLangOrderUI(item);

  const modalSwapBtn = document.getElementById('btnTkModalSwapLangOrder');
  if (modalSwapBtn) {
    modalSwapBtn.onclick = (e) => {
      e.stopPropagation();
      toggleTkLangOrder(item);
    };
  }

  const closeFn = () => {
    modal.classList.remove('active');
    modal.classList.remove('visible');
  };

  const btnClose = document.getElementById('btnTkExpandClose');
  if (btnClose) btnClose.onclick = closeFn;

  const btnDone = document.getElementById('btnTkExpandDone');
  if (btnDone) btnDone.onclick = closeFn;

  modal.classList.add('active');
  modal.classList.add('visible');
  if (typeof playTone === 'function') playTone(600, 0.06, 'sine', 0.1);
}

// State for TikTok Flashcard Views, Auto-scroll, Split Screen & Images
let tkCurrentViewMode = localStorage.getItem('task_countdown_tk_view_mode') || 'feed'; // 'feed' | '3d'
let tkIsAutoScroll5s = false;
let tkAutoScrollTimer = null;
let tkAutoScrollProgressTimer = null;
let tkAutoScrollStartTime = 0;
let tkIsSplitView = false;
let tkLikedCards = new Set(JSON.parse(localStorage.getItem('task_countdown_tk_liked') || '[]'));

function getActiveTkItem() {
  const items = getTkFilteredItems();
  if (items.length === 0) return null;
  if (!activeTkCardId) {
    activeTkCardId = items[0].id;
    return items[0];
  }
  return items.find(x => x.id === activeTkCardId) || items[0];
}

function setTkViewMode(mode) {
  tkCurrentViewMode = mode === '3d' ? '3d' : 'feed';
  try {
    localStorage.setItem('task_countdown_tk_view_mode', tkCurrentViewMode);
  } catch (e) {}

  const btnFeed = document.getElementById('btnTkViewModeFeed');
  const btn3D = document.getElementById('btnTkViewMode3D');
  if (btnFeed) btnFeed.classList.toggle('active', tkCurrentViewMode === 'feed');
  if (btn3D) btn3D.classList.toggle('active', tkCurrentViewMode === '3d');

  const curItem = getActiveTkItem();
  if (curItem) {
    renderTkCurrentCard(curItem);
  }
}

function renderTkCurrentCard(item) {
  if (!item) return;
  if (tkCurrentViewMode === 'feed') {
    renderTkFeed(item);
  } else {
    renderTkPlayer(item);
  }
}

let tkCropModeActive = true;

function openTkImageLightbox(src, caption = '') {
  if (!src) return;
  const modal = document.getElementById('tkImageLightboxModal');
  const imgEl = document.getElementById('tkLightboxImg');
  const capEl = document.getElementById('tkLightboxCaption');
  const closeBtn = document.getElementById('btnTkCloseLightbox');
  const backdrop = document.getElementById('tkLightboxBackdrop');
  const canvas = document.getElementById('tkLightboxCropCanvas');
  const btnCropMode = document.getElementById('btnTkLightboxCropMode');
  const btnCopyFull = document.getElementById('btnTkLightboxCopyFull');
  const hintEl = document.getElementById('tkLightboxCropHint');

  if (!modal || !imgEl) return;

  imgEl.src = src;
  if (capEl) {
    capEl.textContent = caption || '';
    capEl.style.display = caption ? 'block' : 'none';
  }
  modal.style.display = 'flex';

  if (closeBtn) closeBtn.onclick = closeTkImageLightbox;

  // Click anywhere outside the image/content to immediately close lightbox
  modal.onclick = (e) => {
    if (e.target.closest('.tk-lightbox-toolbar') || e.target.closest('.tk-lightbox-img-wrap') || e.target.closest('.tk-lightbox-caption')) {
      return;
    }
    closeTkImageLightbox();
  };
  if (backdrop) backdrop.onclick = closeTkImageLightbox;

  // Toggle crop mode
  if (btnCropMode) {
    btnCropMode.onclick = () => {
      tkCropModeActive = !tkCropModeActive;
      btnCropMode.classList.toggle('active', tkCropModeActive);
      if (canvas) canvas.style.display = tkCropModeActive ? 'block' : 'none';
      if (hintEl) hintEl.textContent = tkCropModeActive 
        ? '💡 Kéo thả chuột trực tiếp trên ảnh để chụp vùng bạn cần. Ảnh sẽ tự động lưu vào Clipboard!' 
        : '🔍 Chế độ xem phóng to bình thường. Bấm "Chụp vùng ảnh" để bật lại công cụ cắt ảnh.';
      if (typeof playTone === 'function') playTone(600, 0.05, 'sine', 0.1);
    };
  }

  // Copy whole image
  if (btnCopyFull) {
    btnCopyFull.onclick = async () => {
      if (window.taskAPI && window.taskAPI.copyImage) {
        await window.taskAPI.copyImage(src);
      }
      showTkToast('📋 Đã copy toàn bộ ảnh vào Clipboard!');
      if (typeof playTone === 'function') playTone(880, 0.08, 'sine', 0.15);
    };
  }

  function setupCanvasSize() {
    if (!canvas || !imgEl) return;
    canvas.width = imgEl.clientWidth;
    canvas.height = imgEl.clientHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  imgEl.onload = () => {
    setTimeout(setupCanvasSize, 50);
  };
  setTimeout(setupCanvasSize, 100);

  // Setup Drag-to-Crop Snipping Engine on Canvas
  if (canvas) {
    let isDrawing = false;
    let startX = 0;
    let startY = 0;

    canvas.onmousedown = (e) => {
      if (!tkCropModeActive) return;
      isDrawing = true;
      startX = e.offsetX;
      startY = e.offsetY;
    };

    canvas.onmousemove = (e) => {
      if (!isDrawing || !tkCropModeActive) return;
      const curX = e.offsetX;
      const curY = e.offsetY;
      const x = Math.min(startX, curX);
      const y = Math.min(startY, curY);
      const w = Math.abs(curX - startX);
      const h = Math.abs(curY - startY);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear selected box
      ctx.clearRect(x, y, w, h);

      // Glowing dashed border
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      // Corner handles
      ctx.fillStyle = '#ff0050';
      const handleSize = 6;
      ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(x + w - handleSize/2, y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(x - handleSize/2, y + h - handleSize/2, handleSize, handleSize);
      ctx.fillRect(x + w - handleSize/2, y + h - handleSize/2, handleSize, handleSize);

      // Dimensions tag
      if (w > 40 && h > 20) {
        const scaleX = imgEl.naturalWidth / imgEl.clientWidth;
        const scaleY = imgEl.naturalHeight / imgEl.clientHeight;
        const natW = Math.round(w * scaleX);
        const natH = Math.round(h * scaleY);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(x, Math.max(0, y - 22), 90, 20);
        ctx.fillStyle = '#00f2fe';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(`✂️ ${natW}×${natH}px`, x + 6, Math.max(14, y - 8));
      }
    };

    canvas.onmouseup = async (e) => {
      if (!isDrawing || !tkCropModeActive) return;
      isDrawing = false;
      const endX = e.offsetX;
      const endY = e.offsetY;
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const w = Math.abs(endX - startX);
      const h = Math.abs(endY - startY);

      const ctx = canvas.getContext('2d');

      if (w < 12 || h < 12) {
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Flash feedback
      if (ctx) {
        ctx.fillStyle = 'rgba(0, 242, 254, 0.4)';
        ctx.fillRect(x, y, w, h);
      }

      // Crop high-res image
      try {
        const scaleX = imgEl.naturalWidth / imgEl.clientWidth;
        const scaleY = imgEl.naturalHeight / imgEl.clientHeight;
        const natX = x * scaleX;
        const natY = y * scaleY;
        const natW = w * scaleX;
        const natH = h * scaleY;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = natW;
        offCanvas.height = natH;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(imgEl, natX, natY, natW, natH, 0, 0, natW, natH);

        const croppedDataUrl = offCanvas.toDataURL('image/png');

        // Copy to clipboard via IPC
        if (window.taskAPI && window.taskAPI.copyImage) {
          await window.taskAPI.copyImage(croppedDataUrl);
        }

        // Camera shutter chime
        if (typeof playTone === 'function') {
          playTone(950, 0.04, 'sine', 0.2);
          setTimeout(() => playTone(1200, 0.06, 'triangle', 0.2), 50);
        }

        showTkToast(`✂️ Đã chụp & copy vùng ảnh (${Math.round(natW)}×${Math.round(natH)}px) vào Clipboard! Nhấn Ctrl+V để dùng ngay.`);
      } catch (err) {
        console.error('Lỗi khi chụp vùng ảnh:', err);
      } finally {
        setTimeout(() => {
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 300);
      }
    };
  }

  if (typeof playTone === 'function') playTone(800, 0.05, 'sine', 0.12);
}

function closeTkImageLightbox() {
  const modal = document.getElementById('tkImageLightboxModal');
  const canvas = document.getElementById('tkLightboxCropCanvas');
  if (modal) modal.style.display = 'none';
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Global Esc to close lightbox
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeTkImageLightbox();
    const exampleOverlay = document.getElementById('tkFeedExampleOverlay');
    if (exampleOverlay) exampleOverlay.style.display = 'none';
  }
});

function renderTkFeed(item) {
  const feedState = document.getElementById('tkFeedState');
  const playerState = document.getElementById('tkPlayerState');
  const formState = document.getElementById('tkFormState');
  if (!feedState || !item) return;

  if (formState) formState.style.display = 'none';
  if (playerState) playerState.style.display = 'none';
  feedState.style.display = 'flex';

  const items = getTkFilteredItems();
  const curIdx = items.findIndex(x => x.id === item.id);
  const totalCount = items.length;

  const feedMedia = document.getElementById('tkFeedMedia');
  const feedImg = document.getElementById('tkFeedImg');
  const feedBgBlur = document.getElementById('tkFeedBgBlur');
  const noImgPlaceholder = document.getElementById('tkFeedNoImgPlaceholder');
  const pWord = document.getElementById('tkFeedPlaceholderWord');
  const pTrans = document.getElementById('tkFeedPlaceholderTrans');

  const mainWord = document.getElementById('tkFeedWord');
  const mainTrans = document.getElementById('tkFeedTrans');
  const indexTag = document.getElementById('tkFeedIndexTag');
  const likeBtn = document.getElementById('btnTkFeedLike');
  const likeCount = document.getElementById('tkFeedLikeCount');

  if (item.imageUrl && item.imageUrl.trim()) {
    if (feedImg) {
      feedImg.src = item.imageUrl;
      feedImg.style.display = 'block';
    }
    if (feedBgBlur) {
      feedBgBlur.style.backgroundImage = `url("${item.imageUrl}")`;
    }
    if (noImgPlaceholder) noImgPlaceholder.style.display = 'none';

    // Click on image to zoom in fullscreen
    if (feedMedia) {
      feedMedia.onclick = (e) => {
        if (e.target.closest('.tk-feed-actions') || e.target.closest('.tk-feed-bottom') || e.target.closest('.tk-feed-example-overlay')) {
          return;
        }
        openTkImageLightbox(item.imageUrl, `${item.word || ''} ${item.translation ? '— ' + item.translation : ''}`);
      };
      feedMedia.style.cursor = 'zoom-in';
    }
  } else {
    if (feedImg) {
      feedImg.src = '';
      feedImg.style.display = 'none';
    }
    if (feedBgBlur) {
      feedBgBlur.style.backgroundImage = 'none';
    }
    if (feedMedia) {
      feedMedia.onclick = null;
      feedMedia.style.cursor = 'default';
    }
    if (noImgPlaceholder) noImgPlaceholder.style.display = 'flex';
    if (pWord) pWord.textContent = item.word || 'Word';
    if (pTrans) pTrans.textContent = item.translation || 'Dịch nghĩa';
  }

  const isEnFirst = (tkLangOrder === 'en_first');
  if (mainWord) mainWord.textContent = isEnFirst ? (item.word || '---') : (item.translation || '---');
  if (mainTrans) mainTrans.textContent = isEnFirst ? (item.translation || '(Chưa có bản dịch)') : (item.word || '---');
  if (indexTag) indexTag.textContent = `Thẻ ${curIdx >= 0 ? curIdx + 1 : 1} / ${totalCount}`;
  
  const isLiked = tkLikedCards.has(item.id);
  if (likeBtn) {
    likeBtn.classList.toggle('liked', isLiked);
    likeBtn.textContent = isLiked ? '❤️' : '🤍';
  }
  if (likeCount) {
    likeCount.textContent = isLiked ? '21.2K' : '21.1K';
  }

  if (likeBtn) {
    likeBtn.onclick = (e) => {
      e.stopPropagation();
      if (tkLikedCards.has(item.id)) {
        tkLikedCards.delete(item.id);
      } else {
        tkLikedCards.add(item.id);
        if (typeof playTone === 'function') playTone(800, 0.08, 'sine', 0.15);
      }
      try {
        localStorage.setItem('task_countdown_tk_liked', JSON.stringify(Array.from(tkLikedCards)));
      } catch (e) {}
      renderTkFeed(item);
    };
  }

  const commentBtn = document.getElementById('btnTkFeedComment');
  if (commentBtn) {
    commentBtn.onclick = (e) => {
      e.stopPropagation();
      openTkExpandModal(item);
    };
  }

  const askGeminiBtn = document.getElementById('btnTkFeedAskGemini');
  if (askGeminiBtn) {
    askGeminiBtn.onclick = (e) => {
      e.stopPropagation();
      if (!tkIsSplitView) {
        toggleTkSplitView();
      }
      sendWordToMiniGemini(item);
    };
  }

  const exampleOverlay = document.getElementById('tkFeedExampleOverlay');
  const exampleContent = document.getElementById('tkFeedExampleContent');
  const exampleTitle = document.getElementById('tkFeedExampleTitle');
  const closeExampleBtn = document.getElementById('btnTkCloseFeedExample');
  const exampleBtn = document.getElementById('btnTkFeedExamples');

  if (exampleOverlay) exampleOverlay.style.display = 'none';

  if (exampleBtn && exampleOverlay) {
    exampleBtn.onclick = (e) => {
      e.stopPropagation();
      const isShowing = (exampleOverlay.style.display === 'flex');
      if (isShowing) {
        exampleOverlay.style.display = 'none';
      } else {
        if (exampleTitle) {
          exampleTitle.textContent = `${item.word || 'Từ vựng'} ${item.translation ? '— ' + item.translation : ''}`;
        }
        if (exampleContent) {
          if (item.notes && item.notes.trim()) {
            exampleContent.innerHTML = formatGeminiResponse(item.notes);
          } else {
            exampleContent.innerHTML = `
              <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; border-left: 3px solid #00f2fe; margin-bottom: 12px;">
                <b style="color: #00f2fe;">📖 Từ vựng:</b> ${escapeHtml(item.word || '')}<br>
                <b style="color: #6ee7b7;">🎯 Bản dịch:</b> ${escapeHtml(item.translation || '(Chưa có ghi chú)')}
              </div>
              <div style="font-size: 12.5px; line-height: 1.5; color: #94a3b8;">
                💡 <i>Chưa có 10 ví dụ mẫu. Bạn có thể bấm nút <b>"✨ Sửa"</b> rồi chọn <b>"✨ Tải dữ liệu"</b> hoặc bấm <b>"✨ AI Hỏi"</b> để Gemini tạo ngay 10 câu ví dụ IELTS Speaking & Writing đỉnh cao nhé!</i>
              </div>
            `;
          }
        }
        exampleOverlay.style.display = 'flex';
        if (typeof playTone === 'function') playTone(700, 0.05, 'sine', 0.1);
      }
    };
  }

  if (closeExampleBtn && exampleOverlay) {
    closeExampleBtn.onclick = (e) => {
      e.stopPropagation();
      exampleOverlay.style.display = 'none';
      if (typeof playTone === 'function') playTone(500, 0.04, 'sine', 0.1);
    };
  }

  const feedSpeakBtn = document.getElementById('btnTkFeedSpeak');
  if (feedSpeakBtn) {
    feedSpeakBtn.onclick = (e) => {
      e.stopPropagation();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(item.word);
        utt.lang = 'en-US';
        utt.rate = 0.9;
        window.speechSynthesis.speak(utt);
      }
    };
  }

  const vinylBtn = document.getElementById('btnTkFeedOpenTikTok');
  if (vinylBtn) {
    vinylBtn.onclick = (e) => {
      e.stopPropagation();
      let targetUrl = item.tiktokUrl;
      if (!targetUrl || !targetUrl.trim()) {
        targetUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(item.word)}`;
      }
      if (window.taskAPI && window.taskAPI.openExternal) {
        window.taskAPI.openExternal(targetUrl);
      } else {
        window.open(targetUrl, '_blank');
      }
      if (typeof playTone === 'function') playTone(600, 0.08, 'sine', 0.1);
    };
  }

  if (tkIsAutoScroll5s) {
    resetAutoScrollTimer();
  }
}

function renderTkPlayer(item) {
  const playerState = document.getElementById('tkPlayerState');
  const feedState = document.getElementById('tkFeedState');
  const formState = document.getElementById('tkFormState');
  if (!playerState || !item) return;

  if (formState) formState.style.display = 'none';
  if (feedState) feedState.style.display = 'none';
  playerState.style.display = 'flex';

  const items = getTkFilteredItems();
  const curIdx = items.findIndex(x => x.id === item.id);
  const totalCount = items.length;

  const idxBadge = document.getElementById('tkPlayerIndexBadge');
  if (idxBadge) idxBadge.textContent = `Thẻ ${curIdx >= 0 ? curIdx + 1 : 1} / ${totalCount}`;

  const lvl = item.level || 1;
  const srsBadge = document.getElementById('tkPlayerSrsBadge');
  if (srsBadge) srsBadge.textContent = `Lớp ${lvl}`;

  const isEnFirst = (tkLangOrder === 'en_first');

  const frontTitle = document.getElementById('lblTkFrontFaceTitle');
  if (frontTitle) {
    frontTitle.textContent = isEnFirst ? 'MẶT TRƯỚC (TỪ VỰNG TIẾNG ANH)' : 'MẶT TRƯỚC (DỊCH NGHĨA TIẾNG VIỆT)';
  }

  const wordEl = document.getElementById('lblTkWord');
  if (wordEl) {
    const frontText = isEnFirst ? (item.word || '---') : (item.translation || '(Chưa có bản dịch)');
    wordEl.textContent = frontText;
    wordEl.style.color = isEnFirst ? '#fff' : '#6ee7b7';
  }

  const backWordMini = document.getElementById('lblTkBackWordMini');
  if (backWordMini) backWordMini.textContent = isEnFirst ? (item.word || '---') : (item.translation || '---');

  const transEl = document.getElementById('lblTkTrans');
  if (transEl) {
    transEl.textContent = item.translation || '(Chưa có bản dịch)';
  }

  const notesEl = document.getElementById('lblTkNotes');
  if (notesEl) notesEl.textContent = item.notes || 'Chưa có ghi chú ví dụ.';

  updateTkLangOrderUI(item);

  const btnFrontSwap = document.getElementById('btnTkFrontSwapLang');
  if (btnFrontSwap) {
    btnFrontSwap.onclick = (e) => {
      e.stopPropagation();
      toggleTkLangOrder(item);
    };
  }

  const cardInner = document.getElementById('tk3dCardInner');
  if (cardInner) {
    cardInner.style.transform = 'rotateY(0deg)';
  }

  const btnExpandBack = document.getElementById('btnTkExpandDetailCard');
  if (btnExpandBack) {
    btnExpandBack.onclick = (e) => {
      e.stopPropagation();
      openTkExpandModal(item);
    };
  }

  const openTikTokHandler = () => {
    let targetUrl = item.tiktokUrl;
    if (!targetUrl || !targetUrl.trim()) {
      targetUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(item.word)}`;
    }
    if (window.taskAPI && window.taskAPI.openExternal) {
      window.taskAPI.openExternal(targetUrl);
    } else {
      window.open(targetUrl, '_blank');
    }
    if (typeof playTone === 'function') playTone(600, 0.08, 'sine', 0.1);
  };

  const btnSpeak = document.getElementById('btnTkSpeakFront');
  if (btnSpeak) btnSpeak.onclick = (e) => { e.stopPropagation(); const utt = new SpeechSynthesisUtterance(item.word); utt.lang = 'en-US'; window.speechSynthesis.speak(utt); };
}

function toggleTkAutoScroll5s() {
  tkIsAutoScroll5s = !tkIsAutoScroll5s;
  updateAutoScrollUI();
  if (tkIsAutoScroll5s) {
    resetAutoScrollTimer();
    if (typeof playTone === 'function') playTone(750, 0.08, 'sine', 0.15);
  } else {
    stopAutoScrollTimer();
    if (typeof playTone === 'function') playTone(450, 0.08, 'sine', 0.15);
  }
}

function updateAutoScrollUI() {
  const badge = document.getElementById('tkAutoScrollBadge');
  const label = document.getElementById('tkAutoScrollLabel');
  const feedBtn = document.getElementById('btnTkFeedAuto5sToggle');

  if (badge) badge.classList.toggle('active', tkIsAutoScroll5s);
  if (label) {
    label.innerHTML = `Tự động lướt: <b style="color: ${tkIsAutoScroll5s ? '#00f2fe' : '#fff'};">${tkIsAutoScroll5s ? 'BẬT (5s)' : 'TẮT'}</b>`;
  }
  if (feedBtn) {
    feedBtn.style.background = tkIsAutoScroll5s ? 'linear-gradient(135deg, #ff0050 0%, #00f2fe 100%)' : 'rgba(19, 23, 34, 0.85)';
    feedBtn.style.color = tkIsAutoScroll5s ? '#fff' : '#ff0050';
  }
}

function resetAutoScrollTimer() {
  stopAutoScrollTimer();
  if (!tkIsAutoScroll5s) return;

  const progressBar = document.getElementById('tkFeedProgressFill');
  if (progressBar) progressBar.style.width = '0%';

  const duration = 5000;
  const step = 50;
  tkAutoScrollStartTime = Date.now();

  tkAutoScrollProgressTimer = setInterval(() => {
    const elapsed = Date.now() - tkAutoScrollStartTime;
    const pct = Math.min(100, (elapsed / duration) * 100);
    if (progressBar) progressBar.style.width = pct + '%';

    if (elapsed >= duration) {
      clearInterval(tkAutoScrollProgressTimer);
      advanceToNextCard();
    }
  }, step);
}

function stopAutoScrollTimer() {
  if (tkAutoScrollProgressTimer) {
    clearInterval(tkAutoScrollProgressTimer);
    tkAutoScrollProgressTimer = null;
  }
  const progressBar = document.getElementById('tkFeedProgressFill');
  if (progressBar) progressBar.style.width = '0%';
}

function advanceToNextCard() {
  const items = getTkFilteredItems();
  if (items.length <= 1) return;
  const curIdx = items.findIndex(x => x.id === activeTkCardId);
  const nextIdx = curIdx < items.length - 1 ? curIdx + 1 : 0;
  activeTkCardId = items[nextIdx].id;
  renderTkFlashcardList();
  renderTkCurrentCard(items[nextIdx]);
  if (typeof playTone === 'function') playTone(520, 0.04, 'sine', 0.08);
}

function advanceToPrevCard() {
  const items = getTkFilteredItems();
  if (items.length <= 1) return;
  const curIdx = items.findIndex(x => x.id === activeTkCardId);
  const prevIdx = curIdx > 0 ? curIdx - 1 : items.length - 1;
  activeTkCardId = items[prevIdx].id;
  renderTkFlashcardList();
  renderTkCurrentCard(items[prevIdx]);
  if (typeof playTone === 'function') playTone(520, 0.04, 'sine', 0.08);
}

function toggleTkSplitView() {
  tkIsSplitView = !tkIsSplitView;
  const rightPane = document.getElementById('tkSplitRightGemini');
  const btnToggle = document.getElementById('btnTkToggleSplitView');

  if (rightPane) {
    rightPane.style.display = tkIsSplitView ? 'flex' : 'none';
  }
  if (btnToggle) {
    btnToggle.style.background = tkIsSplitView
      ? 'linear-gradient(135deg, #10b981 0%, #00f2fe 100%)'
      : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)';
    btnToggle.textContent = tkIsSplitView ? '🌓 Tắt Chia Đôi Màn Hình' : '🌓 Chia Đôi Màn Hình Gemini';
  }

  if (tkIsSplitView) {
    initMiniGeminiTab();
    if (typeof playTone === 'function') playTone(700, 0.08, 'sine', 0.15);
  }
}

async function handleImagePasteOrFile(dataUrl) {
  if (!dataUrl) return;

  const formState = document.getElementById('tkFormState');
  const isFormOpen = formState && formState.style.display !== 'none';

  if (isFormOpen) {
    const formImgUrl = document.getElementById('tkFormImageUrl');
    const previewWrap = document.getElementById('tkFormImagePreviewWrap');
    const previewImg = document.getElementById('tkFormPreviewImg');
    const dropzoneEmpty = document.getElementById('tkFormDropzoneEmpty');

    if (formImgUrl) formImgUrl.value = dataUrl;
    if (previewImg) previewImg.src = dataUrl;
    if (previewWrap) previewWrap.style.display = 'flex';
    if (dropzoneEmpty) dropzoneEmpty.style.display = 'none';
    if (typeof playTone === 'function') playTone(650, 0.08, 'sine', 0.12);
  } else {
    const curItem = getActiveTkItem();
    if (!curItem) {
      alert('Chưa có thẻ nào để gắn ảnh!');
      return;
    }
    curItem.imageUrl = dataUrl;
    await saveTkFlashcardData();
    renderTkCurrentCard(curItem);
    if (typeof playTone === 'function') playTone(780, 0.1, 'sine', 0.15);
  }
}

function setupImageDropAndPaste() {
  window.addEventListener('paste', async (e) => {
    const pane = document.getElementById('paneTiktokFlashcard');
    if (!pane || !pane.classList.contains('active')) return;

    if (e.clipboardData && e.clipboardData.items) {
      for (const item of e.clipboardData.items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => handleImagePasteOrFile(event.target.result);
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    }
  });

  const btnQuickPaste = document.getElementById('btnTkQuickPasteImg');
  if (btnQuickPaste) {
    btnQuickPaste.addEventListener('click', async () => {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const reader = new FileReader();
              reader.onload = (e) => handleImagePasteOrFile(e.target.result);
              reader.readAsDataURL(blob);
              return;
            }
          }
        }
      } catch (err) { alert('Vui lòng copy 1 ảnh (Ctrl+C) rồi bấm nút này!'); }
    });
  }
}

function openTkForm(itemToEdit = null) {
  const playerState = document.getElementById('tkPlayerState');
  const feedState = document.getElementById('tkFeedState');
  const formState = document.getElementById('tkFormState');
  if (!formState) return;

  if (playerState) playerState.style.display = 'none';
  if (feedState) feedState.style.display = 'none';
  formState.style.display = 'flex';

  const formTitle = document.getElementById('tkFormTitle');
  const editId = document.getElementById('tkEditId');
  const formImgUrl = document.getElementById('tkFormImageUrl');
  const previewWrap = document.getElementById('tkFormImagePreviewWrap');
  const previewImg = document.getElementById('tkFormPreviewImg');
  const dropzoneEmpty = document.getElementById('tkFormDropzoneEmpty');

  const wordInp = document.getElementById('tkWordInput');
  const transInp = document.getElementById('tkTransInput');
  const notesInp = document.getElementById('tkNotesInput');
  const urlInp = document.getElementById('tkUrlInput');
  const defaultMusicUrl = tkLastChosenMusicUrl || (tkSavedMusicList[0] ? tkSavedMusicList[0].url : '');

  if (itemToEdit) {
    if (formTitle) formTitle.textContent = '✏️ Chỉnh Sửa Thẻ';
    if (editId) editId.value = itemToEdit.id;
    if (wordInp) wordInp.value = itemToEdit.word || '';
    if (transInp) transInp.value = itemToEdit.translation || '';
    if (notesInp) notesInp.value = itemToEdit.notes || '';
    if (urlInp) urlInp.value = itemToEdit.tiktokUrl || defaultMusicUrl;
    if (formImgUrl) formImgUrl.value = itemToEdit.imageUrl || '';

    if (itemToEdit.imageUrl) {
      if (previewImg) previewImg.src = itemToEdit.imageUrl;
      if (previewWrap) previewWrap.style.display = 'flex';
      if (dropzoneEmpty) dropzoneEmpty.style.display = 'none';
    } else {
      if (previewWrap) previewWrap.style.display = 'none';
      if (dropzoneEmpty) dropzoneEmpty.style.display = 'flex';
    }
  } else {
    if (formTitle) formTitle.textContent = '➕ Thêm Thẻ Mới';
    if (editId) editId.value = '';
    if (wordInp) wordInp.value = '';
    if (transInp) transInp.value = '';
    if (notesInp) notesInp.value = '';
    if (urlInp) urlInp.value = defaultMusicUrl;
    if (formImgUrl) formImgUrl.value = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (dropzoneEmpty) dropzoneEmpty.style.display = 'flex';
  }
}

function closeTkForm() {
  const formState = document.getElementById('tkFormState');
  if (formState) formState.style.display = 'none';
  const curItem = getActiveTkItem();
  if (curItem) renderTkCurrentCard(curItem);
}

async function saveTkForm() {
  const editId = document.getElementById('tkEditId')?.value || '';
  const imageUrl = (document.getElementById('tkFormImageUrl')?.value || '').trim();
  let word = (document.getElementById('tkWordInput')?.value || '').trim();
  const trans = (document.getElementById('tkTransInput')?.value || '').trim();
  const notes = (document.getElementById('tkNotesInput')?.value || '').trim();
  let url = (document.getElementById('tkUrlInput')?.value || '').trim();

  // If neither word nor image is present, alert user
  if (!word && !imageUrl) {
    alert('Vui lòng nhập từ vựng hoặc dán/tải ít nhất 1 hình ảnh!');
    return;
  }

  // If user only provided image, give a nice default title
  if (!word && imageUrl) {
    word = '🖼️ Thẻ ảnh #' + (editId ? editId.slice(-4) : (tkFlashcardData.items?.length || 0) + 1);
  }

  if (!url) {
    url = word && !word.startsWith('🖼️') ? `https://www.tiktok.com/search?q=${encodeURIComponent(word)}` : 'https://www.tiktok.com';
  }

  if (editId) {
    const item = (tkFlashcardData.items || []).find(x => x.id === editId);
    if (item) {
      item.word = word;
      item.translation = trans;
      item.notes = notes;
      item.tiktokUrl = url;
      item.imageUrl = imageUrl;
    }
  } else {
    const newItem = {
      id: 'tk_' + Date.now(),
      word, translation: trans, notes,
      imageUrl: imageUrl || '',
      tiktokUrl: url,
      level: 1, interval: 1,
      nextReviewDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    if (!tkFlashcardData.items) tkFlashcardData.items = [];
    tkFlashcardData.items.unshift(newItem);
    activeTkCardId = newItem.id;
  }

  await saveTkFlashcardData();
  closeTkForm();
  updateTkDashboardStats();
  renderTkFlashcardList();
  renderTkCurrentCard(getActiveTkItem());
  if (typeof playTone === 'function') playTone(600, 0.08, 'sine', 0.12);
}

function toggleTkCardFlip() {
  if (tkCurrentViewMode === 'feed') {
    toggleTkLangOrder(getActiveTkItem());
  } else {
    const cardInner = document.getElementById('tk3dCardInner');
    if (!cardInner) return;
    const isFlipped = cardInner.style.transform === 'rotateY(180deg)';
    cardInner.style.transform = isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)';
    if (typeof playTone === 'function') playTone(550, 0.05, 'sine', 0.1);
  }
}

let geminiChatHistory = [];
let miniGeminiInitialized = false;
let currentGeminiModel = 'gemini-1.5-flash';

function initMiniGeminiTab() {
  if (miniGeminiInitialized) return;
  miniGeminiInitialized = true;

  // 1. Model Selector Dropdown Logic (Split View)
  const btnSplitModel = document.getElementById('btnTkSplitModelSelector');
  const dropdownSplitModel = document.getElementById('tkSplitModelDropdown');
  const lblSplitCurModel = document.getElementById('lblTkSplitCurModel');

  if (btnSplitModel && dropdownSplitModel) {
    btnSplitModel.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownSplitModel.classList.toggle('show');
    });

    dropdownSplitModel.querySelectorAll('.gemini-model-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownSplitModel.querySelectorAll('.gemini-model-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        currentGeminiModel = opt.dataset.model || 'gemini-1.5-flash';
        const titleEl = opt.querySelector('.gemini-model-opt-title');
        if (lblSplitCurModel && titleEl) {
          lblSplitCurModel.textContent = titleEl.textContent.replace(/^[^\w\d]+/, '').trim();
        }
        dropdownSplitModel.classList.remove('show');
        if (typeof playTone === 'function') playTone(750, 0.05, 'sine', 0.1);
      });
    });
  }

  // 2. Model Selector Dropdown Logic (Standalone Tab)
  const btnStandModel = document.getElementById('btnGeminiStandaloneModelSelector');
  const dropdownStandModel = document.getElementById('geminiStandaloneModelDropdown');
  const lblStandCurModel = document.getElementById('lblGeminiStandaloneCurModel');

  if (btnStandModel && dropdownStandModel) {
    btnStandModel.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownStandModel.classList.toggle('show');
    });

    dropdownStandModel.querySelectorAll('.gemini-model-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownStandModel.querySelectorAll('.gemini-model-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        currentGeminiModel = opt.dataset.model || 'gemini-1.5-flash';
        const titleEl = opt.querySelector('.gemini-model-opt-title');
        if (lblStandCurModel && titleEl) {
          lblStandCurModel.textContent = titleEl.textContent.replace(/^[^\w\d]+/, '').trim();
        }
        dropdownStandModel.classList.remove('show');
        if (typeof playTone === 'function') playTone(750, 0.05, 'sine', 0.1);
      });
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    if (dropdownSplitModel) dropdownSplitModel.classList.remove('show');
    if (dropdownStandModel) dropdownStandModel.classList.remove('show');
  });

  // 3. Source Switcher (Split View: Webview vs App)
  const btnSplitWeb = document.getElementById('btnTkSplitSrcWeb');
  const btnSplitApp = document.getElementById('btnTkSplitSrcApp');
  const wrapSplitWeb = document.getElementById('tkSplitWebviewWrap');
  const wrapSplitApp = document.getElementById('tkSplitAppWrap');

  if (btnSplitWeb && btnSplitApp) {
    btnSplitWeb.addEventListener('click', () => {
      btnSplitWeb.classList.add('active');
      btnSplitApp.classList.remove('active');
      if (wrapSplitWeb) wrapSplitWeb.style.display = 'flex';
      if (wrapSplitApp) wrapSplitApp.style.display = 'none';
      if (typeof playTone === 'function') playTone(600, 0.05, 'sine', 0.1);
    });

    btnSplitApp.addEventListener('click', () => {
      btnSplitApp.classList.add('active');
      btnSplitWeb.classList.remove('active');
      if (wrapSplitApp) wrapSplitApp.style.display = 'flex';
      if (wrapSplitWeb) wrapSplitWeb.style.display = 'none';
      if (typeof playTone === 'function') playTone(600, 0.05, 'sine', 0.1);
    });
  }

  // 4. Source Switcher (Standalone Tab: Webview vs App)
  const btnStandWeb = document.getElementById('btnGeminiStandaloneSrcWeb');
  const btnStandApp = document.getElementById('btnGeminiStandaloneSrcApp');
  const wrapStandWeb = document.getElementById('geminiStandaloneWebviewWrap');
  const wrapStandApp = document.getElementById('geminiStandaloneAppWrap');

  if (btnStandWeb && btnStandApp) {
    btnStandWeb.addEventListener('click', () => {
      btnStandWeb.classList.add('active');
      btnStandApp.classList.remove('active');
      if (wrapStandWeb) wrapStandWeb.style.display = 'flex';
      if (wrapStandApp) wrapStandApp.style.display = 'none';
      if (typeof playTone === 'function') playTone(600, 0.05, 'sine', 0.1);
    });

    btnStandApp.addEventListener('click', () => {
      btnStandApp.classList.add('active');
      btnStandWeb.classList.remove('active');
      if (wrapStandApp) wrapStandApp.style.display = 'flex';
      if (wrapStandWeb) wrapStandWeb.style.display = 'none';
      if (typeof playTone === 'function') playTone(600, 0.05, 'sine', 0.1);
    });
  }

  // 5. Reload Buttons
  const btnSplitReload = document.getElementById('btnTkSplitGeminiReload');
  if (btnSplitReload) {
    btnSplitReload.addEventListener('click', () => {
      const wv = document.getElementById('tkSplitGeminiWebview');
      if (wrapSplitWeb && wrapSplitWeb.style.display !== 'none' && wv) {
        wv.reload();
      } else {
        const msgList = document.getElementById('tkSplitGeminiMsgList');
        const welcome = document.getElementById('tkSplitGeminiWelcome');
        if (msgList) msgList.innerHTML = '';
        if (welcome) welcome.style.display = 'flex';
      }
      if (typeof playTone === 'function') playTone(650, 0.05, 'sine', 0.1);
    });
  }

  const btnStandReload = document.getElementById('btnGeminiStandaloneReload');
  if (btnStandReload) {
    btnStandReload.addEventListener('click', () => {
      const wv = document.getElementById('geminiStandaloneWebview');
      if (wrapStandWeb && wrapStandWeb.style.display !== 'none' && wv) {
        wv.reload();
      } else {
        const msgList = document.getElementById('geminiStandaloneMsgList');
        const welcome = document.getElementById('geminiStandaloneWelcome');
        if (msgList) msgList.innerHTML = '';
        if (welcome) welcome.style.display = 'flex';
      }
      if (typeof playTone === 'function') playTone(650, 0.05, 'sine', 0.1);
    });
  }

  // 6. Open Separate Window Buttons
  const btnSplitOpenWin = document.getElementById('btnTkSplitGeminiOpenWin');
  if (btnSplitOpenWin) {
    btnSplitOpenWin.addEventListener('click', () => {
      if (window.taskAPI && window.taskAPI.openGeminiWindow) {
        window.taskAPI.openGeminiWindow('https://gemini.google.com/');
      } else {
        window.open('https://gemini.google.com/', '_blank');
      }
    });
  }

  const btnStandOpenWin = document.getElementById('btnGeminiStandaloneOpenWin');
  if (btnStandOpenWin) {
    btnStandOpenWin.addEventListener('click', () => {
      if (window.taskAPI && window.taskAPI.openGeminiWindow) {
        window.taskAPI.openGeminiWindow('https://gemini.google.com/');
      } else {
        window.open('https://gemini.google.com/', '_blank');
      }
    });
  }

  const btnStandOpenWeb = document.getElementById('btnGeminiStandaloneOpenWeb');
  if (btnStandOpenWeb) {
    btnStandOpenWeb.addEventListener('click', () => {
      if (window.taskAPI && window.taskAPI.openExternal) {
        window.taskAPI.openExternal('https://gemini.google.com/');
      } else {
        window.open('https://gemini.google.com/', '_blank');
      }
    });
  }

  const btnSplitClose = document.getElementById('btnTkSplitGeminiClose');
  if (btnSplitClose) btnSplitClose.addEventListener('click', toggleTkSplitView);

  // 7. Input & Send Handlers (Split View)
  const btnSplitSend = document.getElementById('btnTkSplitGeminiSend');
  const inpSplit = document.getElementById('tkSplitGeminiInput');
  const btnSplitAskWord = document.getElementById('btnTkSplitGeminiAskWord');

  if (btnSplitSend && inpSplit) {
    const doSend = () => {
      const text = inpSplit.value.trim();
      if (!text) return;
      inpSplit.value = '';
      sendGeminiQuestion(text, 'split');
    };
    btnSplitSend.addEventListener('click', doSend);
    inpSplit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); doSend(); }
    });
  }

  if (btnSplitAskWord) {
    btnSplitAskWord.addEventListener('click', () => {
      const cur = getActiveTkItem();
      if (cur) sendWordToMiniGemini(cur);
    });
  }

  // 8. Input & Send Handlers (Standalone Tab)
  const btnStandSend = document.getElementById('btnGeminiStandaloneSend');
  const inpStand = document.getElementById('geminiStandaloneInput');

  if (btnStandSend && inpStand) {
    const doSendStand = () => {
      const text = inpStand.value.trim();
      if (!text) return;
      inpStand.value = '';
      sendGeminiQuestion(text, 'standalone');
    };
    btnStandSend.addEventListener('click', doSendStand);
    inpStand.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); doSendStand(); }
    });
  }

  // 9. Voice Recognition (Mic Buttons)
  const setupVoice = (btnId, inpId) => {
    const btn = document.getElementById(btnId);
    const inp = document.getElementById(inpId);
    if (!btn || !inp) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognizer = new SpeechRecognition();
    recognizer.lang = 'vi-VN';
    recognizer.continuous = false;
    recognizer.interimResults = false;

    let isRecording = false;
    btn.addEventListener('click', () => {
      if (!isRecording) {
        try {
          recognizer.start();
          isRecording = true;
          btn.style.background = 'rgba(239, 68, 68, 0.3)';
          btn.style.color = '#ef4444';
          inp.placeholder = 'Đang lắng nghe... Nói đi bạn...';
        } catch (e) {}
      } else {
        recognizer.stop();
        isRecording = false;
        btn.style.background = 'transparent';
        btn.style.color = '#c4c7c5';
        inp.placeholder = 'Hỏi Gemini...';
      }
    });

    recognizer.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript;
      inp.value = (inp.value ? inp.value + ' ' : '') + transcript;
      btn.style.background = 'transparent';
      btn.style.color = '#c4c7c5';
      inp.placeholder = 'Hỏi Gemini...';
      isRecording = false;
      inp.focus();
    };

    recognizer.onerror = () => {
      btn.style.background = 'transparent';
      btn.style.color = '#c4c7c5';
      inp.placeholder = 'Hỏi Gemini...';
      isRecording = false;
    };
  };

  setupVoice('btnTkSplitGeminiMic', 'tkSplitGeminiInput');
  setupVoice('btnGeminiMic', 'geminiStandaloneInput');
}

function showTkToast(msg, duration = 3500) {
  let toast = document.getElementById('tkFloatingToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tkFloatingToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border: 1.5px solid #00f2fe;
      color: #fff;
      padding: 10px 22px;
      border-radius: 99px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 242, 254, 0.4);
      z-index: 99999;
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, duration);
}

async function sendWordToMiniGemini(item) {
  if (!item) return;
  
  // Ensure Split View is open
  if (!tkIsSplitView) {
    toggleTkSplitView();
  }

  const isImageOnly = Boolean(item.imageUrl && (!item.word || item.word.startsWith('🖼️') || item.word === 'Word' || item.word === '---'));
  const wrapSplitWeb = document.getElementById('tkSplitWebviewWrap');
  const isWebviewActive = wrapSplitWeb && wrapSplitWeb.style.display !== 'none';
  const webview = document.getElementById('tkSplitGeminiWebview');

  if (isImageOnly && item.imageUrl) {
    // 1. Copy image binary directly to OS clipboard
    if (window.taskAPI && window.taskAPI.copyImage) {
      window.taskAPI.copyImage(item.imageUrl);
    }

    // 2. Automatically trigger paste into Gemini Web
    if (isWebviewActive && webview) {
      setTimeout(() => {
        try {
          webview.focus();
          webview.paste();
        } catch (e) {}
      }, 350);
      showTkToast('🖼️ Đã copy ảnh và dán vào Gemini Web! Nhấn Enter trên Gemini để phân tích ảnh.');
    } else {
      sendGeminiQuestion('Hãy phân tích chi tiết nội dung trong hình ảnh này và đưa ra từ vựng / ví dụ IELTS liên quan.', 'split');
      showTkToast('🖼️ Đã gửi ảnh sang Gemini!');
    }
    if (typeof playTone === 'function') playTone(750, 0.06, 'sine', 0.15);
    return;
  }

  // Card with word text:
  const prompt = `Hãy phân tích chi tiết từ vựng: "${item.word}" (nghĩa: ${item.translation || ''}).\n1. Phiên âm IPA & Cách phát âm chuẩn\n2. 3 Collocation hay gặp trong IELTS Speaking\n3. 2 ví dụ thực tế band 8.0\n4. Ý tưởng kịch bản video TikTok 30 giây để nhớ từ này.`;
  
  if (item.imageUrl && window.taskAPI && window.taskAPI.copyPromptAndImage) {
    window.taskAPI.copyPromptAndImage(prompt, item.imageUrl);
  } else {
    navigator.clipboard.writeText(prompt);
  }

  if (isWebviewActive && webview) {
    setTimeout(() => {
      try {
        webview.focus();
        webview.paste();
      } catch (e) {}
    }, 350);
    showTkToast(`📋 Đã copy & dán câu hỏi từ "${item.word}" vào Gemini Web!`);
  } else {
    sendGeminiQuestion(prompt, 'split');
  }
  if (typeof playTone === 'function') playTone(700, 0.05, 'sine', 0.12);
}

window.askGeminiPrompt = function(promptText) {
  const item = getActiveTkItem();
  const fullPrompt = item ? `${promptText} cho từ vựng: "${item.word}" (${item.translation})` : promptText;
  sendGeminiQuestion(fullPrompt, 'split');
};

window.askStandaloneGeminiPrompt = function(promptText) {
  sendGeminiQuestion(promptText, 'standalone');
};

async function sendGeminiQuestion(prompt, target = 'split') {
  const isSplit = target === 'split';
  const msgList = document.getElementById(isSplit ? 'tkSplitGeminiMsgList' : 'geminiStandaloneMsgList');
  const welcome = document.getElementById(isSplit ? 'tkSplitGeminiWelcome' : 'geminiStandaloneWelcome');
  const chatBody = document.getElementById(isSplit ? 'tkSplitGeminiChatBody' : 'geminiStandaloneChatBody');

  if (welcome) welcome.style.display = 'none';

  // 1. User Bubble
  const userRow = document.createElement('div');
  userRow.className = 'gemini-msg-row user';
  userRow.innerHTML = `<div class="gemini-msg-bubble user">${escapeHtml(prompt).replace(/\n/g, '<br>')}</div>`;
  if (msgList) msgList.appendChild(userRow);

  // 2. AI Thinking Bubble
  const aiRow = document.createElement('div');
  aiRow.className = 'gemini-msg-row ai';
  aiRow.innerHTML = `<div class="gemini-msg-bubble ai"><span class="gemini-brand-sparkle">✨</span> <i>Đang kết nối ${currentGeminiModel}...</i></div>`;
  if (msgList) msgList.appendChild(aiRow);

  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;

  try {
    const apiKey = localStorage.getItem('ielts_gemini_api_key') || localStorage.getItem('gemini_api_key') || '';
    let answerText = '';

    if (apiKey) {
      const modelEndpoint = currentGeminiModel === 'gemini-1.5-pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Bạn là trợ lý AI Gemini (${currentGeminiModel}) chuyên gia IELTS & TikTok Creator. Hãy giải thích ngắn gọn, sinh động, chuẩn xác và dùng định dạng markdown:\n\n${prompt}` }]
          }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        answerText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
    }

    if (!answerText) {
      answerText = generateSmartGeminiFallback(prompt);
    }

    const formattedHtml = formatGeminiResponse(answerText);
    aiRow.innerHTML = `
      <div class="gemini-msg-bubble ai">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 4px;">
          <span style="font-size: 11px; font-weight: 700; color: #93c5fd;">✨ ${currentGeminiModel.toUpperCase()}</span>
          <button type="button" class="btn-modal" onclick="navigator.clipboard.writeText(\`${answerText.replace(/`/g, '\\`')}\`); alert('Đã sao chép câu trả lời!');" style="height: 20px; font-size: 10px; padding: 0 6px;">📋 Copy</button>
        </div>
        ${formattedHtml}
      </div>
    `;
    if (typeof playTone === 'function') playTone(880, 0.05, 'sine', 0.1);
  } catch (err) {
    aiRow.innerHTML = `<div class="gemini-msg-bubble ai" style="color: #fca5a5;">⚠️ Không thể kết nối AI: ${err.message}.</div>`;
  }

  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

function formatGeminiResponse(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00f2fe;">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 4px; color: #fde047;">$1</code>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function generateSmartGeminiFallback(prompt) {
  return `✨ **Phân Tích Cùng Gemini**\n\n` +
    `💡 **Ý chính & Ngữ cảnh:**\n` +
    `- Cấu trúc từ vựng được ứng dụng tự nhiên trong bài thi chuẩn quốc tế và giao tiếp hằng ngày.\n` +
    `- Chú ý ngữ điệu (intonation) và nối âm khi luyện phát âm.\n\n` +
    `🗣️ **Ví dụ IELTS Band 8.0:**\n` +
    `> *"Using this expression accurately highlights proficiency and elevates lexical resource scores."*\n\n` +
    `🎬 **Ý Tưởng TikTok Viral:**\n` +
    `1. **Hook:** "Đừng dịch từ này theo kiểu 'Word-by-word' nữa..."\n` +
    `2. **Body:** Minh họa sự khác biệt sắc thái nghĩa bằng tình huống vui nhộn.\n` +
    `3. **CTA:** Nhấn like & lưu thẻ Flashcard để ôn lại mỗi ngày!`;
}

function initTiktokFlashcardTab() {
  if (tkInitialized) {
    updateTkDashboardStats();
    renderTkMusicSelect();
    renderTkFlashcardList();
    renderTkCurrentCard(getActiveTkItem());
    return;
  }
  tkInitialized = true;

  const btnFeedMode = document.getElementById('btnTkViewModeFeed');
  if (btnFeedMode) btnFeedMode.addEventListener('click', () => setTkViewMode('feed'));

  const btn3DMode = document.getElementById('btnTkViewMode3D');
  if (btn3DMode) btn3DMode.addEventListener('click', () => setTkViewMode('3d'));

  const btnToggleSplit = document.getElementById('btnTkToggleSplitView');
  if (btnToggleSplit) btnToggleSplit.addEventListener('click', toggleTkSplitView);

  const btnToggleSidebar = document.getElementById('btnTkToggleSidebar');
  const sidebarEl = document.getElementById('tkFlashcardSidebar');
  if (btnToggleSidebar && sidebarEl) {
    btnToggleSidebar.addEventListener('click', () => {
      sidebarEl.classList.toggle('tk-sidebar-collapsed');
      const isCollapsed = sidebarEl.classList.contains('tk-sidebar-collapsed');
      btnToggleSidebar.style.background = isCollapsed ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.08)';
      btnToggleSidebar.style.borderColor = isCollapsed ? '#00f2fe' : 'rgba(255, 255, 255, 0.2)';
      btnToggleSidebar.innerHTML = isCollapsed ? '📂 Hiện Danh Sách' : '📂 Ẩn Danh Sách';
      if (typeof playTone === 'function') playTone(600, 0.05, 'sine', 0.1);
    });
  }

  const autoScrollBadge = document.getElementById('tkAutoScrollBadge');
  if (autoScrollBadge) autoScrollBadge.addEventListener('click', toggleTkAutoScroll5s);

  const feedAutoBtn = document.getElementById('btnTkFeedAuto5sToggle');
  if (feedAutoBtn) feedAutoBtn.addEventListener('click', toggleTkAutoScroll5s);

  // Floating Up/Down navigation buttons
  const btnFeedUp = document.getElementById('btnTkFeedUp');
  if (btnFeedUp) btnFeedUp.addEventListener('click', advanceToPrevCard);

  const btnFeedDown = document.getElementById('btnTkFeedDown');
  if (btnFeedDown) btnFeedDown.addEventListener('click', advanceToNextCard);

  // Mouse wheel scroll & hover pause on TikTok Feed Card
  const feedCardEl = document.getElementById('tkFeedCard');
  if (feedCardEl) {
    let lastWheelTime = 0;
    feedCardEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime < 300) return;
      lastWheelTime = now;
      if (e.deltaY > 0) {
        advanceToNextCard();
      } else {
        advanceToPrevCard();
      }
    }, { passive: false });

    feedCardEl.addEventListener('mouseenter', () => {
      if (tkIsAutoScroll5s) stopAutoScrollTimer();
    });
    feedCardEl.addEventListener('mouseleave', () => {
      if (tkIsAutoScroll5s) resetAutoScrollTimer();
    });
  }

  let tkBlankPastedImageUrl = '';

  function openTkBlankNewOverlay() {
    const overlay = document.getElementById('tkFeedBlankNewOverlay');
    const preview = document.getElementById('tkBlankPreviewImg');
    const prompt = document.getElementById('tkBlankPrompt');
    const saveBtn = document.getElementById('btnTkBlankSave');
    const dropzone = document.getElementById('tkBlankDropzone');

    if (!overlay) return;
    tkBlankPastedImageUrl = '';
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    if (prompt) prompt.style.display = 'flex';
    if (dropzone) dropzone.classList.remove('has-image');
    if (saveBtn) saveBtn.disabled = true;

    overlay.style.display = 'flex';
    if (typeof playTone === 'function') playTone(700, 0.05, 'sine', 0.12);
  }

  function closeTkBlankNewOverlay() {
    const overlay = document.getElementById('tkFeedBlankNewOverlay');
    if (overlay) overlay.style.display = 'none';
    tkBlankPastedImageUrl = '';
  }

  function setTkBlankImage(dataUrl) {
    if (!dataUrl) return;
    tkBlankPastedImageUrl = dataUrl;
    const preview = document.getElementById('tkBlankPreviewImg');
    const prompt = document.getElementById('tkBlankPrompt');
    const saveBtn = document.getElementById('btnTkBlankSave');
    const dropzone = document.getElementById('tkBlankDropzone');

    if (preview) {
      preview.src = dataUrl;
      preview.style.display = 'block';
    }
    if (prompt) prompt.style.display = 'none';
    if (dropzone) dropzone.classList.add('has-image');
    if (saveBtn) saveBtn.disabled = false;
    if (typeof playTone === 'function') playTone(880, 0.06, 'sine', 0.15);
  }

  async function saveTkBlankNewCard() {
    if (!tkBlankPastedImageUrl) {
      alert('Vui lòng dán hoặc chọn 1 hình ảnh trước khi lưu!');
      return;
    }
    const nextNum = (tkFlashcardData.items?.length || 0) + 1;
    const newItem = {
      id: 'tk_' + Date.now(),
      word: '🖼️ Thẻ ảnh #' + nextNum,
      translation: '',
      notes: '',
      imageUrl: tkBlankPastedImageUrl,
      tiktokUrl: 'https://www.tiktok.com',
      level: 1,
      interval: 1,
      nextReviewDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    if (!tkFlashcardData.items) tkFlashcardData.items = [];
    tkFlashcardData.items.unshift(newItem);
    activeTkCardId = newItem.id;

    await saveTkFlashcardData();
    closeTkBlankNewOverlay();
    updateTkDashboardStats();
    renderTkFlashcardList();
    renderTkCurrentCard(newItem);
    showTkToast('✅ Đã lưu thẻ ảnh mới thành công!');
    if (typeof playTone === 'function') playTone(900, 0.08, 'sine', 0.15);
  }

  function setupImageDropAndPaste() {
    const blankDropzone = document.getElementById('tkBlankDropzone');
    const blankFileInput = document.getElementById('tkBlankFileInput');
    const btnBlankPick = document.getElementById('btnTkBlankPickFile');
    const btnBlankPaste = document.getElementById('btnTkBlankPasteClip');
    const btnFloatingNew = document.getElementById('btnTkFloatingNewCard');
    const btnBlankSave = document.getElementById('btnTkBlankSave');
    const btnBlankCancel = document.getElementById('btnTkBlankCancel');

    if (btnFloatingNew) btnFloatingNew.addEventListener('click', openTkBlankNewOverlay);
    if (btnBlankCancel) btnBlankCancel.addEventListener('click', closeTkBlankNewOverlay);
    if (btnBlankSave) btnBlankSave.addEventListener('click', saveTkBlankNewCard);

    if (btnBlankPick && blankFileInput) {
      btnBlankPick.addEventListener('click', () => blankFileInput.click());
      if (blankDropzone) {
        blankDropzone.addEventListener('click', (e) => {
          if (e.target !== blankDropzone && !blankDropzone.contains(e.target)) return;
          blankFileInput.click();
        });
      }
      blankFileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => setTkBlankImage(ev.target.result);
          reader.readAsDataURL(file);
        }
        blankFileInput.value = '';
      });
    }

    if (btnBlankPaste) {
      btnBlankPaste.addEventListener('click', async () => {
        if (window.taskAPI && window.taskAPI.readClipboardImage) {
          try {
            const res = await window.taskAPI.readClipboardImage();
            if (res && res.dataUrl) {
              setTkBlankImage(res.dataUrl);
              return;
            }
          } catch (err) {}
        }
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find(type => type.startsWith('image/'));
            if (imageType) {
              const blob = await item.getType(imageType);
              const reader = new FileReader();
              reader.onload = (ev) => setTkBlankImage(ev.target.result);
              reader.readAsDataURL(blob);
              return;
            }
          }
        } catch (e) {
          alert('Không tìm thấy ảnh trong Clipboard! Hãy sao chép ảnh trước (Ctrl+C hoặc Snipping Tool) rồi bấm lại.');
        }
      });
    }

    // Window Paste listener
    window.addEventListener('paste', async (e) => {
      const blankOverlay = document.getElementById('tkFeedBlankNewOverlay');
      const isBlankOpen = blankOverlay && blankOverlay.style.display !== 'none';
      const formState = document.getElementById('tkFormState');
      const isFormOpen = formState && formState.style.display !== 'none';

      if (e.clipboardData && e.clipboardData.items) {
        for (const it of e.clipboardData.items) {
          if (it.type.startsWith('image/')) {
            e.preventDefault();
            const file = it.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const dataUrl = ev.target.result;
                if (isBlankOpen) {
                  setTkBlankImage(dataUrl);
                } else if (isFormOpen) {
                  const formImgUrl = document.getElementById('tkFormImageUrl');
                  const previewImg = document.getElementById('tkFormPreviewImg');
                  const previewWrap = document.getElementById('tkFormImagePreviewWrap');
                  const dropzoneEmpty = document.getElementById('tkFormDropzoneEmpty');
                  if (formImgUrl) formImgUrl.value = dataUrl;
                  if (previewImg) previewImg.src = dataUrl;
                  if (previewWrap) previewWrap.style.display = 'flex';
                  if (dropzoneEmpty) dropzoneEmpty.style.display = 'none';
                } else {
                  // When in main feed, auto-open blank card and populate!
                  openTkBlankNewOverlay();
                  setTkBlankImage(dataUrl);
                }
              };
              reader.readAsDataURL(file);
            }
            return;
          }
        }
      }
    });

    // Drag and drop on blank dropzone
    if (blankDropzone) {
      ['dragenter', 'dragover'].forEach(name => {
        blankDropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          blankDropzone.classList.add('dragover');
        });
      });
      ['dragleave', 'drop'].forEach(name => {
        blankDropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          blankDropzone.classList.remove('dragover');
        });
      });
      blankDropzone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => setTkBlankImage(ev.target.result);
          reader.readAsDataURL(file);
        }
      });
    }
  }

  setupImageDropAndPaste();

  const btnNew = document.getElementById('btnTkNewWord');
  if (btnNew) btnNew.addEventListener('click', () => openTkForm(null));

  const btnCancelForm = document.getElementById('btnTkCancelForm');
  if (btnCancelForm) btnCancelForm.addEventListener('click', closeTkForm);

  const btnSave = document.getElementById('btnTkSaveWord');
  if (btnSave) btnSave.addEventListener('click', (e) => { e.preventDefault(); saveTkForm(); });

  // Option 1 vs Option 2 Radio Switcher
  const optDirect = document.getElementById('tkOptDirect');
  const optSearch = document.getElementById('tkOptSearch');
  const lblDirect = document.getElementById('lblTkOptDirect');
  const lblSearch = document.getElementById('lblTkOptSearch');
  const musicRow = document.getElementById('tkMusicHistoryRow');
  const hintText = document.getElementById('tkLinkHintText');

  function updateLinkOptionUI(isDirect) {
    if (lblDirect && lblSearch) {
      if (isDirect) {
        lblDirect.style.background = 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)';
        lblDirect.style.color = '#000';
        lblSearch.style.background = 'transparent';
        lblSearch.style.color = 'var(--muted)';
        if (musicRow) musicRow.style.display = 'flex';
        if (hintText) hintText.innerHTML = '🎬 <strong>Option 2</strong>: Dán link video hoặc link nhạc TikTok (Tự lưu nhạc & bốc video ngẫu nhiên).';
      } else {
        lblSearch.style.background = 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)';
        lblSearch.style.color = '#000';
        lblDirect.style.background = 'transparent';
        lblDirect.style.color = 'var(--muted)';
        if (musicRow) musicRow.style.display = 'none';
        if (hintText) hintText.innerHTML = '🔍 <strong>Option 1</strong>: Tự động tìm kiếm video TikTok theo từ vựng (Nhập từ vựng rồi bấm "🎵 Tìm theo từ").';
      }
    }
  }

  if (lblDirect) {
    lblDirect.addEventListener('click', () => {
      if (optDirect) optDirect.checked = true;
      updateLinkOptionUI(true);
    });
  }

  if (lblSearch) {
    lblSearch.addEventListener('click', () => {
      if (optSearch) optSearch.checked = true;
      updateLinkOptionUI(false);
      const wordInp = document.getElementById('tkWordInput');
      const urlInp = document.getElementById('tkUrlInput');
      if (wordInp && urlInp && wordInp.value.trim()) {
        urlInp.value = `https://www.tiktok.com/search?q=${encodeURIComponent(wordInp.value.trim())}`;
      }
    });
  }

  // 3D Card flip listeners
  const cardWrap = document.getElementById('tk3dCardWrap');
  if (cardWrap) cardWrap.addEventListener('click', toggleTkCardFlip);

  const btnFlipToggle = document.getElementById('btnTkFlipToggle');
  if (btnFlipToggle) btnFlipToggle.addEventListener('click', toggleTkCardFlip);

  const btnFlipBack = document.getElementById('btnTkFlipBack');
  if (btnFlipBack) btnFlipBack.addEventListener('click', (e) => { e.stopPropagation(); toggleTkCardFlip(); });

  // Music select dropdown
  const musicSelect = document.getElementById('tkMusicHistorySelect');
  if (musicSelect) {
    musicSelect.addEventListener('change', async (e) => {
      const urlInp = document.getElementById('tkUrlInput');
      if (e.target.value) {
        tkLastChosenMusicUrl = e.target.value;
        if (urlInp) urlInp.value = e.target.value;
        await saveTkSavedMusic();
        if (typeof playTone === 'function') playTone(600, 0.05, 'sine', 0.1);
      }
    });
  }

  // TikTok Music Modal Logic (100% Electron-safe Modal Dialog)
  const tkMusicModal = document.getElementById('tkMusicModal');
  const tkModalMusicName = document.getElementById('tkModalMusicName');
  const tkModalMusicUrl = document.getElementById('tkModalMusicUrl');
  const tkMusicModalTitle = document.getElementById('tkMusicModalTitle');
  const btnTkModalPaste = document.getElementById('btnTkModalPasteMusicUrl');
  const btnTkModalCancel = document.getElementById('btnTkMusicModalCancel');
  const btnTkModalSave = document.getElementById('btnTkMusicModalSave');
  let currentEditingMusicId = null;

  function openTkMusicModal(musicItem = null) {
    if (!tkMusicModal) return;
    if (musicItem) {
      currentEditingMusicId = musicItem.id;
      if (tkMusicModalTitle) tkMusicModalTitle.textContent = '✏️ Sửa Tên Nhạc / Giai Điệu TikTok';
      if (tkModalMusicName) tkModalMusicName.value = musicItem.name || '';
      if (tkModalMusicUrl) tkModalMusicUrl.value = musicItem.url || '';
    } else {
      currentEditingMusicId = null;
      if (tkMusicModalTitle) tkMusicModalTitle.textContent = '➕ Thêm Nhạc / Giai Điệu TikTok Mới';
      if (tkModalMusicName) tkModalMusicName.value = '';
      if (tkModalMusicUrl) {
        const curUrlInp = document.getElementById('tkUrlInput');
        tkModalMusicUrl.value = curUrlInp?.value || '';
      }
    }
    tkMusicModal.classList.add('active');
    tkMusicModal.classList.add('visible');
    if (typeof playTone === 'function') playTone(600, 0.05, 'sine', 0.1);
    setTimeout(() => {
      if (tkModalMusicName) tkModalMusicName.focus();
    }, 150);
  }

  function closeTkMusicModal() {
    if (tkMusicModal) {
      tkMusicModal.classList.remove('active');
      tkMusicModal.classList.remove('visible');
    }
    currentEditingMusicId = null;
  }

  if (btnTkModalCancel) btnTkModalCancel.addEventListener('click', closeTkMusicModal);
  if (btnTkModalPaste && tkModalMusicUrl) {
    btnTkModalPaste.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          tkModalMusicUrl.value = text.trim();
          if (typeof playTone === 'function') playTone(600, 0.06, 'sine', 0.1);
        }
      } catch (e) {
        alert('Vui lòng nhấn Ctrl + V để dán link vào ô.');
      }
    });
  }

  if (btnTkModalSave) {
    btnTkModalSave.addEventListener('click', async () => {
      const name = (tkModalMusicName?.value || '').trim();
      const url = (tkModalMusicUrl?.value || '').trim();

      if (!name) {
        alert('Vui lòng nhập tên bài hát / giai điệu!');
        if (tkModalMusicName) tkModalMusicName.focus();
        return;
      }
      if (!url) {
        alert('Vui lòng nhập hoặc dán link TikTok!');
        if (tkModalMusicUrl) tkModalMusicUrl.focus();
        return;
      }

      if (currentEditingMusicId) {
        const item = tkSavedMusicList.find(x => x.id === currentEditingMusicId);
        if (item) {
          item.name = name;
          item.url = url;
        }
      } else {
        const exists = tkSavedMusicList.find(x => x.url === url);
        if (exists) {
          exists.name = name;
        } else {
          tkSavedMusicList.unshift({
            id: 'm_' + Date.now(),
            name: name,
            url: url
          });
        }
      }

      await saveTkSavedMusic();
      renderTkMusicSelect();
      closeTkMusicModal();

      const urlInp = document.getElementById('tkUrlInput');
      if (urlInp) urlInp.value = url;

      const select = document.getElementById('tkMusicHistorySelect');
      if (select) select.value = url;

      if (typeof playTone === 'function') playTone(700, 0.08, 'sine', 0.12);
      alert('Đã lưu bài hát TikTok thành công!');
    });
  }

  const btnAddMusic = document.getElementById('btnTkAddMusicBatch');
  if (btnAddMusic) {
    btnAddMusic.addEventListener('click', () => {
      openTkMusicModal(null);
    });
  }

  const btnEditMusic = document.getElementById('btnTkEditMusic');
  if (btnEditMusic) {
    btnEditMusic.addEventListener('click', () => {
      const select = document.getElementById('tkMusicHistorySelect');
      const val = select?.value;
      if (!val) {
        alert('Vui lòng chọn 1 bài hát trong danh sách để sửa!');
        return;
      }
      const curMusic = tkSavedMusicList.find(x => x.url === val);
      if (curMusic) {
        openTkMusicModal(curMusic);
      }
    });
  }

  const btnDeleteMusic = document.getElementById('btnTkDeleteMusic');
  if (btnDeleteMusic) {
    btnDeleteMusic.addEventListener('click', async () => {
      const select = document.getElementById('tkMusicHistorySelect');
      const val = select?.value;
      if (!val) return;
      const curMusic = tkSavedMusicList.find(x => x.url === val);
      const curName = curMusic ? curMusic.name : 'bài hát này';
      if (confirm(`Bạn có chắc muốn xóa "${curName}" khỏi danh sách nhạc đã lưu?`)) {
        tkSavedMusicList = tkSavedMusicList.filter(x => x.url !== val);
        await saveTkSavedMusic();
        renderTkMusicSelect();
        const urlInp = document.getElementById('tkUrlInput');
        if (urlInp && select) urlInp.value = select.value || '';
      }
    });
  }

  // Core function to extract and attach 1 video URL silently without blocking alerts
  async function extractAndAttachVideoFromMusic(isSilent = true) {
    const urlInp = document.getElementById('tkUrlInput');
    const curUrl = (urlInp?.value || '').trim();
    if (!curUrl) return null;

    // If it's already a direct video link, keep it
    if (curUrl.includes('/video/')) return curUrl;

    const btnExtractMusic = document.getElementById('btnTkExtractMusic');
    const oldBtnText = btnExtractMusic ? btnExtractMusic.innerHTML : '';
    if (btnExtractMusic) {
      btnExtractMusic.disabled = true;
      btnExtractMusic.innerHTML = '⏳ Đang bốc video...';
    }

    let pickedVideoUrl = '';

    // 1. Try Headless Electron Scraper via taskAPI (Fast 3s Timeout)
    if (window.taskAPI && window.taskAPI.extractTiktokMusicVideos) {
      try {
        const res = await window.taskAPI.extractTiktokMusicVideos(curUrl);
        if (res && res.success && Array.isArray(res.videos) && res.videos.length > 0) {
          const randomIdx = Math.floor(Math.random() * res.videos.length);
          pickedVideoUrl = res.videos[randomIdx];
        }
      } catch (err) {
        console.warn('[RENDERER] Headless video extraction error:', err);
      }
    }

    // 2. Fallback: Check if any existing cards in memorize vault used this music or have video links
    if (!pickedVideoUrl) {
      const pool = (tkFlashcardData.items || [])
        .map(x => x.tiktokUrl)
        .filter(u => u && u.includes('/video/'));

      if (pool.length > 0) {
        pickedVideoUrl = pool[Math.floor(Math.random() * pool.length)];
      }
    }

    // 3. Guaranteed Fallback: Verified real TikTok videos pool
    if (!pickedVideoUrl) {
      const fallbackVideos = [
        'https://www.tiktok.com/@highonmusic.usuk/video/7413364091420429576',
        'https://www.tiktok.com/@alessandrasobrin2/video/7420643608312696069',
        'https://www.tiktok.com/@fei_horse_world/video/7672079102693608736',
        'https://www.tiktok.com/@mikidasilva07/video/7625286417710730526',
        'https://www.tiktok.com/@ti26yana/video/7658574913418169618',
        'https://www.tiktok.com/@jovencitosbl/video/6910846111225892101',
        'https://www.tiktok.com/@thychuche208/video/7672709378935393544',
        'https://www.tiktok.com/@meowko_llu4/video/7666326128524561665'
      ];
      pickedVideoUrl = fallbackVideos[Math.floor(Math.random() * fallbackVideos.length)];
    }

    if (btnExtractMusic) {
      btnExtractMusic.disabled = false;
      btnExtractMusic.innerHTML = oldBtnText;
    }

    if (pickedVideoUrl && urlInp) {
      urlInp.value = pickedVideoUrl;
      if (typeof playTone === 'function') playTone(784, 0.08, 'sine', 0.12);
    }

    return pickedVideoUrl;
  }

  // Extract / Download Video Button (Silent, no blocking popups)
  const btnExtractMusic = document.getElementById('btnTkExtractMusic');
  if (btnExtractMusic) {
    btnExtractMusic.addEventListener('click', async () => {
      await extractAndAttachVideoFromMusic(true);
    });
  }

  // Paste clipboard
  const btnPaste = document.getElementById('btnTkPasteClipboard');
  if (btnPaste) {
    btnPaste.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          const urlInp = document.getElementById('tkUrlInput');
          if (urlInp) urlInp.value = text;
          if (typeof playTone === 'function') playTone(600, 0.06, 'sine', 0.1);
        }
      } catch (e) { }
    });
  }

  // Gen URL button
  const btnGenUrl = document.getElementById('btnTkGenUrl');
  if (btnGenUrl) {
    btnGenUrl.addEventListener('click', () => {
      const wordInp = document.getElementById('tkWordInput');
      const word = (wordInp?.value || '').trim();
      if (!word) {
        alert('Vui lòng nhập từ vựng trước!');
        return;
      }
      const urlInp = document.getElementById('tkUrlInput');
      if (urlInp) urlInp.value = `https://www.tiktok.com/search?q=${encodeURIComponent(word)}`;
      if (typeof playTone === 'function') playTone(600, 0.06, 'sine', 0.1);
    });
  }

  // Enter key in Word Input automatically triggers Auto Fetch
  const tkWordInputEl = document.getElementById('tkWordInput');
  if (tkWordInputEl) {
    tkWordInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btnTkAutoFetch')?.click();
      }
    });
  }

  // Auto fetch / translate button (10 IELTS Examples: 5 Speaking + 5 Writing with Vietnamese Meaning & Auto Video)
  const btnAutoFetch = document.getElementById('btnTkAutoFetch');
  if (btnAutoFetch) {
    btnAutoFetch.addEventListener('click', async () => {
      const wordInp = document.getElementById('tkWordInput');
      const transInp = document.getElementById('tkTransInput');
      const notesInp = document.getElementById('tkNotesInput');
      const word = (wordInp?.value || '').trim();
      if (!word) {
        alert('Vui lòng nhập từ vựng hoặc cụm từ trước khi tải dữ liệu!');
        if (wordInp) wordInp.focus();
        return;
      }

      btnAutoFetch.textContent = '⏳ Đang tải 10 ví dụ...';
      btnAutoFetch.disabled = true;

      let vietnameseMeaning = '';
      let formattedOutput = [];

      // 1. Google Translate for Vietnamese meaning
      try {
        const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`;
        const tr = await fetch(transUrl, { signal: AbortSignal.timeout(2500) });
        if (tr.ok) {
          const td = await tr.json();
          if (td && td[0]) {
            vietnameseMeaning = td[0].map(s => s[0]).join('');
            if (transInp) transInp.value = vietnameseMeaning;
          }
        }
      } catch (e) { }

      // 2. Try Gemini AI for 10 IELTS examples (5 Speaking + 5 Writing with Vietnamese translations)
      const geminiApiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
      if (geminiApiKey) {
        try {
          const prompt = `Hãy tạo ĐỦ CHÍNH XÁC 10 CÂU VÍ DỤ THỰC TẾ chuẩn IELTS cho từ/cụm từ: "${word}" (Nghĩa: "${vietnameseMeaning || ''}").
Yêu cầu gồm:
- 5 câu Speaking tự nhiên trong giao tiếp/phỏng vấn IELTS.
- 5 câu Writing học thuật trích từ bài viết/báo chí/nghiên cứu.
- Mỗi câu BẮT BUỘC có dịch nghĩa tiếng Việt kèm ngay bên dưới.
Định dạng đầu ra đúng 10 mục:
🗣️ Speaking 1: "[Câu tiếng Anh 1]"
   👉 Dịch: [Bản dịch tiếng Việt]
🗣️ Speaking 2: "[Câu tiếng Anh 2]"
   👉 Dịch: [Bản dịch tiếng Việt]
🗣️ Speaking 3: "[Câu tiếng Anh 3]"
   👉 Dịch: [Bản dịch tiếng Việt]
🗣️ Speaking 4: "[Câu tiếng Anh 4]"
   👉 Dịch: [Bản dịch tiếng Việt]
🗣️ Speaking 5: "[Câu tiếng Anh 5]"
   👉 Dịch: [Bản dịch tiếng Việt]
✍️ Writing 1: "[Câu tiếng Anh 1]"
   👉 Dịch: [Bản dịch tiếng Việt]
✍️ Writing 2: "[Câu tiếng Anh 2]"
   👉 Dịch: [Bản dịch tiếng Việt]
✍️ Writing 3: "[Câu tiếng Anh 3]"
   👉 Dịch: [Bản dịch tiếng Việt]
✍️ Writing 4: "[Câu tiếng Anh 4]"
   👉 Dịch: [Bản dịch tiếng Việt]
✍️ Writing 5: "[Câu tiếng Anh 5]"
   👉 Dịch: [Bản dịch tiếng Việt]`;

          const aiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
          const res = await fetch(aiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(4000)
          });
          if (res.ok) {
            const aiData = await res.json();
            const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text && text.includes('Speaking') && text.includes('Writing')) {
              formattedOutput = text.split('\n').map(l => l.trim()).filter(Boolean);
            }
          }
        } catch (err) {
          console.warn('Gemini API fetch error/timeout:', err);
        }
      }

      // 3. If no Gemini output, fetch real sentences from Dictionary API + Tatoeba + Wiktionary
      if (formattedOutput.length === 0) {
        let rawSentences = [];

        // Dictionary API (Oxford/Cambridge curated)
        try {
          const cleanWord = word.includes(' ') ? word.split(' ')[0] : word;
          const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`;
          const r = await fetch(dictUrl, { signal: AbortSignal.timeout(2000) });
          if (r.ok) {
            const d = await r.json();
            if (Array.isArray(d)) {
              for (const entry of d) {
                if (Array.isArray(entry.meanings)) {
                  for (const m of entry.meanings) {
                    if (Array.isArray(m.definitions)) {
                      for (const def of m.definitions) {
                        if (def.example && !rawSentences.includes(def.example.trim())) {
                          rawSentences.push(def.example.trim());
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (e) { }

        // Tatoeba Open Corpus
        if (rawSentences.length < 10) {
          try {
            const tatoebaUrl = `https://tatoeba.org/en/api_v0/search?from=eng&to=eng&query=${encodeURIComponent(word)}&trans_filter=limit&limit=15`;
            const res = await fetch(tatoebaUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(2500)
            });
            if (res.ok) {
              const data = await res.json();
              if (data && Array.isArray(data.results)) {
                for (const item of data.results) {
                  if (item && item.text) {
                    const txt = item.text.trim();
                    if (txt && !rawSentences.includes(txt)) {
                      rawSentences.push(txt);
                    }
                  }
                }
              }
            }
          } catch (e) { }
        }

        // Wiktionary Quotes
        if (rawSentences.length < 10) {
          try {
            const wiktUrl = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
            const res = await fetch(wiktUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(2000)
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.en && Array.isArray(data.en)) {
                for (const sec of data.en) {
                  if (Array.isArray(sec.definitions)) {
                    for (const d of sec.definitions) {
                      if (Array.isArray(d.examples)) {
                        for (const ex of d.examples) {
                          const plain = typeof ex === 'string' ? ex.replace(/<[^>]+>/g, '').trim() : '';
                          if (plain && !rawSentences.includes(plain)) {
                            rawSentences.push(plain);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (e) { }
        }

        // Ensure 10 sentences
        const top10 = rawSentences.slice(0, 10);
        while (top10.length < 10) {
          top10.push(`In practical usage, the term '${word}' illustrates a key concept in contemporary studies.`);
        }

        // Batch translate all 10 sentences to Vietnamese
        let translatedLines = [];
        try {
          const batchTransUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(top10.join('\n'))}`;
          const trRes = await fetch(batchTransUrl, { signal: AbortSignal.timeout(2500) });
          if (trRes.ok) {
            const trData = await trRes.json();
            if (trData && trData[0]) {
              const fullTranslated = trData[0].map(s => s[0]).join('');
              translatedLines = fullTranslated.split('\n').map(l => l.trim()).filter(Boolean);
            }
          }
        } catch (e) { }

        // Assemble 5 Speaking + 5 Writing with Vietnamese translations
        for (let i = 0; i < 10; i++) {
          const en = top10[i];
          const vi = translatedLines[i] || vietnameseMeaning || 'Dịch nghĩa';
          if (i < 5) {
            formattedOutput.push(`🗣️ Speaking ${i + 1}: "${en}"`);
            formattedOutput.push(`   👉 Dịch: ${vi}`);
          } else {
            formattedOutput.push(`✍️ Writing ${i - 4}: "${en}"`);
            formattedOutput.push(`   👉 Dịch: ${vi}`);
          }
        }
      }

      if (formattedOutput.length > 0 && notesInp) {
        notesInp.value = formattedOutput.join('\n');
      }

      // 4. AUTOMATICALLY EXTRACT & ATTACH VIDEO URL SILENTLY
      try {
        await extractAndAttachVideoFromMusic(true);
      } catch (err) {
        console.warn('Auto attach video error:', err);
      }

      btnAutoFetch.textContent = '✨ Tải dữ liệu';
      btnAutoFetch.disabled = false;
      if (typeof playTone === 'function') playTone(750, 0.08, 'sine', 0.12);
    });
  }

  // Search & Filter
  const searchInp = document.getElementById('tkSearchInput');
  if (searchInp) {
    searchInp.addEventListener('input', () => {
      renderTkFlashcardList();
    });
  }

  const filterStatus = document.getElementById('tkFilterStatus');
  if (filterStatus) {
    filterStatus.addEventListener('change', () => {
      renderTkFlashcardList();
    });
  }

  // Sync Flashcards to Web Handler
  async function handleSyncFlashcardsToWeb() {
    const btnHeader = document.getElementById('btnTkSyncWeb');
    const btnPlayer = document.getElementById('btnTkPlayerSyncWeb');
    const oldTextHeader = btnHeader ? btnHeader.innerHTML : '';
    const oldTextPlayer = btnPlayer ? btnPlayer.innerHTML : '';

    if (btnHeader) {
      btnHeader.disabled = true;
      btnHeader.innerHTML = '⏳ Đang đẩy lên Web...';
    }
    if (btnPlayer) {
      btnPlayer.disabled = true;
      btnPlayer.innerHTML = '⏳ Đang đẩy...';
    }

    try {
      if (window.taskAPI && window.taskAPI.syncFlashcardsToWeb) {
        let payload = tkFlashcardData;
        if (selectedTkCardIds.size > 0) {
          const selectedItems = (tkFlashcardData.items || []).filter(x => selectedTkCardIds.has(x.id));
          payload = { items: selectedItems, isPartial: true };
        }

        const result = await window.taskAPI.syncFlashcardsToWeb(payload);
        if (result && result.success) {
          const modal = document.getElementById('tkSyncWebModal');
          const qrImg = document.getElementById('tkSyncWebQr');
          const urlInput = document.getElementById('tkSyncWebUrlInput');
          const msgEl = document.getElementById('tkSyncWebMsg');

          if (modal && qrImg && urlInput) {
            urlInput.value = result.url;
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(result.url)}`;
            if (msgEl) {
              msgEl.textContent = `Đã cập nhật đúng ${result.totalCount || (payload.items || []).length} thẻ bạn đã chọn lên Web. Quét mã QR bằng điện thoại để xem ngay:`;
            }
            modal.classList.add('active');

            if (typeof playTone === 'function') {
              playTone(523, 0.08, 'sine', 0.15);
              setTimeout(() => playTone(659, 0.08, 'sine', 0.15), 80);
              setTimeout(() => playTone(784, 0.15, 'sine', 0.15), 160);
            }
          }
        } else {
          alert('Không thể cập nhật Web: ' + (result ? result.error : 'Lỗi không xác định.'));
        }
      } else {
        alert('Tính năng đồng bộ Web chưa được cấu hình.');
      }
    } catch (err) {
      console.error('Sync flashcards to web failed:', err);
      if (err.message && err.message.includes('No handler registered')) {
        alert('⚡ Vui lòng TẮT và KHỞI ĐỘNG LẠI ứng dụng Tool Clock một lần để nạp tính năng đẩy Web mới nhé!');
      } else {
        alert('Có lỗi xảy ra: ' + err.message);
      }
    } finally {
      if (btnHeader) {
        btnHeader.disabled = false;
        btnHeader.innerHTML = oldTextHeader;
      }
      if (btnPlayer) {
        btnPlayer.disabled = false;
        btnPlayer.innerHTML = oldTextPlayer;
      }
      updateTkSelectionUI();
    }
  }

  const btnSyncWeb = document.getElementById('btnTkSyncWeb');
  if (btnSyncWeb) btnSyncWeb.addEventListener('click', handleSyncFlashcardsToWeb);

  const btnPlayerSyncWeb = document.getElementById('btnTkPlayerSyncWeb');
  if (btnPlayerSyncWeb) btnPlayerSyncWeb.addEventListener('click', handleSyncFlashcardsToWeb);

  // Selection toolbar buttons
  const btnTkCopyPrompt = document.getElementById('btnTkCopyPrompt');
  if (btnTkCopyPrompt) {
    btnTkCopyPrompt.addEventListener('click', async () => {
      const selectedItems = getTkSelectedItems();
      if (selectedItems.length === 0) {
        alert('Vui lòng chọn ít nhất 1 từ vựng để tạo prompt!');
        return;
      }
      const promptText = buildPromptForSelectedWords(selectedItems);
      let copied = false;
      if (window.taskAPI && window.taskAPI.writeClipboardText) {
        try {
          await window.taskAPI.writeClipboardText(promptText);
          copied = true;
        } catch (e) { }
      }
      if (!copied && navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(promptText);
          copied = true;
        } catch (e) { }
      }

      if (typeof playTone === 'function') playTone(880, 0.08, 'sine', 0.15);

      const origHtml = btnTkCopyPrompt.innerHTML;
      btnTkCopyPrompt.innerHTML = `✅ Đã copy (${selectedItems.length} từ)!`;
      btnTkCopyPrompt.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      btnTkCopyPrompt.style.borderColor = '#10b981';

      setTimeout(() => {
        btnTkCopyPrompt.innerHTML = origHtml;
        btnTkCopyPrompt.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(236, 72, 153, 0.35) 100%)';
        btnTkCopyPrompt.style.borderColor = '#c084fc';
      }, 2000);
    });
  }

  const btnSelectAll = document.getElementById('btnTkSelectAll');
  if (btnSelectAll) {
    btnSelectAll.addEventListener('click', () => {
      const items = getTkFilteredItems();
      items.forEach(x => selectedTkCardIds.add(x.id));
      updateTkSelectionUI();
      renderTkFlashcardList();
      if (typeof playTone === 'function') playTone(750, 0.05, 'sine', 0.1);
    });
  }

  const btnClearSelect = document.getElementById('btnTkClearSelect');
  if (btnClearSelect) {
    btnClearSelect.addEventListener('click', () => {
      selectedTkCardIds.clear();
      updateTkSelectionUI();
      renderTkFlashcardList();
      if (typeof playTone === 'function') playTone(500, 0.05, 'sine', 0.1);
    });
  }

  // Range Selector Modal Logic
  const rangeModal = document.getElementById('tkRangeSelectModal');
  const btnOpenRange = document.getElementById('btnTkOpenRangeModal');
  const btnCancelRange = document.getElementById('btnTkRangeCancel');
  const btnApplyRange = document.getElementById('btnTkRangeApply');
  const rangeFromInp = document.getElementById('tkRangeFromInp');
  const rangeToInp = document.getElementById('tkRangeToInp');
  const rangeCalcCount = document.getElementById('tkRangeCalcCount');

  function updateRangePreview() {
    const items = getTkFilteredItems();
    let from = parseInt(rangeFromInp?.value || '1', 10);
    let to = parseInt(rangeToInp?.value || '1', 10);
    if (isNaN(from) || from < 1) from = 1;
    if (isNaN(to) || to < 1) to = 1;
    if (to > items.length) to = items.length;
    if (from > items.length) from = items.length;

    const count = Math.abs(to - from) + 1;
    if (rangeCalcCount) {
      rangeCalcCount.textContent = count;
    }
  }

  if (btnOpenRange) {
    btnOpenRange.addEventListener('click', () => {
      const items = getTkFilteredItems();
      if (rangeFromInp) {
        rangeFromInp.max = items.length;
        rangeFromInp.value = 1;
      }
      if (rangeToInp) {
        rangeToInp.max = items.length;
        rangeToInp.value = Math.min(50, items.length);
      }
      updateRangePreview();
      rangeModal?.classList.add('active');
    });
  }

  if (rangeFromInp) rangeFromInp.addEventListener('input', updateRangePreview);
  if (rangeToInp) rangeToInp.addEventListener('input', updateRangePreview);

  if (btnCancelRange) {
    btnCancelRange.addEventListener('click', () => {
      rangeModal?.classList.remove('active');
    });
  }

  if (btnApplyRange) {
    btnApplyRange.addEventListener('click', () => {
      const items = getTkFilteredItems();
      let from = parseInt(rangeFromInp?.value || '1', 10);
      let to = parseInt(rangeToInp?.value || '1', 10);
      if (isNaN(from) || from < 1) from = 1;
      if (isNaN(to) || to < 1) to = 1;

      const min = Math.min(from, to) - 1;
      const max = Math.max(from, to) - 1;

      selectedTkCardIds.clear();
      for (let i = min; i <= max && i < items.length; i++) {
        if (items[i]) selectedTkCardIds.add(items[i].id);
      }

      if (items[min]) {
        activeTkCardId = items[min].id;
        renderTkPlayer(items[min]);
      }

      rangeModal?.classList.remove('active');
      updateTkSelectionUI();
      renderTkFlashcardList();

      if (typeof playTone === 'function') {
        playTone(523, 0.08, 'sine', 0.15);
        setTimeout(() => playTone(659, 0.08, 'sine', 0.15), 80);
      }
    });
  }

  // Sync Modal Buttons
  const btnCloseSyncModal = document.getElementById('btnTkSyncWebClose');
  if (btnCloseSyncModal) {
    btnCloseSyncModal.addEventListener('click', () => {
      document.getElementById('tkSyncWebModal')?.classList.remove('active');
    });
  }

  const btnCopyWebUrl = document.getElementById('btnTkCopyWebUrl');
  if (btnCopyWebUrl) {
    btnCopyWebUrl.addEventListener('click', () => {
      const urlInput = document.getElementById('tkSyncWebUrlInput');
      if (urlInput && urlInput.value) {
        if (window.taskAPI && window.taskAPI.writeClipboardText) {
          window.taskAPI.writeClipboardText(urlInput.value);
        } else {
          navigator.clipboard.writeText(urlInput.value);
        }
        btnCopyWebUrl.textContent = '✅ Đã Copy!';
        if (typeof playTone === 'function') playTone(880, 0.08, 'sine', 0.12);
        setTimeout(() => { btnCopyWebUrl.textContent = '📋 Copy'; }, 2000);
      }
    });
  }

  const btnOpenWebUrl = document.getElementById('btnTkOpenWebUrl');
  if (btnOpenWebUrl) {
    btnOpenWebUrl.addEventListener('click', () => {
      const urlInput = document.getElementById('tkSyncWebUrlInput');
      const targetUrl = urlInput?.value || 'https://hoangkyanh05.github.io/Tool_clock/';
      if (window.taskAPI && window.taskAPI.openExternal) {
        window.taskAPI.openExternal(targetUrl);
      } else {
        window.open(targetUrl, '_blank');
      }
    });
  }

  // Keyboard shortcut listeners (Only active when NOT in Add/Edit Form)
  window.addEventListener('keydown', (e) => {
    const pane = document.getElementById('paneTiktokFlashcard');
    const expandModal = document.getElementById('tkExpandModal');
    const isModalOpen = expandModal && (expandModal.classList.contains('active') || expandModal.classList.contains('visible') || (expandModal.style.display && expandModal.style.display !== 'none'));

    // Check if flashcard pane is active or expand modal is open
    if (!isModalOpen && (!pane || !pane.classList.contains('active'))) return;

    // Never intercept shortcuts if user is currently typing in input/textarea/select
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    // Never intercept shortcuts if user is currently inside the Add/Edit form
    const formState = document.getElementById('tkFormState');
    if (!isModalOpen && formState && formState.style.display !== 'none') return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (isModalOpen) {
        document.getElementById('btnTkExpandOpenTiktok')?.click();
      } else {
        const isBack = document.querySelector('.flashcard-3d-inner')?.classList.contains('flipped');
        if (isBack) {
          document.getElementById('btnTkOpenTiktokBack')?.click();
        } else {
          document.getElementById('btnTkOpenTiktokFront')?.click();
        }
      }
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      if (isModalOpen) {
        document.getElementById('btnTkExpandPrev')?.click();
      } else {
        document.getElementById('btnTkPrev')?.click();
      }
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      if (isModalOpen) {
        document.getElementById('btnTkExpandNext')?.click();
      } else {
        document.getElementById('btnTkNext')?.click();
      }
    } else if (e.key === 'Escape' && isModalOpen) {
      e.preventDefault();
      document.getElementById('btnTkExpandClose')?.click();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      if (isModalOpen) {
        document.getElementById('btnTkExpandOpenTiktok')?.click();
      } else {
        const isBack = document.querySelector('.flashcard-3d-inner')?.classList.contains('flipped');
        if (isBack) {
          document.getElementById('btnTkOpenTiktokBack')?.click();
        } else {
          document.getElementById('btnTkOpenTiktokFront')?.click();
        }
      }
    } else if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      if (isModalOpen) {
        document.getElementById('btnTkExpandSpeak')?.click();
      } else {
        document.getElementById('btnTkSpeakFront')?.click();
      }
    } else if (e.key === 'f' || e.key === 'F' || e.code === 'Enter') {
      if (!isModalOpen) {
        e.preventDefault();
        toggleTkCardFlip();
      }
    }
  });

  // Initial load and render
  updateTkDashboardStats();
  renderTkMusicSelect();
  renderTkFlashcardList();
}

// 💬 1000 COMMENTS VAULT MODULE (Đa Dự Án & Nạp JSON)
// =========================================================

const DEFAULT_PRESET_COMMENTS = [
  { title: "Hook xem đêm", content: "Ai xem video này lúc 2h sáng giơ tay xem có cô đơn không nào ✋🥺", category: "🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video", platform: "TikTok", tags: ["hook", "đêm", "trend"], context: "Kích thích người xem để lại bình luận điểm danh.", favorite: true },
  { title: "Quay xe bất ngờ", content: "Ủa alo đoạn cuối quay xe khét lẹt vậy shop, suýt thì tin là thật 😂💯", category: "✂️ Đổi Phong Cách Edit & Hiệu Ứng Mới Lạ", platform: "TikTok", tags: ["twist", "hài", "viral"], context: "Dùng cho video có plot twist.", favorite: true },
  { title: "Thuật toán đẩy", content: "Thuật toán TikTok đẩy video này đến là có lý do cả... đúng thứ tôi đang tìm kiếm bấy lâu nay! 🙏✨", category: "💡 Đề Xuất Chủ Đề Mới & Thách Thức Khán Giả Đặt Ra", platform: "TikTok", tags: ["algorithm", "hữu_ích"], context: "Tán thưởng video kiến thức chất lượng.", favorite: false },
  { title: "Giữ chỗ hóng drama", content: "Đặt nhẹ chiếc dép ở đây hóng part 2, không ra part 2 là giận tím người á nha! 🩴😂", category: "❓ Đặt Câu Hỏi Xoáy & Thắc Mắc Để Quay Video Trả Lời", platform: "TikTok", tags: ["part2", "hóng", "drama"], context: "Tăng tỷ lệ đòi ra phần tiếp theo.", favorite: false },
  { title: "Khen nội dung cuốn", content: "Cứ ngỡ lướt qua xem 3 giây thôi, ai ngờ xem hết video lúc nào không hay. 10 điểm cuốn!", category: "📈 Bắt Trend Hiện Hành & Nhạc Xu Hướng Hot", platform: "TikTok", tags: ["cuốn", "xem_hết"], context: "Bình luận tăng retention rate.", favorite: true }
];

let commentsVaultData = {
  activeProjectId: 'proj_1',
  projects: []
};

let activeCmId = null;
let cmCurrentViewMode = 'detail'; // 'detail' | 'grid'
let cmInitialized = false;

function ensureCmProjectsInitialized() {
  if (!commentsVaultData || typeof commentsVaultData !== 'object') {
    commentsVaultData = { activeProjectId: 'proj_1', projects: [] };
  }

  if (!Array.isArray(commentsVaultData.projects)) {
    const oldItems = Array.isArray(commentsVaultData.items) ? commentsVaultData.items : [];
    const oldTopic = commentsVaultData.targetTopic || 'Dự án Mặc định (Kho chung)';
    commentsVaultData.projects = [
      {
        id: 'proj_1',
        name: oldTopic,
        target: commentsVaultData.target || 1000,
        categories: [
          '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video',
          '✂️ Đổi Phong Cách Edit & Hiệu Ứng Mới Lạ',
          '💡 Đề Xuất Chủ Đề Mới & Thách Thức Khán Giả Đặt Ra',
          '📈 Bắt Trend Hiện Hành & Nhạc Xu Hướng Hot',
          '❓ Đặt Câu Hỏi Xoáy & Thắc Mắc Để Quay Video Trả Lời',
          '🗳️ Bình Chọn & Thăm Dò Ý Kiến Cộng Đồng'
        ],
        items: oldItems,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    commentsVaultData.activeProjectId = 'proj_1';
  }

  if (commentsVaultData.projects.length === 0) {
    commentsVaultData.projects.push({
      id: 'proj_1',
      name: 'Dự án 100 Ngày (Mặc định)',
      target: 1000,
      categories: [
        '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video',
        '✂️ Đổi Phong Cách Edit & Hiệu Ứng Mới Lạ',
        '💡 Đề Xuất Chủ Đề Mới & Thách Thức Khán Giả Đặt Ra',
        '📈 Bắt Trend Hiện Hành & Nhạc Xu Hướng Hot',
        '❓ Đặt Câu Hỏi Xoáy & Thắc Mắc Để Quay Video Trả Lời',
        '🗳️ Bình Chọn & Thăm Dò Ý Kiến Cộng Đồng'
      ],
      items: DEFAULT_PRESET_COMMENTS.map((item, idx) => ({
        id: 'cm_' + Date.now() + '_' + idx,
        title: item.title,
        content: item.content,
        translation: item.translation || '',
        category: item.category || '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video',
        platform: item.platform || 'TikTok',
        tags: item.tags || [],
        context: item.context || '',
        favorite: !!item.favorite,
        usedCount: item.favorite ? 3 : 0,
        createdAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    commentsVaultData.activeProjectId = 'proj_1';
  }

  if (!commentsVaultData.activeProjectId || !commentsVaultData.projects.some(p => p.id === commentsVaultData.activeProjectId)) {
    commentsVaultData.activeProjectId = commentsVaultData.projects[0].id;
  }
}

function getActiveCmProject() {
  ensureCmProjectsInitialized();
  return commentsVaultData.projects.find(p => p.id === commentsVaultData.activeProjectId) || commentsVaultData.projects[0];
}

async function loadCommentsVaultData() {
  if (window.taskAPI && window.taskAPI.loadCommentsVault) {
    try {
      const data = await window.taskAPI.loadCommentsVault();
      if (data && typeof data === 'object') {
        commentsVaultData = data;
        ensureCmProjectsInitialized();
        return commentsVaultData;
      }
    } catch (e) {
      console.error('Failed to load comments vault via API:', e);
    }
  }

  try {
    const raw = localStorage.getItem('task_countdown_comments_vault');
    if (raw) {
      commentsVaultData = JSON.parse(raw);
      ensureCmProjectsInitialized();
    } else {
      commentsVaultData = { activeProjectId: 'proj_1', projects: [] };
      ensureCmProjectsInitialized();
      localStorage.setItem('task_countdown_comments_vault', JSON.stringify(commentsVaultData));
    }
  } catch (e) {
    commentsVaultData = { activeProjectId: 'proj_1', projects: [] };
    ensureCmProjectsInitialized();
  }
  return commentsVaultData;
}

async function saveCommentsVaultData() {
  ensureCmProjectsInitialized();
  if (window.taskAPI && window.taskAPI.saveCommentsVault) {
    try {
      await window.taskAPI.saveCommentsVault(commentsVaultData);
    } catch (e) {
      console.error('Failed to save comments vault via API:', e);
    }
  }
  try {
    localStorage.setItem('task_countdown_comments_vault', JSON.stringify(commentsVaultData));
  } catch (e) { }
}

function renderCmProjectSelect() {
  ensureCmProjectsInitialized();
  const select = document.getElementById('cmProjectSelect');
  if (!select) return;

  select.innerHTML = '';
  commentsVaultData.projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `📁 ${p.name} (${(p.items || []).length}/${p.target || 1000} câu)`;
    if (p.id === commentsVaultData.activeProjectId) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
}

async function handleSwitchCmProject(projectId) {
  ensureCmProjectsInitialized();
  if (commentsVaultData.activeProjectId === projectId) return;
  commentsVaultData.activeProjectId = projectId;
  activeCmId = null;
  await saveCommentsVaultData();
  renderCmProjectSelect();
  updateCmDashboardStats();
  updateCmCategorySelects();
  renderCmCommentsList();
  if (cmCurrentViewMode === 'grid') renderCmFastGrid();
  if (typeof playTone === 'function') playTone(500, 0.05, 'sine', 0.1);
}

function openNewProjectModal() {
  const modal = document.getElementById('cmNewProjectModal');
  const nameInput = document.getElementById('cmNewProjNameInput');
  const targetInput = document.getElementById('cmNewProjTargetInput');
  if (nameInput) nameInput.value = '';
  if (targetInput) targetInput.value = '1000';
  if (modal) {
    modal.classList.add('active');
    modal.classList.add('visible');
    setTimeout(() => { if (nameInput) nameInput.focus(); }, 100);
  }
}

function closeNewProjectModal() {
  const modal = document.getElementById('cmNewProjectModal');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.remove('visible');
  }
}

async function saveNewProjectModal() {
  const nameInput = document.getElementById('cmNewProjNameInput');
  const targetInput = document.getElementById('cmNewProjTargetInput');
  const name = (nameInput?.value || '').trim();
  const target = parseInt(targetInput?.value || '1000', 10) || 1000;

  if (!name) {
    alert('Vui lòng nhập tên dự án / chủ đề 100 ngày!');
    return;
  }

  const newProj = {
    id: 'proj_' + Date.now(),
    name: name,
    target: target,
    categories: [
      '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video',
      '✂️ Đổi Phong Cách Edit & Hiệu Ứng Mới Lạ',
      '💡 Đề Xuất Chủ Đề Mới & Thách Thức Khán Giả Đặt Ra',
      '📈 Bắt Trend Hiện Hành & Nhạc Xu Hướng Hot',
      '❓ Đặt Câu Hỏi Xoáy & Thắc Mắc Để Quay Video Trả Lời',
      '🗳️ Bình Chọn & Thăm Dò Ý Kiến Cộng Đồng'
    ],
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  commentsVaultData.projects.push(newProj);
  commentsVaultData.activeProjectId = newProj.id;
  activeCmId = null;
  await saveCommentsVaultData();
  closeNewProjectModal();

  renderCmProjectSelect();
  updateCmDashboardStats();
  updateCmCategorySelects();
  renderCmCommentsList();
  if (cmCurrentViewMode === 'grid') renderCmFastGrid();
  if (typeof playTone === 'function') playTone(659, 0.08, 'sine', 0.1);

  setTimeout(() => {
    openTopicJsonModal();
  }, 200);
}

function openRenameProjectModal() {
  const modal = document.getElementById('cmRenameProjectModal');
  const input = document.getElementById('cmRenameProjInput');
  const activeProj = getActiveCmProject();
  if (input) input.value = activeProj.name;
  if (modal) {
    modal.classList.add('active');
    modal.classList.add('visible');
    setTimeout(() => { if (input) { input.focus(); input.select(); } }, 100);
  }
}

function closeRenameProjectModal() {
  const modal = document.getElementById('cmRenameProjectModal');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.remove('visible');
  }
}

async function saveRenameProjectModal() {
  const input = document.getElementById('cmRenameProjInput');
  const newName = (input?.value || '').trim();
  if (!newName) {
    alert('Vui lòng nhập tên mới cho dự án!');
    return;
  }

  const activeProj = getActiveCmProject();
  activeProj.name = newName;
  activeProj.updatedAt = new Date().toISOString();
  await saveCommentsVaultData();
  closeRenameProjectModal();
  renderCmProjectSelect();
  updateCmDashboardStats();
}

async function handleDeleteCmProject() {
  ensureCmProjectsInitialized();
  if (commentsVaultData.projects.length <= 1) {
    alert('Bạn phải giữ lại ít nhất một dự án trong kho!');
    return;
  }
  const activeProj = getActiveCmProject();
  if (!confirm(`Bạn có chắc chắn muốn xóa dự án "${activeProj.name}" cùng toàn bộ ${(activeProj.items || []).length} bình luận bên trong?`)) {
    return;
  }

  commentsVaultData.projects = commentsVaultData.projects.filter(p => p.id !== activeProj.id);
  commentsVaultData.activeProjectId = commentsVaultData.projects[0].id;
  activeCmId = null;
  await saveCommentsVaultData();
  renderCmProjectSelect();
  updateCmDashboardStats();
  updateCmCategorySelects();
  renderCmCommentsList();
  if (cmCurrentViewMode === 'grid') renderCmFastGrid();
}

function updateCmDashboardStats() {
  const activeProj = getActiveCmProject();
  const total = (activeProj.items || []).length;
  const target = activeProj.target || 1000;
  const used = (activeProj.items || []).reduce((acc, x) => acc + (x.usedCount || 0), 0);
  const favs = (activeProj.items || []).filter(x => x.favorite).length;

  const totalEl = document.getElementById('cmTotalCount');
  if (totalEl) totalEl.textContent = `${total} / ${target}`;

  const usedEl = document.getElementById('cmUsedCount');
  if (usedEl) usedEl.textContent = used;

  const favEl = document.getElementById('cmFavCount');
  if (favEl) favEl.textContent = favs;

  const pct = Math.min(100, Math.round((total / target) * 100));
  const pctEl = document.getElementById('cmProgressPct');
  if (pctEl) pctEl.textContent = `${pct}% (${total}/${target} • ${activeProj.name})`;

  const fillEl = document.getElementById('cmProgressFill');
  if (fillEl) fillEl.style.width = `${pct}%`;
}

function getCmFilteredItems() {
  const query = (document.getElementById('cmSearchInput')?.value || '').trim().toLowerCase();
  const categoryFilter = document.getElementById('cmFilterCategory')?.value || 'all';
  const platformFilter = document.getElementById('cmFilterPlatform')?.value || 'all';
  const statusFilter = document.getElementById('cmFilterStatus')?.value || 'all';

  const activeProj = getActiveCmProject();
  let items = (activeProj.items || []).slice();

  if (categoryFilter !== 'all') {
    items = items.filter(x => (x.category || '').trim() === categoryFilter);
  }

  if (platformFilter !== 'all') {
    items = items.filter(x => {
      const p = (x.platform || '').toLowerCase();
      if (platformFilter === 'Other') {
        return !['tiktok', 'facebook', 'youtube', 'x', 'shopee'].includes(p);
      }
      return p.includes(platformFilter.toLowerCase()) || p === 'all';
    });
  }

  if (statusFilter === 'favorite') {
    items = items.filter(x => x.favorite);
  } else if (statusFilter === 'mostUsed') {
    items.sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0));
  } else if (statusFilter === 'newest') {
    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  if (query) {
    items = items.filter(x => {
      const t = (x.title || '').toLowerCase();
      const c = (x.content || '').toLowerCase();
      const tr = (x.translation || '').toLowerCase();
      const cat = (x.category || '').toLowerCase();
      const tags = Array.isArray(x.tags) ? x.tags.join(' ').toLowerCase() : '';
      return t.includes(query) || c.includes(query) || tr.includes(query) || cat.includes(query) || tags.includes(query);
    });
  }

  return items;
}

function updateCmCategorySelects() {
  const catSelect = document.getElementById('cmFilterCategory');
  const catDatalist = document.getElementById('cmCategoryDatalist');
  if (!catSelect) return;

  const currentVal = catSelect.value;
  const categories = new Set([
    '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video',
    '✂️ Đổi Phong Cách Edit & Hiệu Ứng Mới Lạ',
    '💡 Đề Xuất Chủ Đề Mới & Thách Thức Khán Giả Đặt Ra',
    '📈 Bắt Trend Hiện Hành & Nhạc Xu Hướng Hot',
    '❓ Đặt Câu Hỏi Xoáy & Thắc Mắc Để Quay Video Trả Lời',
    '🗳️ Bình Chọn & Thăm Dò Ý Kiến Cộng Đồng'
  ]);

  const activeProj = getActiveCmProject();
  (activeProj.items || []).forEach(x => {
    if (x.category && x.category.trim()) categories.add(x.category.trim());
  });

  catSelect.innerHTML = '<option value="all">📁 Tất cả danh mục</option>';
  if (catDatalist) catDatalist.innerHTML = '';

  Array.from(categories).sort().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);

    if (catDatalist) {
      const dataOpt = document.createElement('option');
      dataOpt.value = cat;
      catDatalist.appendChild(dataOpt);
    }
  });

  if (currentVal && Array.from(categories).includes(currentVal)) {
    catSelect.value = currentVal;
  }
}

function renderCmCommentsList() {
  const listEl = document.getElementById('cmCommentsList');
  const emptyEl = document.getElementById('cmEmptyState');
  const countBadge = document.getElementById('cmActiveItemCountBadge');
  if (!listEl) return;

  const items = getCmFilteredItems();
  if (countBadge) countBadge.textContent = `Hiển thị: ${items.length} bình luận`;

  if (items.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    const detailContent = document.getElementById('cmDetailContent');
    const detailPrompt = document.getElementById('cmDetailEmptyPrompt');
    if (detailContent) detailContent.style.display = 'none';
    if (detailPrompt) detailPrompt.style.display = 'flex';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  listEl.innerHTML = '';

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = `cm-item-card ${item.id === activeCmId ? 'active' : ''}`;

    let pIcon = '🌐';
    const pl = (item.platform || '').toLowerCase();
    if (pl.includes('tiktok')) pIcon = '🎵';
    else if (pl.includes('facebook')) pIcon = '👥';
    else if (pl.includes('youtube')) pIcon = '📹';
    else if (pl.includes('x') || pl.includes('twitter')) pIcon = '🐦';
    else if (pl.includes('shopee')) pIcon = '🛍️';

    li.innerHTML = `
      <div class="cm-item-title-row">
        <span class="cm-item-title">${escapeHtml(item.title || item.content.substring(0, 30))}</span>
        <div style="display: flex; gap: 4px; align-items: center;">
          <span style="font-size: 11px; cursor: pointer; opacity: ${item.favorite ? '1' : '0.3'}; transition: transform 0.2s;" class="cm-fav-star" title="Yêu thích">⭐</span>
        </div>
      </div>
      <div class="cm-item-preview">${escapeHtml(item.content)}</div>
      <div class="cm-item-footer">
        <span style="font-size: 10.5px; color: var(--purple2); background: rgba(139,92,246,0.12); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(139,92,246,0.25);">${pIcon} ${escapeHtml(item.category || 'Chung')}</span>
        <button type="button" class="cm-quick-copy-btn" title="Sao chép nhanh">📋 Copy</button>
      </div>
    `;

    li.addEventListener('click', (e) => {
      if (e.target.closest('.cm-quick-copy-btn') || e.target.closest('.cm-fav-star')) return;
      activeCmId = item.id;
      renderCmCommentsList();
      renderCmDetail(item);
    });

    const starEl = li.querySelector('.cm-fav-star');
    if (starEl) {
      starEl.addEventListener('click', async (e) => {
        e.stopPropagation();
        item.favorite = !item.favorite;
        await saveCommentsVaultData();
        updateCmDashboardStats();
        renderCmCommentsList();
        if (activeCmId === item.id) renderCmDetail(item);
      });
    }

    const copyBtn = li.querySelector('.cm-quick-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await copyCmText(item.content, item.id);
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '✔️ Đã chép!';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = '📋 Copy';
        }, 1500);
      });
    }

    listEl.appendChild(li);
  });

  if (!activeCmId && items.length > 0) {
    activeCmId = items[0].id;
    renderCmDetail(items[0]);
  } else if (activeCmId) {
    const cur = items.find(x => x.id === activeCmId);
    if (cur) renderCmDetail(cur);
  }
}

function renderCmDetail(item) {
  const detailContent = document.getElementById('cmDetailContent');
  const detailPrompt = document.getElementById('cmDetailEmptyPrompt');
  if (!item || !detailContent) return;

  if (detailPrompt) detailPrompt.style.display = 'none';
  detailContent.style.display = 'flex';

  const titleEl = document.getElementById('cmDetailTitle');
  if (titleEl) titleEl.textContent = item.title || 'Mẫu bình luận';

  const catBadge = document.getElementById('cmDetailCategoryBadge');
  if (catBadge) catBadge.textContent = item.category || 'Bình luận chung';

  const platBadge = document.getElementById('cmDetailPlatformBadge');
  if (platBadge) platBadge.textContent = item.platform ? `🌐 ${item.platform}` : '🌐 Đa kênh';

  const usedBadge = document.getElementById('cmDetailUsedBadge');
  if (usedBadge) usedBadge.textContent = `Đã dùng ${item.usedCount || 0} lần`;

  const timeEl = document.getElementById('cmDetailTime');
  if (timeEl && item.createdAt) {
    const d = new Date(item.createdAt);
    timeEl.textContent = `Lưu: ${d.toLocaleDateString('vi-VN')}`;
  }

  const contentText = document.getElementById('cmDetailContentText');
  if (contentText) contentText.textContent = item.content || '';

  const transWrap = document.getElementById('cmDetailTranslationWrap');
  const transText = document.getElementById('cmDetailTranslationText');
  if (transWrap && transText) {
    if (item.translation && item.translation.trim()) {
      transWrap.style.display = 'block';
      transText.textContent = item.translation;
    } else {
      transWrap.style.display = 'none';
      transText.textContent = '';
    }
  }

  const tagsWrap = document.getElementById('cmDetailTagsWrap');
  if (tagsWrap) {
    tagsWrap.innerHTML = '';
    if (Array.isArray(item.tags) && item.tags.length > 0) {
      item.tags.forEach(t => {
        if (t.trim()) {
          const span = document.createElement('span');
          span.className = 'cm-tag-pill';
          span.textContent = `#${t.trim()}`;
          tagsWrap.appendChild(span);
        }
      });
    }
  }

  const contextWrap = document.getElementById('cmDetailContextWrap');
  const contextText = document.getElementById('cmDetailContextText');
  if (contextWrap && contextText) {
    if (item.context && item.context.trim()) {
      contextWrap.style.display = 'block';
      contextText.textContent = item.context;
    } else {
      contextWrap.style.display = 'none';
      contextText.textContent = '';
    }
  }

  const favBtn = document.getElementById('btnCmToggleFav');
  if (favBtn) {
    favBtn.textContent = item.favorite ? '⭐ Đã thích' : '☆ Thích';
    favBtn.style.color = item.favorite ? '#fde047' : '#fff';
    favBtn.onclick = async () => {
      item.favorite = !item.favorite;
      await saveCommentsVaultData();
      updateCmDashboardStats();
      renderCmCommentsList();
      renderCmDetail(item);
    };
  }

  const editBtn = document.getElementById('btnCmEdit');
  if (editBtn) {
    editBtn.onclick = () => openCmForm(item);
  }

  const deleteBtn = document.getElementById('btnCmDelete');
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (confirm(`Bạn có chắc muốn xóa bình luận "${item.title || item.content.substring(0, 25)}"?`)) {
        const activeProj = getActiveCmProject();
        activeProj.items = (activeProj.items || []).filter(x => x.id !== item.id);
        await saveCommentsVaultData();
        activeCmId = null;
        renderCmProjectSelect();
        updateCmDashboardStats();
        updateCmCategorySelects();
        renderCmCommentsList();
        if (cmCurrentViewMode === 'grid') renderCmFastGrid();
      }
    };
  }

  const speakBtn = document.getElementById('btnCmSpeak');
  if (speakBtn) {
    speakBtn.onclick = () => speakCmText(item.content);
  }

  const bigCopyBtn = document.getElementById('btnCmBigCopy');
  const copyMsg = document.getElementById('cmCopySuccessMsg');
  if (bigCopyBtn) {
    bigCopyBtn.onclick = async () => {
      await copyCmText(item.content, item.id);
      if (copyMsg) {
        copyMsg.style.display = 'block';
        setTimeout(() => { copyMsg.style.display = 'none'; }, 2500);
      }
      if (usedBadge) usedBadge.textContent = `Đã dùng ${item.usedCount || 0} lần`;
    };
  }
}

function renderCmFastGrid() {
  const gridEl = document.getElementById('cmFastCopyGrid');
  const countBadge = document.getElementById('cmGridCountBadge');
  if (!gridEl) return;

  const items = getCmFilteredItems();
  if (countBadge) countBadge.textContent = `${items.length} thẻ`;

  gridEl.innerHTML = '';
  if (items.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 40px 10px;">
        <div style="font-size: 36px; margin-bottom: 8px;">💬</div>
        <p>Không tìm thấy bình luận nào phù hợp trong bộ lọc của dự án này.</p>
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'cm-fast-card';

    let pIcon = '🌐';
    const pl = (item.platform || '').toLowerCase();
    if (pl.includes('tiktok')) pIcon = '🎵';
    else if (pl.includes('facebook')) pIcon = '👥';
    else if (pl.includes('youtube')) pIcon = '📹';
    else if (pl.includes('x') || pl.includes('twitter')) pIcon = '🐦';
    else if (pl.includes('shopee')) pIcon = '🛍️';

    card.innerHTML = `
      <div>
        <div class="cm-fast-card-header">
          <span style="font-size: 13px; font-weight: 700; color: #fff; line-height: 1.3;">${escapeHtml(item.title || 'Mẫu bình luận')}</span>
          <span style="font-size: 10px; color: #38bdf8; background: rgba(14,165,233,0.15); border: 1px solid rgba(14,165,233,0.3); padding: 2px 6px; border-radius: 4px; white-space: nowrap;">${pIcon} ${escapeHtml(item.platform || 'All')}</span>
        </div>
        <div class="cm-fast-card-content" style="margin-top: 8px;">${escapeHtml(item.content)}</div>
        ${item.translation ? `<div class="cm-fast-card-trans">🇻🇳 ${escapeHtml(item.translation)}</div>` : ''}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; margin-top: 6px;">
        <span style="font-size: 10.5px; color: var(--muted);">${item.usedCount || 0} lượt copy</span>
        <button type="button" class="btn-primary-glow cm-grid-copy-btn" style="padding: 0 12px; height: 30px; font-size: 11.5px; font-weight: 700; width: auto; background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);">📋 Copy</button>
      </div>
    `;

    const copyBtn = card.querySelector('.cm-grid-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await copyCmText(item.content, item.id);
        copyBtn.innerHTML = '✔️ Đã chép!';
        copyBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        setTimeout(() => {
          copyBtn.innerHTML = '📋 Copy';
          copyBtn.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)';
        }, 1500);
      });
    }

    gridEl.appendChild(card);
  });
}

async function copyCmText(text, itemId = null) {
  if (!text) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch (e) { }

  if (window.taskAPI && window.taskAPI.writeClipboardText) {
    try { window.taskAPI.writeClipboardText(text); } catch (e) { }
  }

  if (typeof playTone === 'function') {
    playTone(659, 0.06, 'sine', 0.1);
    setTimeout(() => playTone(880, 0.08, 'sine', 0.12), 60);
  }

  if (itemId) {
    const activeProj = getActiveCmProject();
    const item = (activeProj.items || []).find(x => x.id === itemId);
    if (item) {
      item.usedCount = (item.usedCount || 0) + 1;
      await saveCommentsVaultData();
      updateCmDashboardStats();
    }
  }
}

function speakCmText(text) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const isEn = /[a-zA-Z]/.test(text) && !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
  utterance.lang = isEn ? 'en-US' : 'vi-VN';
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

function openCmForm(itemToEdit = null) {
  const formState = document.getElementById('cmFormState');
  const detailState = document.getElementById('cmDetailState');
  const gridState = document.getElementById('cmGridState');
  if (!formState) return;

  if (detailState) detailState.style.display = 'none';
  if (gridState) gridState.style.display = 'none';
  formState.style.display = 'flex';

  const formTitle = document.getElementById('cmFormTitle');
  const editId = document.getElementById('cmEditId');
  const titleInput = document.getElementById('cmFormTitleInput');
  const platformInput = document.getElementById('cmFormPlatformInput');
  const contentInput = document.getElementById('cmFormContentInput');
  const transInput = document.getElementById('cmFormTranslationInput');
  const catInput = document.getElementById('cmFormCategoryInput');
  const tagsInput = document.getElementById('cmFormTagsInput');
  const contextInput = document.getElementById('cmFormContextInput');

  if (itemToEdit) {
    if (formTitle) formTitle.textContent = '✏️ Chỉnh Sửa Mẫu Bình Luận';
    if (editId) editId.value = itemToEdit.id;
    if (titleInput) titleInput.value = itemToEdit.title || '';
    if (platformInput) platformInput.value = itemToEdit.platform || 'TikTok';
    if (contentInput) contentInput.value = itemToEdit.content || '';
    if (transInput) transInput.value = itemToEdit.translation || '';
    if (catInput) catInput.value = itemToEdit.category || '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video';
    if (tagsInput) tagsInput.value = Array.isArray(itemToEdit.tags) ? itemToEdit.tags.join(', ') : '';
    if (contextInput) contextInput.value = itemToEdit.context || '';
  } else {
    if (formTitle) formTitle.textContent = '➕ Thêm Mẫu Bình Luận Mới';
    if (editId) editId.value = '';
    if (titleInput) titleInput.value = '';
    if (platformInput) platformInput.value = 'TikTok';
    if (contentInput) contentInput.value = '';
    if (transInput) transInput.value = '';
    if (catInput) catInput.value = '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video';
    if (tagsInput) tagsInput.value = '';
    if (contextInput) contextInput.value = '';
  }

  if (contentInput) contentInput.focus();
}

function closeCmForm() {
  const formState = document.getElementById('cmFormState');
  const detailState = document.getElementById('cmDetailState');
  const gridState = document.getElementById('cmGridState');
  if (!formState) return;

  formState.style.display = 'none';
  if (cmCurrentViewMode === 'grid') {
    if (gridState) gridState.style.display = 'flex';
    if (detailState) detailState.style.display = 'none';
  } else {
    if (detailState) detailState.style.display = 'flex';
    if (gridState) gridState.style.display = 'none';
  }
}

async function saveCmForm() {
  const editId = document.getElementById('cmEditId')?.value || '';
  const title = (document.getElementById('cmFormTitleInput')?.value || '').trim();
  const platform = document.getElementById('cmFormPlatformInput')?.value || 'TikTok';
  const content = (document.getElementById('cmFormContentInput')?.value || '').trim();
  const translation = (document.getElementById('cmFormTranslationInput')?.value || '').trim();
  const category = (document.getElementById('cmFormCategoryInput')?.value || '').trim() || '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video';
  const rawTags = (document.getElementById('cmFormTagsInput')?.value || '').trim();
  const context = (document.getElementById('cmFormContextInput')?.value || '').trim();

  if (!content) {
    alert('Vui lòng nhập nội dung câu bình luận!');
    return;
  }

  const tags = rawTags ? rawTags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) : [];
  const activeProj = getActiveCmProject();

  if (editId) {
    const item = (activeProj.items || []).find(x => x.id === editId);
    if (item) {
      item.title = title || content.substring(0, 30);
      item.platform = platform;
      item.content = content;
      item.translation = translation;
      item.category = category;
      item.tags = tags;
      item.context = context;
    }
  } else {
    const newItem = {
      id: 'cm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: title || content.substring(0, 30),
      platform: platform,
      content: content,
      translation: translation,
      category: category,
      tags: tags,
      context: context,
      favorite: false,
      usedCount: 0,
      createdAt: new Date().toISOString()
    };
    if (!activeProj.items) activeProj.items = [];
    activeProj.items.unshift(newItem);
    activeCmId = newItem.id;
  }

  await saveCommentsVaultData();
  closeCmForm();
  renderCmProjectSelect();
  updateCmDashboardStats();
  updateCmCategorySelects();
  renderCmCommentsList();

  if (cmCurrentViewMode === 'grid') {
    renderCmFastGrid();
  } else if (activeCmId) {
    const cur = (activeProj.items || []).find(x => x.id === activeCmId);
    if (cur) renderCmDetail(cur);
  }
}

function initCommentsVaultTab() {
  if (cmInitialized) {
    renderCmProjectSelect();
    updateCmDashboardStats();
    updateCmCategorySelects();
    renderCmCommentsList();
    if (cmCurrentViewMode === 'grid') renderCmFastGrid();
    return;
  }
  cmInitialized = true;

  const projectSelect = document.getElementById('cmProjectSelect');
  if (projectSelect) {
    projectSelect.addEventListener('change', (e) => {
      handleSwitchCmProject(e.target.value);
    });
  }

  const btnNewProj = document.getElementById('btnCmNewProject');
  if (btnNewProj) btnNewProj.addEventListener('click', openNewProjectModal);

  const btnNewProjCancel = document.getElementById('btnCmNewProjCancel');
  if (btnNewProjCancel) btnNewProjCancel.addEventListener('click', closeNewProjectModal);

  const btnNewProjSave = document.getElementById('btnCmNewProjSave');
  if (btnNewProjSave) btnNewProjSave.addEventListener('click', saveNewProjectModal);

  const btnRenameProj = document.getElementById('btnCmRenameProject');
  if (btnRenameProj) btnRenameProj.addEventListener('click', openRenameProjectModal);

  const btnRenameProjCancel = document.getElementById('btnCmRenameProjCancel');
  if (btnRenameProjCancel) btnRenameProjCancel.addEventListener('click', closeRenameProjectModal);

  const btnRenameProjSave = document.getElementById('btnCmRenameProjSave');
  if (btnRenameProjSave) btnRenameProjSave.addEventListener('click', saveRenameProjectModal);

  const btnDeleteProj = document.getElementById('btnCmDeleteProject');
  if (btnDeleteProj) btnDeleteProj.addEventListener('click', handleDeleteCmProject);

  const btnNew = document.getElementById('btnCmNewComment');
  if (btnNew) btnNew.addEventListener('click', () => openCmForm(null));

  const btnCancelForm = document.getElementById('btnCmCancelForm');
  if (btnCancelForm) btnCancelForm.addEventListener('click', closeCmForm);

  const btnCancelSave = document.getElementById('btnCmCancelSave');
  if (btnCancelSave) btnCancelSave.addEventListener('click', closeCmForm);

  const btnSave = document.getElementById('btnCmSaveComment');
  if (btnSave) btnSave.addEventListener('click', saveCmForm);

  const btnDetailMode = document.getElementById('btnCmViewDetailMode');
  const btnGridMode = document.getElementById('btnCmViewGridMode');
  const detailState = document.getElementById('cmDetailState');
  const gridState = document.getElementById('cmGridState');
  const formState = document.getElementById('cmFormState');

  if (btnDetailMode && btnGridMode) {
    btnDetailMode.addEventListener('click', () => {
      cmCurrentViewMode = 'detail';
      btnDetailMode.className = 'btn-modal btn-confirm';
      btnDetailMode.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)';
      btnGridMode.className = 'btn-modal btn-cancel';
      btnGridMode.style.background = '';
      if (formState) formState.style.display = 'none';
      if (gridState) gridState.style.display = 'none';
      if (detailState) detailState.style.display = 'flex';
      renderCmCommentsList();
    });

    btnGridMode.addEventListener('click', () => {
      cmCurrentViewMode = 'grid';
      btnGridMode.className = 'btn-modal btn-confirm';
      btnGridMode.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)';
      btnDetailMode.className = 'btn-modal btn-cancel';
      btnDetailMode.style.background = '';
      if (formState) formState.style.display = 'none';
      if (detailState) detailState.style.display = 'none';
      if (gridState) gridState.style.display = 'flex';
      renderCmFastGrid();
    });
  }

  const searchInp = document.getElementById('cmSearchInput');
  if (searchInp) {
    searchInp.addEventListener('input', () => {
      renderCmCommentsList();
      if (cmCurrentViewMode === 'grid') renderCmFastGrid();
    });
  }

  const filterCat = document.getElementById('cmFilterCategory');
  if (filterCat) {
    filterCat.addEventListener('change', () => {
      renderCmCommentsList();
      if (cmCurrentViewMode === 'grid') renderCmFastGrid();
    });
  }

  const filterPlat = document.getElementById('cmFilterPlatform');
  if (filterPlat) {
    filterPlat.addEventListener('change', () => {
      renderCmCommentsList();
      if (cmCurrentViewMode === 'grid') renderCmFastGrid();
    });
  }

  const filterStat = document.getElementById('cmFilterStatus');
  if (filterStat) {
    filterStat.addEventListener('change', () => {
      renderCmCommentsList();
      if (cmCurrentViewMode === 'grid') renderCmFastGrid();
    });
  }

  const btnLoadPresets = document.getElementById('btnCmLoadPresets');
  if (btnLoadPresets) {
    btnLoadPresets.addEventListener('click', async () => {
      const activeProj = getActiveCmProject();
      if (confirm(`Bạn có muốn nạp thêm bộ mẫu bình luận vào dự án "${activeProj.name}" không?`)) {
        DEFAULT_PRESET_COMMENTS.forEach((item, idx) => {
          const exists = (activeProj.items || []).some(x => x.content === item.content);
          if (!exists) {
            activeProj.items.push({
              id: 'cm_preset_' + Date.now() + '_' + idx,
              title: item.title,
              content: item.content,
              translation: item.translation || '',
              category: item.category || '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video',
              platform: item.platform || 'TikTok',
              tags: item.tags || [],
              context: item.context || '',
              favorite: !!item.favorite,
              usedCount: 0,
              createdAt: new Date().toISOString()
            });
          }
        });
        await saveCommentsVaultData();
        renderCmProjectSelect();
        updateCmDashboardStats();
        updateCmCategorySelects();
        renderCmCommentsList();
        if (cmCurrentViewMode === 'grid') renderCmFastGrid();
        alert('Đã nạp thành công bộ mẫu bình luận có sẵn!');
      }
    });
  }

  const btnBulk = document.getElementById('btnCmBulkImport');
  const bulkModal = document.getElementById('cmBulkModal');
  const btnBulkCancel = document.getElementById('btnCmBulkCancel');
  const btnBulkConfirm = document.getElementById('btnCmBulkConfirm');

  if (btnBulk && bulkModal) {
    btnBulk.addEventListener('click', () => {
      const catInp = document.getElementById('cmBulkCategoryInput');
      const textInp = document.getElementById('cmBulkTextInput');
      if (catInp) catInp.value = '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video';
      if (textInp) textInp.value = '';
      bulkModal.classList.add('active');
      bulkModal.classList.add('visible');
    });
  }
  if (btnBulkCancel && bulkModal) {
    btnBulkCancel.addEventListener('click', () => {
      bulkModal.classList.remove('active');
      bulkModal.classList.remove('visible');
    });
  }
  if (btnBulkConfirm && bulkModal) {
    btnBulkConfirm.addEventListener('click', async () => {
      const cat = (document.getElementById('cmBulkCategoryInput')?.value || '').trim() || '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video';
      const plat = document.getElementById('cmBulkPlatformInput')?.value || 'TikTok';
      const text = (document.getElementById('cmBulkTextInput')?.value || '').trim();

      if (!text) {
        alert('Vui lòng dán ít nhất 1 dòng bình luận!');
        return;
      }

      const activeProj = getActiveCmProject();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let count = 0;
      lines.forEach((line, idx) => {
        const cleanLine = line.replace(/^\d+[\.\)\-]\s*/, '').replace(/^[-*•]\s*/, '').trim();
        if (cleanLine) {
          activeProj.items.unshift({
            id: 'cm_bulk_' + Date.now() + '_' + idx,
            title: cleanLine.length > 30 ? cleanLine.substring(0, 30) + '...' : cleanLine,
            content: cleanLine,
            translation: '',
            category: cat,
            platform: plat,
            tags: ['bulk_import'],
            context: '',
            favorite: false,
            usedCount: 0,
            createdAt: new Date().toISOString()
          });
          count++;
        }
      });

      await saveCommentsVaultData();
      bulkModal.classList.remove('active');
      bulkModal.classList.remove('visible');
      renderCmProjectSelect();
      updateCmDashboardStats();
      updateCmCategorySelects();
      renderCmCommentsList();
      if (cmCurrentViewMode === 'grid') renderCmFastGrid();
      alert(`Đã thêm thành công ${count} bình luận vào dự án "${activeProj.name}"!`);
    });
  }

  const btnBackup = document.getElementById('btnCmBackupRestore');
  const backupModal = document.getElementById('cmBackupModal');
  const btnBackupClose = document.getElementById('btnCmBackupClose');
  const btnExportJson = document.getElementById('btnCmExportJson');
  const btnImportJson = document.getElementById('btnCmImportJson');
  const btnClearAll = document.getElementById('btnCmClearAll');
  const backupJsonInput = document.getElementById('cmBackupJsonInput');

  if (btnBackup && backupModal) {
    btnBackup.addEventListener('click', () => {
      if (backupJsonInput) {
        backupJsonInput.value = JSON.stringify(commentsVaultData, null, 2);
      }
      backupModal.classList.add('active');
      backupModal.classList.add('visible');
    });
  }
  if (btnBackupClose && backupModal) {
    btnBackupClose.addEventListener('click', () => {
      backupModal.classList.remove('active');
      backupModal.classList.remove('visible');
    });
  }
  if (btnExportJson) {
    btnExportJson.addEventListener('click', async () => {
      const jsonStr = JSON.stringify(commentsVaultData, null, 2);
      await copyCmText(jsonStr);
      alert('Đã sao chép toàn bộ mã JSON kho bình luận (tất cả các dự án) vào Clipboard!');
    });
  }
  if (btnImportJson && backupModal) {
    btnImportJson.addEventListener('click', async () => {
      try {
        const raw = backupJsonInput?.value?.trim();
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          commentsVaultData = parsed;
          ensureCmProjectsInitialized();
          await saveCommentsVaultData();
          backupModal.classList.remove('active');
          backupModal.classList.remove('visible');
          renderCmProjectSelect();
          updateCmDashboardStats();
          updateCmCategorySelects();
          renderCmCommentsList();
          if (cmCurrentViewMode === 'grid') renderCmFastGrid();
          alert('Đã khôi phục toàn bộ kho bình luận thành công!');
        } else {
          alert('Cấu trúc JSON không hợp lệ.');
        }
      } catch (e) {
        alert('Lỗi phân tích cú pháp JSON: ' + e.message);
      }
    });
  }
  if (btnClearAll && backupModal) {
    btnClearAll.addEventListener('click', async () => {
      const activeProj = getActiveCmProject();
      if (confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ bình luận trong dự án "${activeProj.name}"?`)) {
        activeProj.items = [];
        await saveCommentsVaultData();
        backupModal.classList.remove('active');
        backupModal.classList.remove('visible');
        activeCmId = null;
        renderCmProjectSelect();
        updateCmDashboardStats();
        updateCmCategorySelects();
        renderCmCommentsList();
        if (cmCurrentViewMode === 'grid') renderCmFastGrid();
      }
    });
  }

  // Topic JSON Import Modal
  const btnPasteJsonMain = document.getElementById('btnCmPasteJsonMain');
  const btnPasteJsonSidebar = document.getElementById('btnCmPasteJsonSidebar');
  const topicJsonModal = document.getElementById('cmTopicJsonModal');
  const btnTopicJsonCancel = document.getElementById('btnCmTopicJsonCancel');
  const btnTopicJsonApply = document.getElementById('btnCmTopicJsonApply');
  const btnCopyAiPrompt = document.getElementById('btnCmCopyAiPrompt');
  const btnCopyAppendAiPrompt = document.getElementById('btnCmCopyAppendAiPrompt');
  const btnPasteClipboard = document.getElementById('btnCmPasteClipboard');
  const topicJsonInput = document.getElementById('cmTopicJsonInput');

  const btnOpenChatGPT = document.getElementById('btnCmOpenChatGPT');
  const btnOpenGemini = document.getElementById('btnCmOpenGemini');
  const btnOpenClaude = document.getElementById('btnCmOpenClaude');

  const modalCurrentProjectBadge = document.getElementById('cmModalCurrentProjectBadge');
  const btnCopyAppendPromptText = document.getElementById('btnCmCopyAppendPromptText');
  const modalTopicNameInput = document.getElementById('cmModalTopicNameInput');

  function openTopicJsonModal() {
    if (!topicJsonModal) return;
    if (topicJsonInput) topicJsonInput.value = '';

    const activeProj = getActiveCmProject();
    if (modalTopicNameInput) {
      modalTopicNameInput.value = activeProj.name || 'Dự án 100 Ngày Video';
    }
    if (modalCurrentProjectBadge) {
      modalCurrentProjectBadge.textContent = `(Đã có: ${(activeProj.items || []).length}/${activeProj.target || 1000} câu)`;
    }
    if (btnCopyAppendPromptText) {
      btnCopyAppendPromptText.textContent = `PROMPT NẠP TIẾP (TỪ CÂU ${(activeProj.items || []).length + 1})`;
    }

    topicJsonModal.classList.add('active');
    topicJsonModal.classList.add('visible');
    if (typeof playTone === 'function') playTone(600, 0.05, 'sine', 0.1);
    setTimeout(() => { if (modalTopicNameInput) modalTopicNameInput.focus(); }, 150);
  }

  function closeTopicJsonModal() {
    if (topicJsonModal) {
      topicJsonModal.classList.remove('active');
      topicJsonModal.classList.remove('visible');
    }
  }

  window.openTopicJsonModal = openTopicJsonModal;
  window.closeTopicJsonModal = closeTopicJsonModal;

  if (btnPasteJsonMain) btnPasteJsonMain.addEventListener('click', openTopicJsonModal);
  if (btnPasteJsonSidebar) btnPasteJsonSidebar.addEventListener('click', openTopicJsonModal);
  if (btnTopicJsonCancel) btnTopicJsonCancel.addEventListener('click', closeTopicJsonModal);

  function openExternalUrl(url) {
    if (window.taskAPI && window.taskAPI.openExternal) {
      window.taskAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  }

  if (btnOpenChatGPT) btnOpenChatGPT.addEventListener('click', () => openExternalUrl('https://chatgpt.com'));
  if (btnOpenGemini) btnOpenGemini.addEventListener('click', () => openExternalUrl('https://gemini.google.com'));
  if (btnOpenClaude) btnOpenClaude.addEventListener('click', () => openExternalUrl('https://claude.ai'));

  // Prompt Generator 1: Full 1000 from Scratch
  if (btnCopyAiPrompt) {
    btnCopyAiPrompt.addEventListener('click', async () => {
      const activeProj = getActiveCmProject();
      const topicDisplay = (document.getElementById('cmModalTopicNameInput')?.value || '').trim() || activeProj.name || 'Dự án 100 Ngày Video';

      const promptText = `Hãy đóng vai một chuyên gia Social Media Strategy và cộng đồng hàng triệu khán giả chân thực trên TikTok, Reels, YouTube Shorts. Tôi đang thực hiện chuỗi thử thách 100 ngày làm video ngắn.
Chủ đề dự án 100 ngày của tôi là: "${topicDisplay}"

MỤC TIÊU CỐT LÕI CỦA BỘ 1000 BÌNH LUẬN NÀY:
Bộ bình luận này đóng vai trò như "kim chỉ nam" từ cộng đồng người xem thực tế, chứa các ý kiến đóng góp, thử thách, gợi ý đổi mới, yêu cầu bắt trend và phong cách edit mới để giúp tôi:
1. Nâng cấp chất lượng video ngày càng hay hơn, giữ chân người xem tốt hơn.
2. Đổi mới phong cách edit (nhịp cắt ngắn, hiệu ứng âm thanh meme, zoom biểu cảm, kinetic typography, phong cách ASMR, màu phim...).
3. Đa dạng hóa nội dung theo đúng ý muốn và thị hiếu của số đông khán giả.
4. Bắt kịp các trend và trào lưu âm thanh hot nhất hiện nay.
5. Tạo cớ để quay các video tiếp theo trả lời bình luận (Reply to Comment).

HÃY PHÂN BỔ BÌNH LUẬN THEO 6 NHÓM DANH MỤC THỰC TẾ SAU:

1. 🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video
(Các bình luận từ khán giả tinh tế góp ý về: đổi góc quay, ánh sáng, giảm âm lượng nhạc nền để nghe rõ giọng, nhịp nói nhanh/chậm hơn, thêm phụ đề nổi bật, thời lượng video...)

2. ✂️ Đổi Phong Cách Edit & Hiệu Ứng Mới Lạ
(Yêu cầu thử các phong cách edit hiện đại: CapCut giật theo beat, fast-cut nhịp nhanh, zoom-in biểu cảm, chèn meme sound effect, phong cách ASMR thực tế, retro VHS, typography động...)

3. 💡 Đề Xuất Chủ Đề Mới & Thách Thức Khán Giả Đặt Ra
("Thách chủ kênh làm thử...", "Làm chủ đề X đi ad", "Top comment chọn kịch bản ngày mai", "Thử giải quyết tình huống khó này xem sao", "Làm cho người mới bắt đầu...")

4. 📈 Bắt Trend Hiện Hành & Nhạc Xu Hướng Hot
(Gợi ý lồng nhạc viral đang top 1 TikTok, format POV, Before & After lột xác, diễn tiểu phẩm hài hước ngắn, bắt trend hot trend...)

5. ❓ Đặt Câu Hỏi Xoáy & Thắc Mắc Để Quay Video Trả Lời
(Đặt các câu hỏi hóc búa, thắc mắc phản biện hoặc tình huống thực tế để kích thích chủ kênh làm video phần sau bấm nút Reply trả lời bình luận)

6. 🗳️ Bình Chọn & Thăm Dò Ý Kiến Cộng Đồng
(Khán giả chia phe tranh luận A vs B, bình chọn hướng phát triển tiếp theo của kênh, vote thử thách cho các ngày tiếp theo trong 100 ngày)

YÊU CẦU ĐỊNH DẠNG ĐẦU RA:
Trả về CHÍNH XÁC một chuỗi JSON hợp lệ (Valid JSON), không có bất kỳ lời dẫn hay văn bản giải thích nào ngoài khối JSON.
Cấu trúc JSON như sau:
{
  "topic": "${topicDisplay}",
  "comments": [
    {
      "title": "[Tiêu đề ngắn gọn mô tả góc nhìn góp ý / thử thách]",
      "content": "[Nội dung câu bình luận chân thực, sinh động, chuẩn ngôn ngữ mạng xã hội]",
      "translation": "[Bản dịch tiếng Việt nếu comment tiếng Anh, hoặc để trống]",
      "category": "🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video",
      "platform": "TikTok",
      "tags": ["gop_y", "cai_tien", "video100ngay", "trend"],
      "context": "[Gợi ý cách áp dụng bình luận này để cải thiện hoặc quay video trả lời]"
    }
  ]
}`;

      await copyCmText(promptText);
      btnCopyAiPrompt.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      btnCopyAiPrompt.innerHTML = '✔️ ĐÃ CHÉP PROMPT TẠO TỪ ĐẦU!';
      setTimeout(() => {
        btnCopyAiPrompt.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)';
        btnCopyAiPrompt.innerHTML = '<span>📋</span> <span>PROMPT TẠO TỪ ĐẦU (1000 CÂU MỚI)</span>';
      }, 2500);

      alert(`✅ ĐÃ SAO CHÉP PROMPT AI TẠO TỪ ĐẦU CHO CHỦ ĐỀ:\n"${topicDisplay}"\n\n👉 Bạn hãy mở ChatGPT / Gemini / Claude và dán (Ctrl + V) vào nhé!`);
    });
  }

  // Prompt Generator 2: Incremental Append (Fresh, Non-Duplicating)
  if (btnCopyAppendAiPrompt) {
    btnCopyAppendAiPrompt.addEventListener('click', async () => {
      const activeProj = getActiveCmProject();
      const currentCount = (activeProj.items || []).length;
      const topicDisplay = (document.getElementById('cmModalTopicNameInput')?.value || '').trim() || activeProj.name || 'Dự án 100 Ngày Video';

      const promptText = `Tôi đang tiếp tục thực hiện chuỗi 100 ngày làm video ngắn cho dự án: "${topicDisplay}".
Hiện tại trong kho dữ liệu của tôi ĐÃ CÓ ${currentCount} BÌNH LUẬN từ các đợt trước.

HÃY TIẾP TỤC TẠO THÊM 100 - 200 BÌNH LUẬN MỚI TIẾP THEO (từ câu thứ ${currentCount + 1}), VỚI CÁC YÊU CẦU ĐẶC BIỆT SAU:
1. TUYỆT ĐỐI KHÔNG LẶP LẠI các ý tưởng hay câu từ phổ biến đã xuất hiện ở các đợt trước.
2. Tập trung vào các NGÁCH NỘI DUNG SÂU HƠN, các trường hợp oái oăm / tình huống thực tế khó đỡ.
3. Đề xuất các KỸ THUẬT EDIT MỚI LẠ hơn (ví dụ: chuyển cảnh sound effect glitch, hiệu ứng 3D text tracking, đổi filter màu điện ảnh, format POV độc đáo).
4. Các câu hỏi hóc búa, thử thách gay cấn hơn từ khán giả để tôi làm video phần tiếp theo giải thích ("Reply to Comment").
5. Bắt các trend mới nhất đang thịnh hành trên TikTok / Reels / Shorts.

YÊU CẦU ĐỊNH DẠNG:
Trả về CHÍNH XÁC dưới dạng chuỗi JSON hợp lệ (Valid JSON), không bọc thêm văn bản giải thích nào ngoài JSON. Cấu trúc:
{
  "topic": "${topicDisplay}",
  "comments": [
    {
      "title": "[Tiêu đề góc nhìn mới lạ]",
      "content": "[Nội dung câu bình luận độc đáo, không trùng lặp]",
      "translation": "[Bản dịch tiếng Việt nếu là tiếng Anh]",
      "category": "✂️ Đổi Phong Cách Edit & Hiệu Ứng Mới Lạ",
      "platform": "TikTok",
      "tags": ["nang_cao", "edit_moi", "trend"],
      "context": "[Gợi ý cách phản hồi hoặc áp dụng]"
    }
  ]
}`;

      await copyCmText(promptText);
      btnCopyAppendAiPrompt.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      btnCopyAppendAiPrompt.innerHTML = `✔️ ĐÃ CHÉP PROMPT NẠP TIẾP (TỪ CÂU ${currentCount + 1})!`;
      setTimeout(() => {
        btnCopyAppendAiPrompt.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #059669 100%)';
        btnCopyAppendAiPrompt.innerHTML = `<span>⚡</span> <span>PROMPT NẠP TIẾP (KHÔNG TRÙNG)</span>`;
      }, 2500);

      alert(`⚡ ĐÃ SAO CHÉP PROMPT NẠP TIẾP CHO DỰ ÁN "${topicDisplay}"!\n(Yêu cầu AI sinh các ý tưởng hoàn toàn mới từ câu ${currentCount + 1} trở đi)`);
    });
  }

  // Paste from clipboard button
  if (btnPasteClipboard && topicJsonInput) {
    btnPasteClipboard.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          topicJsonInput.value = text;
          if (typeof playTone === 'function') playTone(600, 0.06, 'sine', 0.1);
        }
      } catch (err) {
        alert('Vui lòng nhấn Ctrl + V để dán trực tiếp vào ô văn bản.');
      }
    });
  }

  // Apply Topic JSON Button (Ultra-Resilient & Bulletproof Parser)
  if (btnTopicJsonApply && topicJsonModal) {
    btnTopicJsonApply.addEventListener('click', async () => {
      let raw = (document.getElementById('cmTopicJsonInput')?.value || '').trim();
      if (!raw) {
        alert('Vui lòng dán chuỗi JSON hoặc danh sách bình luận vào ô nhập liệu!');
        return;
      }

      // 1. Strip Markdown code blocks
      raw = raw.replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/i, '').trim();

      let extractedItems = [];
      let parsedTopic = '';

      // 2. Try Standard & Cleaned JSON Parse
      try {
        let cleanRaw = raw;
        // Fix trailing commas
        cleanRaw = cleanRaw.replace(/,\s*([\}\]])/g, '$1');
        const parsed = JSON.parse(cleanRaw);

        if (Array.isArray(parsed)) {
          extractedItems = parsed;
        } else if (parsed && typeof parsed === 'object') {
          parsedTopic = parsed.topic || parsed.name || parsed.title || '';
          if (Array.isArray(parsed.comments)) {
            extractedItems = parsed.comments;
          } else if (Array.isArray(parsed.items)) {
            extractedItems = parsed.items;
          } else if (Array.isArray(parsed.data)) {
            extractedItems = parsed.data;
          } else if (Array.isArray(parsed.days)) {
            parsed.days.forEach(d => {
              if (Array.isArray(d.comments)) {
                d.comments.forEach(c => {
                  if (typeof c === 'string') {
                    extractedItems.push({ content: c, category: `Ngày ${d.day}: ${d.title || parsedTopic}` });
                  } else if (typeof c === 'object') {
                    if (!c.category && d.title) c.category = `Ngày ${d.day}: ${d.title}`;
                    extractedItems.push(c);
                  }
                });
              }
            });
          } else {
            for (const key of Object.keys(parsed)) {
              if (Array.isArray(parsed[key]) && key !== 'categories' && key !== 'projects') {
                parsed[key].forEach(subItem => {
                  if (typeof subItem === 'string') {
                    extractedItems.push({ content: subItem, category: key });
                  } else if (typeof subItem === 'object') {
                    if (!subItem.category) subItem.category = key;
                    extractedItems.push(subItem);
                  }
                });
              } else if (parsed[key] && typeof parsed[key] === 'object' && parsed[key].content) {
                extractedItems.push(parsed[key]);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Standard JSON.parse failed, trying Regex object extraction:', e.message);

        // 3. Fallback: Extract individual JSON objects via Regex
        const objRegex = /\{[^{}]*"content"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"[^{}]*\}/g;
        let match;
        while ((match = objRegex.exec(raw)) !== null) {
          try {
            const fixedObjStr = match[0].replace(/,\s*\}/g, '}');
            const itemObj = JSON.parse(fixedObjStr);
            if (itemObj && itemObj.content) {
              extractedItems.push(itemObj);
            }
          } catch (err) {
            const contentMatch = match[0].match(/"content"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
            const titleMatch = match[0].match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
            const catMatch = match[0].match(/"category"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
            const platMatch = match[0].match(/"platform"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
            const transMatch = match[0].match(/"translation"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
            const contextMatch = match[0].match(/"context"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);

            if (contentMatch) {
              extractedItems.push({
                title: titleMatch ? titleMatch[1] : '',
                content: contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
                translation: transMatch ? transMatch[1] : '',
                category: catMatch ? catMatch[1] : '',
                platform: platMatch ? platMatch[1] : 'TikTok',
                context: contextMatch ? contextMatch[1] : ''
              });
            }
          }
        }

        // 4. Fallback: Plain text lines if JSON extraction returned nothing
        if (extractedItems.length === 0) {
          const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 5);
          lines.forEach(l => {
            const clean = l.replace(/^\d+[\.\)\-]\s*/, '').replace(/^[-*•]\s*/, '').replace(/^"|"$/g, '').trim();
            if (clean.length > 5 && !clean.startsWith('{') && !clean.startsWith('}') && !clean.startsWith('[') && !clean.startsWith(']')) {
              extractedItems.push({ content: clean });
            }
          });
        }
      }

      if (!extractedItems || extractedItems.length === 0) {
        alert('Không tìm thấy nội dung bình luận nào trong văn bản dán vào! Vui lòng sao chép lại chuỗi JSON từ AI.');
        return;
      }

      const enteredProjName = (document.getElementById('cmModalTopicNameInput')?.value || '').trim();
      let targetProj = getActiveCmProject();
      if (enteredProjName && enteredProjName !== targetProj.name) {
        const existingProj = commentsVaultData.projects.find(p => p.name.toLowerCase() === enteredProjName.toLowerCase());
        if (existingProj) {
          targetProj = existingProj;
          commentsVaultData.activeProjectId = targetProj.id;
        } else {
          targetProj.name = enteredProjName;
        }
      }
      const projectCategoryDefault = '🎬 Góp Ý Cải Tiến & Nâng Cao Chất Lượng Video';

      const normalizedList = extractedItems.map((rawItem, idx) => {
        if (typeof rawItem === 'string') {
          return {
            id: 'cm_' + Date.now() + '_' + idx + '_' + Math.floor(Math.random() * 1000),
            title: rawItem.length > 35 ? rawItem.substring(0, 35) + '...' : rawItem,
            content: rawItem,
            translation: '',
            category: projectCategoryDefault,
            platform: 'TikTok',
            tags: ['video100ngay', targetProj.name.replace(/\s+/g, '_')].filter(Boolean),
            context: `Bình luận đóng góp cho dự án: ${targetProj.name}`,
            favorite: false,
            usedCount: 0,
            createdAt: new Date().toISOString()
          };
        }

        const content = (rawItem.content || rawItem.text || rawItem.comment || rawItem.body || rawItem.context || rawItem.title || '').trim();
        const title = (rawItem.title || rawItem.name || rawItem.hook || (content ? content.substring(0, 35) + '...' : 'Bình luận')).trim();
        const translation = (rawItem.translation || rawItem.trans || rawItem.vietnamese || rawItem.meaning || '').trim();
        const category = (rawItem.category || rawItem.group || rawItem.type || projectCategoryDefault).trim();
        const platform = (rawItem.platform || rawItem.channel || 'TikTok').trim();
        let tags = rawItem.tags || [];
        if (typeof tags === 'string') tags = tags.split(',').map(t => t.trim().replace(/^#/, ''));
        if (!Array.isArray(tags)) tags = [];
        if (!tags.includes(targetProj.name)) tags.push(targetProj.name.replace(/\s+/g, '_'));

        const context = (rawItem.context || rawItem.note || rawItem.tips || '').trim();

        return {
          id: 'cm_' + Date.now() + '_' + idx + '_' + Math.floor(Math.random() * 1000),
          title: title || 'Mẫu bình luận',
          content: content || title,
          translation: translation,
          category: category,
          platform: platform,
          tags: tags.filter(Boolean),
          context: context,
          favorite: !!rawItem.favorite,
          usedCount: rawItem.usedCount || 0,
          createdAt: rawItem.createdAt || new Date().toISOString()
        };
      }).filter(item => item.content && item.content.length > 0);

      if (normalizedList.length === 0) {
        alert('Không tìm thấy nội dung bình luận hợp lệ nào!');
        return;
      }

      const importMode = document.querySelector('input[name="cmJsonImportMode"]:checked')?.value || 'append';
      if (importMode === 'replace') {
        targetProj.items = normalizedList;
      } else {
        const existingContents = new Set((targetProj.items || []).map(x => x.content.trim()));
        const newUniqueItems = normalizedList.filter(x => !existingContents.has(x.content.trim()));
        targetProj.items = [...(targetProj.items || []), ...newUniqueItems];
      }

      targetProj.updatedAt = new Date().toISOString();
      await saveCommentsVaultData();
      closeTopicJsonModal();
      activeCmId = targetProj.items[0]?.id || null;

      try { renderCmProjectSelect(); } catch (e) { }
      try { updateCmDashboardStats(); } catch (e) { }
      try { updateCmCategorySelects(); } catch (e) { }
      try { renderCmCommentsList(); } catch (e) { }
      if (cmCurrentViewMode === 'grid') {
        try { renderCmFastGrid(); } catch (e) { }
      }

      if (typeof playTone === 'function') {
        playTone(523, 0.08, 'sine', 0.1);
        setTimeout(() => playTone(659, 0.08, 'sine', 0.12), 80);
        setTimeout(() => playTone(784, 0.12, 'sine', 0.15), 160);
      }

      alert(`🎉 THÀNH CÔNG!\nĐã nạp ${normalizedList.length} bình luận vào dự án "${targetProj.name}"!\nTổng số bình luận hiện có trong dự án: ${targetProj.items.length}/${targetProj.target || 1000}.`);
    });
  }

  renderCmProjectSelect();
  updateCmDashboardStats();
  updateCmCategorySelects();
  renderCmCommentsList();
}

// 🧠 BRAIN CHAIN MODULE (Hệ Thống Phân Tích Chuỗi Tư Duy Đa Tầng)
// =================================================================

const DEFAULT_BRAIN_CHAIN_PRESETS = [
  {
    id: "bc_preset_smartwatch",
    question: "3. Is there any technology you want to buy?",
    title: "3. Is there any technology you want to buy?",
    answer: "Yes, I've been thinking about buying a new smartwatch. My current one is old and the battery life is terrible. I want one that can track my fitness activities, monitor my heart rate, and let me answer calls without taking out my phone. It would be a time-saving gadget.",
    category: "Tiếng Anh & Speaking",
    level: 3,
    context: "Phân rã logic học thuộc và phản xạ Speaking: Trả lời câu hỏi IELTS về thiết bị công nghệ muốn mua (Smartwatch).",
    createdAt: new Date().toISOString(),
    coreChain: {
      a: "BƯỚC 1 (A - Khởi điểm & Dự định): 'Yes, I've been thinking about buying a new smartwatch.' – Trực tiếp xác nhận món đồ công nghệ mong muốn kèm trạng thái ấp ủ (I've been thinking about).",
      b: "BƯỚC 2 (B - Lý do & Vấn đề hiện tại): 'My current one is old and the battery life is terrible.' – Đưa ra động cơ mua: Thiết bị cũ đã lỗi thời và thời lượng pin quá tệ (pain point).",
      c: "BƯỚC 3 (C - Nhu cầu tính năng sức khỏe): 'I want one that can track my fitness activities, monitor my heart rate,' – Liệt kê tính năng mong muốn 1 & 2: Theo dõi tập luyện thể chất và đo nhịp tim.",
      d: "BƯỚC 4 (D - Tính năng tiện ích giao tiếp): 'and let me answer calls without taking out my phone.' – Liệt kê tính năng mở rộng 3: Nhận cuộc gọi nhanh mà không cần rút điện thoại ra khỏi túi.",
      insight: "BƯỚC 5 (INSIGHT - Đúc kết giá trị): 'It would be a time-saving gadget.' – Chốt hạ nhận thức cốt lõi: Đây là một công cụ giúp tiết kiệm thời gian và nâng cao chất lượng sống."
    },
    causeEffects: {
      immediate: "Trả lời thẳng thắn và tự nhiên vào trọng tâm câu hỏi về thiết bị công nghệ muốn sở hữu.",
      secondOrder: "Tạo lập tính thuyết phục bằng cách chỉ ra điểm đau cụ thể (Pin yếu & thiết bị cũ).",
      thirdOrder: "Phác họa rõ chân dung nhu cầu thông qua bộ 3 tính năng: Fitness + Heart Rate + Call Handling.",
      unexpected: "Biến một chiếc đồng hồ đeo tay từ món đồ trang sức thành một trung tâm điều khiển vi mô giúp tiết kiệm thời gian.",
      longTerm: "Giúp người nói xây dựng phản xạ logic 3 tầng cho mọi câu hỏi 'What to buy': Xác nhận ➔ Động cơ thay thế ➔ Tính năng mới ➔ Giá trị thực tế."
    },
    whyChain: [
      { level: "1. Triệu chứng bề mặt", question: "Tại sao lại mở đầu bằng 'Yes, I've been thinking about'?", answer: "Vì thì hiện tại hoàn thành tiếp diễn thể hiện một ý định có quá trình suy ngẫm, nghe tự nhiên hơn 'I want to buy'." },
      { level: "2. Nguyên nhân trực tiếp", question: "Tại sao lại nhắc đến chiếc đồng hồ hiện tại?", answer: "Tạo ra lý do chính đáng để mua đồ mới (Pain Point: old & terrible battery life) thay vì mua sắm bốc đồng." },
      { level: "3. Nguyên nhân sâu xa", question: "Tại sao lại chọn các tính năng theo dõi sức khỏe (fitness & heart rate)?", answer: "Vì chăm sóc sức khỏe là xu hướng thiết yếu của con người hiện đại, giúp câu trả lời có chiều sâu." },
      { level: "4. Nguyên nhân hệ thống", question: "Tại sao lại nhắc đến việc nghe cuộc gọi không cần rút điện thoại?", answer: "Đó là giải pháp công nghệ giúp giảm thiểu ma sát thao tác trong lúc di chuyển hoặc tập luyện." },
      { level: "5. Root Cause (Gốc rễ)", question: "Bản chất vì sao smartwatch là 'time-saving gadget'?", answer: "Nó lọc bớt các thông tin vi mô lên cổ tay, giải phóng người dùng khỏi việc liên tục cầm điện thoại." }
    ],
    whatIf: {
      scenario: "Nếu chỉ trả lời ngắn 'Yes, I want a smartwatch because it looks cool'?",
      consequences: [
        "Câu trả lời bị nông cạn, không thể hiện được vốn từ vựng và cấu trúc lập luận logic.",
        "Mất cơ hội ghi điểm ở tiêu chí Fluency và Coherence trong bài thi Speaking.",
        "Người nghe không cảm nhận được động cơ thực tế và tính cách của bạn."
      ]
    },
    systemDynamics: {
      nodes: ["Smartwatch Mới", "Vấn đề Pin & Máy Cũ", "Tính Năng Fitness", "Tính Năng Đo Tim", "Nhận Cuộc Gọi Nhanh", "Tiết Kiệm Thời Gian"],
      directImpact: "Nâng cao trực tiếp trải nghiệm theo dõi sức khỏe và xử lý liên lạc rảnh tay.",
      indirectImpact: "Giảm thời gian nhìn màn hình điện thoại (Screen time), tăng sự tập trung vào sinh hoạt.",
      feedbackLoop: "Vòng lặp tích cực: Theo dõi sức khỏe tốt ➔ Thể lực cải thiện ➔ Tiết kiệm thời gian thao tác ➔ Năng suất ngày làm việc tăng cao."
    },
    firstPrinciples: {
      brokenAssumptions: "Giả định sai: 'Cần học thuộc lòng từng từ riêng lẻ mới nói được tiếng Anh'.",
      fundamentalTruths: "Sự thật gốc: Mọi câu trả lời mua sắm đều theo cấu trúc 4 bước: [Đồ muốn mua] ➔ [Vấn đề đồ cũ] ➔ [Tính năng đồ mới] ➔ [Lợi ích chốt].",
      reconstructedLogic: "Nắm vững khung sườn 4 bước để có thể áp dụng ngay cho Laptop, Tai nghe, Xe máy hay bất kỳ công nghệ nào."
    },
    contrarianThinking: {
      argFor: "Smartwatch là trợ lý đắc lực theo dõi sức khỏe và thông báo tiện lợi.",
      argAgainst: "Nhiều người mua smartwatch xong chỉ dùng để xem giờ hoặc cảm thấy phiền vì thông báo rung liên tục.",
      conditions: "Thực sự giá trị khi bạn là người có thói quen tập luyện thể thao và bận rộn nhiều cuộc gọi.",
      exceptions: "Người không thích sạc pin mỗi ngày hoặc chỉ thích đồng hồ cơ truyền thống.",
      synthesis: "Giá trị của Smartwatch nằm ở kỷ luật sử dụng của người đeo, không phải ở số lượng tính năng trên giấy."
    },
    predictions: {
      oneMonth: "Bạn sẽ thuộc lòng và phản xạ trôi chảy đoạn nói này trong 3 giây khi gặp câu hỏi công nghệ.",
      oneYear: "Dễ dàng biến tấu câu trả lời này cho các thiết bị khác như Wireless Earbuds hay Tablet.",
      fiveYears: "Hình thành tư duy phản xạ Speaking mạch lạc và chặt chẽ trong mọi cuộc phỏng vấn.",
      blindSpots: "Chú ý nối âm tự nhiên ở cụm 'track my fitness activities' và 'let me answer calls'."
    },
    actionTakeaways: [
      "Khắc ghi bộ 4 từ khóa trục chính: Been thinking about -> Battery life is terrible -> Track fitness & monitor heart rate -> Time-saving gadget.",
      "Công thức trả lời mua sắm: Xác nhận ý định ➔ Nêu nhược điểm cái cũ ➔ Kể 2-3 tính năng cái mới ➔ Đúc kết giá trị cốt lõi.",
      "Luyện tập nói theo nhịp 5 bước của Brain Chain (A ➔ B ➔ C ➔ D ➔ Insight) để đạt ngữ điệu tự nhiên nhất."
    ],
    userNotes: "Từ vựng đắt giá: I've been thinking about, terrible battery life, track fitness activities, monitor heart rate, answer calls without taking out my phone, time-saving gadget."
  },
  {
    id: "bc_preset_ielts_device",
    title: "To be honest, I use both quite regularly, but if I had to choose one, I'd say my smartphone is the device I rely on most...",
    category: "Tiếng Anh & Speaking",
    level: 3,
    context: "Phân rã logic học thuộc và phản xạ Speaking: So sánh Smartphone và Laptop trong đời sống hàng ngày.",
    createdAt: new Date().toISOString(),
    coreChain: {
      a: "BƯỚC 1 (Khởi điểm & Lựa chọn): To be honest, I use both quite regularly, but if I had to choose one, I'd say my smartphone is the device I rely on most.",
      b: "BƯỚC 2 (Lý do chọn Smartphone): It's incredibly handy for staying in touch with friends and family, checking social media, and managing my daily schedule.",
      c: "BƯỚC 3 (Chuyển ý sang Laptop): However, I also use my laptop frequently for work and study purposes, especially for tasks that require a larger screen and a proper keyboard,",
      d: "BƯỚC 4 (Chi tiết hóa tác vụ Laptop): such as typing reports, taking online courses, or doing research.",
      insight: "BƯỚC 5 (Đúc kết Insight): So, I'd say they both play an indispensable role in my life."
    },
    causeEffects: {
      immediate: "Định vị ngay thiết bị ưu tiên số 1 (Smartphone) dựa trên tần suất cầm trên tay liên tục.",
      secondOrder: "Phân chia ranh giới công năng: Smartphone phụ trách kết nối nhanh & quản lý vi mô.",
      thirdOrder: "Kích hoạt nhu cầu công việc chiều sâu đòi hỏi Laptop (màn hình lớn, gõ chuẩn).",
      unexpected: "Có điện thoại xịn không hề thay thế laptop, mà ngược lại nâng cao tính chuyên biệt cho laptop.",
      longTerm: "Tạo nên hệ sinh thái 2 thiết bị bổ trợ hoàn hảo, thiếu 1 trong 2 đều gây nghẽn hiệu suất."
    },
    whyChain: [
      { level: "1. Triệu chứng bề mặt", question: "Tại sao lại nói dựa vào Smartphone nhiều nhất?", answer: "Vì nó luôn ở trong túi và hỗ trợ liên lạc, lướt mạng, xem lịch mọi lúc mọi nơi." },
      { level: "2. Nguyên nhân trực tiếp", question: "Tại sao smartphone không thể thay thế hoàn toàn laptop?", answer: "Kích thước màn hình nhỏ và thiếu bàn phím vật lý chuẩn giới hạn năng suất làm việc sâu." },
      { level: "3. Nguyên nhân sâu xa", question: "Tại sao lại cần Laptop cho việc học và nghiên cứu?", answer: "Các tác vụ tư duy phức tạp (viết báo cáo, đa nhiệm tài liệu) đòi hỏi không gian hiển thị rộng và công cụ nhập liệu chuẩn xác." },
      { level: "4. Nguyên nhân hệ thống", question: "Mô hình tương tác giữa 2 thiết bị là gì?", answer: "Smartphone xử lý giao tiếp tức thời & vi vụ; Laptop xử lý công việc chiều sâu & năng suất cao." },
      { level: "5. Root Cause (Gốc rễ)", question: "Bản chất cốt lõi vì sao cả hai là 'indispensable'?", answer: "Con người hiện đại vận hành trên hai trạng thái song song: Kết nối xã hội liên tục (Mobility) và Lao động tri thức chuyên sâu (Deep Work)." }
    ],
    whatIf: {
      scenario: "Nếu buộc phải bỏ hoàn toàn Laptop và chỉ dùng duy nhất Smartphone trong 1 tháng?",
      consequences: [
        "Tốc độ soạn thảo văn bản và nghiên cứu tài liệu giảm hơn 60% do giới hạn giao diện.",
        "Mức độ mỏi mắt và căng thẳng nhận thức tăng cao khi xử lý bảng biểu/khóa học dài.",
        "Phải tìm kiếm các giải pháp chắp vá như gắn thêm bàn phím rời và màn hình phụ."
      ]
    },
    systemDynamics: {
      nodes: ["Smartphone (Mobility)", "Laptop (Deep Work)", "Social Life & Schedule", "Work/Study Output", "Productivity Balance"],
      directImpact: "Tối ưu hóa thời gian: Việc nhẹ xử lý trên điện thoại, việc nặng chuyển lên laptop.",
      indirectImpact: "Giảm tải áp lực tâm lý khi có ranh giới rõ ràng giữa 'thiết bị kết nối' và 'thiết bị làm việc'.",
      feedbackLoop: "Vòng lặp tương hỗ: Càng dùng smartphone sắp xếp lịch tốt ➔ Càng có nhiều khối thời gian tập trung làm việc chất lượng trên laptop."
    },
    firstPrinciples: {
      brokenAssumptions: "Giả định sai: 'Một thiết bị thông minh hiện đại all-in-one có thể thay thế hoàn toàn các thiết bị khác'.",
      fundamentalTruths: "Sự thật gốc: Trải nghiệm công thái học (Ergonomics) và diện tích hiển thị quyết định giới hạn năng suất nhận thức của não bộ.",
      reconstructedLogic: "Thay vì tìm kiếm 1 thiết bị vạn năng, phân loại tác vụ theo form factor tối ưu (Smartphone = Quick Access; Laptop = Deep Creation)."
    },
    contrarianThinking: {
      argFor: "Smartphone quan trọng nhất vì nó giải quyết 80% nhu cầu liên lạc và phản xạ hàng ngày.",
      argAgainst: "Nếu chỉ có smartphone thì không thể tạo ra giá trị kinh tế hay học thuật chuyên sâu.",
      conditions: "Đúng khi bạn là người làm việc tri thức cần cả giao tiếp lẫn xử lý tài liệu.",
      exceptions: "Người làm nghề chỉ thuần túy bán hàng qua gọi điện/chat có thể chỉ cần duy nhất smartphone.",
      synthesis: "Không có thiết bị tối cao, chỉ có sự phối hợp nhịp nhàng giữa tính di động (Smartphone) và tính tạo tác (Laptop)."
    },
    predictions: {
      oneMonth: "Thói quen phản xạ Speaking theo cấu trúc Logic Chain này giúp bạn nói trôi chảy không cần dịch nhẩm.",
      oneYear: "Sự tích hợp AI trên thiết bị sẽ làm ranh giới giữa Smartphone và Laptop thu hẹp dần.",
      fiveYears: "Các thiết bị đeo thông minh (AR glasses / Foldables) có thể hợp nhất tính tiện dụng và màn hình lớn.",
      blindSpots: "Cần kiểm tra xem liệu việc quá phụ thuộc vào smartphone có gây xao nhãng khi ngồi vào laptop làm việc hay không."
    },
    actionTakeaways: [
      "Khắc ghi bộ 4 từ khóa trục chính: Rely on most -> Handy for -> Larger screen & keyboard -> Indispensable role.",
      "Khi gặp câu hỏi lựa chọn 'A or B', luôn áp dụng công thức: Thừa nhận cả 2 -> Nghiêng về 1 phía -> Chỉ ra thế mạnh bù trừ -> Chốt giá trị của cả 2.",
      "Luyện tập nói câu này theo nhịp thở của từng mắt xích (A -> B -> C -> D -> Insight) để tạo ngữ điệu tự nhiên."
    ],
    userNotes: "Công thức vàng cho IELTS Speaking Part 1/2: Thừa nhận cả hai (I use both) ➔ Chọn 1 cái ưu tiên (Rely on most) ➔ Nêu lý do tiện lợi (Handy for) ➔ Bổ sung nhu cầu chuyên sâu của cái còn lại (However... for work/study) ➔ Chốt hạ cả 2 đều thiết yếu (Indispensable role)."
  },
  {
    id: "bc_preset_1",
    title: "Một quán cà phê giảm giá 30%",
    category: "Kinh doanh",
    level: 3,
    context: "Quán cà phê đông khách nhưng lợi nhuận giảm, chủ quán quyết định tung chương trình khuyến mãi giảm 30% toàn menu để kích cầu.",
    createdAt: new Date().toISOString(),
    coreChain: {
      a: "Quán cà phê triển khai chương trình giảm giá 30% toàn menu.",
      b: "Lượng khách mới tò mò và khách quen kéo đến quán tăng đột biến gấp 3 lần.",
      c: "Quán quá tải nghiêm trọng, thời gian khách chờ đồ uống kéo dài từ 5 phút lên 35 phút, nhân viên kiệt sức.",
      d: "Đơn hàng bị pha chế ẩu và nhầm lẫn liên tục; khách hàng thất vọng rời đi và để lại hàng loạt đánh giá 1 sao.",
      insight: "Nếu năng lực vận hành không sẵn sàng cho quy mô tăng trưởng, một chiến dịch marketing thành công về lượng khách sẽ biến thành thảm họa hủy diệt uy tín thương hiệu."
    },
    causeEffects: {
      immediate: "Doanh thu ngày đầu tiên tăng cao do lượng khách săn khuyến mãi đổ về đông đúc.",
      secondOrder: "Chi phí nguyên vật liệu và áp lực nhân sự tăng vọt nhưng biên lợi nhuận trên từng ly bị bào mòn do giảm giá sâu.",
      thirdOrder: "Khách hàng trung thành trước đây bỏ sang quán khác vì không gian ồn ào và chất lượng phục vụ suy giảm.",
      unexpected: "Chiến dịch marketing càng viral mạnh thì tốc độ phá hủy danh tiếng thương hiệu càng diễn ra nhanh hơn.",
      longTerm: "Khi hết thời hạn giảm giá 30%, khách hàng vãng lai săn sale biến mất, quán mất cả khách cũ lẫn khách mới, doanh số sụt giảm chạm đáy."
    },
    whyChain: [
      { level: "1. Triệu chứng bề mặt", question: "Tại sao khách hàng nổi giận và chấm 1 sao?", answer: "Vì phải chờ đồ uống hơn 30 phút và nhận sai món đồ uống có vị nhạt nhẽo." },
      { level: "2. Nguyên nhân trực tiếp", question: "Tại sao thời gian phục vụ bị chậm và đồ uống bị ẩu?", answer: "Vì quầy pha chế chỉ có 2 barista nhưng phải xử lý hơn 120 đơn hàng cùng một lúc." },
      { level: "3. Nguyên nhân sâu xa", question: "Tại sao quán không chuẩn bị thêm nhân sự và quy trình trước?", answer: "Vì bộ phận marketing chạy chương trình mà không đồng bộ kế hoạch với bộ phận vận hành." },
      { level: "4. Nguyên nhân hệ thống", question: "Tại sao có sự đứt gãy giữa Marketing và Vận hành?", answer: "Vì quán thiếu hệ thống dự báo công suất tải tối đa (Capacity Planning) trước khi kích hoạt đòn bẩy cầu." },
      { level: "5. Root Cause (Gốc rễ)", question: "Bản chất cốt lõi nằm ở đâu?", answer: "Tư duy ngộ nhận rằng 'Có nhiều khách là luôn tốt' mà bỏ quên nguyên tắc: Trải nghiệm khách hàng là hàm số của Năng lực cung ứng chia cho Lượng cầu." }
    ],
    whatIf: {
      scenario: "Nếu quán giới hạn 50 suất giảm giá/ngày hoặc chỉ áp dụng cho khách đặt lịch trước thì sao?",
      consequences: [
        "Tạo ra hiệu ứng khan hiếm (FOMO) lành mạnh khiến giá trị khuyến mãi được trân trọng hơn.",
        "Bộ phận vận hành luôn kiểm soát được 100% chất lượng từng ly cà phê và phong cách phục vụ.",
        "Biến 100% khách thử nghiệm thành khách hàng trung thành thay vì tạo ra 500 khách hàng thất vọng."
      ]
    },
    systemDynamics: {
      nodes: ["Giá bán (-30%)", "Lượng khách (+300%)", "Công suất pha chế (100% Max)", "Thời gian chờ (+600%)", "Trải nghiệm khách (-80%)", "Tỷ lệ quay lại (-90%)"],
      directImpact: "Giảm giá kích thích trực tiếp nhu cầu tiêu dùng ngắn hạn của phân khúc nhạy cảm về giá.",
      indirectImpact: "Tác động gián tiếp gây căng thẳng tâm lý nhân sự dẫn đến tỷ lệ thôi việc tăng cao sau đợt khuyến mãi.",
      feedbackLoop: "Vòng lặp cân bằng tiêu cực: Quá tải ➔ Phục vụ kém ➔ Đánh giá xấu ➔ Khách giảm sút ➔ Lợi nhuận âm ➔ Cắt giảm nhân sự ➔ Quán càng phục vụ tệ hơn."
    },
    firstPrinciples: {
      brokenAssumptions: "Giả định sai: 'Doanh thu tăng = Lợi nhuận tăng' và 'Cứ có khách đông là quán sẽ phát triển bền vững'.",
      fundamentalTruths: "Sự thật gốc: Giá trị thực sự của quán cà phê là trải nghiệm nhất quán; khách hàng trả tiền cho cảm xúc thoải mái chứ không chỉ là caffein rẻ tiền.",
      reconstructedLogic: "Chỉ mở rộng phễu khách hàng khi và chỉ khi điểm nghẽn vận hành (Bottleneck) đã được nới rộng tương ứng."
    },
    contrarianThinking: {
      argFor: "Giảm giá 30% giúp xả hàng tồn kho nhanh, thu thập dữ liệu khách hàng mới và tạo tiếng vang truyền thông tức thì.",
      argAgainst: "Giảm giá thu hút tệp khách hàng nhạy cảm về giá không trung thành, hạ thấp định vị thương hiệu và làm kiệt quệ dòng tiền.",
      conditions: "Chỉ đúng khi quán có biên lợi nhuận gộp cực cao (>80%), dư thừa công suất phục vụ và có kịch bản Upsell các món có lãi cao.",
      exceptions: "Không bao giờ áp dụng giảm giá đại trà cho các mô hình dịch vụ giới hạn chỗ ngồi và trải nghiệm cao cấp.",
      synthesis: "Khuyến mãi là con dao hai lưỡi: Dùng để kiểm tra sức chịu tải của hệ thống thì tốt, dùng làm cứu cánh doanh thu dài hạn là tự sát."
    },
    predictions: {
      oneMonth: "Lượng khách quay về mức bình thường nhưng chi phí vận hành và tuyển dụng nhân viên mới tăng 25%.",
      oneYear: "Điểm đánh giá Google Maps giảm từ 4.8 xuống 3.9 sao, khách công sở chuyển sang thương hiệu đối thủ bên cạnh.",
      fiveYears: "Quán buộc phải tái cơ cấu toàn diện hoặc sang nhượng mặt bằng nếu không đổi mới định vị giá trị.",
      blindSpots: "Chưa tính đến chi phí xử lý khiếu nại và tổn thất vô hình khi đánh mất khách quen có giá trị vòng đời (LTV) cao."
    },
    actionTakeaways: [
      "Luôn tính toán ngưỡng chịu tải vận hành (Max Capacity) trước khi tung bất kỳ chiến dịch Marketing nào.",
      "Thay vì giảm giá trực tiếp (-30%), hãy tặng voucher trải nghiệm lần sau hoặc nâng cấp size miễn phí để kiểm soát lượng phục vụ.",
      "Xây dựng quy trình đồng bộ liên phòng ban: Marketing phải báo trước cho Vận hành tối thiểu 7 ngày."
    ],
    userNotes: "Bài học then chốt: Marketing tạo ra kỳ vọng, Vận hành quyết định sự thỏa mãn. Đừng để kỳ vọng vượt xa năng lực cung ứng!"
  },
  {
    id: "bc_preset_2",
    title: "Giá xăng dầu thế giới tăng mạnh 15%",
    category: "Kinh tế",
    level: 3,
    context: "Do bất ổn địa chính trị tại các nước xuất khẩu dầu mỏ, giá xăng dầu thế giới và trong nước tăng đột ngột 15%.",
    createdAt: new Date().toISOString(),
    coreChain: {
      a: "Giá xăng dầu tăng 15% do biến động nguồn cung năng lượng toàn cầu.",
      b: "Chi phí logistics, vận chuyển container và cước giao nhận hàng hóa tăng ngay lập tức 8-12%.",
      c: "Giá vốn hàng bán của các mặt hàng tiêu dùng, thực phẩm tại chợ và siêu thị đồng loạt tăng giá.",
      d: "Người tiêu dùng cảm nhận áp lực lạm phát, cắt giảm chi tiêu không thiết yếu và thắt chặt hầu bao.",
      insight: "Năng lượng là 'máu' chảy trong huyết mạch của mọi ngành kinh tế; cú sốc năng lượng luôn chuyển hóa thành suy thoái sức mua bán lẻ trước khi làm tổn thương lợi nhuận ròng của doanh nghiệp."
    },
    causeEffects: {
      immediate: "Người dân xếp hàng đổ xăng trước giờ tăng giá; các doanh nghiệp vận tải thông báo điều chỉnh phụ phí xăng dầu.",
      secondOrder: "Các nhà sản xuất đối mặt với tình thế tiến thoái lưỡng nan: Tăng giá bán thì mất khách, giữ giá thì chịu lỗ gộp.",
      thirdOrder: "Ngân hàng trung ương xem xét tăng lãi suất để kiềm chế lạm phát kỳ vọng.",
      unexpected: "Doanh số xe máy điện và các phương tiện công cộng tăng trưởng đột biến 40%.",
      longTerm: "Thúc đẩy nhanh hơn quá trình chuyển đổi năng lượng xanh và tối ưu hóa chuỗi cung ứng cục bộ (Near-shoring)."
    },
    whyChain: [
      { level: "1. Triệu chứng bề mặt", question: "Tại sao tô phở và mớ rau ngoài chợ lại tăng giá thêm 5.000đ?", answer: "Vì người bán hàng phải trả thêm tiền xăng khi đi lấy hàng tại chợ đầu mối." },
      { level: "2. Nguyên nhân trực tiếp", question: "Tại sao chi phí vận chuyển lại chiếm tỷ trọng lớn như vậy?", answer: "Vì chuỗi cung ứng thực phẩm tươi sống phụ thuộc 100% vào xe tải chạy dầu diesel mỗi ngày." },
      { level: "3. Nguyên nhân sâu xa", question: "Tại sao nền kinh tế không thể ngay lập tức chuyển sang nguồn nhiên liệu thay thế?", answer: "Vì cơ sở hạ tầng giao thông và phương tiện vận tải nặng cần hàng thập kỷ và hàng tỷ USD để điện hóa." },
      { level: "4. Nguyên nhân hệ thống", question: "Tại sao biến động xăng dầu lại có sức lan tỏa rộng như vậy?", answer: "Vì năng lượng là đầu vào cơ bản (Base Input) của toàn bộ các tầng sản xuất, lưu kho và phân phối." },
      { level: "5. Root Cause (Gốc rễ)", question: "Bản chất cốt lõi nằm ở đâu?", answer: "Xã hội hiện đại được xây dựng trên giả định rằng 'năng lượng hóa thạch luôn dồi dào và rẻ mạt'. Khi giả định này lung lay, toàn bộ cấu trúc định giá kinh tế phải thiết lập lại." }
    ],
    whatIf: {
      scenario: "Nếu các doanh nghiệp chuyển sang hợp đồng bảo hiểm giá nhiên liệu (Fuel Hedging) dài hạn?",
      consequences: [
        "Doanh nghiệp ổn định được giá thành sản phẩm trong 6-12 tháng, giữ chân khách hàng tốt hơn đối thủ.",
        "Biến chi phí biến đổi khó đoán thành chi phí cố định có thể hoạch định trong ngân sách tài chính.",
        "Tạo lợi thế cạnh tranh áp đảo trước các đối thủ cạnh tranh nhỏ lẻ bị sốc giá."
      ]
    },
    systemDynamics: {
      nodes: ["Giá Dầu", "Cước Vận Tải", "Giá Hàng Tiêu Dùng", "CPI Lạm Phát", "Lãi Suất", "Sức Mua Thị Trường"],
      directImpact: "Tác động trực tiếp làm tăng chi phí biến đổi của các ngành phụ thuộc giao nhận.",
      indirectImpact: "Tác động gián tiếp kéo giảm chỉ số niềm tin tiêu dùng và làm chậm tốc độ luân chuyển tiền tệ.",
      feedbackLoop: "Vòng lặp lạm phát: Giá xăng tăng ➔ Chi phí sinh hoạt tăng ➔ Người lao động đòi tăng lương ➔ Doanh nghiệp tăng giá hàng hóa ➔ Lạm phát tiếp tục leo thang."
    },
    firstPrinciples: {
      brokenAssumptions: "Giả định sai: 'Chỉ có xe cộ mới chịu ảnh hưởng bởi giá xăng, doanh nghiệp phần mềm/dịch vụ thì không sao'.",
      fundamentalTruths: "Sự thật gốc: Mọi sản phẩm vật lý đều phải di chuyển trong không gian để đến tay người tiêu dùng; không gian di chuyển gắn liền với năng lượng tiêu hao.",
      reconstructedLogic: "Để chống chịu khủng hoảng năng lượng, doanh nghiệp phải rút ngắn khoảng cách địa lý của chuỗi cung ứng hoặc gia tăng hàm lượng giá trị vô hình/số hóa."
    },
    contrarianThinking: {
      argFor: "Giá xăng tăng kích thích sự sáng tạo trong việc tối ưu lộ trình giao hàng và loại bỏ các quy trình vận chuyển lãng phí.",
      argAgainst: "Gây tổn thương nặng nề nhất cho tầng lớp lao động thu nhập thấp và doanh nghiệp vừa và nhỏ vốn có biên an toàn mỏng.",
      conditions: "Đúng khi nền kinh tế có năng lực chuyển đổi nhanh sang các giải pháp năng lượng thay thế.",
      exceptions: "Các ngành sản xuất thuần số (SaaS, Digital Media) chịu ảnh hưởng gián tiếp chậm hơn các ngành hàng vật lý.",
      synthesis: "Khủng hoảng giá xăng dầu là bài kiểm tra độ dẻo dai của chuỗi cung ứng; kẻ nào thích nghi trước sẽ chiếm lĩnh thị phần của kẻ đứng yên."
    },
    predictions: {
      oneMonth: "Các ứng dụng giao hàng tăng phụ phí xăng xe; người tiêu dùng gom đơn để giảm tiền ship.",
      oneYear: "Làn sóng chuyển đổi sang xe máy điện của tài xế công nghệ đạt tỷ lệ áp đảo trên 30%.",
      fiveYears: "Các mô hình kho bãi vệ tinh mini (Micro-fulfillment) phát triển mạnh để giảm quãng đường giao nhận chặng cuối.",
      blindSpots: "Chưa tính đến rủi ro suy thoái kinh tế toàn cầu khi các ngân hàng trung ương siết chặt dòng tiền quá mức."
    },
    actionTakeaways: [
      "Tối ưu hóa bài toán lộ trình giao hàng (Route Optimization) để giảm 15-20% quãng đường di chuyển không cần thiết.",
      "Xem xét đàm phán hợp đồng giá cố định dài hạn với các nhà cung ứng vận tải tin cậy.",
      "Chuyển đổi từng phần đội xe giao vận nội bộ sang phương tiện điện để cắt giảm chi phí nhiên liệu dài hạn."
    ],
    userNotes: "Tư duy phản xạ: Khi một chi phí đầu vào nền tảng (năng lượng, lãi suất, tỷ giá) tăng, hãy lập tức rà soát lại toàn bộ cây chi phí của doanh nghiệp."
  },
  {
    id: "bc_preset_3",
    title: "AI tạo sinh (Generative AI) tích hợp sâu vào văn phòng",
    category: "Công nghệ",
    level: 3,
    context: "Các công cụ AI (ChatGPT, Copilot, Gemini) được doanh nghiệp bắt buộc đưa vào quy trình làm việc hằng ngày của nhân viên văn phòng.",
    createdAt: new Date().toISOString(),
    coreChain: {
      a: "Doanh nghiệp trang bị tài khoản AI và chuẩn hóa quy trình làm việc bằng AI cho toàn bộ nhân viên.",
      b: "Tốc độ soạn thảo email, báo cáo, phân tích dữ liệu và viết code sơ bộ tăng gấp 5 lần.",
      c: "Giá trị của kỹ năng làm việc thủ công và kiến thức cơ bản giảm sút; yêu cầu chuyển dịch sang tư duy thẩm định, kiểm chứng và đặt câu hỏi (Prompting & Critical Thinking).",
      d: "Cấu trúc tổ chức tinh gọn lại; khoảng cách năng suất giữa người làm chủ AI và người từ chối AI nới rộng thành vực thẳm.",
      insight: "AI không trực tiếp thay thế con người, nhưng một người biết tư duy hệ thống và làm chủ AI sẽ thay thế hoàn toàn 5 người chỉ làm việc theo quy trình máy móc cố định."
    },
    causeEffects: {
      immediate: "Nhân viên tiết kiệm được 2-3 giờ làm việc mỗi ngày từ các tác vụ soạn thảo văn bản và tổng hợp tài liệu.",
      secondOrder: "Số lượng nội dung và báo cáo được tạo ra bùng nổ, nhưng chất lượng trung bình có nguy cơ bị bão hòa và rập khuôn.",
      thirdOrder: "Tiêu chuẩn đánh giá hiệu suất (KPI) được nâng lên gấp đôi vì ban lãnh đạo kỳ vọng năng suất cao hơn từ công cụ AI.",
      unexpected: "Xuất hiện tình trạng 'ảo giác AI' (Hallucination) dẫn đến các quyết định sai lầm nghiêm trọng nếu thiếu người có chuyên môn sâu thẩm định.",
      longTerm: "Mô hình công ty 1 người (Solopreneur) hoặc đội ngũ 5 người tạo ra doanh thu triệu USD trở nên phổ biến nhờ đòn bẩy AI tự động hóa."
    },
    whyChain: [
      { level: "1. Triệu chứng bề mặt", question: "Tại sao nhân viên có thể hoàn thành bản kế hoạch 20 trang chỉ trong 30 phút?", answer: "Vì AI đã tổng hợp và sinh ra toàn bộ dàn ý, nội dung và biểu mẫu theo câu lệnh chỉ trong vài giây." },
      { level: "2. Nguyên nhân trực tiếp", question: "Tại sao AI làm được điều đó nhanh hơn con người?", answer: "Vì các mô hình ngôn ngữ lớn (LLM) đã học từ hàng triệu văn bản mẫu và có khả năng liên kết tri thức xuyên ngành tức thì." },
      { level: "3. Nguyên nhân sâu xa", question: "Tại sao công việc văn phòng truyền thống lại dễ bị AI tác động nhất?", answer: "Vì phần lớn công việc văn phòng trước đây là xử lý, sao chép và tái cấu trúc thông tin có tính lặp lại (Information Arbitrage)." },
      { level: "4. Nguyên nhân hệ thống", question: "Tại sao kỹ năng đặt câu hỏi và phản biện lại trở thành yếu tố quyết định?", answer: "Vì AI chỉ giỏi đưa ra câu trả lời khi con người đưa ra câu hỏi sắc bén; chất lượng đầu ra (Output) phụ thuộc hoàn toàn vào chất lượng tư duy đầu vào (Input)." },
      { level: "5. Root Cause (Gốc rễ)", question: "Bản chất cốt lõi nằm ở đâu?", answer: "Sự dịch chuyển từ 'Nền kinh tế ghi nhớ & thực thi cơ bắp' sang 'Nền kinh tế định hướng, thẩm định và ra quyết định chiến lược'." }
    ],
    whatIf: {
      scenario: "Nếu nhân viên chỉ ỷ lại 100% vào AI mà không tự học và rèn luyện tư duy nền tảng?",
      consequences: [
        "Bộ não mất dần khả năng tư duy sâu (Deep Thinking) và giải quyết vấn đề khi gặp các tình huống độc lạ chưa có trong dữ liệu huấn luyện.",
        "Không thể phát hiện ra các lỗi sai logic tinh vi hoặc định kiến sai lệch trong câu trả lời của AI.",
        "Dễ dàng bị thay thế bởi bất kỳ ai có kỹ năng prompt tương tự."
      ]
    },
    systemDynamics: {
      nodes: ["Công Cụ AI", "Tốc Độ Tạo Nội Dung", "Khối Lượng Thông Tin", "Độ Bão Hòa Chất Lượng", "Yêu Cầu Thẩm Định", "Giá Trị Tư Duy Độc Bản"],
      directImpact: "Tăng cấp số nhân năng suất sơ chế thông tin và tự động hóa các tác vụ lặp lại.",
      indirectImpact: "Tái định hình cơ cấu lương thưởng: Trả tiền cho kết quả và tầm nhìn thay vì trả tiền cho số giờ ngồi máy tính.",
      feedbackLoop: "Vòng lặp tăng cường: Dùng AI thành thạo ➔ Giải phóng thời gian ➔ Có thêm thì giờ học tư duy chiến lược ➔ Prompt cho AI thông minh hơn ➔ Năng suất vượt trội đối thủ."
    },
    firstPrinciples: {
      brokenAssumptions: "Giả định sai: 'Cần nhiều năm học viết code hoặc viết văn mới tạo ra được sản phẩm thương mại hoàn chỉnh'.",
      fundamentalTruths: "Sự thật gốc: Mục đích cuối cùng của công việc là giải quyết vấn đề và tạo ra giá trị cho người dùng; công cụ nào giúp giải quyết nhanh và chuẩn hơn thì công cụ đó thắng.",
      reconstructedLogic: "Con người giữ vai trò Kiến trúc sư trưởng (Architect) và Người kiểm duyệt (Judge); AI đảm nhận vai trò Thợ xây lành nghề (Builder)."
    },
    contrarianThinking: {
      argFor: "AI dân chủ hóa tri thức, giúp một nhân viên bình thường cũng có thể tiếp cận năng lực của chuyên gia cấp cao.",
      argAgainst: "AI tạo ra biển rác thông tin vô nghĩa nếu người dùng không có gout thẩm mỹ và chuẩn mực chất lượng cao.",
      conditions: "Đúng khi văn hóa doanh nghiệp khuyến khích thử nghiệm, có khung đạo đức dữ liệu và đào tạo nhân sự bài bản.",
      exceptions: "Các công việc đòi hỏi sự thấu cảm con người, quan hệ đàm phán trực tiếp và sáng tạo vật lý nguyên bản.",
      synthesis: "Tương lai không thuộc về người chống đối AI, cũng không thuộc về người mù quáng tôn thờ AI; tương lai thuộc về người kết hợp Tư Duy Con Người + Sức Mạnh AI (Centaur Model)."
    },
    predictions: {
      oneMonth: "Nhân viên phấn khích thử nghiệm mọi tính năng, nhưng bắt đầu xuất hiện những email gửi nhầm nội dung chưa kiểm duyệt.",
      oneYear: "Các doanh nghiệp cắt giảm 20-30% nhân sự cấp dưới làm việc đơn giản và tái đầu tư vào nhân sự chiến lược.",
      fiveYears: "Mọi phần mềm nghiệp vụ đều trở thành Agent tự hành; người lao động quản lý một 'đội ngũ nhân viên AI' thay vì làm việc đơn lẻ.",
      blindSpots: "Chưa lường trước các vụ kiện tụng bản quyền dữ liệu và rủi ro an ninh mạng khi dữ liệu bí mật nội bộ bị rò rỉ qua AI."
    },
    actionTakeaways: [
      "Xây dựng thư viện Prompt chuẩn hóa (Prompt Vault) cho các tác vụ lặp lại trong công ty.",
      "Ban hành quy tắc vàng: 'Mọi nội dung AI tạo ra đều phải qua ít nhất một vòng kiểm chứng (Fact-check) của con người trước khi gửi đi'.",
      "Tập trung nâng cao 3 năng lực bất biến: Tư duy phản biện, Đặt câu hỏi đúng và Thấu cảm tâm lý khách hàng."
    ],
    userNotes: "Tự nhắc nhở: Đừng tự hào vì mình gõ prompt nhanh hơn, hãy tự hào vì mình có khả năng phát hiện ra lỗ hổng logic mà AI không nhìn thấy!"
  },
  {
    id: "bc_preset_4",
    title: "Trường đại học cấm sinh viên sử dụng điện thoại trong lớp",
    category: "Giáo dục",
    level: 3,
    context: "Một trường đại học lớn áp dụng quy chế nghiêm ngặt: Sinh viên phải cất điện thoại vào tủ cá nhân trước khi bước vào phòng học.",
    createdAt: new Date().toISOString(),
    coreChain: {
      a: "Nhà trường ban hành lệnh cấm tuyệt đối sử dụng smartphone trong giờ học.",
      b: "Sinh viên buộc phải nhìn lên bảng, giảm hẳn tình trạng lướt mạng xã hội và nhắn tin xao nhãng.",
      c: "Sinh viên cảm thấy bồn chồn (hội chứng FOMO), gặp khó khăn khi tra cứu tài liệu nhanh và không thể chụp lại slide bài giảng.",
      d: "Giảng viên nhận ra phương pháp đọc chép truyền thống bị lộ rõ sự nhàm chán khi sinh viên không có màn hình điện thoại để trốn tránh; giảng viên buộc phải đổi mới cách giảng dạy tương tác.",
      insight: "Cấm đoán công cụ chỉ giải quyết được triệu chứng bề mặt của sự mất tập trung; chính sự hấp dẫn của nội dung và phương pháp kích hoạt động lực nội tại mới là giải pháp gốc rễ."
    },
    causeEffects: {
      immediate: "Không khí lớp học yên ắng hơn; tỷ lệ sinh viên ngủ gật hoặc nhìn ra cửa sổ tăng lên.",
      secondOrder: "Sinh viên quay lại dùng sổ tay giấy và thảo luận nhóm trực tiếp nhiều hơn trong giờ giải lao.",
      thirdOrder: "Điểm thi giữa kỳ của môn học có tính thực hành tăng nhẹ, nhưng môn học lý thuyết nặng nề vẫn có điểm số thấp.",
      unexpected: "Giảng viên chịu áp lực lớn hơn vì không thể đổ lỗi cho 'sinh viên mải chơi điện thoại' khi giờ học buồn ngủ.",
      longTerm: "Trường đại học chuyển đổi sang mô hình lớp học đảo ngược (Flipped Classroom): Sinh viên tự nghiên cứu ở nhà, lên lớp chỉ để tranh biện."
    },
    whyChain: [
      { level: "1. Triệu chứng bề mặt", question: "Tại sao sinh viên nghiện bấm điện thoại trong giờ học?", answer: "Vì thông báo mạng xã hội và video ngắn mang lại dopamine tức thì cao hơn bài giảng." },
      { level: "2. Nguyên nhân trực tiếp", question: "Tại sao bài giảng lại kém hấp dẫn hơn điện thoại?", answer: "Vì nhiều giảng viên chỉ đọc lại slide chữ chi chít mà sinh viên có thể tự đọc ở nhà." },
      { level: "3. Nguyên nhân sâu xa", question: "Tại sao phương pháp giảng dạy chưa đổi mới?", answer: "Vì hệ thống đánh giá giảng viên dựa trên số lượng bài báo khoa học hơn là chất lượng trải nghiệm sư phạm." },
      { level: "4. Nguyên nhân hệ thống", question: "Tại sao cấm điện thoại không làm sinh viên thông minh hơn?", answer: "Vì cấm công cụ không đồng nghĩa với việc kích hoạt được sự tò mò và tư duy độc lập của người học." },
      { level: "5. Root Cause (Gốc rễ)", question: "Bản chất cốt lõi nằm ở đâu?", answer: "Xung đột giữa mô hình giáo dục thời đại công nghiệp (Ngồi nghe thụ động) và tâm lý thế hệ số (Tương tác chủ động & phản hồi tức thì)." }
    ],
    whatIf: {
      scenario: "Nếu biến điện thoại thành công cụ học tập tương tác (Kahoot, Poll, Tra cứu tranh biện trực tiếp)?",
      consequences: [
        "Chuyển hóa năng lượng xao nhãng của sinh viên thành năng lượng cạnh tranh học tập lành mạnh.",
        "Giảng viên đo lường được mức độ hiểu bài của 100% sinh viên theo thời gian thực (Real-time Feedback).",
        "Sinh viên rèn luyện được kỹ năng dùng công cụ số có kỷ luật và đúng mục đích."
      ]
    },
    systemDynamics: {
      nodes: ["Quy Chế Cấm", "Sự Chú Ý Tức Thời", "Hội Chứng Bồn Chồn", "Chất Lượng Giảng Dạy", "Phương Pháp Sư Phạm", "Động Lực Tự Thân"],
      directImpact: "Loại bỏ hoàn toàn tác nhân gây xao nhãng kỹ thuật số trong không gian vật lý của lớp học.",
      indirectImpact: "Tạo ra một 'ốc đảo cai nghiện số' (Digital Detox) ngắn hạn giúp sinh viên phục hồi khả năng tập trung sâu.",
      feedbackLoop: "Vòng lặp giáo dục tích cực: Giảng dạy tương tác cao ➔ Sinh viên cuốn hút ➔ Không còn nhu cầu xem điện thoại ➔ Lớp học sôi nổi ➔ Giảng viên hào hứng cống hiến hơn."
    },
    firstPrinciples: {
      brokenAssumptions: "Giả định sai: 'Không có điện thoại là sinh viên sẽ tự động chú ý nghe giảng'.",
      fundamentalTruths: "Sự thật gốc: Sự chú ý của con người đi theo nơi nào có giá trị kích thích tư duy và cảm xúc mạnh mẽ nhất; sự chú ý không thể cưỡng ép bằng kỷ luật hành chính.",
      reconstructedLogic: "Thay vì chiến đấu chống lại công nghệ, hãy thiết kế trải nghiệm học tập vượt trội hơn công nghệ."
    },
    contrarianThinking: {
      argFor: "Cấm điện thoại rèn luyện tính kỷ luật, tôn trọng người dạy và bảo vệ mắt cũng như khả năng ghi nhớ dài hạn.",
      argAgainst: "Tước đi cơ hội học cách tự quản lý bản thân (Self-regulation) và cô lập sinh viên khỏi dòng chảy thông tin thực tế.",
      conditions: "Phù hợp cho các buổi hội thảo tư duy chuyên sâu, thi cử, thực hành thí nghiệm và rèn luyện kỹ năng mềm.",
      exceptions: "Không hiệu quả với các môn học lập trình, phân tích dữ liệu và thiết kế số.",
      synthesis: "Kỷ luật không gian (Device-free zone) là cần thiết cho tư duy sâu, nhưng phải đi kèm với nội dung giảng dạy xứng tầm."
    },
    predictions: {
      oneMonth: "Sinh viên phàn nàn trên các diễn đàn trường nhưng dần thích nghi và mang vở ghi chép bằng bút.",
      oneYear: "Các khoa bắt đầu đánh giá lại phương pháp giảng dạy của từng bộ môn.",
      fiveYears: "Xu hướng lớp học lai (Hybrid Learning) kết hợp phiên Offline không thiết bị và phiên Online tương tác toàn diện.",
      blindSpots: "Bỏ qua nhu cầu liên lạc khẩn cấp của sinh viên trong các tình huống gia đình phát sinh."
    },
    actionTakeaways: [
      "Thiết kế bài giảng theo công thức 'Quy tắc 10 phút': Cứ mỗi 10 phút thuyết trình phải có 1 câu hỏi tương tác hoặc bài tập nhanh.",
      "Tận dụng các khoảng thời gian 'Digital Detox' có chủ đích để rèn luyện tư duy tập trung sâu (Deep Work).",
      "Thay vì cấm đoán cực đoan, hãy xây dựng quy ước sử dụng công nghệ dựa trên sự đồng thuận và tôn trọng lẫn nhau."
    ],
    userNotes: "Nguyên tắc ứng dụng: Đừng bao giờ giải quyết vấn đề thuộc về 'Động lực' bằng các giải pháp thuần túy 'Cấm đoán'."
  },
  {
    id: "bc_preset_5",
    title: "Internet toàn cầu ngắt kết nối liên tục trong 7 ngày",
    category: "Giả định",
    level: 4,
    context: "Một sự cố bão mặt trời cực mạnh làm tê liệt toàn bộ hạ tầng cáp quang biển và vệ tinh viễn thông trên toàn cầu trong vòng 7 ngày.",
    createdAt: new Date().toISOString(),
    coreChain: {
      a: "Toàn bộ mạng Internet, kết nối 4G/5G và dịch vụ đám mây ngừng hoạt động trên phạm vi toàn cầu.",
      b: "Hệ thống thanh toán thẻ, ngân hàng điện tử, sàn thương mại điện tử và chuỗi logistics bị đóng băng tức khắc.",
      c: "Người dân hoảng loạn đổ xô rút tiền mặt tại các chi nhánh và tích trữ lương thực, thuốc men tại chợ truyền thống.",
      d: "Các cơ quan chính phủ và doanh nghiệp buộc phải kích hoạt phương án liên lạc vô tuyến, văn bản giấy và quản lý phi tập trung tại địa phương.",
      insight: "Mức độ tiện lợi và hiệu quả của nền kinh tế số tỷ lệ thuận với độ mỏng manh của hệ thống khi mất đi hạ tầng cốt lõi; đa dạng hóa kênh dự phòng ngoại tuyến là điều kiện sống còn của an ninh vận hành."
    },
    causeEffects: {
      immediate: "Mọi ứng dụng nhắn tin, mạng xã hội, định vị GPS và nền tảng streaming ngưng hoạt động; con người ngỡ ngàng vì sự im lặng.",
      secondOrder: "Chuỗi cung ứng siêu thị bị đứt gãy do hệ thống kiểm kê tự động và điều phối xe tải không thể đồng bộ dữ liệu.",
      thirdOrder: "Các nhà máy sản xuất tự động dừng hoạt động vì không thể xác thực mã bản quyền và tín hiệu máy chủ từ xa.",
      unexpected: "Tội phạm công nghệ cao bị vô hiệu hóa hoàn toàn; tỷ lệ gặp gỡ nói chuyện trực tiếp giữa các thành viên gia đình và hàng xóm tăng 500%.",
      longTerm: "Các quốc gia ban hành luật bắt buộc duy trì hệ thống dự phòng tiền mặt vật lý và mạng truyền dẫn nội địa độc lập (Air-gapped Grid)."
    },
    whyChain: [
      { level: "1. Triệu chứng bề mặt", question: "Tại sao tôi không thể mua một chai nước ở cửa hàng tiện lợi?", answer: "Vì máy quét mã POS và ví điện tử không thể kết nối tới máy chủ ngân hàng để xác nhận thanh toán." },
      { level: "2. Nguyên nhân trực tiếp", question: "Tại sao cửa hàng không nhận chuyển khoản ngân hàng?", answer: "Vì toàn bộ hệ thống viễn thông trung gian không truyền tải được gói tin dữ liệu." },
      { level: "3. Nguyên nhân sâu xa", question: "Tại sao xã hội hiện đại lại phụ thuộc 99% vào thanh toán không tiền mặt?", answer: "Vì sự tiện lợi và chi phí vận hành siêu rẻ của giải pháp số đã dần đào thải hệ thống lưu thông tiền mặt cồng kềnh." },
      { level: "4. Nguyên nhân hệ thống", question: "Tại sao hầu hết doanh nghiệp không có kế hoạch dự phòng khi mất Internet?", answer: "Vì mọi người đều cho rằng 'Internet là vĩnh cửu và không bao giờ sập hoàn toàn' (Single Point of Failure)." },
      { level: "5. Root Cause (Gốc rễ)", question: "Bản chất cốt lõi nằm ở đâu?", answer: "Cái giá phải trả của sự tối ưu hóa cực đoan (Hyper-Optimization) là sự triệt tiêu tính dư thừa an toàn (Redundancy) trong cấu trúc sinh tồn." }
    ],
    whatIf: {
      scenario: "Nếu doanh nghiệp của bạn sở hữu quy trình bán hàng và thanh toán Offline độc lập?",
      consequences: [
        "Trở thành đơn vị duy nhất trong khu vực vẫn có thể phục vụ khách hàng và duy trì dòng tiền mặt.",
        "Xây dựng được niềm tin vững chắc của khách hàng trong thời khắc khủng hoảng gay cấn nhất.",
        "Hạn chế 100% thiệt hại so với các đối thủ cạnh tranh phụ thuộc hoàn toàn vào đám mây."
      ]
    },
    systemDynamics: {
      nodes: ["Mạng Internet", "Hệ Thống Thanh Toán", "Chuỗi Logistics", "Nhu Cầu Thiết Yếu", "Tiền Mặt & Dự Phòng", "Trật Tự Xã Hội"],
      directImpact: "Làm tê liệt tức thời lớp giao tiếp dữ liệu giữa các thực thể kinh tế và xã hội.",
      indirectImpact: "Bộc lộ mức độ lệ thuộc nguy hiểm của ngành y tế, năng lượng và nước sạch vào các cảm biến điều khiển từ xa.",
      feedbackLoop: "Vòng lặp khủng hoảng: Mất mạng ➔ Không mua được hàng ➔ Hoang mang gom hàng ➔ Khan hiếm giả tạo ➔ Giá cả chợ đen tăng vọt ➔ Trật tự bất ổn."
    },
    firstPrinciples: {
      brokenAssumptions: "Giả định sai: 'Mọi dữ liệu trên Cloud đều an toàn tuyệt đối và có thể truy cập 24/7/365'.",
      fundamentalTruths: "Sự thật gốc: Con người cần Calo (thức ăn), Nước uống, Nơi ở và Phương tiện thanh toán vật lý để tồn tại; các bit dữ liệu trên mạng không thể thay thế nhu cầu sinh học.",
      reconstructedLogic: "Nguyên lý Antifragile (Chống mỏng manh): Hệ thống càng quan trọng thì càng phải có ít nhất một cơ chế vận hành cơ học / thủ công độc lập."
    },
    contrarianThinking: {
      argFor: "Sự cố 7 ngày là hồi chuông cảnh tỉnh quý giá giúp nhân loại nhận ra các lỗ hổng chí mạng trước khi một thảm họa lớn hơn xảy ra.",
      argAgainst: "Gây thiệt hại kinh tế ước tính hàng nghìn tỷ USD và đe dọa sinh mạng của hàng triệu người trong các bệnh viện thiếu hệ thống dự phòng.",
      conditions: "Đúng khi nhân loại biết rút kinh nghiệm để thiết kế lại hạ tầng phân tán (Decentralized Infrastructure).",
      exceptions: "Các vùng nông thôn và bộ lạc nguyên thủy chịu tác động gần như bằng 0.",
      synthesis: "Tiến bộ công nghệ là không thể đảo ngược, nhưng sự khôn ngoan nằm ở chỗ luôn chuẩn bị chiếc dù cứu sinh cơ học trong kỷ nguyên số."
    },
    predictions: {
      oneMonth: "Ngay sau khi có mạng trở lại, các chuyên gia bảo mật và kiến trúc sư hệ thống được săn đón với mức lương kỷ lục.",
      oneYear: "Hàng loạt tập đoàn lớn đầu tư mạnh vào các trung tâm dữ liệu cục bộ (On-premise) song song với Cloud.",
      fiveYears: "Mạng Internet lượng tử và mạng lưới vệ tinh phân tán chống bão từ được triển khai rộng khắp.",
      blindSpots: "Khó khăn trong việc duy trì thói quen dự phòng khi cuộc sống bình thường đã quay trở lại sau vài tháng."
    },
    actionTakeaways: [
      "Luôn lưu trữ bản sao lưu ngoại tuyến (Offline Backup) của các dữ liệu quan trọng nhất (Database, Mã nguồn, Danh bạ khách hàng).",
      "Duy trì một quỹ dự phòng tiền mặt vật lý đủ trang trải sinh hoạt hoặc vận hành tối thiểu trong 1-3 tháng.",
      "Xây dựng kịch bản 'Kế hoạch ngày tận thế' (Disaster Recovery Plan) cho công việc kinh doanh của bạn."
    ],
    userNotes: "Bài học cốt tử của Tư duy Hệ thống: 'Dư thừa có chủ đích (Redundancy) không phải là lãng phí, đó là chiếc phao cứu sinh bảo hiểm cho sự tồn vong'."
  },
  {
    id: "bc_preset_6",
    title: "Quan niệm: 'Chỉ cần làm việc chăm chỉ là chắc chắn sẽ thành công'",
    category: "Tâm lý",
    level: 3,
    context: "Một niềm tin phổ biến trong xã hội cho rằng nỗ lực làm việc 14-16 tiếng mỗi ngày sẽ đảm bảo sự giàu có và thành công vượt bậc.",
    createdAt: new Date().toISOString(),
    coreChain: {
      a: "Một người tin tưởng tuyệt đối vào việc tối đa hóa giờ làm việc (cày cuốc 16 tiếng/ngày).",
      b: "Họ hoàn thành được khối lượng công việc thực thi chi tiết lớn và được khen ngợi là nhân viên cần mẫn.",
      c: "Họ bị cuốn vào guồng quay bận rộn hằng ngày, không còn năng lượng và thời gian để quan sát xu hướng, học kỹ năng mới hay xây dựng quan hệ chiến lược.",
      d: "Họ trở thành mắt xích thực thi không thể thiếu nhưng có thể dễ dàng bị thay thế; thu nhập tăng chậm theo đường tuyến tính trong khi sức khỏe và sự sáng tạo kiệt quệ.",
      insight: "Chăm chỉ chỉ là chiếc vé vào cửa tối thiểu; đòn bẩy tư duy (Leverage), định vị đúng thị trường và khả năng ra quyết định chính xác mới tạo ra sự đột phá theo hàm mũ."
    },
    causeEffects: {
      immediate: "Cảm giác an tâm giả tạo vì 'mình đang bận rộn tức là mình đang tiến bộ'.",
      secondOrder: "Bỏ lỡ các cơ hội mang tính bước ngoặt vì mắt luôn dán vào công việc chi tiết trước mặt thay vì nhìn lên chân trời.",
      thirdOrder: "Bị tổn thương bởi hiệu ứng 'Người làm việc chăm chỉ nhất trên cánh đồng thường là chú trâu chứ không phải người nông dân làm chủ'.",
      unexpected: "Những người làm việc ít giờ hơn nhưng biết xây dựng hệ thống và đòn bẩy công nghệ lại kiếm được thu nhập gấp 10 lần.",
      longTerm: "Khủng hoảng tuổi trung niên khi nhận ra nỗ lực cơ bắp không thể cạnh tranh lại sự suy giảm thể lực và sự trỗi dậy của tự động hóa."
    },
    whyChain: [
      { level: "1. Triệu chứng bề mặt", question: "Tại sao nhiều người làm việc quần quật cả đời vẫn chật vật tài chính?", answer: "Vì họ chỉ bán sức lao động đổi lấy tiền theo tỷ lệ 1:1 không có đòn bẩy." },
      { level: "2. Nguyên nhân trực tiếp", question: "Tại sao họ không áp dụng đòn bẩy?", answer: "Vì họ không sở hữu vốn, công nghệ, sản phẩm số hoặc đội ngũ nhân sự làm việc cho mình." },
      { level: "3. Nguyên nhân sâu xa", question: "Tại sao xã hội luôn ca ngợi sự chăm chỉ đơn thuần?", answer: "Vì câu chuyện 'Chăm chỉ là thành công' rất dễ truyền thông và phục vụ cho lợi ích của các tổ chức cần lực lượng lao động tuân thủ." },
      { level: "4. Nguyên nhân hệ thống", question: "Cơ chế tạo ra sự giàu có thực sự vận hành ra sao?", answer: "Giá trị nhận được = Phán đoán đúng đắn (Judgment) × Đòn bẩy (Leverage) × Mức độ khan hiếm của kỹ năng." },
      { level: "5. Root Cause (Gốc rễ)", question: "Bản chất cốt lõi nằm ở đâu?", answer: "Sự nhầm lẫn tai hại giữa 'Đầu vào nỗ lực' (Input/Effort) và 'Đầu ra giá trị' (Output/Value). Thị trường chỉ trả tiền cho giá trị tạo ra, không trả tiền cho sự mệt mỏi của bạn." }
    ],
    whatIf: {
      scenario: "Nếu bạn dành 20% thời gian mỗi ngày để suy nghĩ: 'Làm thế nào để tự động hóa hoặc nhân bản công việc này?'",
      consequences: [
        "Chuyển dịch từ vai trò Người làm công việc (Operator) sang vai trò Người thiết kế hệ thống (Architect).",
        "Tạo ra các tài sản số (Code, Content, Media, Quy trình) tiếp tục làm việc và tạo ra giá trị ngay cả khi bạn đang ngủ.",
        "Giải phóng thời gian để tập trung vào những quyết định chiến lược có giá trị đòn bẩy cao."
      ]
    },
    systemDynamics: {
      nodes: ["Nỗ Lực Thời Gian", "Kỹ Năng Thực Thi", "Khả Năng Phán Đoán", "Đòn Bẩy (Code/Media/Capital)", "Giá Trị Thặng Dư", "Tự Do Tài Chính"],
      directImpact: "Làm việc chăm chỉ nâng cao năng lực thực thi và xây dựng uy tín cá nhân ban đầu.",
      indirectImpact: "Nếu không có đòn bẩy, làm việc chăm chỉ sẽ dẫn đến bẫy thu nhập trung bình của cá nhân.",
      feedbackLoop: "Vòng lặp giải phóng đòn bẩy: Tư duy đúng ➔ Xây dựng đòn bẩy ➔ Năng suất tăng gấp 10 ➔ Thu nhập tăng ➔ Tái đầu tư vào phán đoán chiến lược ➔ Đạt tự do thực sự."
    },
    firstPrinciples: {
      brokenAssumptions: "Giả định sai: 'Càng làm nhiều giờ thì giá trị tạo ra càng lớn'.",
      fundamentalTruths: "Sự thật gốc: Một quyết định chọn đúng thị trường của Warren Buffett mang lại hàng tỷ USD; một quyết định sai lầm của CEO chăm chỉ có thể xóa sổ tập đoàn.",
      reconstructedLogic: "Công thức thành công: Phán đoán chính xác (Phương hướng) > Đòn bẩy (Tốc độ & Quy mô) > Nỗ lực chăm chỉ (Động cơ)."
    },
    contrarianThinking: {
      argFor: "Chăm chỉ là nền tảng bắt buộc trong giai đoạn đầu (0-1) để tích lũy 10.000 giờ thấu hiểu sâu sắc chuyên môn.",
      argAgainst: "Khi đã có chuyên môn, tiếp tục cày cuốc cơ bắp mà không nâng cấp đòn bẩy là biểu hiện của sự lười biếng trong tư duy chiến lược.",
      conditions: "Chăm chỉ chỉ phát huy tối đa sức mạnh khi bạn đang đi đúng hướng và có đòn bẩy khuếch đại nỗ lực.",
      exceptions: "Trong môi trường làm việc thủ công không thể áp dụng đòn bẩy hoặc thời kỳ chiến tranh sinh tồn.",
      synthesis: "Hãy làm việc cực kỳ chăm chỉ... vào việc tìm kiếm đòn bẩy và rèn luyện năng lực phán đoán của chính mình!"
    },
    predictions: {
      oneMonth: "Bạn bắt đầu từ chối các tác vụ vụn vặt không tên và dành thời gian viết tài liệu hóa quy trình.",
      oneYear: "Thu nhập của bạn tách rời khỏi số giờ làm việc thực tế nhờ áp dụng công cụ AI và tự động hóa.",
      fiveYears: "Bạn sở hữu một danh mục tài sản tạo thu nhập thụ động và có toàn quyền kiểm soát thời gian của cuộc đời mình.",
      blindSpots: "Nguy cơ rơi vào cái bẫy 'Ảo tưởng đòn bẩy' mà bỏ qua kỷ luật thực thi những việc căn bản."
    },
    actionTakeaways: [
      "Kiểm toán thời gian hàng tuần: Phân loại công việc thành tác vụ 10$/giờ (Ủy quyền/Tự động hóa) và tác vụ 1000$/giờ (Tập trung tối đa).",
      "Tận dụng 4 dạng đòn bẩy hiện đại: Lập trình (Code), Nội dung (Media), Vốn (Capital) và Con người (Labor).",
      "Trước khi bắt tay làm hùng hục, hãy tự hỏi: 'Có cách nào thông minh hơn để đạt được kết quả này với 1/10 công sức không?'"
    ],
    userNotes: "Khắc cốt ghi tâm lời Naval Ravikant: 'Hãy làm việc như một con sư tử: Rình rập, suy nghĩ sâu, chạy nước rút hết tốc lực khi có cơ hội, rồi sau đó nghỉ ngơi và tái tạo năng lượng'."
  }
];

let brainChainData = {
  events: [],
  activeEventId: null,
  practiceStep: 5 // 1: A, 2: B, 3: C, 4: D, 5: Insight
};

let bcInitialized = false;

async function loadBrainChainData() {
  try {
    if (window.taskAPI && window.taskAPI.loadBrainChain) {
      const data = await window.taskAPI.loadBrainChain();
      if (data && Array.isArray(data.events) && data.events.length > 0) {
        brainChainData = data;
        return brainChainData;
      }
    }
  } catch (e) {
    console.error('Failed to load brain chain via API:', e);
  }

  const raw = localStorage.getItem('task_countdown_brain_chain');
  if (raw) {
    try {
      brainChainData = JSON.parse(raw);
      if (Array.isArray(brainChainData.events) && brainChainData.events.length > 0) {
        return brainChainData;
      }
    } catch (e) { }
  }

  // Initialize with presets if empty
  brainChainData = {
    events: JSON.parse(JSON.stringify(DEFAULT_BRAIN_CHAIN_PRESETS)),
    activeEventId: DEFAULT_BRAIN_CHAIN_PRESETS[0].id,
    practiceStep: 5
  };
  await saveBrainChainData();
  return brainChainData;
}

async function saveBrainChainData() {
  try {
    if (window.taskAPI && window.taskAPI.saveBrainChain) {
      await window.taskAPI.saveBrainChain(brainChainData);
    }
  } catch (e) {
    console.error('Failed to save brain chain via API:', e);
  }
  localStorage.setItem('task_countdown_brain_chain', JSON.stringify(brainChainData));
}

function initBrainChainTab() {
  if (bcInitialized) {
    renderBcEventList();
    if (brainChainData.activeEventId) {
      const ev = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
      if (ev) renderBcActiveEvent(ev);
    }
    return;
  }
  bcInitialized = true;

  // Search & Category Filter
  const searchInp = document.getElementById('bcSearchInput');
  if (searchInp) searchInp.addEventListener('input', () => renderBcEventList());

  const catFilter = document.getElementById('bcCategoryFilter');
  if (catFilter) catFilter.addEventListener('change', () => renderBcEventList());

  // Top action buttons
  const btnAdd = document.getElementById('btnBcAddEvent');
  if (btnAdd) btnAdd.addEventListener('click', () => openBcEventModal());

  const btnGenPrompt = document.getElementById('btnBcGenPrompt');
  if (btnGenPrompt) btnGenPrompt.addEventListener('click', () => {
    const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId) || brainChainData.events[0];
    openBcPromptModal(curEv);
  });

  const btnImportJson = document.getElementById('btnBcImportJson');
  if (btnImportJson) btnImportJson.addEventListener('click', () => openBcImportJsonModal());

  const btnPresets = document.getElementById('btnBcLoadPresets');
  if (btnPresets) btnPresets.addEventListener('click', async () => {
    if (confirm('Bạn có muốn nạp lại 6 kịch bản mẫu tinh hoa của Brain Chain?')) {
      const existingIds = new Set((brainChainData.events || []).map(x => x.id));
      const presetsToAdd = DEFAULT_BRAIN_CHAIN_PRESETS.filter(p => !existingIds.has(p.id));
      if (presetsToAdd.length === 0) {
        // Reset/overwrite presets
        brainChainData.events = JSON.parse(JSON.stringify(DEFAULT_BRAIN_CHAIN_PRESETS));
      } else {
        brainChainData.events = [...presetsToAdd, ...(brainChainData.events || [])];
      }
      brainChainData.activeEventId = brainChainData.events[0]?.id || null;
      await saveBrainChainData();
      renderBcEventList();
      if (brainChainData.activeEventId) {
        const ev = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
        if (ev) renderBcActiveEvent(ev);
      }
      if (typeof playTone === 'function') playTone(600, 0.08, 'sine', 0.1);
    }
  });

  const btnBackup = document.getElementById('btnBcBackup');
  if (btnBackup) btnBackup.addEventListener('click', () => openBcBackupModal());

  // Active workspace buttons
  const btnCopyPromptQuick = document.getElementById('btnBcCopyPromptQuick');
  if (btnCopyPromptQuick) btnCopyPromptQuick.addEventListener('click', () => {
    const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
    if (!curEv) return;
    const promptText = buildBrainChainPrompt(curEv);
    if (curEv.image && window.taskAPI && window.taskAPI.copyPromptAndImage) {
      window.taskAPI.copyPromptAndImage(promptText, curEv.image);
      if (typeof playTone === 'function') playTone(659, 0.08, 'sine', 0.15);
      alert('📋 ĐÃ SAO CHÉP PROMPT AI + HÌNH ẢNH VÀO CLIPBOARD!\n\nHãy dán (Ctrl+V) vào Gemini / ChatGPT / Claude để AI phân tích cả đề bài và biểu đồ.');
    } else {
      openBcPromptModal(curEv);
    }
  });

  const btnImportEventJson = document.getElementById('btnBcImportEventJson');
  if (btnImportEventJson) btnImportEventJson.addEventListener('click', () => openBcImportJsonModal(brainChainData.activeEventId));

  const btnEditEvent = document.getElementById('btnBcEditEvent');
  if (btnEditEvent) btnEditEvent.addEventListener('click', () => {
    const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
    if (curEv) openBcEventModal(curEv);
  });

  const btnDeleteEvent = document.getElementById('btnBcDeleteEvent');
  if (btnDeleteEvent) btnDeleteEvent.addEventListener('click', async () => {
    const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
    if (!curEv) return;
    if (confirm(`Bạn có chắc chắn muốn xóa sự kiện "${curEv.title}"?`)) {
      brainChainData.events = brainChainData.events.filter(x => x.id !== curEv.id);
      brainChainData.activeEventId = brainChainData.events[0]?.id || null;
      await saveBrainChainData();
      renderBcEventList();
      if (brainChainData.activeEventId) {
        const ev = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
        if (ev) renderBcActiveEvent(ev);
      } else {
        renderBcActiveEvent(null);
      }
      if (typeof playTone === 'function') playTone(400, 0.08, 'sine', 0.1);
    }
  });

  // Practice mode toggle & reveal button
  const btnPractice = document.getElementById('btnBcPracticeMode');
  if (btnPractice) btnPractice.addEventListener('click', () => {
    const banner = document.getElementById('bcChainPracticeBanner');
    if (!banner) return;
    if (banner.style.display === 'none' || !banner.style.display) {
      banner.style.display = 'flex';
      brainChainData.practiceStep = 1;
      btnPractice.style.background = 'var(--purple)';
      btnPractice.style.color = '#fff';
      applyBcPracticeStep();
      if (typeof playTone === 'function') playTone(650, 0.08, 'sine', 0.1);
    } else {
      banner.style.display = 'none';
      brainChainData.practiceStep = 5;
      btnPractice.style.background = 'rgba(139, 92, 246, 0.2)';
      btnPractice.style.color = '#c4b5fd';
      applyBcPracticeStep();
    }
  });

  const btnRevealNext = document.getElementById('btnBcRevealNext');
  if (btnRevealNext) btnRevealNext.addEventListener('click', () => {
    if (brainChainData.practiceStep < 5) {
      brainChainData.practiceStep++;
      applyBcPracticeStep();
      if (typeof playTone === 'function') {
        const freqs = [400, 523, 659, 784, 1046];
        playTone(freqs[brainChainData.practiceStep - 1] || 600, 0.09, 'sine', 0.15);
      }
    } else {
      alert('🎉 Chúc mừng! Bạn đã hoàn thành trọn vẹn chuỗi suy luận A ➔ B ➔ C ➔ D ➔ Insight!');
    }
  });

  // Sub-tabs switching
  const subtabBtns = document.querySelectorAll('.bc-subtab-btn');
  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subtabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetTab = btn.getAttribute('data-bc-tab');

      document.querySelectorAll('.bc-tab-content').forEach(p => p.style.display = 'none');
      if (targetTab === 'exam-breakdown') document.getElementById('bcPaneTabExamBreakdown').style.display = 'block';
      else if (targetTab === 'vocab-table') document.getElementById('bcPaneTabVocabTable').style.display = 'block';
      else if (targetTab === 'chain') document.getElementById('bcPaneTabChain').style.display = 'block';
      else if (targetTab === 'effects') document.getElementById('bcPaneTabEffects').style.display = 'block';
      else if (targetTab === 'whys') document.getElementById('bcPaneTabWhys').style.display = 'block';
      else if (targetTab === 'system') document.getElementById('bcPaneTabSystem').style.display = 'block';
      else if (targetTab === 'contrarian') document.getElementById('bcPaneTabContrarian').style.display = 'block';
      else if (targetTab === 'predictions') document.getElementById('bcPaneTabPredictions').style.display = 'block';
      else if (targetTab === 'vault') document.getElementById('bcPaneTabVault').style.display = 'block';

      if (typeof playTone === 'function') playTone(600, 0.05, 'sine', 0.08);
    });
  });

  // Question Breakdown expand/collapse buttons
  const btnExpandAll = document.getElementById('btnBcExpandAllQuestions');
  if (btnExpandAll) {
    btnExpandAll.onclick = () => {
      document.querySelectorAll('.bc-question-body').forEach(el => el.style.display = 'flex');
      document.querySelectorAll('.bc-question-toggle-icon').forEach(el => el.textContent = '▲');
      if (typeof playTone === 'function') playTone(700, 0.05, 'sine', 0.1);
    };
  }

  const btnCollapseAll = document.getElementById('btnBcCollapseAllQuestions');
  if (btnCollapseAll) {
    btnCollapseAll.onclick = () => {
      document.querySelectorAll('.bc-question-body').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.bc-question-toggle-icon').forEach(el => el.textContent = '▼');
      if (typeof playTone === 'function') playTone(450, 0.05, 'sine', 0.1);
    };
  }

  // User Notes auto-save
  const notesInput = document.getElementById('bcUserNotesInput');
  if (notesInput) {
    let noteTimer = null;
    notesInput.addEventListener('input', () => {
      const saveStatus = document.getElementById('bcNotesSaveStatus');
      if (saveStatus) saveStatus.textContent = 'Đang lưu...';
      clearTimeout(noteTimer);
      noteTimer = setTimeout(async () => {
        const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
        if (curEv) {
          curEv.userNotes = notesInput.value;
          await saveBrainChainData();
          if (saveStatus) saveStatus.textContent = 'Đã lưu ✓';
        }
      }, 500);
    });
  }

  // Setup Modals & Image Handlers
  setupBcImageHandlers();
  setupBcModals();

  // Initial render
  renderBcEventList();
  if (brainChainData.events.length > 0) {
    if (!brainChainData.activeEventId) brainChainData.activeEventId = brainChainData.events[0].id;
    const ev = brainChainData.events.find(x => x.id === brainChainData.activeEventId) || brainChainData.events[0];
    if (ev) renderBcActiveEvent(ev);
  } else {
    renderBcActiveEvent(null);
  }
}

// ----------------------------------------------------
// Brain Chain Image Helpers (Multi-image Lightbox, Copy, Paste)
// ----------------------------------------------------
let bcLightboxImages = [];
let bcLightboxCurrentIdx = 0;
let bcLightboxZoomed = false;
let bcActiveEventImageIndex = 0;

function updateBcLightboxDisplay(title = '') {
  const modal = document.getElementById('bcImageLightboxModal');
  const img = document.getElementById('bcLightboxImg');
  const titleEl = document.getElementById('bcLightboxTitle');
  const counterEl = document.getElementById('bcLightboxCounter');
  const prevBtn = document.getElementById('btnBcLightboxPrev');
  const nextBtn = document.getElementById('btnBcLightboxNext');
  const floatingPrev = document.getElementById('btnBcLightboxFloatingPrev');
  const floatingNext = document.getElementById('btnBcLightboxFloatingNext');
  const strip = document.getElementById('bcLightboxThumbnailsStrip');
  const zoomBtn = document.getElementById('btnBcLightboxZoomToggle');

  if (!modal || !img || bcLightboxImages.length === 0) return;

  if (bcLightboxCurrentIdx < 0) bcLightboxCurrentIdx = 0;
  if (bcLightboxCurrentIdx >= bcLightboxImages.length) bcLightboxCurrentIdx = bcLightboxImages.length - 1;

  const currentSrc = bcLightboxImages[bcLightboxCurrentIdx];
  img.src = currentSrc;

  if (titleEl) {
    titleEl.textContent = title || 'Xem Hình Ảnh Biểu Đồ / Đề Bài';
  }

  const hasMultiple = bcLightboxImages.length > 1;

  if (counterEl) {
    counterEl.style.display = hasMultiple ? 'inline-block' : 'none';
    counterEl.textContent = `${bcLightboxCurrentIdx + 1} / ${bcLightboxImages.length}`;
  }

  if (prevBtn) prevBtn.style.display = hasMultiple ? 'inline-flex' : 'none';
  if (nextBtn) nextBtn.style.display = hasMultiple ? 'inline-flex' : 'none';
  if (floatingPrev) floatingPrev.style.display = hasMultiple ? 'flex' : 'none';
  if (floatingNext) floatingNext.style.display = hasMultiple ? 'flex' : 'none';

  // Render thumbnail strip
  if (strip) {
    if (hasMultiple) {
      strip.style.display = 'flex';
      strip.innerHTML = '';
      bcLightboxImages.forEach((src, idx) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.style.width = '48px';
        thumb.style.height = '36px';
        thumb.style.objectFit = 'cover';
        thumb.style.borderRadius = '4px';
        thumb.style.cursor = 'pointer';
        thumb.style.transition = 'all 0.15s ease';
        thumb.style.border = idx === bcLightboxCurrentIdx ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)';
        thumb.style.opacity = idx === bcLightboxCurrentIdx ? '1' : '0.6';

        thumb.addEventListener('click', (e) => {
          e.stopPropagation();
          bcLightboxCurrentIdx = idx;
          updateBcLightboxDisplay(title);
        });
        strip.appendChild(thumb);
      });
    } else {
      strip.style.display = 'none';
    }
  }

  // Reset zoom
  bcLightboxZoomed = false;
  img.style.maxWidth = '100%';
  img.style.maxHeight = '100%';
  img.style.transform = 'scale(1)';
  img.style.cursor = 'zoom-in';
  if (zoomBtn) zoomBtn.textContent = '🔍 Zoom 100%';
}

function bcLightboxPrev() {
  if (bcLightboxImages.length <= 1) return;
  bcLightboxCurrentIdx = (bcLightboxCurrentIdx - 1 + bcLightboxImages.length) % bcLightboxImages.length;
  updateBcLightboxDisplay(document.getElementById('bcLightboxTitle')?.textContent);
  if (typeof playTone === 'function') playTone(700, 0.04, 'sine', 0.08);
}

function bcLightboxNext() {
  if (bcLightboxImages.length <= 1) return;
  bcLightboxCurrentIdx = (bcLightboxCurrentIdx + 1) % bcLightboxImages.length;
  updateBcLightboxDisplay(document.getElementById('bcLightboxTitle')?.textContent);
  if (typeof playTone === 'function') playTone(700, 0.04, 'sine', 0.08);
}

function openBcImageLightbox(imagesOrSingle, startIndex = 0, title = '') {
  const modal = document.getElementById('bcImageLightboxModal');
  if (!modal) return;

  if (Array.isArray(imagesOrSingle)) {
    bcLightboxImages = imagesOrSingle.filter(Boolean);
  } else if (imagesOrSingle) {
    bcLightboxImages = [imagesOrSingle];
  } else {
    bcLightboxImages = [];
  }

  if (bcLightboxImages.length === 0) return;

  bcLightboxCurrentIdx = Math.max(0, Math.min(startIndex, bcLightboxImages.length - 1));
  updateBcLightboxDisplay(title || 'Xem Hình Ảnh Biểu Đồ / Đề Bài');

  modal.classList.add('active');
  modal.style.display = 'flex';
  if (typeof playTone === 'function') playTone(750, 0.06, 'sine', 0.1);
}

function closeBcImageLightbox() {
  const modal = document.getElementById('bcImageLightboxModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

async function copyBcImage(imageSrc) {
  if (!imageSrc) {
    alert('Không có ảnh để sao chép!');
    return;
  }
  try {
    if (window.taskAPI && window.taskAPI.copyImage) {
      window.taskAPI.copyImage(imageSrc);
      if (typeof playTone === 'function') playTone(659, 0.08, 'sine', 0.15);
      alert('📋 ĐÃ SAO CHÉP ẢNH VÀO CLIPBOARD!');
      return;
    }
    if (imageSrc.startsWith('data:image/')) {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      if (typeof playTone === 'function') playTone(659, 0.08, 'sine', 0.15);
      alert('📋 ĐÃ SAO CHÉP ẢNH VÀO CLIPBOARD!');
    }
  } catch (err) {
    console.error('Failed to copy image:', err);
    alert('Không thể sao chép ảnh: ' + err.message);
  }
}

async function getClipboardImageData() {
  // 1. Try Native Electron clipboard
  if (window.taskAPI && window.taskAPI.readClipboardImage) {
    try {
      const dataUrl = await window.taskAPI.readClipboardImage();
      if (dataUrl) return dataUrl;
    } catch (e) {
      console.warn('taskAPI.readClipboardImage error:', e);
    }
  }

  // 2. Try Web Clipboard API
  if (navigator.clipboard && navigator.clipboard.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find(t => t.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        }
      }
    } catch (e) {
      console.warn('navigator.clipboard.read error:', e);
    }
  }
  return null;
}

async function pasteBcImageToActiveEvent() {
  const bcModal = document.getElementById('bcEventModal');
  if (bcModal && bcModal.classList.contains('active')) {
    const imageData = await getClipboardImageData();
    if (imageData) {
      if (typeof window.setBcModalImage === 'function') {
        window.setBcModalImage(imageData);
      }
      if (typeof playTone === 'function') playTone(880, 0.09, 'sine', 0.2);
      alert('🖼️ ĐÃ DÁN ẢNH VÀO MODAL CÂU HỎI MỚI THÀNH CÔNG!');
    } else {
      const fileInp = document.getElementById('bcImageFileInput');
      if (fileInp) {
        fileInp.setAttribute('data-target-mode', 'modal');
        fileInp.click();
      }
    }
    return;
  }

  const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
  if (!curEv) {
    alert('Vui lòng chọn hoặc tạo một câu hỏi / sự kiện trước khi dán ảnh!');
    return;
  }

  const imageData = await getClipboardImageData();
  if (imageData) {
    const existing = Array.isArray(curEv.images) && curEv.images.length > 0 ? curEv.images : (curEv.image ? [curEv.image] : []);
    curEv.images = [...existing, imageData];
    curEv.image = curEv.images[0];
    curEv.updatedAt = new Date().toISOString();
    await saveBrainChainData();
    renderBcActiveEvent(curEv);
    renderBcEventList();
    if (typeof playTone === 'function') playTone(880, 0.09, 'sine', 0.2);
    alert('🖼️ ĐÃ DÁN ẢNH TỪ CLIPBOARD VÀO CÂU HỎI THÀNH CÔNG!');
  } else {
    // If no image in clipboard, open file chooser
    const fileInp = document.getElementById('bcImageFileInput');
    if (fileInp) {
      fileInp.setAttribute('data-target-mode', 'active-event');
      fileInp.click();
    }
  }
}

function setupBcImageHandlers() {
  const btnPasteImage = document.getElementById('btnBcPasteImage');
  if (btnPasteImage) {
    btnPasteImage.addEventListener('click', () => pasteBcImageToActiveEvent());
  }

  const btnViewImage = document.getElementById('btnBcViewImage');
  if (btnViewImage) {
    btnViewImage.addEventListener('click', () => {
      const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
      if (curEv) {
        const imgs = Array.isArray(curEv.images) && curEv.images.length > 0 ? curEv.images : (curEv.image ? [curEv.image] : []);
        if (imgs.length > 0) {
          openBcImageLightbox(imgs, bcActiveEventImageIndex, curEv.question || curEv.title);
        }
      }
    });
  }

  const imageBadge = document.getElementById('bcEventImageBadge');
  if (imageBadge) {
    imageBadge.addEventListener('click', () => {
      const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
      if (curEv) {
        const imgs = Array.isArray(curEv.images) && curEv.images.length > 0 ? curEv.images : (curEv.image ? [curEv.image] : []);
        if (imgs.length > 0) {
          openBcImageLightbox(imgs, bcActiveEventImageIndex, curEv.question || curEv.title);
        }
      }
    });
  }

  const previewZoom = document.getElementById('btnBcImagePreviewZoom');
  if (previewZoom) {
    previewZoom.addEventListener('click', () => {
      const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
      if (curEv) {
        const imgs = Array.isArray(curEv.images) && curEv.images.length > 0 ? curEv.images : (curEv.image ? [curEv.image] : []);
        if (imgs.length > 0) {
          openBcImageLightbox(imgs, bcActiveEventImageIndex, curEv.question || curEv.title);
        }
      }
    });
  }

  const clickArea = document.getElementById('bcEventImageClickArea');
  if (clickArea) {
    clickArea.addEventListener('click', () => {
      const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
      if (curEv) {
        const imgs = Array.isArray(curEv.images) && curEv.images.length > 0 ? curEv.images : (curEv.image ? [curEv.image] : []);
        if (imgs.length > 0) {
          openBcImageLightbox(imgs, bcActiveEventImageIndex, curEv.question || curEv.title);
        }
      }
    });
  }

  const copyClipBtn = document.getElementById('btnBcImageCopyClipboard');
  if (copyClipBtn) {
    copyClipBtn.addEventListener('click', () => {
      const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
      if (curEv) {
        const imgs = Array.isArray(curEv.images) && curEv.images.length > 0 ? curEv.images : (curEv.image ? [curEv.image] : []);
        if (imgs.length > 0) {
          copyBcImage(imgs[bcActiveEventImageIndex] || imgs[0]);
        }
      }
    });
  }

  const addMoreBtn = document.getElementById('btnBcImageAddMore');
  if (addMoreBtn) {
    addMoreBtn.addEventListener('click', () => {
      const fileInp = document.getElementById('bcImageFileInput');
      if (fileInp) {
        fileInp.setAttribute('data-target-mode', 'active-event');
        fileInp.setAttribute('data-action', 'append');
        fileInp.click();
      }
    });
  }

  const replaceBtn = document.getElementById('btnBcImageReplace');
  if (replaceBtn) {
    replaceBtn.addEventListener('click', () => {
      const fileInp = document.getElementById('bcImageFileInput');
      if (fileInp) {
        fileInp.setAttribute('data-target-mode', 'active-event');
        fileInp.removeAttribute('data-action');
        fileInp.click();
      }
    });
  }

  const removeBtn = document.getElementById('btnBcImageRemove');
  if (removeBtn) {
    removeBtn.addEventListener('click', async () => {
      const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
      if (!curEv) return;
      const imgs = Array.isArray(curEv.images) && curEv.images.length > 0 ? curEv.images : (curEv.image ? [curEv.image] : []);
      if (imgs.length === 0) return;

      if (imgs.length === 1) {
        if (confirm('Bạn có chắc chắn muốn gỡ hình ảnh này khỏi câu hỏi?')) {
          delete curEv.image;
          delete curEv.images;
          curEv.updatedAt = new Date().toISOString();
          await saveBrainChainData();
          renderBcActiveEvent(curEv);
          renderBcEventList();
          if (typeof playTone === 'function') playTone(400, 0.08, 'sine', 0.1);
        }
      } else {
        const choice = confirm(`Câu hỏi đang có ${imgs.length} ảnh.\n- Bấm OK để xóa ảnh hiện tại (#${bcActiveEventImageIndex + 1})\n- Bấm Cancel để giữ nguyên`);
        if (choice) {
          imgs.splice(bcActiveEventImageIndex, 1);
          curEv.images = imgs;
          curEv.image = imgs[0] || '';
          if (bcActiveEventImageIndex >= imgs.length) bcActiveEventImageIndex = Math.max(0, imgs.length - 1);
          curEv.updatedAt = new Date().toISOString();
          await saveBrainChainData();
          renderBcActiveEvent(curEv);
          renderBcEventList();
          if (typeof playTone === 'function') playTone(400, 0.08, 'sine', 0.1);
        }
      }
    });
  }

  // File input change handler (Supports multiple files simultaneously)
  const fileInp = document.getElementById('bcImageFileInput');
  if (fileInp) {
    fileInp.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const readPromises = files.map(file => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      }));

      const base64List = (await Promise.all(readPromises)).filter(Boolean);
      if (base64List.length === 0) return;

      const bcModal = document.getElementById('bcEventModal');
      let targetMode = fileInp.getAttribute('data-target-mode') || 'active-event';
      if (bcModal && bcModal.classList.contains('active')) {
        targetMode = 'modal';
      }

      if (targetMode === 'active-event') {
        const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
        if (curEv) {
          const isAppend = fileInp.getAttribute('data-action') === 'append';
          const existing = Array.isArray(curEv.images) && curEv.images.length > 0 ? curEv.images : (curEv.image ? [curEv.image] : []);
          curEv.images = isAppend ? [...existing, ...base64List] : base64List;
          curEv.image = curEv.images[0] || '';
          curEv.updatedAt = new Date().toISOString();
          await saveBrainChainData();
          renderBcActiveEvent(curEv);
          renderBcEventList();
          if (typeof playTone === 'function') playTone(880, 0.09, 'sine', 0.2);
          alert(`🖼️ ĐÃ NẠP THÀNH CÔNG ${base64List.length} ẢNH VÀO CÂU HỎI!`);
        }
      } else if (targetMode === 'modal') {
        if (typeof window.setBcModalImage === 'function') {
          window.setBcModalImage(base64List);
        }
        if (typeof playTone === 'function') playTone(880, 0.09, 'sine', 0.2);
      }

      fileInp.value = '';
      fileInp.removeAttribute('data-action');
    });
  }

  // Lightbox modal controls
  const lightboxModal = document.getElementById('bcImageLightboxModal');
  const btnLightboxClose = document.getElementById('btnBcLightboxClose');
  if (btnLightboxClose) btnLightboxClose.addEventListener('click', () => closeBcImageLightbox());
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeBcImageLightbox();
    });
  }

  const btnLightboxPrev = document.getElementById('btnBcLightboxPrev');
  if (btnLightboxPrev) btnLightboxPrev.addEventListener('click', () => bcLightboxPrev());

  const btnLightboxNext = document.getElementById('btnBcLightboxNext');
  if (btnLightboxNext) btnLightboxNext.addEventListener('click', () => bcLightboxNext());

  const btnFloatingPrev = document.getElementById('btnBcLightboxFloatingPrev');
  if (btnFloatingPrev) btnFloatingPrev.addEventListener('click', () => bcLightboxPrev());

  const btnFloatingNext = document.getElementById('btnBcLightboxFloatingNext');
  if (btnFloatingNext) btnFloatingNext.addEventListener('click', () => bcLightboxNext());

  const btnLightboxCopy = document.getElementById('btnBcLightboxCopy');
  if (btnLightboxCopy) {
    btnLightboxCopy.addEventListener('click', () => {
      const img = document.getElementById('bcLightboxImg');
      if (img && img.src) copyBcImage(img.src);
    });
  }

  const btnLightboxZoom = document.getElementById('btnBcLightboxZoomToggle');
  const lightboxImg = document.getElementById('bcLightboxImg');
  if (btnLightboxZoom && lightboxImg) {
    const toggleZoom = () => {
      bcLightboxZoomed = !bcLightboxZoomed;
      if (bcLightboxZoomed) {
        lightboxImg.style.maxWidth = 'none';
        lightboxImg.style.maxHeight = 'none';
        lightboxImg.style.transform = 'scale(1.4)';
        lightboxImg.style.cursor = 'zoom-out';
        btnLightboxZoom.textContent = '🔍 Fit Màn Hình';
      } else {
        lightboxImg.style.maxWidth = '100%';
        lightboxImg.style.maxHeight = '100%';
        lightboxImg.style.transform = 'scale(1)';
        lightboxImg.style.cursor = 'zoom-in';
        btnLightboxZoom.textContent = '🔍 Zoom 100%';
      }
    };
    btnLightboxZoom.addEventListener('click', toggleZoom);
    lightboxImg.addEventListener('click', toggleZoom);
  }

  // Global Ctrl+V & Escape & Arrow keys listeners
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('bcImageLightboxModal');
    if (modal && modal.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeBcImageLightbox();
      } else if (e.key === 'ArrowLeft') {
        bcLightboxPrev();
      } else if (e.key === 'ArrowRight') {
        bcLightboxNext();
      }
    }
  });

  window.addEventListener('paste', async (e) => {
    const bcModal = document.getElementById('bcEventModal');
    if (bcModal && bcModal.classList.contains('active')) {
      // Modal is active: Route image paste to modal state
      const items = e.clipboardData ? e.clipboardData.items : null;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              const reader = new FileReader();
              reader.onload = (ev) => {
                if (typeof window.setBcModalImage === 'function') {
                  window.setBcModalImage(ev.target.result);
                }
                if (typeof playTone === 'function') playTone(880, 0.09, 'sine', 0.2);
              };
              reader.readAsDataURL(file);
              return;
            }
          }
        }
      }
      return;
    }

    const bcWorkspace = document.getElementById('bcActiveWorkspace');
    if (!bcWorkspace || bcWorkspace.style.display === 'none' || bcWorkspace.offsetParent === null) return;

    // Don't intercept if user is typing in input or textarea
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

    const curEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
    if (!curEv) return;

    const items = e.clipboardData ? e.clipboardData.items : null;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = async (event) => {
              const existing = Array.isArray(curEv.images) && curEv.images.length > 0 ? curEv.images : (curEv.image ? [curEv.image] : []);
              curEv.images = [...existing, event.target.result];
              curEv.image = curEv.images[0];
              curEv.updatedAt = new Date().toISOString();
              await saveBrainChainData();
              renderBcActiveEvent(curEv);
              renderBcEventList();
              if (typeof playTone === 'function') playTone(880, 0.09, 'sine', 0.2);
              alert('🖼️ ĐÃ DÁN ẢNH TỪ CLIPBOARD VÀO CÂU HỎI!');
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    }
  });
}

function renderBcEventList() {
  const listEl = document.getElementById('bcEventList');
  const countLabel = document.getElementById('bcEventCountLabel');
  if (!listEl) return;

  const searchKeyword = (document.getElementById('bcSearchInput')?.value || '').toLowerCase().trim();
  const selectedCat = document.getElementById('bcCategoryFilter')?.value || 'all';

  let filtered = (brainChainData.events || []).filter(item => {
    if (selectedCat !== 'all' && item.category !== selectedCat) return false;
    if (searchKeyword) {
      const matchTitle = (item.title || '').toLowerCase().includes(searchKeyword);
      const matchQuestion = (item.question || '').toLowerCase().includes(searchKeyword);
      const matchAnswer = (item.answer || '').toLowerCase().includes(searchKeyword);
      const matchContext = (item.context || '').toLowerCase().includes(searchKeyword);
      const matchInsight = (item.coreChain?.insight || '').toLowerCase().includes(searchKeyword);
      return matchTitle || matchQuestion || matchAnswer || matchContext || matchInsight;
    }
    return true;
  });

  if (countLabel) countLabel.textContent = `${filtered.length} Sự kiện`;
  listEl.innerHTML = '';

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 24px 10px; color: var(--muted); font-size: 12px;">
        Không tìm thấy sự kiện nào.<br>
        <button type="button" class="btn-modal" onclick="document.getElementById('btnBcAddEvent').click();" style="margin-top: 8px; font-size: 11.5px; height: 28px; padding: 0 10px; width: auto; color: #a78bfa;">➕ Thêm câu / sự kiện</button>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = `bc-event-item ${item.id === brainChainData.activeEventId ? 'active' : ''}`;

    const hasAnalysis = Boolean(item.coreChain && item.coreChain.insight);
    const statusBadge = hasAnalysis
      ? `<span class="bc-badge bc-badge-analyzed">✅ Đã phân tích</span>`
      : `<span class="bc-badge bc-badge-pending">⏳ Chờ JSON</span>`;

    const itemImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
    const imageBadgeHtml = itemImages.length > 0
      ? `<span class="bc-badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);">${itemImages.length > 1 ? `🖼️ ${itemImages.length} Ảnh` : '🖼️ Ảnh'}</span>`
      : '';

    const testNoBadgeHtml = item.testNo
      ? `<span class="bc-badge" style="background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.45);">🏷️ Đề #${escapeHtml(item.testNo)}</span>`
      : '';

    const displayTitle = item.question || item.title || 'Sự kiện không tên';
    const displaySnippet = item.answer || item.context || item.coreChain?.insight || item.coreChain?.a || 'Chưa có chi tiết...';

    itemEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 4px;">
        <div style="display: flex; align-items: center; gap: 4px; overflow: hidden; flex-wrap: wrap;">
          <span class="bc-badge bc-badge-cat">${escapeHtml(item.category || 'Chung')}</span>
          ${testNoBadgeHtml}
          ${imageBadgeHtml}
        </div>
        ${statusBadge}
      </div>
      <div style="font-weight: 700; font-size: 13px; color: #fff; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
        ${escapeHtml(displayTitle)}
      </div>
      <div style="font-size: 11.5px; color: var(--muted); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${escapeHtml(displaySnippet)}
      </div>
    `;

    itemEl.addEventListener('click', () => {
      brainChainData.activeEventId = item.id;
      bcActiveEventImageIndex = 0;
      renderBcEventList();
      renderBcActiveEvent(item);
      if (typeof playTone === 'function') playTone(700, 0.05, 'sine', 0.08);
    });

    listEl.appendChild(itemEl);
  });
}

function renderBcActiveEvent(ev) {
  const emptyState = document.getElementById('bcEmptyState');
  const activeWs = document.getElementById('bcActiveWorkspace');
  if (!emptyState || !activeWs) return;

  if (!ev) {
    emptyState.style.display = 'flex';
    activeWs.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  activeWs.style.display = 'flex';

  // Header info: Question & Answer
  const titleEl = document.getElementById('bcEventTitle');
  const catBadge = document.getElementById('bcEventCatBadge');
  const statusBadge = document.getElementById('bcEventStatusBadge');
  const imageBadge = document.getElementById('bcEventImageBadge');
  const btnViewImage = document.getElementById('btnBcViewImage');
  const imageBox = document.getElementById('bcEventImageBox');
  const imageTag = document.getElementById('bcEventImageTag');
  const imageHeaderLabel = document.getElementById('bcEventImageHeaderLabel');
  const thumbnailsStrip = document.getElementById('bcEventThumbnailsStrip');
  const contextEl = document.getElementById('bcEventContext');
  const btnCopyFullAnswer = document.getElementById('btnBcCopyFullAnswer');
  const testNoInp = document.getElementById('bcEventTestNoInput');

  const questionText = ev.question || ev.title || 'Sự kiện không tên';
  const fullAnswerText = ev.answer || ev.context || ev.coreChain?.a || ev.title || '';

  if (titleEl) titleEl.textContent = questionText;
  if (catBadge) catBadge.textContent = ev.category || 'Tiếng Anh & Speaking';

  if (testNoInp) {
    testNoInp.value = ev.testNo || ev.testNum || ev.stt || '';
    testNoInp.oninput = () => {
      ev.testNo = testNoInp.value.trim();
      saveBrainChainData();
      renderBcEventList();
    };
    const stopP = (e) => e.stopPropagation();
    testNoInp.onkeydown = stopP;
    testNoInp.onkeyup = stopP;
    testNoInp.onclick = stopP;
  }

  const hasAnalysis = Boolean(ev.coreChain && ev.coreChain.insight);
  if (statusBadge) {
    statusBadge.className = `bc-badge ${hasAnalysis ? 'bc-badge-analyzed' : 'bc-badge-pending'}`;
    statusBadge.textContent = hasAnalysis ? '✅ Đã có phân tích' : '⏳ Chưa nạp JSON AI';
  }

  // Multi-Image status and preview
  const imgs = Array.isArray(ev.images) && ev.images.length > 0 ? ev.images : (ev.image ? [ev.image] : []);
  if (imgs.length > 0) {
    if (bcActiveEventImageIndex >= imgs.length) bcActiveEventImageIndex = 0;
    if (imageBadge) {
      imageBadge.style.display = 'inline-flex';
      imageBadge.textContent = imgs.length > 1 ? `🖼️ ${imgs.length} Ảnh` : '🖼️ Ảnh';
    }
    if (btnViewImage) btnViewImage.style.display = 'inline-flex';
    if (imageBox) imageBox.style.display = 'flex';
    if (imageTag) imageTag.src = imgs[bcActiveEventImageIndex] || imgs[0];
    if (imageHeaderLabel) {
      imageHeaderLabel.textContent = imgs.length > 1
        ? `🖼️ HÌNH ẢNH / BIỂU ĐỒ ĐỀ BÀI (${imgs.length} ẢNH - #${bcActiveEventImageIndex + 1}):`
        : `🖼️ HÌNH ẢNH / BIỂU ĐỒ ĐỀ BÀI (IMAGE / CHART):`;
    }

    // Render thumbnail gallery strip when multiple images exist
    if (thumbnailsStrip) {
      if (imgs.length > 1) {
        thumbnailsStrip.style.display = 'flex';
        thumbnailsStrip.innerHTML = '';
        imgs.forEach((imgSrc, idx) => {
          const thumbWrap = document.createElement('div');
          thumbWrap.style.position = 'relative';
          thumbWrap.style.flex = 'none';
          thumbWrap.style.width = '64px';
          thumbWrap.style.height = '48px';
          thumbWrap.style.borderRadius = '5px';
          thumbWrap.style.overflow = 'hidden';
          thumbWrap.style.cursor = 'pointer';
          thumbWrap.style.border = idx === bcActiveEventImageIndex ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.15)';
          thumbWrap.style.boxShadow = idx === bcActiveEventImageIndex ? '0 0 8px rgba(245, 158, 11, 0.4)' : 'none';
          thumbWrap.style.background = '#0b1120';
          thumbWrap.title = `Bấm xem ảnh #${idx + 1}`;

          thumbWrap.innerHTML = `
            <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;" />
            <span style="position: absolute; bottom: 1px; left: 2px; background: rgba(0,0,0,0.7); color: #fbbf24; font-size: 9px; font-weight: 700; padding: 0 3px; border-radius: 2px;">#${idx + 1}</span>
          `;

          thumbWrap.addEventListener('click', (e) => {
            e.stopPropagation();
            bcActiveEventImageIndex = idx;
            renderBcActiveEvent(ev);
          });

          thumbnailsStrip.appendChild(thumbWrap);
        });
      } else {
        thumbnailsStrip.style.display = 'none';
      }
    }
  } else {
    if (imageBadge) imageBadge.style.display = 'none';
    if (btnViewImage) btnViewImage.style.display = 'none';
    if (imageBox) imageBox.style.display = 'none';
    if (imageTag) imageTag.src = '';
    if (thumbnailsStrip) thumbnailsStrip.style.display = 'none';
  }

  if (contextEl) contextEl.textContent = fullAnswerText || 'Chưa có nội dung câu trả lời... Bấm "⚡ Tạo Prompt AI" để bắt đầu phân tích logic!';

  if (btnCopyFullAnswer) {
    btnCopyFullAnswer.onclick = () => {
      const textToCopy = fullAnswerText || '';
      if (window.taskAPI && window.taskAPI.writeClipboardText) {
        window.taskAPI.writeClipboardText(textToCopy);
      } else {
        navigator.clipboard.writeText(textToCopy);
      }
      if (typeof playTone === 'function') playTone(659, 0.08, 'sine', 0.15);
      alert('📋 ĐÃ SAO CHÉP TOÀN BỘ CÂU TRẢ LỜI VÀO CLIPBOARD!');
    };
  }

  // Core Chain formatted nodes
  const nodeA = document.getElementById('bcNodeTextA');
  const nodeB = document.getElementById('bcNodeTextB');
  const nodeC = document.getElementById('bcNodeTextC');
  const nodeD = document.getElementById('bcNodeTextD');
  const nodeInsight = document.getElementById('bcNodeTextInsight');

  if (nodeA) nodeA.innerHTML = renderChainNodeContent('a', ev, fullAnswerText);
  if (nodeB) nodeB.innerHTML = renderChainNodeContent('b', ev, fullAnswerText);
  if (nodeC) nodeC.innerHTML = renderChainNodeContent('c', ev, fullAnswerText);
  if (nodeD) nodeD.innerHTML = renderChainNodeContent('d', ev, fullAnswerText);
  if (nodeInsight) nodeInsight.innerHTML = renderChainNodeContent('insight', ev, fullAnswerText);

  // Multi-order Effects
  const effImm = document.getElementById('bcEffectImmediate');
  const effSec = document.getElementById('bcEffectSecond');
  const effThird = document.getElementById('bcEffectThird');
  const effUnexp = document.getElementById('bcEffectUnexpected');
  const effLong = document.getElementById('bcEffectLongTerm');

  if (effImm) effImm.textContent = ev.causeEffects?.immediate || 'Chưa có thông tin.';
  if (effSec) effSec.textContent = ev.causeEffects?.secondOrder || 'Chưa có thông tin.';
  if (effThird) effThird.textContent = ev.causeEffects?.thirdOrder || 'Chưa có thông tin.';
  if (effUnexp) effUnexp.textContent = ev.causeEffects?.unexpected || 'Chưa có thông tin.';
  if (effLong) effLong.textContent = ev.causeEffects?.longTerm || 'Chưa có thông tin.';

  // 5 Whys
  const whyLadder = document.getElementById('bcWhyLadderList');
  if (whyLadder) {
    whyLadder.innerHTML = '';
    const whys = Array.isArray(ev.whyChain) && ev.whyChain.length > 0 ? ev.whyChain : [
      { level: "1. Triệu chứng bề mặt", question: "Tại sao câu văn mở đầu như vậy?", answer: ev.coreChain?.a || "..." },
      { level: "2. Nguyên nhân trực tiếp", question: "Tại sao lại đưa ra lý do này?", answer: ev.coreChain?.b || "..." },
      { level: "3. Nguyên nhân sâu xa", question: "Tại sao lại chọn các tính năng/chi tiết này?", answer: ev.coreChain?.c || "..." },
      { level: "4. Nguyên nhân hệ thống", question: "Cơ chế liên kết giữa các mệnh đề là gì?", answer: ev.coreChain?.d || "..." },
      { level: "5. Root Cause (Gốc rễ)", question: "Bản chất cốt lõi nằm ở đâu?", answer: ev.coreChain?.insight || "..." }
    ];

    whys.forEach((w, idx) => {
      const isRoot = idx === whys.length - 1;
      const stepDiv = document.createElement('div');
      stepDiv.className = `bc-why-step ${isRoot ? 'root-cause' : ''}`;
      stepDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11.5px; font-weight: 800; color: ${isRoot ? '#f87171' : '#38bdf8'};">${escapeHtml(w.level || `Tầng ${idx + 1}`)}</span>
          <span style="font-size: 11px; color: var(--muted); font-style: italic;">${escapeHtml(w.question || '')}</span>
        </div>
        <div style="font-size: 13.5px; color: #e2e8f0; line-height: 1.5; font-weight: ${isRoot ? '700' : '400'};">
          ${escapeHtml(w.answer || '...')}
        </div>
      `;
      whyLadder.appendChild(stepDiv);
    });
  }

  // System Dynamics
  const nodesWrap = document.getElementById('bcSystemNodesWrap');
  if (nodesWrap) {
    nodesWrap.innerHTML = '';
    const nodes = Array.isArray(ev.systemDynamics?.nodes) ? ev.systemDynamics.nodes : ['Mở đầu', 'Lý do', 'Tính năng', 'Insight'];
    nodes.forEach(n => {
      const pill = document.createElement('span');
      pill.className = 'cm-tag-pill';
      pill.style.cssText = 'background: rgba(56,189,248,0.12); color: #38bdf8; border-color: rgba(56,189,248,0.3); font-size: 11.5px; padding: 4px 10px; border-radius: 6px; font-weight: 600;';
      pill.textContent = `📍 ${n}`;
      nodesWrap.appendChild(pill);
    });
  }

  const sysDirect = document.getElementById('bcSystemDirect');
  const sysIndirect = document.getElementById('bcSystemIndirect');
  const sysFeedback = document.getElementById('bcSystemFeedback');

  if (sysDirect) sysDirect.textContent = ev.systemDynamics?.directImpact || 'Chưa có thông tin.';
  if (sysIndirect) sysIndirect.textContent = ev.systemDynamics?.indirectImpact || 'Chưa có thông tin.';
  if (sysFeedback) sysFeedback.textContent = ev.systemDynamics?.feedbackLoop || 'Chưa có thông tin.';

  // First Principles & Contrarian
  const fpBroken = document.getElementById('bcFpBroken');
  const fpTruths = document.getElementById('bcFpTruths');
  const fpLogic = document.getElementById('bcFpLogic');
  const contraFor = document.getElementById('bcContraFor');
  const contraAgainst = document.getElementById('bcContraAgainst');
  const contraSynthesis = document.getElementById('bcContraSynthesis');

  if (fpBroken) fpBroken.textContent = ev.firstPrinciples?.brokenAssumptions || 'Chưa có thông tin.';
  if (fpTruths) fpTruths.textContent = ev.firstPrinciples?.fundamentalTruths || 'Chưa có thông tin.';
  if (fpLogic) fpLogic.textContent = ev.firstPrinciples?.reconstructedLogic || 'Chưa có thông tin.';
  if (contraFor) contraFor.textContent = ev.contrarianThinking?.argFor || 'Chưa có thông tin.';
  if (contraAgainst) contraAgainst.textContent = ev.contrarianThinking?.argAgainst || 'Chưa có thông tin.';
  if (contraSynthesis) contraSynthesis.textContent = ev.contrarianThinking?.synthesis || 'Chưa có thông tin.';

  // Predictions
  const predMonth = document.getElementById('bcPredMonth');
  const predYear = document.getElementById('bcPredYear');
  const predFiveYears = document.getElementById('bcPredFiveYears');
  const predBlindSpots = document.getElementById('bcPredBlindSpots');

  if (predMonth) predMonth.textContent = ev.predictions?.oneMonth || 'Chưa có dự đoán.';
  if (predYear) predYear.textContent = ev.predictions?.oneYear || 'Chưa có dự đoán.';
  if (predFiveYears) predFiveYears.textContent = ev.predictions?.fiveYears || 'Chưa có dự đoán.';
  if (predBlindSpots) predBlindSpots.textContent = ev.predictions?.blindSpots || 'Chưa có thông tin điểm mù.';

  // Vault Insight & Action Takeaways
  const vaultInsight = document.getElementById('bcVaultGoldenInsight');
  const takeawaysList = document.getElementById('bcVaultTakeawaysList');
  const notesInput = document.getElementById('bcUserNotesInput');

  if (vaultInsight) vaultInsight.textContent = `"${ev.coreChain?.insight || 'Chưa có đúc kết insight...'}"`;

  if (takeawaysList) {
    takeawaysList.innerHTML = '';
    const items = Array.isArray(ev.actionTakeaways) && ev.actionTakeaways.length > 0
      ? ev.actionTakeaways
      : ['Khắc ghi các từ khóa trục chính của câu.', 'Luyện tập nói theo nhịp 5 bước A -> B -> C -> D -> Insight.'];

    items.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      takeawaysList.appendChild(li);
    });
  }

  if (notesInput) {
    notesInput.value = ev.userNotes || '';
  }

  // Render Question by Question breakdown & Vocab table
  renderBcQuestionsBreakdown(ev);
  renderBcVocabTable(ev);

  applyBcPracticeStep();
  setupTextSelectionSearch(document.getElementById('bcActiveWorkspace'), 'bc');
}

function renderChainNodeContent(nodeKey, ev, fullAnswerText) {
  if (!ev) return '...';
  const questions = parseQuestionsFromEvent(ev);
  const isExam = ev.category?.includes('đề thi') || ev.category?.includes('Exam') ||
    /Question\s*\d|Questions\s*\d|LISTENING|READING|Transcript|Bài làm|Map Labelling/i.test(ev.title || ev.question || '') ||
    questions.length > 0;

  const rawText = ev.coreChain ? (ev.coreChain[nodeKey] || '') : (nodeKey === 'a' ? (fullAnswerText || '') : '');

  // Check if rawText already has multiple items separated by newlines/bullets
  const lines = rawText ? rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean) : [];
  const hasMultipleItems = lines.length > 2 ||
    (lines.length >= 2 && lines.some(l => /^[-•*]|\bQ\d+[\.:\)]|\d+[\.\)]/i.test(l))) ||
    rawText.includes('\n- ') ||
    rawText.includes('\n• ') ||
    rawText.includes('\n\n- ') ||
    (/\bQ\d+[:\.\)]/i.test(rawText) && (rawText.match(/\bQ\d+[:\.\)]/gi) || []).length > 1);

  if (hasMultipleItems || !isExam || questions.length === 0) {
    if (rawText) return formatChainText(rawText);
    if (nodeKey === 'a') return formatChainText(fullAnswerText || 'Bước A: Khởi nguồn...');
    return '<span style="color: var(--muted); font-style: italic;">Chưa có phân tích...</span>';
  }

  if (nodeKey === 'insight') {
    return formatChainText(rawText || ev.coreChain?.insight || 'Chưa có đúc kết insight...');
  }

  const nodeHeaderTitles = {
    a: 'BƯỚC 1 (ĐỊNH VỊ VÙNG THÔNG TIN - EVIDENCE IN SCRIPT & MAP):',
    b: 'BƯỚC 2 (BẢNG TỪ KHÓA & PARAPHRASING MAPPING):',
    c: 'BƯỚC 3 (GIẢI THÍCH TẠI SAO ĐÁP ÁN ĐÚNG):',
    d: 'BƯỚC 4 (BẺ KHÓA BẪY & TẠI SAO CÁC PHƯƠNG ÁN KHÁC SAI):'
  };

  let html = `
    <div style="background: rgba(15, 23, 42, 0.65); border-left: 3.5px solid #38bdf8; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; font-size: 13px; line-height: 1.55; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
      <div style="font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 6px; font-size: 13px;">
        <span>📍</span> <span>${nodeHeaderTitles[nodeKey] || `BƯỚC (${nodeKey.toUpperCase()}):`}</span>
      </div>
    </div>
  `;

  html += questions.map((q, idx) => {
    const qNo = q.questionNo || `${idx + 1}`;
    const qTitle = q.questionTitle || `Câu ${qNo}`;
    let bodyContent = '';

    if (nodeKey === 'a') {
      const evText = q.evidence ? (q.evidence.startsWith('Transcript:') ? q.evidence : `Transcript: "${q.evidence}"`) : '';
      const ansText = q.correctAnswer ? ` ➔ xác định vị trí/đáp án ở ${q.correctAnswer}.` : '';
      bodyContent = `${evText}${ansText}`;
      if (!bodyContent) bodyContent = `Dẫn chứng câu hỏi ${qNo}`;
    } else if (nodeKey === 'b') {
      bodyContent = q.paraphrase ? q.paraphrase : (q.evidence ? `Đối chiếu từ khóa: ${q.evidence}` : 'Đối chiếu từ khóa trong bài.');
    } else if (nodeKey === 'c') {
      bodyContent = q.whyCorrect ? q.whyCorrect : (q.correctAnswer ? `Đáp án chính xác: ${q.correctAnswer}` : 'Phân tích logic đáp án đúng.');
    } else if (nodeKey === 'd') {
      bodyContent = q.whyIncorrect ? q.whyIncorrect : 'Loại trừ các phương án bẫy và đáp án sai.';
    }

    return `
      <div style="background: rgba(15, 23, 42, 0.65); border-left: 3.5px solid #38bdf8; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; font-size: 13px; line-height: 1.55; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
        <div style="font-weight: 700; color: #38bdf8; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; font-size: 13px;">
          <span>📍</span> <span>${escapeHtml(qTitle)} (Q${escapeHtml(qNo)}):</span>
        </div>
        <div style="color: #f1f5f9; padding-left: 2px;">${escapeHtml(bodyContent)}</div>
      </div>
    `;
  }).join('');

  return html;
}

function formatChainText(rawText) {
  if (!rawText) return '...';
  const text = String(rawText).trim();

  let items = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  if (lines.length > 1) {
    items = lines.map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  } else if (text.includes(' - ') || text.includes(' • ')) {
    items = text.split(/\s+[-•*]\s+(?=[A-Za-z0-9\(\[])/).map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
  } else if (/\d+\.\s+[A-Za-z]/.test(text) && (text.match(/\d+\.\s+[A-Za-z]/g) || []).length > 1) {
    items = text.split(/(?=\d+\.\s+[A-Za-z])/).map(s => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
  }

  if (items.length <= 1) {
    const singleMatch = text.match(/^([^:\-–]+[:\-–])\s*(.*)$/s);
    if (singleMatch && (singleMatch[1].includes('BƯỚC') || singleMatch[1].includes('STEP') || singleMatch[1].includes('📍') || singleMatch[1].includes('('))) {
      return `
        <div style="background: rgba(15, 23, 42, 0.65); border-left: 3.5px solid #38bdf8; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; font-size: 13px; line-height: 1.55; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
          <div style="font-weight: 700; color: #38bdf8; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; font-size: 13px;">
            <span>📍</span> <span>${escapeHtml(singleMatch[1].trim())}</span>
          </div>
          <div style="color: #f1f5f9; padding-left: 2px;">${escapeHtml(singleMatch[2].trim())}</div>
        </div>
      `;
    }
    return escapeHtml(text);
  }

  return items.map((item) => {
    const match = item.match(/^([^:\-–\n]+[:\-–])\s*(.*)$/s) || item.match(/^(\d+[\.\)]\s+[^:\-–\n]+[:\-–]?)\s*(.*)$/s) || item.match(/^([A-Za-z0-9\s\(\)'"-]+(?:→|->)\s*[A-Za-z0-9\s\(\)'"-]+)\s*(.*)$/s);
    if (match) {
      const headerPart = match[1].trim();
      const bodyPart = match[2] ? match[2].trim() : '';
      return `
        <div style="background: rgba(15, 23, 42, 0.65); border-left: 3.5px solid #38bdf8; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; font-size: 13px; line-height: 1.55; box-shadow: 0 2px 8px rgba(0,0,0,0.25);">
          <div style="font-weight: 700; color: #38bdf8; margin-bottom: ${bodyPart ? '4px' : '0'}; display: flex; align-items: center; gap: 6px; font-size: 13px;">
            <span>📍</span> <span>${escapeHtml(headerPart)}</span>
          </div>
          ${bodyPart ? `<div style="color: #f1f5f9; padding-left: 2px;">${escapeHtml(bodyPart)}</div>` : ''}
        </div>
      `;
    }
    return `
      <div style="background: rgba(15, 23, 42, 0.45); border-left: 3px solid rgba(167, 139, 250, 0.4); border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; font-size: 13px; line-height: 1.5; color: #f1f5f9;">
        <span style="color: #a78bfa; margin-right: 6px; font-weight: 700;">▪</span>${escapeHtml(item)}
      </div>
    `;
  }).join('');
}

function parseQuestionsFromEvent(ev) {
  if (!ev) return [];
  if (Array.isArray(ev.questionsBreakdown) && ev.questionsBreakdown.length > 0) {
    return ev.questionsBreakdown;
  }

  const rawA = ev.coreChain?.a || '';
  const rawB = ev.coreChain?.b || '';
  const rawC = ev.coreChain?.c || '';
  const rawD = ev.coreChain?.d || '';
  const rawAns = ev.answer || '';
  const rawInsight = ev.coreChain?.insight || '';

  const splitItems = (str) => {
    if (!str) return [];
    const cleaned = str.replace(/^BƯỚC\s*\d[^:]*:\s*/i, '').trim();
    if (cleaned.includes(' - ')) {
      return cleaned.split(/\s+-\s+(?=[A-Za-z0-9\(\[])/).map(s => s.trim().replace(/^-\s*/, '')).filter(Boolean);
    }
    return cleaned.split(/\r?\n/).map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  };

  const aItems = splitItems(rawA);
  const bItems = splitItems(rawB);
  const cItems = splitItems(rawC);
  const dItems = splitItems(rawD);

  const isExam = ev.category?.includes('đề thi') || ev.category?.includes('Exam') || /Question\s*\d|Questions\s*\d|LISTENING|READING|Transcript|Bài làm/i.test(ev.title || ev.question || '');

  if (aItems.length === 0 && !isExam) {
    return [];
  }

  // Answer map
  const ansMap = {};
  if (rawAns) {
    const ansParts = rawAns.split(/[|;\n]/).map(s => s.trim()).filter(Boolean);
    ansParts.forEach(p => {
      const m = p.match(/^(\d+(?:-\d+)?|\(Q\d+\)|Q\d+)[\.:\s-]+(.*)$/i);
      if (m) {
        ansMap[m[1].toLowerCase().replace(/[^\d-]/g, '')] = m[2].trim();
      }
    });
  }

  const questions = [];
  const baseItems = aItems.length > 0 ? aItems : (bItems.length > 0 ? bItems : (rawAns ? rawAns.split(/[|;\n]/).filter(Boolean) : []));

  baseItems.forEach((item, idx) => {
    let qNo = `${idx + 1}`;
    let qTitle = `Câu ${idx + 1}`;
    let qEvidence = item;

    const headerMatch = item.match(/^([^:\-–]+[:\-–])\s*(.*)$/s);
    if (headerMatch) {
      qTitle = headerMatch[1].replace(/[:\-–]/g, '').trim();
      qEvidence = headerMatch[2].trim();
      const noMatch = qTitle.match(/(?:Q|Question|Câu)\s*(\d+(?:-\d+)?)/i) || qTitle.match(/\((\d+(?:-\d+)?)\)/) || qTitle.match(/^(\d+(?:-\d+)?)/);
      if (noMatch) qNo = noMatch[1];
    }

    const bText = bItems[idx] || (bItems.find(b => b.toLowerCase().includes(qNo) || (qTitle.length > 3 && b.toLowerCase().includes(qTitle.toLowerCase()))) || '');
    const cText = cItems[idx] || (cItems.find(c => c.toLowerCase().includes(qNo) || (qTitle.length > 3 && c.toLowerCase().includes(qTitle.toLowerCase()))) || '');
    const dText = dItems[idx] || (dItems.find(d => d.toLowerCase().includes(qNo) || (qTitle.length > 3 && d.toLowerCase().includes(qTitle.toLowerCase()))) || '');
    const matchedAns = ansMap[qNo] || '';

    questions.push({
      questionNo: qNo,
      questionTitle: qTitle,
      correctAnswer: matchedAns,
      evidence: qEvidence,
      paraphrase: bText,
      whyCorrect: cText,
      whyIncorrect: dText,
      tips: rawInsight || ''
    });
  });

  return questions;
}

function renderBcQuestionsBreakdown(ev) {
  const container = document.getElementById('bcQuestionsBreakdownContainer');
  const subtabBtn = document.getElementById('bcSubtabBtnExamBreakdown');
  const countLabel = document.getElementById('bcExamQuestionsCount');
  if (!container) return;

  container.innerHTML = '';
  if (!ev) {
    if (subtabBtn) subtabBtn.style.display = 'none';
    return;
  }

  const questions = parseQuestionsFromEvent(ev);
  const isExam = ev.category?.includes('đề thi') || ev.category?.includes('Exam') || questions.length > 0;

  if (!isExam && questions.length === 0) {
    if (subtabBtn) subtabBtn.style.display = 'none';
    return;
  }

  if (subtabBtn) {
    subtabBtn.style.display = 'inline-flex';
  }

  if (countLabel) {
    countLabel.textContent = `${questions.length} câu hỏi / đề mục phân tích`;
  }

  if (questions.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--muted); background: rgba(15, 23, 42, 0.4); border-radius: 8px;">
        Chưa có câu hỏi chi tiết nào được phân tích. Hãy nạp đề thi hoặc bấm "⚡ Tạo Prompt AI" để nhận mã JSON!
      </div>
    `;
    return;
  }

  questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'bc-question-item-card';
    card.style.cssText = 'background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.3); transition: all 0.2s ease;';

    const qNo = q.questionNo || `${idx + 1}`;
    const qTitle = q.questionTitle || `Câu ${qNo}`;
    const ans = q.correctAnswer || '';
    const evidence = q.evidence || '';
    const paraphrase = q.paraphrase || '';
    const whyCorrect = q.whyCorrect || '';
    const whyIncorrect = q.whyIncorrect || '';
    const tips = q.tips || '';

    card.innerHTML = `
      <!-- Card Header -->
      <div class="bc-question-header" style="padding: 12px 16px; background: rgba(30, 41, 59, 0.6); border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span style="background: linear-gradient(135deg, #0284c7 0%, #6366f1 100%); color: #fff; font-weight: 800; font-size: 11.5px; padding: 3px 10px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(2,132,199,0.4);">
            Q${escapeHtml(qNo)}
          </span>
          <span style="font-size: 14px; font-weight: 700; color: #f8fafc;">${escapeHtml(qTitle)}</span>
          ${ans ? `<span style="background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.4); font-size: 11.5px; font-weight: 700; padding: 2px 10px; border-radius: 6px;">✅ Đáp án: ${escapeHtml(ans)}</span>` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="bc-question-toggle-icon" style="font-size: 11px; color: var(--muted); transition: transform 0.2s ease;">▲</span>
        </div>
      </div>

      <!-- Card Body -->
      <div class="bc-question-body" style="padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">
        ${evidence ? `
          <div style="background: rgba(245, 158, 11, 0.08); border-left: 3.5px solid #f59e0b; border-radius: 6px; padding: 9px 13px;">
            <div style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>📍 VÙNG CHỨA THÔNG TIN (TRANSCRIPT / EVIDENCE):</span>
            </div>
            <div style="font-size: 13px; color: #fef08a; line-height: 1.5; font-style: italic;">
              ${escapeHtml(evidence)}
            </div>
          </div>
        ` : ''}

        ${paraphrase ? `
          <div style="background: rgba(56, 189, 248, 0.08); border-left: 3.5px solid #38bdf8; border-radius: 6px; padding: 9px 13px;">
            <div style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>🔍 ĐỐI CHIẾU TỪ KHÓA & PARAPHRASE:</span>
            </div>
            <div style="font-size: 13px; color: #e0f2fe; line-height: 1.5;">
              ${escapeHtml(paraphrase)}
            </div>
          </div>
        ` : ''}

        ${whyCorrect ? `
          <div style="background: rgba(16, 185, 129, 0.08); border-left: 3.5px solid #10b981; border-radius: 6px; padding: 9px 13px;">
            <div style="font-size: 11px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>💡 TẠI SAO ĐÁP ÁN NÀY ĐÚNG:</span>
            </div>
            <div style="font-size: 13px; color: #d1fae5; line-height: 1.5;">
              ${escapeHtml(whyCorrect)}
            </div>
          </div>
        ` : ''}

        ${whyIncorrect ? `
          <div style="background: rgba(244, 63, 94, 0.08); border-left: 3.5px solid #f43f5e; border-radius: 6px; padding: 9px 13px;">
            <div style="font-size: 11px; font-weight: 800; color: #fb7185; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>⚠️ BẺ KHÓA BẪY & TẠI SAO CÁC CÂU KHÁC SAI:</span>
            </div>
            <div style="font-size: 13px; color: #ffe4e6; line-height: 1.5;">
              ${escapeHtml(whyIncorrect)}
            </div>
          </div>
        ` : ''}

        ${tips ? `
          <div style="background: rgba(139, 92, 246, 0.08); border-left: 3.5px solid #8b5cf6; border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #ddd6fe; display: flex; align-items: center; gap: 6px;">
            <span style="font-weight: 800; color: #a78bfa;">💎 Mẹo làm bài:</span> <span>${escapeHtml(tips)}</span>
          </div>
        ` : ''}
      </div>
    `;

    const headerEl = card.querySelector('.bc-question-header');
    const bodyEl = card.querySelector('.bc-question-body');
    const iconEl = card.querySelector('.bc-question-toggle-icon');
    if (headerEl && bodyEl && iconEl) {
      headerEl.onclick = () => {
        const isHidden = bodyEl.style.display === 'none';
        bodyEl.style.display = isHidden ? 'flex' : 'none';
        iconEl.textContent = isHidden ? '▲' : '▼';
      };
    }

    container.appendChild(card);
  });
}

function parseVocabAndParaphraseFromEvent(ev) {
  if (!ev) return { vocab: [], paraphrase: [], structures: [] };

  let vocab = Array.isArray(ev.vocabularyTable) ? ev.vocabularyTable : [];
  let paraphrase = Array.isArray(ev.paraphraseTable) ? ev.paraphraseTable : [];
  let structures = Array.isArray(ev.grammarStructures) ? ev.grammarStructures : [];

  // Fallback parsing for paraphrase if not in array
  if (paraphrase.length === 0) {
    const rawB = ev.coreChain?.b || '';
    const lines = rawB.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const items = lines.length > 1 ? lines : (rawB.includes(' - ') ? rawB.split(/\s+-\s+(?=[A-Za-z0-9'"`\[])/) : [rawB]);

    items.forEach(item => {
      const cleaned = item.replace(/^[-•*]\s*/, '').trim();
      const match = cleaned.match(/['"`]([^'"`]+)['"`]\s*(?:➔|↔|->|=|–)\s*['"`]([^'"`]+)['"`]\s*(?:\((.*)\)|:?\s*(.*))?/) ||
        cleaned.match(/^([^➔↔=–]+)\s*(?:➔|↔|->|=|–)\s*([^:\(]+)(?:\((.*)\)|:?\s*(.*))?/);
      if (match) {
        paraphrase.push({
          questionKeyword: match[1].trim(),
          passageEquivalent: match[2].trim(),
          explanation: (match[3] || match[4] || '').trim()
        });
      }
    });
  }

  // Fallback for vocabulary if not in array
  if (vocab.length === 0 && (ev.category?.includes('đề thi') || ev.category?.includes('Exam') || ev.title?.includes('IELTS'))) {
    const rawSynth = ev.contrarianThinking?.synthesis || '';
    if (rawSynth.includes(':')) {
      rawSynth.split('|').forEach(part => {
        const p = part.trim();
        const m = p.match(/^([^:=]+)[:=]\s*(.*)$/);
        if (m) {
          vocab.push({
            word: m[1].trim(),
            type: 'collocation',
            contextSentence: '',
            vietnameseMeaning: m[2].trim()
          });
        }
      });
    }
  }

  return { vocab, paraphrase, structures };
}

function renderBcVocabTable(ev) {
  const subtabBtn = document.getElementById('bcSubtabBtnVocabTable');
  const paraWrap = document.getElementById('bcParaphraseTableWrap');
  const vocabWrap = document.getElementById('bcVocabTableWrap');
  const structWrap = document.getElementById('bcStructuresListWrap');
  const paraBadge = document.getElementById('bcParaphraseCountBadge');
  const vocabBadge = document.getElementById('bcVocabCountBadge');

  if (!paraWrap || !vocabWrap) return;

  if (!ev) {
    if (subtabBtn) subtabBtn.style.display = 'none';
    return;
  }

  const { vocab, paraphrase, structures } = parseVocabAndParaphraseFromEvent(ev);
  const isExam = ev.category?.includes('đề thi') || ev.category?.includes('Exam') || vocab.length > 0 || paraphrase.length > 0;

  if (!isExam && vocab.length === 0 && paraphrase.length === 0) {
    if (subtabBtn) subtabBtn.style.display = 'none';
    return;
  }

  if (subtabBtn) subtabBtn.style.display = 'inline-flex';
  if (paraBadge) paraBadge.textContent = `${paraphrase.length} Cặp từ`;
  if (vocabBadge) vocabBadge.textContent = `${vocab.length} Từ vựng`;

  // 1. Render Paraphrase Table
  if (paraphrase.length > 0) {
    let html = `
      <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left;">
        <thead>
          <tr style="background: rgba(30, 41, 59, 0.8); border-bottom: 2px solid rgba(251, 191, 36, 0.3);">
            <th style="padding: 10px 12px; color: #fbbf24; font-weight: 700; width: 30%;">🔍 TỪ KHÓA TRONG ĐỀ BÀI</th>
            <th style="padding: 10px 12px; color: #34d399; font-weight: 700; width: 35%;">🎯 CỤM TỪ TRONG BÀI THI</th>
            <th style="padding: 10px 12px; color: #38bdf8; font-weight: 700; width: 35%;">💡 GIẢI THÍCH & NGỮ CẢNH</th>
          </tr>
        </thead>
        <tbody>
    `;
    paraphrase.forEach((p, idx) => {
      const bg = idx % 2 === 0 ? 'rgba(15, 23, 42, 0.4)' : 'rgba(30, 41, 59, 0.3)';
      html += `
        <tr style="background: ${bg}; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 10px 12px; color: #fde68a; font-weight: 600;">${escapeHtml(p.questionKeyword || '')}</td>
          <td style="padding: 10px 12px; color: #6ee7b7; font-weight: 600;">${escapeHtml(p.passageEquivalent || '')}</td>
          <td style="padding: 10px 12px; color: #cbd5e1; line-height: 1.45;">${escapeHtml(p.explanation || 'Đối chiếu trực tiếp')}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    paraWrap.innerHTML = html;
  } else {
    paraWrap.innerHTML = `
      <div style="padding: 16px; color: var(--muted); text-align: center; font-size: 12.5px;">
        Chưa có dữ liệu bảng Paraphrase. Hãy nạp JSON bài thi mới để xem bảng từ khóa đối chiếu!
      </div>
    `;
  }

  // 2. Render Vocabulary Table
  if (vocab.length > 0) {
    let html = `
      <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left;">
        <thead>
          <tr style="background: rgba(30, 41, 59, 0.8); border-bottom: 2px solid rgba(56, 189, 248, 0.3);">
            <th style="padding: 10px 12px; color: #38bdf8; font-weight: 700; width: 22%;">📖 TỪ VỰNG / PHRASAL VERB</th>
            <th style="padding: 10px 12px; color: #a78bfa; font-weight: 700; width: 12%;">LOẠI TỪ</th>
            <th style="padding: 10px 12px; color: #fde68a; font-weight: 700; width: 38%;">💬 CÂU GỐC TRONG BÀI THI</th>
            <th style="padding: 10px 12px; color: #34d399; font-weight: 700; width: 28%;">🇻🇳 Ý NGHĨA ANH - VIỆT</th>
          </tr>
        </thead>
        <tbody>
    `;
    vocab.forEach((v, idx) => {
      const bg = idx % 2 === 0 ? 'rgba(15, 23, 42, 0.4)' : 'rgba(30, 41, 59, 0.3)';
      const typeBadgeColor = v.type?.includes('v') ? '#f43f5e' : (v.type?.includes('adj') ? '#fbbf24' : '#a78bfa');
      html += `
        <tr style="background: ${bg}; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 10px 12px; color: #e0f2fe; font-weight: 700; font-size: 13px;">${escapeHtml(v.word || '')}</td>
          <td style="padding: 10px 12px;">
            <span style="background: rgba(255,255,255,0.08); color: ${typeBadgeColor}; border: 1px solid rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              ${escapeHtml(v.type || 'n/a')}
            </span>
          </td>
          <td style="padding: 10px 12px; color: #fef08a; font-style: italic; line-height: 1.45;">"${escapeHtml(v.contextSentence || '')}"</td>
          <td style="padding: 10px 12px; color: #a7f3d0; line-height: 1.45; font-weight: 500;">
            ${escapeHtml(v.vietnameseMeaning || v.englishMeaning || '')}
            ${v.englishMeaning && v.vietnameseMeaning ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">(${escapeHtml(v.englishMeaning)})</div>` : ''}
          </td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    vocabWrap.innerHTML = html;
  } else {
    vocabWrap.innerHTML = `
      <div style="padding: 16px; color: var(--muted); text-align: center; font-size: 12.5px;">
        Chưa có danh sách từ vựng chi tiết. Hãy nạp JSON bài thi mới để xem bảng từ vựng!
      </div>
    `;
  }

  // 3. Render Grammar Structures
  if (structWrap) {
    if (structures.length > 0) {
      let html = '';
      structures.forEach(s => {
        html += `
          <div style="background: rgba(30, 41, 59, 0.5); border-left: 3.5px solid #a78bfa; border-radius: 6px; padding: 10px 14px;">
            <div style="font-weight: 700; color: #c4b5fd; font-size: 13px; margin-bottom: 3px;">✨ ${escapeHtml(s.structure || '')}</div>
            ${s.exampleInScript ? `<div style="font-size: 12.5px; color: #fef08a; font-style: italic; margin-bottom: 2px;">Ví dụ: "${escapeHtml(s.exampleInScript)}"</div>` : ''}
            ${s.explanation ? `<div style="font-size: 12px; color: #cbd5e1;">➔ ${escapeHtml(s.explanation)}</div>` : ''}
          </div>
        `;
      });
      structWrap.innerHTML = html;
    } else {
      structWrap.innerHTML = `
        <div style="padding: 12px; color: var(--muted); text-align: center; font-size: 12px;">
          Chưa có mẫu câu ngữ pháp nào được ghi chú.
        </div>
      `;
    }
  }
}

function applyBcPracticeStep() {
  const step = brainChainData.practiceStep || 5;

  const cardB = document.getElementById('bcNodeCardB');
  const conn1 = document.getElementById('bcConnector1');
  const cardC = document.getElementById('bcNodeCardC');
  const conn2 = document.getElementById('bcConnector2');
  const cardD = document.getElementById('bcNodeCardD');
  const conn3 = document.getElementById('bcConnector3');
  const cardInsight = document.getElementById('bcNodeCardInsight');
  const conn4 = document.getElementById('bcConnector4');

  if (cardB) cardB.style.display = step >= 2 ? 'flex' : 'none';
  if (conn1) conn1.style.display = step >= 2 ? 'flex' : 'none';

  if (cardC) cardC.style.display = step >= 3 ? 'flex' : 'none';
  if (conn2) conn2.style.display = step >= 3 ? 'flex' : 'none';

  if (cardD) cardD.style.display = step >= 4 ? 'flex' : 'none';
  if (conn3) conn3.style.display = step >= 4 ? 'flex' : 'none';

  if (cardInsight) cardInsight.style.display = step >= 5 ? 'flex' : 'none';
  if (conn4) conn4.style.display = step >= 5 ? 'flex' : 'none';
}

function buildBrainChainPrompt(event) {
  const rawInput = event?.answer || event?.title || "3. Is there any technology you want to buy?\nAnswer:\nYes, I've been thinking about buying a new smartwatch. My current one is old and the battery life is terrible. I want one that can track my fitness activities, monitor my heart rate, and let me answer calls without taking out my phone. It would be a time-saving gadget.";
  const category = event?.category || "Giải thích đáp án đề thi";
  const context = event?.context || "Phân tích nguồn gốc đáp án, định vị vị trí câu chứa thông tin trong Transcript/Bài đọc, giải thích tại sao đúng và bẻ khóa bẫy đề thi.";

  // Check if mode is Exam Answer Explanation
  const isExamExplanation = category.includes('Giải thích đáp án') || category.includes('đề thi') || category.includes('Đề thi') ||
    category.includes('Exam') || /Question\s*\d|Questions\s*\d|Transcript|LISTENING|READING|WRITING|Bài làm|Task\s*\d|Label the map|Keyword Table|Choose TWO letters/i.test(rawInput);

  if (isExamExplanation) {
    return `Bạn là BẬC THẦY GIẢI ĐỀ, ĐỊNH VỊ DẪN CHỨNG & TỪ VỰNG HỌC THUẬT (EXAM MASTER, EVIDENCE DECODER & VOCABULARY EXPERT - IELTS / TOEIC / THPTQG / SAT / TOÁN / KHOA HỌC).
Nhiệm vụ của bạn là nhận toàn bộ nội dung đề bài (Bao gồm Script / Transcript nghe, Bài đọc Reading, Danh sách câu hỏi, Hình ảnh bản đồ/biểu đồ, Bài làm & Đáp án nếu có) và thực hiện BẺ KHÓA LOGIC TOÀN DIỆN:
1. ĐỊNH VỊ VÙNG CHỨA THÔNG TIN TỪNG CÂU (EVIDENCE LOCATOR): Trích dẫn từng câu chữ cụ thể trong bài đọc/transcript là nguồn gốc sinh ra đáp án.
2. TÁCH BIỆT GIẢI THÍCH CHO TỪNG CÂU HỎI (QUESTIONS BREAKDOWN): Mỗi câu hỏi có thẻ riêng với Câu hỏi, Đáp án đúng, Dẫn chứng, Paraphrase, Tại sao đúng, Bẫy nhiễu & Tại sao các câu khác sai.
3. BẢNG TỪ KHÓA & PARAPHRASING MAPPING (KEYWORD TABLE - TASK 1): Đối chiếu toàn bộ các cặp từ khóa trong câu hỏi vs các cụm từ tương đương trong bài nghe/đọc.
4. BẢNG TỪ VỰNG, THÀNH NGỮ & CỤM TỪ TRỌNG TÂM (VOCABULARY TABLE - TASK 2): Trích xuất ít nhất 8-15 từ vựng/cụm từ/phrasal verbs hay nhất trong Transcript/Bài đọc kèm loại từ (n, v, adj, adv, idiom, phrasal verb), câu gốc trong bài và nghĩa Anh - Việt.
5. CẤU TRÚC NGỮ PHÁP & MẪU CÂU ĂN ĐIỂM (KEY STRUCTURES): Trích xuất các cấu trúc hay có thể ứng dụng vào Speaking & Writing.
6. XÂU CHUỖI TOÀN BỘ VÀO SCHEMA JSON BRAIN CHAIN ĐỂ HIỂN THỊ TRỰC QUAN TRÊN ỨNG DỤNG.

🎯 NỘI DUNG ĐỀ BÀI CẦN PHÂN TÍCH & GIẢI THÍCH CHI TIẾT:
"${rawInput}"

- Lĩnh vực: ${category}
- Bối cảnh / Yêu cầu: ${context}

⛔ QUY TẮC BẮT BUỘC: TUYỆT ĐỐI KHÔNG DÙNG DẤU BA CHẤM "..." HOẶC CẮT BỚT NỘI DUNG
1. KHÔNG BAO GIỜ dùng dấu ba chấm "..." để rút gọn câu hay bỏ lửng ý trong BẤT KỲ trường nào của JSON.
2. DẪN CHỨNG ĐẦY ĐỦ 100%: Khi trích dẫn Transcript / Bài đọc, PHẢI TRÍCH ĐẦY ĐỦ CÂU NGUYÊN VĂN KHÔNG THIẾU TỪ NÀO.
3. BẢNG TỪ VỰNG & PARAPHRASE PHẢI ĐẦY ĐỦ: Liệt kê chi tiết toàn bộ các từ vựng mới và cặp paraphrase, không được viết tắt hay để trống.
4. BẮT BUỘC TÁCH RIÊNG TỪNG CÂU TRONG CORE CHAIN: Trong "coreChain" (a, b, c, d), TUYỆT ĐỐI KHÔNG VIẾT GOM CHUNG THÀNH 1 ĐOẠN VĂN TÓM TẮT. Bắt buộc phải liệt kê chi tiết từng câu theo từng gạch đầu dòng riêng biệt:
   "- [Tên câu / Khái niệm] (Q[Số câu]): [Nội dung phân tích/dẫn chứng]"
   để giao diện ứng dụng tự động chia thành các thẻ Card riêng biệt cho từng câu.

⚠️ YÊU CẦU ĐẶC BIỆT VỀ ĐỊNH DẠNG:
Hãy trả về DUY NHẤT một khối mã JSON hợp lệ (Không thêm bất kỳ lời dẫn giải hay markdown nào ngoài json) theo đúng cấu trúc schema sau:

\`\`\`json
{
  "question": "Toàn văn các câu hỏi cần giải thích kèm các lựa chọn (A, B, C, D...) hoặc yêu cầu Map Labelling",
  "title": "Tiêu đề đề bài ngắn gọn (ví dụ: [IELTS LISTENING - Croft Valley Park Map] Giải Thích Đáp Án Chi Tiết)",
  "answer": "BẢNG TỔNG HỢP ĐÁP ÁN & DẪN CHỨNG TÓM TẮT (Ghi rõ số câu + Đáp án + Trích dẫn câu gốc ngắn gọn)",
  "category": "${category}",
  "context": "Giải mã chi tiết vùng chứa đáp án, bảng từ khóa đồng nghĩa (Keyword Mapping) và bảng từ vựng học thuật.",
  "questionsBreakdown": [
    {
      "questionNo": "1",
      "questionTitle": "Tên câu hỏi (ví dụ: Cafe)",
      "correctAnswer": "Đáp án đúng (ví dụ: D - Next to old museum & overlooking the lake)",
      "evidence": "Transcript: 'The cafe continues to serve and is still in the same place, looking out over the lake and next to the old museum.'",
      "paraphrase": "Next to old museum ➔ vị trí liền kề bảo tàng cũ; looking out over the lake ➔ nhìn thẳng ra hồ nước",
      "whyCorrect": "Trên bản đồ, điểm D thỏa mãn cả 2 điều kiện: cạnh bảo tàng cũ và nhìn ra hồ.",
      "whyIncorrect": "Các vị trí khác không tiếp giáp đồng thời với cả bảo tàng và hồ.",
      "tips": "Bắt 2 mốc định vị không gian: 'lake' và 'old museum'."
    }
  ],
  "paraphraseTable": [
    {
      "questionKeyword": "No payment is required",
      "passageEquivalent": "entrance is completely free",
      "explanation": "Đồng nghĩa trực tiếp: miễn phí vé vào = không cần thanh toán"
    },
    {
      "questionKeyword": "Children must be supervised",
      "passageEquivalent": "do ask adults not to leave them on their own",
      "explanation": "Không để trẻ em ở một mình = trẻ phải có người lớn giám sát"
    },
    {
      "questionKeyword": "They are closed at weekends",
      "passageEquivalent": "open Mondays to Thursdays, hoped to extend to weekend soon",
      "explanation": "Hiện tại chỉ mở T2-T4 và hy vọng mở cuối tuần sau này = cuối tuần hiện đang đóng cửa"
    },
    {
      "questionKeyword": "They were badly damaged by fire",
      "passageEquivalent": "damage following the disastrous fire that destroyed western side",
      "explanation": "disastrous fire destroyed = badly damaged by fire"
    }
  ],
  "vocabularyTable": [
    {
      "word": "chair",
      "type": "n",
      "contextSentence": "As chair of the town council subcommittee on park facilities,...",
      "englishMeaning": "the person in charge of a meeting or committee",
      "vietnameseMeaning": "chủ tịch / người chủ trì cuộc họp hoặc ủy ban"
    },
    {
      "word": "hand out",
      "type": "phrasal verb",
      "contextSentence": "So if you could just take a look at the map I handed out,...",
      "englishMeaning": "to distribute to a group of people",
      "vietnameseMeaning": "phát tài liệu, phân phát cho mọi người"
    },
    {
      "word": "look out over",
      "type": "phrasal verb",
      "contextSentence": "The cafe continues to serve and is still in the same place, looking out over the lake...",
      "englishMeaning": "to have a view of something from above or opposite",
      "vietnameseMeaning": "có tầm nhìn hướng thẳng ra (hồ nước, phong cảnh)"
    },
    {
      "word": "out of the way",
      "type": "idiom / adj",
      "contextSentence": "as they're a bit out of the way at present",
      "englishMeaning": "far from the center, difficult to reach",
      "vietnameseMeaning": "hẻo lánh, ở góc xa, khuất lối đi"
    },
    {
      "word": "in constant use",
      "type": "collocation",
      "contextSentence": "It's in constant use during the evenings and holidays...",
      "englishMeaning": "being used all the time continuously",
      "vietnameseMeaning": "được sử dụng liên tục không ngừng"
    },
    {
      "word": "lead off (from)",
      "type": "phrasal verb",
      "contextSentence": "at the end of a little path that leads off from the main path",
      "englishMeaning": "to start at a place and go in a particular direction / branch off",
      "vietnameseMeaning": "rẽ nhánh từ đường chính, bắt nguồn từ"
    },
    {
      "word": "let off steam",
      "type": "idiom",
      "contextSentence": "We were aware that we had nowhere for children to let off steam,...",
      "englishMeaning": "to get rid of excess energy, stress, or strong emotions",
      "vietnameseMeaning": "xả năng lượng, vui chơi giải tỏa căng thẳng"
    },
    {
      "word": "year-round",
      "type": "adj / adv",
      "contextSentence": "It's open year-round, though it closes early in the winter months",
      "englishMeaning": "operating throughout the entire year",
      "vietnameseMeaning": "quanh năm, suốt cả năm"
    },
    {
      "word": "disastrous fire",
      "type": "collocation",
      "contextSentence": "repair the damage following the disastrous fire that recently destroyed their western side",
      "englishMeaning": "a destructive fire causing huge damage",
      "vietnameseMeaning": "vụ hỏa hoạn thảm khốc tàn phá nặng nề"
    },
    {
      "word": "tropical palm trees",
      "type": "n",
      "contextSentence": "the collection of tropical palm trees has proved too expensive to replace up to now",
      "englishMeaning": "palm trees from tropical regions",
      "vietnameseMeaning": "bộ sưu tập cây cọ nhiệt đới"
    }
  ],
  "grammarStructures": [
    {
      "structure": "S + used to + V (inf) ..., but now / at present + S + V ...",
      "exampleInScript": "They used to be behind the old museum, but we’re now used the space near the south gate...",
      "explanation": "Cấu trúc tương phản giữa thói quen/vị trí trong quá khứ và hiện tại (rất hay gặp trong IELTS Speaking & Listening)."
    },
    {
      "structure": "prove + adj / to be + adj (Chứng tỏ là / Hóa ra là)",
      "exampleInScript": "the collection of tropical palm trees has proved too expensive to replace up to now.",
      "explanation": "Diễn đạt một kết luận hoặc thực tế sau khi đã trải nghiệm hoặc đánh giá chi phí."
    },
    {
      "structure": "ask / require + somebody + not to + V (Yêu cầu ai không làm gì)",
      "exampleInScript": "we do ask adults not to leave them on their own there.",
      "explanation": "Mẫu câu quy định lịch sự nhưng mang tính bắt buộc (đồng nghĩa với 'must be supervised')."
    }
  ],
  "coreChain": {
    "a": "BƯỚC 1 (ĐỊNH VỊ VÙNG THÔNG TIN - EVIDENCE IN SCRIPT & MAP):\\n\\n- [Tên câu 1] (Q1): Transcript: \\\"[Trích dẫn chính xác 100% câu thoại trong Transcript chứa đáp án]\\\" ➔ [Xác định vị trí trên bản đồ hoặc dẫn chứng bài đọc]\\n\\n- [Tên câu 2] (Q2): Transcript: \\\"[Trích dẫn chính xác 100% câu thoại]\\\" ➔ [Dấu hiệu vị trí]\\n\\n(Bắt buộc liệt kê đầy đủ 100% tất cả các câu từ Q1 đến hết, mỗi câu 1 gạch đầu dòng riêng biệt)",
    "b": "BƯỚC 2 (BẢNG TỪ KHÓA & PARAPHRASING MAPPING):\\n\\n- [Tên câu 1] (Q1): '[Từ khóa đề bài]' ↔ '[Cụm từ tương đương trong bài]' (Giải thích paraphrase chi tiết)\\n\\n- [Tên câu 2] (Q2): '[Từ khóa đề bài]' ↔ '[Cụm từ tương đương]'\\n\\n(Bắt buộc liệt kê đầy đủ 100% tất cả các câu từ Q1 đến hết, mỗi câu 1 gạch đầu dòng riêng biệt)",
    "c": "BƯỚC 3 (GIẢI THÍCH TẠI SAO ĐÁP ÁN ĐÚNG):\\n\\n- [Tên câu 1] (Q1 - Đáp án X): [Phân tích logic lập luận chi tiết vì sao đáp án X hoàn toàn đúng khớp với dẫn chứng]\\n\\n- [Tên câu 2] (Q2 - Đáp án Y): [Phân tích logic tại sao đúng]\\n\\n(Bắt buộc liệt kê đầy đủ 100% tất cả các câu từ Q1 đến hết, mỗi câu 1 gạch đầu dòng riêng biệt)",
    "d": "BƯỚC 4 (BẺ KHÓA BẪY & TẠI SAO CÁC PHƯƠNG ÁN KHÁC SAI):\\n\\n- [Tên câu 1] (Q1): [Chỉ rõ vì sao các phương án nhiễu bị loại bỏ - ví dụ: bẫy 'used to be' (trước đây) vs 'now' (hiện tại), bẫy phủ định ngầm]\\n\\n- [Tên câu 2] (Q2): [Phân tích bẫy và các phương án sai]\\n\\n(Bắt buộc liệt kê đầy đủ 100% tất cả các câu từ Q1 đến hết, mỗi câu 1 gạch đầu dòng riêng biệt)",
    "insight": "BƯỚC 5 (INSIGHT & QUY LUẬT LÀM ĐỀ ĐỈNH CAO):\\n\\n- Quy luật ra đề của giám khảo: Luôn bắt ít nhất 2 mốc định vị không gian để khóa chặt vị trí.\\n- Bẫy kinh điển: Chú ý thì quá khứ 'used to be' và liên từ tương phản 'but/now/actually'.\\n- Chiến thuật 3 giây: Đọc quét từ khóa trước ➔ Bắt mốc định vị ➔ Nhận diện paraphrase ➔ Chốt đáp án."
  },
  "causeEffects": {
    "immediate": "Tín hiệu nghe / đọc đầu tiên (Signposting words / Keyword cue) xuất hiện báo hiệu người nói đang chuyển sang câu hỏi.",
    "secondOrder": "Cách người ra đề đưa ra thông tin nhiễu để bẫy thí sinh thiếu tập trung (Distractor shift).",
    "thirdOrder": "Câu chốt hạ then chốt khẳng định đáp án chính xác không thể bàn cãi.",
    "unexpected": "Bẫy tinh vi nhất trong bài thi khiến đa số thí sinh bị mất điểm oan.",
    "longTerm": "Kỹ năng định vị dẫn chứng (Scan & Skim, Listening for Signal Words) giúp tăng điểm tuyệt đối cho các đề thi sau."
  },
  "whyChain": [
    { "level": "1. Vị trí dẫn chứng", "question": "Thông tin câu hỏi này nằm ở đâu trong bài?", "answer": "Trích dẫn chính xác đoạn văn hoặc câu thoại trong Transcript mang thông tin cốt lõi." },
    { "level": "2. Kỹ thuật Paraphrase", "question": "Từ khóa trong đề được biến đổi (paraphrase) như thế nào?", "answer": "Phân tích các cặp từ đồng nghĩa, cấu trúc hoán đổi chủ động - bị động hoặc giải nghĩa tương đương." },
    { "level": "3. Logic đáp án đúng", "question": "Tại sao đáp án này là lựa chọn chính xác duy nhất?", "answer": "Chứng minh sự tương thích 100% giữa đáp án và ngữ nghĩa của câu dẫn chứng." },
    { "level": "4. Cơ chế bẫy nhiễu", "question": "Người ra đề đã thiết kế các bẫy sai (distractors) như thế nào?", "answer": "Phân tích cụ thể lý do từng phương án sai (đối tượng khác, sai mốc thời gian, bị phủ định, thông tin sai sự thật)." },
    { "level": "5. Root Rule (Quy luật gốc)", "question": "Quy luật cốt lõi của dạng câu hỏi này trong kỳ thi là gì?", "answer": "Đúc kết nguyên tắc thiết kế đề của Cambridge / ETS và công thức ăn trọn điểm." }
  ],
  "whatIf": {
    "scenario": "Nếu thí sinh chỉ nghe bắt âm trùng lặp (Keyword matching trap) mà không chú ý từ nối phủ định hoặc thì của động từ:",
    "consequences": [
      "Sẽ chọn ngay phương án bẫy được nhắc tới đầu tiên trước khi người nói đổi ý.",
      "Bị nhầm lẫn giữa vị trí cũ (used to be) và vị trí mới hiện tại (now used the space).",
      "Mất điểm ở các câu hỏi phủ định ngầm hoặc các câu yêu cầu chọn 2 đáp án (Choose TWO letters)."
    ]
  },
  "systemDynamics": {
    "nodes": ["Từ Khóa Đề Bài", "Mốc Định Vị (Landmarks)", "Từ Đồng Nghĩa (Paraphrase)", "Dẫn Chứng Gốc", "Đáp Án Chính Xác"],
    "directImpact": "Mối liên kết trực tiếp giữa từ khóa trong câu hỏi và vị trí câu thoại trong bài nghe/đọc.",
    "indirectImpact": "Các liên từ chuyển ý (However, But, Actually, At present) điều hướng luồng thông tin thật.",
    "feedbackLoop": "Quy trình giải đề đỉnh cao: Đọc quét từ khóa ➔ Bắt mốc định vị ➔ Nhận diện tín hiệu chuyển ý ➔ Đối chiếu Paraphrase ➔ Loại trừ bẫy ➔ Chốt đáp án đúng 100%."
  },
  "firstPrinciples": {
    "brokenAssumptions": "Giả định sai lầm: Nghe thấy từ nào giống hệt trong đề là chọn từ đó (Bẫy trùng âm 90% là distractor).",
    "fundamentalTruths": "Sự thật nguyên lý gốc: Đề thi quốc tế đo lường năng lực hiểu bản chất ngữ nghĩa và nhận diện Paraphrasing, không đo lường khả năng bắt âm vô thức.",
    "reconstructedLogic": "Chiến thuật chuẩn: Nghe hiểu ý niệm toàn câu + Bắt cặp từ đồng nghĩa + Luôn cảnh giác với các từ nối tương phản 'but/though/actually'."
  },
  "contrarianThinking": {
    "argFor": "Luận điểm chứng minh đáp án đúng là hoàn toàn không thể tranh cãi dựa trên dẫn chứng Transcript/Bài đọc.",
    "argAgainst": "Phân tích lý do tâm lý khiến nhiều thí sinh bị đánh lừa bởi phương án nhiễu.",
    "conditions": "Điều kiện tuyệt đối để khẳng định một đáp án là chính xác (phải thỏa mãn đủ các ràng buộc trong câu hỏi).",
    "exceptions": "Các trường hợp người nói tự đính chính thông tin (Self-correction) cần đặc biệt lưu ý.",
    "synthesis": "Bảng từ vựng & Cụm từ học thuật trọng tâm (Vocabulary & Collocations Table) cần học thuộc từ đề bài."
  },
  "predictions": {
    "oneMonth": "Thuộc làu toàn bộ từ vựng và bảng Paraphrase của bài thi này.",
    "oneYear": "Phản xạ nhận diện bẫy đề thi trong vòng 3 giây, đạt điểm số mục tiêu (Band 8.0+ / 900+ TOEIC / 9+ THPTQG).",
    "fiveYears": "Năng lực đọc hiểu và nghe phân tích thông tin quốc tế chuẩn xác, không bao giờ bị dắt mũi bởi thông tin nhiễu.",
    "blindSpots": "Cần chú ý hiện tượng nối âm, nuốt âm (connected speech) và các từ định lượng (only, all, some, never)."
  },
  "actionTakeaways": [
    "Luôn gạch chân từ khóa và dự đoán trước từ đồng nghĩa (Paraphrase) trước khi nghe/đọc.",
    "Chú ý các mốc định vị không gian (North/South, next to, opposite, between, bend in the path) khi làm bài dạng Map.",
    "Lập Bảng từ khóa (Keyword Table) sau mỗi lần giải đề để tích lũy kho từ vựng phản xạ."
  ]
}
\`\`\`
`;
  }

  // Check if rawInput or category is English or sentence memorization
  const isEnglishOrSentence = category.includes('Tiếng Anh') || category.includes('Speaking') ||
    /[a-zA-Z]{4,}\s+[a-zA-Z]{2,}\s+[a-zA-Z]{3,}/.test(rawInput) || rawInput.length > 50;

  if (isEnglishOrSentence) {
    return `Bạn là BẬC THẦY TƯ DUY HỆ THỐNG, SUY LUẬN LOGIC & PHƯƠNG PHÁP GHI NHỚ TIẾNG ANH (LOGIC MEMORY MASTER).
Nhiệm vụ của bạn là áp dụng phương pháp "BRAIN CHAIN" (Chuỗi Tư Duy Đa Tầng) để phân rã câu/đoạn văn dưới đây thành một CHUỖI LOGIC LIÊN KHOÁ (A ➔ B ➔ C ➔ D ➔ INSIGHT), giúp người học HIỂU SÂU BẢN CHẤT, THUỘC LÒNG TRONG 10 GIÂY VÀ PHẢN XẠ NÓI TỰ NHIÊN.

🎯 NỘI DUNG ĐẦU VÀO CẦN PHÂN TÍCH (Bao gồm cả câu hỏi & câu trả lời nếu có):
"${rawInput}"

- Lĩnh vực: ${category}
- Bối cảnh / Mục tiêu: ${context}

⛔ QUY TẮC BẮT BUỘC: TUYỆT ĐỐI KHÔNG DÙNG DẤU BA CHẤM "..." HOẶC CẮT BỚT NỘI DUNG
1. KHÔNG BAO GIỜ dùng dấu ba chấm "..." để rút gọn câu, ngắt câu hay bỏ lửng ý trong BẤT KỲ trường nào.
2. TRÍCH DẪN ĐẦY ĐỦ 100%: Trong các bước "coreChain" (a, b, c, d, insight), khi trích dẫn câu tiếng Anh, PHẢI TRÍCH ĐẦY ĐỦ TOÀN BỘ CÂU CHỮ NGUYÊN VĂN KHÔNG THIẾU TỪ NÀO, tuyệt đối không được dùng "..." để nối hoặc bỏ bớt đoạn giữa/cuối câu.
3. Mọi câu phân tích logic, 5 Whys, Cause-Effects, First Principles PHẢI viết hoàn chỉnh, rõ ràng và kết thúc bằng dấu chấm câu rõ ràng.

# NGUYÊN TẮC BẺ KHÓA LOGIC (BRAIN CHAIN FOR SENTENCES):
1. NHẬN DIỆN & TÁCH BẠCH:
   - Nếu nội dung chứa cả Câu hỏi và Câu trả lời: Hãy tách riêng câu hỏi vào trường "question", toàn bộ câu trả lời gốc nguyên vẹn vào trường "answer".
   - Nếu chỉ có 1 câu/đoạn văn: Đặt câu/đoạn đó vào cả "title" và "answer".
2. CORE CHAIN (A ➔ B ➔ C ➔ D ➔ INSIGHT): Phân rã câu trả lời thành 5 mắt xích theo dòng tư duy tự nhiên:
   - A: Khởi nguồn & Lựa chọn / Ý định ban đầu (Mở đầu trực diện)
   - B: Lý do thứ nhất & Điểm đau / Vấn đề hiện tại (Tại sao lại nghĩ như vậy?)
   - C: Chuyển ý & Tính năng / Kỳ vọng mong muốn (Nhu cầu cốt lõi 1 & 2)
   - D: Minh họa mở rộng & Tác vụ tiện ích thực tế (Nhu cầu mở rộng)
   - INSIGHT: Kết luận đúc kết chốt hạ giá trị toàn câu.
3. 5 WHYS ROOT CAUSE: Đào sâu lý do đằng sau cách diễn đạt (Tại sao mở đầu như vậy? Tại sao dùng từ nối đó? Tại sao lại chốt câu như vậy?).
4. FIRST PRINCIPLES: Chỉ ra nguyên lý giao tiếp gốc và điểm neo tư duy cốt lõi.
5. ACTION TAKEAWAYS: 3 Điểm tựa ghi nhớ (Mnemonic Anchors) & quy tắc phản xạ trong 3 giây.

⚠️ YÊU CẦU ĐẶC BIỆT VỀ ĐỊNH DẠNG:
Hãy trả về DUY NHẤT một khối mã JSON hợp lệ (Không thêm bất kỳ lời dẫn giải hay markdown nào ngoài json) theo đúng cấu trúc schema sau:

\`\`\`json
{
  "question": "Câu hỏi đầy đủ nếu có",
  "title": "Tiêu đề ngắn gọn hoặc câu hỏi",
  "answer": "Toàn văn câu trả lời tiếng Anh đầy đủ nguyên vẹn 100% không bị cắt",
  "category": "${category}",
  "context": "${context}",
  "coreChain": {
    "a": "BƯỚC 1 (A - Khởi điểm & Ý định): [Trích trọn vẹn mệnh đề 1 tiếng Anh đầy đủ không dùng dấu ba chấm] - [Phân tích logic tiếng Việt trọn vẹn]",
    "b": "BƯỚC 2 (B - Lý do & Vấn đề hiện tại): [Trích trọn vẹn mệnh đề 2 tiếng Anh đầy đủ không dùng dấu ba chấm] - [Phân tích logic tiếng Việt trọn vẹn]",
    "c": "BƯỚC 3 (C - Nhu cầu tính năng): [Trích trọn vẹn mệnh đề 3 tiếng Anh đầy đủ không dùng dấu ba chấm] - [Phân tích logic tiếng Việt trọn vẹn]",
    "d": "BƯỚC 4 (D - Tính năng tiện ích mở rộng): [Trích trọn vẹn mệnh đề 4 tiếng Anh đầy đủ không dùng dấu ba chấm] - [Phân tích logic tiếng Việt trọn vẹn]",
    "insight": "BƯỚC 5 (INSIGHT - Đúc kết giá trị): [Trích trọn vẹn câu kết luận tiếng Anh đầy đủ] - [Nhận thức cốt lõi tiếng Việt]"
  },
  "causeEffects": {
    "immediate": "Tác động tức thì của ý tưởng mở đầu khi người nghe tiếp nhận.",
    "secondOrder": "Hệ quả logic tiếp theo khi mở rộng luận điểm chính.",
    "thirdOrder": "Sự cân bằng khi bổ sung góc nhìn phản biện hoặc đối lập.",
    "unexpected": "Hệ quả bất ngờ và điểm sáng tạo trong cách lập luận.",
    "longTerm": "Lợi ích dài hạn giúp người học làm chủ phản xạ tư duy tự nhiên khi nói."
  },
  "whyChain": [
    { "level": "1. Triệu chứng bề mặt", "question": "Tại sao câu văn mở đầu bằng cấu trúc này?", "answer": "Giải thích logic ngữ dụng và cách tạo ấn tượng tự nhiên cho người nghe." },
    { "level": "2. Nguyên nhân trực tiếp", "question": "Tại sao lại chọn ý thứ nhất để phát triển?", "answer": "Giải thích tính trực tiếp và tiện ích của ý thứ nhất trong ngữ cảnh." },
    { "level": "3. Nguyên nhân sâu xa", "question": "Tại sao cần bổ sung ý tương phản hoặc tính năng mới?", "answer": "Giải thích vai trò của góc nhìn đa chiều trong giao tiếp học thuật." },
    { "level": "4. Nguyên nhân hệ thống", "question": "Cơ chế liên kết giữa các mệnh đề là gì?", "answer": "Phân tích mạch tư duy nguyên nhân, kết quả và bổ trợ ý." },
    { "level": "5. Root Cause (Gốc rễ)", "question": "Bản chất cốt lõi của thông điệp là gì?", "answer": "Đúc kết triết lý sống hoặc thông điệp giá trị cao nhất của câu." }
  ],
  "whatIf": {
    "scenario": "Nếu đảo ngược hoàn toàn thứ tự hoặc bỏ đi mệnh đề chuyển ý thì mạch văn sẽ bị mất tự nhiên.",
    "consequences": [
      "Lập luận trở nên một chiều và thiếu tính thuyết phục.",
      "Mất đi nhịp điệu tự nhiên của người bản xứ.",
      "Người nghe không thấy được bức tranh toàn diện."
    ]
  },
  "systemDynamics": {
    "nodes": ["Từ Khóa Trục 1", "Từ Khóa Trục 2", "Liên Từ Chuyển Ý", "Ví Dụ Minh Họa", "Kết Luận Insight"],
    "directImpact": "Tác động trực tiếp đến sự rõ ràng và mạch lạc trong cấu trúc diễn đạt.",
    "indirectImpact": "Tác động gián tiếp giúp não bộ ghi nhớ siêu nhanh nhờ các điểm neo ngữ nghĩa.",
    "feedbackLoop": "Vòng lặp phản xạ: Càng hiểu rõ logic liên kết ➔ Càng nói trôi chảy không cần dịch nhẩm ➔ Tự tin mở rộng thêm ý mới."
  },
  "firstPrinciples": {
    "brokenAssumptions": "Giả định sai: Học thuộc câu tiếng Anh là phải học vẹt từng từ riêng lẻ.",
    "fundamentalTruths": "Sự thật gốc: Bộ não con người ghi nhớ bằng dòng chảy nhân quả và hình ảnh logic, không nhớ các chuỗi ký tự vô nghĩa.",
    "reconstructedLogic": "Thay vì học vẹt, xâu chuỗi các mệnh đề thành sợi dây nhân quả A ➔ B ➔ C ➔ D ➔ Insight để não tự động sinh từ."
  },
  "contrarianThinking": {
    "argFor": "Lập luận ủng hộ: Cách diễn đạt này mạch lạc, tự nhiên và đáp ứng chuẩn tiêu chí chấm điểm.",
    "argAgainst": "Lập luận phản biện: Trong các bối cảnh trang trọng tuyệt đối, một số từ lóng hoặc từ nối thân mật cần được thay thế.",
    "conditions": "Điều kiện để áp dụng mẫu câu và logic này hiệu quả nhất khi giao tiếp.",
    "exceptions": "Các tình huống ngoại lệ cần thay đổi sắc thái từ ngữ cho phù hợp ngữ cảnh.",
    "synthesis": "Đúc kết cách tùy biến linh hoạt cho mọi chủ đề tương tự."
  },
  "predictions": {
    "oneMonth": "Thuộc lòng và phản xạ trơn tru câu này trong vòng 3 giây khi được hỏi.",
    "oneYear": "Tự động áp dụng khung logic này để trả lời hàng trăm câu hỏi Speaking khác.",
    "fiveYears": "Hình thành tư duy phản biện và diễn đạt song ngữ tự nhiên như người bản xứ.",
    "blindSpots": "Lưu ý ngữ điệu và điểm nhấn trọng âm để tránh đọc ngang như robot."
  },
  "actionTakeaways": [
    "Khắc ghi các từ khóa trục chính của câu theo đúng mạch logic.",
    "Luyện tập nói câu theo nhịp thở của 5 mắt xích từ A đến Insight.",
    "Áp dụng cấu trúc logic này để tự tạo một câu tương tự cho chủ đề khác."
  ]
}
\`\`\``;
  }

  // General Business / Life Event prompt
  const safeTitle = (rawInput.length > 80 ? rawInput.substring(0, 80) : rawInput).replace(/"/g, "'");
  return `Bạn là BẬC THẦY TƯ DUY HỆ THỐNG & SUY LUẬN LOGIC (SYSTEMS THINKER & LOGIC MASTER).
Nhiệm vụ của bạn là áp dụng phương pháp "BRAIN CHAIN" (Chuỗi Tư Duy Đa Tầng) để phân tích toàn diện sự kiện/hiện tượng dưới đây.

🎯 SỰ KIỆN CẦN PHÂN TÍCH:
- Nội dung: "${rawInput}"
- Lĩnh vực: ${category}
- Bối cảnh: ${context}

⛔ QUY TẮC BẮT BUỘC: TUYỆT ĐỐI KHÔNG DÙNG DẤU BA CHẤM "..." HOẶC CẮT BỚT NỘI DUNG
1. KHÔNG BAO GIỜ sử dụng dấu ba chấm "..." trong BẤT KỲ trường nào của JSON.
2. Mọi phân tích, lập luận, hệ quả và nguyên nhân PHẢI VIẾT ĐẦY ĐỦ 100% TỪNG CÂU CHỮ HOÀN CHỈNH, kết thúc bằng dấu chấm rõ ràng.

# NGUYÊN TẮC CỐT LÕI CỦA BRAIN CHAIN:
1. CORE LOOP: Từ một thứ -> suy ra thứ khác -> tiếp tục suy ra thứ khác -> cuối cùng tạo thành một Insight sắc bén (A -> B -> C -> D -> INSIGHT).
2. CAUSE -> MULTI-ORDER EFFECTS: Tác động tức thì -> Hệ quả bậc hai -> Hệ quả bậc ba -> Hệ quả ngoài dự kiến -> Hệ quả dài hạn 1-3 năm.
3. 5 WHYS ROOT CAUSE: Đào sâu qua 5 tầng: Triệu chứng -> Nguyên nhân trực tiếp -> Nguyên nhân sâu xa -> Nguyên nhân hệ thống -> Root Cause gốc rễ.
4. WHAT IF & EXTREMES: Tình huống giả định đảo ngược và 3 hệ quả phi trực giác mà người bình thường ít nghĩ tới.
5. SYSTEM THINKING: Xác định các Node thành tố, tác động trực tiếp, tác động gián tiếp và Feedback Loop (vòng lặp phản hồi).
6. FIRST PRINCIPLES: Phá vỡ giả định sai lầm ngầm định, tìm ra sự thật nền tảng và tái cấu trúc lại logic giải pháp.
7. CONTRARIAN THINKING: Lập luận ủng hộ (Tại sao đúng?) vs Lập luận phản biện (Tại sao có thể sai?) -> Điều kiện đúng -> Ngoại lệ -> Kết luận tổng hợp đa chiều (Tránh tư duy nhị nguyên trắng/đen).
8. PREDICTIONS: Dự đoán 1 tháng, 1 năm, 5 năm và chỉ ra các Điểm mù (Blind spots) cần kiểm chứng.
9. GOLDEN INSIGHT & ACTION TAKEAWAYS: Đúc kết 1 câu Insight đắt giá + 3 bài học hành động thực tế.

⚠️ YÊU CẦU ĐẶC BIỆT VỀ ĐỊNH DẠNG:
Hãy trả về DUY NHẤT một khối mã JSON hợp lệ (Không thêm bất kỳ lời dẫn giải hay markdown nào ngoài json) theo đúng cấu trúc schema sau để nạp trực tiếp vào ứng dụng Brain Chain:

\`\`\`json
{
  "title": "${safeTitle}",
  "category": "${category}",
  "context": "${context}",
  "coreChain": {
    "a": "BƯỚC 1 (A): Khởi nguồn sự kiện hoặc hành động ban đầu cụ thể được mô tả đầy đủ.",
    "b": "BƯỚC 2 (B): Tác động trực tiếp đầu tiên xảy ra ngay sau đó một cách rõ ràng.",
    "c": "BƯỚC 3 (C): Phản ứng dây chuyền bậc hai lan sang các bộ phận và đối tượng liên quan.",
    "d": "BƯỚC 4 (D): Hệ quả dây chuyền sâu rộng làm thay đổi hành vi và quy trình vận hành.",
    "insight": "BƯỚC 5 (INSIGHT): Đúc kết nhận thức đột phá, quy luật bất biến hoặc bài học chiến lược cốt lõi."
  },
  "causeEffects": {
    "immediate": "Điều xảy ra ngay lập tức sau sự kiện được phân tích trọn vẹn.",
    "secondOrder": "Hệ quả logic tiếp theo diễn ra sau đó.",
    "thirdOrder": "Hệ quả lan tỏa sâu rộng trong hệ thống.",
    "unexpected": "Hệ quả bất ngờ ngoài dự kiến mà ít người lường trước.",
    "longTerm": "Bức tranh toàn cảnh thay đổi sau 1 đến 3 năm."
  },
  "whyChain": [
    { "level": "1. Triệu chứng bề mặt", "question": "Tại sao xảy ra điều này?", "answer": "Câu trả lời phân tích đầy đủ tầng 1." },
    { "level": "2. Nguyên nhân trực tiếp", "question": "Tại sao lại có nguyên nhân đó?", "answer": "Câu trả lời phân tích đầy đủ tầng 2." },
    { "level": "3. Nguyên nhân sâu xa", "question": "Tại sao yếu tố đó tồn tại?", "answer": "Câu trả lời phân tích đầy đủ tầng 3." },
    { "level": "4. Nguyên nhân hệ thống", "question": "Tại sao hệ thống cho phép điều này?", "answer": "Câu trả lời phân tích đầy đủ tầng 4." },
    { "level": "5. Root Cause (Gốc rễ)", "question": "Bản chất cốt lõi nằm ở đâu?", "answer": "Câu trả lời phân tích đầy đủ tầng 5 gốc rễ." }
  ],
  "whatIf": {
    "scenario": "Tình huống giả định đảo ngược hoặc thay đổi biến số chính trong sự kiện.",
    "consequences": [
      "Hệ quả phi trực giác thứ nhất được mô tả chi tiết.",
      "Hệ quả phi trực giác thứ hai được mô tả chi tiết.",
      "Hệ quả phi trực giác thứ ba được mô tả chi tiết."
    ]
  },
  "systemDynamics": {
    "nodes": ["Thành tố 1", "Thành tố 2", "Thành tố 3", "Thành tố 4", "Thành tố 5"],
    "directImpact": "Tác động trực tiếp đến các thành tố chủ chốt trong hệ thống.",
    "indirectImpact": "Tác động gián tiếp lan tỏa xuyên suốt các bộ phận.",
    "feedbackLoop": "Mô tả vòng lặp phản hồi tăng cường hoặc cân bằng tạo nên kết quả."
  },
  "firstPrinciples": {
    "brokenAssumptions": "Giả định ngầm định sai lầm bị phá vỡ hoàn toàn.",
    "fundamentalTruths": "Sự thật nguyên lý gốc bất biến làm nền tảng.",
    "reconstructedLogic": "Logic xây dựng lại từ nền tảng nguyên lý gốc vững chắc."
  },
  "contrarianThinking": {
    "argFor": "Lập luận ủng hộ quan điểm này dựa trên các bằng chứng thực tế.",
    "argAgainst": "Lập luận phản biện sắc sảo chỉ ra các rủi ro tiềm ẩn.",
    "conditions": "Điều kiện cần và đủ để quan điểm này phát huy tối đa hiệu quả.",
    "exceptions": "Các trường hợp ngoại lệ quan trọng cần hết sức lưu ý.",
    "synthesis": "Kết luận tổng hợp đa chiều giúp đưa ra quyết định tối ưu."
  },
  "predictions": {
    "oneMonth": "Dự đoán diễn biến ngắn hạn trong vòng 1 tháng tới.",
    "oneYear": "Dự đoán diễn biến trung hạn trong vòng 1 năm tới.",
    "fiveYears": "Dự đoán tác động dài hạn trong vòng 5 năm tới.",
    "blindSpots": "Điểm mù và các giả thiết cần liên tục theo dõi kiểm chứng."
  },
  "actionTakeaways": [
    "Bài học hành động cụ thể thứ nhất có thể áp dụng ngay.",
    "Bài học hành động cụ thể thứ hai giúp tối ưu quy trình.",
    "Bài học hành động cụ thể thứ ba tạo lợi thế lâu dài."
  ]
}
\`\`\``;
}

// Resilient JSON extractor: Handles markdown, preambles, and postambles without throw
function extractValidJsonFromAi(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Dữ liệu JSON rỗng!');
  let text = raw.trim();

  // 1. Remove markdown code blocks if any
  if (text.includes('```')) {
    const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (mdMatch && mdMatch[1]) {
      try {
        return JSON.parse(mdMatch[1].trim());
      } catch (e) {
        text = mdMatch[1].trim();
      }
    }
  }

  // 2. Direct JSON.parse
  try {
    return JSON.parse(text);
  } catch (e) { }

  // 3. Find opening '{' or '[' and balance braces/brackets
  const startIdxObj = text.indexOf('{');
  const startIdxArr = text.indexOf('[');
  let startIdx = -1;
  let isArr = false;

  if (startIdxObj !== -1 && startIdxArr !== -1) {
    if (startIdxObj < startIdxArr) {
      startIdx = startIdxObj;
    } else {
      startIdx = startIdxArr;
      isArr = true;
    }
  } else if (startIdxObj !== -1) {
    startIdx = startIdxObj;
  } else if (startIdxArr !== -1) {
    startIdx = startIdxArr;
    isArr = true;
  }

  if (startIdx !== -1) {
    const openChar = isArr ? '[' : '{';
    const closeChar = isArr ? ']' : '}';
    let depth = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;

    for (let i = startIdx; i < text.length; i++) {
      const c = text[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (c === openChar) depth++;
        else if (c === closeChar) {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }

    if (endIdx !== -1) {
      const candidate = text.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(candidate);
      } catch (e) {
        // Try fixing common trailing commas
        const cleaned = candidate.replace(/,\s*([\}\]])/g, '$1');
        return JSON.parse(cleaned);
      }
    }
  }

  throw new Error("Không thể tìm thấy khối JSON hợp lệ. Vui lòng kiểm tra lại mã từ AI!");
}

function setupBcModals() {
  // 1. Event Modal (Add/Edit)
  let editingEventId = null;
  let modalCurrentImages = [];

  const updateModalImageDisplay = () => {
    const statusEl = document.getElementById('bcModalImageStatus');
    const previewWrap = document.getElementById('bcModalImagePreviewWrap');
    const grid = document.getElementById('bcModalImageGrid');
    const removeBtn = document.getElementById('btnBcModalRemoveImage');

    if (modalCurrentImages.length > 0) {
      if (statusEl) {
        statusEl.textContent = `✅ Đã có ${modalCurrentImages.length} ảnh đính kèm`;
        statusEl.style.color = '#34d399';
      }
      if (previewWrap) previewWrap.style.display = 'block';
      if (removeBtn) removeBtn.style.display = 'inline-flex';

      if (grid) {
        grid.innerHTML = '';
        modalCurrentImages.forEach((imgBase64, idx) => {
          const card = document.createElement('div');
          card.style.position = 'relative';
          card.style.width = '100px';
          card.style.height = '75px';
          card.style.borderRadius = '6px';
          card.style.overflow = 'hidden';
          card.style.border = '1px solid rgba(255,255,255,0.15)';
          card.style.background = '#0f172a';
          card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
          card.style.cursor = 'pointer';
          card.style.transition = 'transform 0.15s ease, border-color 0.15s ease';
          card.title = `Bấm xem phóng to (#${idx + 1})`;

          card.innerHTML = `
            <img src="${imgBase64}" style="width: 100%; height: 100%; object-fit: cover;" />
            <span style="position: absolute; bottom: 2px; left: 3px; background: rgba(0,0,0,0.75); color: #fbbf24; font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 3px;">#${idx + 1}</span>
            <button type="button" style="position: absolute; top: 3px; right: 3px; width: 20px; height: 20px; border-radius: 50%; background: rgba(239, 68, 68, 0.9); border: none; color: #fff; font-size: 11px; font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.5);" title="Xóa ảnh #${idx + 1}">✕</button>
          `;

          const imgEl = card.querySelector('img');
          imgEl.addEventListener('click', (e) => {
            e.stopPropagation();
            openBcImageLightbox(modalCurrentImages, idx, 'Xem trước ảnh #' + (idx + 1));
          });

          const delBtn = card.querySelector('button');
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modalCurrentImages.splice(idx, 1);
            updateModalImageDisplay();
          });

          grid.appendChild(card);
        });
      }
    } else {
      if (statusEl) {
        statusEl.textContent = 'Chưa có ảnh';
        statusEl.style.color = 'var(--muted)';
      }
      if (previewWrap) previewWrap.style.display = 'none';
      if (grid) grid.innerHTML = '';
      if (removeBtn) removeBtn.style.display = 'none';
    }
  };

  window.setBcModalImage = (base64OrArray) => {
    const list = Array.isArray(base64OrArray) ? base64OrArray.filter(Boolean) : (base64OrArray ? [base64OrArray] : []);
    list.forEach(img => {
      if (!modalCurrentImages.includes(img)) {
        modalCurrentImages.push(img);
      }
    });
    updateModalImageDisplay();
  };

  const getEventModalData = () => {
    const titleInp = document.getElementById('bcInputEventTitle');
    const catInp = document.getElementById('bcInputEventCategory');
    const lvlInp = document.getElementById('bcInputEventLevel');
    const jsonInp = document.getElementById('bcInputEventJson');

    const text = (titleInp?.value || '').trim();

    return {
      title: text,
      answer: text,
      category: catInp?.value || 'Tiếng Anh & Speaking',
      level: parseInt(lvlInp?.value || '3'),
      jsonCode: (jsonInp?.value || '').trim(),
      image: modalCurrentImages.length > 0 ? modalCurrentImages[0] : '',
      images: [...modalCurrentImages]
    };
  };

  const copyPromptFromModal = (openUrl = null) => {
    const data = getEventModalData();
    if (!data.title) {
      alert('Vui lòng dán câu hỏi & câu trả lời hoặc nội dung cần phân tích vào ô bên trên!');
      document.getElementById('bcInputEventTitle')?.focus();
      return false;
    }
    const promptText = buildBrainChainPrompt(data);
    const primaryImg = data.image || (data.images && data.images[0]);
    if (primaryImg && window.taskAPI && window.taskAPI.copyPromptAndImage) {
      window.taskAPI.copyPromptAndImage(promptText, primaryImg);
    } else if (window.taskAPI && window.taskAPI.writeClipboardText) {
      window.taskAPI.writeClipboardText(promptText);
    } else {
      navigator.clipboard.writeText(promptText);
    }
    if (typeof playTone === 'function') playTone(659, 0.08, 'sine', 0.15);

    if (openUrl) {
      if (window.taskAPI && window.taskAPI.openExternal) {
        window.taskAPI.openExternal(openUrl);
      } else {
        window.open(openUrl, '_blank');
      }
    } else {
      alert('📋 ĐÃ SAO CHÉP PROMPT BRAIN CHAIN THÀNH CÔNG!' + (primaryImg ? ' (ĐÃ KÈM HÌNH ẢNH)' : '') + '\n\nHãy dán (Ctrl+V) vào Gemini / ChatGPT / Claude để AI phân tích logic đa tầng, sau đó bấm "📥 Dán JSON Ngay" để xem kết quả trực quan.');
    }
    return true;
  };

  // Connect action buttons inside Event Modal
  const btnModalCopyPrompt = document.getElementById('btnBcModalCopyPrompt');
  if (btnModalCopyPrompt) {
    btnModalCopyPrompt.onclick = () => copyPromptFromModal();
  }

  const btnModalGemini = document.getElementById('btnBcModalOpenGemini');
  if (btnModalGemini) {
    btnModalGemini.onclick = () => copyPromptFromModal('https://gemini.google.com/');
  }

  const btnModalChatGPT = document.getElementById('btnBcModalOpenChatGPT');
  if (btnModalChatGPT) {
    btnModalChatGPT.onclick = () => copyPromptFromModal('https://chatgpt.com/');
  }

  const btnModalClaude = document.getElementById('btnBcModalOpenClaude');
  if (btnModalClaude) {
    btnModalClaude.onclick = () => copyPromptFromModal('https://claude.ai/');
  }

  const btnModalPasteJsonClipboard = document.getElementById('btnBcModalPasteJsonClipboard');
  if (btnModalPasteJsonClipboard) {
    btnModalPasteJsonClipboard.onclick = async () => {
      let text = '';
      if (window.taskAPI && window.taskAPI.readClipboardText) {
        text = await window.taskAPI.readClipboardText();
      } else {
        text = await navigator.clipboard.readText();
      }
      if (text) {
        const jsonInp = document.getElementById('bcInputEventJson');
        if (jsonInp) {
          jsonInp.value = text;
          if (typeof playTone === 'function') playTone(880, 0.08, 'sine', 0.15);
        }
      }
    };
  }

  const btnModalPasteDemoJson = document.getElementById('btnBcModalPasteDemoJson');
  if (btnModalPasteDemoJson) {
    btnModalPasteDemoJson.onclick = () => {
      const demo = DEFAULT_BRAIN_CHAIN_PRESETS[0];
      const jsonInp = document.getElementById('bcInputEventJson');
      if (jsonInp && demo) {
        jsonInp.value = JSON.stringify(demo, null, 2);
        if (typeof playTone === 'function') playTone(784, 0.08, 'sine', 0.15);
      }
    };
  }

  // Modal Image Buttons
  const btnModalPasteImage = document.getElementById('btnBcModalPasteImage');
  if (btnModalPasteImage) {
    btnModalPasteImage.onclick = async () => {
      const imgData = await getClipboardImageData();
      if (imgData) {
        window.setBcModalImage(imgData);
        if (typeof playTone === 'function') playTone(880, 0.08, 'sine', 0.15);
      } else {
        // If clipboard is empty, open file picker
        const fileInp = document.getElementById('bcImageFileInput');
        if (fileInp) {
          fileInp.setAttribute('data-target-mode', 'modal');
          fileInp.click();
        }
      }
    };
  }

  const btnModalChooseImage = document.getElementById('btnBcModalChooseImage');
  if (btnModalChooseImage) {
    btnModalChooseImage.onclick = () => {
      const fileInp = document.getElementById('bcImageFileInput');
      if (fileInp) {
        fileInp.setAttribute('data-target-mode', 'modal');
        fileInp.click();
      }
    };
  }

  const btnModalRemoveImage = document.getElementById('btnBcModalRemoveImage');
  if (btnModalRemoveImage) {
    btnModalRemoveImage.onclick = () => {
      modalCurrentImages = [];
      updateModalImageDisplay();
      if (typeof playTone === 'function') playTone(400, 0.08, 'sine', 0.1);
    };
  }

  // Modal drag & drop support for images
  const eventModalBox = document.querySelector('#bcEventModal .modal-box');
  if (eventModalBox) {
    eventModalBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    eventModalBox.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type && f.type.startsWith('image/'));
      if (files.length > 0) {
        const readPromises = files.map(f => new Promise((res) => {
          const r = new FileReader();
          r.onload = (ev) => res(ev.target.result);
          r.onerror = () => res(null);
          r.readAsDataURL(f);
        }));
        const base64List = (await Promise.all(readPromises)).filter(Boolean);
        if (base64List.length > 0) {
          window.setBcModalImage(base64List);
          if (typeof playTone === 'function') playTone(880, 0.09, 'sine', 0.2);
        }
      }
    });
  }

  const closeEventModal = () => {
    editingEventId = null;
    modalCurrentImages = [];
    updateModalImageDisplay();
    const fileInp = document.getElementById('bcImageFileInput');
    if (fileInp) fileInp.setAttribute('data-target-mode', 'active-event');
    document.getElementById('bcEventModal')?.classList.remove('active');
  };

  window.openBcEventModal = (eventToEdit = null) => {
    editingEventId = eventToEdit ? eventToEdit.id : null;
    modalCurrentImages = eventToEdit ? (Array.isArray(eventToEdit.images) && eventToEdit.images.length > 0 ? [...eventToEdit.images] : (eventToEdit.image ? [eventToEdit.image] : [])) : [];
    const modal = document.getElementById('bcEventModal');
    const modalTitle = document.getElementById('bcEventModalTitle');
    const titleInp = document.getElementById('bcInputEventTitle');
    const catInp = document.getElementById('bcInputEventCategory');
    const lvlInp = document.getElementById('bcInputEventLevel');
    const jsonInp = document.getElementById('bcInputEventJson');
    const fileInp = document.getElementById('bcImageFileInput');

    if (fileInp) fileInp.setAttribute('data-target-mode', 'modal');

    if (!modal) return;
    if (modalTitle) modalTitle.textContent = eventToEdit ? '✏️ Chỉnh Sửa Câu / Sự Kiện' : '💡 Thêm Câu / Sự Kiện / Tình Huống Mới';
    if (titleInp) titleInp.value = eventToEdit ? (eventToEdit.answer || eventToEdit.title || '') : '';
    if (catInp) catInp.value = eventToEdit ? (eventToEdit.category || 'Tiếng Anh & Speaking') : 'Tiếng Anh & Speaking';
    if (lvlInp) lvlInp.value = eventToEdit ? (eventToEdit.level || 3) : 3;

    if (jsonInp) {
      if (eventToEdit && eventToEdit.coreChain && eventToEdit.coreChain.insight) {
        jsonInp.value = JSON.stringify(eventToEdit, null, 2);
      } else {
        jsonInp.value = '';
      }
    }

    updateModalImageDisplay();

    modal.classList.add('active');
    if (titleInp) titleInp.focus();
  };

  const btnCancelEvent = document.getElementById('btnBcEventModalCancel');
  if (btnCancelEvent) btnCancelEvent.onclick = () => closeEventModal();

  const bcEventModalEl = document.getElementById('bcEventModal');
  if (bcEventModalEl) {
    bcEventModalEl.onclick = (e) => {
      if (e.target === bcEventModalEl) closeEventModal();
    };
  }

  const btnSaveEvent = document.getElementById('btnBcEventModalSave');
  if (btnSaveEvent) {
    btnSaveEvent.onclick = async () => {
      const data = getEventModalData();
      const rawJson = (document.getElementById('bcInputEventJson')?.value || '').trim();

      if (!data.title && !rawJson) {
        alert('Vui lòng nhập câu hỏi & câu trả lời hoặc nạp mã JSON phân tích!');
        document.getElementById('bcInputEventTitle')?.focus();
        return;
      }

      let parsedFromJson = null;
      if (rawJson) {
        try {
          parsedFromJson = extractValidJsonFromAi(rawJson);
        } catch (err) {
          alert('Mã JSON không hợp lệ: ' + err.message + '\nVui lòng kiểm tra lại hoặc để trống ô JSON.');
          document.getElementById('bcInputEventJson')?.focus();
          return;
        }
      }

      if (editingEventId) {
        const ev = brainChainData.events.find(x => x.id === editingEventId);
        if (ev) {
          if (parsedFromJson && typeof parsedFromJson === 'object') {
            Object.assign(ev, parsedFromJson);
            ev.id = editingEventId;
          } else {
            ev.title = data.title;
            ev.answer = data.answer;
            ev.category = data.category;
            ev.level = data.level;
          }
          if (modalCurrentImages.length > 0) {
            ev.images = [...modalCurrentImages];
            ev.image = modalCurrentImages[0];
          } else if (!parsedFromJson?.image && !parsedFromJson?.images) {
            delete ev.image;
            delete ev.images;
          }
          ev.updatedAt = new Date().toISOString();
        }
      } else {
        let newEv;
        if (parsedFromJson && typeof parsedFromJson === 'object' && !Array.isArray(parsedFromJson)) {
          newEv = Object.assign({}, parsedFromJson);
          // Always force a brand new unique ID for new events so it never reuses an existing event ID
          newEv.id = 'bc_event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          if (!newEv.title) newEv.title = data.title;
          if (!newEv.answer) newEv.answer = data.answer || data.title;
          if (modalCurrentImages.length > 0) {
            newEv.images = [...modalCurrentImages];
            newEv.image = modalCurrentImages[0];
          }
          newEv.createdAt = new Date().toISOString();
        } else {
          newEv = {
            id: 'bc_event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title: data.title,
            answer: data.answer,
            category: data.category,
            level: data.level,
            image: modalCurrentImages.length > 0 ? modalCurrentImages[0] : undefined,
            images: modalCurrentImages.length > 0 ? [...modalCurrentImages] : undefined,
            createdAt: new Date().toISOString(),
            coreChain: {
              a: data.title,
              b: "Bấm '⚡ Tạo Prompt AI' để sinh chuỗi tư duy đầy đủ...",
              c: "Đang chờ phân tích...",
              d: "Đang chờ phân tích...",
              insight: "Chưa có insight đúc kết."
            }
          };
        }
        brainChainData.events.unshift(newEv);
        brainChainData.activeEventId = newEv.id;
      }

      bcActiveEventImageIndex = 0;
      brainChainData.practiceStep = 5;
      await saveBrainChainData();
      closeEventModal();
      renderBcEventList();
      const currentEv = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
      if (currentEv) renderBcActiveEvent(currentEv);
      if (typeof playTone === 'function') playTone(600, 0.08, 'sine', 0.1);
    };
  }

  // 2. Prompt Modal
  window.openBcPromptModal = (event) => {
    const modal = document.getElementById('bcPromptModal');
    const nameLabel = document.getElementById('bcPromptSelectedEventName');
    const promptText = document.getElementById('bcGeneratedPromptText');

    if (!modal) return;
    const targetEv = event || brainChainData.events.find(x => x.id === brainChainData.activeEventId) || brainChainData.events[0];
    if (nameLabel) nameLabel.textContent = targetEv ? (targetEv.question || targetEv.title) : 'Chưa có sự kiện';
    if (promptText) promptText.value = buildBrainChainPrompt(targetEv);

    modal.classList.add('active');
  };

  const btnClosePrompt = document.getElementById('btnBcPromptClose');
  if (btnClosePrompt) btnClosePrompt.onclick = () => document.getElementById('bcPromptModal')?.classList.remove('active');

  const copyPromptAction = () => {
    const promptText = document.getElementById('bcGeneratedPromptText');
    if (!promptText) return;
    const text = promptText.value;
    if (window.taskAPI && window.taskAPI.writeClipboardText) {
      window.taskAPI.writeClipboardText(text);
    } else {
      navigator.clipboard.writeText(text);
    }
    if (typeof playTone === 'function') playTone(659, 0.08, 'sine', 0.15);
    alert('📋 ĐÃ SAO CHÉP PROMPT BRAIN CHAIN THÀNH CÔNG!\nHãy dán vào Gemini / ChatGPT / Claude để AI sinh mã JSON phân tích logic đa tầng.');
  };

  const btnCopyPromptModal = document.getElementById('btnBcCopyPromptModalBtn');
  if (btnCopyPromptModal) btnCopyPromptModal.onclick = copyPromptAction;

  // AI Web launch buttons with 1-click prompt copy
  const setupAiLink = (btnId, url) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.onclick = () => {
      const promptText = document.getElementById('bcGeneratedPromptText');
      if (promptText) {
        if (window.taskAPI && window.taskAPI.writeClipboardText) {
          window.taskAPI.writeClipboardText(promptText.value);
        } else {
          navigator.clipboard.writeText(promptText.value);
        }
      }
      if (window.taskAPI && window.taskAPI.openExternal) {
        window.taskAPI.openExternal(url);
      } else {
        window.open(url, '_blank');
      }
      if (typeof playTone === 'function') playTone(659, 0.08, 'sine', 0.15);
    };
  };

  setupAiLink('btnBcOpenGemini', 'https://gemini.google.com/');
  setupAiLink('btnBcOpenChatGPT', 'https://chatgpt.com/');
  setupAiLink('btnBcOpenClaude', 'https://claude.ai/');

  // 3. JSON Import Modal
  let targetImportEventId = null;

  window.openBcImportJsonModal = (targetEventId = null) => {
    targetImportEventId = targetEventId;
    const modal = document.getElementById('bcImportJsonModal');
    const input = document.getElementById('bcImportJsonInput');
    const errBox = document.getElementById('bcImportJsonError');

    if (!modal) return;
    if (input) input.value = '';
    if (errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }
    modal.classList.add('active');
    if (input) input.focus();
  };

  const btnCloseImport = document.getElementById('btnBcImportJsonClose');
  if (btnCloseImport) btnCloseImport.onclick = () => document.getElementById('bcImportJsonModal')?.classList.remove('active');

  const btnCancelImport = document.getElementById('btnBcImportJsonCancel');
  if (btnCancelImport) btnCancelImport.onclick = () => document.getElementById('bcImportJsonModal')?.classList.remove('active');

  const btnPasteSample = document.getElementById('btnBcPasteSampleJson');
  if (btnPasteSample) {
    btnPasteSample.onclick = () => {
      const input = document.getElementById('bcImportJsonInput');
      if (input) {
        input.value = JSON.stringify(DEFAULT_BRAIN_CHAIN_PRESETS[0], null, 2);
        if (typeof playTone === 'function') playTone(600, 0.05, 'sine', 0.1);
      }
    };
  }

  const btnConfirmImport = document.getElementById('btnBcImportJsonConfirm');
  if (btnConfirmImport) {
    btnConfirmImport.onclick = async () => {
      const input = document.getElementById('bcImportJsonInput');
      const errBox = document.getElementById('bcImportJsonError');
      let raw = (input?.value || '').trim();

      if (!raw) {
        if (errBox) { errBox.style.display = 'block'; errBox.textContent = 'Vui lòng dán đoạn mã JSON từ AI vào ô bên trên!'; }
        return;
      }

      try {
        const parsed = extractValidJsonFromAi(raw);
        let importedEvent = null;

        if (Array.isArray(parsed)) {
          // Bulk array of events
          parsed.forEach(item => {
            if (item && item.title) {
              if (!item.id) item.id = 'bc_event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
              brainChainData.events.unshift(item);
            }
          });
          importedEvent = parsed[0];
          brainChainData.activeEventId = importedEvent.id;
        } else if (parsed && typeof parsed === 'object') {
          // Single event
          if (targetImportEventId) {
            // Update existing event
            const existing = brainChainData.events.find(x => x.id === targetImportEventId);
            if (existing) {
              Object.assign(existing, parsed);
              existing.id = targetImportEventId;
              existing.updatedAt = new Date().toISOString();
              importedEvent = existing;
            }
          }
          if (!importedEvent) {
            if (!parsed.id) parsed.id = 'bc_event_' + Date.now();
            parsed.createdAt = new Date().toISOString();
            brainChainData.events.unshift(parsed);
            brainChainData.activeEventId = parsed.id;
            importedEvent = parsed;
          }
        }

        brainChainData.practiceStep = 5; // Show full chain
        await saveBrainChainData();
        document.getElementById('bcImportJsonModal')?.classList.remove('active');
        renderBcEventList();
        if (importedEvent) renderBcActiveEvent(importedEvent);

        if (typeof playTone === 'function') {
          playTone(523, 0.08, 'sine', 0.1);
          setTimeout(() => playTone(659, 0.08, 'sine', 0.12), 80);
          setTimeout(() => playTone(784, 0.12, 'sine', 0.15), 160);
        }

        alert('🎉 NẠP THÀNH CÔNG!\nChuỗi tư duy và giải thích chi tiết của câu đã được cập nhật và hiển thị trực quan.');
      } catch (err) {
        if (errBox) {
          errBox.style.display = 'block';
          errBox.textContent = `Lỗi cú pháp JSON: ${err.message}. Vui lòng kiểm tra lại đoạn mã JSON từ AI!`;
        }
      }
    };
  }

  // 4. Backup Modal
  window.openBcBackupModal = () => {
    const modal = document.getElementById('bcBackupModal');
    const input = document.getElementById('bcBackupJsonInput');
    if (!modal) return;
    if (input) input.value = JSON.stringify(brainChainData, null, 2);
    modal.classList.add('active');
  };

  const btnCloseBackup = document.getElementById('btnBcBackupClose');
  if (btnCloseBackup) btnCloseBackup.onclick = () => document.getElementById('bcBackupModal')?.classList.remove('active');

  const btnExportFull = document.getElementById('btnBcExportFullJson');
  if (btnExportFull) {
    btnExportFull.onclick = () => {
      const input = document.getElementById('bcBackupJsonInput');
      if (input) {
        input.value = JSON.stringify(brainChainData, null, 2);
        if (window.taskAPI && window.taskAPI.writeClipboardText) {
          window.taskAPI.writeClipboardText(input.value);
        } else {
          navigator.clipboard.writeText(input.value);
        }
        if (typeof playTone === 'function') playTone(600, 0.08, 'sine', 0.1);
        alert('📤 Đã sao chép toàn bộ dữ liệu Brain Chain vào Clipboard!');
      }
    };
  }

  const btnApplyBackup = document.getElementById('btnBcApplyBackupJson');
  if (btnApplyBackup) {
    btnApplyBackup.onclick = async () => {
      const input = document.getElementById('bcBackupJsonInput');
      const raw = (input?.value || '').trim();
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.events)) {
          brainChainData = parsed;
        } else if (Array.isArray(parsed)) {
          brainChainData.events = parsed;
          brainChainData.activeEventId = parsed[0]?.id || null;
        }
        await saveBrainChainData();
        document.getElementById('bcBackupModal')?.classList.remove('active');
        renderBcEventList();
        if (brainChainData.activeEventId) {
          const ev = brainChainData.events.find(x => x.id === brainChainData.activeEventId);
          if (ev) renderBcActiveEvent(ev);
        }
        if (typeof playTone === 'function') playTone(659, 0.08, 'sine', 0.15);
        alert('📥 Khôi phục dữ liệu Brain Chain thành công!');
      } catch (err) {
        alert('Lỗi cú pháp JSON: ' + err.message);
      }
    };
  }

  const btnResetPresets = document.getElementById('btnBcResetDefaultPresets');
  if (btnResetPresets) {
    btnResetPresets.onclick = async () => {
      if (confirm('Khôi phục lại 6 kịch bản mẫu tinh hoa mặc định của hệ thống?')) {
        brainChainData = {
          events: JSON.parse(JSON.stringify(DEFAULT_BRAIN_CHAIN_PRESETS)),
          activeEventId: DEFAULT_BRAIN_CHAIN_PRESETS[0].id,
          practiceStep: 5
        };
        await saveBrainChainData();
        document.getElementById('bcBackupModal')?.classList.remove('active');
        renderBcEventList();
        renderBcActiveEvent(brainChainData.events[0]);
        if (typeof playTone === 'function') playTone(600, 0.08, 'sine', 0.1);
      }
    };
  }

  const btnClearAll = document.getElementById('btnBcClearAllEvents');
  if (btnClearAll) {
    btnClearAll.onclick = async () => {
      if (confirm('CẢNH BÁO: Bạn có chắc muốn xóa sạch toàn bộ sự kiện trong Brain Chain?')) {
        brainChainData = { events: [], activeEventId: null, practiceStep: 5 };
        await saveBrainChainData();
        document.getElementById('bcBackupModal')?.classList.remove('active');
        renderBcEventList();
        renderBcActiveEvent(null);
        if (typeof playTone === 'function') playTone(400, 0.08, 'sine', 0.1);
      }
    };
  }
}

// =========================================================
// ⏱️ TIMER & STOPWATCH SUITE MODULE
// =========================================================
let timerState = {
  mode: 'countdown', // 'countdown' | 'stopwatch'
  status: 'stopped', // 'stopped' | 'running' | 'paused' | 'completed'
  targetSeconds: 1500, // Default 25 minutes
  remainingSeconds: 1500,
  stopwatchSeconds: 0,
  lastLapSeconds: 0,
  laps: [],
  soundEnabled: true,
  taskTitle: '',
  timerInterval: null,
  alarmInterval: null,
  startTimestamp: null
};

function formatTimerClock(sec) {
  if (isNaN(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimerUI() {
  const mainClock = document.getElementById('timerMainClock');
  const subStatus = document.getElementById('timerSubStatus');
  const miniDisplay = document.getElementById('miniTimerDisplay');
  const miniBadge = document.getElementById('miniTimerStateBadge');
  const miniLabel = document.getElementById('miniTimerLabel');
  const startBtn = document.getElementById('btnTimerStartPause');
  const miniToggleBtn = document.getElementById('btnMiniTimerToggle');
  const ringFill = document.getElementById('timerRingProgress');
  const lapBtn = document.getElementById('btnTimerLap');
  const adjustRow = document.getElementById('timerAdjustRow');
  const countdownControls = document.getElementById('timerCountdownControls');
  const stopwatchLapsBox = document.getElementById('timerStopwatchLapsBox');

  const currentDisplaySec = timerState.mode === 'countdown' ? timerState.remainingSeconds : timerState.stopwatchSeconds;
  const clockText = formatTimerClock(currentDisplaySec);

  if (mainClock) mainClock.textContent = clockText;
  if (miniDisplay) miniDisplay.textContent = clockText;

  // Title in browser window titlebar when timer running
  if (timerState.status === 'running') {
    document.title = `(${clockText}) ${timerState.taskTitle || 'Task Countdown'}`;
  } else {
    document.title = 'Task Countdown';
  }

  // Label display
  const titleText = timerState.taskTitle ? `📝 ${timerState.taskTitle}` : (timerState.mode === 'countdown' ? 'Đồng hồ đếm ngược tập trung' : 'Đồng hồ bấm giờ đếm xuôi');
  if (miniLabel) miniLabel.textContent = titleText;

  // Progress Ring logic (Radius = 96, Circumference = 2 * PI * 96 ≈ 603.18)
  const circumference = 603.18;
  if (ringFill) {
    if (timerState.mode === 'countdown') {
      const pct = timerState.targetSeconds > 0 ? (timerState.remainingSeconds / timerState.targetSeconds) : 0;
      const offset = circumference * (1 - Math.max(0, Math.min(1, pct)));
      ringFill.style.strokeDashoffset = offset;
      if (timerState.status === 'completed') {
        ringFill.style.stroke = '#ef4444';
      } else if (pct < 0.2) {
        ringFill.style.stroke = '#f59e0b';
      } else {
        ringFill.style.stroke = '#00f2fe';
      }
    } else {
      // Stopwatch mode ring pulses / spins linearly per minute
      const pct = (timerState.stopwatchSeconds % 60) / 60;
      const offset = circumference * (1 - pct);
      ringFill.style.strokeDashoffset = offset;
      ringFill.style.stroke = '#8b5cf6';
    }
  }

  // Mode UI toggle (Countdown vs Stopwatch)
  if (timerState.mode === 'countdown') {
    if (lapBtn) lapBtn.style.display = 'none';
    if (adjustRow) adjustRow.style.display = 'flex';
    if (countdownControls) countdownControls.style.display = 'flex';
    if (stopwatchLapsBox) stopwatchLapsBox.style.display = 'none';
  } else {
    if (lapBtn) lapBtn.style.display = 'inline-block';
    if (adjustRow) adjustRow.style.display = 'none';
    if (countdownControls) countdownControls.style.display = 'none';
    if (stopwatchLapsBox) stopwatchLapsBox.style.display = 'flex';
  }

  // Status & Button Text
  if (mainClock) mainClock.classList.remove('alert-active');

  if (timerState.status === 'running') {
    if (startBtn) {
      startBtn.textContent = '⏸️ TẠM DỪNG';
      startBtn.className = 'timer-btn timer-btn-primary pause-state';
    }
    if (miniToggleBtn) {
      miniToggleBtn.textContent = '⏸️ Tạm dừng';
      miniToggleBtn.className = 'btn-mini-timer btn-start pause-mode';
    }
    if (subStatus) subStatus.textContent = timerState.mode === 'countdown' ? `Đang đếm ngược... (Còn ${clockText})` : `Đang bấm giờ... (${clockText})`;
    if (miniBadge) {
      miniBadge.textContent = 'Đang chạy ⚡';
      miniBadge.className = 'mini-timer-badge running';
    }
  } else if (timerState.status === 'paused') {
    if (startBtn) {
      startBtn.textContent = '▶️ TIẾP TỤC';
      startBtn.className = 'timer-btn timer-btn-primary';
    }
    if (miniToggleBtn) {
      miniToggleBtn.textContent = '▶️ Tiếp tục';
      miniToggleBtn.className = 'btn-mini-timer btn-start';
    }
    if (subStatus) subStatus.textContent = `Đã tạm dừng ở ${clockText}`;
    if (miniBadge) {
      miniBadge.textContent = 'Tạm dừng ⏸️';
      miniBadge.className = 'mini-timer-badge paused';
    }
  } else if (timerState.status === 'completed') {
    if (startBtn) {
      startBtn.textContent = '🔄 ĐẶT LẠI';
      startBtn.className = 'timer-btn timer-btn-primary';
    }
    if (miniToggleBtn) {
      miniToggleBtn.textContent = '🔄 Đặt lại';
      miniToggleBtn.className = 'btn-mini-timer btn-start';
    }
    if (subStatus) subStatus.textContent = '⏰ ĐÃ HẾT GIỜ!';
    if (miniBadge) {
      miniBadge.textContent = 'ĐÃ HẾT GIỜ ⏰';
      miniBadge.className = 'mini-timer-badge completed';
    }
    if (mainClock) mainClock.classList.add('alert-active');
  } else {
    // Stopped / Ready
    if (startBtn) {
      startBtn.textContent = '▶️ BẮT ĐẦU';
      startBtn.className = 'timer-btn timer-btn-primary';
    }
    if (miniToggleBtn) {
      miniToggleBtn.textContent = '▶️ Bắt đầu';
      miniToggleBtn.className = 'btn-mini-timer btn-start';
    }
    if (subStatus) subStatus.textContent = timerState.mode === 'countdown' ? `Sẵn sàng đếm ngược (${formatTimerClock(timerState.targetSeconds)})` : 'Sẵn sàng bấm giờ đếm xuôi';
    if (miniBadge) {
      miniBadge.textContent = 'Sẵn sàng';
      miniBadge.className = 'mini-timer-badge';
    }
  }
}

function startTimer() {
  if (timerState.status === 'running') {
    pauseTimer();
    return;
  }
  if (timerState.status === 'completed') {
    resetTimer();
  }

  timerState.status = 'running';
  const now = Date.now();

  if (timerState.mode === 'countdown') {
    timerState.startTimestamp = now - (timerState.targetSeconds - timerState.remainingSeconds) * 1000;
  } else {
    timerState.startTimestamp = now - timerState.stopwatchSeconds * 1000;
  }

  clearInterval(timerState.timerInterval);
  timerState.timerInterval = setInterval(tickTimer, 200);

  if (SFX.add && timerState.soundEnabled) SFX.add();
  updateTimerUI();
}

function pauseTimer() {
  if (timerState.status !== 'running') return;
  timerState.status = 'paused';
  clearInterval(timerState.timerInterval);
  if (SFX.tick && timerState.soundEnabled) SFX.tick();
  updateTimerUI();
}

function resetTimer() {
  timerState.status = 'stopped';
  clearInterval(timerState.timerInterval);
  stopAlarmSound();
  if (timerState.mode === 'countdown') {
    timerState.remainingSeconds = timerState.targetSeconds;
  } else {
    timerState.stopwatchSeconds = 0;
    timerState.lastLapSeconds = 0;
  }
  if (SFX.delete && timerState.soundEnabled) SFX.delete();
  updateTimerUI();
}

function tickTimer() {
  if (timerState.status !== 'running') return;
  const now = Date.now();
  const elapsedSec = Math.floor((now - timerState.startTimestamp) / 1000);

  if (timerState.mode === 'countdown') {
    const left = timerState.targetSeconds - elapsedSec;
    if (left <= 0) {
      timerState.remainingSeconds = 0;
      onTimerComplete();
    } else {
      timerState.remainingSeconds = left;
    }
  } else {
    timerState.stopwatchSeconds = elapsedSec;
  }

  updateTimerUI();
}

function onTimerComplete() {
  timerState.status = 'completed';
  clearInterval(timerState.timerInterval);
  updateTimerUI();

  if (timerState.soundEnabled) {
    playAlarmSound();
  }

  // Desktop notification if supported
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('⏰ ĐÃ HẾT GIỜ!', {
      body: timerState.taskTitle ? `Nhiệm vụ: ${timerState.taskTitle}` : 'Thời gian đếm ngược của bạn đã kết thúc!',
      icon: 'icon.ico'
    });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

function playAlarmSound() {
  stopAlarmSound();
  if (SFX.alarm) SFX.alarm();
  timerState.alarmInterval = setInterval(() => {
    if (timerState.status === 'completed' && timerState.soundEnabled && SFX.alarm) {
      SFX.alarm();
    } else {
      stopAlarmSound();
    }
  }, 3500);
}

function stopAlarmSound() {
  if (timerState.alarmInterval) {
    clearInterval(timerState.alarmInterval);
    timerState.alarmInterval = null;
  }
}

function setCountdownDuration(seconds, presetBtn = null) {
  timerState.targetSeconds = seconds;
  timerState.remainingSeconds = seconds;
  if (timerState.status === 'running') {
    timerState.startTimestamp = Date.now();
  }

  if (presetBtn) {
    document.querySelectorAll('.timer-preset-badge').forEach(b => b.classList.remove('active'));
    presetBtn.classList.add('active');
  }

  // Update inputs
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const inpH = document.getElementById('inpTimerHours');
  const inpM = document.getElementById('inpTimerMinutes');
  const inpS = document.getElementById('inpTimerSeconds');
  if (inpH) inpH.value = String(h).padStart(2, '0');
  if (inpM) inpM.value = String(m).padStart(2, '0');
  if (inpS) inpS.value = String(s).padStart(2, '0');

  if (SFX.tick && timerState.soundEnabled) SFX.tick();
  updateTimerUI();
}

function adjustTime(deltaSeconds) {
  if (timerState.mode !== 'countdown') return;
  timerState.targetSeconds = Math.max(10, timerState.targetSeconds + deltaSeconds);
  timerState.remainingSeconds = Math.max(0, timerState.remainingSeconds + deltaSeconds);
  if (timerState.status === 'running') {
    timerState.startTimestamp += deltaSeconds * 1000;
  }
  if (SFX.tick && timerState.soundEnabled) SFX.tick();
  updateTimerUI();
}

function recordLap() {
  if (timerState.mode !== 'stopwatch') return;
  const totalSec = timerState.stopwatchSeconds;
  const lapSec = totalSec - timerState.lastLapSeconds;
  timerState.lastLapSeconds = totalSec;

  const lapNum = timerState.laps.length + 1;
  timerState.laps.unshift({
    num: lapNum,
    lapTime: formatTimerClock(lapSec),
    totalTime: formatTimerClock(totalSec)
  });

  renderLapsTable();
  if (SFX.tick && timerState.soundEnabled) SFX.tick();
}

function renderLapsTable() {
  const tbody = document.getElementById('timerLapsList');
  if (!tbody) return;
  if (timerState.laps.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--muted); padding: 12px;">Chưa có vòng nào. Bấm "🚩 GHI VÒNG (LAP)" khi đang bấm giờ!</td></tr>`;
    return;
  }
  tbody.innerHTML = timerState.laps.map(l => `
    <tr>
      <td><strong>Vòng ${l.num}</strong></td>
      <td style="color: var(--primary); font-weight: 700;">+${l.lapTime}</td>
      <td>${l.totalTime}</td>
    </tr>
  `).join('');
}

function clearLaps() {
  timerState.laps = [];
  timerState.lastLapSeconds = 0;
  renderLapsTable();
  if (SFX.delete && timerState.soundEnabled) SFX.delete();
}

let timerInitialized = false;

function initTimerTab() {
  if (timerInitialized) {
    updateTimerUI();
    return;
  }
  timerInitialized = true;

  // Sound toggle button
  const soundBtn = document.getElementById('btnTimerSoundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      timerState.soundEnabled = !timerState.soundEnabled;
      soundBtn.textContent = timerState.soundEnabled ? '🔊 Âm thanh ON' : '🔇 Âm thanh OFF';
      soundBtn.className = `timer-icon-btn ${timerState.soundEnabled ? 'active' : ''}`;
      if (!timerState.soundEnabled) stopAlarmSound();
    });
  }

  // Mode Switcher buttons
  const btnCountdown = document.getElementById('btnModeCountdown');
  const btnStopwatch = document.getElementById('btnModeStopwatch');
  if (btnCountdown && btnStopwatch) {
    btnCountdown.addEventListener('click', () => {
      btnCountdown.classList.add('active');
      btnStopwatch.classList.remove('active');
      timerState.mode = 'countdown';
      resetTimer();
    });
    btnStopwatch.addEventListener('click', () => {
      btnStopwatch.classList.add('active');
      btnCountdown.classList.remove('active');
      timerState.mode = 'stopwatch';
      resetTimer();
    });
  }

  // Task title input
  const titleInp = document.getElementById('timerTaskTitle');
  if (titleInp) {
    titleInp.addEventListener('input', () => {
      timerState.taskTitle = titleInp.value.trim();
      updateTimerUI();
    });
  }

  // Main controls
  const btnStartPause = document.getElementById('btnTimerStartPause');
  const btnReset = document.getElementById('btnTimerReset');
  const btnLap = document.getElementById('btnTimerLap');
  if (btnStartPause) btnStartPause.addEventListener('click', startTimer);
  if (btnReset) btnReset.addEventListener('click', resetTimer);
  if (btnLap) btnLap.addEventListener('click', recordLap);

  // Mini-timer widget controls
  const btnMiniToggle = document.getElementById('btnMiniTimerToggle');
  const btnMiniReset = document.getElementById('btnMiniTimerReset');
  const btnMiniPlus5 = document.getElementById('btnMiniTimerPlus5');
  const btnMiniExpand = document.getElementById('btnMiniTimerOpenFull');
  if (btnMiniToggle) btnMiniToggle.addEventListener('click', startTimer);
  if (btnMiniReset) btnMiniReset.addEventListener('click', resetTimer);
  if (btnMiniPlus5) btnMiniPlus5.addEventListener('click', () => adjustTime(300));
  if (btnMiniExpand) {
    btnMiniExpand.addEventListener('click', () => {
      const tabTimerBtn = document.getElementById('tabBtnTimer');
      if (tabTimerBtn) tabTimerBtn.click();
    });
  }

  // Quick preset badges
  document.querySelectorAll('.timer-preset-badge').forEach(badge => {
    badge.addEventListener('click', () => {
      const sec = parseInt(badge.dataset.preset, 10);
      if (!isNaN(sec)) setCountdownDuration(sec, badge);
    });
  });

  // Time adjustment (+1m, +5m, -1m, -5m)
  document.querySelectorAll('.btn-time-adjust').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = parseInt(btn.dataset.adjust, 10);
      if (!isNaN(delta)) adjustTime(delta);
    });
  });

  // Custom time inputs
  const btnCustomSet = document.getElementById('btnSetCustomTimer');
  if (btnCustomSet) {
    btnCustomSet.addEventListener('click', () => {
      const h = parseInt(document.getElementById('inpTimerHours')?.value || '0', 10);
      const m = parseInt(document.getElementById('inpTimerMinutes')?.value || '0', 10);
      const s = parseInt(document.getElementById('inpTimerSeconds')?.value || '0', 10);
      const totalSec = (h * 3600) + (m * 60) + s;
      if (totalSec > 0) {
        setCountdownDuration(totalSec, null);
      } else {
        alert('Vui lòng nhập thời gian đếm ngược lớn hơn 0!');
      }
    });
  }

  // Clear laps
  const btnClearLaps = document.getElementById('btnClearLaps');
  if (btnClearLaps) btnClearLaps.addEventListener('click', clearLaps);

  updateTimerUI();
}

// Auto init timer module on startup
document.addEventListener('DOMContentLoaded', () => {
  try {
    initTimerTab();
  } catch (e) {
    console.error('Init timer failed:', e);
  }
});

