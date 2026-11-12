/** Shared pure functions used by the static generator, browser and tests. */
export function formatMoney(amount, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: currency === 'VND' ? 0 : 2 }).format(amount);
}
export function splitQuote(total, currency, nights, people) {
  const raw = String(total).trim();
  if (!['VND', 'USD'].includes(currency)) throw new Error('Choose VND or USD.');
  if (!(currency === 'VND' ? /^\d+$/ : /^\d+(?:\.\d{1,2})?$/).test(raw)) throw new Error(currency === 'VND' ? 'Enter a positive whole amount in VND, without separators.' : 'Enter USD using a decimal point and up to two decimal places.');
  const whole = raw.split('.')[0];
  if (whole.length > 16) throw new Error('The amount exceeds the supported range.');
  const scale = currency === 'VND' ? 1n : 100n;
  const units = currency === 'VND' ? BigInt(raw) : BigInt(whole) * 100n + BigInt((raw.split('.')[1] || '').padEnd(2, '0'));
  if (units <= 0n || units > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Enter a positive amount within the supported range.');
  const integer = (value, label) => {
    if (!/^\d+$/.test(String(value).trim()) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) throw new Error(`${label} must be a positive whole number.`);
    return BigInt(value);
  };
  const n = integer(nights, 'Nights'), p = integer(people, 'Contributors');
  if (n * p > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('The number of nights and contributors is too large.');
  const average = denominator => ({ amount: Number((units * 2n + denominator) / (denominator * 2n)) / Number(scale), approximate: units % denominator !== 0n });
  return { total: Number(units) / Number(scale), currency, nights: Number(n), people: Number(p), perTrip: average(p), perNight: average(p * n) };
}
export function quoteText(result) {
  const avg = value => `${value.approximate ? '≈ ' : ''}${formatMoney(value.amount, result.currency)}`;
  return `The Hiu — shared stay budget\nTotal entered: ${formatMoney(result.total, result.currency)}\nNights: ${result.nights}\nContributors: ${result.people}\nPer person / trip: ${avg(result.perTrip)}\nPer person / night: ${avg(result.perNight)}\nBased on the total quote entered; inclusions follow your quote.`;
}
export function validCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y,m,d] = value.split('-').map(Number), date = new Date(Date.UTC(y,m-1,d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m-1 && date.getUTCDate() === d;
}
export function validateInquiry(state, maxTotal, today = '') {
  const errors = [];
  if (state.checkin || state.checkout) {
    if (!validCalendarDate(state.checkin) || !validCalendarDate(state.checkout)) errors.push('Enter both check-in and check-out dates, or leave both blank.');
    else if (state.checkout <= state.checkin) errors.push('Check-out must be after check-in.');
    else if (today && state.checkin < today) errors.push('Choose a check-in date from today onward.');
  }
  for (const [key,label,min] of [['adults','Adults',1],['children','Children',0]]) {
    if (state[key] !== '' && state[key] != null && (!/^\d+$/.test(String(state[key])) || !Number.isSafeInteger(Number(state[key])) || Number(state[key]) < min)) errors.push(`${label} must be a whole number ${min === 1 ? 'of at least 1' : 'of 0 or more'}.`);
  }
  if (state.children !== '' && Number(state.children) > 0 && !state.adults) errors.push('Add the number of adults for this group.');
  const total = Number(state.adults || 0) + Number(state.children || 0);
  if (!Number.isSafeInteger(total)) errors.push('The group size exceeds the supported range.');
  return { errors, warning: maxTotal && total > maxTotal ? `This group exceeds the reported maximum of ${maxTotal} guests. Ask the concierge about another arrangement.` : '' };
}
export function inquiryMessage(state, villa, ref) {
  const target = villa ? `${villa.name} (${villa.code})` : 'The Hiu Collection';
  const hasDates = Boolean(state?.checkin);
  const hasGuests = Boolean(state?.adults);

  if (!hasDates && !hasGuests) {
    return `Hello The Hiu Concierge, I'd like to check availability and rates for ${target}.\n[Tracking Ref: ${ref}]`;
  }

  const lines = [`Hello The Hiu Concierge, I'd like to check availability for ${target}:`];
  if (hasDates) {
    lines.push(`• Dates: ${state.checkin}${state.checkout ? ` to ${state.checkout}` : ''}`);
  }
  if (hasGuests) {
    const kids = (state.children !== '' && state.children != null && state.children !== '0') ? `, Children: ${state.children}` : '';
    lines.push(`• Adults: ${state.adults}${kids}`);
  }
  lines.push(`[Tracking Ref: ${ref}]`);
  return lines.join('\n');
}
export function whatsappUrl(contact, message) {
  if (!/^\d{8,15}$/.test(contact.whatsapp || '')) throw new Error('A configured international WhatsApp number is required.');
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
