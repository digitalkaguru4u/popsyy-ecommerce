const SiteSettings = require('../models/SiteSettings');
const { defaultSettings } = require('../seed/defaults');

async function getSettings() {
  let s = await SiteSettings.findOne({ key: 'site' });
  if (!s) s = await SiteSettings.create({ key: 'site', ...defaultSettings() });
  return s;
}

async function getBoxPricing() {
  const s = await getSettings();
  const boxes = s.boxes?.length ? s.boxes : defaultSettings().boxes;
  return boxes.map((b) => ({ size: b.size, price: b.price, mrp: b.mrp, label: b.label }));
}

module.exports = { getSettings, getBoxPricing };
