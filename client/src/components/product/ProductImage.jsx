import { useState } from 'react';
import { assetUrl } from '../../services/api';
import { colorsFor } from '../../utils/format';
import PopArt from './PopArt';

export default function ProductImage({ product, index = 0, className = '', eager = false, sizes }) {
  const [err, setErr] = useState(false);
  const img = product?.images?.[index] || product?.images?.[0];
  const src = typeof product?.image === 'string' && !img ? product.image : img?.url;
  const c = colorsFor(product);
  if (!src || err) return <PopArt color={c.from} color2={c.to} className={className} />;
  return (
    <img src={assetUrl(src)} alt={img?.alt || `POPSYY ${product?.name || ''} ice pop`} className={className}
      loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : undefined} sizes={sizes} onError={() => setErr(true)} draggable={false} />
  );
}
