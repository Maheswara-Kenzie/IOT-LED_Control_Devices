const $ = (id) => document.getElementById(id);

const LEDS = ['merah', 'kuning', 'hijau'];
const CAP = { merah: 'Merah', kuning: 'Kuning', hijau: 'Hijau' };
const POLL_MS = 2000;
const TIMEOUT_MS = 3000;
const HISTORY_KEY = 'esp-led-history';
const HISTORY_LIMIT = 100;

let baseUrl = '';
let connected = false;
let pending = 0;
let pollTimer = null;
let discoTimer = null;
let discoIndex = 0;
let discoEnabled = false;
let state = { merah: false, kuning: false, hijau: false };
let reportedState = null;
let history = loadHistory();

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
    const events = Array.isArray(saved.events) ? saved.events.filter((event) => {
      if (!event || typeof event.at !== 'string' || Number.isNaN(Date.parse(event.at))) return false;
      if (event.kind === 'disco-start' || event.kind === 'disco-stop') return true;
      return LEDS.includes(event.led) && typeof event.on === 'boolean';
    }).map((event) => ({ ...event, kind: event.kind || 'led' })).slice(0, HISTORY_LIMIT) : [];
    const activeSince = {};
    LEDS.forEach((led) => {
      if (saved.activeSince && typeof saved.activeSince[led] === 'string' &&
          !Number.isNaN(Date.parse(saved.activeSince[led]))) {
        activeSince[led] = saved.activeSince[led];
      }
    });
    const discoActiveSince = typeof saved.discoActiveSince === 'string' &&
      !Number.isNaN(Date.parse(saved.discoActiveSince)) ? saved.discoActiveSince : null;
    return { events, activeSince, discoActiveSince };
  } catch (err) {
    $('historyNote').textContent = 'Riwayat sebelumnya tidak dapat dibaca dari penyimpanan browser.';
    return { events: [], activeSince: {}, discoActiveSince: null };
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    $('historyNote').textContent = 'Penyimpanan browser tidak tersedia; riwayat hanya tersimpan selama halaman ini terbuka.';
  }
}

function formatDuration(milliseconds) {
  let seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  const parts = [];
  if (days) parts.push(days + ' hari');
  if (hours) parts.push(hours + ' jam');
  if (minutes) parts.push(minutes + ' menit');
  if (seconds || !parts.length) parts.push(seconds + ' detik');
  return parts.join(' ');
}

function addHistoryEvent(led, on, at, durationMs) {
  history.events.unshift({ kind: 'led', led, on, at, durationMs });
  history.events = history.events.slice(0, HISTORY_LIMIT);
}

function addDiscoEvent(kind, at, durationMs) {
  history.events.unshift({ kind, at, durationMs });
  history.events = history.events.slice(0, HISTORY_LIMIT);
}

function observeStatus(next, recordLedEvents = true) {
  const at = new Date().toISOString();
  let changed = false;

  if (reportedState === null) {
    reportedState = {};
    LEDS.forEach((led) => {
      if (typeof next[led] !== 'boolean') return;
      const activeAt = history.activeSince[led];
      if (recordLedEvents && next[led] && !activeAt) {
        history.activeSince[led] = at;
        addHistoryEvent(led, true, at);
        changed = true;
      } else if (recordLedEvents && !next[led] && activeAt) {
        addHistoryEvent(led, false, at, Date.parse(at) - Date.parse(activeAt));
        delete history.activeSince[led];
        changed = true;
      }
    });
  } else {
    LEDS.forEach((led) => {
      if (typeof next[led] !== 'boolean' || reportedState[led] === next[led]) return;
      if (!recordLedEvents) {
        reportedState[led] = next[led];
        return;
      }
      if (next[led]) {
        history.activeSince[led] = at;
        addHistoryEvent(led, true, at);
      } else {
        const activeAt = history.activeSince[led];
        addHistoryEvent(led, false, at, activeAt ? Date.parse(at) - Date.parse(activeAt) : null);
        delete history.activeSince[led];
      }
      changed = true;
    });
  }

  LEDS.forEach((led) => {
    if (typeof next[led] === 'boolean') reportedState[led] = next[led];
  });
  if (changed) {
    saveHistory();
    renderHistory();
  }
}

function renderHistory() {
  const list = $('historyList');
  list.replaceChildren();
  $('historyEmpty').hidden = history.events.length > 0;
  $('historyCount').textContent = history.events.length + ' aktivitas';

  history.events.forEach((event) => {
    const item = document.createElement('li');
    const isDisco = event.kind === 'disco-start' || event.kind === 'disco-stop';
    const isOn = event.kind === 'disco-start' || event.on;
    item.className = 'history-item ' + (isDisco ? 'is-disco' : '') + (isOn ? ' is-on' : ' is-off');

    const indicator = document.createElement('span');
    indicator.className = 'history-indicator';
    indicator.setAttribute('aria-hidden', 'true');

    const details = document.createElement('div');
    details.className = 'history-details';
    const title = document.createElement('strong');
    title.textContent = isDisco
      ? 'Mode disko ' + (event.kind === 'disco-start' ? 'dimulai' : 'dihentikan')
      : 'LED ' + CAP[event.led] + ' ' + (event.on ? 'menyala' : 'mati');
    const time = document.createElement('time');
    time.dateTime = event.at;
    time.textContent = new Date(event.at).toLocaleString('id-ID');
    details.append(title, time);

    const duration = document.createElement('span');
    duration.className = 'history-duration';
    const activeAt = history.activeSince[event.led];
    if (event.kind === 'disco-start' && history.discoActiveSince === event.at) {
      duration.textContent = 'Berjalan selama ' + formatDuration(Date.now() - Date.parse(event.at));
    } else if (event.kind === 'disco-stop' && typeof event.durationMs === 'number') {
      duration.textContent = 'Durasi mode ' + formatDuration(event.durationMs);
    } else if (!isDisco && event.on && activeAt === event.at) {
      duration.textContent = 'Menyala selama ' + formatDuration(Date.now() - Date.parse(activeAt));
    } else if (!isDisco && !event.on && typeof event.durationMs === 'number') {
      duration.textContent = 'Durasi menyala ' + formatDuration(event.durationMs);
    }

    item.append(indicator, details, duration);
    list.append(item);
  });
}

function resetHistory() {
  if (!window.confirm('Hapus riwayat lampu yang sudah selesai? Sesi yang masih berjalan akan tetap disimpan agar durasinya akurat.')) return;

  history.events = [];
  LEDS.forEach((led) => {
    const at = history.activeSince[led];
    if (at) history.events.push({ kind: 'led', led, on: true, at });
  });
  if (history.discoActiveSince) {
    history.events.push({ kind: 'disco-start', at: history.discoActiveSince });
  }
  history.events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  saveHistory();
  renderHistory();
}

function normalizeIp(value) {
  const v = value.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  return v ? 'http://' + v : '';
}

async function api(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(baseUrl + path, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function render(next) {
  LEDS.forEach((led) => {
    if (typeof next[led] !== 'boolean') return;
    state[led] = next[led];
    const on = state[led];
    const c = CAP[led];
    $('card' + c).classList.toggle('on', on);
    $('state' + c).textContent = on ? 'MENYALA' : 'MATI';
    $('sw' + c).setAttribute('aria-checked', String(on));
  });
}

function setConnected(ok, message) {
  connected = ok;
  if (!ok) {
    stopDisco();
    reportedState = null;
  }
  $('dot').classList.toggle('on', ok);
  $('statusText').textContent = message || (ok ? 'Terhubung ke ESP8266' : 'Tidak terhubung');
  $('liveLabel').classList.toggle('off', !ok);
  $('liveText').textContent = ok ? 'LIVE' : 'OFFLINE';
  document.querySelectorAll('.switch, #allOn, #allOff, #discoToggle').forEach((el) => {
    el.disabled = !ok;
  });
  if (ok) $('updated').textContent = new Date().toLocaleTimeString('id-ID');
}

async function poll() {
  if (!baseUrl || pending > 0) return;
  try {
    const next = await api('/status');
    observeStatus(next);
    render(next);
    setConnected(true);
  } catch (err) {
    setConnected(false, 'Tidak terhubung. Cek IP dan WiFi.');
  }
}

async function send(path, optimistic) {
  const before = { ...state };
  pending++;
  render(optimistic);
  try {
    const next = await api(path);
    observeStatus(next);
    render(next);
    setConnected(true);
  } catch (err) {
    render(before);
    setConnected(false, 'Perintah gagal dikirim.');
  } finally {
    pending--;
  }
}

function toggle(led) {
  if (!connected) return;
  stopDisco();
  const want = !state[led];
  send('/set?led=' + led + '&state=' + (want ? 1 : 0), { [led]: want });
}

function setAll(on) {
  if (!connected) return;
  stopDisco();
  send('/all?state=' + (on ? 1 : 0), { merah: on, kuning: on, hijau: on });
}

function stopDisco() {
  if (discoEnabled && history.discoActiveSince) {
    const stoppedAt = new Date().toISOString();
    addDiscoEvent('disco-stop', stoppedAt, Date.parse(stoppedAt) - Date.parse(history.discoActiveSince));
    history.discoActiveSince = null;
    saveHistory();
    renderHistory();
  }
  discoEnabled = false;
  clearInterval(discoTimer);
  discoTimer = null;
  $('discoToggle').textContent = 'Mulai mode disko';
  $('discoToggle').setAttribute('aria-pressed', 'false');
  $('discoToggle').classList.remove('active');
}

async function advanceDisco() {
  if (!connected || !discoEnabled || pending > 0) return;

  const before = { ...state };
  const selected = LEDS[discoIndex];
  const next = Object.fromEntries(LEDS.map((led) => [led, led === selected]));
  discoIndex = (discoIndex + 1) % LEDS.length;
  pending++;
  render(next);
  try {
    for (const led of LEDS) {
      if (before[led] === next[led]) continue;
      const response = await api('/set?led=' + led + '&state=' + (next[led] ? 1 : 0));
      observeStatus(response, false);
      render(response);
    }
    setConnected(true);
  } catch (err) {
    render(before);
    stopDisco();
    setConnected(false, 'Mode disko berhenti. Perintah gagal dikirim.');
  } finally {
    pending--;
  }
}

function toggleDisco() {
  if (!connected) return;
  if (discoEnabled) {
    stopDisco();
    return;
  }
  discoEnabled = true;
  discoIndex = 0;
  history.discoActiveSince = new Date().toISOString();
  addDiscoEvent('disco-start', history.discoActiveSince);
  saveHistory();
  renderHistory();
  $('discoToggle').textContent = 'Hentikan mode disko';
  $('discoToggle').setAttribute('aria-pressed', 'true');
  $('discoToggle').classList.add('active');
  advanceDisco();
  discoTimer = setInterval(advanceDisco, 700);
}

function connect() {
  clearInterval(pollTimer);
  if (!baseUrl) {
    setConnected(false, 'Masukkan alamat IP ESP8266.');
    return;
  }
  if (location.protocol === 'https:') {
    setConnected(false, 'Halaman HTTPS tidak bisa mengakses ESP8266 (http). Buka lewat file atau http.');
    return;
  }
  setConnected(false, 'Menyambung...');
  poll();
  pollTimer = setInterval(poll, POLL_MS);
}

function saveAndConnect() {
  baseUrl = normalizeIp($('ip').value);
  try {
    localStorage.setItem('esp-led-ip', $('ip').value.trim());
  } catch (err) {}
  connect();
}

document.querySelectorAll('.switch').forEach((btn) => {
  btn.addEventListener('click', () => toggle(btn.dataset.led));
});
$('allOn').addEventListener('click', () => setAll(true));
$('allOff').addEventListener('click', () => setAll(false));
$('discoToggle').addEventListener('click', toggleDisco);
$('resetHistory').addEventListener('click', resetHistory);
$('save').addEventListener('click', saveAndConnect);
$('ip').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveAndConnect();
});

if (history.discoActiveSince) {
  const stoppedAt = new Date().toISOString();
  addDiscoEvent('disco-stop', stoppedAt, Date.parse(stoppedAt) - Date.parse(history.discoActiveSince));
  history.discoActiveSince = null;
  saveHistory();
}

try {
  const saved = localStorage.getItem('esp-led-ip');
  if (saved) {
    $('ip').value = saved;
    baseUrl = normalizeIp(saved);
  }
} catch (err) {}
connect();
renderHistory();
setInterval(renderHistory, 1000);
