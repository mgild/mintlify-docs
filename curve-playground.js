// Curve Playground interactive chart
(function() {
  function init() {
    const container = document.getElementById('curve-playground');
    if (!container) return;
    if (container.querySelector('canvas')) return; // Already initialized

    container.innerHTML = `
      <div style="margin-top: 20px;">
        <div style="display: flex; gap: 20px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px;">
            <label style="color: #aaa; font-size: 12px; display: block; margin-bottom: 5px;">Exponent: <span id="pg-exp-val">1.00</span></label>
            <input type="range" id="pg-exponent" min="-50" max="50" value="10" style="width: 100%;">
          </div>
          <div style="flex: 1; min-width: 150px;">
            <label style="color: #aaa; font-size: 12px; display: block; margin-bottom: 5px;">Start Price: <span id="pg-start-val">0%</span></label>
            <input type="range" id="pg-start-price" min="0" max="100" value="0" style="width: 100%;">
          </div>
          <div style="flex: 1; min-width: 150px;">
            <label style="color: #aaa; font-size: 12px; display: block; margin-bottom: 5px;">End Price: <span id="pg-end-val">100%</span></label>
            <input type="range" id="pg-end-price" min="0" max="100" value="100" style="width: 100%;">
          </div>
        </div>
        <canvas id="pg-canvas" width="800" height="400" style="background: #111; border-radius: 8px; width: 100%; max-width: 800px;"></canvas>
        <div style="display: flex; justify-content: space-between; max-width: 800px; margin-top: 10px; color: #666; font-size: 12px;">
          <span style="color: #fff;">Spot Price</span>
          <span>Upper Price</span>
        </div>
      </div>
    `;

    const canvas = document.getElementById('pg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const expSlider = document.getElementById('pg-exponent');
    const startSlider = document.getElementById('pg-start-price');
    const endSlider = document.getElementById('pg-end-price');

    function drawChart() {
      const exp = parseInt(expSlider.value) / 10;
      let startPct = parseInt(startSlider.value) / 100;
      let endPct = parseInt(endSlider.value) / 100;

      // If end goes below start, push start down
      if (endPct < startPct) {
        startPct = endPct;
        startSlider.value = Math.round(startPct * 100);
      }

      document.getElementById('pg-exp-val').textContent = exp.toFixed(2);
      document.getElementById('pg-start-val').textContent = `${Math.round(startPct * 100)}%`;
      document.getElementById('pg-end-val').textContent = `${Math.round(endPct * 100)}%`;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        ctx.moveTo(i * 50, 0);
        ctx.lineTo(i * 50, 400);
      }
      for (let i = 0; i <= 8; i++) {
        ctx.moveTo(0, i * 50);
        ctx.lineTo(800, i * 50);
      }
      ctx.stroke();

      // Spot price line (far left)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 400);
      ctx.stroke();
      ctx.setLineDash([]);

      // Calculate Y value based on position and exponent
      // normalizedX goes from 0 (near spot) to 1 (far from spot)
      function calcY(normalizedX, e) {
        const power = Math.pow(2, Math.abs(e));
        const curved = Math.pow(normalizedX, power);

        // Blend towards flat (0.5) as exp approaches 0
        const blend = 1 - Math.exp(-Math.abs(e) * 3);

        if (e >= 0) {
          // Positive exp: more density far from spot
          return 0.5 * (1 - blend) + curved * blend;
        } else {
          // Negative exp: more density near spot
          return 0.5 * (1 - blend) + (1 - curved) * blend;
        }
      }

      // Calculate average price (weighted average based on curve)
      function calcAverageX(e) {
        // Numerical integration for weighted average
        const steps = 100;
        let totalWeight = 0;
        let weightedSum = 0;

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const y = calcY(t, e);
          totalWeight += y;
          weightedSum += t * y;
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
      }

      // Calculate pixel positions
      // Start% and End% define the range from spot price (0% = at spot, 100% = at right edge)
      const curveStart = canvas.width * startPct;  // Near spot
      const curveEnd = canvas.width * endPct;      // Far from spot

      const rangeWidth = curveEnd - curveStart;
      const isVerticalLine = rangeWidth < 1; // When start = end

      ctx.fillStyle = 'rgba(93, 139, 187, 0.2)';
      ctx.strokeStyle = 'rgba(93, 139, 187, 0.8)';
      ctx.lineWidth = 3;

      if (isVerticalLine) {
        // Draw vertical line when start = end
        ctx.beginPath();
        ctx.moveTo(curveStart, 0);
        ctx.lineTo(curveStart, 400);
        ctx.stroke();
      } else {
        // Fill curve
        ctx.beginPath();
        ctx.moveTo(curveStart, 400);
        for (let x = curveStart; x <= curveEnd; x++) {
          const normalizedX = (x - curveStart) / rangeWidth;
          const y = calcY(normalizedX, exp);
          ctx.lineTo(x, 400 - y * 370);
        }
        ctx.lineTo(curveEnd, 400);
        ctx.closePath();
        ctx.fill();

        // Stroke curve
        ctx.beginPath();
        for (let x = curveStart; x <= curveEnd; x++) {
          const normalizedX = (x - curveStart) / rangeWidth;
          const y = calcY(normalizedX, exp);
          if (x === curveStart) ctx.moveTo(x, 400 - y * 370);
          else ctx.lineTo(x, 400 - y * 370);
        }
        ctx.stroke();
      }

      // Draw average price line (gray dotted) - skip if vertical line
      if (!isVerticalLine) {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);

        const avgNorm = calcAverageX(exp);
        const avgX = curveStart + avgNorm * rangeWidth;
        ctx.beginPath();
        ctx.moveTo(avgX, 20);
        ctx.lineTo(avgX, 400);
        ctx.stroke();

        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.fillText('avg', avgX - 10, 15);
      }
    }

    expSlider.addEventListener('input', drawChart);
    startSlider.addEventListener('input', drawChart);
    endSlider.addEventListener('input', drawChart);
    drawChart();
  }

  // Check periodically for the container
  function checkInit() {
    if (window.location.pathname.includes('curve-playground')) {
      init();
    }
  }

  setInterval(checkInit, 200);
  checkInit();
})();
