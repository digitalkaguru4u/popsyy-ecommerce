const nodemailer = require('nodemailer');
const env = require('../config/env');

const smtpConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.password);
let transporter;
function getTransporter() {
  if (transporter) return transporter;
  transporter = smtpConfigured
    ? nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: { user: env.smtp.user, pass: env.smtp.password },
      })
    : nodemailer.createTransport({ jsonTransport: true }); // dev: nothing is sent, the message is logged
  return transporter;
}

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout(title, bodyHtml, cta) {
  return `<!doctype html><html><body style="margin:0;background:#FFF6EC;font-family:Arial,Helvetica,sans-serif;color:#1C0A3D">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:24px;overflow:hidden;border:3px solid #1C0A3D">
    <tr><td style="background:linear-gradient(90deg,#7B2FF7,#FF2E93,#FF8A00);background-color:#7B2FF7;padding:28px 32px">
      <div style="font-size:30px;font-weight:900;color:#fff;letter-spacing:1px">POPSYY</div>
      <div style="font-size:13px;color:#fff;opacity:.9">Big flavour. Zero boring.</div>
    </td></tr>
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 16px;font-size:26px;line-height:1.15;color:#2B0A6B;text-transform:uppercase">${esc(title)}</h1>
      ${bodyHtml}
      ${cta ? `<p style="margin:28px 0 0"><a href="${esc(cta.href)}" style="background:#2B0A6B;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:bold;display:inline-block">${esc(cta.text)}</a></p>` : ''}
    </td></tr>
    <tr><td style="background:#1C0A3D;color:#C9B8FF;padding:18px 32px;font-size:12px">You're receiving this because you ordered from POPSYY. Chill. Pop. Repeat.</td></tr>
  </table></td></tr></table></body></html>`;
}

function itemsTable(items = []) {
  const rows = items
    .map((i) => {
      const extra = i.kind === 'box' && i.boxSelections?.length
        ? `<div style="font-size:12px;color:#6B5A8E">${i.boxSelections.map((s) => `${s.qty}× ${esc(s.name)}`).join(', ')}</div>` : '';
      return `<tr><td style="padding:8px 0;border-bottom:1px solid #eee"><b>${esc(i.name)}</b>${i.variantName ? ` — ${esc(i.variantName)}` : ''}${extra}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">×${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${inr(i.lineTotal)}</td></tr>`;
    })
    .join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:12px 0">${rows}</table>`;
}

function totalsBlock(o) {
  const line = (l, v, b) => `<tr><td style="padding:3px 0;${b ? 'font-weight:bold;font-size:16px' : ''}">${l}</td><td style="text-align:right;${b ? 'font-weight:bold;font-size:16px' : ''}">${v}</td></tr>`;
  return `<table width="100%" style="font-size:14px">${line('Subtotal', inr(o.subtotal))}${o.discount ? line(`Discount ${o.couponCode ? `(${esc(o.couponCode)})` : ''}`, `−${inr(o.discount)}`) : ''}${line('Shipping', o.shippingFee ? inr(o.shippingFee) : 'FREE')}${o.codFee ? line('COD fee', inr(o.codFee)) : ''}${line('Total', inr(o.total), true)}${line(`<span style="font-size:12px;color:#6B5A8E">Incl. GST</span>`, `<span style="font-size:12px;color:#6B5A8E">${inr(o.taxIncluded)}</span>`)}</table>`;
}

const orderLink = (o) => `${env.clientUrl}/account/orders/${o._id}`;

const templates = {
  orderConfirmation: (o, items) => ({
    subject: `Order ${o.orderNumber} confirmed — your pops are on the way 🍧`,
    html: layout('Your pops are locked in.', `<p>Hey ${esc(o.customerName)}, we've got your order <b>${esc(o.orderNumber)}</b>. ${o.paymentMethod === 'cod' ? `Keep ${inr(o.total)} ready — it's Cash on Delivery.` : ''}</p>${itemsTable(items)}${totalsBlock(o)}
      <p style="font-size:13px;color:#6B5A8E">Shipping to: ${esc(o.shippingAddress.name)}, ${esc(o.shippingAddress.line1)}, ${esc(o.shippingAddress.city)} ${esc(o.shippingAddress.pincode)}</p>`, { text: 'TRACK ORDER', href: orderLink(o) }),
  }),
  paymentConfirmation: (o, payment) => ({
    subject: `Payment received for ${o.orderNumber}`,
    html: layout('Payment received. ✓', `<p>We received <b>${inr(o.total)}</b> for order <b>${esc(o.orderNumber)}</b>.</p><p style="font-size:13px;color:#6B5A8E">Payment ID: ${esc(payment?.providerPaymentId || '-')}</p>`, { text: 'VIEW ORDER', href: orderLink(o) }),
  }),
  shipped: (o) => ({
    subject: `${o.orderNumber} has shipped 🚚`,
    html: layout('Your pops are moving.', `<p>Order <b>${esc(o.orderNumber)}</b> just left our freezer in a cold-chain box.</p>${o.tracking?.awb ? `<p>Carrier: <b>${esc(o.tracking.carrier || '')}</b><br/>AWB: <b>${esc(o.tracking.awb)}</b></p>` : ''}`, { text: 'TRACK ORDER', href: o.tracking?.url || orderLink(o) }),
  }),
  outForDelivery: (o) => ({
    subject: `${o.orderNumber} is out for delivery`,
    html: layout('Clear some freezer space.', `<p>Order <b>${esc(o.orderNumber)}</b> is out for delivery today.${o.paymentMethod === 'cod' ? ` Keep ${inr(o.total)} ready.` : ''}</p>`, { text: 'TRACK ORDER', href: orderLink(o) }),
  }),
  delivered: (o) => ({
    subject: `${o.orderNumber} delivered — time to pop 🎉`,
    html: layout('Delivered. Go pop one.', `<p>Order <b>${esc(o.orderNumber)}</b> has been delivered. Pop them in the freezer ASAP (–18°C) and tell us which flavour won.</p>`, { text: 'LEAVE A REVIEW', href: orderLink(o) }),
  }),
  cancelled: (o) => ({
    subject: `${o.orderNumber} was cancelled`,
    html: layout('Order cancelled.', `<p>Order <b>${esc(o.orderNumber)}</b> has been cancelled.${o.paymentStatus === 'refunded' ? ` A refund of ${inr(o.total)} has been initiated to your original payment method (5–7 working days).` : ''}</p>`, { text: 'SHOP AGAIN', href: `${env.clientUrl}/shop` }),
  }),
  refunded: (o, amount) => ({
    subject: `Refund initiated for ${o.orderNumber}`,
    html: layout('Refund on its way.', `<p>We've initiated a refund of <b>${inr(amount ?? o.total)}</b> for order <b>${esc(o.orderNumber)}</b>. It usually reflects in 5–7 working days.</p>`),
  }),
  passwordReset: (user, url) => ({
    subject: 'Reset your POPSYY password',
    html: layout('Forgot your password? Happens.', `<p>Hey ${esc(user.name)}, tap below to set a new password. This link expires in 30 minutes. If you didn't ask for this, ignore this email.</p>`, { text: 'RESET PASSWORD', href: url }),
  }),
  welcome: (user) => ({
    subject: 'Welcome to the Pop Club 🍭',
    html: layout('Welcome to the Pop Club.', `<p>Hey ${esc(user.name)}, your account is live. New flavours, drops and deals — zero boring emails.</p>`, { text: 'SHOP POPS', href: `${env.clientUrl}/shop` }),
  }),
};

async function sendMail(to, { subject, html }) {
  try {
    const info = await getTransporter().sendMail({ from: env.smtp.from, to, subject, html });
    if (!smtpConfigured && !env.isTest) console.log(`[mail:dev] SMTP not configured — would send "${subject}" to ${to}`);
    return info;
  } catch (err) {
    console.error('[mail] failed', err.message);
    return null; // email failures never break the order flow
  }
}

const send = (template, to, ...args) => sendMail(to, templates[template](...args));

module.exports = { send, sendMail, templates, smtpConfigured };
