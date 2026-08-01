// intro.js - Screen Transitions & Night Sky Canvas Particles
document.addEventListener('DOMContentLoaded', () => {
  // 1. Starfield Canvas Renderer for Screen 1
  const canvas = document.getElementById('starfieldCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const stars = [];
    const numStars = 120;

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005
      });
    }

    function renderStarfield() {
      ctx.clearRect(0, 0, width, height);

      for (let star of stars) {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.2) {
          star.speed = -star.speed;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
        ctx.shadowBlur = star.radius * 3;
        ctx.shadowColor = "#FFF5DB";
        ctx.fill();
      }
      requestAnimationFrame(renderStarfield);
    }
    renderStarfield();
  }

  // 2. Interactive Navigation between Screens 1, 2, 3, 4
  const nextBtns = document.querySelectorAll('.next-screen-btn');
  const prevBtns = document.querySelectorAll('.prev-screen-btn');
  const screens = document.querySelectorAll('.intro-screen');
  const currentStepNum = document.getElementById('currentStepNum');

  nextBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const nextTargetId = e.currentTarget.getAttribute('data-next');
      switchScreen(nextTargetId);
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prevTargetId = e.currentTarget.getAttribute('data-prev');
      switchScreen(prevTargetId);
    });
  });

  function switchScreen(targetId) {
    screens.forEach(screen => screen.classList.remove('active'));
    const targetScreen = document.getElementById(targetId);
    if (targetScreen) {
      targetScreen.classList.add('active');
      const stepIndex = targetId.replace('screen', '');
      if (currentStepNum) currentStepNum.textContent = stepIndex;

      // Special typing effect trigger on Screen 3
      if (targetId === 'screen3') {
        triggerTypingEffect();
      }
    }
  }

  function triggerTypingEffect() {
    const textElement = document.getElementById('typedVoiceText');
    if (textElement) {
      const fullText = "So... This website will become Gunnu's voice. ❤️";
      textElement.textContent = "";
      let idx = 0;
      const timer = setInterval(() => {
        if (idx < fullText.length) {
          textElement.textContent += fullText.charAt(idx);
          idx++;
        } else {
          clearInterval(timer);
        }
      }, 50);
    }
  }

  // 3. Begin Journey Button
  const beginJourneyBtn = document.getElementById('beginJourneyBtn');
  if (beginJourneyBtn) {
    beginJourneyBtn.addEventListener('click', () => {
      localStorage.setItem('gunnusVoiceIntroCompleted', 'true');
    });
  }
});
