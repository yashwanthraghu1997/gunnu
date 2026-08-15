/* ====================================================
   VIDEO MEMORIES ("Little Moments ❤️") - FRONTEND JS
   Google Drive URL powered video memory manager
   ==================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Client state
  let memories = window.INITIAL_VIDEO_MEMORIES || [];
  let currentIndex = 0;
  let editingMemoryId = null;

  // DOM Elements
  const videoPlayerContainer = document.getElementById('vmPlayerContainer');
  const activeTitleEl = document.getElementById('vmActiveTitle');
  const activeDateEl = document.getElementById('vmActiveDate');
  const activeAgeEl = document.getElementById('vmActiveAge');
  const activeStoryEl = document.getElementById('vmActiveStory');
  const activeQuoteEl = document.getElementById('vmActiveQuote');
  const activeQuoteContainer = document.getElementById('vmActiveQuoteContainer');

  const prevBtn = document.getElementById('vmPrevBtn');
  const nextBtn = document.getElementById('vmNextBtn');
  const counterEl = document.getElementById('vmCounter');
  const thumbnailsGrid = document.getElementById('vmThumbnailsGrid');

  const editMemoryBtn = document.getElementById('vmEditBtn');
  const deleteMemoryBtn = document.getElementById('vmDeleteBtn');

  // Modal elements
  const addModalEl = document.getElementById('addMemoryModal');
  const addModal = addModalEl ? new bootstrap.Modal(addModalEl) : null;
  const addForm = document.getElementById('addMemoryForm');
  const passwordModalEl = document.getElementById('passwordModal');
  const passwordModal = passwordModalEl ? new bootstrap.Modal(passwordModalEl) : null;
  const confirmActionBtn = document.getElementById('confirmPasswordActionBtn');
  const passwordInput = document.getElementById('passwordInput');

  // Modal Video Input
  const vmInputVideoUrl = document.getElementById('vmInputVideoUrl');
  const modalPreviewBtn = document.getElementById('vmModalPreviewBtn');
  const modalPreviewContainer = document.getElementById('modalPreviewContainer');
  const modalPreviewPlayer = document.getElementById('modalPreviewPlayer');

  let pendingAction = null; // 'SAVE_ADD', 'SAVE_EDIT', 'DELETE'

  // Helper: Extract Google Drive File ID
  function extractDriveFileId(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return null;
    const matchD = urlStr.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) return matchD[1];
    const matchId = urlStr.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) return matchId[1];
    return null;
  }

  // Render Video Player in Container (HTML5 <video> vs Google Drive Iframe)
  function renderPlayerInContainer(container, url) {
    if (!container) return;
    container.innerHTML = '';

    if (!url || !url.trim()) return;

    const driveId = extractDriveFileId(url);

    if (driveId || url.includes('drive.google.com')) {
      const embedUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : url;
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.title = 'Baby Video Memory Player';
      container.appendChild(iframe);
    } else {
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = url;

      video.onerror = () => {
        if (url && (url.includes('drive.google') || url.includes('/d/'))) {
          renderPlayerInContainer(container, url);
        }
      };

      container.appendChild(video);
    }
  }

  // Modal Preview Button Handler
  if (modalPreviewBtn) {
    modalPreviewBtn.addEventListener('click', () => {
      const videoSource = vmInputVideoUrl ? vmInputVideoUrl.value.trim() : '';
      if (!videoSource) {
        alert('Please enter a Google Drive URL to preview!');
        return;
      }
      renderPlayerInContainer(modalPreviewPlayer, videoSource);
      if (modalPreviewContainer) modalPreviewContainer.classList.remove('d-none');
    });
  }

  // Update Main Display for Selected Memory Index
  function loadMemory(index) {
    if (!memories || memories.length === 0) {
      if (activeTitleEl) activeTitleEl.textContent = 'No Video Memories Yet ❤️';
      if (activeStoryEl) activeStoryEl.textContent = 'Click "+ Add Video Memory" below to save your baby\'s first video memory!';
      if (activeQuoteContainer) activeQuoteContainer.style.display = 'none';
      if (videoPlayerContainer) videoPlayerContainer.innerHTML = '<div class="d-flex align-items-center justify-content-center text-muted p-5 fs-5">No videos available</div>';
      if (counterEl) counterEl.textContent = '0 / 0';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    if (index < 0) index = 0;
    if (index >= memories.length) index = memories.length - 1;

    currentIndex = index;
    const mem = memories[currentIndex];

    // Render Video Player
    renderPlayerInContainer(videoPlayerContainer, mem.videoUrl || mem.rawVideoUrl);

    // Update Text Content
    if (activeTitleEl) activeTitleEl.textContent = mem.title || 'Untitled Memory';
    if (activeDateEl) activeDateEl.innerHTML = `<i class="fa-solid fa-calendar-heart me-1 text-danger"></i> ${mem.date || ''}`;
    if (activeAgeEl) activeAgeEl.innerHTML = `<i class="fa-solid fa-baby me-1 text-danger"></i> ${mem.babyAge || ''}`;
    if (activeStoryEl) activeStoryEl.textContent = mem.description || '';

    if (mem.quote && mem.quote.trim()) {
      if (activeQuoteEl) activeQuoteEl.textContent = `"${mem.quote.trim()}"`;
      if (activeQuoteContainer) activeQuoteContainer.style.display = 'block';
    } else {
      if (activeQuoteContainer) activeQuoteContainer.style.display = 'none';
    }

    // Update Counter & Pagination Buttons
    if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${memories.length}`;
    if (prevBtn) prevBtn.disabled = (currentIndex === 0);
    if (nextBtn) nextBtn.disabled = (currentIndex === memories.length - 1);

    // Highlight Active Thumbnail
    updateActiveThumbnail();
  }

  // Render Thumbnail Grid
  function renderThumbnails() {
    if (!thumbnailsGrid) return;
    thumbnailsGrid.innerHTML = '';

    if (!memories || memories.length === 0) {
      thumbnailsGrid.innerHTML = '<p class="text-muted text-center w-100 py-3">No video memories added yet.</p>';
      return;
    }

    memories.forEach((mem, idx) => {
      const card = document.createElement('div');
      card.className = `vm-thumb-card ${idx === currentIndex ? 'active' : ''}`;
      card.dataset.index = idx;

      let thumbSrc = mem.thumbnail;
      let driveId = null;

      if (thumbSrc && typeof thumbSrc === 'string' && !thumbSrc.includes('/folders/')) {
        driveId = extractDriveFileId(thumbSrc);
      }
      if (!driveId) {
        driveId = extractDriveFileId(mem.videoUrl || mem.rawVideoUrl);
      }

      if (driveId) {
        thumbSrc = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
      } else if (!thumbSrc || thumbSrc.includes('/folders/')) {
        thumbSrc = '/images/gunnu.jpeg';
      }

      const videoDriveId = extractDriveFileId(mem.videoUrl || mem.rawVideoUrl) || '';

      card.innerHTML = `
        <div class="vm-thumb-img-wrapper">
          <img src="${thumbSrc}" alt="${mem.title}" onerror="if (!this.dataset.triedDrive && '${videoDriveId}') { this.dataset.triedDrive = 'true'; this.src = 'https://drive.google.com/thumbnail?id=${videoDriveId}&sz=w1000'; } else { this.src = '/images/gunnu.jpeg'; }">
          <div class="vm-play-overlay">
            <div class="vm-play-icon">
              <i class="fa-solid fa-play"></i>
            </div>
          </div>
        </div>
        <div class="vm-thumb-info">
          <h4 class="vm-thumb-title">${mem.title}</h4>
          <p class="vm-thumb-date"><i class="fa-solid fa-clock me-1"></i> ${mem.date}</p>
        </div>
      `;

      card.addEventListener('click', () => {
        loadMemory(idx);
      });

      thumbnailsGrid.appendChild(card);
    });
  }

  function updateActiveThumbnail() {
    const cards = thumbnailsGrid ? thumbnailsGrid.querySelectorAll('.vm-thumb-card') : [];
    cards.forEach((card, idx) => {
      if (idx === currentIndex) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } else {
        card.classList.remove('active');
      }
    });
  }

  // Pagination Handlers
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) loadMemory(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentIndex < memories.length - 1) loadMemory(currentIndex + 1);
    });
  }

  // Keyboard Arrow Key Navigation
  document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      loadMemory(currentIndex - 1);
    } else if (e.key === 'ArrowRight' && currentIndex < memories.length - 1) {
      loadMemory(currentIndex + 1);
    }
  });

  // Modal & Add / Edit / Delete Memory Logic
  const openAddBtn = document.getElementById('openAddVideoModalBtn');
  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      editingMemoryId = null;
      document.getElementById('modalFormTitle').textContent = 'Add a Video Memory ❤️';
      addForm.reset();
      if (modalPreviewContainer) modalPreviewContainer.classList.add('d-none');
      if (modalPreviewPlayer) modalPreviewPlayer.innerHTML = '';
      addModal.show();
    });
  }

  // Edit Button Handler
  if (editMemoryBtn) {
    editMemoryBtn.addEventListener('click', () => {
      const mem = memories[currentIndex];
      if (!mem) return;
      editingMemoryId = mem.id;

      document.getElementById('modalFormTitle').textContent = 'Edit Video Memory ❤️';
      if (vmInputVideoUrl) vmInputVideoUrl.value = mem.rawVideoUrl || mem.videoUrl || '';
      const vmInputThumbnail = document.getElementById('vmInputThumbnail');
      if (vmInputThumbnail) vmInputThumbnail.value = mem.thumbnail || '';
      document.getElementById('vmInputTitle').value = mem.title || '';
      document.getElementById('vmInputDate').value = mem.date || '';
      document.getElementById('vmInputAge').value = mem.babyAge || '';
      document.getElementById('vmInputStory').value = mem.description || '';
      document.getElementById('vmInputQuote').value = mem.quote || '';

      renderPlayerInContainer(modalPreviewPlayer, mem.videoUrl || mem.rawVideoUrl);
      if (modalPreviewContainer) modalPreviewContainer.classList.remove('d-none');

      addModal.show();
    });
  }

  // Delete Button Handler
  if (deleteMemoryBtn) {
    deleteMemoryBtn.addEventListener('click', () => {
      const mem = memories[currentIndex];
      if (!mem) return;
      pendingAction = 'DELETE';
      passwordInput.value = '';
      document.getElementById('passwordModalTitle').textContent = `Delete "${mem.title}"?`;
      passwordModal.show();
    });
  }

  // Form Submit Handler -> Open Password Prompt Modal
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const videoSource = vmInputVideoUrl ? vmInputVideoUrl.value.trim() : '';
      if (!videoSource) {
        alert('Please enter a Google Drive URL!');
        return;
      }

      pendingAction = editingMemoryId ? 'SAVE_EDIT' : 'SAVE_ADD';
      addModal.hide();
      passwordInput.value = '';
      document.getElementById('passwordModalTitle').textContent = editingMemoryId ? 'Verify Password to Update' : 'Verify Password to Save';
      passwordModal.show();
    });
  }

  // Password Confirmation Handler
  if (confirmActionBtn) {
    confirmActionBtn.addEventListener('click', async () => {
      const pwd = passwordInput.value;
      if (!pwd || !pwd.trim()) {
        alert('Please enter your password!');
        return;
      }

      const videoSource = vmInputVideoUrl ? vmInputVideoUrl.value.trim() : '';
      const thumbnailVal = document.getElementById('vmInputThumbnail') ? document.getElementById('vmInputThumbnail').value.trim() : '';

      if (pendingAction === 'SAVE_ADD') {
        const payload = {
          videoUrl: videoSource,
          driveUrl: videoSource,
          thumbnail: thumbnailVal,
          title: document.getElementById('vmInputTitle').value,
          date: document.getElementById('vmInputDate').value,
          babyAge: document.getElementById('vmInputAge').value,
          description: document.getElementById('vmInputStory').value,
          quote: document.getElementById('vmInputQuote').value,
          password: pwd
        };

        try {
          const res = await fetch('/video-memories/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();

          if (data.success) {
            memories = data.memories;
            passwordModal.hide();
            renderThumbnails();
            loadMemory(memories.length - 1);
            alert('✨ Memory saved successfully to JSONBin cloud! ❤️');
          } else {
            alert(data.message || 'Failed to save memory.');
          }
        } catch (err) {
          alert('Error saving video memory.');
        }

      } else if (pendingAction === 'SAVE_EDIT' && editingMemoryId) {
        const payload = {
          videoUrl: videoSource,
          driveUrl: videoSource,
          thumbnail: thumbnailVal,
          title: document.getElementById('vmInputTitle').value,
          date: document.getElementById('vmInputDate').value,
          babyAge: document.getElementById('vmInputAge').value,
          description: document.getElementById('vmInputStory').value,
          quote: document.getElementById('vmInputQuote').value,
          password: pwd
        };

        try {
          const res = await fetch(`/api/video-memories/${editingMemoryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();

          if (data.success) {
            memories = data.memories;
            passwordModal.hide();
            renderThumbnails();
            loadMemory(currentIndex);
            alert('✨ Memory updated successfully in JSONBin cloud! ❤️');
          } else {
            alert(data.message || 'Failed to update memory.');
          }
        } catch (err) {
          alert('Error updating memory.');
        }

      } else if (pendingAction === 'DELETE') {
        const mem = memories[currentIndex];
        if (!mem) return;

        try {
          const res = await fetch(`/api/video-memories/${mem.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
          });
          const data = await res.json();

          if (data.success) {
            memories = data.memories;
            passwordModal.hide();
            if (currentIndex >= memories.length) currentIndex = Math.max(0, memories.length - 1);
            renderThumbnails();
            loadMemory(currentIndex);
            alert('Memory deleted from JSONBin cloud.');
          } else {
            alert(data.message || 'Failed to delete memory.');
          }
        } catch (err) {
          alert('Error deleting memory.');
        }
      }
    });
  }

  // Initial Load
  renderThumbnails();
  if (memories.length > 0) {
    loadMemory(0);
  } else {
    loadMemory(-1);
  }
});
