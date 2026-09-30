import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Seo, { siteUrl } from '../components/ui/Seo';
import Hero from '../components/home/Hero';
import MarqueeStrip from '../components/home/MarqueeStrip';
import PickYourPop from '../components/home/PickYourPop';
import MeetThePops from '../components/home/MeetThePops';
import MoodScroll from '../components/home/MoodScroll';
import ShopByMood from '../components/home/ShopByMood';
import Bestsellers from '../components/home/Bestsellers';
import BoxSection from '../components/home/BoxSection';
import SocialProof from '../components/home/SocialProof';
import IrlFeed from '../components/home/IrlFeed';
import Newsletter from '../components/home/Newsletter';
import { useSettings } from '../context/SettingsContext';
import { useFetch } from '../hooks/useFetch';
import { assetUrl } from '../services/api';

function PromoBanners({ banners = [] }) {
  if (!banners.length) return null;
  return (
    <div className="container-pop space-y-5 py-6">
      {banners.map((b) => (
        <Link key={b._id} to={b.ctaLink || '/shop'} className="group relative flex flex-col gap-4 overflow-hidden rounded-[2rem] border-[3px] border-ink p-8 text-white shadow-[7px_7px_0_#1c0a3d] md:flex-row md:items-center md:justify-between md:p-10" style={{ background: `linear-gradient(120deg, ${b.colorFrom}, ${b.colorTo})` }}>
          {b.image && <img src={assetUrl(b.image)} alt="" aria-hidden className="absolute inset-y-0 right-0 hidden h-full w-1/3 object-cover opacity-40 md:block" loading="lazy" />}
          <div className="relative"><p className="display text-4xl md:text-6xl" style={{ textShadow: '4px 4px 0 #1c0a3d' }}>{b.title}</p>{b.subtitle && <p className="mt-2 text-lg font-bold">{b.subtitle}</p>}</div>
          {b.ctaText && <span className="btn btn-light relative w-fit">{b.ctaText} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>}
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  const { settings } = useSettings();
  const featured = useFetch('/products?limit=8');
  const best = useFetch('/products?sort=popular&limit=8');
  const reviews = useFetch('/reviews/featured');
  const banners = useFetch('/content/banners?placement=home_promo');
  const s = settings || {};
  const meetList = s.featuredProducts?.length ? s.featuredProducts.map((fp) => featured.data?.products?.find((p) => p._id === fp._id) || fp) : featured.data?.products;

  return (
    <>
      <Seo title={s.seo?.title?.replace(/ \| POPSYY$/, '')} description={s.seo?.description} path="/" image={s.seo?.ogImage}
        jsonLd={[
          { '@context': 'https://schema.org', '@type': 'Organization', name: 'POPSYY', url: siteUrl, logo: `${siteUrl}/favicon.svg`, sameAs: Object.values(s.socials || {}).filter(Boolean), contactPoint: s.footer?.email ? { '@type': 'ContactPoint', email: s.footer.email, contactType: 'customer support', areaServed: 'IN' } : undefined },
          { '@context': 'https://schema.org', '@type': 'WebSite', name: 'POPSYY', url: siteUrl, potentialAction: { '@type': 'SearchAction', target: `${siteUrl}/shop?search={search_term_string}`, 'query-input': 'required name=search_term_string' } },
        ]} />
      <Hero hero={s.hero} />
      <MarqueeStrip items={s.marquee} />
      <PickYourPop section={s.flavourSection} cards={s.flavourCards} />
      <MeetThePops products={meetList} loading={featured.loading && !meetList} />
      <MoodScroll />
      <ShopByMood moods={s.moods} />
      <Bestsellers products={best.data?.products} loading={best.loading} />
      <PromoBanners banners={banners.data?.banners} />
      <BoxSection />
      <SocialProof reviews={reviews.data?.reviews} />
      <IrlFeed feed={s.socialFeed} instagram={s.socials?.instagram} />
      <Newsletter />
    </>
  );
}
