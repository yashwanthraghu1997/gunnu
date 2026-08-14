// main.js - Core Audio Lullaby Synth & Global Helpers
document.addEventListener('DOMContentLoaded', () => {
  console.log("✨ Gunnu's Voice initialized with love!");

  // 1. Magical Ambient Lullaby Web Audio API Synthesizer
  let audioCtx = null;
  let isPlayingAudio = false;
  let lullabyInterval = null;

  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioStatusText = document.getElementById('audioStatusText');

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      if (!isPlayingAudio) {
        startLullabySynth();
        isPlayingAudio = true;
        if (audioStatusText) audioStatusText.textContent = "Pause Music";
        audioToggleBtn.classList.add('bg-light-pink', 'text-pink');
      } else {
        stopLullabySynth();
        isPlayingAudio = false;
        if (audioStatusText) audioStatusText.textContent = "Play Music";
        audioToggleBtn.classList.remove('bg-light-pink', 'text-pink');
      }
    });
  }

  function startLullabySynth() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Gentle soothing lullaby notes (F major pentatonic scale)
    const notes = [349.23, 392.00, 440.00, 523.25, 587.33, 698.46]; 

    function playSoftNote() {
      if (!audioCtx || !isPlayingAudio) return;
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const note = notes[Math.floor(Math.random() * notes.length)];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, audioCtx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.0);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 3.2);
    }

    playSoftNote();
    lullabyInterval = setInterval(playSoftNote, 2200);
  }

  function stopLullabySynth() {
    if (lullabyInterval) {
      clearInterval(lullabyInterval);
      lullabyInterval = null;
    }
  }

  // 2. Global Speech Synthesis Helper ("Hear Gunnu's Voice")
  window.speakBabyText = function(textToSpeak) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.9;
      utterance.pitch = 1.35;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Audio Voice: " + textToSpeak);
    }
  };

  // 3. Global Google Drive URL Converter Helper
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

  // 4. Smart Multi-Level Image Error Fallback Handler for Google Drive Images
  window.handleImageError = function(imgEl) {
    if (!imgEl) return;
    const currentSrc = imgEl.src || '';
    
    // Extract fileId if Google Drive URL format
    const matchD = currentSrc.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const matchId = currentSrc.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = (matchD && matchD[1]) || (matchId && matchId[1]);

    if (fileId) {
      if (currentSrc.includes('lh3.googleusercontent.com')) {
        imgEl.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        return;
      } else if (currentSrc.includes('drive.google.com/thumbnail')) {
        imgEl.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
        return;
      }
    }

    // Final fallback to default image if all endpoints fail
    imgEl.onerror = null;
    imgEl.src = '/images/gunnu.jpeg';
  };
});
