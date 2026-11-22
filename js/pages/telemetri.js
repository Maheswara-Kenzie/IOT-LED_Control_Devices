/* ==========================================================
   pages/telemetri.js - halaman Telemetri Serial
   ========================================================== */
window.Telemetri = (function () {
  const $ = V.$;
  let logNext = 0;

  function addLine(l) {
    const term = $('term');
    const cls = /gagal|err|error/i.test(l.m) ? 'text-rose-400'
              : /warn/i.test(l.m) ? 'text-amber-400'
              : /connected|listening|->|aktif|pong/i.test(l.m) ? 'text-emerald-400' : '';
    const d = document.createElement('div');
    d.innerHTML = `<span class="text-slate-500">[${V.esc(l.t)}]</span> <span class="${cls}">${V.esc(l.m)}</span>`;
    term.insertBefore(d, $('term-cursor'));
    while (term.children.length > 201) term.removeChild(term.firstChild);
    $('term-count').textContent = (term.children.length - 1) + ' BARIS';
    term.scrollTop = term.scrollHeight;
  }

  async function pullLog() {
    const r = await V.api('/api/log?since=' + logNext);
    logNext = r.next;
    r.lines.forEach(addLine);
  }

  function renderCards(s) {
    $('t-ip').textContent = s.ip;
    $('t-baud').textContent = s.baud + ' bps';
    $('t-heap').textContent = (s.heap / 1024).toFixed(1) + ' KB';
    $('t-up').textContent = V.fmtUp(s.up);
  }

  function clear() {
    const term = $('term');
    [...term.children].forEach(c => { if (c.id !== 'term-cursor') term.removeChild(c); });
    $('term-count').textContent = '0 BARIS';
  }

  function copy() {
    const txt = [...$('term').children].filter(c => c.id !== 'term-cursor').map(c => c.innerText).join('\n');
    navigator.clipboard.writeText(txt).then(() => V.toast('Log disalin'), () => V.toast('Gagal menyalin'));
  }

  function init() {
    V.on('status', async s => {
      renderCards(s);
      if (s.ls !== logNext) { try { await pullLog(); } catch (e) {} }
    });
  }

  V.page = { init };
  return { clear, copy };
})();
