const Notification = require('../models/Notification');

async function notifyAdmin(type, title, message = '', link = '') {
  try {
    await Notification.create({ audience: 'admin', type, title, message, link });
  } catch (e) {
    console.error('[notify]', e.message);
  }
}
module.exports = { notifyAdmin };
