// Click-to-expand mermaid diagrams (waits for render)
(function() {
  // Remove mermaid navigation controls
  function hideControls() {
    // Find small button groups (zoom/pan controls) - be very specific
    document.querySelectorAll('div').forEach(div => {
      const buttons = div.querySelectorAll(':scope > button');
      // Must be exactly 5-7 direct child buttons (the control grid pattern)
      if (buttons.length >= 5 && buttons.length <= 7) {
        const allHaveSvg = Array.from(buttons).every(b => b.querySelector('svg'));
        // Check it's small (control panel sized, not main content)
        if (allHaveSvg && div.offsetWidth < 200 && div.offsetHeight < 200) {
          div.style.display = 'none';
        }
      }
    });
  }

  function init() {
    // Hide controls after a delay and periodically
    setTimeout(hideControls, 1000);
    setInterval(hideControls, 2000);

    document.body.addEventListener('click', function(e) {
      const mermaid = e.target.closest('.mermaid');
      if (!mermaid || document.querySelector('.mermaid-modal-overlay')) return;

      const svg = mermaid.querySelector('svg');
      if (!svg || !svg.outerHTML) return;

      try {
        const overlay = document.createElement('div');
        overlay.className = 'mermaid-modal-overlay';
        const content = document.createElement('div');
        content.className = 'mermaid-modal-content';
        content.innerHTML = svg.outerHTML;
        const hint = document.createElement('div');
        hint.className = 'mermaid-modal-hint';
        hint.textContent = 'Click anywhere or press ESC to close';
        overlay.appendChild(content);
        overlay.appendChild(hint);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        overlay.addEventListener('click', closeModal);
      } catch(e) { console.warn('Modal error:', e); }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function closeModal() {
    const overlay = document.querySelector('.mermaid-modal-overlay');
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
