/* ==========================================================
   boot.js - dijalankan paling akhir di setiap halaman
   ========================================================== */
V.pageId = document.body.dataset.page;
V.renderLayout();
if (V.page && V.page.init) V.page.init();
V.autoConnect();
