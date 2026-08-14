// chapter.js - Dedicated Chapter Speech & Photo Initialization
document.addEventListener('DOMContentLoaded', () => {
  const speakChapterMsgBtn = document.getElementById('speakChapterMsgBtn');
  const chapterMessageText = document.getElementById('chapterMessageText');

  if (speakChapterMsgBtn && chapterMessageText) {
    speakChapterMsgBtn.addEventListener('click', () => {
      const cleanMsg = chapterMessageText.textContent.replace(/"/g, '').trim();
      if (window.speakBabyText) {
        window.speakBabyText(cleanMsg);
      }
    });
  }

  const chapterDriveBtn = document.getElementById('chapterDriveBtn');
  if (chapterDriveBtn) {
    const monthId = chapterDriveBtn.getAttribute('data-chapter');
    // Restore saved month photo from localStorage if present
    try {
      const savedUrl = localStorage.getItem(`gunnusVoiceMonthPhoto_${monthId}`);
      const heroImg = document.getElementById('chapterHeroImg');
      if (savedUrl && heroImg) {
        heroImg.src = savedUrl;
      }
    } catch(e) {}
  }
});
