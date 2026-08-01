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
});
