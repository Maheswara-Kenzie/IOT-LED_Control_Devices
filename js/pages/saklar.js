/* ==========================================================
   pages/saklar.js - halaman Saklar Lampu
   ========================================================== */
window.Saklar = (function () {
  const $ = V.$;
  let busy = 0;   // >0 saat perintah sedang dikirim (hindari kedip akibat polling)

  function build() {
    $('lamp-list').innerHTML = Object.entries(V.LAMPS).map(([k, L]) => `
      <div class="bg-[#0f131c] rounded-xl border border-[#242b3d] p-4 flex items-center justify-between transition-all duration-300 ${L.hover}" id="card-${k}">
        <div class="flex items-center space-x-3.5">
          <div class="w-11 h-11 rounded-xl bg-slate-900 border border-[#242b3d] flex items-center justify-center text-slate-500 transition-all duration-300" id="icon-${k}">${V.BULB_OFF}</div>
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="text-sm font-bold text-white">${L.label}</span>
              <span class="text-[10px] font-mono border px-1.5 py-0.5 rounded ${L.badge}">${L.pin}</span>
            </div>
            <div class="text-xs text-slate-400 mt-0.5">${L.loc}</div>
            <div class="text-[11px] font-mono text-slate-500 mt-0.5" id="status-${k}">Mati (OFF)</div>
          </div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input class="sr-only peer" id="sw-${k}" data-lamp="${k}" type="checkbox"/>
          <div class="w-14 h-7 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all ${L.sw}"></div>
        </label>
      </div>`).join('');

    $('dot-row').innerHTML = Object.entries(V.LAMPS).map(([k, L]) =>
      `<span class="w-2.5 h-2.5 rounded-full transition-all duration-300 ${L.dotOff}" id="dot-${k}"></span>`).join('');

    Object.keys(V.LAMPS).forEach(k => {
      $('sw-' + k).addEventListener('change', () => toggleLampu(k));
      setLampUI(k, false);
    });
  }

  function setLampUI(k, on) {
    const L = V.LAMPS[k];
    $('card-' + k).className = 'bg-[#0f131c] rounded-xl border p-4 flex items-center justify-between transition-all duration-300 ' + (on ? L.card : 'border-[#242b3d] ' + L.hover);
    $('icon-' + k).className = 'w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 ' + (on ? L.icon : 'bg-slate-900 border-[#242b3d] text-slate-500');
    $('icon-' + k).innerHTML = on ? V.BULB_ON : V.BULB_OFF;
    $('status-' + k).className = 'text-[11px] font-mono mt-0.5 ' + (on ? L.txt : 'text-slate-500');
    $('status-' + k).textContent = on ? 'Menyala (Aktif)' : 'Mati (OFF)';
    $('dot-' + k).className = 'w-2.5 h-2.5 rounded-full transition-all duration-300 ' + (on ? L.dot : L.dotOff);
  }

  function setDiskoUI(on) {
    $('card-disko').classList.toggle('border-sky-400', on);
    $('card-disko').classList.toggle('shadow-[0_0_15px_rgba(56,189,248,0.25)]', on);
    $('icon-disko').className = on
      ? 'w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.4)] shrink-0 animate-pulse transition-all duration-300'
      : 'w-10 h-10 rounded-lg bg-slate-900 border border-[#242b3d] flex items-center justify-center text-slate-500 shrink-0 transition-all duration-300';
    $('status-disko-txt').textContent = on ? 'Siklus bergantian: AKTIF' : 'Siklus otomatis bergantian (Off)';
    $('status-disko-txt').className = on ? 'text-[11px] text-sky-400 font-mono font-medium' : 'text-[11px] text-slate-400';
  }

  function apply(s) {
    let count = 0;
    for (const k in V.LAMPS) {
      const on = !!(s.leds && s.leds[k]);
      if (on) count++;
      $('sw-' + k).checked = on;
      setLampUI(k, on);
    }
    $('active-count-label').textContent = `${count} dari 3 Lampu Menyala`;
    $('sw-disko').checked = !!s.disko;
    setDiskoUI(!!s.disko);
  }

  async function act(path, revert) {
    if (!V.online) { V.toast('Belum terhubung ke board. Buka halaman Koneksi.'); if (revert) revert(); return; }
    busy++;
    try {
      const s = await V.api(path);
      V.lastStatus = s;
      apply(s);
    } catch (e) {
      if (revert) revert();
      V.toast('Perintah gagal: board tidak merespons');
    } finally { busy--; }
  }

  function toggleLampu(k) {
    const sw = $('sw-' + k), want = sw.checked;
    act(`/api/led?c=${k}&s=${want ? 1 : 0}`, () => { sw.checked = !want; });
  }

  function toggleAll(on) { act(`/api/all?s=${on ? 1 : 0}`); }

  function toggleDisko(on) {
    const sw = $('sw-disko');
    act(`/api/disko?s=${on ? 1 : 0}`, () => { sw.checked = !on; });
  }

  function init() {
    build();
    $('sw-disko').addEventListener('change', e => toggleDisko(e.target.checked));
    V.on('status', s => { if (!busy) apply(s); });
  }

  V.page = { init };
  return { toggleAll };
})();
