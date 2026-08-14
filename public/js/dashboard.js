// dashboard.js - Google Drive URL Modal Converter & Interactive Zoom Lightbox Modal
document.addEventListener('DOMContentLoaded', () => {
  // 1. Live Ticking Seconds Clock from DOB
  const dobStr = "2026-07-28";
  const liveSecondsClock = document.getElementById('liveSecondsClock');

  function updateLiveClock() {
    const dob = new Date(dobStr);
    const now = new Date();

    const diff = Math.abs(now - dob);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (liveSecondsClock) {
      liveSecondsClock.textContent = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
  }
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  // Restore saved month photos from localStorage on load
  try {
    for (let m = 1; m <= 12; m++) {
      const savedUrl = localStorage.getItem(`gunnusVoiceMonthPhoto_${m}`);
      if (savedUrl) {
        const cardImg = document.getElementById(`chapterCardImg-${m}`);
        if (cardImg) cardImg.src = savedUrl;
      }
    }
  } catch(e) {}

  // 2. Interactive Zoomable Photo Lightbox Modal Handler
  const lightboxModalImg = document.getElementById('lightboxModalImg');
  const lightboxModalCaption = document.getElementById('lightboxModalCaption');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');
  const zoomLevelText = document.getElementById('zoomLevelText');

  let currentZoom = 1.0;

  function updateImageZoom() {
    if (lightboxModalImg) {
      lightboxModalImg.style.transform = `scale(${currentZoom})`;
    }
    if (zoomLevelText) {
      zoomLevelText.textContent = `${Math.round(currentZoom * 100)}%`;
    }
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      if (currentZoom < 3.5) {
        currentZoom += 0.25;
        updateImageZoom();
      }
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      if (currentZoom > 0.75) {
        currentZoom -= 0.25;
        updateImageZoom();
      }
    });
  }

  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', () => {
      currentZoom = 1.0;
      updateImageZoom();
    });
  }

  // Mouse wheel zoom inside lightbox stage
  const zoomStage = document.querySelector('.zoom-modal-stage');
  if (zoomStage) {
    zoomStage.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        if (currentZoom < 3.5) currentZoom += 0.15;
      } else {
        if (currentZoom > 0.75) currentZoom -= 0.15;
      }
      updateImageZoom();
    });
  }

  // Trigger modal when clicking any polaroid photo
  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('lightbox-trigger')) {
      const imgSrc = e.target.src;
      const imgTitle = e.target.getAttribute('data-title') || "Gunnu's Memory";

      if (lightboxModalImg) {
        lightboxModalImg.src = imgSrc;
        currentZoom = 1.0;
        updateImageZoom();
      }
      if (lightboxModalCaption) lightboxModalCaption.textContent = imgTitle;

      const lightboxModalElement = document.getElementById('photoLightboxModal');
      if (lightboxModalElement && window.bootstrap) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(lightboxModalElement);
        modalInstance.show();
      }
    }
  });

  // 3. Google Drive Image URL Converter Helper
  window.convertGoogleDriveUrl = function(urlStr) {
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
  };

  // Helper: Save Month Photo to Server & LocalStorage
  function saveMonthPhoto(monthId, driveUrl) {
    const directUrl = window.convertGoogleDriveUrl(driveUrl);

    // Backup to LocalStorage per month ID
    localStorage.setItem(`gunnusVoiceMonthPhoto_${monthId}`, directUrl);

    // Update main Scrapbook preview if matching active month
    const previewImg = document.getElementById('scrapbookPhotoPreview');
    if (previewImg) previewImg.src = directUrl;

    // Update mini polaroid frame on bottom grid for that specific month ID
    const cardImg = document.getElementById(`chapterCardImg-${monthId}`);
    if (cardImg) cardImg.src = directUrl;

    // Post to Server API for cross-device persistence
    fetch('/api/photo/month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthId, driveUrl: directUrl })
    })
    .then(res => res.json())
    .then(data => {
      console.log(`✨ Saved photo for Month ${monthId}:`, data);
      alert(`✨ Month ${monthId} photo updated successfully!`);
    })
    .catch(err => console.error("Error saving photo to server:", err));
  }

  // Google Drive Modal Trigger Handlers
  let selectedMonthForDrive = 1;
  const driveModalInput = document.getElementById('driveModalInput');
  const modalMonthNumDisplay = document.getElementById('modalMonthNumDisplay');
  const modalMonthNumSubtitle = document.getElementById('modalMonthNumSubtitle');
  const saveDriveModalBtn = document.getElementById('saveDriveModalBtn');

  // Trigger modal when clicking any Drive button
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.open-drive-modal-btn');
    if (btn) {
      selectedMonthForDrive = btn.getAttribute('data-chapter') || 1;
      if (modalMonthNumDisplay) modalMonthNumDisplay.textContent = selectedMonthForDrive;
      if (modalMonthNumSubtitle) modalMonthNumSubtitle.textContent = selectedMonthForDrive;
      if (driveModalInput) driveModalInput.value = "";

      const driveModalElement = document.getElementById('googleDriveModal');
      if (driveModalElement && window.bootstrap) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(driveModalElement);
        modalInstance.show();
      }
    }
  });

  if (saveDriveModalBtn) {
    saveDriveModalBtn.addEventListener('click', () => {
      const rawUrl = driveModalInput ? driveModalInput.value.trim() : "";
      if (!rawUrl) {
        alert("Please paste a valid Google Drive URL!");
        return;
      }

      saveMonthPhoto(selectedMonthForDrive, rawUrl);

      const driveModalElement = document.getElementById('googleDriveModal');
      if (driveModalElement && window.bootstrap) {
        const modalInstance = bootstrap.Modal.getInstance(driveModalElement);
        if (modalInstance) modalInstance.hide();
      }
    });
  }

  // 4. Interactive Memory Tree Leaf Nodes
  const treeLeafNodes = document.querySelectorAll('.tree-leaf-node');
  const treeStatusTitle = document.getElementById('treeStatusTitle');
  const treeStatusSubtitle = document.getElementById('treeStatusSubtitle');

  treeLeafNodes.forEach(node => {
    node.addEventListener('click', (e) => {
      const monthId = e.currentTarget.getAttribute('data-month');
      fetch('/api/data')
        .then(res => res.json())
        .then(data => {
          const monthData = data.months.find(m => m.id === parseInt(monthId, 10));
          if (monthData) {
            if (treeStatusTitle) treeStatusTitle.textContent = `Month ${monthData.id}: ${monthData.title}`;
            if (treeStatusSubtitle) treeStatusSubtitle.textContent = monthData.subtitle;
            
            triggerTreeBlossomEffect();
            
            if (monthData.status === 'locked') {
              alert(`🔒 Month ${monthData.id} Memory Leaf is currently locked. It will bloom when Gunnu reaches Month ${monthData.id}!`);
            }
          }
        });
    });
  });

  // 5. Cute Soundboard Audio Synthesis (Coo & Giggle)
  const playCooBtn = document.getElementById('playCooBtn');
  const playGiggleBtn = document.getElementById('playGiggleBtn');
  let synthAudioCtx = null;

  function initAudioCtx() {
    if (!synthAudioCtx) {
      synthAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (synthAudioCtx.state === 'suspended') {
      synthAudioCtx.resume();
    }
  }

  if (playCooBtn) {
    playCooBtn.addEventListener('click', () => {
      initAudioCtx();
      const osc = synthAudioCtx.createOscillator();
      const gain = synthAudioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, synthAudioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(650, synthAudioCtx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.001, synthAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, synthAudioCtx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, synthAudioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(synthAudioCtx.destination);

      osc.start();
      osc.stop(synthAudioCtx.currentTime + 0.65);
    });
  }

  if (playGiggleBtn) {
    playGiggleBtn.addEventListener('click', () => {
      initAudioCtx();
      const freqs = [600, 750, 650, 800, 700, 850];
      freqs.forEach((freq, idx) => {
        setTimeout(() => {
          if (!synthAudioCtx) return;
          const osc = synthAudioCtx.createOscillator();
          const gain = synthAudioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, synthAudioCtx.currentTime);

          gain.gain.setValueAtTime(0.06, synthAudioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, synthAudioCtx.currentTime + 0.12);

          osc.connect(gain);
          gain.connect(synthAudioCtx.destination);

          osc.start();
          osc.stop(synthAudioCtx.currentTime + 0.13);
        }, idx * 110);
      });
    });
  }

  // 6. Chapter Filter Pills
  const filterTabs = document.querySelectorAll('#chapterFilterTabs .nav-link');
  const chapterCards = document.querySelectorAll('.chapter-card-wrapper');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      filterTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');

      const filterValue = e.target.getAttribute('data-filter');

      chapterCards.forEach(card => {
        const cardStatus = card.getAttribute('data-status');
        if (filterValue === 'all') {
          card.style.display = 'block';
        } else if (filterValue === 'current' && cardStatus === 'current') {
          card.style.display = 'block';
        } else if (filterValue === 'completed' && cardStatus === 'completed') {
          card.style.display = 'block';
        } else if (filterValue === 'locked' && cardStatus === 'locked') {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 7. Interactive Memories Checklist with Chapter Storage
  const memoryCheckboxes = document.querySelectorAll('.memory-checkbox');
  const checklistProgressBadge = document.getElementById('checklistProgressBadge');
  const treeBlossomOverlay = document.getElementById('treeBlossomOverlay');

  const activeChapter = memoryCheckboxes[0]?.getAttribute('data-chapter') || '1';
  const storageKey = `gunnusVoiceChecklist_ch_${activeChapter}`;

  const savedState = JSON.parse(localStorage.getItem(storageKey) || '{}');

  memoryCheckboxes.forEach(cb => {
    const index = cb.getAttribute('data-index');
    if (savedState[index]) {
      cb.checked = true;
    }

    cb.addEventListener('change', () => {
      savedState[index] = cb.checked;
      localStorage.setItem(storageKey, JSON.stringify(savedState));
      updateChecklistBadge();
      
      if (cb.checked) {
        triggerTreeBlossomEffect();
      }
    });
  });

  function updateChecklistBadge() {
    const total = memoryCheckboxes.length;
    const checkedCount = document.querySelectorAll('.memory-checkbox:checked').length;
    if (checklistProgressBadge) {
      checklistProgressBadge.textContent = `${checkedCount} / ${total} Completed`;
    }
  }
  updateChecklistBadge();

  function triggerTreeBlossomEffect() {
    if (treeBlossomOverlay) {
      treeBlossomOverlay.style.opacity = '1';
      setTimeout(() => {
        treeBlossomOverlay.style.opacity = '0.7';
      }, 1500);
    }
  }

  // 8. Hear Speech Button & Message Rotator
  const speakMessageBtn = document.getElementById('speakMessageBtn');
  const babyMessageText = document.getElementById('babyMessageText');

  if (speakMessageBtn && babyMessageText) {
    speakMessageBtn.addEventListener('click', () => {
      const cleanMsg = babyMessageText.textContent.replace(/"/g, '').trim();
      if (window.speakBabyText) {
        window.speakBabyText(cleanMsg);
      }
    });
  }

  const newBabyMsgBtn = document.getElementById('newBabyMsgBtn');
  if (newBabyMsgBtn && babyMessageText) {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          newBabyMsgBtn.addEventListener('click', () => {
            const randomIndex = Math.floor(Math.random() * data.messages.length);
            const msgObj = data.messages[randomIndex];
            
            babyMessageText.style.opacity = '0';
            setTimeout(() => {
              babyMessageText.textContent = `"${msgObj.text}"`;
              babyMessageText.style.opacity = '1';
            }, 300);
          });
        }
      })
      .catch(err => console.error("Error fetching message data:", err));
  }

  // 9. Photoshoot Mission Status Toggle per Chapter
  const toggleMissionStatusBtn = document.getElementById('toggleMissionStatusBtn');
  const missionStatusLabel = document.getElementById('missionStatusLabel');

  if (toggleMissionStatusBtn && missionStatusLabel) {
    const chNum = toggleMissionStatusBtn.getAttribute('data-chapter') || activeChapter;
    const missionKey = `gunnusVoiceMission_ch_${chNum}`;

    const isMissionDone = localStorage.getItem(missionKey) === 'true';
    if (isMissionDone) {
      missionStatusLabel.textContent = "✅ Complete & Saved";
      missionStatusLabel.className = "text-success fs-5 fw-bold";
      toggleMissionStatusBtn.textContent = "Mission Marked Done";
    }

    toggleMissionStatusBtn.addEventListener('click', () => {
      const currentDone = localStorage.getItem(missionKey) === 'true';
      if (!currentDone) {
        localStorage.setItem(missionKey, 'true');
        missionStatusLabel.textContent = "✅ Complete & Saved";
        missionStatusLabel.className = "text-success fs-5 fw-bold";
        toggleMissionStatusBtn.textContent = "Mission Marked Done";
      } else {
        localStorage.setItem(missionKey, 'false');
        missionStatusLabel.textContent = "Pending Camera Prep";
        missionStatusLabel.className = "text-primary fs-5";
        toggleMissionStatusBtn.innerHTML = '<i class="fa-solid fa-check-double me-1"></i> Mark Mission Complete';
      }
    });
  }
});
