// Inject hero logo on introduction page
(function() {
  let currentColor = '#5d8bbb';

  function injectLogo() {
    const path = window.location.pathname;
    const isIntroPage = path === '/' || path === '/introduction' || path === '/introduction/';

    if (!isIntroPage || window.location.pathname.includes('curve-playground')) {
      const existing = document.querySelector('.hero-logo');
      if (existing) existing.remove();
      const picker = document.querySelector('.color-picker-container');
      if (picker) picker.remove();
      const chart = document.querySelector('.exponent-chart');
      if (chart) chart.remove();
      return;
    }

    if (document.querySelector('.hero-logo')) return;

    const container = document.querySelector('[class*="prose"]');
    if (!container) return;

    const logo = document.createElement('img');
    logo.src = '/logo/main.svg';
    logo.alt = 'Braid Protocol';
    logo.className = 'hero-logo';
    logo.style.cssText = 'display: block; width: 100%; margin: 0 auto 2rem; transform: scale(1.5); transform-origin: center;';

    container.insertBefore(logo, container.firstChild);
  }

  // Color picker - only shown when colorSelect() is called
  window.colorSelect = function() {
    if (document.querySelector('.color-picker-container')) {
      document.querySelector('.color-picker-container').remove();
      return;
    }

    const pickerContainer = document.createElement('div');
    pickerContainer.className = 'color-picker-container';
    pickerContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #1a1a1a; padding: 15px; border-radius: 8px; z-index: 9999; font-family: monospace;';

    const label = document.createElement('div');
    label.style.cssText = 'color: #fff; margin-bottom: 8px; font-size: 12px;';
    label.textContent = 'Braid Color:';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = currentColor;
    colorInput.style.cssText = 'width: 50px; height: 30px; cursor: pointer; border: none;';

    const codeDisplay = document.createElement('div');
    codeDisplay.style.cssText = 'color: #fff; margin-top: 8px; font-size: 14px; font-weight: bold;';
    codeDisplay.textContent = currentColor;

    colorInput.addEventListener('input', async (e) => {
      currentColor = e.target.value;
      codeDisplay.textContent = currentColor;
      console.log('Selected color:', currentColor);

      // Fetch and modify SVG
      const response = await fetch('/logo/main.svg');
      let svgText = await response.text();
      svgText = svgText.replace(/fill="#[A-Fa-f0-9]{6}"/g, (match) => {
        if (match.includes('3366A0')) return match; // Keep blue
        return `fill="${currentColor}"`;
      });

      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      document.querySelector('.hero-logo').src = url;
    });

    pickerContainer.appendChild(label);
    pickerContainer.appendChild(colorInput);
    pickerContainer.appendChild(codeDisplay);
    document.body.appendChild(pickerContainer);
  };

  function createExponentChart() {
    // Don't show on mobile
    if (window.innerWidth < 768) {
      const existing = document.querySelector('.exponent-chart');
      if (existing) existing.remove();
      return;
    }
    if (document.querySelector('.exponent-chart')) return;

    const container = document.createElement('div');
    container.className = 'exponent-chart';
    container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #1a1a1a; padding: 10px; border-radius: 8px; z-index: 9999;';

    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 100;
    canvas.style.cssText = 'display: block; cursor: pointer;';
    canvas.title = 'Click to open Curve Playground';
    canvas.addEventListener('click', () => {
      window.location.href = '/curve-playground';
    });

    const label = document.createElement('div');
    label.style.cssText = 'color: #fff; font-family: monospace; font-size: 12px; text-align: center; margin-top: 5px;';
    label.textContent = 'exp: 1.50';

    container.appendChild(canvas);
    container.appendChild(label);
    document.body.appendChild(container);

    const ctx = canvas.getContext('2d');

    function drawCurve(exponent) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const midX = canvas.width / 2;

      // Background grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) {
        ctx.moveTo(i * 30, 0);
        ctx.lineTo(i * 30, 100);
        ctx.moveTo(0, i * 20);
        ctx.lineTo(150, i * 20);
      }
      ctx.stroke();

      // Spot price line (center)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, 100);
      ctx.stroke();
      ctx.setLineDash([]);

      // Calculate y value - exp=0 is flat, smooth transition to curved
      function calcY(normalizedX, exp) {
        const power = Math.pow(2, Math.abs(exp));
        const curved = Math.pow(normalizedX, power);
        // Blend towards 0.5 (flat) as exp approaches 0
        const blend = 1 - Math.exp(-Math.abs(exp) * 3);
        if (exp >= 0) {
          return 0.5 * (1 - blend) + curved * blend;
        } else {
          return 0.5 * (1 - blend) + (1 - curved) * blend;
        }
      }

      // Draw bid curve (left side)
      ctx.strokeStyle = 'rgba(93, 139, 187, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= midX; x++) {
        const normalizedX = (midX - x) / midX;
        const y = calcY(normalizedX, exponent);
        const canvasY = 100 - (y * 90) - 5;
        if (x === 0) {
          ctx.moveTo(x, canvasY);
        } else {
          ctx.lineTo(x, canvasY);
        }
      }
      ctx.stroke();

      // Draw ask curve (right side)
      ctx.strokeStyle = 'rgba(93, 139, 187, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = midX; x <= canvas.width; x++) {
        const normalizedX = (x - midX) / midX;
        const y = calcY(normalizedX, exponent);
        const canvasY = 100 - (y * 90) - 5;
        if (x === midX) {
          ctx.moveTo(x, canvasY);
        } else {
          ctx.lineTo(x, canvasY);
        }
      }
      ctx.stroke();

      label.textContent = `exp: ${exponent.toFixed(2)}`;
    }

    // Initial draw
    drawCurve(1.5);

    // Update on mouse move - middle is 0, range -10 to 10
    document.addEventListener('mousemove', (e) => {
      const normalized = (e.clientX / window.innerWidth) * 2 - 1; // -1 to 1
      const sign = Math.sign(normalized);
      const exponent = sign * Math.pow(Math.abs(normalized), 2) * 10;
      drawCurve(exponent);
    });
  }

  function tryInject() {
    setTimeout(() => {
      injectLogo();
      createExponentChart();
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInject);
  } else {
    tryInject();
  }

  // Hide chart on resize to mobile
  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
      const chart = document.querySelector('.exponent-chart');
      if (chart) chart.remove();
    }
  });

  let lastPath = window.location.pathname;
  const observer = new MutationObserver(function() {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      tryInject();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
