// album.js - Physical Photo Album 3D Engine & Interactive Controller

document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let pages = window.INITIAL_ALBUM_PAGES || [];
  try {
    const savedLocal = localStorage.getItem('gunnusVoiceAlbumPages');
    if (savedLocal) {
      const parsed = JSON.parse(savedLocal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        pages = parsed;
      }
    }
  } catch (e) {}

  let currentPairIndex = 0; // Index of current left page on desktop (0, 2, 4...)
  let isUnsaved = false;
  let isFlipping = false;

  // DOM Elements
  const leftPageContent = document.getElementById('leftPageContent');
  const rightPageContent = document.getElementById('rightPageContent');
  const leftPageNum = document.getElementById('leftPageNum');
  const rightPageNum = document.getElementById('rightPageNum');
  const turningLeaf = document.getElementById('turningLeaf');
  const leafFrontContent = document.getElementById('leafFrontContent');
  const leafBackContent = document.getElementById('leafBackContent');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const desktopCounterBadge = document.getElementById('desktopCounterBadge');
  const thumbnailStrip = document.getElementById('thumbnailStrip');
  const unsavedBadge = document.getElementById('unsavedBadge');

  // Helper: Save pages to localStorage for Vercel persistence
  function saveToLocalStorage() {
    try {
      localStorage.setItem('gunnusVoiceAlbumPages', JSON.stringify(pages));
    } catch (e) {}
  }

  // Helper: Mark unsaved changes
  function setUnsavedState(state = true) {
    isUnsaved = state;
    if (isUnsaved) {
      saveToLocalStorage();
    }
    if (unsavedBadge) {
      if (isUnsaved) {
        unsavedBadge.classList.remove('d-none');
        unsavedBadge.classList.add('d-flex');
      } else {
        unsavedBadge.classList.remove('d-flex');
        unsavedBadge.classList.add('d-none');
      }
    }
  }

  // Google Drive URL Converter Helper (uses global or fallback)
  function convertGoogleDriveUrl(urlStr) {
    if (window.convertGoogleDriveUrl) {
      return window.convertGoogleDriveUrl(urlStr);
    }
    if (!urlStr || typeof urlStr !== 'string') return '';
    const trimmed = urlStr.trim();
    if (!trimmed) return '';

    if (trimmed.includes('lh3.googleusercontent.com/d/')) {
      return trimmed;
    }

    let fileId = null;
    const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) {
      fileId = matchD[1];
    } else {
      const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        fileId = matchId[1];
      }
    }

    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/') && !trimmed.startsWith('data:')) {
      return `https://${trimmed}`;
    }

    return trimmed;
  }

  // Helper: Render single page HTML template
  window.renderPageHTML = function (page, pageIndex) {
    if (!page) {
      return `
        <div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted opacity-50">
          <i class="fa-solid fa-book-open fs-1 mb-2"></i>
          <span class="small font-playfair">End of Album</span>
        </div>
      `;
    }

    const editBtnHTML = `
      <div class="page-action-triggers">
        <button class="page-edit-trigger" onclick="event.stopPropagation(); openEditModal(${pageIndex})" title="Edit Page">
          <i class="fa-solid fa-pencil"></i>
        </button>
        <button class="page-delete-trigger" onclick="event.stopPropagation(); deleteAlbumPage(${pageIndex})" title="Delete Page">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    if (page.type === 'photo') {
      return `
        <div class="page-photo-card position-relative">
          ${editBtnHTML}
          <div class="text-start mb-2">
            <span class="badge bg-light text-dark border rounded-pill px-3 py-1 small fw-normal">${page.title || 'Memory'}</span>
          </div>

          <div class="photo-tape-frame my-auto">
            <div class="tape-corner tape-top-left"></div>
            <div class="tape-corner tape-top-right"></div>
            <img src="${page.image}" alt="${page.title || 'Photo'}" class="photo-album-img shadow-sm" onerror="if(window.handleImageError) window.handleImageError(this); else this.src='/images/gunnu.jpeg'">
          </div>

          <div>
            <p class="photo-album-caption mb-1">"${page.caption || ''}"</p>
            <div class="photo-album-date"><i class="fa-regular fa-calendar-heart me-1"></i> ${page.date || ''}</div>
          </div>
        </div>
      `;
    } else if (page.type === 'text') {
      return `
        <div class="page-text-card position-relative">
          ${editBtnHTML}
          <div>
            <h3 class="text-page-title mb-3">${page.title || 'Special Memory'}</h3>
          </div>

          <div class="text-page-body">
            ${page.content || ''}
          </div>

          <div class="text-end text-muted small font-playfair mt-2">
            <i class="fa-solid fa-feather-pointed me-1"></i> ${page.date || ''}
          </div>
        </div>
      `;
    } else if (page.type === 'name_reveal') {
      return `
        <div class="page-name-reveal position-relative">
          ${editBtnHTML}
          <div class="name-pretitle">${page.pretitle || 'Yesterday... I received my name.'}</div>
          <div class="name-subtitle mb-2">${page.subtitle || 'Mumma & Papa chose it with so much love.'}</div>

          <div class="name-big-display">${page.name || 'GUNNU'}</div>

          <div class="name-tagline mb-3">${page.tagline || 'My name. My first little identity.'}</div>
          <div class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 small">
            <i class="fa-solid fa-heart me-1"></i> ${page.date || ''}
          </div>
        </div>
      `;
    }

    return `<div class="p-3 text-muted">Unknown page format</div>`;
  };

  // Render Desktop View
  window.updateDesktopView = function () {
    const leftPage = pages[currentPairIndex];
    const rightPage = pages[currentPairIndex + 1];

    if (leftPageContent) leftPageContent.innerHTML = window.renderPageHTML(leftPage, currentPairIndex);
    if (rightPageContent) rightPageContent.innerHTML = window.renderPageHTML(rightPage, currentPairIndex + 1);

    if (leftPageNum) leftPageNum.textContent = leftPage ? `Page ${currentPairIndex + 1}` : '';
    if (rightPageNum) rightPageNum.textContent = rightPage ? `Page ${currentPairIndex + 2}` : '';

    const totalPages = pages.length;
    if (desktopCounterBadge) {
      const endPage = Math.min(currentPairIndex + 2, totalPages);
      desktopCounterBadge.textContent = `Pages ${currentPairIndex + 1} - ${endPage} of ${totalPages}`;
    }

    // Disable/Enable arrow buttons
    if (prevPageBtn) prevPageBtn.disabled = (currentPairIndex <= 0);
    if (nextPageBtn) nextPageBtn.disabled = (currentPairIndex + 2 >= totalPages);

    renderThumbnails();

    // Synchronize initial album pages array for mobile view
    window.INITIAL_ALBUM_PAGES = pages;

    // Notify mobile controller if active
    if (window.updateMobileView) {
      window.updateMobileView(currentPairIndex);
    }
  };

  // Render Bottom Thumbnail Strip
  function renderThumbnails() {
    if (!thumbnailStrip) return;
    thumbnailStrip.innerHTML = '';

    pages.forEach((p, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `album-thumb-item ${(idx === currentPairIndex || idx === currentPairIndex + 1) ? 'active' : ''}`;

      let innerHTML = '';
      if (p.type === 'photo') {
        innerHTML = `<img src="${p.image}" class="thumb-img" alt="Page ${idx + 1}" onerror="if(window.handleImageError) window.handleImageError(this); else this.src='/images/gunnu.jpeg'">`;
      } else if (p.type === 'text') {
        innerHTML = `<div class="thumb-placeholder"><i class="fa-solid fa-file-pen text-primary"></i></div>`;
      } else if (p.type === 'name_reveal') {
        innerHTML = `<div class="thumb-placeholder bg-danger-subtle"><i class="fa-solid fa-crown text-danger"></i></div>`;
      }

      innerHTML += `<span class="thumb-page-num">${idx + 1}</span>`;
      thumb.innerHTML = innerHTML;

      thumb.addEventListener('click', () => {
        jumpToPage(idx);
      });

      thumbnailStrip.appendChild(thumb);
    });
  }

  // 3D Page Turn - Forward (Next)
  function flipForward() {
    if (isFlipping || currentPairIndex + 2 >= pages.length) return;
    isFlipping = true;

    const currentRightPage = pages[currentPairIndex + 1];
    const newLeftPage = pages[currentPairIndex + 2];

    if (turningLeaf && leafFrontContent && leafBackContent) {
      leafFrontContent.innerHTML = window.renderPageHTML(currentRightPage, currentPairIndex + 1);
      leafBackContent.innerHTML = window.renderPageHTML(newLeftPage, currentPairIndex + 2);

      turningLeaf.className = 'turning-leaf turn-right-to-left';

      setTimeout(() => {
        currentPairIndex += 2;
        window.updateDesktopView();
        turningLeaf.className = 'turning-leaf d-none';
        isFlipping = false;
      }, 850);
    } else {
      currentPairIndex += 2;
      window.updateDesktopView();
      isFlipping = false;
    }
  }

  // 3D Page Turn - Backward (Previous)
  function flipBackward() {
    if (isFlipping || currentPairIndex <= 0) return;
    isFlipping = true;

    const currentLeftPage = pages[currentPairIndex];
    const previousRightPage = pages[currentPairIndex - 1];

    if (turningLeaf && leafFrontContent && leafBackContent) {
      leafFrontContent.innerHTML = window.renderPageHTML(currentLeftPage, currentPairIndex);
      leafBackContent.innerHTML = window.renderPageHTML(previousRightPage, currentPairIndex - 1);

      turningLeaf.className = 'turning-leaf turn-left-to-right';

      setTimeout(() => {
        currentPairIndex -= 2;
        if (currentPairIndex < 0) currentPairIndex = 0;
        window.updateDesktopView();
        turningLeaf.className = 'turning-leaf d-none';
        isFlipping = false;
      }, 850);
    } else {
      currentPairIndex -= 2;
      if (currentPairIndex < 0) currentPairIndex = 0;
      window.updateDesktopView();
      isFlipping = false;
    }
  }

  // Jump to specific page index directly
  function jumpToPage(index) {
    if (isFlipping) return;
    // Align index to left page pair (0, 2, 4...)
    let pairIdx = Math.floor(index / 2) * 2;
    if (pairIdx >= pages.length) pairIdx = Math.max(0, pages.length - 2);

    if (pairIdx !== currentPairIndex) {
      if (pairIdx > currentPairIndex) {
        flipForward();
      } else {
        flipBackward();
      }
      currentPairIndex = pairIdx;
      window.updateDesktopView();
    }
  }

  // Event Listeners for Flap Navigation
  if (prevPageBtn) prevPageBtn.addEventListener('click', flipBackward);
  if (nextPageBtn) nextPageBtn.addEventListener('click', flipForward);

  // Keyboard Arrow Keys navigation support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') flipForward();
    if (e.key === 'ArrowLeft') flipBackward();
  });

  // Modal Triggers
  const openAddModalBtn = document.getElementById('openAddModalBtn');
  const openManageModalBtn = document.getElementById('openManageModalBtn');
  const openSaveModalBtn = document.getElementById('openSaveModalBtn');

  if (openAddModalBtn) {
    openAddModalBtn.addEventListener('click', () => {
      const modalEl = document.getElementById('addContentModal');
      if (modalEl && window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    });
  }

  if (openManageModalBtn) {
    openManageModalBtn.addEventListener('click', () => {
      renderManagePageList();
      const modalEl = document.getElementById('manageAlbumModal');
      if (modalEl && window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    });
  }

  if (openSaveModalBtn) {
    openSaveModalBtn.addEventListener('click', () => {
      const modalEl = document.getElementById('savePasswordModal');
      if (modalEl && window.bootstrap) {
        const feedback = document.getElementById('saveFeedbackAlert');
        if (feedback) feedback.classList.add('d-none');
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    });
  }

  // ==========================================
  // ADD FORMS HANDLERS
  // ==========================================
  const addPhotoForm = document.getElementById('addPhotoForm');
  if (addPhotoForm) {
    addPhotoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('photoTitleInput').value.trim();
      let rawUrl = document.getElementById('photoUrlInput').value.trim();
      const caption = document.getElementById('photoCaptionInput').value.trim();
      const date = document.getElementById('photoDateInput').value.trim();

      const processedUrl = convertGoogleDriveUrl(rawUrl);

      if (!processedUrl) {
        alert("Please paste a valid Google Drive URL or Image Link!");
        return;
      }

      const newPage = {
        id: `page_${Date.now()}`,
        type: 'photo',
        title: title || 'Baby Memory',
        image: processedUrl,
        caption: caption,
        date: date || new Date().toLocaleDateString('en-GB')
      };

      pages.push(newPage);
      currentPairIndex = Math.floor((pages.length - 1) / 2) * 2;
      sessionStorage.setItem('gunnusVoiceLastAlbumPage', currentPairIndex);
      setUnsavedState(true);
      window.updateDesktopView();

      const modalEl = document.getElementById('addContentModal');
      if (modalEl && window.bootstrap) {
        bootstrap.Modal.getInstance(modalEl).hide();
      }
      addPhotoForm.reset();
    });
  }

  const addTextForm = document.getElementById('addTextForm');
  if (addTextForm) {
    addTextForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('textTitleInput').value.trim();
      const content = document.getElementById('textContentInput').value.trim();
      const date = document.getElementById('textDateInput').value.trim();

      const newPage = {
        id: `page_${Date.now()}`,
        type: 'text',
        title: title || 'Memory Note',
        content: content,
        date: date || new Date().toLocaleDateString('en-GB')
      };

      pages.push(newPage);
      setUnsavedState(true);
      window.updateDesktopView();

      const modalEl = document.getElementById('addContentModal');
      if (modalEl && window.bootstrap) {
        bootstrap.Modal.getInstance(modalEl).hide();
      }
      addTextForm.reset();
    });
  }

  const addNameForm = document.getElementById('addNameForm');
  if (addNameForm) {
    addNameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pretitle = document.getElementById('namePretitleInput').value.trim();
      const subtitle = document.getElementById('nameSubtitleInput').value.trim();
      const name = document.getElementById('nameBabyInput').value.trim();
      const tagline = document.getElementById('nameTaglineInput').value.trim();
      const date = document.getElementById('nameDateInput').value.trim();

      const newPage = {
        id: `page_${Date.now()}`,
        type: 'name_reveal',
        title: 'Name Reveal',
        pretitle,
        subtitle,
        name,
        tagline,
        date
      };

      pages.push(newPage);
      setUnsavedState(true);
      window.updateDesktopView();

      const modalEl = document.getElementById('addContentModal');
      if (modalEl && window.bootstrap) {
        bootstrap.Modal.getInstance(modalEl).hide();
      }
    });
  }

  // ==========================================
  // MANAGE & REORDER PAGES DRAG/DROP
  // ==========================================
  const reorderPageList = document.getElementById('reorderPageList');
  const reorderTotalCount = document.getElementById('reorderTotalCount');

  function renderManagePageList() {
    if (!reorderPageList) return;
    reorderPageList.innerHTML = '';

    if (reorderTotalCount) reorderTotalCount.textContent = `${pages.length} total pages`;

    pages.forEach((page, idx) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex align-items-center justify-content-between py-2 px-3';
      li.draggable = true;
      li.dataset.index = idx;

      let badge = `<span class="badge bg-secondary">Page ${idx + 1}</span>`;
      if (page.type === 'photo') badge = `<span class="badge bg-primary">Photo</span>`;
      if (page.type === 'text') badge = `<span class="badge bg-success">Text</span>`;
      if (page.type === 'name_reveal') badge = `<span class="badge bg-danger">Name Reveal</span>`;

      const isFirst = idx === 0;
      const isLast = idx === pages.length - 1;

      li.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <i class="fa-solid fa-grip-vertical text-muted drag-handle me-1" style="cursor: grab;"></i>
          ${badge}
          <strong class="small text-dark text-truncate" style="max-width: 180px;">${page.title || page.caption || 'Page'}</strong>
        </div>

        <div class="d-flex align-items-center gap-1">
          <button type="button" class="btn btn-sm btn-outline-secondary rounded-circle px-2 py-0 move-up-btn" ${isFirst ? 'disabled' : ''} title="Move Up">
            <i class="fa-solid fa-arrow-up small"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary rounded-circle px-2 py-0 move-down-btn" ${isLast ? 'disabled' : ''} title="Move Down">
            <i class="fa-solid fa-arrow-down small"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger rounded-circle border-0 delete-page-item-btn ms-1" draggable="false" title="Delete Page">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;

      // Move Up action
      const moveUpBtn = li.querySelector('.move-up-btn');
      if (moveUpBtn && !isFirst) {
        moveUpBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const temp = pages[idx];
          pages[idx] = pages[idx - 1];
          pages[idx - 1] = temp;
          setUnsavedState(true);
          renderManagePageList();
          window.updateDesktopView();
        });
      }

      // Move Down action
      const moveDownBtn = li.querySelector('.move-down-btn');
      if (moveDownBtn && !isLast) {
        moveDownBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const temp = pages[idx];
          pages[idx] = pages[idx + 1];
          pages[idx + 1] = temp;
          setUnsavedState(true);
          renderManagePageList();
          window.updateDesktopView();
        });
      }

      // Delete button inside manage item
      const delBtn = li.querySelector('.delete-page-item-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          window.deleteAlbumPage(idx);
        });
      }

      // Drag and Drop events
      li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', idx);
        li.classList.add('bg-light');
      });

      li.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      li.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const toIdx = parseInt(li.dataset.index, 10);

        if (fromIdx !== toIdx) {
          const movedItem = pages.splice(fromIdx, 1)[0];
          pages.splice(toIdx, 0, movedItem);
          setUnsavedState(true);
          renderManagePageList();
          window.updateDesktopView();
        }
      });

      reorderPageList.appendChild(li);
    });
  }

  // Delete page helper
  window.deleteAlbumPage = function (index) {
    if (typeof index !== 'number' || index < 0 || index >= pages.length) return;
    const pageTitle = pages[index].title || pages[index].caption || `Page ${index + 1}`;

    if (confirm(`Remove Page ${index + 1} ("${pageTitle}") from your album?`)) {
      pages.splice(index, 1);

      // Ensure pair index doesn't exceed valid bounds
      if (currentPairIndex >= pages.length) {
        currentPairIndex = Math.max(0, Math.floor(Math.max(0, pages.length - 1) / 2) * 2);
      }

      setUnsavedState(true);
      renderManagePageList();
      window.updateDesktopView();
    }
  };

  // ==========================================
  // EDIT PAGE MODAL
  // ==========================================
  window.openEditModal = function (index) {
    const page = pages[index];
    if (!page) return;

    document.getElementById('editPageIndex').value = index;
    document.getElementById('editTitleInput').value = page.title || '';
    document.getElementById('editDateInput').value = page.date || '';

    const imgContainer = document.getElementById('editImageContainer');
    const captionContainer = document.getElementById('editCaptionContainer');
    const captionLabel = document.getElementById('editCaptionLabel');

    if (page.type === 'photo') {
      if (imgContainer) imgContainer.style.display = 'block';
      document.getElementById('editImageInput').value = page.image || '';
      if (captionLabel) captionLabel.textContent = 'Caption';
      document.getElementById('editCaptionInput').value = page.caption || '';
    } else if (page.type === 'text') {
      if (imgContainer) imgContainer.style.display = 'none';
      if (captionLabel) captionLabel.textContent = 'Handwritten Story Content';
      document.getElementById('editCaptionInput').value = page.content || '';
    } else if (page.type === 'name_reveal') {
      if (imgContainer) imgContainer.style.display = 'none';
      if (captionLabel) captionLabel.textContent = 'Reveal Name';
      document.getElementById('editCaptionInput').value = page.name || '';
    }

    const editModalEl = document.getElementById('editPageModal');
    if (editModalEl && window.bootstrap) {
      bootstrap.Modal.getOrCreateInstance(editModalEl).show();
    }
  };

  const deleteFromEditModalBtn = document.getElementById('deleteFromEditModalBtn');
  if (deleteFromEditModalBtn) {
    deleteFromEditModalBtn.addEventListener('click', () => {
      const idx = parseInt(document.getElementById('editPageIndex').value, 10);
      const editModalEl = document.getElementById('editPageModal');
      if (editModalEl && window.bootstrap) {
        bootstrap.Modal.getInstance(editModalEl).hide();
      }
      window.deleteAlbumPage(idx);
    });
  }

  const editPageForm = document.getElementById('editPageForm');
  if (editPageForm) {
    editPageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const idx = parseInt(document.getElementById('editPageIndex').value, 10);
      const page = pages[idx];
      if (!page) return;

      page.title = document.getElementById('editTitleInput').value.trim();
      page.date = document.getElementById('editDateInput').value.trim();

      if (page.type === 'photo') {
        let rawUrl = document.getElementById('editImageInput').value.trim();
        page.image = convertGoogleDriveUrl(rawUrl);
        page.caption = document.getElementById('editCaptionInput').value.trim();
      } else if (page.type === 'text') {
        page.content = document.getElementById('editCaptionInput').value.trim();
      } else if (page.type === 'name_reveal') {
        page.name = document.getElementById('editCaptionInput').value.trim();
      }

      setUnsavedState(true);
      window.updateDesktopView();

      const editModalEl = document.getElementById('editPageModal');
      if (editModalEl && window.bootstrap) {
        bootstrap.Modal.getInstance(editModalEl).hide();
      }
    });
  }

  // ==========================================
  // SAVE & PASSWORD VERIFICATION HANDLER
  // ==========================================
  const savePasswordForm = document.getElementById('savePasswordForm');
  const confirmSaveBtn = document.getElementById('confirmSaveBtn');
  const saveFeedbackAlert = document.getElementById('saveFeedbackAlert');

  if (savePasswordForm) {
    savePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const password = document.getElementById('albumPasswordInput').value;

      if (confirmSaveBtn) {
        confirmSaveBtn.disabled = true;
        confirmSaveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i> Saving...`;
      }

      fetch('/api/album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, pages })
      })
        .then(res => res.json())
        .then(data => {
          if (confirmSaveBtn) {
            confirmSaveBtn.disabled = false;
            confirmSaveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk me-1"></i> Verify & Save`;
          }

          if (data.success) {
            saveToLocalStorage();
            setUnsavedState(false);
            sessionStorage.setItem('gunnusVoiceLastAlbumPage', currentPairIndex);
            const modalEl = document.getElementById('savePasswordModal');
            if (modalEl && window.bootstrap) {
              bootstrap.Modal.getInstance(modalEl).hide();
            }
            alert(`✨ ${data.message || 'Memories saved safely to album!'}`);
            savePasswordForm.reset();
          } else {
            if (saveFeedbackAlert) {
              saveFeedbackAlert.textContent = data.message || 'Error saving album.';
              saveFeedbackAlert.classList.remove('d-none');
            }
          }
        })
        .catch(err => {
          console.error("Error saving album:", err);
          if (confirmSaveBtn) {
            confirmSaveBtn.disabled = false;
            confirmSaveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk me-1"></i> Verify & Save`;
          }
          if (saveFeedbackAlert) {
            saveFeedbackAlert.textContent = 'Server connection error. Please try again.';
            saveFeedbackAlert.classList.remove('d-none');
          }
        });
    });
  }

  // Restore last active page index on refresh
  const savedPairIdx = sessionStorage.getItem('gunnusVoiceLastAlbumPage');
  if (savedPairIdx !== null && !isNaN(parseInt(savedPairIdx, 10))) {
    const idx = parseInt(savedPairIdx, 10);
    if (idx >= 0 && idx < pages.length) {
      currentPairIndex = Math.floor(idx / 2) * 2;
    }
  }

  // Initial Desktop Render
  window.updateDesktopView();
});
