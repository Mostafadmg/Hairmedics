/**
 * Multi-step medical assessment.
 *
 * State:  { step: number, answers: { [name]: string | string[] } }
 * Saved to sessionStorage (NOT localStorage): medical answers are sensitive,
 * so they survive an accidental refresh but disappear when the tab closes.
 *
 * Flow for every user action:
 *   input/change -> read answers from the form -> save -> update conditionals
 *   Continue     -> validate current step -> check rules -> go to next step
 *   Submit       -> validate -> send (or preview) -> clear saved answers
 */
import { qs, qsa, escapeHtml } from '../lib/dom.js';
import { session } from '../lib/storage.js';
import { required, dateOfBirth } from '../lib/validate.js';
import { validateControl, showError } from './forms.js';

const KEY = 'hm-assessment-v1';

export function initAssessment() {
  const form = qs('[data-assessment-form]');
  if (!form) return;

  const steps = qsa('[data-step]', form);
  const stepperItems = qsa('[data-stepper-item]');
  const progress = qs('[data-progress-bar]', form);
  const counter = qs('[data-step-counter]', form);
  const backBtn = qs('[data-step-back]', form);
  const nextBtn = qs('[data-step-next]', form);
  const submitBtn = qs('[data-step-submit]', form);
  const done = qs('[data-assessment-done]');

  const state = session.get(KEY, { step: 0, answers: {} });
  state.step = Math.min(Math.max(0, Number(state.step) || 0), steps.length - 1);
  let attempted = false; // only show live errors after the first "Continue"

  // --- Answers <-> form ---------------------------------------------------
  function readAnswers() {
    const answers = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') {
        if (el.name.startsWith('consent')) answers[el.name] = el.checked ? 'yes' : '';
        else answers[el.name] = [...(answers[el.name] || []), ...(el.checked ? [el.value] : [])];
      } else if (el.type === 'radio') {
        if (el.checked) answers[el.name] = el.value;
        else answers[el.name] ??= '';
      } else {
        answers[el.name] = el.value;
      }
    }
    return answers;
  }

  function fillForm(answers) {
    for (const el of form.elements) {
      if (!el.name || !(el.name in answers)) continue;
      const value = answers[el.name];
      if (el.type === 'checkbox') el.checked = Array.isArray(value) ? value.includes(el.value) : value === 'yes';
      else if (el.type === 'radio') el.checked = value === el.value;
      else el.value = value;
    }
  }

  const save = () => session.set(KEY, state);

  // --- Conditional questions ("showIf") -----------------------------------
  const matches = (conditions, answers) => Object.entries(conditions).every(([name, expected]) => {
    const actual = answers[name];
    const wanted = Array.isArray(expected) ? expected : [expected];
    return Array.isArray(actual) ? actual.some(a => wanted.includes(a)) : wanted.includes(actual);
  });

  function updateConditionals() {
    qsa('[data-show-if]', form).forEach(wrap => {
      const visible = matches(JSON.parse(wrap.dataset.showIf), state.answers);
      wrap.hidden = !visible;
      // Hidden questions are disabled so they're never validated or sent.
      qsa('input, select, textarea', wrap).forEach(el => { el.disabled = !visible; });
    });
  }

  // --- Validation -----------------------------------------------------------
  const isVisible = el => !el.closest('[hidden]');

  function validateStep(index) {
    const step = steps[index];
    const errors = [];

    // Radio/checkbox groups
    qsa('fieldset[data-required]', step).filter(isVisible).forEach(group => {
      const name = group.dataset.question;
      const legend = group.querySelector('legend').textContent.replace('*', '').trim();
      const message = required(state.answers[name], 'Select an answer: this question').replace('Select an answer: this question is required', `Select an answer for “${legend}”`);
      const errorEl = group.querySelector('.field__error');
      group.setAttribute('aria-invalid', message ? 'true' : 'false');
      errorEl.textContent = message;
      errorEl.hidden = !message;
      if (message) errors.push(group.querySelector('input'));
    });

    // Date of birth (three inputs validated together)
    qsa('[data-validate="dob"]', step).filter(isVisible).forEach(group => {
      const message = dateOfBirth({ day: state.answers.dobDay, month: state.answers.dobMonth, year: state.answers.dobYear });
      const errorEl = group.querySelector('.field__error');
      qsa('input', group).forEach(i => i.setAttribute('aria-invalid', message ? 'true' : 'false'));
      errorEl.textContent = message;
      errorEl.hidden = !message;
      if (message) errors.push(group.querySelector('input'));
    });

    // Text inputs, textareas, consent checkboxes
    qsa('input[required]:not([type=radio]):not([name^=dob]), textarea[required]', step).filter(isVisible).forEach(control => {
      if (control.type === 'checkbox') {
        const message = control.checked ? '' : 'You must agree to continue';
        showError(control, message);
        if (message) errors.push(control);
      } else if (validateControl(control)) {
        errors.push(control);
      }
    });

    // Business rules from assessment.json (e.g. finasteride is for men only)
    const ruleBox = qs('[data-rule-message]', step);
    if (ruleBox) {
      const broken = JSON.parse(step.dataset.rules || '[]').find(rule => matches(rule.when, state.answers));
      ruleBox.hidden = !broken;
      ruleBox.textContent = broken ? broken.message : '';
      if (broken && !errors.length) errors.push(ruleBox);
    }

    return errors;
  }

  // --- Review summary -------------------------------------------------------
  function formatAnswer(wrap) {
    const names = [...new Set(qsa('[name]', wrap).map(el => el.name))];
    if (wrap.dataset.questionWrap === 'dob') return `${state.answers.dobDay}/${state.answers.dobMonth}/${state.answers.dobYear}`;
    return names.map(n => state.answers[n]).flat().filter(Boolean).join(wrap.dataset.questionWrap === 'address' || wrap.dataset.questionWrap === 'name' ? ', ' : '; ') || '—';
  }

  function renderReview() {
    const summary = qs('[data-review-summary]', form);
    if (!summary) return;
    summary.innerHTML = steps.slice(0, -1).map((step, i) => {
      const rows = qsa('[data-question-wrap]', step).filter(w => !w.hidden).map(wrap => {
        const label = (qs('legend', wrap) || qs('label', wrap)).textContent.replace(/\*/g, '').trim();
        const nice = wrap.dataset.questionWrap === 'name' ? 'Name' : label;
        return `<div><dt>${escapeHtml(nice)}</dt><dd>${escapeHtml(formatAnswer(wrap))}</dd></div>`;
      }).join('');
      const title = qs('.assessment__title', step).textContent;
      return `<section><h3>${escapeHtml(title)} <button type="button" data-goto="${i}">Change<span class="visually-hidden"> ${escapeHtml(title)}</span></button></h3><dl>${rows}</dl></section>`;
    }).join('');
  }

  // --- Rendering the current step ------------------------------------------
  function render({ focus = false } = {}) {
    const last = steps.length - 1;
    steps.forEach((s, i) => { s.hidden = i !== state.step; });
    stepperItems.forEach((item, i) => {
      item.classList.toggle('is-current', i === state.step);
      item.classList.toggle('is-done', i < state.step);
      if (i === state.step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
    });
    progress.style.width = `${(state.step / last) * 100}%`;
    counter.textContent = `Step ${state.step + 1} of ${steps.length}`;
    backBtn.hidden = state.step === 0;
    nextBtn.hidden = state.step === last;
    submitBtn.hidden = state.step !== last;
    if (state.step === last) renderReview();
    if (focus) {
      qs('.assessment__title', steps[state.step]).focus();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function goTo(index) {
    state.step = index;
    attempted = false;
    save();
    render({ focus: true });
  }

  // --- Events ------------------------------------------------------------------
  form.addEventListener('input', () => {
    state.answers = readAnswers();
    save();
    updateConditionals();
    if (attempted) validateStep(state.step);
  });
  form.addEventListener('change', () => form.dispatchEvent(new Event('input')));

  nextBtn.addEventListener('click', () => {
    attempted = true;
    const errors = validateStep(state.step);
    if (errors.length) { errors[0].focus(); return; }
    goTo(state.step + 1);
  });

  backBtn.addEventListener('click', () => goTo(state.step - 1));

  form.addEventListener('click', e => {
    const target = e.target.closest('[data-goto]');
    if (target) goTo(Number(target.dataset.goto));
  });

  qs('[data-assessment-clear]', form).addEventListener('click', () => {
    if (!window.confirm('Clear all your answers and start again?')) return;
    form.reset();
    state.answers = readAnswers();
    session.remove(KEY);
    updateConditionals();
    goTo(0);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    attempted = true;
    // Re-validate every step: answers may have changed via "Change" links.
    for (let i = 0; i < steps.length; i++) {
      if (validateStep(i).length) { goTo(i); validateStep(i); return; }
    }

    const endpoint = form.dataset.endpoint;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ answers: state.answers, submittedAt: new Date().toISOString() }),
        });
        if (!res.ok) throw new Error(res.statusText);
      }
      session.remove(KEY);
      form.hidden = true;
      qs('[data-preview-note]', done).hidden = Boolean(endpoint);
      done.hidden = false;
      done.focus();
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit assessment';
      window.alert('Sorry, we couldn’t submit your assessment. Please try again, or call us.');
    }
  });

  // --- Start ----------------------------------------------------------------
  fillForm(state.answers);
  state.answers = readAnswers();
  updateConditionals();
  render();
}
