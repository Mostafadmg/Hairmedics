/**
 * Shared form validation + the contact form.
 *
 * Validation timing (a deliberate UX choice, used by GOV.UK):
 *  - don't shout at people while they're still typing;
 *  - validate on submit, then re-check a field as soon as it's corrected.
 */
import { qsa } from '../lib/dom.js';
import { required, rules } from '../lib/validate.js';

export function labelFor(control) {
  const label = control.id && document.querySelector(`label[for="${CSS.escape(control.id)}"]`);
  return (label?.textContent || control.name).replace(/\*|\(optional\)/g, '').trim();
}

export function showError(control, message) {
  const field = control.closest('.field, fieldset');
  const errorEl = field?.querySelector('.field__error');
  control.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = !message;
    if (!control.getAttribute('aria-describedby')?.includes(errorEl.id) && errorEl.id) {
      control.setAttribute('aria-describedby', `${control.getAttribute('aria-describedby') || ''} ${errorEl.id}`.trim());
    }
  }
}

/** Validate one input/select/textarea. Returns the message ('' = valid). */
export function validateControl(control) {
  let message = control.required ? required(control.value, labelFor(control)) : '';
  const rule = control.dataset.validate || (control.name === 'postcode' ? 'ukPostcode' : control.type === 'email' ? 'email' : '');
  if (!message && rules[rule]) message = rules[rule](control.value);
  showError(control, message);
  return message;
}

export function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const controls = qsa('input:not([type=checkbox]), select, textarea', form);
  let submitted = false;

  controls.forEach(control => control.addEventListener('input', () => { if (submitted) validateControl(control); }));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    submitted = true;
    const invalid = controls.filter(c => validateControl(c));
    if (invalid.length) { invalid[0].focus(); return; }

    const data = Object.fromEntries(new FormData(form));
    const endpoint = form.dataset.endpoint;
    status.hidden = false;

    if (!endpoint) {
      status.className = 'form__status notice notice--warning';
      status.textContent = 'Preview mode: your message has not been sent. Please call or email us while our new form is being connected.';
      return;
    }
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(res.statusText);
      form.reset();
      submitted = false;
      status.className = 'form__status notice notice--success';
      status.textContent = 'Thank you — your message has been sent. We’ll be in touch soon.';
    } catch {
      status.className = 'form__status notice notice--error';
      status.textContent = 'Sorry, something went wrong. Please try again or call us.';
    }
  });
}
