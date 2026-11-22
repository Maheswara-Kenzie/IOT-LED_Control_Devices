/* ==========================================================
   pages/riwayat.js - halaman Riwayat Aktivitas
   ========================================================== */
window.Riwayat = (function () {
  const $ = V.$;
  let hist = [], filter = 'all', lastHc = -1;

  async function load() {
    if (!V.base) return;
    try { hist = await V.api('/api/history'); render(); } catch (e) {}
  }

  /* Total durasi lampu menyala (dari pasangan ON -> OFF) */
  function totalDuration() {
    const nowT = V.lastStatus ? V.lastStatus.now : 0;
    const started = {};
    let tot = 0;
    hist.forEach(e => {
      if (!V.LAMPS[e.c]) return;
      if (e.s) { if (started[e.c] == null) started[e.c] = e.t; }
      else if (started[e.c] != null) { tot += e.t - started[e.c]; delete started[e.c]; }
    });
    for (const k in started) tot += Math.max(0, nowT - started[k]);
    return tot;
  }

  function entryHtml(e) {
    const L = V.LAMPS[e.c];
    const title = L ? `${L.label} ${e.s ? 'Dinyalakan' : 'Dimatikan'}` : `Mode Disko ${e.s ? 'Dimulai' : 'Dihentikan'}`;
    const iconCls = L ? L.hist : 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    const badge = L
      ? (e.s ? '<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold">ON</span>'
             : '<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">OFF</span>')
      : '<span class="px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/40 text-[10px] font-bold">INFO</span>';
    return `<div class="bg-[#0f131c] border border-[#242b3d] p-3 rounded-lg flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-lg border flex items-center justify-center ${iconCls}">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7z"></path></svg>
        </div>
        <div>
          <div class="text-white font-semibold text-xs">${title}</div>
          <div class="text-[10px] text-slate-400">${V.fmtT(e.t)} · ${V.SRC[e.src] || V.esc(e.src)}</div>
        </div>
      </div>${badge}</div>`;
  }

  function render() {
    const sorted = hist.map((e, i) => ({ ...e, i })).sort((a, b) => b.t - a.t || b.i - a.i);
    const shown = sorted.filter(e => filter === 'all' || e.c === filter);
    const last = sorted[0];
    const max = V.lastStatus ? V.lastStatus.hmax : 40;

    $('h-total').textContent = hist.length;
    $('h-dur').textContent = V.fmtDur(totalDuration());
    $('h-last').textContent = last ? V.fmtT(last.t) : '-';
    $('h-last-sub').textContent = last
      ? (V.LAMPS[last.c] ? `${V.LAMPS[last.c].short} ${last.s ? 'ON' : 'OFF'}` : `Disko ${last.s ? 'ON' : 'OFF'}`)
      : '-';
    $('h-shown').textContent = `${shown.length} Entri Ditampilkan`;
    $('h-count').textContent = `${shown.length} Peristiwa`;
    $('h-date').textContent = 'RIWAYAT · ' + new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    $('h-buf').textContent = `Buffer Riwayat: ${hist.length}/${max} entri`;
    $('h-list').innerHTML = shown.length
      ? shown.map(entryHtml).join('')
      : '<div class="text-center text-slate-500 text-xs py-6">Belum ada riwayat.</div>';
  }

  function setFilter(f) {
    filter = f;
    document.querySelectorAll('#h-filters button').forEach(b => {
      const on = b.dataset.f === f;
      b.classList.toggle('ring-2', on);
      b.classList.toggle('ring-sky-400', on);
      b.classList.toggle('font-bold', on);
    });
    render();
  }

  function exportCsv() {
    if (!hist.length) return V.toast('Belum ada riwayat untuk diekspor');
    const rows = ['waktu,perangkat,status,sumber'];
    [...hist].sort((a, b) => a.t - b.t).forEach(e =>
      rows.push([V.fmtT(e.t), e.c, e.s ? 'ON' : 'OFF', e.src].join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    a.download = 'verisium-riwayat.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function clear() {
    if (!V.online) return V.toast('Belum terhubung ke board');
    if (!confirm('Hapus seluruh riwayat di board?')) return;
    try { await V.api('/api/history/clear'); hist = []; render(); V.toast('Riwayat dibersihkan'); }
    catch (e) { V.toast('Gagal menghapus riwayat'); }
  }

  function init() {
    setFilter('all');
    V.on('status', s => { if (s.hc !== lastHc) { lastHc = s.hc; load(); } });
  }

  V.page = { init };
  return { setFilter, exportCsv, clear };
})();
