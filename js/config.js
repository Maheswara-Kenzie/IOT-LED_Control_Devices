/* ==========================================================
   config.js - namespace global V + konstanta (lampu, tab, ikon)
   Urutan & kunci lampu harus sama dengan firmware.
   ========================================================== */
window.V = {
  online: false,
  base: null,
  latency: 0,
  lastStatus: null,
  pageId: null,
  page: null
};

V.LOGO_URL = 'https://lh3.googleusercontent.com/aida/ALJJyrCsemdxsh0SzyaJr3mXMVInMiDPBlRVDHn8Ui_Zh2mg3w21oxdGa0rE9i1fXzY6olNg2X1oSG61wdYcejqknl-rjDcsa9b6X_XL91yf-aKaI77fzgrfF3TK9rzbW3IbCtrhIltnVYx20u-auUCPXx2QkE7H6ZcKabsYw2_2rWx3trVzHMFff2oC-I5Yql8RIfQLiSa3kRNADkjkLO9D7Jg5DVCy03rty34qjwU5xHbNGw';

/* Daftar halaman (dipakai tab atas + navigasi bawah) */
V.TABS = [
  { id: 'koneksi',   href: 'koneksi.html',   label: 'Koneksi',   title: 'KONEKSI IP',
    icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0' },
  { id: 'saklar',    href: 'saklar.html',    label: 'Saklar',    title: 'SAKLAR LAMPU',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { id: 'riwayat',   href: 'riwayat.html',   label: 'Riwayat',   title: 'RIWAYAT AKTIVITAS',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'telemetri', href: 'telemetri.html', label: 'Telemetri', title: 'TELEMETRI SERIAL',
    icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
];

/* Ikon lampu */
V.BULB_ON  = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7zm-3 18a1 1 0 001 1h4a1 1 0 001-1v-1H9v1z"></path></svg>';
V.BULB_OFF = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>';

/* Lampu: warna dibuat literal agar terbaca Tailwind CDN */
V.LAMPS = {
  merah: {
    label: 'Lampu Merah', short: 'Merah', pin: 'D1/GPIO05', loc: 'Ruang Depan',
    card: 'border-rose-500/50 pulse-glow-red', hover: 'hover:border-rose-500/30',
    icon: 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]',
    txt: 'text-rose-400 font-semibold', badge: 'bg-rose-950/60 text-rose-300 border-rose-800/40',
    sw: 'peer-checked:bg-rose-500',
    dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse',
    dotOff: 'bg-rose-950 border border-rose-800/40',
    hist: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  },
  kuning: {
    label: 'Lampu Kuning', short: 'Kuning', pin: 'D2/GPIO04', loc: 'Teras Tengah',
    card: 'border-amber-500/50 pulse-glow-yellow', hover: 'hover:border-amber-500/30',
    icon: 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    txt: 'text-amber-400 font-semibold', badge: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
    sw: 'peer-checked:bg-amber-500',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse',
    dotOff: 'bg-amber-950 border border-amber-800/40',
    hist: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  hijau: {
    label: 'Lampu Hijau', short: 'Hijau', pin: 'D5/GPIO14', loc: 'Halaman Belakang',
    card: 'border-emerald-500/50 pulse-glow-green', hover: 'hover:border-emerald-500/30',
    icon: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    txt: 'text-emerald-400 font-semibold', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
    sw: 'peer-checked:bg-emerald-500',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse',
    dotOff: 'bg-emerald-950 border border-emerald-800/40',
    hist: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  }
};

/* Label sumber aksi di riwayat */
V.SRC = { web: 'Manual via Web UI', auto: 'Otomatis (Mode Disko)' };
