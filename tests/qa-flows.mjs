/**
 * End-to-end user journeys, run in a real browser against the built site:
 *   npm run build && npm run serve      (in one terminal)
 *   node tests/qa-flows.mjs
 *
 * Each step asserts what a customer would see. If anything fails the
 * script exits with code 1 and prints which step broke.
 */
import assert from 'node:assert/strict';

import { chromium } from 'playwright';

const ORIGIN = process.env.ORIGIN || 'http://localhost:4173';
const browser = await chromium.launch();
const results = [];

async function flow(name, viewport, fn) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 800, hasTouch: viewport.width < 800 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept()); // window.confirm in "Clear my answers"
  try {
    await fn(page);
    assert.deepEqual(errors, [], 'JavaScript errors on the page');
    results.push(`✔ ${name}`);
  } catch (err) {
    results.push(`✘ ${name}\n    ${err.message.split('\n').slice(0, 4).join('\n    ')}`);
    process.exitCode = 1;
  }
  await context.close();
}

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };
const text = (page, sel) => page.locator(sel).first().innerText();

await flow('Product: choosing a pack size updates the price, add to basket opens the drawer', desktop, async page => {
  await page.goto(`${ORIGIN}/product/10-minoxdil/`);
  assert.equal(await text(page, '[data-product-price]'), '£34.99');
  await page.getByRole('radio', { name: '3 bottles' }).check();
  assert.equal(await text(page, '[data-product-price]'), '£84.99');
  await page.locator('[data-qty-step="1"]').click();
  await page.locator('[data-add-to-cart]').click();
  await page.locator('#cart-drawer[open]').waitFor();
  assert.equal(await text(page, '[data-cart-count]'), '2');
  assert.match(await text(page, '#cart-drawer .cart-line'), /3 bottles/);
  assert.equal(await text(page, '[data-cart-subtotal]'), '£169.98');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#cart-drawer[open]').count(), 0, 'Esc closes the drawer');
  await page.reload();
  assert.equal(await text(page, '[data-cart-count]'), '2', 'basket survives a page reload');
});

await flow('Basket page: change quantity, see assessment notice, remove item', desktop, async page => {
  await page.goto(`${ORIGIN}/product/hair-medics-uk-shampoo/`);
  await page.locator('[data-add-to-cart]').click();
  await page.goto(`${ORIGIN}/product/10-minoxdil/`);
  await page.locator('[data-add-to-cart]').click();
  await page.goto(`${ORIGIN}/basket/`);
  assert.equal(await page.locator('[data-basket-items] .cart-line').count(), 2);
  assert.equal(await page.locator('[data-basket-assessment]').isVisible(), true, 'assessment notice shown for Rx items');
  await page.locator('[data-basket-items] [data-cart-step="1"]').first().click();
  assert.equal(await text(page, '[data-basket-total]'), '£90.97'); // 2 × 27.99 + 34.99
  await page.locator('[data-basket-items] [data-cart-remove]').last().click();
  assert.equal(await page.locator('[data-basket-assessment]').isVisible(), false, 'notice hides when no Rx items remain');
  await page.locator('[data-basket-items] [data-cart-remove]').click();
  assert.match(await text(page, '[data-basket-items]'), /basket is empty/);
});

await flow('Shop: search, category chips, sort and shareable URL', desktop, async page => {
  await page.goto(`${ORIGIN}/shop/`);
  const total = await page.locator('[data-product-card]:visible').count();
  assert.ok(total > 40);
  await page.locator('[data-shop-search]').fill('finasteride');
  await page.waitForTimeout(250);
  const found = await page.locator('[data-product-card]:visible').count();
  assert.ok(found > 0 && found < total, `search narrows results (${found})`);
  await page.locator('[data-shop-search]').fill('');
  await page.locator('[data-shop-chips] [data-category="spironolactone"]').click();
  assert.match(page.url(), /category=spironolactone/);
  assert.equal(await page.locator('[data-product-card]:visible').count(), Number((await text(page, '[data-shop-count]')).split(' ')[0]));
  await page.locator('[data-shop-sort]').selectOption('price-asc');
  const prices = await page.locator('[data-product-card]:visible').evaluateAll(els => els.map(e => Number(e.dataset.price)));
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b), 'sorted by price');
  await page.locator('[data-shop-search]').fill('zzzz');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('[data-shop-empty]').isVisible(), true, 'empty state');
});

await flow('Navigation: mega menu (desktop) opens and closes with Esc', desktop, async page => {
  await page.goto(ORIGIN);
  await page.locator('[data-dropdown-toggle]').click();
  assert.equal(await page.locator('#menu-treatments').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#menu-treatments').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-dropdown-toggle')), true, 'focus returns to the button');
});

await flow('Navigation: mobile menu opens as a dialog and closes', mobile, async page => {
  await page.goto(ORIGIN);
  await page.locator('[data-dialog-open="mobile-nav"]').click();
  await page.locator('#mobile-nav[open]').waitFor();
  await page.locator('#mobile-nav [data-dialog-close]').click();
  assert.equal(await page.locator('#mobile-nav[open]').count(), 0);
});

await flow('Product (mobile): sticky add-to-basket bar appears after scrolling past the button', mobile, async page => {
  await page.goto(`${ORIGIN}/product/10-minoxdil/`);
  assert.equal(await page.locator('[data-sticky-buy]').isVisible(), false, 'hidden at the top');
  await page.locator('#related-title').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('[data-sticky-buy]').isVisible(), true, 'visible after scrolling');
  await page.locator('[data-sticky-add]').click();
  await page.locator('#cart-drawer[open]').waitFor();
});

await flow('Contact form: errors on empty submit, preview message when valid', mobile, async page => {
  await page.goto(`${ORIGIN}/contact/`);
  await page.locator('[data-contact-form] [type=submit]').click();
  assert.equal(await page.locator('#c-first[aria-invalid="true"]').count(), 1);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'c-first', 'focus moves to first error');
  await page.fill('#c-first', 'Sam'); await page.fill('#c-last', 'Patel');
  await page.fill('#c-email', 'sam@example'); await page.fill('#c-phone', '07700 900982');
  await page.fill('#c-postcode', 'AL2 1RE'); await page.selectOption('#c-treatment', 'Minoxidil advice');
  await page.fill('#c-message', 'Hello');
  await page.locator('[data-contact-form] [type=submit]').click();
  assert.match(await text(page, '#c-email-error'), /correct format/);
  await page.fill('#c-email', 'sam@example.com');
  assert.equal(await page.locator('#c-email-error').isVisible(), false, 'error clears as soon as it is fixed');
  await page.locator('[data-contact-form] [type=submit]').click();
  assert.match(await text(page, '[data-form-status]'), /Preview mode/);
});

await flow('Medical assessment: validation, conditional questions, rules, review and submit', mobile, async page => {
  await page.goto(`${ORIGIN}/medical-assessment/`);
  const next = page.locator('[data-step-next]');
  const step = () => text(page, '[data-step-counter]');

  await next.click();
  assert.equal(await step(), 'Step 1 of 6', 'cannot continue without answering');
  assert.equal(await page.locator('[data-question="treatments"] .field__error').isVisible(), true);
  await page.getByLabel('Finasteride (tablets or topical)').check();
  await next.click();
  assert.equal(await step(), 'Step 2 of 6');

  // Conditional questions
  assert.equal(await page.locator('[data-question-wrap="pregnant"]').isVisible(), false);
  await page.locator('[data-question="sex"]').getByText('Female').click();
  assert.equal(await page.locator('[data-question-wrap="pregnant"]').isVisible(), true, 'pregnancy question for women');
  assert.equal(await page.locator('[data-question-wrap="partnerPregnant"]').isVisible(), false);
  const yesNo = async (id, answer) => page.locator(`[data-question="${id}"]`).getByText(answer, { exact: true }).click();
  await yesNo('diagnosis', 'Yes');
  assert.equal(await page.locator('[data-question-wrap="diagnosisType"]').isVisible(), true);
  await page.fill('#a-diagnosisType', 'Androgenetic alopecia');
  for (const id of ['hairElsewhere', 'itchyScalp', 'scalpConditions', 'scalpPain', 'pregnant']) await yesNo(id, 'No');
  await page.locator('[data-question="onset"]').getByText('More than a month ago').click();
  await page.locator('[data-question="onsetType"]').getByText('Gradually').click();

  // Business rule: finasteride is for men only
  await next.click();
  assert.equal(await step(), 'Step 2 of 6');
  assert.match(await text(page, '[data-rule-message]'), /only for men/);
  await page.locator('[data-step-back]').click();
  await page.getByLabel('Finasteride (tablets or topical)').uncheck();
  await page.getByLabel('Spironolactone').check();
  await next.click(); await next.click();
  assert.equal(await step(), 'Step 3 of 6');

  for (const id of ['allergyMinoxidil', 'allergySpironolactone', 'allergies', 'bloodPressure', 'conditions', 'otherConditions']) await yesNo(id, 'No');
  await next.click();
  for (const id of ['medication', 'nsaids']) await yesNo(id, 'No');
  await next.click();
  assert.equal(await step(), 'Step 5 of 6');

  await page.fill('#a-firstName', 'Sam'); await page.fill('#a-lastName', 'Patel');
  await page.fill('#a-email', 'sam@example.com'); await page.fill('#a-phone', '07700 900982');
  await page.fill('#a-dobDay', '27'); await page.fill('#a-dobMonth', '3'); await page.fill('#a-dobYear', '2015');
  await page.fill('#a-address1', '1 High Street'); await page.fill('#a-city', 'London Colney'); await page.fill('#a-postcode', 'AL2 1RE');
  await next.click();
  assert.match(await text(page, '[data-question="dob"] .field__error'), /18 or over/);
  await page.fill('#a-dobYear', '1985');

  // Answers survive a refresh (sessionStorage)
  await page.reload();
  assert.equal(await step(), 'Step 5 of 6', 'progress restored after refresh');
  assert.equal(await page.inputValue('#a-dobYear'), '1985');
  await next.click();
  assert.equal(await step(), 'Step 6 of 6');
  assert.match(await text(page, '[data-review-summary]'), /Spironolactone/);

  await page.locator('[data-step-submit]').click();
  assert.equal(await page.locator('[data-assessment-done]').isVisible(), false, 'consent is required');
  await page.locator('[name="consentStatements"]').check({ force: true });
  await page.locator('[name="consentShare"]').check({ force: true });
  await page.locator('[data-step-submit]').click();
  await page.locator('[data-assessment-done]').waitFor();
  assert.equal(await page.locator('[data-preview-note]').isVisible(), true, 'preview mode is clearly labelled');
  assert.equal(await page.evaluate(() => sessionStorage.getItem('hm-assessment-v1')), null, 'answers cleared after submit');
});

await browser.close();
console.log(results.join('\n'));
