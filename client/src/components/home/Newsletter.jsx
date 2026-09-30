import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { LimeSlice, OrangeSlice, Sparkle } from '../ui/Decor';
import Spinner from '../ui/Spinner';

export default function Newsletter() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const submit = async (e) => {
    e.preventDefault();
    setState('loading');
    try { const r = await api.post('/content/newsletter', { email, source: 'home' }); toast.success(r.message); setState('done'); setEmail(''); } catch (err) { toast.error(err.message); setState('idle'); }
  };
  return (
    <section className="container-pop py-10" aria-labelledby="pop-club">
      <div className="relative overflow-hidden rounded-[2.5rem] border-[3px] border-ink bg-lime px-6 py-14 shadow-[10px_10px_0_#1c0a3d] md:px-16 md:py-20">
        <LimeSlice className="absolute -right-10 -top-10 w-40 animate-spin-slow md:w-56" />
        <OrangeSlice className="absolute -bottom-12 left-[40%] w-32 animate-float-slow" />
        <Sparkle className="absolute left-8 top-8 w-10" color="#FF2E93" />
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 id="pop-club" className="display text-6xl text-ink md:text-8xl">JOIN THE<br /><span className="text-purple">POP CLUB.</span></h2>
            <p className="mt-4 max-w-md text-lg font-bold text-ink/80">New flavours. Drops. Deals. Zero boring emails.</p>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="nl-email" className="sr-only">Email address</label>
            <input id="nl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="input h-16 flex-1 rounded-full text-lg" />
            <button disabled={state === 'loading'} className="btn btn-dark btn-lg h-16">
              {state === 'loading' ? <Spinner /> : state === 'done' ? <><Check className="h-5 w-5" /> YOU'RE IN</> : <>JOIN THE CLUB <ArrowRight className="h-5 w-5" /></>}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
