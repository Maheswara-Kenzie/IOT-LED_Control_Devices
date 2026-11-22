/* ==========================================================
   ui.js - helper umum: DOM, toast, format waktu, master glow
   ========================================================== */
V.$ = id => document.getElementById(id);

V.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* localStorage aman (bisa error di mode privat) */
V.store = {
  get(k) { try { return localStorage.getItem('verisium.' + k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem('verisium.' + k, v); } catch (e) {} }
};

/* ---------- Toast ---------- */
V.toast = function (msg) {
  const t = V.$('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('opacity-0');
  clearTimeout(V.toast._t);
  V.toast._t = setTimeout(() => t.classList.add('opacity-0'), 2600);
};

/* ---------- Format ---------- */
const pad = x => String(x).padStart(2, '0');

/* t = epoch detik (jam lokal) atau uptime detik (T+hh:mm:ss) */
V.fmtT = function (t) {
  if (t > 1.6e9) {
    return new Date(t * 1000).toLocaleTimeString('id-ID', { hour12: false }).replace(/\./g, ':');
  }
  return 'T+' + pad(Math.floor(t / 3600)) + ':' + pad(Math.floor(t % 3600 / 60)) + ':' + pad(t % 60);
};

V.clockNow = () => new Date().toLocaleTimeString('id-ID', { hour12: false }).replace(/\./g, ':');

V.fmtUp = function (s) {
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return h ? `${h}j ${m}m` : `${m}m ${s % 60}d`;
};

V.fmtDur = function (s) {
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return h ? `${h}j ${m}m` : (m ? `${m}m ${s % 60}d` : `${s}d`);
};

/* ---------- Master Glow (disimpan antar halaman) ---------- */
V.toggleGlow = function (on) {
  document.body.classList.toggle('master-glow-disabled', !on);
  V.store.set('glow', on ? '1' : '0');
};

V.applyGlowPref = function () {
  const on = V.store.get('glow') !== '0';
  document.body.classList.toggle('master-glow-disabled', !on);
  return on;
};
