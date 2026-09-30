const Razorpay = require('razorpay');
const env = require('./env');

let client = null;
function getRazorpay() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) return null;
  if (!client) client = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return client;
}
const razorpayEnabled = () => Boolean(env.razorpay.keyId && env.razorpay.keySecret);

module.exports = { getRazorpay, razorpayEnabled };
