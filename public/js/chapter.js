// chapter.js - Dedicated Chapter Speech & Google Drive Photo Handlers
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

  // Google Drive URL converter helper
  function convertGoogleDriveUrl(urlStr) {
    if (!urlStr) return null;
    let fileId = null;
    const matchD = urlStr.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) {
      fileId = matchD[1];
    } else {
      const matchId = urlStr.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        fileId = matchId[1];
      }
    }
    return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : urlStr;
  }

  // Save Chapter Month Photo Helper
  function saveChapterMonthPhoto(monthId, driveUrl) {
    const directUrl = convertGoogleDriveUrl(driveUrl);
    localStorage.setItem(`gunnusVoiceMonthPhoto_${monthId}`, directUrl);

    const heroImg = document.getElementById('chapterHeroImg');
    if (heroImg) heroImg.src = directUrl;

    fetch('/api/photo/month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthId, driveUrl: directUrl })
    })
    .then(res => res.json())
    .then(data => {
      console.log(`✨ Chapter Month ${monthId} photo updated:`, data);
    })
    .catch(err => console.error("Error updating chapter photo:", err));
  }

  const chapterDriveBtn = document.getElementById('chapterDriveBtn');

  if (chapterDriveBtn) {
    const monthId = chapterDriveBtn.getAttribute('data-chapter');
    chapterDriveBtn.addEventListener('click', () => {
      const inputUrl = prompt(`Paste Google Drive Image link for Month ${monthId}:`);
      if (inputUrl && inputUrl.trim()) {
        saveChapterMonthPhoto(monthId, inputUrl.trim());
        alert(`✨ Month ${monthId} Google Drive photo updated successfully!`);
      }
    });
  }
});
