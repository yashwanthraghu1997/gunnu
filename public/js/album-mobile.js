// album-mobile.js - Mobile Touch Swipe & Single Page Navigation Controller

document.addEventListener('DOMContentLoaded', () => {
  let mobilePageIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let isSwiping = false;

  const mobilePageCard = document.getElementById('mobilePageCard');
  const mobilePageContent = document.getElementById('mobilePageContent');
  const mobilePrevBtn = document.getElementById('mobilePrevBtn');
  const mobileNextBtn = document.getElementById('mobileNextBtn');
  const mobilePageCounter = document.getElementById('mobilePageCounter');

  // Update single page mobile view
  window.updateMobileView = function(requestedIndex) {
    const pages = window.INITIAL_ALBUM_PAGES || [];
    if (!pages || pages.length === 0) return;

    if (typeof requestedIndex === 'number') {
      mobilePageIndex = requestedIndex;
    }

    if (mobilePageIndex < 0) mobilePageIndex = 0;
    if (mobilePageIndex >= pages.length) mobilePageIndex = pages.length - 1;

    const activePage = pages[mobilePageIndex];
    if (mobilePageContent && window.renderPageHTML) {
      mobilePageContent.innerHTML = window.renderPageHTML(activePage, mobilePageIndex);
    }

    if (mobilePageCounter) {
      mobilePageCounter.textContent = `${mobilePageIndex + 1} / ${pages.length}`;
    }

    if (mobilePrevBtn) mobilePrevBtn.disabled = (mobilePageIndex <= 0);
    if (mobileNextBtn) mobileNextBtn.disabled = (mobilePageIndex >= pages.length - 1);
  };

  function nextMobilePage() {
    const pages = window.INITIAL_ALBUM_PAGES || [];
    if (mobilePageIndex < pages.length - 1) {
      mobilePageIndex++;
      window.updateMobileView(mobilePageIndex);
    }
  }

  function prevMobilePage() {
    if (mobilePageIndex > 0) {
      mobilePageIndex--;
      window.updateMobileView(mobilePageIndex);
    }
  }

  if (mobilePrevBtn) mobilePrevBtn.addEventListener('click', prevMobilePage);
  if (mobileNextBtn) mobileNextBtn.addEventListener('click', nextMobilePage);

  // ==========================================
  // TOUCH GESTURE LISTENERS (touchstart/move/end)
  // ==========================================
  if (mobilePageCard) {
    mobilePageCard.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = true;
    }, { passive: true });

    mobilePageCard.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartX;
      const deltaY = currentY - touchStartY;

      // Ignore vertical scrolling
      if (Math.abs(deltaY) > Math.abs(deltaX)) return;

      if (deltaX < -30) {
        mobilePageCard.classList.add('swiping-left');
        mobilePageCard.classList.remove('swiping-right');
      } else if (deltaX > 30) {
        mobilePageCard.classList.add('swiping-right');
        mobilePageCard.classList.remove('swiping-left');
      }
    }, { passive: true });

    mobilePageCard.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      isSwiping = false;

      touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX;

      mobilePageCard.classList.remove('swiping-left', 'swiping-right');

      // Swipe Threshold: 50px
      if (deltaX < -50) {
        // Swipe Left -> Next Page
        nextMobilePage();
      } else if (deltaX > 50) {
        // Swipe Right -> Previous Page
        prevMobilePage();
      }
    });
  }

  // Initial Mobile Sync
  window.updateMobileView(0);
});
