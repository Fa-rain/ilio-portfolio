/**
 * ========================================================
 * Ilio Platform Portofolio Informatika UNSOED '26
 * Core Vanilla JavaScript Engine (ES6+) - script.js
 * ========================================================
 */

(() => {
  'use strict';

  // Guard against duplicate initialization
  if (window.__ilioAppInitialized) return;
  window.__ilioAppInitialized = true;

  /* --------------------------------------------------------
   * 1. Storage & State Management
   * -------------------------------------------------------- */
  const STORAGE_KEY = 'ilio_karya_submissions';

  /**
   * Mengambil daftar karya tersimpan dari localStorage
   * @returns {Array<Object>}
   */
  const getStoredKarya = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.warn('[Ilio] Gagal memuat data dari localStorage:', err);
      return [];
    }
  };

  /**
   * Menyimpan karya baru ke localStorage
   * @param {Object} karya
   */
  const saveKaryaToStorage = (karya) => {
    try {
      const currentList = getStoredKarya();
      currentList.unshift(karya);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
    } catch (err) {
      console.warn('[Ilio] Gagal menyimpan data ke localStorage:', err);
    }
  };

  /* --------------------------------------------------------
   * 2. DOM Elements Cache
   * -------------------------------------------------------- */
  const DOM = {
    // Project Grid & Counters
    projectsGrid: document.getElementById('projects-grid'),
    metricKaryaCount: document.getElementById('metric-karya-count'),
    btnKaryaCount: document.getElementById('btn-karya-count'),
    filterBtns: document.querySelectorAll('.filter-btn'),

    // Modal & Backdrop
    modalSubmit: document.getElementById('modal-submit-karya'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),
    openModalTriggers: document.querySelectorAll('.open-submit-modal, [data-path="submit-karya"]'),

    // Form & Input Fields
    formSubmitKarya: document.getElementById('form-submit-karya'),
    inputJudul: document.getElementById('input-judul'),
    inputKategori: document.getElementById('input-kategori'),
    inputJumlahKarya: document.getElementById('input-jumlah-karya'),
    inputAuthor: document.getElementById('input-author'),
    inputDeskripsi: document.getElementById('input-deskripsi'),
    inputTech: document.getElementById('input-tech'),

    // Error Message Elements
    errJudul: document.getElementById('err-judul'),
    errJumlahKarya: document.getElementById('err-jumlah-karya'),
    errAuthor: document.getElementById('err-author'),
    errDeskripsi: document.getElementById('err-deskripsi'),

    // Toast Notification
    toastNotif: document.getElementById('toast-notif'),
    toastMessage: document.getElementById('toast-message'),
  };

  /* --------------------------------------------------------
   * 3. Utility Functions
   * -------------------------------------------------------- */
  /**
   * Sanitasi string untuk mencegah XSS saat merender HTML dinamis
   * @param {string} str
   * @returns {string}
   */
  const escapeHtml = (str = '') => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  /**
   * Validasi nilai angka: wajib terisi, angka bulat, dan lebih dari 0
   * @param {string|number} value
   * @returns {boolean}
   */
  const isValidPositiveInteger = (value) => {
    if (value === null || value === undefined) return false;
    const str = String(value).trim();
    if (!str) return false;
    const num = Number(str);
    return !Number.isNaN(num) && Number.isInteger(num) && num > 0;
  };

  /**
   * Menampilkan pesan toast floating
   * @param {string} message
   * @param {number} duration
   */
  let toastTimer = null;
  const showToast = (message, duration = 3500) => {
    if (!DOM.toastNotif || !DOM.toastMessage) return;
    DOM.toastMessage.textContent = message;
    DOM.toastNotif.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      DOM.toastNotif.classList.add('hidden');
    }, duration);
  };

  /* --------------------------------------------------------
   * 4. Metrik & Hitung Jumlah Karya (Validasi Angka Terdaftar)
   * -------------------------------------------------------- */
  const updateKaryaCount = () => {
    const totalCards = document.querySelectorAll('.project-card').length;
    if (DOM.metricKaryaCount) {
      DOM.metricKaryaCount.textContent = totalCards;
    }
    if (DOM.btnKaryaCount) {
      DOM.btnKaryaCount.textContent = totalCards;
    }
  };

  /* --------------------------------------------------------
   * 5. Filter Kategori Karya
   * -------------------------------------------------------- */
  const initCategoryFilters = () => {
    if (!DOM.filterBtns || DOM.filterBtns.length === 0) return;

    DOM.filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Reset state tombol filter
        DOM.filterBtns.forEach((b) => {
          b.className = 'filter-btn px-4 py-2 rounded-lg font-label-md text-label-md font-medium transition-all bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:bg-surface-container-low hover:text-on-surface';
        });

        // Set tombol aktif
        btn.className = 'filter-btn active-tab px-4 py-2 rounded-lg font-label-md text-label-md font-medium transition-all bg-primary text-on-primary shadow-sm';

        const targetCategory = btn.getAttribute('data-filter') || 'all';
        const cards = document.querySelectorAll('.project-card');

        cards.forEach((card) => {
          const cardCategory = card.getAttribute('data-category');
          if (targetCategory === 'all' || cardCategory === targetCategory) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  };

  /* --------------------------------------------------------
   * 6. Modal Form Controller
   * -------------------------------------------------------- */
  const clearValidationErrors = () => {
    const inputs = [
      DOM.inputJudul,
      DOM.inputJumlahKarya,
      DOM.inputAuthor,
      DOM.inputDeskripsi,
    ];
    inputs.forEach((input) => {
      input?.classList.remove('input-error', 'input-success');
    });

    const errorSpans = [
      DOM.errJudul,
      DOM.errJumlahKarya,
      DOM.errAuthor,
      DOM.errDeskripsi,
    ];
    errorSpans.forEach((span) => {
      span?.classList.add('hidden');
    });
  };

  const openModal = () => {
    if (!DOM.modalSubmit) return;
    DOM.modalSubmit.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    DOM.inputJudul?.focus();
  };

  const closeModal = () => {
    if (!DOM.modalSubmit) return;
    DOM.modalSubmit.classList.add('hidden');
    document.body.style.overflow = '';
    DOM.formSubmitKarya?.reset();
    clearValidationErrors();
  };

  const initModalHandlers = () => {
    // Tombol pembuka modal
    DOM.openModalTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });

    // Tombol penutup modal
    DOM.btnCloseModal?.addEventListener('click', closeModal);
    DOM.btnCancelModal?.addEventListener('click', closeModal);
    DOM.modalBackdrop?.addEventListener('click', closeModal);

    // Keyboard ESC listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.modalSubmit && !DOM.modalSubmit.classList.contains('hidden')) {
        closeModal();
      }
    });
  };

  /* --------------------------------------------------------
   * 7. Form Submission & Card Rendering
   * -------------------------------------------------------- */
  const categoryLabels = {
    'web-mobile': 'Web Application',
    'ml': 'Machine Learning',
    'iot': 'IoT & Hardware',
    'uiux': 'UI/UX Design',
  };

  /**
   * Membuat elemen card HTML untuk karya baru
   * @param {Object} data
   * @returns {HTMLElement}
   */
  const createProjectCard = (data) => {
    const {
      judul,
      kategori,
      jumlahAnggota,
      author,
      initials,
      deskripsi,
      techStack,
    } = data;

    const card = document.createElement('div');
    card.className = 'project-card group bg-surface-container-lowest rounded-xl border border-outline-variant p-space-md shadow-sm hover:shadow-md hover:border-primary/50 hover:-translate-y-1 transition-all flex flex-col justify-between';
    card.setAttribute('data-category', kategori);

    const safeTechList = Array.isArray(techStack) && techStack.length > 0 ? techStack : ['General'];
    const badgeLabel = categoryLabels[kategori] || 'Portfolio';

    card.innerHTML = `
      <div>
        <div class="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-high mb-space-md flex items-center justify-center text-primary/40">
          <span class="material-symbols-outlined text-6xl">category</span>
          <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-label-sm text-label-sm font-semibold border border-outline-variant">
            ${escapeHtml(badgeLabel)}
          </span>
          <span class="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-xs font-medium">
            ${escapeHtml(String(jumlahAnggota))} Kontributor
          </span>
        </div>
        <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary transition-colors line-clamp-1">
          ${escapeHtml(judul)}
        </h3>
        <p class="font-body-sm text-body-sm text-on-surface-variant mt-space-xs line-clamp-2">
          ${escapeHtml(deskripsi)}
        </p>
        <div class="flex flex-wrap gap-1.5 mt-space-md">
          ${safeTechList
            .map(
              (tech) => `<span class="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">${escapeHtml(tech)}</span>`
            )
            .join('')}
        </div>
      </div>
      <div class="pt-space-md mt-space-md border-t border-outline-variant flex items-center justify-between">
        <div class="flex items-center gap-space-xs">
          <div class="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-sm text-label-sm font-bold">
            ${escapeHtml(initials)}
          </div>
          <span class="font-body-sm text-body-sm text-on-surface font-medium truncate max-w-[130px]">
            ${escapeHtml(author)}
          </span>
        </div>
        <a class="inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold text-primary hover:underline" href="#">
          Detail <span class="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
      </div>
    `;

    return card;
  };

  const initFormValidation = () => {
    if (!DOM.formSubmitKarya) return;

    // Real-time Number Validation on Input
    DOM.inputJumlahKarya?.addEventListener('input', () => {
      const rawVal = DOM.inputJumlahKarya.value.trim();
      if (!isValidPositiveInteger(rawVal)) {
        DOM.inputJumlahKarya.classList.add('input-error');
        DOM.inputJumlahKarya.classList.remove('input-success');
        DOM.errJumlahKarya?.classList.remove('hidden');
      } else {
        DOM.inputJumlahKarya.classList.remove('input-error');
        DOM.inputJumlahKarya.classList.add('input-success');
        DOM.errJumlahKarya?.classList.add('hidden');
      }
    });

    // Form Submit Event Handler
    DOM.formSubmitKarya.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      // 1. Validasi Judul Karya
      const judulVal = DOM.inputJudul?.value.trim() || '';
      if (!judulVal) {
        DOM.inputJudul?.classList.add('input-error');
        DOM.errJudul?.classList.remove('hidden');
        isValid = false;
      } else {
        DOM.inputJudul?.classList.remove('input-error');
        DOM.errJudul?.classList.add('hidden');
      }

      // 2. VALIDASI ANGKA JUMLAH KARYA / ANGGOTA (Ketat)
      const jumlahRaw = DOM.inputJumlahKarya?.value.trim() || '';
      if (!isValidPositiveInteger(jumlahRaw)) {
        DOM.inputJumlahKarya?.classList.add('input-error');
        DOM.errJumlahKarya?.classList.remove('hidden');
        isValid = false;
      } else {
        DOM.inputJumlahKarya?.classList.remove('input-error');
        DOM.errJumlahKarya?.classList.add('hidden');
      }

      // 3. Validasi Nama Pembuat
      const authorVal = DOM.inputAuthor?.value.trim() || '';
      if (!authorVal) {
        DOM.inputAuthor?.classList.add('input-error');
        DOM.errAuthor?.classList.remove('hidden');
        isValid = false;
      } else {
        DOM.inputAuthor?.classList.remove('input-error');
        DOM.errAuthor?.classList.add('hidden');
      }

      // 4. Validasi Deskripsi
      const deskripsiVal = DOM.inputDeskripsi?.value.trim() || '';
      if (!deskripsiVal) {
        DOM.inputDeskripsi?.classList.add('input-error');
        DOM.errDeskripsi?.classList.remove('hidden');
        isValid = false;
      } else {
        DOM.inputDeskripsi?.classList.remove('input-error');
        DOM.errDeskripsi?.classList.add('hidden');
      }

      // Hentikan proses jika validasi gagal
      if (!isValid) return;

      const jumlahNumber = Number(jumlahRaw);
      const kategoriVal = DOM.inputKategori?.value || 'web-mobile';

      const techList = (DOM.inputTech?.value || '')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      if (techList.length === 0) techList.push('General');

      const initials = authorVal
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'IF';

      const newKaryaData = {
        id: `karya-${Date.now()}`,
        judul: judulVal,
        kategori: kategoriVal,
        jumlahAnggota: jumlahNumber,
        author: authorVal,
        initials,
        deskripsi: deskripsiVal,
        techStack: techList,
        tanggalDibuat: new Date().toISOString().split('T')[0],
      };

      // 1. Simpan ke localStorage agar tersimpan persisten
      saveKaryaToStorage(newKaryaData);

      // 2. Render kartu baru ke DOM
      if (DOM.projectsGrid) {
        const cardElement = createProjectCard(newKaryaData);
        DOM.projectsGrid.prepend(cardElement);
      }

      // 3. Sinkronisasi metrik jumlah karya
      updateKaryaCount();

      // 4. Tutup modal & tampilkan toast
      closeModal();
      showToast('Karya baru berhasil divalidasi dan ditambahkan ke daftar!');
    });
  };

  /* --------------------------------------------------------
   * 8. Inisialisasi Data Tersimpan & App Bootstrap
   * -------------------------------------------------------- */
  const loadStoredKarya = () => {
    if (!DOM.projectsGrid) return;
    const stored = getStoredKarya();
    stored.forEach((item) => {
      const card = createProjectCard(item);
      DOM.projectsGrid.prepend(card);
    });
  };

  const init = () => {
    loadStoredKarya();
    updateKaryaCount();
    initCategoryFilters();
    initModalHandlers();
    initFormValidation();
  };

  // Jalankan bootstrap saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

