const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

/** 29.99 -> "£29.99" */
export const money = amount => gbp.format(amount);

/** Avoid floating-point surprises like 0.1 + 0.2 = 0.30000000000000004 */
export const roundMoney = amount => Math.round(amount * 100) / 100;

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
