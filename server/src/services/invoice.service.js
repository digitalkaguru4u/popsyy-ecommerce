const env = require('../config/env');

const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SELLER = {
  name: process.env.SELLER_LEGAL_NAME || 'POPSYY Foods',
  address: process.env.SELLER_ADDRESS || 'Mumbai, Maharashtra, India',
  state: process.env.SELLER_STATE || 'Maharashtra',
  gstin: process.env.SELLER_GSTIN || '',
  fssai: process.env.SELLER_FSSAI || '',
  hsn: process.env.PRODUCT_HSN || '2105',
};

// Printable GST tax invoice (open in browser → Print / Save as PDF)
function renderInvoice(order, items) {
  const rate = env.commerce.gstRate;
  const goods = order.subtotal - order.discount;
  const taxable = goods / (1 + rate / 100);
  const tax = goods - taxable;
  const intra = (order.shippingAddress?.state || '').trim().toLowerCase() === SELLER.state.toLowerCase();
  const date = new Date(order.confirmedAt || order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const rows = items.map((i, idx) => `<tr><td>${idx + 1}</td><td><b>${esc(i.name)}</b><br/><small>${esc(i.variantName || '')}${i.kind === 'box' ? ' — ' + i.boxSelections.map((s) => `${s.qty}× ${esc(s.name)}`).join(', ') : ''}</small></td><td>${esc(i.sku || '')}</td><td>${SELLER.hsn}</td><td class="r">${i.qty}</td><td class="r">${inr(i.unitPrice)}</td><td class="r">${inr(i.lineTotal)}</td></tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${esc(order.orderNumber)}</title>
<style>
*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1C0A3D;margin:0;padding:32px;background:#fff}
.wrap{max-width:820px;margin:auto;border:3px solid #1C0A3D;border-radius:18px;overflow:hidden}
.head{background:#2B0A6B;color:#fff;padding:24px 28px;display:flex;justify-content:space-between;align-items:flex-start}
.logo{font-size:34px;font-weight:900;letter-spacing:1px}.muted{opacity:.8;font-size:12px}
.sec{padding:20px 28px;display:flex;gap:24px;justify-content:space-between;border-bottom:1px solid #eee;font-size:13px;line-height:1.5}
table{width:100%;border-collapse:collapse;font-size:13px}th{background:#F4EEFF;text-align:left;padding:10px}td{padding:10px;border-bottom:1px solid #eee;vertical-align:top}
.r{text-align:right}.tot{padding:16px 28px}.tot table td{border:none;padding:4px 10px}.grand td{font-size:17px;font-weight:bold;border-top:2px solid #1C0A3D!important}
.foot{padding:16px 28px;font-size:11px;color:#6B5A8E;background:#FFF6EC}
.btn{position:fixed;top:12px;right:12px;background:#FF2E93;color:#fff;border:0;padding:10px 18px;border-radius:99px;font-weight:bold;cursor:pointer}
@media print{.btn{display:none}body{padding:0}.wrap{border:none}}
</style></head><body>
<button class="btn" onclick="window.print()">Print / Save PDF</button>
<div class="wrap">
<div class="head"><div><div class="logo">POPSYY</div><div class="muted">${esc(SELLER.name)} · ${esc(SELLER.address)}</div>
${SELLER.gstin ? `<div class="muted">GSTIN: ${esc(SELLER.gstin)}</div>` : ''}${SELLER.fssai ? `<div class="muted">FSSAI Lic. No: ${esc(SELLER.fssai)}</div>` : ''}</div>
<div style="text-align:right"><div style="font-size:20px;font-weight:bold">TAX INVOICE</div><div class="muted">Invoice #: INV-${esc(order.orderNumber)}</div><div class="muted">Date: ${date}</div><div class="muted">Order: ${esc(order.orderNumber)}</div></div></div>
<div class="sec"><div><b>Bill / Ship to</b><br/>${esc(order.shippingAddress.name)}<br/>${esc(order.shippingAddress.line1)}${order.shippingAddress.line2 ? ', ' + esc(order.shippingAddress.line2) : ''}<br/>${esc(order.shippingAddress.city)}, ${esc(order.shippingAddress.state)} ${esc(order.shippingAddress.pincode)}<br/>${esc(order.phone)} · ${esc(order.email)}</div>
<div style="text-align:right"><b>Payment</b><br/>${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}<br/>Status: ${esc(order.paymentStatus.replace(/_/g, ' '))}<br/>Place of supply: ${esc(order.shippingAddress.state)}</div></div>
<table><thead><tr><th>#</th><th>Item</th><th>SKU</th><th>HSN</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot"><table style="width:360px;margin-left:auto">
<tr><td>Subtotal</td><td class="r">${inr(order.subtotal)}</td></tr>
${order.discount ? `<tr><td>Discount ${order.couponCode ? '(' + esc(order.couponCode) + ')' : ''}</td><td class="r">−${inr(order.discount)}</td></tr>` : ''}
<tr><td>Taxable value</td><td class="r">${inr(taxable)}</td></tr>
${intra ? `<tr><td>CGST @ ${rate / 2}%</td><td class="r">${inr(tax / 2)}</td></tr><tr><td>SGST @ ${rate / 2}%</td><td class="r">${inr(tax / 2)}</td></tr>` : `<tr><td>IGST @ ${rate}%</td><td class="r">${inr(tax)}</td></tr>`}
<tr><td>Shipping</td><td class="r">${order.shippingFee ? inr(order.shippingFee) : 'FREE'}</td></tr>
${order.codFee ? `<tr><td>COD fee</td><td class="r">${inr(order.codFee)}</td></tr>` : ''}
<tr class="grand"><td>Total</td><td class="r">${inr(order.total)}</td></tr></table></div>
<div class="foot">Prices are inclusive of GST. This is a computer-generated invoice. Keep frozen at –18°C. Questions? ${esc(process.env.SUPPORT_EMAIL || 'hello@popsyy.in')}</div>
</div></body></html>`;
}

module.exports = { renderInvoice };
