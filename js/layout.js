/* ==========================================================
   layout.js - kerangka bersama: header, tab atas, navigasi bawah
   Tiap halaman hanya menyediakan placeholder:
     #app-header, #app-tabs, #app-nav
   ========================================================== */
(function () {
  const icon = (t, cls) =>
    `<svg class="${cls}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="${t.icon}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function headerHtml(glowOn) {
    return `
<header class="sticky top-0 z-50 bg-[#0f131c]/95 backdrop-blur-md border-b border-sky-500/30 px-4 py-3 shadow-lg shadow-sky-950/20">
  <div class="max-w-md mx-auto flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="w-9 h-9 rounded-lg bg-sky-950/70 border border-sky-400/50 flex items-center justify-center p-0.5 shadow-[0_0_15px_rgba(56,189,248,0.3)] shrink-0 overflow-hidden">
        <img alt="Verisium Monogram" class="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(56,189,248,0.7)] logo-glow-pulse" id="logo-img" src="${V.LOGO_URL}"/>
      </div>
      <div>
        <span class="font-bold tracking-wider text-lg font-mono drop-shadow-[0_2px_8px_rgba(56,189,248,0.3)]"><span class="text-sky-400">VERIS</span><span class="text-white">IUM</span></span>
        <p class="text-[11px] text-slate-400 font-medium tracking-wide">Smart Hardware Telemetry &amp; Switch Controller</p>
      </div>
    </div>
    <div class="flex items-center space-x-2 shrink-0">
      <div class="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-[#131824] border border-[#242b3d] text-[10px] font-mono text-slate-300" title="Sakelar Efek Pendaran Glow Master">
        <span class="text-sky-400 font-semibold hidden sm:inline text-[9px] uppercase tracking-wider">GLOW</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input ${glowOn ? 'checked' : ''} class="sr-only peer" id="master-glow-toggle" type="checkbox"/>
          <div class="w-7 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-sky-400"></div>
        </label>
      </div>
      <div class="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/40 text-slate-300 text-xs font-semibold font-mono" id="chip">
        <span class="w-2 h-2 rounded-full bg-slate-400" id="chip-dot"></span>
        <span class="text-[11px]" id="chip-text">OFFLINE</span>
      </div>
    </div>
  </div>
</header>`;
  }

  function tabsHtml() {
    const cur = V.TABS.find(t => t.id === V.pageId);
    return `
<div class="flex items-center justify-between text-xs text-slate-400 border-b border-[#242b3d]/60 pb-2">
  <span class="font-mono text-slate-400">NODE: <span id="node-ip">-</span></span>
  <span class="font-mono text-emerald-400 flex items-center space-x-1">
    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
    <span id="tab-indicator-text">${cur ? cur.title : ''}</span>
  </span>
</div>
<div class="grid grid-cols-4 gap-2 bg-[#0f131c] p-1.5 rounded-xl border border-[#242b3d] shadow-lg">
  ${V.TABS.map(t => `
  <a class="tab-btn flex flex-col items-center justify-center py-2.5 px-1 rounded-lg border border-transparent text-slate-400 hover:text-white transition-all duration-200 ${t.id === V.pageId ? 'active' : ''}" href="${t.href}">
    ${icon(t, 'w-5 h-5 mb-1')}
    <span class="text-[11px] font-semibold tracking-wide">${t.label}</span>
  </a>`).join('')}
</div>`;
  }

  function navHtml() {
    return `
<nav class="sticky bottom-0 z-40 bg-[#0f131c]/95 backdrop-blur-md border-t border-[#242b3d] py-2 px-4">
  <div class="max-w-md mx-auto grid grid-cols-4 gap-1 text-center font-mono">
    ${V.TABS.map(t => `
    <a class="flex flex-col items-center justify-center py-1 transition hover:text-slate-300 ${t.id === V.pageId ? 'text-sky-400' : 'text-slate-500'}" href="${t.href}">
      ${icon(t, 'w-5 h-5 mb-0.5')}
      <span class="text-[10px]">${t.label}</span>
    </a>`).join('')}
  </div>
</nav>`;
  }

  /* Chip status di header + info node */
  function updateChip(on, label) {
    const chip = V.$('chip'), dot = V.$('chip-dot'), txt = V.$('chip-text');
    if (!chip) return;
    if (on) {
      chip.className = 'flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-semibold font-mono shadow-[0_0_12px_rgba(16,185,129,0.25)]';
      dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
      txt.textContent = `ONLINE (${V.latency}ms)`;
    } else {
      chip.className = 'flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/40 text-slate-300 text-xs font-semibold font-mono';
      dot.className = 'w-2 h-2 rounded-full bg-slate-400';
      txt.textContent = label || 'OFFLINE';
      const n = V.$('node-ip');
      if (n) n.textContent = '-';
    }
  }

  V.renderLayout = function () {
    const glowOn = V.applyGlowPref();
    V.$('app-header').innerHTML = headerHtml(glowOn);
    V.$('app-tabs').innerHTML = tabsHtml();
    V.$('app-nav').innerHTML = navHtml();

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#1c2232] border border-sky-500/40 text-xs text-slate-100 shadow-lg opacity-0 pointer-events-none transition-opacity duration-300 max-w-[90vw] text-center';
    document.body.appendChild(toast);

    V.$('master-glow-toggle').addEventListener('change', e => V.toggleGlow(e.target.checked));
    V.$('logo-img').addEventListener('error', e => {
      e.target.outerHTML = '<span class="font-mono font-bold text-sky-300">V</span>';
    });

    V.on('online', updateChip);
    V.on('status', s => {
      V.$('node-ip').textContent = s.ip;
      V.$('chip-text').textContent = `ONLINE (${V.latency}ms)`;
    });
  };
})();
