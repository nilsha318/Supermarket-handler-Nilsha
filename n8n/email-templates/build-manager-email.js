// n8n Code node "Build Manager Email" (mode: Run Once for All Items)
// Readable copy of the code inside n8n/expiry-check.json. Edit here, then paste into the node.
// Layout: manager-alert.html (designed by Member 4, Nayma). Code: Member 3, Nilsha.
// Input: one item from "Get Products Needing Attention": { total, expired, items[], staff[] }
// Output: one item { subject, html } for the Gmail node.

// Public customer offers page in the published Budibase app (no login needed)
const DASHBOARD_URL = 'https://yuvtuhj0b.budibase.app/app/default%20workspace/supermarket-dashbord#/public-offers';

const r = $input.first().json;
const items = Array.isArray(r.items) ? r.items : JSON.parse(r.items || '[]');
const staff = Array.isArray(r.staff) ? r.staff : JSON.parse(r.staff || '[]');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupee = (n) => '&#8377;' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (iso) => {
  const [, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return d + ' ' + MONTHS[m - 1];
};
const whenText = (days) => {
  if (days < -1) return (-days) + ' days ago';
  if (days === -1) return 'Yesterday';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return 'In ' + days + ' days';
};
const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');

// Same rule as the UPDATE query in "Calculate & Save Discounts"
const GROUPS = [
  { title: 'Expired: remove from shelf today', bar: '#D92D20', text: '#912018', tile: '#FEF3F2', num: '#B42318', tileText: '#7A271A', label: 'Expired', sub: 'Remove from shelf', test: (d) => d < 0 },
  { title: '0&ndash;1 days left: 30% off', bar: '#EF6820', text: '#7E2410', tile: '#FFF4ED', num: '#C4320A', tileText: '#7E2410', label: '0&ndash;1 days left', sub: '30% off applied', test: (d) => d >= 0 && d <= 1 },
  { title: '2&ndash;3 days left: 20% off', bar: '#EAAA08', text: '#713B12', tile: '#FEF7C3', num: '#93370D', tileText: '#713B12', label: '2&ndash;3 days left', sub: '20% off applied', test: (d) => d >= 2 && d <= 3 },
];

const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const today = $now.toFormat('cccc, d LLLL yyyy');
const HEAD = 'padding:6px 0;border-bottom:1px solid #DDE4DF;font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:#5B6B62;font-weight:600;';
const CELL = 'padding:10px 0;border-bottom:1px solid #EEF2EF;';

const lists = GROUPS.map((g) => items.filter((it) => g.test(Number(it.days_left))));
const expiredList = lists[0];
const saleList = lists[1].concat(lists[2]);

const atRisk = saleList.reduce((s, it) => s + Number(it.quantity) * Number(it.price), 0);
const recovered = saleList.reduce((s, it) => s + Number(it.quantity) * Number(it.new_price), 0);
const lost = expiredList.reduce((s, it) => s + Number(it.quantity) * Number(it.price), 0);

function tile(g, count) {
  return '<td width="33%" valign="top" bgcolor="' + g.tile + '" style="background:' + g.tile + ';border-radius:8px;padding:12px 12px 10px;">' +
    '<div style="font-size:26px;line-height:30px;font-weight:700;color:' + g.num + ';">' + count + '</div>' +
    '<div style="font-size:13px;line-height:17px;font-weight:600;color:' + g.tileText + ';">' + g.label + '</div>' +
    '<div style="font-size:12px;line-height:16px;color:' + g.tileText + ';">' + g.sub + '</div></td>';
}

function row(it, expired) {
  const days = Number(it.days_left);
  const whenStyle = expired ? 'color:#B42318;font-weight:600;' : days === 0 ? 'color:#C4320A;font-weight:600;' : '';
  const right = expired
    ? '<span style="color:#B42318;">' + rupee(Number(it.quantity) * Number(it.price)) + '</span><br><span style="font-size:12px;color:#5B6B62;">write-off</span>'
    : '<span style="font-size:12px;color:#7A8A80;text-decoration:line-through;">' + rupee(it.price) + '</span> <strong>' + rupee(it.new_price) + '</strong>';
  return '<tr>' +
    '<td style="' + CELL + '"><strong>' + esc(it.product_name) + '</strong><br><span style="font-size:12px;color:#5B6B62;">' + esc(it.department) + '</span></td>' +
    '<td align="right" style="' + CELL + '">' + Number(it.quantity) + '</td>' +
    '<td style="padding:10px 0 10px 16px;border-bottom:1px solid #EEF2EF;' + whenStyle + '">' + whenText(days) + '<br><span style="font-size:12px;font-weight:400;color:#5B6B62;">' + shortDate(it.expiry_date) + '</span></td>' +
    '<td align="right" style="' + CELL + '">' + right + '</td>' +
    '</tr>';
}

function section(g, list, expired) {
  if (!list.length) return '';
  return '<tr><td style="padding:26px 28px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-left:4px solid ' + g.bar + ';padding:1px 0 1px 10px;font-size:15px;line-height:20px;font-weight:700;color:' + g.text + ';">' + g.title +
    ' <span style="font-weight:400;color:#5B6B62;">&middot; ' + plural(list.length, 'product') + '</span></td></tr></table>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-size:14px;line-height:19px;margin-top:8px;">' +
    '<tr><td style="' + HEAD + '">Product</td><td align="right" style="' + HEAD + '">Qty</td><td style="' + HEAD + 'padding-left:16px;">Expiry</td><td align="right" style="' + HEAD + '">' + (expired ? 'Value' : 'Price') + '</td></tr>' +
    list.map((it) => row(it, expired)).join('') +
    '</table></td></tr>';
}

// "By department": items per department, and the active employees who get Nayma's department alert
const depts = {};
items.forEach((it) => {
  const d = (depts[it.department] = depts[it.department] || { count: 0, expired: 0 });
  d.count++;
  if (Number(it.days_left) < 0) d.expired++;
});
const deptNames = Object.keys(depts).sort((a, b) => depts[b].count - depts[a].count || a.localeCompare(b));
const deptRows = deptNames.map((name, i) => {
  const d = depts[name];
  const people = staff.filter((s) => s.department === name).map((s) => esc(s.name)).join(', ') || '&ndash;';
  const pb = i === deptNames.length - 1 ? '12px' : '5px';
  return '<tr><td style="padding:5px 14px ' + pb + ';">' + esc(name) + '</td>' +
    '<td align="right" style="padding:5px 0 ' + pb + ';">' + d.count + (d.expired ? ' <span style="font-size:12px;color:#B42318;">(' + d.expired + ' expired)</span>' : '') + '</td>' +
    '<td style="padding:5px 14px ' + pb + ' 18px;">' + people + '</td></tr>';
}).join('');

const total = items.length;
const preview = [
  lists[0].length + ' expired',
  lists[1].length + ' at 30% off',
  lists[2].length + ' at 20% off',
  rupee(atRisk) + ' of stock at risk',
].join(' &middot; ');

const moneyLine = saleList.length || expiredList.length
  ? '<div style="font-size:14px;line-height:20px;color:#4A5B51;padding-top:12px;">' +
    (saleList.length ? '<strong style="color:#1C2A22;">' + rupee(atRisk) + '</strong> of stock at risk at full price. If it all sells at the discount price, you recover <strong style="color:#1C2A22;">' + rupee(recovered) + '</strong>. ' : '') +
    (expiredList.length ? 'Expired stock already lost: <strong style="color:#B42318;">' + rupee(lost) + '</strong>.' : '') +
    '</div>'
  : '';

const html =
  '<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">' + preview + '</div>' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F2F4F1" style="background:#F2F4F1;"><tr><td align="center" style="padding:24px 12px;">' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="max-width:900px;background:#FFFFFF;border:1px solid #DDE4DF;border-radius:10px;font-family:' + FONT + ';color:#1C2A22;">' +
  // Header
  '<tr><td bgcolor="#123B2C" style="background:#123B2C;padding:24px 28px 22px;border-radius:10px 10px 0 0;">' +
    '<div style="font-size:12px;line-height:16px;letter-spacing:1.2px;text-transform:uppercase;font-weight:700;color:#9FD3B2;">Expiry Monitor &middot; Manager report</div>' +
    '<div style="font-size:24px;line-height:30px;font-weight:700;color:#FFFFFF;padding-top:8px;">' + plural(total, 'product') + ' need' + (total === 1 ? 's' : '') + ' attention today</div>' +
    '<div style="font-size:14px;line-height:20px;color:#CFE3D6;padding-top:4px;">' + today + ' &middot; checked at ' + $now.toFormat('h:mm a') + '</div>' +
  '</td></tr>' +
  // Summary tiles
  '<tr><td style="padding:20px 28px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    tile(GROUPS[0], lists[0].length) + '<td width="8" style="font-size:0;line-height:0;">&nbsp;</td>' +
    tile(GROUPS[1], lists[1].length) + '<td width="8" style="font-size:0;line-height:0;">&nbsp;</td>' +
    tile(GROUPS[2], lists[2].length) +
    '</tr></table>' + moneyLine +
  '</td></tr>' +
  // Product sections
  section(GROUPS[0], lists[0], true) +
  section(GROUPS[1], lists[1], false) +
  section(GROUPS[2], lists[2], false) +
  // By department
  '<tr><td style="padding:26px 28px 0;">' +
    '<div style="font-size:15px;line-height:20px;font-weight:700;color:#1C2A22;">By department</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F6F8F6" style="background:#F6F8F6;border-radius:8px;border-collapse:separate;font-size:14px;line-height:19px;margin-top:8px;">' +
    '<tr><td style="padding:10px 14px 4px;font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:#5B6B62;font-weight:600;">Department</td>' +
    '<td align="right" style="padding:10px 0 4px;font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:#5B6B62;font-weight:600;">Items</td>' +
    '<td style="padding:10px 14px 4px 18px;font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:#5B6B62;font-weight:600;">Alert sent to</td></tr>' +
    deptRows +
    '</table>' +
  '</td></tr>' +
  // Button
  '<tr><td style="padding:26px 28px 4px;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#1E6B47" style="background:#1E6B47;border-radius:6px;">' +
    '<a href="' + DASHBOARD_URL + '" style="display:inline-block;padding:12px 22px;font-size:15px;line-height:20px;font-weight:600;color:#FFFFFF;text-decoration:none;">See today&rsquo;s offers</a>' +
    '</td></tr></table>' +
  '</td></tr>' +
  // Footer
  '<tr><td style="padding:22px 28px 26px;"><div style="border-top:1px solid #DDE4DF;padding-top:14px;font-size:12px;line-height:18px;color:#6B7A71;">' +
    'Discount rule: 0&ndash;1 days left gets 30% off, 2&ndash;3 days left gets 20% off, expired stock is removed. Discounts are already saved and showing on the customer offers page.<br>' +
    'Sent automatically by Expiry Monitor (n8n) at 8:00 AM. No email is sent on days when nothing expires within 3 days.' +
  '</div></td></tr>' +
  '</table></td></tr></table>';

const expired = lists[0].length;
return [{
  json: {
    subject: 'Expiry Alert: ' + plural(total, 'product') + ' need' + (total === 1 ? 's' : '') + ' attention today' + (expired ? ' (' + expired + ' expired)' : ''),
    html,
  },
}];
