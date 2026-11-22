/* ==========================================================
   pages/koneksi.js - halaman Koneksi IP
   ========================================================== */
window.Koneksi = (function () {
  const $ = V.$;

  function render() {
    const s = V.lastStatus;
    if (V.online) {
      $('ks-dot').className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse';
      $('ks-text').className = 'text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono';
      $('ks-text').textContent = 'STATUS: TERHUBUNG';
    } else {
      $('ks-dot').className = 'w-2.5 h-2.5 rounded-full bg-slate-500';
      $('ks-text').className = 'text-xs font-bold uppercase tracking-wider text-slate-400 font-mono';
      $('ks-text').textContent = 'STATUS: TIDAK TERHUBUNG';
    }
    $('ks-ip').textContent = V.online && s ? s.ip : '-';
    $('ks-ssid').textContent = V.online && s ? s.ssid : '-';
    $('ks-lat').textContent = V.online ? V.latency + ' ms' : '-';
  }

  function setIp(ip) {
    $('inp-ip').value = ip;
    $('inp-port').value = '80';
  }

  async function connect() {
    const ip = $('inp-ip').value.trim();
    const port = $('inp-port').value.trim() || '80';
    if (!ip) return V.toast('Isi alamat IP terlebih dahulu');
    if (location.protocol === 'https:') {
      V.toast('Halaman https:// bisa memblokir panggilan ke board (http). Buka lewat http:// atau file lokal.');
    }
    const btn = $('btn-connect');
    btn.disabled = true;
    $('btn-connect-text').textContent = 'Menghubungkan...';
    try {
      await V.connectTo(ip, port);
      V.toast('Terhubung ke ' + ip);
      setTimeout(() => { location.href = 'saklar.html'; }, 500);
    } catch (e) {
      V.toast('Gagal terhubung ke ' + ip + '. Cek IP, port, dan jaringan.');
      btn.disabled = false;
      $('btn-connect-text').textContent = 'Sambungkan Perangkat';
    }
  }

  function disconnect() {
    V.disconnect();
    V.toast('Koneksi diputuskan');
  }

  async function ping() {
    const ms = await V.pingTest();
    if (ms != null) $('ks-lat').textContent = ms + ' ms';
  }

  function init() {
    const ip = V.store.get('ip'), port = V.store.get('port');
    if (ip) $('inp-ip').value = ip;
    if (port) $('inp-port').value = port;
    V.on('online', render);
    V.on('status', render);
    render();
  }

  V.page = { init };
  return { setIp, connect, disconnect, ping };
})();
