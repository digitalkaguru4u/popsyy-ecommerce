// Brand defaults used by the seed script and as a fallback when the CMS document is missing.

const FLAVOURS = [
  {
    name: 'Lemon Lime',
    slug: 'lemon-lime',
    flavour: 'lemon-lime',
    tagline: 'Zingy. Fresh. Electric.',
    shortDescription: 'A sour-sweet jolt of Nashik lemons and Kaffir-lime zest. Wakes up your whole face.',
    description:
      'Lemon Lime is our loudest wake-up call. Real lemon juice, a hit of lime zest and a pinch of black salt, frozen into a pop that tastes like the first cold sip on a 42°C afternoon. Zero boring. Maximum zing.',
    colors: { from: '#D7FF3A', to: '#7ED321', ink: '#1F3D00' },
    ingredients: 'Water, sugar, lemon juice (8%), lime juice (4%), lime zest, black salt, stabiliser (INS 412), acidity regulator (INS 330), natural lime flavour.',
    nutrition: [
      { label: 'Energy', value: '48 kcal' }, { label: 'Carbohydrates', value: '12 g' }, { label: 'of which Sugars', value: '10.5 g' },
      { label: 'Protein', value: '0 g' }, { label: 'Fat', value: '0 g' }, { label: 'Sodium', value: '38 mg' },
    ],
    moods: ['chill', 'summer', 'study-break'],
    isBestseller: true,
    ratingAvg: 4.7,
    sortOrder: 1,
    stock: 1200,
    premium: false,
  },
  {
    name: 'Orange',
    slug: 'orange',
    flavour: 'orange',
    tagline: 'Juicy. Bright. Classic.',
    shortDescription: 'Nagpur orange, frozen at peak sunshine. The OG — just turned all the way up.',
    description:
      'The flavour that started it all — just louder. Orange is made with real Nagpur orange juice and a little tang so it tastes like biting into a fresh segment, not a sugar syrup. Bright, juicy and dangerously easy to finish.',
    colors: { from: '#FFB800', to: '#FF5E00', ink: '#4A1A00' },
    ingredients: 'Water, sugar, orange juice concentrate (reconstituted, 10%), orange pulp, stabiliser (INS 412), acidity regulator (INS 330), natural orange flavour, natural colour (INS 160a).',
    nutrition: [
      { label: 'Energy', value: '52 kcal' }, { label: 'Carbohydrates', value: '13 g' }, { label: 'of which Sugars', value: '11.2 g' },
      { label: 'Protein', value: '0.1 g' }, { label: 'Fat', value: '0 g' }, { label: 'Sodium', value: '6 mg' },
    ],
    moods: ['chill', 'party', 'summer'],
    isBestseller: true,
    ratingAvg: 4.6,
    sortOrder: 2,
    stock: 1400,
    premium: false,
  },
  {
    name: 'Cranberry',
    slug: 'cranberry',
    flavour: 'cranberry',
    tagline: 'Tangy. Bold. Berry good.',
    shortDescription: 'Tart cranberry with a sweet finish. Pink, loud and very photogenic.',
    description:
      "Cranberry is for the ones who like it a little extra. Tart real cranberry juice balanced with just enough sweetness, frozen into the pinkest pop you've ever seen. Tangy first, sweet after, gone in a minute.",
    colors: { from: '#FF4FB8', to: '#E0115F', ink: '#4D0020' },
    ingredients: 'Water, sugar, cranberry juice concentrate (reconstituted, 9%), invert sugar syrup, stabiliser (INS 412), acidity regulator (INS 330), natural cranberry flavour, beetroot extract (colour).',
    nutrition: [
      { label: 'Energy', value: '55 kcal' }, { label: 'Carbohydrates', value: '13.8 g' }, { label: 'of which Sugars', value: '12 g' },
      { label: 'Protein', value: '0 g' }, { label: 'Fat', value: '0 g' }, { label: 'Sodium', value: '5 mg' },
    ],
    moods: ['party', 'summer'],
    isNewArrival: true,
    ratingAvg: 4.5,
    sortOrder: 3,
    stock: 900,
    premium: true,
  },
  {
    name: 'Kala Khatta',
    slug: 'kala-khatta',
    flavour: 'kala-khatta',
    tagline: 'Desi. Tangy. Totally addictive.',
    shortDescription: 'Jamun, black salt and a chatpata kick. The gola-wala flavour, reborn as a pop.',
    description:
      "Kala Khatta is pure nostalgia with a glow-up. Jamun, kokum, black salt and a hint of roasted cumin — the chatpata gola flavour you grew up chasing, now frozen into a pop you don't have to share. Desi mode: ON.",
    colors: { from: '#9B4DFF', to: '#4B0FA8', ink: '#1C0A3D' },
    ingredients: 'Water, sugar, jamun pulp (7%), kokum extract, black salt, roasted cumin, stabiliser (INS 412), acidity regulator (INS 330), natural colour (INS 163).',
    nutrition: [
      { label: 'Energy', value: '50 kcal' }, { label: 'Carbohydrates', value: '12.4 g' }, { label: 'of which Sugars', value: '10.8 g' },
      { label: 'Protein', value: '0.1 g' }, { label: 'Fat', value: '0 g' }, { label: 'Sodium', value: '64 mg' },
    ],
    moods: ['desi-mode', 'party', 'study-break'],
    isBestseller: true,
    isFeatured: true,
    ratingAvg: 4.8,
    sortOrder: 4,
    stock: 1100,
    premium: false,
  },
];

const PACKS = [
  { name: 'Pack of 6', packSize: 6, price: 199, mrp: 240, premium: { price: 219, mrp: 264 } },
  { name: 'Pack of 12', packSize: 12, price: 379, mrp: 480, premium: { price: 419, mrp: 528 } },
  { name: 'Pack of 24', packSize: 24, price: 699, mrp: 960, premium: { price: 779, mrp: 1056 } },
];

const COMMON = {
  weight: '60 ml per pop',
  allergens: 'No major allergens. Made in a facility that also handles milk and nuts. 100% vegetarian.',
  storage: 'Keep frozen at –18°C or below. Once thawed, do not refreeze. Best before 9 months from manufacture.',
};

function defaultSettings() {
  return {
    announcement: 'FREE cold-chain delivery on orders above ₹499 🧊',
    hero: {
      eyebrow: 'NEW DROP · 4 FLAVOURS',
      headline: ['POP', 'YOUR', 'MOOD.'],
      subheading: 'Big flavour. Zero boring. Real fruit ice pops that hit harder than your group chat.',
      ctaPrimary: { text: 'SHOP POPS', link: '/shop' },
      ctaSecondary: { text: 'EXPLORE FLAVOURS', link: '/flavours' },
      image: '/images/brand/hero-pops.jpg',
    },
    marquee: ['POPSYY', 'BIG FLAVOUR', 'ZERO BORING', 'POP YOUR MOOD', 'CHILL', 'REPEAT'],
    boxes: [
      { size: 6, price: 199, mrp: 240, label: 'Snack Attack' },
      { size: 12, price: 379, mrp: 480, label: 'Squad Box' },
      { size: 24, price: 699, mrp: 960, label: 'Freezer Takeover' },
    ],
    flavourSection: { heading: 'PICK YOUR POP.', subheading: '4 flavours. 1 attitude.' },
    flavourCards: [],
    featuredProducts: [],
    moods: [
      { key: 'chill', title: 'CHILL', subtitle: 'For lazy days.', from: '#5CD3FF', to: '#1E6BFF', emoji: '😎' },
      { key: 'party', title: 'PARTY', subtitle: 'For chaotic days.', from: '#FF4FB8', to: '#FF8A00', emoji: '🎉' },
      { key: 'study-break', title: 'STUDY BREAK', subtitle: 'For "I need sugar" moments.', from: '#D7FF3A', to: '#20C997', emoji: '📚' },
      { key: 'summer', title: 'SUMMER', subtitle: 'For maximum main-character energy.', from: '#FFD600', to: '#FF5E00', emoji: '☀️' },
      { key: 'desi-mode', title: 'DESI MODE', subtitle: 'For that kala khatta craving.', from: '#9B4DFF', to: '#E0115F', emoji: '🪔' },
    ],
    socialFeed: [
      { image: '/images/brand/hero-pops.jpg', caption: 'the lineup is lining up', handle: '@popsyy.in', platform: 'instagram', link: '' },
      { image: '/images/brand/card-kala-khatta.jpg', caption: 'desi mode: ON', handle: '@popsyy.in', platform: 'tiktok', link: '' },
      { image: '/images/brand/card-lemon-lime.jpg', caption: 'zing check ✅', handle: '@popsyy.in', platform: 'instagram', link: '' },
      { image: '/images/brand/card-cranberry.jpg', caption: 'pink is a personality', handle: '@popsyy.in', platform: 'instagram', link: '' },
      { image: '/images/brand/card-orange.jpg', caption: 'OG energy', handle: '@popsyy.in', platform: 'tiktok', link: '' },
      { image: '/images/brand/flavour-strip.jpg', caption: 'pick your pop', handle: '@popsyy.in', platform: 'instagram', link: '' },
    ],
    about: {
      heading: 'WE MADE ICE POPS LOUD AGAIN.',
      body:
        'POPSYY started with one question: why do ice pops taste like the same sugar water they did in 2005?\n\nSo we went back to real fruit — Nagpur oranges, jamun, lemons, cranberries — and turned the flavour all the way up. No boring. No fake neon syrups. Just big, bold pops made for people who treat snacks like a personality.\n\nWe freeze in small batches, ship in cold-chain boxes and obsess over every flavour until it tastes like a mood.',
    },
    pages: {
      shipping:
        'We ship in insulated cold-chain boxes with dry ice so your pops arrive frozen.\n\n• Standard delivery: 2–4 working days — ₹49, FREE above ₹499.\n• Express delivery: next day in serviceable metros — ₹99.\n• We currently deliver to major cities in India. Enter your pincode at checkout to confirm.\n• Put pops in the freezer as soon as they arrive.',
      returns:
        "Because pops are frozen food, we can't accept returns. But if your order arrives melted, damaged or wrong, message us within 24 hours of delivery with a photo and we'll replace it or refund you in full.\n\nRefunds go back to the original payment method within 5–7 working days. COD refunds are sent by UPI or bank transfer.",
      privacy: 'We only collect what we need to deliver your pops and never sell your data.',
      terms: 'By ordering from POPSYY you agree to our delivery and refund policies.',
    },
    socials: { instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/', youtube: 'https://youtube.com/' },
    footer: {
      tagline: 'Big flavour. Zero boring.',
      email: 'hello@popsyy.in',
      phone: '+91 90000 00000',
      address: 'POPSYY Foods, Mumbai, Maharashtra, India',
    },
    seo: {
      title: 'POPSYY — Real Fruit Ice Pops. Big Flavour. Zero Boring.',
      description: 'Order POPSYY ice pops online — Lemon Lime, Orange, Cranberry and Kala Khatta. Build your own box and get it delivered frozen.',
      ogImage: '/images/brand/hero-pops.jpg',
    },
  };
}

const FAQS = [
  { q: 'How do the pops stay frozen during delivery?', a: 'Every order ships in an insulated cold-chain box packed with dry ice. Most orders reach you within 2–4 working days fully frozen.', c: 'Delivery' },
  { q: 'Where do you deliver?', a: 'We deliver to major cities across India. Enter your pincode at checkout — if we can reach you frozen, we will.', c: 'Delivery' },
  { q: 'What if my pops arrive melted?', a: "Send us a photo within 24 hours of delivery and we'll replace the order or refund you. No drama.", c: 'Orders' },
  { q: 'Are POPSYY pops vegetarian?', a: 'Yes — 100% vegetarian, made with real fruit juice and pulp. Check each flavour page for full ingredients.', c: 'Product' },
  { q: 'How long do they last?', a: 'Up to 9 months in your freezer at –18°C. Once thawed, please don\'t refreeze.', c: 'Product' },
  { q: 'Can I mix flavours?', a: 'Absolutely. Use Build Your Box to mix any flavours into a 6, 12 or 24 pop box.', c: 'Orders' },
  { q: 'Do you offer Cash on Delivery?', a: 'Yes, COD is available on orders up to ₹3,000.', c: 'Payments' },
  { q: 'How do I track my order?', a: 'Head to Account → My Orders, or use Track Order with your order number and email.', c: 'Orders' },
];

const COUPONS = [
  { code: 'POPFIRST', description: '15% off your first box (max ₹100)', discountType: 'percentage', value: 15, maxDiscount: 100, minOrder: 199, perUserLimit: 1, isPublic: true },
  { code: 'CHILL50', description: '₹50 off orders above ₹499', discountType: 'fixed', value: 50, minOrder: 499, perUserLimit: 3, isPublic: true },
  { code: 'SQUAD20', description: '20% off orders above ₹999 (max ₹250)', discountType: 'percentage', value: 20, maxDiscount: 250, minOrder: 999, perUserLimit: 2, isPublic: true },
];

const REVIEWS = [
  { slug: 'kala-khatta', name: 'Ananya R.', rating: 5, title: 'Actually insane', body: 'Kala Khatta is actually insane. Tastes exactly like the gola from school but better.', featured: true },
  { slug: 'orange', name: 'Kabir M.', rating: 5, title: 'Gone in a day', body: 'Ordered one box. Finished it way too fast. Ordering the 24 next.', featured: true },
  { slug: 'lemon-lime', name: 'Riya S.', rating: 5, title: 'POPSYY >>> ice cream', body: 'POPSYY >>> boring ice cream. The lemon lime has real zing.', featured: true },
  { slug: 'cranberry', name: 'Arjun K.', rating: 4, title: 'Prettiest pop ever', body: 'So pink it basically posts itself. Tangy and not too sweet.', featured: true },
  { slug: 'kala-khatta', name: 'Meher T.', rating: 5, title: 'Desi mode forever', body: 'The black salt hit is perfect. My whole hostel floor is obsessed now.', featured: true },
  { slug: 'lemon-lime', name: 'Dev P.', rating: 4, title: 'Study break essential', body: 'Keeps me awake during exams better than coffee. Slightly sour, in a good way.', featured: true },
  { slug: 'orange', name: 'Sana Q.', rating: 5, title: 'Real orange taste', body: "Doesn't taste like syrup at all. Arrived frozen solid too.", featured: false },
  { slug: 'cranberry', name: 'Ishaan B.', rating: 5, title: 'Party hit', body: 'Brought a Squad Box to a house party. Cranberry went first.', featured: false },
];

module.exports = { FLAVOURS, PACKS, COMMON, defaultSettings, FAQS, COUPONS, REVIEWS };
