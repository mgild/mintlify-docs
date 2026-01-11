// PDF Download - All Pages with Dark Theme
(function() {
  'use strict';

  const ALL_PAGES = [
    '/introduction', '/quickstart', '/architecture',
    '/concepts/orderbook', '/concepts/order-types', '/concepts/sharding', '/concepts/matching-engine',
    '/orders/limit-orders', '/orders/clmm-orders', '/orders/prop-amm-orders',
    '/liquidity/cp-amm', '/liquidity/concentrated-liquidity',
    '/sdk/typescript/installation', '/sdk/typescript/market', '/sdk/typescript/orders', '/sdk/typescript/take',
    '/sdk/rust/installation', '/sdk/rust/accounts', '/sdk/rust/orderbook',
    '/api/instructions/market-init', '/api/instructions/place-order', '/api/instructions/cancel-order', '/api/instructions/take',
    '/api/accounts/market', '/api/accounts/orderbook', '/api/accounts/user'
  ];

  function createButton() {
    if (document.getElementById('pdf-download-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'pdf-download-btn';
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span style="margin-left:6px">Download PDF</span>';
    btn.style.cssText = 'display:inline-flex;align-items:center;padding:8px 14px;background:transparent;border:1px solid #30363d;border-radius:6px;color:#8b949e;font-size:13px;font-weight:500;cursor:pointer;position:fixed;top:70px;right:20px;z-index:1000;transition:all 0.15s;';
    btn.onmouseenter = function() { this.style.borderColor='#6366f1'; this.style.color='#a5b4fc'; this.style.background='rgba(99,102,241,0.1)'; };
    btn.onmouseleave = function() { this.style.borderColor='#30363d'; this.style.color='#8b949e'; this.style.background='transparent'; };
    btn.onclick = showModal;
    document.body.appendChild(btn);
  }

  function showModal() {
    // Remove existing modal
    const existing = document.getElementById('pdf-modal');
    if (existing) existing.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'pdf-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;';

    // Create content box
    const box = document.createElement('div');
    box.style.cssText = 'background:#161b22;border:1px solid #30363d;border-radius:12px;padding:24px;max-width:420px;width:90%;color:#e6edf3;';

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Download Documentation as PDF';
    title.style.cssText = 'margin:0 0 12px;font-size:18px;color:#e6edf3;';
    box.appendChild(title);

    // Description
    const desc = document.createElement('p');
    desc.textContent = 'Choose what to include in your PDF. The dark theme will be preserved.';
    desc.style.cssText = 'margin:0 0 20px;color:#8b949e;font-size:14px;';
    box.appendChild(desc);

    // Current page button
    const btn1 = document.createElement('button');
    btn1.innerHTML = '<strong style="display:block;margin-bottom:4px">Current Page Only</strong><span style="font-size:12px;color:#8b949e">Download just this page</span>';
    btn1.style.cssText = 'display:block;width:100%;padding:14px 16px;margin-bottom:10px;background:#21262d;border:1px solid #30363d;border-radius:8px;color:#e6edf3;cursor:pointer;text-align:left;font-size:14px;';
    btn1.onmouseenter = function() { this.style.borderColor='#6366f1'; this.style.background='#262c36'; };
    btn1.onmouseleave = function() { this.style.borderColor='#30363d'; this.style.background='#21262d'; };
    btn1.onclick = function() { modal.remove(); window.print(); };
    box.appendChild(btn1);

    // All pages button
    const btn2 = document.createElement('button');
    btn2.innerHTML = '<strong style="display:block;margin-bottom:4px">All Documentation</strong><span style="font-size:12px;color:#8b949e">Complete docs (' + ALL_PAGES.length + ' pages) - opens in new tab</span>';
    btn2.style.cssText = 'display:block;width:100%;padding:14px 16px;margin-bottom:16px;background:#21262d;border:1px solid #30363d;border-radius:8px;color:#e6edf3;cursor:pointer;text-align:left;font-size:14px;';
    btn2.onmouseenter = function() { this.style.borderColor='#6366f1'; this.style.background='#262c36'; };
    btn2.onmouseleave = function() { this.style.borderColor='#30363d'; this.style.background='#21262d'; };
    btn2.onclick = function() { modal.remove(); generateAllPagesPdf(); };
    box.appendChild(btn2);

    // Cancel button
    const btn3 = document.createElement('button');
    btn3.textContent = 'Cancel';
    btn3.style.cssText = 'display:block;width:100%;padding:10px;background:transparent;border:1px solid #30363d;border-radius:6px;color:#8b949e;cursor:pointer;font-size:14px;';
    btn3.onmouseenter = function() { this.style.borderColor='#6366f1'; };
    btn3.onmouseleave = function() { this.style.borderColor='#30363d'; };
    btn3.onclick = function() { modal.remove(); };
    box.appendChild(btn3);

    modal.appendChild(box);
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  }

  async function generateAllPagesPdf() {
    // Show loading
    const loading = document.createElement('div');
    loading.id = 'pdf-loading';
    loading.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(13,17,23,0.95);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#e6edf3;';
    loading.innerHTML = '<div style="font-size:18px;margin-bottom:16px">Generating PDF...</div><div id="pdf-progress" style="color:#8b949e">Loading pages...</div><div style="width:300px;height:4px;background:#30363d;border-radius:2px;margin-top:16px;overflow:hidden"><div id="pdf-bar" style="width:0%;height:100%;background:#6366f1;transition:width 0.3s"></div></div>';
    document.body.appendChild(loading);

    const progress = document.getElementById('pdf-progress');
    const bar = document.getElementById('pdf-bar');

    // Open print window
    const printWin = window.open('', '_blank');
    printWin.document.write(`<!DOCTYPE html><html><head><title>Braid Protocol - Complete Documentation</title><style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #e6edf3; margin: 0; padding: 40px; line-height: 1.6; }
      .title-page { text-align: center; padding: 150px 40px; page-break-after: always; }
      .title-page h1 { font-size: 48px; color: #e6edf3; margin-bottom: 20px; }
      .title-page .subtitle { font-size: 20px; color: #8b949e; margin-bottom: 40px; }
      .title-page .accent { color: #6366f1; }
      .page { page-break-before: always; padding: 20px 0; }
      h1 { font-size: 28px; color: #e6edf3; border-bottom: 1px solid #30363d; padding-bottom: 10px; }
      h2 { font-size: 22px; color: #e6edf3; margin-top: 30px; }
      h3 { font-size: 18px; color: #e6edf3; }
      p, li { color: #e6edf3; }
      a { color: #58a6ff; text-decoration: none; }
      strong { color: #f0f6fc; }
      pre { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 16px; overflow-x: auto; }
      code { font-family: 'SF Mono', monospace; background: #161b22; color: #e6edf3; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
      pre code { background: none; padding: 0; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; background: #161b22; }
      th, td { border: 1px solid #30363d; padding: 10px 12px; text-align: left; color: #e6edf3; }
      th { background: #21262d; font-weight: 600; }
      ul, ol { padding-left: 24px; }
      blockquote { border-left: 3px solid #58a6ff; background: #161b22; margin: 16px 0; padding: 12px 16px; color: #8b949e; }
      button, nav, aside, [class*="feedback"], [class*="search"] { display: none !important; }
      @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
    </style></head><body>
    <div class="title-page"><h1>Braid Protocol</h1><p class="subtitle">Density orders and unified liquidity on Solana</p><p class="accent">Documentation</p><p style="color:#8b949e;margin-top:60px;font-size:14px">Generated ${new Date().toLocaleDateString()}</p></div>
    `);

    // Fetch each page
    for (let i = 0; i < ALL_PAGES.length; i++) {
      const pagePath = ALL_PAGES[i];
      progress.textContent = 'Loading ' + pagePath + ' (' + (i + 1) + '/' + ALL_PAGES.length + ')';
      bar.style.width = ((i + 1) / ALL_PAGES.length * 100) + '%';

      try {
        const resp = await fetch(pagePath);
        const html = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const article = doc.querySelector('article') || doc.querySelector('main');

        if (article) {
          // Clean content
          article.querySelectorAll('button, nav, aside, [class*="feedback"], [class*="search"], [class*="edit"]').forEach(el => el.remove());
          printWin.document.write('<div class="page">' + article.innerHTML + '</div>');
        }
      } catch (err) {
        console.warn('Failed to load ' + pagePath, err);
      }

      await new Promise(r => setTimeout(r, 50));
    }

    printWin.document.write('</body></html>');
    printWin.document.close();

    loading.innerHTML = '<div style="font-size:18px;margin-bottom:16px">Ready!</div><div style="color:#8b949e;margin-bottom:20px">All ' + ALL_PAGES.length + ' pages loaded in new tab</div><button id="pdf-done" style="padding:12px 24px;background:#6366f1;border:none;border-radius:8px;color:white;font-size:16px;cursor:pointer">Done</button>';
    document.getElementById('pdf-done').onclick = function() { loading.remove(); };

    // Auto-trigger print in the new window
    setTimeout(function() { printWin.print(); }, 500);
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createButton);
  } else {
    createButton();
  }

  // Re-add on navigation
  let lastPath = location.pathname;
  new MutationObserver(function() {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      document.getElementById('pdf-download-btn')?.remove();
      setTimeout(createButton, 500);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
