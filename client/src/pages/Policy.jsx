import Seo from '../components/ui/Seo';
import { useSettings } from '../context/SettingsContext';
import Skeleton from '../components/ui/Skeleton';

const TITLES = { shipping: 'SHIPPING', returns: 'RETURNS & REFUNDS', privacy: 'PRIVACY', terms: 'TERMS' };

export default function Policy({ page }) {
  const { settings, ready } = useSettings();
  const body = settings?.pages?.[page] || '';
  return (
    <div className="container-pop max-w-3xl py-8">
      <Seo title={TITLES[page].toLowerCase().replace(/^\w/, (c) => c.toUpperCase())} path={`/${page}`} />
      <h1 className="display text-6xl text-grape md:text-7xl">{TITLES[page]}</h1>
      <div className="sticker mt-8 space-y-4 bg-white p-6 text-[17px] leading-relaxed md:p-8">
        {!ready && <Skeleton className="h-40" />}
        {body.split(/\n\n+/).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}
      </div>
    </div>
  );
}
