import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Seo from '../components/ui/Seo';
import Skeleton from '../components/ui/Skeleton';
import { useFetch } from '../hooks/useFetch';

export default function Faqs() {
  const { data, loading } = useFetch('/content/faqs');
  const [open, setOpen] = useState(0);
  const faqs = data?.faqs || [];
  const ld = faqs.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) } : undefined;
  return (
    <div className="container-pop max-w-4xl py-8">
      <Seo title="FAQs" description="Answers about POPSYY delivery, storage, ingredients, payments and orders." path="/faqs" jsonLd={ld} />
      <h1 className="display text-6xl text-grape md:text-8xl">GOT <span className="text-pink">Q's?</span></h1>
      <p className="hand mt-1 text-3xl text-purple">we've got A's.</p>
      <div className="mt-8 space-y-3">
        {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
        {faqs.map((f, i) => (
          <div key={f._id} className={`overflow-hidden rounded-[1.5rem] border-[3px] border-ink ${open === i ? 'bg-lemon shadow-[5px_5px_0_#1c0a3d]' : 'bg-white'}`}>
            <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 p-5 text-left font-display text-lg font-extrabold md:text-xl">
              {f.question}<Plus className={`h-6 w-6 shrink-0 transition ${open === i ? 'rotate-45' : ''}`} />
            </button>
            <AnimatePresence initial={false}>{open === i && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}><p className="px-5 pb-5 font-medium text-ink/80">{f.answer}</p></motion.div>}</AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
