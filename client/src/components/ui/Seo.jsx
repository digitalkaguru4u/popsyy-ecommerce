// React 19 hoists <title>/<meta>/<link> into <head> automatically.
const SITE = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://popsyy.in');

export default function Seo({ title, description, image, path, type = 'website', noindex = false, jsonLd }) {
  const fullTitle = title ? `${title} | POPSYY` : 'POPSYY — Real Fruit Ice Pops. Big Flavour. Zero Boring.';
  const desc = description || 'Order POPSYY ice pops online — Lemon Lime, Orange, Cranberry and Kala Khatta. Build your own box and get it delivered frozen.';
  const url = `${SITE}${path ?? (typeof window !== 'undefined' ? window.location.pathname : '/')}`;
  const img = image ? (image.startsWith('http') ? image : `${SITE}${image}`) : `${SITE}/images/brand/hero-pops.jpg`;
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={img} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj).replace(/</g, '\\u003c') }} />
      ))}
    </>
  );
}
export const siteUrl = SITE;
