import { on } from '../lib/dom.js';

/**
 * <button data-dialog-open="cart-drawer"> opens <dialog id="cart-drawer">.
 * Native <dialog> + showModal() gives us focus trapping, Esc to close and an
 * inert page behind it — accessibility we'd otherwise have to hand-build.
 */
export function openDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog && !dialog.open) dialog.showModal();
}

export function initDialogs() {
  on(document, 'click', '[data-dialog-open]', (e, button) => {
    e.preventDefault();
    openDialog(button.dataset.dialogOpen);
  });

  on(document, 'click', '[data-dialog-close]', (e, button) => button.closest('dialog')?.close());

  document.querySelectorAll('dialog').forEach(dialog => {
    // Click on the dimmed backdrop (outside the panel) closes the dialog.
    dialog.addEventListener('click', e => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dialog.close();
    });
  });

  // Close the menu when the window grows past the mobile breakpoint.
  const desktop = window.matchMedia('(min-width: 1024px)');
  desktop.addEventListener('change', () => { if (desktop.matches) document.getElementById('mobile-nav')?.close(); });
}
