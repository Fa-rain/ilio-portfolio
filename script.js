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
  const PROJECTS_PER_PAGE = 6;
  let projectsData = [];
  let currentFilter = 'all';
  let currentPage = 0;
  let selectedPhotoFile = null;
  let currentPhotoDataUrl = '';

  /**
   * Mengambil daftar karya tersimpan dari localStorage
   * @returns {Array<Object>}
   */
  const getStoredKarya = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const parsedData = data ? JSON.parse(data) : [];
      if (!Array.isArray(parsedData)) {
        console.warn('[Ilio] Data karya di localStorage harus berupa daftar.');
        return [];
      }
      return parsedData;
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
    projectPagination: document.getElementById('project-pagination'),
    navSemuaKarya: document.getElementById('nav-semua-karya'),
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
    inputFoto: document.getElementById('input-foto'),
    fotoPreviewWrapper: document.getElementById('foto-preview-wrapper'),
    fotoPreviewImg: document.getElementById('foto-preview-img'),
    btnRemoveFoto: document.getElementById('btn-remove-foto'),

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
    if (DOM.metricKaryaCount) {
      DOM.metricKaryaCount.textContent = projectsData.length;
    }
    document.querySelectorAll('.nav-karya-count').forEach((el) => {
      el.textContent = projectsData.length;
    });
  };

  /* --------------------------------------------------------
   * 5. Filter & Pagination Karya
   * -------------------------------------------------------- */
  const getFilteredProjects = () => (
    currentFilter === 'all'
      ? projectsData
      : projectsData.filter((project) => project.kategori === currentFilter)
  );

  const renderProjectPagination = (filteredProjects) => {
    if (!DOM.projectPagination) return;

    const pageCount = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
    DOM.projectPagination.hidden = pageCount <= 1;
    DOM.projectPagination.replaceChildren();
    if (pageCount <= 1) return;

    const addPageButton = (label, page, options = {}) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pagination-btn';
      button.textContent = label;
      button.disabled = options.disabled || false;
      if (options.current) {
        button.classList.add('active');
        button.setAttribute('aria-current', 'page');
      }
      button.addEventListener('click', () => {
        currentPage = page;
        renderProjectCards();
        document.getElementById('karya-terbaru')?.scrollIntoView({ behavior: 'smooth' });
      });
      DOM.projectPagination.appendChild(button);
    };

    addPageButton('Sebelumnya', currentPage - 1, {
      disabled: currentPage === 0,
    });

    for (let page = 0; page < pageCount; page += 1) {
      addPageButton(String(page + 1), page, {
        current: page === currentPage,
      });
    }

    addPageButton('Berikutnya', currentPage + 1, {
      disabled: currentPage === pageCount - 1,
    });
  };

  const renderProjectCards = () => {
    if (!DOM.projectsGrid) return;

    const filteredProjects = getFilteredProjects();
    const startIndex = currentPage * PROJECTS_PER_PAGE;
    const visibleProjects = filteredProjects.slice(startIndex, startIndex + PROJECTS_PER_PAGE);
    DOM.projectsGrid.replaceChildren();

    visibleProjects.forEach((project) => {
      DOM.projectsGrid.appendChild(createProjectCard(project));
    });

    renderProjectPagination(filteredProjects);
  };

  /**
   * Mengembalikan katalog ke halaman pertama dan menampilkan semua kategori.
   * @param {Event} [e]
   */
  const showAllKarya = (e) => {
    if (e) e.preventDefault();

    currentFilter = 'all';
    currentPage = 0;
    DOM.filterBtns.forEach((btn) => {
      const isAllFilter = btn.getAttribute('data-filter') === 'all';
      btn.classList.toggle('active-tab', isAllFilter);
    });
    renderProjectCards();

    const catalogSection = document.getElementById('karya-terbaru');
    catalogSection?.scrollIntoView({ behavior: 'smooth' });

    showToast(`Katalog berisi ${projectsData.length} karya; maksimal 6 karya ditampilkan per halaman.`);
  };

  const initCategoryFilters = () => {
    DOM.filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        DOM.filterBtns.forEach((filterButton) => {
          filterButton.classList.remove('active-tab');
        });
        btn.classList.add('active-tab');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        currentPage = 0;
        renderProjectCards();
      });
    });

    DOM.projectsGrid?.addEventListener('click', (event) => {
      const detailButton = event.target.closest('.link-detail');
      if (!detailButton || !DOM.projectsGrid.contains(detailButton)) return;

      const projectCard = detailButton.closest('.project-card');
      const projectDetails = projectCard?.querySelector('.project-details');
      if (!projectDetails) return;

      const isExpanded = detailButton.getAttribute('aria-expanded') === 'true';
      detailButton.setAttribute('aria-expanded', String(!isExpanded));
      projectDetails.hidden = isExpanded;
    });

    DOM.navSemuaKarya?.addEventListener('click', showAllKarya);
  };

  const initSectionNavigation = () => {
    const sections = [
      { id: 'home', path: 'home' },
      { id: 'about', path: 'about' },
      { id: 'kenapa-penting', path: 'about' },
      { id: 'karya-terbaru', path: 'portfolio' },
    ];
    const navLinks = document.querySelectorAll('.nav-link[data-path]');

    const updateActiveSection = () => {
      const activationPoint = window.scrollY + 120;
      let activePath = sections[0].path;

      sections.forEach(({ id, path }) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top + window.scrollY <= activationPoint) {
          activePath = path;
        }
      });

      navLinks.forEach((link) => {
        const isActive = link.getAttribute('data-path') === activePath;
        link.classList.toggle('active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('hashchange', updateActiveSection);
    updateActiveSection();
  };

  /* --------------------------------------------------------
   * 6. Modal Form Controller & Photo Upload Handler
   * -------------------------------------------------------- */
  const clearPhotoState = () => {
    selectedPhotoFile = null;
    currentPhotoDataUrl = '';
    if (DOM.inputFoto) DOM.inputFoto.value = '';
    if (DOM.fotoPreviewWrapper) DOM.fotoPreviewWrapper.classList.add('hidden');
    if (DOM.fotoPreviewImg) DOM.fotoPreviewImg.src = '';
  };

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
    clearPhotoState();
    clearValidationErrors();
  };

  const initPhotoUploadHandlers = () => {
    // Membaca file foto yang dipilih menggunakan FileReader
    DOM.inputFoto?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Harap pilih file berupa gambar (JPG, PNG, WebP).');
        DOM.inputFoto.value = '';
        return;
      }

      selectedPhotoFile = file;

      const reader = new FileReader();
      reader.onload = (event) => {
        currentPhotoDataUrl = event.target.result;
        if (DOM.fotoPreviewImg) DOM.fotoPreviewImg.src = currentPhotoDataUrl;
        if (DOM.fotoPreviewWrapper) DOM.fotoPreviewWrapper.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    });

    // Tombol hapus foto di preview
    DOM.btnRemoveFoto?.addEventListener('click', (e) => {
      e.preventDefault();
      clearPhotoState();
    });
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

    initPhotoUploadHandlers();
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
      thumbnail,
    } = data;

    const card = document.createElement('div');
    card.className = 'project-card';
    card.setAttribute('data-category', kategori);

    const safeTechList = Array.isArray(techStack) && techStack.length > 0 ? techStack : ['General'];
    const badgeLabel = data.kategoriLabel || categoryLabels[kategori] || 'Portfolio';
    const isCatSecondary = kategori === 'ml' || kategori === 'uiux';
    const githubUrl = `https://github.com/example/${encodeURIComponent(String(data.id || 'ilio-project'))}`;

    const thumbnailHtml = thumbnail
      ? `<img class="project-thumbnail" src="${escapeHtml(thumbnail)}" alt="${escapeHtml(judul)}" />`
      : `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: rgba(70, 72, 212, 0.4);">
           <span class="material-symbols-outlined" style="font-size: 64px;">category</span>
         </div>`;

    card.innerHTML = `
      <div>
        <div class="project-thumbnail-wrapper">
          ${thumbnailHtml}
          <span class="project-badge-category ${isCatSecondary ? 'cat-secondary' : 'cat-primary'}">
            ${escapeHtml(badgeLabel)}
          </span>
          <span class="project-badge-contributors">
            ${escapeHtml(String(jumlahAnggota))} Kontributor
          </span>
        </div>
        <h3 class="project-title">
          ${escapeHtml(judul)}
        </h3>
        <p class="project-desc">
          ${escapeHtml(deskripsi)}
        </p>
        <div class="tech-stack-row">
          ${safeTechList
            .map(
              (tech) => `<span class="tech-chip">${escapeHtml(tech)}</span>`
            )
            .join('')}
        </div>
      </div>
      <div class="project-author-strip">
        <div class="author-info">
          <div class="author-avatar bg-primary-avatar">
            ${escapeHtml(initials)}
          </div>
          <span class="author-name">
            ${escapeHtml(author)}
          </span>
        </div>
        <button class="link-detail" type="button" aria-expanded="false">
          Detail <span class="material-symbols-outlined" style="font-size: 14px;">arrow_forward</span>
        </button>
      </div>
      <div class="project-details" hidden>
        <span class="project-details-label">Repositori GitHub</span>
        <a class="project-github-link" href="${escapeHtml(githubUrl)}" target="_blank" rel="noopener noreferrer">
          Lihat repositori di GitHub
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

      // 5. Penanganan Foto (100% Murni Client-side Vanilla JS)
      const finalThumbnail = currentPhotoDataUrl || '';

      const newKaryaData = {
        id: `karya-${Date.now()}`,
        judul: judulVal,
        kategori: kategoriVal,
        jumlahAnggota: jumlahNumber,
        author: authorVal,
        initials,
        deskripsi: deskripsiVal,
        techStack: techList,
        thumbnail: finalThumbnail,
        tanggalDibuat: new Date().toISOString().split('T')[0],
      };

      // 1. Simpan ke localStorage agar tersimpan persisten
      saveKaryaToStorage(newKaryaData);

      projectsData.unshift(newKaryaData);
      currentPage = 0;
      renderProjectCards();

      // 3. Sinkronisasi metrik jumlah karya (termasuk navbar)
      updateKaryaCount();

      // 4. Tutup modal & tampilkan toast
      closeModal();
      showToast('Karya baru & foto berhasil disimpan ke sistem!');
    });
  };

  /* --------------------------------------------------------
   * 8. Inisialisasi Data Tersimpan & App Bootstrap
   * -------------------------------------------------------- */
  const loadProjectData = async () => {
    if (!DOM.projectsGrid) return;

    const response = await fetch('karya/karya.json');
    if (!response.ok) {
      throw new Error(`Gagal memuat data karya (HTTP ${response.status}).`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Format data karya harus berupa array JSON.');
    }

    projectsData = [...getStoredKarya(), ...data];
    updateKaryaCount();
    renderProjectCards();
  };

  const init = async () => {
    initCategoryFilters();
    initSectionNavigation();
    initModalHandlers();
    initFormValidation();

    try {
      await loadProjectData();
    } catch (error) {
      console.error('[Ilio] Katalog karya gagal dimuat:', error);
      if (DOM.projectsGrid) {
        const message = document.createElement('p');
        message.className = 'catalog-error';
        message.textContent = 'Katalog karya gagal dimuat. Silakan coba lagi nanti.';
        DOM.projectsGrid.replaceChildren(message);
      }
      if (DOM.projectPagination) DOM.projectPagination.hidden = true;
    }
  };

  // Jalankan bootstrap saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
