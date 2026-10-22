import { html, raw } from '../lib/html.mjs';
import { icon } from '../lib/icons.mjs';
import { breadcrumbs, pageHero, badge } from '../components/ui.mjs';

/** WCAG relative luminance + contrast ratio — so the guidelines can't lie. */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const rating = r => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA Large' : 'Fail');
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ');

const VOICE = [
  { title: 'Clinical, not cold', do: 'Your prescription is reviewed by a GMC-registered doctor.', dont: 'Our docs will sort you out!' },
  { title: 'Honest about results', do: 'Treatment usually needs 3–6 months before you see a benefit.', dont: 'Cure your hair loss in weeks!' },
  { title: 'Reassuring and human', do: 'Hair loss is common — and there’s a lot we can do about it.', dont: 'Embarrassed by your bald spot?' },
  { title: 'Plain English', do: 'A medicine that lowers DHT, the hormone linked to hair loss.', dont: 'A 5α-reductase inhibitor modulating androgenic pathways.' },
];

const TYPE = [
  { token: '--fs-4xl', label: 'Display', sample: 'Thicker, healthier hair', font: 'display', size: 'clamp(2.25rem, 1.5rem + 3.2vw, 3.75rem)' },
  { token: '--fs-3xl', label: 'Heading 1', sample: 'Medical assessment', font: 'display', size: 'clamp(1.875rem, 1.4rem + 2vw, 2.75rem)' },
  { token: '--fs-2xl', label: 'Heading 2', sample: 'Our best-selling treatments', font: 'display', size: 'clamp(1.5rem, 1.2rem + 1.2vw, 2rem)' },
  { token: '--fs-xl', label: 'Heading 3', sample: 'Free tracked delivery', font: 'body', size: 'clamp(1.25rem, 1.1rem + .6vw, 1.5rem)' },
  { token: '--fs-base', label: 'Body', sample: 'Minoxidil works by increasing blood flow to the scalp and extending the growth phase of the hair cycle.', font: 'body', size: '1rem' },
  { token: '--fs-sm', label: 'Small', sample: 'Prescription products are only sold and shipped within the UK.', font: 'body', size: '.875rem' },
];

export function brandPage(ctx) {
  const { tokens } = ctx;
  const byToken = Object.fromEntries(tokens.colors.map(c => [c.token, c]));
  const groups = [['core', 'Core palette'], ['support', 'Supporting colours'], ['feedback', 'Feedback colours']];
  const logo = name => raw(ctx.readAsset(`brand/${name}.svg`).replace(/<title[^>]*>.*?<\/title>/, '').replace(/ role="img" aria-labelledby="t"/, ' aria-hidden="true"'));

  const body = html`
  ${pageHero({ eyebrow: 'Brand guidelines · v1.0', title: 'The Hair Medics UK brand',
    intro: 'How we look and sound — so every page, label, email and social post feels like it comes from the same trustworthy, clinically-led team.',
    crumbs: breadcrumbs(ctx, [{ label: 'Home', href: '/' }, { label: 'Brand', href: '/brand/' }]) })}

  <div class="container brand">
    <nav class="brand__nav" aria-label="Brand guidelines sections">
      <a href="#essence">Essence</a><a href="#logo">Logo</a><a href="#colour">Colour</a><a href="#type">Typography</a>
      <a href="#voice">Voice</a><a href="#imagery">Imagery</a><a href="#components">Components</a>
    </nav>

    <section class="brand__section" id="essence" aria-labelledby="essence-title">
      <h2 id="essence-title">Brand essence</h2>
      <div class="brand-essence">
        <div class="brand-essence__promise">
          <p class="eyebrow">Our promise</p>
          <p class="brand-essence__line">Clinically-led hair loss treatment, delivered to your door.</p>
        </div>
        <dl class="brand-essence__values">
          <div><dt>${icon('stethoscope', { size: 22 })} Clinical</dt><dd>Doctors and pharmacists behind every prescription. Facts over hype.</dd></div>
          <div><dt>${icon('people', { size: 22 })} Approachable</dt><dd>Warm, plain-spoken and judgement-free. Hair loss is common.</dd></div>
          <div><dt>${icon('shield', { size: 22 })} Accountable</dt><dd>Named prescriber, registered pharmacy, clear policies, real reviews.</dd></div>
          <div><dt>${icon('sparkle', { size: 22 })} Hopeful</dt><dd>Progress over perfection: thicker, healthier hair over months, not days.</dd></div>
        </dl>
      </div>
    </section>

    <section class="brand__section" id="logo" aria-labelledby="logo-title">
      <h2 id="logo-title">Logo</h2>
      <p class="brand__lead">The mark shows three hair strands rising from the scalp, each taller than the last — <em>hair, and growth over time</em>. The wordmark is set in Fraunces SemiBold with “UK” in Manrope, tracked and in copper.</p>
      <div class="logo-grid">
        <figure class="logo-tile logo-tile--light"><div class="logo-tile__art logo-tile__art--clearspace">${logo('logo')}</div><figcaption>Primary — on Bone or white</figcaption></figure>
        <figure class="logo-tile logo-tile--dark"><div class="logo-tile__art">${logo('logo-reversed')}</div><figcaption>Reversed — on Midnight Ink</figcaption></figure>
        <figure class="logo-tile logo-tile--light"><div class="logo-tile__art logo-tile__art--stacked">${logo('logo-stacked')}</div><figcaption>Stacked — packaging, social avatars, print</figcaption></figure>
        <figure class="logo-tile logo-tile--teal"><div class="logo-tile__art logo-tile__art--mark">${logo('logo-mark-reversed')}${logo('logo-mark')}</div><figcaption>Mark — favicon & app icon (min. 16px)</figcaption></figure>
      </div>
      <div class="brand-rules">
        <div class="brand-rule brand-rule--do"><h3>${icon('check', { size: 18 })} Do</h3><ul>
          <li>Keep clear space around the logo equal to the height of the mark’s strands.</li>
          <li>Use the horizontal logo at a minimum of 120px wide on screen, 30mm in print.</li>
          <li>Use the reversed logo on Midnight Ink or photography darker than 60%.</li></ul></div>
        <div class="brand-rule brand-rule--dont"><h3>${icon('close', { size: 18 })} Don’t</h3><ul>
          <li>Stretch, rotate, outline or add shadows to the logo.</li>
          <li>Recolour the mark or wordmark outside the palette.</li>
          <li>Set “Hair Medics” in another font — use the supplied SVG files.</li></ul></div>
      </div>
      <p class="brand__downloads">Download:
        ${['logo', 'logo-reversed', 'logo-stacked', 'logo-mark', 'favicon'].map(n => html`<a class="chip" href="${ctx.asset(`brand/${n}.svg`)}" download>${n}.svg</a>`)}
      </p>
    </section>

    <section class="brand__section" id="colour" aria-labelledby="colour-title">
      <h2 id="colour-title">Colour</h2>
      <p class="brand__lead">Midnight Ink and Follicle Teal carry trust and clinical calm; Bone keeps the experience warm rather than sterile; Copper is our human accent — used sparingly.</p>
      ${groups.map(([group, label]) => html`
        <h3 class="brand__subtitle">${label}</h3>
        <ul class="swatches swatches--${group}" role="list">
          ${tokens.colors.filter(c => c.group === group).map(c => html`
            <li class="swatch">
              <span class="swatch__chip" style="background:${c.value}"></span>
              <span class="swatch__body">
                <strong>${c.name}</strong>
                <code>${c.value}</code> <code>rgb(${rgb(c.value)})</code> <code>--color-${c.token}</code>
                <span class="swatch__role">${c.role}</span>
              </span>
            </li>`)}
        </ul>`)}
      <h3 class="brand__subtitle">Accessible colour pairs</h3>
      <p>Contrast ratios are calculated automatically from the tokens when the site builds. Body text must reach <strong>AA (4.5:1)</strong>.</p>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Sample</th><th scope="col">Text / background</th><th scope="col">Ratio</th><th scope="col">WCAG</th></tr></thead>
          <tbody>
            ${tokens.contrastPairs.map(([fg, bg]) => {
              const r = contrast(byToken[fg].value, byToken[bg].value);
              return html`<tr>
                <td><span class="contrast-sample" style="color:${byToken[fg].value};background:${byToken[bg].value}">Aa</span></td>
                <td>${byToken[fg].name} on ${byToken[bg].name}</td>
                <td>${r.toFixed(2)}:1</td>
                <td>${badge(rating(r), r >= 4.5 ? 'success' : 'warning')}</td></tr>`;
            })}
          </tbody>
        </table>
      </div>
    </section>

    <section class="brand__section" id="type" aria-labelledby="type-title">
      <h2 id="type-title">Typography</h2>
      <div class="type-pair">
        <div class="type-specimen type-specimen--display"><span class="type-specimen__aa">Aa</span><strong>Fraunces</strong><span>Headlines & display. A warm, optical-size serif that feels editorial and trustworthy. Weights 400–600.</span></div>
        <div class="type-specimen type-specimen--body"><span class="type-specimen__aa">Aa</span><strong>Manrope</strong><span>Interface & body text. A clear, modern sans-serif that stays legible at small sizes. Weights 400–800.</span></div>
      </div>
      <p>Both are open-source (SIL Open Font License) and self-hosted — no third-party font requests, which is faster and better for privacy.</p>
      <ul class="type-scale" role="list">
        ${TYPE.map(t => html`<li><span class="type-scale__meta"><strong>${t.label}</strong><code>${t.token}</code></span>
          <span class="type-scale__sample type-scale__sample--${t.font}" style="font-size:${t.size}">${t.sample}</span></li>`)}
      </ul>
    </section>

    <section class="brand__section" id="voice" aria-labelledby="voice-title">
      <h2 id="voice-title">Voice & tone</h2>
      <p class="brand__lead">We talk like a knowledgeable clinician who is also a decent human being. We never overpromise, never shame, and always explain.</p>
      <div class="voice-grid">
        ${VOICE.map(v => html`
          <div class="voice-card">
            <h3>${v.title}</h3>
            <p class="voice-card__do">${icon('check', { size: 16 })} “${v.do}”</p>
            <p class="voice-card__dont">${icon('close', { size: 16 })} “${v.dont}”</p>
          </div>`)}
      </div>
      <h3 class="brand__subtitle">Writing rules</h3>
      <ul class="checklist checklist--compact" role="list">
        <li>${icon('check', { size: 18 })}<span>Sentence case for headings and buttons — never ALL CAPS.</span></li>
        <li>${icon('check', { size: 18 })}<span>Write “minoxidil”, not “Minoxidil”, mid-sentence (it isn’t a brand name). Product names keep their capitals.</span></li>
        <li>${icon('check', { size: 18 })}<span>Avoid “cure”, “guaranteed” and “miracle”. Say what a treatment may do, and how long it takes.</span></li>
        <li>${icon('check', { size: 18 })}<span>Don’t promote prescription-only medicines in ads or social posts — talk about the consultation, not the drug.</span></li>
        <li>${icon('check', { size: 18 })}<span>British English: colour, personalised, centre, programme.</span></li>
      </ul>
    </section>

    <section class="brand__section" id="imagery" aria-labelledby="imagery-title">
      <h2 id="imagery-title">Imagery & iconography</h2>
      <div class="imagery-grid">
        <div><h3>Photography</h3><p>Real, relaxed people with natural smiles in warm, soft light. Prefer light, airy backgrounds (Bone, Linen) over black studio backdrops. Show men <em>and</em> women, of different ages and ethnicities.</p></div>
        <div><h3>Product shots</h3><p>Square, centred, on pure white with soft shadow. The product should fill ~70% of the frame so it reads at thumbnail size.</p></div>
        <div><h3>Icons</h3><p>Lucide line icons, 1.75px stroke, rounded caps. Icons support labels — they never replace them.</p>
          <p class="icon-row">${['stethoscope', 'truck', 'shield', 'capsule', 'drop', 'flask', 'award', 'lock'].map(n => icon(n, { size: 26 }))}</p></div>
      </div>
    </section>

    <section class="brand__section" id="components" aria-labelledby="components-title">
      <h2 id="components-title">Core components</h2>
      <div class="component-demo">
        <div class="btn-row">
          <button class="btn btn--primary" type="button">Primary action</button>
          <button class="btn btn--ghost" type="button">Secondary</button>
          <a class="link-arrow" href="#components">Text link ${icon('arrow-right', { size: 16 })}</a>
        </div>
        <div class="btn-row">${badge('Bestseller', 'ink')}${badge('Sale', 'copper')}${badge('In stock', 'success')}${badge('Unavailable', 'neutral')}</div>
        <div class="notice notice--info notice--compact">${icon('stethoscope', { size: 20, className: 'notice__icon' })}<div><p class="notice__title">Medical assessment required</p><p>Info notices explain what happens next.</p></div></div>
      </div>
      <p class="small muted">All components live in <code>src/scss/components/</code> and <code>src/templates/components/</code>.</p>
    </section>
  </div>`;

  return { title: 'Brand guidelines', description: 'Hair Medics UK brand guidelines: logo, colour, typography, voice and imagery.', path: '/brand/', body, bodyClass: 'page--brand' };
}
