const Product = require('../models/Product');
const env = require('../config/env');

const STATIC = ['/', '/shop', '/flavours', '/build-your-box', '/about', '/faqs', '/contact', '/shipping', '/returns', '/track-order'];

exports.sitemap = async (req, res) => {
  const products = await Product.find({ isActive: true }).select('slug updatedAt').lean();
  const base = env.clientUrl;
  const urls = [
    ...STATIC.map((p) => `<url><loc>${base}${p}</loc><changefreq>weekly</changefreq><priority>${p === '/' ? '1.0' : '0.7'}</priority></url>`),
    ...products.map((p) => `<url><loc>${base}/product/${p.slug}</loc><lastmod>${new Date(p.updatedAt).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`),
  ];
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
};

exports.robots = (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout\nDisallow: /cart\nSitemap: ${env.clientUrl}/sitemap.xml\n`);
};
