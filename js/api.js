/* ==========================================================
   api.js - koneksi ke ESP8266: fetch, polling, event sederhana
   Status koneksi disimpan di localStorage supaya berlaku di
   semua halaman (tiap halaman menyambung ulang otomatis).

   Event:  V.on('status', fn(s))        tiap polling berhasil
           V.on('online', fn(on, label)) status online berubah
   ========================================================== */
(function () {
  const listeners = {};
  V.on = (evt, fn) => { (listeners[evt] = listeners[evt] || []).push(fn); };
  V.emit = (evt, ...args) => (listeners[evt] || []).forEach(fn => { try { fn(...args); } catch (e) { console.error(e); } });

  let pollT = null, fails = 0;

  const makeBase = (ip, port) => `http://${ip}${(!port || port === '80') ? '' : ':' + port}`;

  /* Panggil endpoint board, balasan JSON */
  V.api = async function (path, timeout = 2500) {
    if (!V.base) throw new Error('belum terhubung');
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), timeout);
    const t0 = performance.now();
    try {
      const r = await fetch(V.base + path, { signal: ctl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      V.latency = Math.round(performance.now() - t0);
      return j;
    } finally { clearTimeout(to); }
  };

  V.setOnline = function (on, label) {
    V.online = on;
    V.emit('online', on, label);
  };

  async function poll() {
    if (!V.base) return;
    try {
      const s = await V.api('/api/status');
      fails = 0;
      V.lastStatus = s;
      if (!V.online) V.setOnline(true);
      V.emit('status', s);
    } catch (e) {
      if (++fails >= 3 && V.online) V.setOnline(false, 'TERPUTUS');
    }
    pollT = setTimeout(poll, 1000);
  }

  V.startPoll = function () { clearTimeout(pollT); fails = 0; pollT = setTimeout(poll, 1000); };
  V.stopPoll = function () { clearTimeout(pollT); pollT = null; };

  /* Sambung manual (dipanggil halaman Koneksi). Melempar error jika gagal. */
  V.connectTo = async function (ip, port) {
    V.stopPoll();
    V.base = makeBase(ip, port);
    try {
      const s = await V.api('/api/status', 4000);
      V.store.set('ip', ip);
      V.store.set('port', port || '80');
      V.store.set('connected', '1');
      V.lastStatus = s;
      V.setOnline(true);
      V.emit('status', s);
      V.startPoll();
      return s;
    } catch (e) {
      V.base = null;
      V.setOnline(false);
      throw e;
    }
  };

  V.disconnect = function () {
    V.stopPoll();
    V.base = null;
    V.lastStatus = null;
    V.store.set('connected', '0');
    V.setOnline(false);
  };

  /* Sambung ulang otomatis memakai IP tersimpan (semua halaman) */
  V.autoConnect = async function () {
    const ip = V.store.get('ip'), port = V.store.get('port') || '80';
    if (!ip || V.store.get('connected') !== '1') { V.setOnline(false); return; }
    V.base = makeBase(ip, port);
    try {
      const s = await V.api('/api/status', 3500);
      V.lastStatus = s;
      V.setOnline(true);
      V.emit('status', s);
      V.startPoll();
    } catch (e) {
      V.base = null;
      V.setOnline(false);
      if (V.pageId !== 'koneksi') V.toast('Tidak bisa terhubung ke board. Cek halaman Koneksi.');
    }
  };

  V.pingTest = async function () {
    if (!V.base) return V.toast('Belum terhubung ke board');
    try { await V.api('/api/ping'); V.toast(`Ping: ${V.latency} ms`); return V.latency; }
    catch (e) { V.toast('Ping gagal: board tidak merespons'); }
  };
})();
