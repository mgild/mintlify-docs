// Curve Playground interactive chart - MM-friendly parameters
(function() {
  function init() {
    const container = document.getElementById('curve-playground');
    if (!container) return;
    if (container.querySelector('canvas')) return; // Already initialized

    container.innerHTML = `
      <div style="margin-top: 20px; width: 100%;">
        <div style="display: flex; gap: 20px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 140px;">
            <label style="color: #aaa; font-size: 12px; display: block; margin-bottom: 5px;">Spread: <span id="pg-spread-val">50</span> bps</label>
            <input type="range" id="pg-spread" min="5" max="500" value="50" style="width: 100%;">
          </div>
          <div style="flex: 1; min-width: 140px;">
            <label style="color: #aaa; font-size: 12px; display: block; margin-bottom: 5px;">Range: <span id="pg-range-val">50.0</span>%</label>
            <input type="range" id="pg-range" min="10" max="500" value="500" style="width: 100%;">
          </div>
          <div style="flex: 1; min-width: 140px;">
            <label style="color: #aaa; font-size: 12px; display: block; margin-bottom: 5px;">Gamma: <span id="pg-gamma-val">1.50</span></label>
            <input type="range" id="pg-gamma" min="-50" max="50" value="15" style="width: 100%;">
          </div>
          <div style="flex: 1; min-width: 140px;">
            <label style="color: #aaa; font-size: 12px; display: block; margin-bottom: 5px;">Skew: <span id="pg-skew-val">0.00</span></label>
            <input type="range" id="pg-skew" min="-100" max="100" value="0" style="width: 100%;">
          </div>
        </div>
        <canvas id="pg-canvas" width="800" height="400" style="background: #111; border-radius: 8px; width: 100%;"></canvas>
        <div style="display: flex; justify-content: space-between; width: 100%; margin-top: 10px; color: #666; font-size: 12px;">
          <span>Bid Range</span>
          <span style="color: #fff;">Mid Price</span>
          <span>Ask Range</span>
        </div>
        <div id="pg-params" style="display: flex; justify-content: space-between; width: 100%; margin-top: 15px; font-family: monospace; font-size: 11px;"></div>
        <div id="pg-program-params" style="display: block; width: 100%; margin-top: 20px; box-sizing: border-box;"></div>
      </div>
    `;

    const canvas = document.getElementById('pg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const spreadSlider = document.getElementById('pg-spread');
    const rangeSlider = document.getElementById('pg-range');
    const gammaSlider = document.getElementById('pg-gamma');
    const skewSlider = document.getElementById('pg-skew');
    const paramsDiv = document.getElementById('pg-params');

    function drawChart() {
      const spreadBps = parseInt(spreadSlider.value);
      const rangePct = parseInt(rangeSlider.value) / 10;
      const gamma = parseInt(gammaSlider.value) / 10;
      const skew = -parseInt(skewSlider.value) / 100;

      // Update labels
      document.getElementById('pg-spread-val').textContent = spreadBps;
      document.getElementById('pg-range-val').textContent = rangePct.toFixed(1);
      document.getElementById('pg-gamma-val').textContent = gamma.toFixed(2);
      document.getElementById('pg-skew-val').textContent = (parseInt(skewSlider.value) / 100).toFixed(2);

      // Calculate per-side parameters based on skew
      // Negative skew = long, want to sell = more aggressive ask
      const askGamma = gamma * (1 - skew);
      const bidGamma = gamma * (1 + skew);
      const askDepthMult = 1 - skew;
      const bidDepthMult = 1 + skew;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const midX = canvas.width / 2;

      // Grid
      ctx.strokeStyle = '#222';
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

      // Mid price line (center)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, 400);
      ctx.stroke();
      ctx.setLineDash([]);

      // Calculate pixel positions (original scaling)
      // Spread defines the gap from mid to where each curve starts
      // Range defines how wide each curve extends beyond the spread
      let spreadPx = (spreadBps / 10000) * midX * 4; // Scale for visibility
      let rangePx = (rangePct / 100) * midX * 2;

      // Check if curves would overflow canvas
      let bidStart = midX - spreadPx - rangePx;
      let bidEnd = midX - spreadPx;
      let askStart = midX + spreadPx;
      let askEnd = midX + spreadPx + rangePx;

      // If overflow, scale down to fit
      const margin = 10;
      if (bidStart < margin || askEnd > canvas.width - margin) {
        const maxExtentPx = Math.max(midX - bidStart, askEnd - midX);
        const availableWidth = midX - margin;
        const scaleFactor = availableWidth / maxExtentPx;

        spreadPx *= scaleFactor;
        rangePx *= scaleFactor;

        bidStart = midX - spreadPx - rangePx;
        bidEnd = midX - spreadPx;
        askStart = midX + spreadPx;
        askEnd = midX + spreadPx + rangePx;
      }

      // Draw spread zone (gray area in middle)
      ctx.fillStyle = 'rgba(50, 50, 50, 0.3)';
      ctx.fillRect(bidEnd, 0, askStart - bidEnd, 400);

      // Calculate raw curve shape (not normalized)
      // Returns unnormalized density value for a given position
      function calcRawY(normalizedX, g) {
        if (Math.abs(g) < 0.01) return 1.0; // Uniform

        const power = Math.pow(2, Math.abs(g));
        const curved = Math.pow(normalizedX, power);

        // Blend towards flat as gamma approaches 0
        const blend = 1 - Math.exp(-Math.abs(g) * 3);

        if (g >= 0) {
          // Positive gamma: more density at edges (away from spread)
          return (1 - blend) + curved * blend;
        } else {
          // Negative gamma: more density near spread
          return (1 - blend) + (1 - curved) * blend;
        }
      }

      // Calculate normalization factor so area under curve is constant
      // This ensures total liquidity (depth) stays the same regardless of gamma
      function calcNormFactor(g) {
        const steps = 100;
        let sum = 0;
        for (let i = 0; i <= steps; i++) {
          sum += calcRawY(i / steps, g);
        }
        return steps / sum; // Normalize so average height = 1
      }

      // Normalized Y value - area under curve stays constant, only shape changes
      function calcY(normalizedX, g, depthMult, normFactor) {
        const raw = calcRawY(normalizedX, g);
        return raw * normFactor * 0.5 * depthMult;
      }

      // Pre-calculate normalization factors for bid and ask
      const bidNormFactor = calcNormFactor(bidGamma);
      const askNormFactor = calcNormFactor(askGamma);

      // Draw bid curve (left side, green tint)
      if (bidEnd > bidStart) {
        const bidWidth = bidEnd - bidStart;

        ctx.fillStyle = `rgba(34, 197, 94, ${0.15 * bidDepthMult})`;
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.6 + 0.4 * bidDepthMult})`;
        ctx.lineWidth = 3;

        // Fill
        ctx.beginPath();
        ctx.moveTo(bidStart, 400);
        for (let x = bidStart; x <= bidEnd; x++) {
          const normalizedX = (bidEnd - x) / bidWidth; // 0 at edge (mid), 1 at far end
          const y = calcY(normalizedX, bidGamma, bidDepthMult, bidNormFactor);
          ctx.lineTo(x, 400 - y * 350);
        }
        ctx.lineTo(bidEnd, 400);
        ctx.closePath();
        ctx.fill();

        // Stroke
        ctx.beginPath();
        for (let x = bidStart; x <= bidEnd; x++) {
          const normalizedX = (bidEnd - x) / bidWidth;
          const y = calcY(normalizedX, bidGamma, bidDepthMult, bidNormFactor);
          if (x === bidStart) {
            ctx.moveTo(x, 400 - y * 350);
          } else {
            ctx.lineTo(x, 400 - y * 350);
          }
        }
        ctx.stroke();
      }

      // Draw ask curve (right side, red tint)
      if (askEnd > askStart) {
        const askWidth = askEnd - askStart;

        ctx.fillStyle = `rgba(239, 68, 68, ${0.15 * askDepthMult})`;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + 0.4 * askDepthMult})`;
        ctx.lineWidth = 3;

        // Fill
        ctx.beginPath();
        ctx.moveTo(askStart, 400);
        for (let x = askStart; x <= askEnd; x++) {
          const normalizedX = (x - askStart) / askWidth; // 0 at edge (mid), 1 at far end
          const y = calcY(normalizedX, askGamma, askDepthMult, askNormFactor);
          ctx.lineTo(x, 400 - y * 350);
        }
        ctx.lineTo(askEnd, 400);
        ctx.closePath();
        ctx.fill();

        // Stroke
        ctx.beginPath();
        for (let x = askStart; x <= askEnd; x++) {
          const normalizedX = (x - askStart) / askWidth;
          const y = calcY(normalizedX, askGamma, askDepthMult, askNormFactor);
          if (x === askStart) {
            ctx.moveTo(x, 400 - y * 350);
          } else {
            ctx.lineTo(x, 400 - y * 350);
          }
        }
        ctx.stroke();
      }

      // Draw spread boundaries
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(bidEnd, 0);
      ctx.lineTo(bidEnd, 400);
      ctx.moveTo(askStart, 0);
      ctx.lineTo(askStart, 400);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.font = '11px monospace';
      ctx.fillStyle = '#22c55e';
      ctx.fillText('BID', bidStart + 5, 20);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('ASK', askEnd - 30, 20);
      ctx.fillStyle = '#666';
      ctx.fillText('spread', midX - 20, 20);

      // Update computed parameters display
      paramsDiv.innerHTML = `
        <div style="color: #22c55e; background: #111; padding: 8px 12px; border-radius: 4px; border: 1px solid #22c55e33;">
          <div style="margin-bottom: 4px; color: #888;">Bid Order</div>
          <div>gamma: ${bidGamma.toFixed(2)}</div>
          <div>depth: ${(bidDepthMult * 100).toFixed(0)}%</div>
        </div>
        <div style="color: #888; background: #111; padding: 8px 12px; border-radius: 4px; border: 1px solid #333; text-align: center;">
          <div style="margin-bottom: 4px;">Spread</div>
          <div>${spreadBps} bps</div>
          <div style="font-size: 10px; color: #666;">${(spreadBps / 100).toFixed(2)}%</div>
        </div>
        <div style="color: #ef4444; background: #111; padding: 8px 12px; border-radius: 4px; border: 1px solid #ef444433;">
          <div style="margin-bottom: 4px; color: #888;">Ask Order</div>
          <div>gamma: ${askGamma.toFixed(2)}</div>
          <div>depth: ${(askDepthMult * 100).toFixed(0)}%</div>
        </div>
      `;

      // Calculate on-chain program parameters
      // Using $100 as reference mid price (100_000_000 in 6 decimal places)
      const midPrice = 100_000_000;
      const spreadMult = spreadBps / 10000;
      const rangeMult = rangePct / 100;

      // Bid order: below mid price
      const bidPMax = Math.round(midPrice * (1 - spreadMult));
      const bidPMin = Math.round(midPrice * (1 - spreadMult - rangeMult));
      const bidExponent = Math.round(bidGamma * 1000);

      // Ask order: above mid price
      const askPMin = Math.round(midPrice * (1 + spreadMult));
      const askPMax = Math.round(midPrice * (1 + spreadMult + rangeMult));
      const askExponent = Math.round(askGamma * 1000);

      // Get canvas actual rendered width
      const canvasWidth = canvas.getBoundingClientRect().width;

      const programParamsDiv = document.getElementById('pg-program-params');

      // Use CSS Grid with divs instead of table (avoids Mintlify table styling)
      const rowStyle = 'display: grid; grid-template-columns: 40% 30% 30%; border-bottom: 1px solid #2a2a2a;';
      const cellStyle = 'padding: 8px 10px;';
      const rightCellStyle = 'padding: 8px 10px; text-align: right;';

      programParamsDiv.innerHTML = `
        <div style="font-family: monospace; font-size: 12px; background: #1a1a1a; border-radius: 8px; overflow: hidden;">
          <div style="${rowStyle} background: #252525; color: #888; border-bottom: 1px solid #333;">
            <div style="${cellStyle}">Parameter</div>
            <div style="${rightCellStyle} color: #22c55e;">Bid Order</div>
            <div style="${rightCellStyle} color: #ef4444;">Ask Order</div>
          </div>
          <div style="${rowStyle} color: #ccc;">
            <div style="${cellStyle}">p_min</div>
            <div style="${rightCellStyle}">${bidPMin.toLocaleString()}</div>
            <div style="${rightCellStyle}">${askPMin.toLocaleString()}</div>
          </div>
          <div style="${rowStyle} color: #ccc;">
            <div style="${cellStyle}">p_max</div>
            <div style="${rightCellStyle}">${bidPMax.toLocaleString()}</div>
            <div style="${rightCellStyle}">${askPMax.toLocaleString()}</div>
          </div>
          <div style="${rowStyle} color: #ccc;">
            <div style="${cellStyle}">exponent <span style="color: #666;">(×1000)</span></div>
            <div style="${rightCellStyle}">${bidExponent}</div>
            <div style="${rightCellStyle}">${askExponent}</div>
          </div>
          <div style="display: grid; grid-template-columns: 40% 30% 30%; color: #ccc;">
            <div style="${cellStyle}">amount <span style="color: #666;">(multiplier)</span></div>
            <div style="${rightCellStyle}">${bidDepthMult.toFixed(2)}×</div>
            <div style="${rightCellStyle}">${askDepthMult.toFixed(2)}×</div>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: #666; font-family: monospace;">
          Reference: mid_price = ${midPrice.toLocaleString()} ($100.00)
        </div>
      `;
    }

    spreadSlider.addEventListener('input', drawChart);
    rangeSlider.addEventListener('input', drawChart);
    gammaSlider.addEventListener('input', drawChart);
    skewSlider.addEventListener('input', drawChart);
    drawChart();
  }

  // Mini gamma demo for the explanation section
  function initGammaDemo() {
    const container = document.getElementById('gamma-demo');
    if (!container) return;
    if (container.querySelector('canvas')) return;

    container.innerHTML = `
      <div style="margin: 20px 0; padding: 20px; background: #0a0a0a; border-radius: 12px; border: 1px solid #222;">
        <div style="display: flex; gap: 10px; margin-bottom: 15px; justify-content: center;">
          <button id="gd-neg" style="padding: 8px 16px; background: #1a1a1a; border: 2px solid #5d8bbb; color: #5d8bbb; border-radius: 6px; cursor: pointer; font-family: monospace; font-weight: bold;">Negative (-2.0)</button>
          <button id="gd-zero" style="padding: 8px 16px; background: #1a1a1a; border: 2px solid #333; color: #888; border-radius: 6px; cursor: pointer; font-family: monospace;">Zero (0.0)</button>
          <button id="gd-pos" style="padding: 8px 16px; background: #1a1a1a; border: 2px solid #333; color: #888; border-radius: 6px; cursor: pointer; font-family: monospace;">Positive (+2.0)</button>
        </div>
        <canvas id="gd-canvas" width="600" height="200" style="background: #111; border-radius: 8px; width: 100%;"></canvas>
        <div id="gd-label" style="text-align: center; margin-top: 12px; font-family: monospace; font-size: 13px; color: #5d8bbb;">
          Front-loaded: More liquidity near the spread edge
        </div>
      </div>
    `;

    const canvas = document.getElementById('gd-canvas');
    const ctx = canvas.getContext('2d');
    const label = document.getElementById('gd-label');
    const btnNeg = document.getElementById('gd-neg');
    const btnZero = document.getElementById('gd-zero');
    const btnPos = document.getElementById('gd-pos');

    let currentGamma = -2.0;

    function setActiveButton(active) {
      [btnNeg, btnZero, btnPos].forEach(btn => {
        btn.style.borderColor = '#333';
        btn.style.color = '#888';
        btn.style.fontWeight = 'normal';
      });
      active.style.borderColor = '#5d8bbb';
      active.style.color = '#5d8bbb';
      active.style.fontWeight = 'bold';
    }

    function drawGammaDemo(gamma) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const midX = canvas.width / 2;
      const spreadPx = 30;
      const rangePx = 200;

      // Grid
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        ctx.moveTo(i * 50, 0);
        ctx.lineTo(i * 50, 200);
      }
      for (let i = 0; i <= 4; i++) {
        ctx.moveTo(0, i * 50);
        ctx.lineTo(600, i * 50);
      }
      ctx.stroke();

      // Spread zone
      ctx.fillStyle = 'rgba(50, 50, 50, 0.3)';
      ctx.fillRect(midX - spreadPx, 0, spreadPx * 2, 200);

      // Mid line
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, 200);
      ctx.stroke();
      ctx.setLineDash([]);

      function calcRawY(normalizedX, g) {
        if (Math.abs(g) < 0.01) return 1.0;
        const power = Math.pow(2, Math.abs(g));
        const curved = Math.pow(normalizedX, power);
        const blend = 1 - Math.exp(-Math.abs(g) * 3);
        if (g >= 0) {
          return (1 - blend) + curved * blend;
        } else {
          return (1 - blend) + (1 - curved) * blend;
        }
      }

      function calcNormFactor(g) {
        const steps = 100;
        let sum = 0;
        for (let i = 0; i <= steps; i++) {
          sum += calcRawY(i / steps, g);
        }
        return steps / sum;
      }

      const normFactor = calcNormFactor(gamma);

      function calcY(normalizedX) {
        const raw = calcRawY(normalizedX, gamma);
        return raw * normFactor * 0.5;
      }

      // Draw single curve (showing one side for clarity)
      const curveStart = midX + spreadPx;
      const curveEnd = midX + spreadPx + rangePx;
      const curveWidth = curveEnd - curveStart;

      // Fill
      ctx.fillStyle = 'rgba(93, 139, 187, 0.2)';
      ctx.beginPath();
      ctx.moveTo(curveStart, 200);
      for (let x = curveStart; x <= curveEnd; x++) {
        const normalizedX = (x - curveStart) / curveWidth;
        const y = calcY(normalizedX);
        ctx.lineTo(x, 200 - y * 180);
      }
      ctx.lineTo(curveEnd, 200);
      ctx.closePath();
      ctx.fill();

      // Stroke
      ctx.strokeStyle = 'rgba(93, 139, 187, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = curveStart; x <= curveEnd; x++) {
        const normalizedX = (x - curveStart) / curveWidth;
        const y = calcY(normalizedX);
        if (x === curveStart) {
          ctx.moveTo(x, 200 - y * 180);
        } else {
          ctx.lineTo(x, 200 - y * 180);
        }
      }
      ctx.stroke();

      // Mirror for bid side
      const bidStart = midX - spreadPx - rangePx;
      const bidEnd = midX - spreadPx;
      const bidWidth = bidEnd - bidStart;

      ctx.fillStyle = 'rgba(93, 139, 187, 0.2)';
      ctx.beginPath();
      ctx.moveTo(bidStart, 200);
      for (let x = bidStart; x <= bidEnd; x++) {
        const normalizedX = (bidEnd - x) / bidWidth;
        const y = calcY(normalizedX);
        ctx.lineTo(x, 200 - y * 180);
      }
      ctx.lineTo(bidEnd, 200);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(93, 139, 187, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = bidStart; x <= bidEnd; x++) {
        const normalizedX = (bidEnd - x) / bidWidth;
        const y = calcY(normalizedX);
        if (x === bidStart) {
          ctx.moveTo(x, 200 - y * 180);
        } else {
          ctx.lineTo(x, 200 - y * 180);
        }
      }
      ctx.stroke();

      // Labels
      ctx.font = '11px monospace';
      ctx.fillStyle = '#666';
      ctx.fillText('spread', midX - 20, 15);
      ctx.fillText('edge', bidStart + 5, 15);
      ctx.fillText('edge', curveEnd - 30, 15);
    }

    btnNeg.addEventListener('click', () => {
      currentGamma = -2.0;
      setActiveButton(btnNeg);
      label.textContent = 'Front-loaded: More liquidity near the spread edge';
      drawGammaDemo(currentGamma);
    });

    btnZero.addEventListener('click', () => {
      currentGamma = 0.0;
      setActiveButton(btnZero);
      label.textContent = 'Uniform: Equal liquidity across the entire range';
      drawGammaDemo(currentGamma);
    });

    btnPos.addEventListener('click', () => {
      currentGamma = 2.0;
      setActiveButton(btnPos);
      label.textContent = 'Back-loaded: More liquidity at the range edges';
      drawGammaDemo(currentGamma);
    });

    drawGammaDemo(currentGamma);
  }

  // Check periodically for the containers
  function checkInit() {
    if (window.location.pathname.includes('curve-playground')) {
      init();
      initGammaDemo();
    }
  }

  setInterval(checkInit, 200);
  checkInit();
})();
