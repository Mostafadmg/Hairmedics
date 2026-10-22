import { html, raw } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { formatDate } from '../lib/format.mjs';
import { breadcrumbs, pageHero, contactBand, lifestyleImage, ratingSummary, stars, promiseStrip } from '../components/ui.mjs';

const crumbs = (ctx, label, href) => breadcrumbs(ctx, [{ label: 'Home', href: '/' }, { label, href }]);

// ---------------------------------------------------------------------------
export function aboutPage(ctx) {
  const highlights = [
    'One of the UK’s most affordable hair transplant clinics',
    'Fully qualified hair transplant surgeons',
    'No-obligation consultations',
    'All staff medically qualified, with life-science degrees',
    'Surgical and non-surgical treatments',
    'Home-use and in-clinic treatments',
  ];
  const body = html`
  ${pageHero({ eyebrow: 'About us', title: 'Hair loss specialists, led by doctors', crumbs: crumbs(ctx, 'About', '/about-hair-medics-uk/'),
    intro: 'Hair Medics UK provides clinically approved treatments to combat hair loss in both men and women — at home, and in clinic.' })}

  <section class="section">
    <div class="container split">
      <div class="split__content prose">
        <h2>Who we are</h2>
        <p>All our staff are medically qualified and highly rated throughout the industry. We offer guarantees and are able to meet the treatment needs of most people experiencing hair loss. Our doctors have, combined, performed thousands of hair transplant procedures for men and women throughout the UK.</p>
        <p>We offer the latest advances in hair transplant technology, including Follicular Unit Excision (FUE) and Direct Hair Implantation (DHI). We aim to be the most affordable hair loss provider — and we spend as much time as possible with every patient to make sure you get the best possible results.</p>
        <h2>Doctors you can trust</h2>
        <p>All of our doctors are GMC registered (UK registered) and speak fluent English, and your aftercare is carried out at all times by our medical team based in the UK. Consultations are carried out by medical doctors.</p>
        <h2>Where to find us</h2>
        <p>Our head office is in London Colney, Hertfordshire — just north of London, close to Junction 22 of the M25 and very easy to get to.</p>
      </div>
      <div class="split__media">
        ${lifestyleImage(ctx, 'man-smiling', { alt: 'A smiling man in a striped T-shirt', sizes: '(min-width: 1024px) 40vw, 100vw', className: 'about-image', width: 725, height: 800 })}
      </div>
    </div>
  </section>

  <section class="section section--sand" aria-labelledby="why-us">
    <div class="container">
      <h2 class="section-header__title" id="why-us">Why patients choose Hair Medics UK</h2>
      <ul class="checklist" role="list">
        ${highlights.map(h => html`<li>${icon('check', { size: 20 })}<span>${h}</span></li>`)}
      </ul>
      <div class="about-award">
        ${icon('award', { size: 32 })}
        <p><strong>Award-winning.</strong> Hair Medics UK was voted Prestige Awards’ Hair Transplant Clinic of the Year 2024/25.</p>
      </div>
    </div>
  </section>

  <section class="section"><div class="container">${promiseStrip(ctx)}</div></section>
  ${contactBand(ctx)}`;

  return { title: 'About Hair Medics UK', description: 'Hair Medics UK provides clinically approved hair loss treatments for men and women. GMC-registered doctors, UK aftercare, home-use and in-clinic treatments.', path: '/about-hair-medics-uk/', body, bodyClass: 'page--about' };
}

// ---------------------------------------------------------------------------
const TREATMENT_TYPES = [
  'Hair loss consultation', 'FUE hair transplant', 'DHI hair transplant', 'FUE beard transplant', 'FUE eyebrow transplant',
  'PRP / PRF therapy', 'Minoxidil advice', 'Home-use products', 'Trichotest', 'Low-level laser treatment', 'Other',
];

export function contactPage(ctx) {
  const { site } = ctx;
  const body = html`
  ${pageHero({ eyebrow: 'Contact', title: 'How can we help?', crumbs: crumbs(ctx, 'Contact', '/contact/'),
    intro: 'Ask a question or request a consultation — our medically qualified team will get back to you as soon as possible.' })}

  <section class="section section--flush-top">
    <div class="container contact">
      <div class="contact__details">
        <a class="contact-card" href="${site.phone.href}">
          ${icon('phone', { size: 24 })}<span><small>Call us</small><strong>${site.phone.display}</strong></span>
        </a>
        <a class="contact-card" href="mailto:${site.email}">
          ${icon('mail', { size: 24 })}<span><small>Email us</small><strong>${site.email}</strong></span>
        </a>
        <a class="contact-card" href="${site.address.mapUrl}" target="_blank" rel="noopener">
          ${icon('pin', { size: 24 })}<span><small>Visit our UK office</small><strong>${site.address.lines.join(', ')}, ${site.address.postcode}</strong></span>
        </a>
        <p class="muted small">All our staff are medically qualified and highly rated throughout the industry. Please get in touch to discuss any of our treatment plans in more detail.</p>
      </div>

      <form class="card form contact__form" data-contact-form data-endpoint="${site.forms.contactEndpoint}" novalidate>
        <h2 class="form__title">Send us a message</h2>
        <p class="form__hint">Fields marked <span aria-hidden="true">*</span><span class="visually-hidden">with an asterisk</span> are required.</p>
        <div class="form__row">
          <div class="field">
            <label class="label" for="c-first">First name <span aria-hidden="true">*</span></label>
            <input class="input" id="c-first" name="firstName" autocomplete="given-name" required>
            <p class="field__error" id="c-first-error" hidden></p>
          </div>
          <div class="field">
            <label class="label" for="c-last">Last name <span aria-hidden="true">*</span></label>
            <input class="input" id="c-last" name="lastName" autocomplete="family-name" required>
            <p class="field__error" id="c-last-error" hidden></p>
          </div>
        </div>
        <div class="form__row">
          <div class="field">
            <label class="label" for="c-email">Email <span aria-hidden="true">*</span></label>
            <input class="input" id="c-email" name="email" type="email" autocomplete="email" required data-validate="email">
            <p class="field__error" id="c-email-error" hidden></p>
          </div>
          <div class="field">
            <label class="label" for="c-phone">Phone <span aria-hidden="true">*</span></label>
            <input class="input" id="c-phone" name="phone" type="tel" autocomplete="tel" required data-validate="ukPhone">
            <p class="field__error" id="c-phone-error" hidden></p>
          </div>
        </div>
        <div class="form__row">
          <div class="field">
            <label class="label" for="c-postcode">Postcode <span aria-hidden="true">*</span></label>
            <input class="input" id="c-postcode" name="postcode" autocomplete="postal-code" required data-validate="ukPostcode">
            <p class="field__error" id="c-postcode-error" hidden></p>
          </div>
          <div class="field">
            <label class="label" for="c-treatment">Treatment type <span aria-hidden="true">*</span></label>
            <select class="select" id="c-treatment" name="treatment" required>
              <option value="">Select a treatment</option>
              ${TREATMENT_TYPES.map(t => html`<option>${t}</option>`)}
            </select>
            <p class="field__error" id="c-treatment-error" hidden></p>
          </div>
        </div>
        <div class="field">
          <label class="label" for="c-message">Your enquiry <span aria-hidden="true">*</span></label>
          <textarea class="textarea" id="c-message" name="message" rows="5" required></textarea>
          <p class="field__error" id="c-message-error" hidden></p>
        </div>
        <label class="check">
          <input type="checkbox" name="mailingList" value="yes">
          <span>Join our mailing list. You can unsubscribe at any time — see our <a href="${ctx.url('/privacy-policy/')}">privacy policy</a>.</span>
        </label>
        <button class="btn btn--primary btn--lg" type="submit">Send message ${icon('arrow-right', { size: 18 })}</button>
        <div class="form__status" data-form-status role="status" hidden></div>
      </form>
    </div>
  </section>`;

  return { title: 'Contact us', description: `Contact Hair Medics UK on ${site.phone.display} or ${site.email}, or send us a message about home-use treatments, consultations or hair transplants.`, path: '/contact/', body, bodyClass: 'page--contact' };
}

// ---------------------------------------------------------------------------
export function reviewsPage(ctx) {
  const { reviews, site } = ctx;
  const body = html`
  ${pageHero({ eyebrow: 'Customer reviews', title: `Rated ${site.rating.value} out of 5 by our patients`, crumbs: crumbs(ctx, 'Reviews', '/google-reviews/'),
    intro: `Based on ${site.rating.count} reviews on Google. Here’s what customers and hair transplant patients say about Hair Medics UK.`,
    children: html`<div class="page-hero__rating">${ratingSummary(ctx)}</div>` })}

  <section class="section section--flush-top">
    <div class="container">
      <figure class="testimonial testimonial--feature">
        ${stars(5, 22)}
        <blockquote><p>“${reviews.featured.quote}”</p></blockquote>
        <figcaption><strong>${reviews.featured.author}</strong> · ${reviews.featured.topic} · Google review</figcaption>
      </figure>
      <ul class="review-grid" role="list">
        ${reviews.items.map(r => html`
          <li class="review-card">
            ${stars(5)}
            <blockquote><p>“${r.quote}”</p></blockquote>
            <p class="review-card__author"><strong>${r.author}</strong><span>${r.topic}</span></p>
          </li>`)}
      </ul>
      <p class="center"><a class="btn btn--ghost" href="${site.address.mapUrl}" target="_blank" rel="noopener">See all reviews on Google ${icon('arrow-right', { size: 18 })}</a></p>
    </div>
  </section>
  ${contactBand(ctx)}`;

  return { title: 'Customer reviews', description: `Hair Medics UK is rated ${site.rating.value}/5 from ${site.rating.count} Google reviews. Read what our customers and hair transplant patients say.`, path: '/google-reviews/', body, bodyClass: 'page--reviews' };
}

// ---------------------------------------------------------------------------
/** Legal pages are Markdown files in src/content/legal — easy to edit. */
export function legalPage(ctx, doc) {
  const { html: contentHtml, toc } = ctx.markdownWithToc(doc.body);
  const body = html`
  ${pageHero({ eyebrow: 'Legal', title: doc.title, crumbs: crumbs(ctx, doc.title, `/${doc.slug}/`),
    intro: doc.updated ? `Last updated ${formatDate(doc.updated)}` : '' })}
  <section class="section section--flush-top">
    <div class="container legal">
      ${toc.length > 2 ? html`
      <nav class="legal__toc" aria-labelledby="toc-title">
        <p class="legal__toc-title" id="toc-title">On this page</p>
        <ol>${toc.map(t => html`<li><a href="#${t.id}">${t.text}</a></li>`)}</ol>
      </nav>` : ''}
      <article class="prose legal__body">${raw(contentHtml)}</article>
    </div>
  </section>`;
  return { title: doc.title, description: `${doc.title} for Hair Medics UK.`, path: `/${doc.slug}/`, body, bodyClass: 'page--legal' };
}

// ---------------------------------------------------------------------------
export function notFoundPage(ctx) {
  const body = html`
  <section class="section not-found">
    <div class="container narrow center">
      <p class="eyebrow">Error 404</p>
      <h1 class="page-hero__title">We can’t find that page</h1>
      <p class="lead">It may have moved when we redesigned our website. Try the shop, or get in touch and we’ll point you in the right direction.</p>
      <div class="btn-row btn-row--center">
        <a class="btn btn--primary" href="${ctx.url('/shop/')}">Browse the shop</a>
        <a class="btn btn--ghost" href="${ctx.url('/contact/')}">Contact us</a>
      </div>
    </div>
  </section>`;
  return { title: 'Page not found', path: '/404.html', body, noindex: true };
}

/** Old URLs keep working: a tiny page that forwards to the new address. */
export function redirectPage(ctx, to) {
  const target = ctx.url(to);
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Moved</title>
<link rel="canonical" href="${ctx.site.url}${to}"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${target}"></head>
<body><p>This page has moved to <a href="${target}">${ctx.site.url}${to}</a>.</p></body></html>
`;
}
