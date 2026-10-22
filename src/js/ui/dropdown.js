/**
 * The "Treatments" mega menu. A button with aria-expanded controls a panel:
 * click/Enter/Space toggles, Esc closes and returns focus, clicking or
 * tabbing away closes.
 */
export function initDropdowns() {
  document.querySelectorAll('[data-dropdown]').forEach(root => {
    const button = root.querySelector('[data-dropdown-toggle]');
    const panel = root.querySelector('[data-dropdown-panel]');

    const setOpen = open => {
      button.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    };

    button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));

    root.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !panel.hidden) { setOpen(false); button.focus(); }
    });

    root.addEventListener('focusout', e => {
      if (!root.contains(e.relatedTarget)) setOpen(false);
    });

    document.addEventListener('click', e => {
      if (!root.contains(e.target)) setOpen(false);
    });
  });
}
