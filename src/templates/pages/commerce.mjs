import { html, cx } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { breadcrumbs, pageHero } from '../components/ui.mjs';

// ---------------------------------------------------------------------------
// Medical assessment — rendered from src/data/assessment.json
// ---------------------------------------------------------------------------
const req = q => (q.required ? html`<span class="req" aria-hidden="true">*</span>` : '');
const hintId = q => `${q.id}-hint`;
const errId = q => `${q.id}-error`;
const describedBy = q => [q.hint && hintId(q), errId(q)].filter(Boolean).join(' ');
const hint = q => (q.hint ? html`<p class="field__hint" id="${hintId(q)}">${q.hint}</p>` : '');
const error = q => html`<p class="field__error" id="${errId(q)}" hidden></p>`;

function choiceGroup(q, type, options, variant) {
  return html`
  <fieldset class="field field--group" aria-describedby="${describedBy(q)}" ${q.required ? html`data-required` : ''} data-question="${q.id}">
    <legend class="label">${q.label} ${req(q)}</legend>
    ${hint(q)}
    <div class="${cx('choices', `choices--${variant}`)}">
      ${options.map((opt, i) => html`
        <label class="choice">
          <input type="${type}" name="${q.id}" value="${opt}" id="${q.id}-${i}">
          <span class="choice__box">${type === 'checkbox' ? icon('check', { size: 14 }) : ''}</span>
          <span class="choice__label">${opt}</span>
        </label>`)}
    </div>
    ${error(q)}
  </fieldset>`;
}

function input(q, { name = q.id, label = q.label, type = 'text', autocomplete, width, inputmode, required = q.required, id = name } = {}) {
  return html`
  <div class="${cx('field', width && `field--${width}`)}">
    <label class="label" for="a-${id}">${label} ${required ? html`<span class="req" aria-hidden="true">*</span>` : html`<span class="optional">(optional)</span>`}</label>
    <input class="input" id="a-${id}" name="${name}" type="${type}" ${autocomplete ? html`autocomplete="${autocomplete}"` : ''} ${inputmode ? html`inputmode="${inputmode}"` : ''} ${required ? 'required' : ''} aria-describedby="${id}-error">
    <p class="field__error" id="${id}-error" hidden></p>
  </div>`;
}

function question(q) {
  const wrap = content => html`<div class="question" data-question-wrap="${q.id}" ${q.showIf ? html`data-show-if='${JSON.stringify(q.showIf)}' hidden` : ''}>${content}</div>`;
  switch (q.type) {
    case 'yesno': return wrap(choiceGroup(q, 'radio', ['Yes', 'No'], 'inline'));
    case 'radio': return wrap(choiceGroup(q, 'radio', q.options, q.options.length > 3 ? 'stack' : 'inline'));
    case 'checkbox': return wrap(choiceGroup(q, 'checkbox', q.options, 'stack'));
    case 'text': case 'email': case 'tel':
      return wrap(html`<div class="field" data-question="${q.id}">
        <label class="label" for="a-${q.id}">${q.label} ${req(q)}</label>${hint(q)}
        <input class="input" id="a-${q.id}" name="${q.id}" type="${q.type}" ${q.autocomplete ? html`autocomplete="${q.autocomplete}"` : ''} ${q.required ? 'required' : ''}
          ${q.type === 'email' ? html`data-validate="email"` : ''} ${q.type === 'tel' ? html`data-validate="ukPhone"` : ''} aria-describedby="${describedBy(q)}">
        ${error(q)}</div>`);
    case 'textarea':
      return wrap(html`<div class="field" data-question="${q.id}">
        <label class="label" for="a-${q.id}">${q.label} ${req(q)}</label>${hint(q)}
        <textarea class="textarea" id="a-${q.id}" name="${q.id}" rows="3" ${q.required ? 'required' : ''} aria-describedby="${describedBy(q)}"></textarea>
        ${error(q)}</div>`);
    case 'name':
      return wrap(html`<div class="form__row" data-question="${q.id}">
        ${input(q, { name: 'firstName', label: 'First name', autocomplete: 'given-name' })}
        ${input(q, { name: 'lastName', label: 'Last name', autocomplete: 'family-name' })}</div>`);
    case 'dob':
      return wrap(html`<fieldset class="field field--group" data-question="${q.id}" data-validate="dob" aria-describedby="${describedBy(q)}">
        <legend class="label">${q.label} ${req(q)}</legend>${hint(q)}
        <div class="dob">
          <div class="field field--xs"><label class="label label--sm" for="a-dobDay">Day</label><input class="input" id="a-dobDay" name="dobDay" inputmode="numeric" maxlength="2" autocomplete="bday-day" required></div>
          <div class="field field--xs"><label class="label label--sm" for="a-dobMonth">Month</label><input class="input" id="a-dobMonth" name="dobMonth" inputmode="numeric" maxlength="2" autocomplete="bday-month" required></div>
          <div class="field field--sm"><label class="label label--sm" for="a-dobYear">Year</label><input class="input" id="a-dobYear" name="dobYear" inputmode="numeric" maxlength="4" autocomplete="bday-year" required></div>
        </div>
        ${error(q)}</fieldset>`);
    case 'address':
      return wrap(html`<fieldset class="field field--group address" data-question="${q.id}">
        <legend class="label">${q.label} ${req(q)}</legend>
        ${input(q, { name: 'address1', label: 'Address line 1', autocomplete: 'address-line1' })}
        ${input(q, { name: 'address2', label: 'Address line 2', autocomplete: 'address-line2', required: false })}
        <div class="form__row">
          ${input(q, { name: 'city', label: 'Town or city', autocomplete: 'address-level2' })}
          ${input(q, { name: 'county', label: 'County', autocomplete: 'address-level1', required: false })}
        </div>
        ${input(q, { name: 'postcode', label: 'Postcode', autocomplete: 'postal-code', width: 'sm' })}
      </fieldset>`);
    case 'consent':
      return wrap(html`<div class="field" data-question="${q.id}">
        <label class="check check--consent"><input type="checkbox" name="${q.id}" value="yes" required aria-describedby="${errId(q)}"><span>${q.label} <span class="req" aria-hidden="true">*</span></span></label>
        ${error(q)}</div>`);
    default: return '';
  }
}

export function assessmentPage(ctx) {
  const { assessment, site } = ctx;
  const steps = assessment.steps;
  const body = html`
  ${pageHero({
    eyebrow: '5–10 minutes · reviewed by a GMC-registered doctor',
    title: 'Medical assessment',
    intro: assessment.intro,
    crumbs: breadcrumbs(ctx, [{ label: 'Home', href: '/' }, { label: 'Medical assessment', href: '/medical-assessment/' }]),
  })}

  <section class="section section--flush-top">
    <div class="container assessment">
      <aside class="assessment__aside">
        <ol class="stepper" data-stepper aria-label="Assessment progress">
          ${steps.map((s, i) => html`<li class="stepper__item" data-stepper-item="${i}"><span class="stepper__dot">${i + 1}</span><span class="stepper__label">${s.title}</span></li>`)}
        </ol>
        <div class="assessment__facts">
          <p>${icon('stethoscope', { size: 18 })} <span>Prescriber: <strong>${site.regulatory.prescriber.name}</strong>, GMC ${site.regulatory.prescriber.gmc}</span></p>
          <p>${icon('shield', { size: 18 })} <span>Registered pharmacy: <strong>${site.regulatory.pharmacy.name}</strong></span></p>
          <p>${icon('flask', { size: 18 })} <span>Specialist manufacturer: <strong>${site.regulatory.manufacturer.name}</strong></span></p>
          <p>${icon('lock', { size: 18 })} <span>Your answers are kept in this browser tab only until you submit, and are cleared when you close it.</span></p>
        </div>
      </aside>

      <form class="card form assessment__form" data-assessment-form data-endpoint="${site.forms.assessmentEndpoint}" novalidate>
        <div class="progress" aria-hidden="true"><span class="progress__bar" data-progress-bar></span></div>
        <p class="assessment__counter" data-step-counter aria-live="polite">Step 1 of ${steps.length}</p>

        ${steps.map((step, i) => html`
          <section class="assessment__step" data-step="${i}" data-step-id="${step.id}" ${step.rules ? html`data-rules='${JSON.stringify(step.rules)}'` : ''} aria-labelledby="step-title-${i}" ${i > 0 ? 'hidden' : ''}>
            <h2 class="assessment__title" id="step-title-${i}" tabindex="-1">${step.title}</h2>
            ${step.description ? html`<p class="assessment__description">${step.description}</p>` : ''}
            ${step.review ? html`<div class="review-summary" data-review-summary></div>` : ''}
            ${step.statements ? html`<ol class="statements">${step.statements.map(s => html`<li>${s}</li>`)}</ol>` : ''}
            <div class="assessment__questions">${step.questions.map(question)}</div>
            ${step.rules ? html`<div class="notice notice--error" data-rule-message hidden role="alert"></div>` : ''}
          </section>`)}

        <div class="assessment__nav">
          <button class="btn btn--ghost" type="button" data-step-back hidden>${icon('chevron-left', { size: 18 })} Back</button>
          <button class="btn btn--primary btn--lg" type="button" data-step-next>Continue ${icon('arrow-right', { size: 18 })}</button>
          <button class="btn btn--primary btn--lg" type="submit" data-step-submit hidden>Submit assessment</button>
        </div>
        <button class="link-button assessment__clear" type="button" data-assessment-clear>Clear my answers</button>
      </form>

      <div class="card assessment__done" data-assessment-done hidden tabindex="-1">
        ${icon('success', { size: 40 })}
        <h2>Thank you — your assessment has been received</h2>
        <p>Our prescriber will review your answers and may contact you if they have any questions. You can now complete your order.</p>
        <p class="notice notice--warning" data-preview-note hidden>${icon('info', { size: 20, className: 'notice__icon' })}<span><strong>Preview mode:</strong> no data has been sent. Connect <code>forms.assessmentEndpoint</code> in <code>src/data/site.json</code> to a secure, UK-GDPR compliant handler before launch.</span></p>
        <div class="btn-row">
          <a class="btn btn--primary" href="${ctx.url('/basket/')}">Go to basket</a>
          <a class="btn btn--ghost" href="${ctx.url('/shop/')}">Continue shopping</a>
        </div>
      </div>
    </div>
  </section>`;

  return {
    title: 'Medical assessment',
    description: 'Complete the Hair Medics UK medical assessment for prescription and high-strength hair loss treatments. Takes 5–10 minutes and is reviewed by a GMC-registered doctor.',
    path: '/medical-assessment/',
    body,
    bodyClass: 'page--assessment',
  };
}

// ---------------------------------------------------------------------------
// Basket & checkout — rendered in the browser from the basket store
// ---------------------------------------------------------------------------
export function basketPage(ctx) {
  const body = html`
  ${pageHero({ title: 'Your basket', crumbs: breadcrumbs(ctx, [{ label: 'Home', href: '/' }, { label: 'Basket', href: '/basket/' }]) })}
  <section class="section section--flush-top">
    <div class="container basket" data-basket-page>
      <div class="basket__items" data-basket-items>
        <noscript><p>Please enable JavaScript to use the basket.</p></noscript>
      </div>
      <aside class="card basket__summary" data-basket-summary hidden>
        <h2 class="basket__summary-title">Order summary</h2>
        <dl class="totals">
          <div><dt>Subtotal</dt><dd data-basket-subtotal>£0.00</dd></div>
          <div><dt>UK delivery</dt><dd>Free</dd></div>
          <div class="totals__total"><dt>Total</dt><dd data-basket-total>£0.00</dd></div>
        </dl>
        <div data-basket-assessment hidden>
          <div class="notice notice--info notice--compact">
            ${icon('stethoscope', { size: 20, className: 'notice__icon' })}
            <div><p class="notice__title">Assessment needed</p><p>Some items need a medical assessment before dispatch.</p>
            <a class="link-arrow" href="${ctx.url('/medical-assessment/')}">Complete assessment ${icon('arrow-right', { size: 16 })}</a></div>
          </div>
        </div>
        <a class="btn btn--primary btn--lg btn--block" href="${ctx.url('/checkout/')}">Continue to checkout ${icon('lock', { size: 18 })}</a>
        <a class="btn btn--ghost btn--block" href="${ctx.url('/shop/')}">Continue shopping</a>
      </aside>
    </div>
  </section>`;
  return { title: 'Basket', path: '/basket/', body, noindex: true, bodyClass: 'page--basket' };
}

export function checkoutPage(ctx) {
  const body = html`
  ${pageHero({ title: 'Checkout', crumbs: breadcrumbs(ctx, [{ label: 'Home', href: '/' }, { label: 'Basket', href: '/basket/' }, { label: 'Checkout', href: '/checkout/' }]) })}
  <section class="section section--flush-top">
    <div class="container basket">
      <div class="card checkout-handoff">
        ${icon('lock', { size: 32 })}
        <h2>Secure checkout</h2>
        <p>This new storefront is ready to connect to a payment provider. Until it is connected, please complete your order with our team — we’ll take payment securely by phone.</p>
        <div class="btn-row">
          <a class="btn btn--primary btn--lg" href="${ctx.site.phone.href}">${icon('phone', { size: 18 })} Call ${ctx.site.phone.display}</a>
          <a class="btn btn--ghost btn--lg" href="mailto:${ctx.site.email}?subject=Order%20enquiry">${icon('mail', { size: 18 })} Email your order</a>
        </div>
        <p class="small muted">Developer note: see <code>README.md → Going live</code> for the WooCommerce / Stripe integration options.</p>
      </div>
      <aside class="card basket__summary" data-checkout-summary>
        <h2 class="basket__summary-title">Your order</h2>
        <div data-checkout-lines></div>
        <dl class="totals">
          <div><dt>Delivery</dt><dd>Free</dd></div>
          <div class="totals__total"><dt>Total</dt><dd data-basket-total>£0.00</dd></div>
        </dl>
      </aside>
    </div>
  </section>`;
  return { title: 'Checkout', path: '/checkout/', body, noindex: true, bodyClass: 'page--checkout' };
}
