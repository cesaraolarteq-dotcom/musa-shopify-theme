(() => {
  function initCatalogs() {
    document.querySelectorAll('[data-musa-catalog]').forEach(section => {
      if (section.dataset.catalogReady) return;
      section.dataset.catalogReady = 'true';
      const cards = [...section.querySelectorAll('[data-catalog-card]')];
      const filters = section.querySelector('[data-catalog-filters]');
      const status = section.querySelector('[data-catalog-count]');
      if (filters && status) {
      filters.hidden = false;
      filters.addEventListener('click', event => {
        const button = event.target.closest('[data-catalog-filter]');
        if (!button) return;
        const category = button.dataset.catalogFilter;
        filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        cards.forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; });
        status.textContent = `${cards.filter(card => !card.hidden).length} ${status.dataset.label}`;
      });
      }
      cards.forEach(card => {
        const select = card.querySelector('[data-catalog-color]');
        card.querySelector('[data-catalog-color-control]').hidden = false;
        card.querySelector('[data-catalog-matrix]').hidden = true;
        select.addEventListener('change', () => {
          card.querySelector('[data-catalog-sizes]').textContent = select.selectedOptions[0].dataset.sizes;
        });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCatalogs);
  else initCatalogs();
  document.addEventListener('shopify:section:load', initCatalogs);
})();
