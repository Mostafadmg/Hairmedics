import { html } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import {
  productCard, sectionHeader, ratingSummary, categoryTile, promiseStrip,
  contactBand, lifestyleImage, stars,
} from '../components/ui.mjs';

const STEPS = [
  { icon: 'search', title: 'Choose a treatment', text: 'Browse minoxidil, finasteride, dutasteride, spironolactone and more — or ask our team for advice.' },
  { icon: 'clipboard', title: 'Complete your assessment', text: 'Prescription items need a 5–10 minute medical questionnaire. You only do it once.' },
  { icon: 'stethoscope', title: 'Prescriber review', text: 'A GMC-registered doctor reviews your answers and may contact you with questions.' },
  { icon: 'truck', title: 'Free tracked delivery', text: 'Your treatment is dispatched by tracked courier, free to anywhere in the UK.' },
];

export function homePage(ctx) {
  const { site, reviews } = ctx;
  const bestsellers = ctx.products.filter(p => p.bestseller && p.purchasable);
  const featured = [...bestsellers, ...ctx.products.filter(p => ctx.site.featured.includes(p.id) && !p.bestseller)].slice(0, 8);
  const treatments = ctx.categories.filter(c => c.group === 'treatments');
  const tools = ctx.categories.filter(c => c.group !== 'treatments');
  const count = slug => ctx.products.filter(p => p.categories.includes(slug)).length;

  const body = html`
  <section class="hero">
    <div class="container hero__inner">
      <div class="hero__content">
        <p class="eyebrow">Home-use hair loss treatment</p>
        <h1 class="hero__title">Thicker, healthier hair — <em>clinically led</em>, delivered to your door.</h1>
        <p class="hero__intro">Treatments for hereditary hair loss in men and women — including high-strength minoxidil, finasteride and dutasteride. Every prescription is reviewed by a GMC-registered doctor.</p>
        <div class="hero__actions">
          <a class="btn btn--primary btn--lg" href="${ctx.url('/shop/')}">Shop treatments ${icon('arrow-right', { size: 18 })}</a>
          <a class="btn btn--ghost btn--lg" href="${ctx.url('/medical-assessment/')}">Start medical assessment</a>
        </div>
        <ul class="hero__ticks" role="list">
          <li>${icon('check', { size: 18 })} Free UK postage on every order</li>
          <li>${icon('check', { size: 18 })} Treatments for men & women</li>
          <li>${icon('check', { size: 18 })} Thousands of satisfied customers</li>
        </ul>
      </div>
      <div class="hero__visual">
        <div class="hero__arch" aria-hidden="true"></div>
        ${lifestyleImage(ctx, 'hero-man', { alt: 'A smiling man with a full head of hair', sizes: '(min-width: 1024px) 40vw, 80vw', eager: true, className: 'hero__image', width: 725, height: 800 })}
        <div class="hero__card hero__card--rating">${ratingSummary(ctx, { compact: true })}</div>
        <div class="hero__card hero__card--award">
          ${icon('award', { size: 22 })}
          <span><strong>Clinic of the Year</strong><small>Prestige Awards 2024/25</small></span>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tight" aria-label="Why Hair Medics UK">
    <div class="container">${promiseStrip(ctx)}</div>
  </section>

  <section class="section" aria-labelledby="find-treatment">
    <div class="container">
      ${sectionHeader({ eyebrow: 'Find your treatment', title: 'Treatments for every stage of hair loss', id: 'find-treatment',
        intro: 'From over-the-counter scalp care to prescription medicines compounded by a UK registered pharmacy.',
        action: html`<a class="link-arrow" href="${ctx.url('/shop/')}">Shop all ${ctx.products.length} products ${icon('arrow-right', { size: 16 })}</a>` })}
      <div class="category-grid">
        <div>
          <h3 class="category-grid__heading">Treatments</h3>
          <div class="category-grid__tiles">${treatments.map(c => categoryTile(ctx, c, count(c.slug)))}</div>
        </div>
        <div>
          <h3 class="category-grid__heading">Tools, scalp care & clinic</h3>
          <div class="category-grid__tiles">${tools.map(c => categoryTile(ctx, c, count(c.slug)))}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--sand" aria-labelledby="bestsellers">
    <div class="container">
      ${sectionHeader({ eyebrow: 'Customer favourites', title: 'Our best-selling treatments', id: 'bestsellers',
        action: html`<a class="link-arrow" href="${ctx.url('/shop/')}">View all ${icon('arrow-right', { size: 16 })}</a>` })}
      <div class="product-grid">${featured.map(p => productCard(ctx, p))}</div>
    </div>
  </section>

  <section class="section" aria-labelledby="how-it-works">
    <div class="container">
      ${sectionHeader({ eyebrow: 'How it works', title: 'From first click to your front door', id: 'how-it-works', align: 'center',
        intro: 'A simple, safe process — with a medical professional involved wherever a prescription is needed.' })}
      <ol class="steps" role="list">
        ${STEPS.map((s, i) => html`
          <li class="step">
            <span class="step__number">${i + 1}</span>
            <span class="step__icon">${icon(s.icon, { size: 26 })}</span>
            <h3 class="step__title">${s.title}</h3>
            <p>${s.text}</p>
          </li>`)}
      </ol>
    </div>
  </section>

  <section class="section section--ink" aria-labelledby="testimonial">
    <div class="container split">
      <div class="split__media">
        ${lifestyleImage(ctx, 'customer', { alt: '', sizes: '(min-width: 1024px) 40vw, 100vw', className: 'rounded-image', width: 1200, height: 915 })}
      </div>
      <div class="split__content">
        <p class="eyebrow eyebrow--light">Don’t just take our word for it</p>
        <h2 class="visually-hidden" id="testimonial">What our customers say</h2>
        <figure class="testimonial">
          ${stars(5, 20)}
          <blockquote><p>“${reviews.featured.quote}”</p></blockquote>
          <figcaption><strong>${reviews.featured.author}</strong> · Verified Google review</figcaption>
        </figure>
        <div class="split__footer">
          ${ratingSummary(ctx)}
          <a class="btn btn--outline-light" href="${ctx.url('/google-reviews/')}">Read more reviews</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="women">
    <div class="container split split--reverse">
      <div class="split__media">
        ${lifestyleImage(ctx, 'woman', { alt: 'A smiling woman with long, curly hair', sizes: '(min-width: 1024px) 45vw, 100vw', className: 'rounded-image', width: 1200, height: 693 })}
      </div>
      <div class="split__content">
        <p class="eyebrow">Hair loss in women</p>
        <h2 class="section-header__title" id="women">Female pattern hair loss is common — and treatable</h2>
        <p>Spironolactone is a prescription medicine primarily used in women with hormone-related hair loss. It may support treatment by reducing the effects of certain hormones on hair follicles — and it can be combined with minoxidil in a single topical tonic.</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="${ctx.url('/product-category/spironolactone/')}">Explore spironolactone</a>
          <a class="btn btn--ghost" href="${ctx.url('/product-category/minoxidil/')}">Minoxidil for women</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--sand" aria-labelledby="minoxidil-guide">
    <div class="container prose-split">
      <div>
        <p class="eyebrow">The science, simply</p>
        <h2 class="section-header__title" id="minoxidil-guide">Advanced minoxidil treatments for home use</h2>
      </div>
      <div class="prose">
        <p>Minoxidil is one of the most established treatments for hereditary hair loss in both men and women.</p>
        <p>It is thought to work by increasing blood flow to the scalp and extending the growth phase of the hair cycle, which can lead to thicker, fuller-looking hair over time.</p>
        <p>Our range includes higher-strength options such as minoxidil 10% and 15%, which our prescriber may consider for more stubborn hair loss. Results vary between people: treatment typically needs 3–6 months of consistent use before you see a benefit, and stopping treatment will reverse any regrowth.</p>
        <p class="small muted">Prescription products are only sold and shipped within the UK.</p>
        <a class="link-arrow" href="${ctx.url('/product-category/minoxidil/')}">Shop minoxidil ${icon('arrow-right', { size: 16 })}</a>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="trust">
    <div class="container">
      ${sectionHeader({ eyebrow: 'Safe, regulated, accountable', title: 'Who’s behind your treatment', id: 'trust', align: 'center' })}
      <ul class="trust-grid" role="list">
        <li class="trust-card">
          ${icon('stethoscope', { size: 28 })}
          <h3>Prescribing doctor</h3>
          <p><strong>${site.regulatory.prescriber.name}</strong><br>GMC No. ${site.regulatory.prescriber.gmc}</p>
        </li>
        <li class="trust-card">
          ${icon('shield', { size: 28 })}
          <h3>Registered pharmacy</h3>
          <p><strong>${site.regulatory.pharmacy.name}</strong><br>Pharmacy No. ${site.regulatory.pharmacy.number}</p>
        </li>
        <li class="trust-card">
          ${icon('flask', { size: 28 })}
          <h3>Specialist manufacturer</h3>
          <p><strong>${site.regulatory.manufacturer.name}</strong><br>${site.regulatory.manufacturer.address}</p>
        </li>
        <li class="trust-card">
          ${icon('award', { size: 28 })}
          <h3>Award-winning clinic</h3>
          <p><strong>Prestige Awards</strong><br>Hair Transplant Clinic of the Year 2024/25</p>
        </li>
      </ul>
    </div>
  </section>

  ${contactBand(ctx)}`;

  return {
    title: site.name,
    description: site.description,
    path: '/',
    body,
    bodyClass: 'page--home',
  };
}
