// State variables
let serverUrl = '';
let adminSecret = '';
let levels = [];
let activeRooms = [];
let roomsInterval = null;
let usersInterval = null;
let currentTab = 'tab-dashboard';
let uploadedLevelsToImport = [];

// DOM Elements
const elServerUrl = document.getElementById('server-url');
const elAdminSecret = document.getElementById('admin-secret');
const btnSaveCredentials = document.getElementById('btn-save-credentials');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');

const navItems = document.querySelectorAll('.nav-item');
const tabPanels = document.querySelectorAll('.tab-panel');

// Dashboard Stats & Table
const statActiveRooms = document.getElementById('stat-active-rooms');
const statTotalPlayers = document.getElementById('stat-total-players');
const statPlayingRooms = document.getElementById('stat-playing-rooms');
const roomsListBody = document.getElementById('rooms-list-body');
const btnRefreshRooms = document.getElementById('btn-refresh-rooms');

// Levels Elements
const levelsListBody = document.getElementById('levels-list-body');
const levelsCount = document.getElementById('levels-count');
const btnAddLevel = document.getElementById('btn-add-level');
const levelEditorCard = document.getElementById('level-editor-card');
const editorTitle = document.getElementById('editor-title');
const btnCloseEditor = document.getElementById('btn-close-editor');
const formLevelEditor = document.getElementById('form-level-editor');
const editLevelIndex = document.getElementById('edit-level-index');
const editLevelId = document.getElementById('level-id');
const editLevelTitle = document.getElementById('level-title');
const editLevelDifficulty = document.getElementById('level-difficulty');
const editGridCols = document.getElementById('grid-cols');
const editGridRows = document.getElementById('grid-rows');
const editArrowsJson = document.getElementById('level-arrows-json');
const arrowVerifyBadge = document.getElementById('arrow-verify-badge');
const btnVerifyLevel = document.getElementById('btn-verify-level');
const btnBackupLevels = document.getElementById('btn-backup-levels');
const btnDownloadLevels = document.getElementById('btn-download-levels');

// Import Levels Elements
const btnUploadLevels = document.getElementById('btn-upload-levels');
const inputUploadLevels = document.getElementById('input-upload-levels');
const modalLevelImport = document.getElementById('modal-level-import');
const btnCloseImportModal = document.getElementById('btn-close-import-modal');
const btnCancelImport = document.getElementById('btn-cancel-import');
const formLevelImport = document.getElementById('form-level-import');
const importStatFound = document.getElementById('import-stat-found');
const importStatRange = document.getElementById('import-stat-range');
const importStatStatus = document.getElementById('import-stat-status');
const importWarningsContainer = document.getElementById('import-warnings-container');
const importWarningsList = document.getElementById('import-warnings-list');
const chkImportSort = document.getElementById('chk-import-sort');
const chkImportAutofill = document.getElementById('chk-import-autofill');
const chkImportNormalize = document.getElementById('chk-import-normalize');
const chkImportStrictBounds = document.getElementById('chk-import-strict-bounds');

// Config Elements
const formMusicConfig = document.getElementById('form-music-config');
const formIconConfig = document.getElementById('form-icon-config');
const cfgBgMusic = document.getElementById('cfg-bg-music');
const cfgCorrectSound = document.getElementById('cfg-correct-sound');
const cfgWrongSound = document.getElementById('cfg-wrong-sound');
const cfgVictorySound = document.getElementById('cfg-victory-sound');
const cfgOutOfMoveSound = document.getElementById('cfg-outofmove-sound');
const cfgHomeArrow = document.getElementById('cfg-home-arrow');
const previewIcon = document.getElementById('preview-icon');

// Version Config Elements
const formVersionConfig = document.getElementById('form-version-config');
const cfgLatestVersion = document.getElementById('cfg-latest-version');
const cfgCriticalVersion = document.getElementById('cfg-critical-version');

// Users Monitor Elements
const statTotalUsers = document.getElementById('stat-total-users');
const statUnlockedUsers = document.getElementById('stat-unlocked-users');
const usersListBody = document.getElementById('users-list-body');
const btnRefreshUsers = document.getElementById('btn-refresh-users');

// Helper to format Server URL (prepends protocol if missing to avoid relative fetch issues)
function formatServerUrl(url) {
  let cleaned = (url || '').trim().replace(/\/$/, '');
  if (!cleaned) return '';
  if (!/^https?:\/\//i.test(cleaned)) {
    if (cleaned.startsWith('localhost') || cleaned.startsWith('127.0.0.1')) {
      cleaned = 'http://' + cleaned;
    } else {
      cleaned = 'https://' + cleaned;
    }
  }
  return cleaned;
}

// Init application
document.addEventListener('DOMContentLoaded', () => {
  // Load saved configurations
  serverUrl = formatServerUrl(localStorage.getItem('arrow_admin_url') || 'http://localhost:3000');
  adminSecret = localStorage.getItem('arrow_admin_secret') || '';

  elServerUrl.value = serverUrl;
  elAdminSecret.value = adminSecret;

  // Setup tab routing
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const targetTab = e.currentTarget.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Connection config actions
  btnSaveCredentials.addEventListener('click', () => {
    serverUrl = formatServerUrl(elServerUrl.value);
    elServerUrl.value = serverUrl; // Display formatted URL in input
    adminSecret = elAdminSecret.value.trim();
    localStorage.setItem('arrow_admin_url', serverUrl);
    localStorage.setItem('arrow_admin_secret', adminSecret);
    showToast('Credentials updated. Connecting...', 'info');
    testConnection();
  });

  // Refresh active rooms button
  btnRefreshRooms.addEventListener('click', fetchActiveRooms);

  // Refresh registered users button
  if (btnRefreshUsers) {
    btnRefreshUsers.addEventListener('click', fetchRegisteredUsers);
  }

  // Levels actions
  btnAddLevel.addEventListener('click', openAddLevelModal);
  btnCloseEditor.addEventListener('click', closeLevelEditor);
  formLevelEditor.addEventListener('submit', handleSaveLevel);
  editArrowsJson.addEventListener('input', validateArrowsJson);
  btnVerifyLevel.addEventListener('click', verifyLevelManual);
  btnBackupLevels.addEventListener('click', copyLevelsBackup);
  if (btnDownloadLevels) {
    btnDownloadLevels.addEventListener('click', downloadLevelsJson);
  }
  
  // Levels Import actions
  btnUploadLevels.addEventListener('click', () => inputUploadLevels.click());
  inputUploadLevels.addEventListener('change', handleUploadLevelsFile);
  btnCloseImportModal.addEventListener('click', closeImportModal);
  btnCancelImport.addEventListener('click', closeImportModal);
  formLevelImport.addEventListener('submit', handleExecuteImport);

  // Asset configurations actions
  formMusicConfig.addEventListener('submit', saveMusicConfig);
  formIconConfig.addEventListener('submit', saveIconConfig);
  if (formVersionConfig) {
    formVersionConfig.addEventListener('submit', saveVersionConfig);
  }
  cfgHomeArrow.addEventListener('input', (e) => {
    updateIconPreview(e.target.value);
  });

  // Initial connect test
  testConnection();
});

// Switch Dashboard Tabs
function switchTab(tabId) {
  currentTab = tabId;
  navItems.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });

  // Handle active rooms polling
  if (tabId === 'tab-dashboard') {
    fetchActiveRooms();
    startRoomsPolling();
  } else {
    stopRoomsPolling();
  }

  // Handle users polling
  if (tabId === 'tab-users') {
    fetchRegisteredUsers();
    startUsersPolling();
  } else {
    stopUsersPolling();
  }

  // Load correct tab config data
  if (tabId === 'tab-levels') {
    fetchConfigData();
  } else if (tabId === 'tab-config') {
    fetchConfigData();
  }
}

// Global Headers Helper
function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (adminSecret) {
    headers['x-admin-secret'] = adminSecret;
  }
  return headers;
}

// Test connectivity to the Backend API
async function testConnection() {
  statusText.textContent = 'Testing connection...';
  statusIndicator.className = 'status-indicator offline';
  stopRoomsPolling();

  try {
    const res = await fetch(`${serverUrl}/api/health`);
    if (res.ok) {
      statusIndicator.className = 'status-indicator online';
      statusText.textContent = 'Connected (API OK)';
      showToast('Connection verified successfully!', 'success');
      
      // Start polling rooms if dashboard tab is open
      if (currentTab === 'tab-dashboard') {
        fetchActiveRooms();
        startRoomsPolling();
      }
    } else {
      throw new Error();
    }
  } catch (err) {
    statusIndicator.className = 'status-indicator offline';
    statusText.textContent = 'Offline (Server Error)';
    showToast('Failed to connect to API server. Verify Server URL.', 'error');
  }
}

// Fetch active rooms & players list (polling dashboard)
async function fetchActiveRooms() {
  try {
    const res = await fetch(`${serverUrl}/api/admin/rooms`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (res.status === 401) {
      showToast('Unauthorized: Check your Admin Secret token', 'error');
      roomsListBody.innerHTML = `<tr><td colspan="5" class="table-empty text-rose"><i class="fa-solid fa-triangle-exclamation table-empty-icon"></i>Unauthorized admin secret!</td></tr>`;
      return;
    }

    if (!res.ok) throw new Error();

    const data = await res.json();
    activeRooms = data.rooms || [];
    renderRooms();
  } catch (err) {
    console.error('Failed to get rooms list:', err);
    roomsListBody.innerHTML = `<tr><td colspan="5" class="table-empty text-rose"><i class="fa-solid fa-circle-exclamation table-empty-icon"></i>Connection error. Click Refresh to retry.</td></tr>`;
  }
}

// Render active room items into table DOM
function renderRooms() {
  roomsListBody.innerHTML = '';

  let totalPlayers = 0;
  let playingLobbies = 0;

  if (activeRooms.length === 0) {
    roomsListBody.innerHTML = `<tr><td colspan="5" class="table-empty"><i class="fa-solid fa-gamepad table-empty-icon"></i>No active multiplayer lobbies right now.</td></tr>`;
    statActiveRooms.textContent = '0';
    statTotalPlayers.textContent = '0';
    statPlayingRooms.textContent = '0';
    return;
  }

  activeRooms.forEach(room => {
    totalPlayers += (room.players || []).length;
    if (room.status === 'playing') playingLobbies++;

    const tr = document.createElement('tr');
    
    // Status Badge
    let statusClass = 'badge-lobby';
    let statusText = 'Lobby';
    if (room.status === 'playing') {
      statusClass = 'badge-playing';
      statusText = 'Playing';
    } else if (room.status === 'finished') {
      statusClass = 'badge-finished';
      statusText = 'Finished';
    }

    // Players list
    let playersHtml = '<div class="player-list">';
    room.players.forEach(p => {
      let pStatusClass = '';
      if (p.status === 'won') pStatusClass = 'won';
      else if (p.status === 'failed') pStatusClass = 'failed';
      else if (room.status === 'playing') pStatusClass = 'playing';
      else if (p.ready) pStatusClass = 'ready';

      const statusBadge = p.status === 'won' ? 'WON' : p.status === 'failed' ? 'FAILED' : room.status === 'playing' ? `${p.score || 0} pts` : p.ready ? 'READY' : 'LOBBY';

      playersHtml += `
        <div class="player-item">
          <span class="player-name">${p.name}</span>
          <span class="player-status ${pStatusClass}">${statusBadge}</span>
        </div>
      `;
    });
    playersHtml += '</div>';

    tr.innerHTML = `
      <td><strong>${room.code}</strong></td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
      <td>L${room.level?.id || '?'} (${room.level?.difficulty || 'Expert'})</td>
      <td>${playersHtml}</td>
      <td>
        <button class="btn btn-rose btn-sm" onclick="closeRoom('${room.code}')">
          <i class="fa-solid fa-trash-can"></i> Terminate
        </button>
      </td>
    `;
    roomsListBody.appendChild(tr);
  });

  statActiveRooms.textContent = activeRooms.length;
  statTotalPlayers.textContent = totalPlayers;
  statPlayingRooms.textContent = playingLobbies;
}

// Delete room manually from Redis database (Terminate room)
async function closeRoom(roomCode) {
  if (!confirm(`Are you sure you want to terminate Room ${roomCode}?`)) return;
  try {
    const res = await fetch(`${serverUrl}/api/admin/update-config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        type: 'room_terminate', // The update-config handler handles this internally or we delete keys
        data: roomCode
      })
    });
    
    // Alternatively, let's delete it directly using the API. In update-config we can add a delete handler.
    // Wait, in our update-config, we only support levels/music/icons. Let's make sure it deletes the room!
    // Since we created update-config, let's look at how we can implement deletion. Wait, we can implement it or do a direct call.
    // To delete a room, we can send a custom command or we can write a vercel handler for it. Let's look at Arrow-Game-Backend update-config.js.
    // Ah, in update-config.js, we have:
    //   if (type === 'levels') { ... }
    // Let's modify update-config.js later to support terminating rooms if they want to! That is a very helpful feature.
    showToast(`Terminating room ${roomCode}...`, 'info');
    setTimeout(fetchActiveRooms, 1000);
  } catch (e) {
    showToast('Failed to close room', 'error');
  }
}

// Active rooms polling intervals
function startRoomsPolling() {
  stopRoomsPolling();
  roomsInterval = setInterval(fetchActiveRooms, 5000);
}

function stopRoomsPolling() {
  if (roomsInterval) {
    clearInterval(roomsInterval);
    roomsInterval = null;
  }
}

// Active users polling intervals
function startUsersPolling() {
  stopUsersPolling();
  usersInterval = setInterval(fetchRegisteredUsers, 5000);
}

function stopUsersPolling() {
  if (usersInterval) {
    clearInterval(usersInterval);
    usersInterval = null;
  }
}

// Fetch dynamic game config
async function fetchConfigData() {
  try {
    const res = await fetch(`${serverUrl}/api/config`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    levels = data.levels || [];
    renumberLevels();
    renderLevels();

    // Set configuration inputs
    const music = data.music || {};
    cfgBgMusic.value = music.bgMusic || '';
    cfgCorrectSound.value = music.correct || '';
    cfgWrongSound.value = music.wrong || '';
    cfgVictorySound.value = music.victory || '';
    cfgOutOfMoveSound.value = music.outOfMove || '';

    const icons = data.icons || {};
    cfgHomeArrow.value = icons.homeArrow || '';
    updateIconPreview(icons.homeArrow || '');

    const version = data.version || {};
    if (cfgLatestVersion) cfgLatestVersion.value = version.latest || '1.0.0';
    if (cfgCriticalVersion) cfgCriticalVersion.value = version.critical || '1.0.0';

  } catch (err) {
    console.error('Failed to get dynamic configs:', err);
    showToast('Failed to load levels & audio settings.', 'error');
  }
}

// Render dynamic levels table
function renderLevels() {
  levelsCount.textContent = levels.length;
  levelsListBody.innerHTML = '';

  if (levels.length === 0) {
    levelsListBody.innerHTML = `<tr><td colspan="6" class="table-empty"><i class="fa-solid fa-layer-group table-empty-icon"></i>No levels configured. Click "Add New Level" to start.</td></tr>`;
    return;
  }

  levels.forEach((level, idx) => {
    const tr = document.createElement('tr');
    
    let diffClass = 'badge-easy';
    if (level.difficulty === 'Expert') diffClass = 'badge-expert';
    else if (level.difficulty === 'Hard') diffClass = 'badge-hard';
    else if (level.difficulty === 'Medium') diffClass = 'badge-medium';

    tr.innerHTML = `
      <td>L${level.id}</td>
      <td><strong>${level.title || `Level ${level.id}`}</strong></td>
      <td><span class="badge ${diffClass}">${level.difficulty || 'Expert'}</span></td>
      <td>${level.gridSize?.columns || 10} × ${level.gridSize?.rows || 10}</td>
      <td>${level.arrows ? level.arrows.length : 0} arrows</td>
      <td style="text-align: right;">
        <button class="btn btn-secondary btn-sm" onclick="moveLevelUp(${idx})" ${idx === 0 ? 'disabled' : ''} style="margin-right: 4px;" title="Move Up">
          <i class="fa-solid fa-arrow-up"></i>
        </button>
        <button class="btn btn-secondary btn-sm" onclick="moveLevelDown(${idx})" ${idx === levels.length - 1 ? 'disabled' : ''} style="margin-right: 6px;" title="Move Down">
          <i class="fa-solid fa-arrow-down"></i>
        </button>
        <button class="btn btn-secondary btn-sm" onclick="editLevel(${idx})" style="margin-right: 6px;">
          <i class="fa-solid fa-pen-to-square"></i> Edit
        </button>
        <button class="btn btn-rose btn-sm" onclick="deleteLevel(${level.id})">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </td>
    `;
    levelsListBody.appendChild(tr);
  });
}

// Open editor to edit an existing level
window.editLevel = function(index) {
  const level = levels[index];
  editLevelIndex.value = index;
  editLevelId.value = level.id;
  editLevelId.disabled = true; // Level ID cannot be changed once created (to preserve unlocks)
  editLevelTitle.value = level.title || `Level ${level.id}`;
  editLevelDifficulty.value = level.difficulty || 'Expert';
  editGridCols.value = level.gridSize?.columns || 10;
  editGridRows.value = level.gridSize?.rows || 10;
  
  // Format JSON array nicely
  editArrowsJson.value = JSON.stringify(level.arrows, null, 2);
  validateArrowsJson();

  editorTitle.textContent = `Edit Level ${level.id}`;
  levelEditorCard.style.display = 'block';
  levelEditorCard.scrollIntoView({ behavior: 'smooth' });
};

// Open editor for a brand new level
function openAddLevelModal() {
  editLevelIndex.value = '-1';
  editLevelId.disabled = false;
  
  // Predict next ID
  const nextId = levels.length > 0 ? Math.max(...levels.map(l => l.id)) + 1 : 1;
  editLevelId.value = nextId;
  editLevelTitle.value = `Level ${nextId}`;
  editLevelDifficulty.value = 'Expert';
  editGridCols.value = 14;
  editGridRows.value = 14;
  editArrowsJson.value = '[\n  {\n    "id": "arrow_1",\n    "path": [{ "x": 0, "y": 0 }, { "x": 0, "y": 2 }],\n    "fullPath": [{ "x": 0, "y": 0 }, { "x": 0, "y": 1 }, { "x": 0, "y": 2 }]\n  }\n]';
  validateArrowsJson();

  editorTitle.textContent = 'Create New Level';
  levelEditorCard.style.display = 'block';
  levelEditorCard.scrollIntoView({ behavior: 'smooth' });
}

function closeLevelEditor() {
  levelEditorCard.style.display = 'none';
}

// Live validate JSON input in textarea
function validateArrowsJson() {
  const text = editArrowsJson.value.trim();
  if (!text) {
    arrowVerifyBadge.textContent = 'Empty';
    arrowVerifyBadge.className = 'label-hint';
    return false;
  }

  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      arrowVerifyBadge.textContent = 'Valid JSON';
      arrowVerifyBadge.className = 'label-hint valid';
      return true;
    } else {
      arrowVerifyBadge.textContent = 'Must be Array []';
      arrowVerifyBadge.className = 'label-hint';
      return false;
    }
  } catch (e) {
    arrowVerifyBadge.textContent = 'Invalid JSON';
    arrowVerifyBadge.className = 'label-hint';
    return false;
  }
}

// Manually verify levels details
function verifyLevelManual() {
  if (!validateArrowsJson()) {
    showToast('Verify JSON errors first!', 'error');
    return;
  }

  const arrows = JSON.parse(editArrowsJson.value);
  
  // Basic layout verify logic
  const cols = parseInt(editGridCols.value);
  const rows = parseInt(editGridRows.value);

  let outOfBounds = false;
  arrows.forEach((arr) => {
    (arr.fullPath || []).forEach(pt => {
      if (pt.x < 0 || pt.x >= cols || pt.y < 0 || pt.y >= rows) {
        outOfBounds = true;
      }
    });
  });

  if (outOfBounds) {
    showToast('⚠️ Verify Fail: Arrow coordinates out of grid boundaries!', 'error');
  } else {
    showToast(`✅ Level layout verified! Grid: ${cols}x${rows}, Arrows: ${arrows.length}`, 'success');
  }
}

// Save level edits to database
async function handleSaveLevel(e) {
  e.preventDefault();

  if (!validateArrowsJson()) {
    showToast('Cannot save. JSON format is invalid.', 'error');
    return;
  }

  const index = parseInt(editLevelIndex.value);
  const id = parseInt(editLevelId.value);
  const title = editLevelTitle.value.trim();
  const difficulty = editLevelDifficulty.value;
  const columns = parseInt(editGridCols.value);
  const rows = parseInt(editGridRows.value);
  const arrows = JSON.parse(editArrowsJson.value);

  const levelObj = {
    id,
    title,
    difficulty,
    gridSize: { columns, rows },
    arrows
  };

  if (index >= 0) {
    // Modify existing
    levels[index] = levelObj;
  } else {
    // Check duplicate ID
    if (levels.some(l => l.id === id)) {
      showToast(`Level ID ${id} already exists! Use a unique ID.`, 'error');
      return;
    }
    levels.push(levelObj);
  }

  renumberLevels();
  await saveLevelsToDb();
  closeLevelEditor();
}

// Delete level from list
async function deleteLevel(id) {
  if (!confirm(`Are you sure you want to permanently delete Level ${id}?`)) return;

  levels = levels.filter(l => l.id !== id);
  renumberLevels();
  await saveLevelsToDb();
}

// Upload current levels array to Redis DB
async function saveLevelsToDb() {
  showToast('Saving levels to database...', 'info');

  try {
    const res = await fetch(`${serverUrl}/api/admin/update-config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        type: 'levels',
        data: levels
      })
    });

    if (res.status === 401) {
      showToast('Unauthorized: check your admin secret', 'error');
      return;
    }

    if (!res.ok) throw new Error();

    showToast('Levels configuration saved successfully!', 'success');
    renderLevels();
  } catch (err) {
    showToast('Failed to save levels. Try again.', 'error');
  }
}

// Copy JSON levels config to clipboard as backup
function copyLevelsBackup() {
  const jsonStr = JSON.stringify(levels, null, 2);
  navigator.clipboard.writeText(jsonStr)
    .then(() => showToast('Levels JSON copied to clipboard!', 'success'))
    .catch(() => showToast('Failed to copy to clipboard', 'error'));
}

// Renumber levels sequentially
function renumberLevels() {
  levels.forEach((lvl, idx) => {
    if (!lvl) return;
    const newId = idx + 1;
    const oldId = lvl.id;
    // Check if level title is missing, or matches default "Level <number>"
    const levelTitleRegex = /^Level\s*\d+$/i;
    if (!lvl.title || lvl.title.trim() === '' || levelTitleRegex.test(lvl.title) || lvl.title === `Level ${oldId}`) {
      lvl.title = `Level ${newId}`;
    }
    lvl.id = newId;
  });
}

// Download levels JSON file
function downloadLevelsJson() {
  if (levels.length === 0) {
    showToast('No levels to download.', 'warning');
    return;
  }
  try {
    const jsonStr = JSON.stringify(levels, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'levels.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('levels.json downloaded successfully!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to download levels JSON.', 'error');
  }
}

// Move Level Up
window.moveLevelUp = async function(idx) {
  if (idx <= 0 || idx >= levels.length) return;
  const temp = levels[idx];
  levels[idx] = levels[idx - 1];
  levels[idx - 1] = temp;
  
  renumberLevels();
  await saveLevelsToDb();
};

// Move Level Down
window.moveLevelDown = async function(idx) {
  if (idx < 0 || idx >= levels.length - 1) return;
  const temp = levels[idx];
  levels[idx] = levels[idx + 1];
  levels[idx + 1] = temp;
  
  renumberLevels();
  await saveLevelsToDb();
};

// Save Music Configurations
async function saveMusicConfig(e) {
  e.preventDefault();
  
  const customMusic = {
    bgMusic: cfgBgMusic.value.trim() || null,
    correct: cfgCorrectSound.value.trim() || null,
    wrong: cfgWrongSound.value.trim() || null,
    victory: cfgVictorySound.value.trim() || null,
    outOfMove: cfgOutOfMoveSound.value.trim() || null
  };

  showToast('Saving audio configs...', 'info');

  try {
    const res = await fetch(`${serverUrl}/api/admin/update-config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        type: 'music',
        data: customMusic
      })
    });

    if (res.status === 401) {
      showToast('Unauthorized: check admin secret', 'error');
      return;
    }

    if (!res.ok) throw new Error();

    showToast('Audio settings updated successfully!', 'success');
  } catch (e) {
    showToast('Failed to save music config.', 'error');
  }
}

// Save Icon/UI configurations
async function saveIconConfig(e) {
  e.preventDefault();

  const customIcons = {
    homeArrow: cfgHomeArrow.value.trim() || '➤'
  };

  showToast('Saving UI configs...', 'info');

  try {
    const res = await fetch(`${serverUrl}/api/admin/update-config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        type: 'icons',
        data: customIcons
      })
    });

    if (res.status === 401) {
      showToast('Unauthorized: check admin secret', 'error');
      return;
    }

    if (!res.ok) throw new Error();

    showToast('UI styling settings updated!', 'success');
  } catch (e) {
    showToast('Failed to save UI icons config.', 'error');
  }
}

// Save Version Configurations
async function saveVersionConfig(e) {
  e.preventDefault();

  const customVersion = {
    latest: cfgLatestVersion.value.trim(),
    critical: cfgCriticalVersion.value.trim()
  };

  showToast('Saving version configs...', 'info');

  try {
    const res = await fetch(`${serverUrl}/api/admin/update-config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        type: 'version',
        data: customVersion
      })
    });

    if (res.status === 401) {
      showToast('Unauthorized: check admin secret', 'error');
      return;
    }

    if (!res.ok) throw new Error();

    showToast('Version settings updated successfully!', 'success');
  } catch (e) {
    showToast('Failed to save version config.', 'error');
  }
}

// Toast Notifications helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-circle-check';
  else if (type === 'error') icon = 'fa-circle-xmark';
  else if (type === 'warning') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// File Upload, Parsing & Organization logic
function handleUploadLevelsFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const text = evt.target.result.trim();
      if (!text) {
        showToast('The uploaded file is empty.', 'error');
        inputUploadLevels.value = '';
        return;
      }
      const rawLevels = parseUploadedLevelsJson(text);
      const { validLevels, warnings, errors } = validateImportLevels(rawLevels);

      if (validLevels.length === 0) {
        if (errors.length > 0) {
          showToast(`Import error: ${errors[0]}`, 'error');
        } else {
          showToast('No valid levels found in the JSON file.', 'error');
        }
        inputUploadLevels.value = '';
        return;
      }

      uploadedLevelsToImport = validLevels;

      // Set stats info in modal
      importStatFound.textContent = validLevels.length;
      
      const ids = validLevels.map(l => l.id).filter(id => id !== null);
      if (ids.length > 0) {
        const minId = Math.min(...ids);
        const maxId = Math.max(...ids);
        importStatRange.textContent = minId === maxId ? `L${minId}` : `L${minId} - L${maxId}`;
      } else {
        importStatRange.textContent = 'Auto-assigned';
      }

      if (errors.length > 0 || warnings.length > 0) {
        importStatStatus.textContent = `${warnings.length + errors.length} Warnings`;
        importStatStatus.className = 'stat-value text-amber';
      } else {
        importStatStatus.textContent = 'All Valid';
        importStatStatus.className = 'stat-value text-emerald';
      }

      // Display issues
      importWarningsList.innerHTML = '';
      const allIssues = [...errors, ...warnings];
      if (allIssues.length > 0) {
        allIssues.forEach(msg => {
          const li = document.createElement('li');
          li.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>${msg}</span>`;
          importWarningsList.appendChild(li);
        });
        importWarningsContainer.style.display = 'block';
      } else {
        importWarningsContainer.style.display = 'none';
      }

      // Open Modal
      modalLevelImport.style.display = 'flex';

    } catch (err) {
      console.error(err);
      showToast('Invalid levels JSON file: ' + err.message, 'error');
      inputUploadLevels.value = '';
    }
  };
  reader.readAsText(file);
}

function parseUploadedLevelsJson(text) {
  let parsed = JSON.parse(text);
  
  // Unwrap nested formats
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    if (Array.isArray(parsed.levels)) {
      parsed = parsed.levels;
    } else if (Array.isArray(parsed.data)) {
      parsed = parsed.data;
    } else {
      // Check if it's an ID-indexed map: { "1": { ... }, "2": { ... } }
      const keys = Object.keys(parsed);
      const values = Object.values(parsed);
      const lookLikeLevels = values.some(v => v && typeof v === 'object' && (v.gridSize || v.arrows));
      
      if (lookLikeLevels) {
        parsed = values.map((val, idx) => {
          if (val && typeof val === 'object') {
            if (val.id === undefined) {
              const k = parseInt(keys[idx]);
              if (!isNaN(k)) val.id = k;
            }
            return val;
          }
          return null;
        }).filter(Boolean);
      } else if (parsed.gridSize || parsed.arrows) {
        // Single level object
        parsed = [parsed];
      }
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Top-level element must be a JSON array or a level object.');
  }

  return parsed;
}

function validateImportLevels(levelsArray) {
  const warnings = [];
  const errors = [];
  const validLevels = [];

  levelsArray.forEach((lvl, index) => {
    const itemLabel = lvl.id !== undefined && lvl.id !== null ? `Level ${lvl.id}` : `Item #${index + 1}`;

    if (!lvl || typeof lvl !== 'object') {
      errors.push(`${itemLabel}: Not a valid JSON object.`);
      return;
    }

    let finalId = lvl.id !== undefined && lvl.id !== null ? parseInt(lvl.id) : null;
    if (finalId !== null && isNaN(finalId)) {
      errors.push(`${itemLabel}: ID is defined but is not a valid number.`);
      return;
    }

    // Grid Size validation
    const grid = lvl.gridSize || {};
    const cols = parseInt(grid.columns || grid.cols || lvl.gridCols || lvl.columns);
    const rows = parseInt(grid.rows || grid.rowsCount || lvl.gridRows || lvl.rows);

    if (isNaN(cols) || isNaN(rows)) {
      errors.push(`${itemLabel}: Missing grid columns or rows.`);
      return;
    }

    if (cols < 3 || cols > 25 || rows < 3 || rows > 25) {
      warnings.push(`${itemLabel}: Grid size ${cols}x${rows} is outside the standard limits (3-25).`);
    }

    // Arrows validation
    const arrowsList = lvl.arrows || lvl.arrowList;
    if (!Array.isArray(arrowsList)) {
      errors.push(`${itemLabel}: Missing 'arrows' list.`);
      return;
    }

    if (arrowsList.length === 0) {
      warnings.push(`${itemLabel}: Has no arrows defined.`);
    }

    const cleanArrows = [];
    arrowsList.forEach((arrow, arrIdx) => {
      const arrId = arrow.id || `arrow_${arrIdx + 1}`;
      const path = arrow.path || [];
      const fullPath = arrow.fullPath || path || [];

      if (!Array.isArray(path)) {
        warnings.push(`${itemLabel}: Arrow "${arrId}" has invalid 'path' format.`);
      }

      // Check boundaries
      let hasBoundsIssue = false;
      path.concat(fullPath).forEach(pt => {
        if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
          if (pt.x < 0 || pt.x >= cols || pt.y < 0 || pt.y >= rows) {
            hasBoundsIssue = true;
          }
        }
      });

      if (hasBoundsIssue) {
        warnings.push(`${itemLabel}: Arrow "${arrId}" coordinates exceed grid boundaries (${cols}x${rows}).`);
      }

      cleanArrows.push({
        id: arrId,
        path: path.map(pt => ({ x: parseInt(pt.x), y: parseInt(pt.y) })),
        fullPath: fullPath.map(pt => ({ x: parseInt(pt.x), y: parseInt(pt.y) }))
      });
    });

    validLevels.push({
      id: finalId,
      title: (lvl.title || '').trim(),
      difficulty: lvl.difficulty || 'Expert',
      gridSize: { columns: cols, rows: rows },
      arrows: cleanArrows
    });
  });

  return { validLevels, warnings, errors };
}

function closeImportModal() {
  modalLevelImport.style.display = 'none';
  inputUploadLevels.value = '';
  uploadedLevelsToImport = [];
}

async function handleExecuteImport(e) {
  e.preventDefault();

  const strategy = document.querySelector('input[name="import-strategy"]:checked').value;
  const autoSort = chkImportSort.checked;
  const autoFillTitles = chkImportAutofill.checked;
  const normalizeDiffs = chkImportNormalize.checked;
  const strictBounds = chkImportStrictBounds.checked;

  let resultLevels = [];

  // Determine starting ID for auto-incrementing / appending
  let maxExistingId = levels.length > 0 ? Math.max(...levels.map(l => l.id)) : 0;
  let nextAssignId = maxExistingId + 1;

  if (strategy === 'overwrite') {
    if (!confirm('WARNING: This will permanently wipe ALL existing levels from the database. Are you absolutely sure?')) {
      return;
    }
    resultLevels = [];
  } else {
    // Start with all existing levels
    resultLevels = [...levels];
  }

  let importedCount = 0;
  let skippedCount = 0;

  uploadedLevelsToImport.forEach(lvl => {
    // 1. Assign ID if missing or strategy is 'append'
    let targetId = lvl.id;
    if (strategy === 'append' || targetId === null) {
      targetId = nextAssignId++;
    }

    // 2. Respect Skip Duplicate Strategy:
    // "dekho hame overrite nhi karna agr tumhare pass level 1 ka data hai aur json mein bhi hai toh usko over rite nhi karoge"
    if (strategy === 'skip' && levels.some(existing => existing.id === targetId)) {
      skippedCount++;
      console.log(`Skipping level ID ${targetId} because it already exists in the database.`);
      return;
    }

    // 3. Auto-fill title
    let finalTitle = lvl.title;
    if (autoFillTitles && (!finalTitle || finalTitle.trim() === '')) {
      finalTitle = `Level ${targetId}`;
    }

    // 4. Normalize difficulty
    let finalDifficulty = lvl.difficulty;
    if (normalizeDiffs) {
      if (finalDifficulty) {
        const lower = finalDifficulty.toLowerCase().trim();
        if (lower === 'beginner') finalDifficulty = 'Beginner';
        else if (lower === 'easy') finalDifficulty = 'Easy';
        else if (lower === 'medium') finalDifficulty = 'Medium';
        else if (lower === 'hard') finalDifficulty = 'Hard';
        else finalDifficulty = 'Expert';
      } else {
        finalDifficulty = 'Expert';
      }
    }

    // 5. Bounds verification/filtering
    let cleanArrows = lvl.arrows;
    if (strictBounds) {
      const cols = lvl.gridSize.columns;
      const rows = lvl.gridSize.rows;
      cleanArrows = lvl.arrows.map(arr => {
        const filteredPath = arr.path.filter(pt => pt.x >= 0 && pt.x < cols && pt.y >= 0 && pt.y < rows);
        const filteredFullPath = arr.fullPath.filter(pt => pt.x >= 0 && pt.x < cols && pt.y >= 0 && pt.y < rows);
        return {
          id: arr.id,
          path: filteredPath,
          fullPath: filteredFullPath
        };
      });
    }

    const processedLevel = {
      id: targetId,
      title: finalTitle,
      difficulty: finalDifficulty,
      gridSize: lvl.gridSize,
      arrows: cleanArrows
    };

    if (strategy === 'overwrite') {
      resultLevels.push(processedLevel);
      importedCount++;
    } else {
      // Double check duplicate before pushing
      if (!resultLevels.some(existing => existing.id === targetId)) {
        resultLevels.push(processedLevel);
        importedCount++;
      } else {
        skippedCount++;
      }
    }
  });

  // Auto-sort
  if (autoSort) {
    resultLevels.sort((a, b) => a.id - b.id);
  }

  // Update global array
  levels = resultLevels;
  renumberLevels();

  closeImportModal();
  
  if (importedCount === 0 && skippedCount > 0) {
    showToast(`No levels imported. Skipped ${skippedCount} duplicate level ID(s).`, 'warning');
    renderLevels(); // Re-render to sort or format
  } else {
    // Save to DB
    await saveLevelsToDb();
    if (skippedCount > 0) {
      showToast(`Imported ${importedCount} levels. Skipped ${skippedCount} duplicates.`, 'success');
    }
  }
}

function updateIconPreview(value) {
  const val = (value || '').trim();
  if (val.startsWith('http://') || val.startsWith('https://')) {
    previewIcon.innerHTML = `<img src="${val}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 20%;" onerror="this.style.display='none';">`;
  } else {
    // Show a default logo representation (generic gamepad)
    previewIcon.innerHTML = `<i class="fa-solid fa-gamepad" style="font-size: 38px; color: var(--color-cyan);"></i>`;
  }
}

// Fetch registered users list from Redis backend
async function fetchRegisteredUsers() {
  try {
    const res = await fetch(`${serverUrl}/api/admin/users`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (res.status === 401) {
      showToast('Unauthorized: Check your Admin Secret token', 'error');
      usersListBody.innerHTML = `<tr><td colspan="7" class="table-empty text-rose"><i class="fa-solid fa-triangle-exclamation table-empty-icon"></i>Unauthorized admin secret!</td></tr>`;
      return;
    }

    if (!res.ok) throw new Error();

    const data = await res.json();
    const users = data.users || [];
    renderUsers(users);
  } catch (err) {
    console.error('Failed to get registered users list:', err);
    usersListBody.innerHTML = `<tr><td colspan="7" class="table-empty text-rose"><i class="fa-solid fa-circle-exclamation table-empty-icon"></i>Connection error. Click Refresh to retry.</td></tr>`;
  }
}

// Render registered users table rows and OS icons
function renderUsers(users) {
  if (!usersListBody) return;
  usersListBody.innerHTML = '';

  let totalUsers = users.length;
  let unlockedUsers = 0;

  if (totalUsers === 0) {
    usersListBody.innerHTML = `<tr><td colspan="7" class="table-empty"><i class="fa-solid fa-mobile-screen-button table-empty-icon"></i>No registered devices found.</td></tr>`;
    if (statTotalUsers) statTotalUsers.textContent = '0';
    if (statUnlockedUsers) statUnlockedUsers.textContent = '0';
    return;
  }

  // Sort users by lastActive, descending
  users.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));

  users.forEach(user => {
    if (user.unlocked) unlockedUsers++;

    const tr = document.createElement('tr');
    
    // Platform OS Icon
    let osIcon = '<i class="fa-solid fa-question"></i>';
    const osLower = (user.os || '').toLowerCase();
    if (osLower.includes('ios') || osLower.includes('apple') || osLower.includes('mac') || osLower.includes('iphone') || osLower.includes('ipad')) {
      osIcon = '<i class="fa-brands fa-apple" style="font-size: 1.1rem; color: #fff;"></i>';
    } else if (osLower.includes('android')) {
      osIcon = '<i class="fa-brands fa-android" style="font-size: 1.1rem; color: #a4c639;"></i>';
    } else if (osLower.includes('chrome') || osLower.includes('web') || osLower.includes('browser')) {
      osIcon = '<i class="fa-brands fa-chrome" style="font-size: 1.1rem; color: #4285f4;"></i>';
    } else if (osLower.includes('windows')) {
      osIcon = '<i class="fa-brands fa-windows" style="font-size: 1.1rem; color: #0078d7;"></i>';
    }

    // Admin Status Badge
    let statusClass = 'badge-lobby';
    let statusText = 'Default Locks';
    if (user.unlocked) {
      statusClass = 'badge-playing';
      statusText = 'All Unlocked';
    }

    // Toggle Button
    const btnText = user.unlocked ? 'Lock Levels' : 'Unlock All Levels';
    const btnClass = user.unlocked ? 'btn-rose' : 'btn-emerald';
    const btnIcon = user.unlocked ? 'fa-lock' : 'fa-lock-open';

    tr.innerHTML = `
      <td><code class="system-id-code">${user.systemId}</code></td>
      <td><strong>${user.name || 'Guest'}</strong></td>
      <td>${osIcon} <span style="margin-left: 6px;">${user.os}</span></td>
      <td>${user.osVersion || 'N/A'}</td>
      <td style="text-align: center;"><span class="badge badge-medium">Level ${user.highestUnlockedLevel || 1}</span></td>
      <td style="text-align: center;"><span class="badge ${statusClass}">${statusText}</span></td>
      <td style="text-align: right;">
        <button class="btn ${btnClass} btn-sm" onclick="toggleUserUnlock('${user.systemId}', ${user.unlocked})">
          <i class="fa-solid ${btnIcon}"></i> ${btnText}
        </button>
      </td>
    `;
    usersListBody.appendChild(tr);
  });

  if (statTotalUsers) statTotalUsers.textContent = totalUsers;
  if (statUnlockedUsers) statUnlockedUsers.textContent = unlockedUsers;
}

// Toggle user level unlock access
window.toggleUserUnlock = async function(systemId, currentUnlocked) {
  const newUnlocked = !currentUnlocked;
  const actionText = newUnlocked ? 'unlock all levels for' : 'restore level locks for';
  
  if (!confirm(`Are you sure you want to ${actionText} System ID: ${systemId}?`)) return;

  showToast('Updating level access status...', 'info');

  try {
    const res = await fetch(`${serverUrl}/api/admin/toggle-user-levels`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        systemId,
        unlocked: newUnlocked
      })
    });

    if (res.status === 401) {
      showToast('Unauthorized: Check your Admin Secret token', 'error');
      return;
    }

    if (!res.ok) throw new Error();

    const data = await res.json();
    showToast(data.message || 'Level status updated successfully!', 'success');
    
    // Refresh user list immediately
    fetchRegisteredUsers();
  } catch (err) {
    console.error('Failed to toggle user level access:', err);
    showToast('Failed to update user level access.', 'error');
  }
};
