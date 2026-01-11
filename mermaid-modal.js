// Click-to-expand mermaid diagrams (waits for render)
(function() {
  function init() {
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
