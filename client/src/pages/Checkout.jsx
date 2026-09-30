import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, CreditCard, Banknote, MapPin, Plus, Truck, Zap, Lock, AlertTriangle, FlaskConical } from 'lucide-react';
import Seo from '../components/ui/Seo';
import { LoginForm, RegisterForm } from '../components/AuthForms';
import Field from '../components/ui/Field';
import Spinner, { PageSpinner } from '../components/ui/Spinner';
import { CouponBox, Summary } from './Cart';
import ProductImage from '../components/product/ProductImage';
import PopArt from '../components/product/PopArt';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import usePayment from '../hooks/usePayment';
import { api, qs } from '../services/api';
import { colorsFor, gradient, inr } from '../utils/format';

const STEPS = ['You', 'Address', 'Delivery', 'Payment'];
const STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
const emptyAddr = { name: '', phone: '', line1: '', line2: '', landmark: '', city: '', state: 'Maharashtra', pincode: '', save: true };

export default function Checkout() {
  const { user, ready } = useAuth();
  const { cart, refresh, setCart } = useCart();
  const { payments } = useSettings();
  const toast = useToast();
  const nav = useNavigate();
  const { pay, modal } = usePayment();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState({ name: '', email: '', phone: '' });
  const [addresses, setAddresses] = useState([]);
  const [addrId, setAddrId] = useState('');
  const [addr, setAddr] = useState(emptyAddr);
  const [newAddr, setNewAddr] = useState(false);
  const [delivery, setDelivery] = useState('standard');
  const [method, setMethod] = useState('razorpay');
  const [summary, setSummary] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [failed, setFailed] = useState(null); // { orderId, message }
  const [authTab, setAuthTab] = useState('login');
  const [errors, setErrors] = useState({});

  const onlineOk = payments?.online !== false;
  useEffect(() => { if (payments && !onlineOk) setMethod('cod'); }, [payments, onlineOk]);

  useEffect(() => {
    if (!user) return;
    setInfo({ name: user.name, email: user.email, phone: user.phone || '' });
    api.get('/account/addresses').then((r) => {
      setAddresses(r.addresses);
      const def = r.addresses.find((a) => a.isDefault) || r.addresses[0];
      if (def) setAddrId(def._id); else setNewAddr(true);
    }).catch(() => {});
    if (step === 0) setStep(1);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cart?.lines?.length) return;
    api.get(`/cart${qs({ delivery, payment: method })}`).then((r) => setSummary(r.cart)).catch(() => {});
  }, [delivery, method, cart]);

  if (!ready || !cart) return <PageSpinner />;
  if (!cart.lines?.length && !failed) {
    return (
      <div className="container-pop py-20 text-center">
        <h1 className="display text-5xl text-grape">NOTHING TO CHECK OUT.</h1>
        <Link to="/shop" className="btn btn-primary mt-6">Shop pops</Link>
      </div>
    );
  }
  const s = summary || cart;
  const codTooBig = payments?.cod && s.total > payments.cod.maxOrder;

  const validateAddress = () => {
    if (!newAddr && addrId) return true;
    const e = {};
    if (addr.name.trim().length < 2) e.name = 'Required';
    if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(addr.phone.trim())) e.phone = 'Enter a valid 10-digit mobile';
    if (addr.line1.trim().length < 3) e.line1 = 'Required';
    if (addr.city.trim().length < 2) e.city = 'Required';
    if (!/^[1-9]\d{5}$/.test(addr.pincode.trim())) e.pincode = 'Enter a 6-digit pincode';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const validateInfo = () => {
    const e = {};
    if (info.name.trim().length < 2) e.infoName = 'Required';
    if (info.phone && !/^(\+91[\s-]?)?[6-9]\d{9}$/.test(info.phone.trim())) e.infoPhone = 'Enter a valid 10-digit mobile';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handlePayResult = async (orderId, r) => {
    if (r.status === 'paid') { await refresh(); nav(`/order/success/${orderId}`, { replace: true }); return; }
    setFailed({ orderId, message: r.status === 'cancelled' ? 'Payment cancelled — no money was taken. Your order is saved; retry whenever you are ready.' : `Payment failed: ${r.message}. No worries, you can retry.` });
  };

  const placeOrder = async () => {
    if (!validateAddress()) { setStep(1); return; }
    setPlacing(true);
    try {
      const body = {
        name: info.name, email: info.email, phone: info.phone || undefined, deliveryMethod: delivery, paymentMethod: method,
        ...(newAddr || !addrId ? { address: { ...addr, pincode: addr.pincode.trim(), phone: addr.phone.trim() } } : { addressId: addrId }),
      };
      const { order } = await api.post('/orders', body);
      if (method === 'cod') {
        setCart({ ...cart, lines: [] });
        await refresh();
        nav(`/order/success/${order._id}`, { replace: true });
        return;
      }
      const r = await pay(order._id);
      await handlePayResult(order._id, r);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPlacing(false);
    }
  };

  const retry = async () => {
    setPlacing(true);
    const { orderId } = failed;
    try { setFailed(null); const r = await pay(orderId); await handlePayResult(orderId, r); } catch (e) { toast.error(e.message); setFailed({ orderId, message: e.message }); } finally { setPlacing(false); }
  };

  const next = () => {
    if (step === 0 && !validateInfo()) return;
    if (step === 1 && !validateAddress()) return;
    setStep(Math.min(3, step + 1));
  };
  const selectedAddr = newAddr || !addrId ? addr : addresses.find((a) => a._id === addrId);

  return (
    <div className="container-pop pb-16 pt-6">
      <Seo title="Checkout" noindex path="/checkout" />
      {modal}
      <h1 className="display text-5xl text-grape md:text-7xl">CHECK<span className="text-pink">OUT</span></h1>

      <ol className="mt-6 flex flex-wrap items-center gap-2" aria-label="Checkout steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button onClick={() => (i < step || (i === step)) && setStep(i)} disabled={i > step || (i === 0 && user)} aria-current={step === i ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-full border-[3px] border-ink px-4 py-2 font-display text-sm font-extrabold uppercase ${step === i ? 'bg-pink text-white' : i < step ? 'bg-lime' : 'bg-white opacity-60'}`}>
              <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-white text-xs text-ink">{i < step ? <Check className="h-3.5 w-3.5" strokeWidth={4} /> : i + 1}</span>{label}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 opacity-40" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          {failed && (
            <div className="mb-6 rounded-[1.5rem] border-[3px] border-ink bg-lemon p-5" role="alert">
              <p className="flex items-start gap-2 font-bold"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-magenta" />{failed.message}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={retry} disabled={placing} className="btn btn-primary">{placing ? <Spinner /> : 'Retry payment'}</button>
                <Link to={`/account/orders/${failed.orderId}`} className="btn btn-light">View order</Link>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="sticker bg-white p-5 md:p-7">
              {step === 0 && (
                user ? (
                  <div className="space-y-4">
                    <h2 className="display text-3xl text-grape">Your details</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Name" error={errors.infoName}><input className="input" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></Field>
                      <Field label="Mobile" error={errors.infoPhone}><input className="input" type="tel" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} placeholder="For delivery updates" /></Field>
                    </div>
                    <Field label="Email"><input className="input bg-cream" value={info.email} readOnly /></Field>
                  </div>
                ) : (
                  <div>
                    <h2 className="display text-3xl text-grape">Who's popping?</h2>
                    <p className="mt-1 text-sm text-muted">Log in or create an account to track your order. Your cart comes with you.</p>
                    <div className="mt-5 flex rounded-full border-[3px] border-ink bg-cream p-1">
                      {['login', 'register'].map((t) => <button key={t} onClick={() => setAuthTab(t)} className={`flex-1 rounded-full py-2 font-display text-sm font-extrabold uppercase ${authTab === t ? 'bg-ink text-white' : ''}`}>{t === 'login' ? 'Log in' : 'New here'}</button>)}
                    </div>
                    <div className="mt-5">{authTab === 'login' ? <LoginForm /> : <RegisterForm />}</div>
                  </div>
                )
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="display text-3xl text-grape">Where to?</h2>
                  {addresses.length > 0 && (
                    <div className="grid gap-3" role="radiogroup" aria-label="Saved addresses">
                      {addresses.map((a) => (
                        <label key={a._id} className={`flex cursor-pointer gap-3 rounded-2xl border-[3px] border-ink p-4 ${!newAddr && addrId === a._id ? 'bg-lime' : 'bg-white hover:bg-cream'}`}>
                          <input type="radio" name="addr" checked={!newAddr && addrId === a._id} onChange={() => { setAddrId(a._id); setNewAddr(false); }} className="mt-1 h-4 w-4 accent-ink" />
                          <span className="text-sm"><span className="font-extrabold">{a.name}</span> · {a.phone}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}</span>
                        </label>
                      ))}
                      <button onClick={() => setNewAddr(true)} className={`flex items-center gap-2 rounded-2xl border-[3px] border-dashed border-ink p-4 font-bold ${newAddr ? 'bg-lime' : 'hover:bg-cream'}`}><Plus className="h-4 w-4" /> Use a new address</button>
                    </div>
                  )}
                  {(newAddr || !addresses.length) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Full name" error={errors.name}><input className="input" value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} autoComplete="name" /></Field>
                      <Field label="Mobile" error={errors.phone}><input className="input" type="tel" inputMode="numeric" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} autoComplete="tel" /></Field>
                      <Field label="Flat, house, building" error={errors.line1} className="sm:col-span-2"><input className="input" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} autoComplete="address-line1" /></Field>
                      <Field label="Area, street (optional)" className="sm:col-span-2"><input className="input" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} autoComplete="address-line2" /></Field>
                      <Field label="Landmark (optional)"><input className="input" value={addr.landmark} onChange={(e) => setAddr({ ...addr, landmark: e.target.value })} /></Field>
                      <Field label="Pincode" error={errors.pincode}><input className="input" inputMode="numeric" maxLength={6} value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, '') })} autoComplete="postal-code" /></Field>
                      <Field label="City" error={errors.city}><input className="input" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} autoComplete="address-level2" /></Field>
                      <Field label="State"><select className="input" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })}>{STATES.map((st) => <option key={st}>{st}</option>)}</select></Field>
                      <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={addr.save} onChange={(e) => setAddr({ ...addr, save: e.target.checked })} className="h-4 w-4 accent-pink" /> Save this address for next time</label>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="display text-3xl text-grape">How fast?</h2>
                  {[
                    ['standard', Truck, 'Standard cold-chain', '2–4 working days', payments?.shipping && (s.subtotal - s.discount >= payments.shipping.freeThreshold ? 'FREE' : inr(payments.shipping.standard))],
                    ['express', Zap, 'Express', 'Next day in select metros', payments?.shipping && inr(payments.shipping.express)],
                  ].map(([k, I, t, d, price]) => (
                    <label key={k} className={`flex cursor-pointer items-center gap-4 rounded-2xl border-[3px] border-ink p-4 ${delivery === k ? 'bg-lime shadow-[4px_4px_0_#1c0a3d]' : 'bg-white hover:bg-cream'}`}>
                      <input type="radio" name="delivery" checked={delivery === k} onChange={() => setDelivery(k)} className="h-4 w-4 accent-ink" />
                      <I className="h-6 w-6" />
                      <span className="flex-1"><span className="block font-display text-lg font-extrabold">{t}</span><span className="text-sm text-muted">{d}</span></span>
                      <span className="font-display text-lg font-extrabold">{price}</span>
                    </label>
                  ))}
                  <p className="text-xs font-semibold text-muted">All orders ship in insulated boxes with dry ice so they arrive frozen.</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="display text-3xl text-grape">Pay up, pop star</h2>
                  <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border-[3px] border-ink p-4 ${method === 'razorpay' ? 'bg-lime shadow-[4px_4px_0_#1c0a3d]' : 'bg-white hover:bg-cream'} ${!onlineOk ? 'pointer-events-none opacity-50' : ''}`}>
                    <input type="radio" name="pm" checked={method === 'razorpay'} disabled={!onlineOk} onChange={() => setMethod('razorpay')} className="mt-1 h-4 w-4 accent-ink" />
                    <CreditCard className="mt-0.5 h-6 w-6" />
                    <span className="flex-1">
                      <span className="block font-display text-lg font-extrabold">Pay online {payments?.mode === 'mock' && <span className="ml-1 rounded-full bg-orange px-2 py-0.5 text-[10px] text-white"><FlaskConical className="inline h-3 w-3" /> TEST MODE</span>}</span>
                      <span className="text-sm text-muted">UPI · Cards · Netbanking · Wallets — secured by Razorpay</span>
                      {!onlineOk && <span className="mt-1 block text-xs font-bold text-magenta">Online payments are unavailable right now.</span>}
                      <span className="mt-2 flex flex-wrap gap-1.5">{['UPI', 'Visa', 'Mastercard', 'RuPay', 'Netbanking', 'Paytm', 'PhonePe'].map((x) => <span key={x} className="rounded-md border-2 border-ink/20 bg-white px-1.5 py-0.5 text-[10px] font-extrabold">{x}</span>)}</span>
                    </span>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border-[3px] border-ink p-4 ${method === 'cod' ? 'bg-lime shadow-[4px_4px_0_#1c0a3d]' : 'bg-white hover:bg-cream'} ${codTooBig ? 'pointer-events-none opacity-50' : ''}`}>
                    <input type="radio" name="pm" checked={method === 'cod'} disabled={codTooBig} onChange={() => setMethod('cod')} className="mt-1 h-4 w-4 accent-ink" />
                    <Banknote className="mt-0.5 h-6 w-6" />
                    <span className="flex-1">
                      <span className="block font-display text-lg font-extrabold">Cash on Delivery</span>
                      <span className="text-sm text-muted">Pay by cash or UPI when your pops arrive{payments?.cod?.fee ? ` (+${inr(payments.cod.fee)})` : ''}.</span>
                      {codTooBig && <span className="mt-1 block text-xs font-bold text-magenta">COD is available up to {inr(payments.cod.maxOrder)}.</span>}
                    </span>
                  </label>
                  {selectedAddr && (
                    <div className="rounded-2xl bg-cream p-4 text-sm"><p className="flex items-center gap-2 font-extrabold"><MapPin className="h-4 w-4" /> Delivering to</p><p className="mt-1">{selectedAddr.name}, {selectedAddr.line1}, {selectedAddr.city} {selectedAddr.pincode}</p></div>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-between gap-3">
                {step > (user ? 1 : 0) ? <button onClick={() => setStep(step - 1)} className="btn btn-light">Back</button> : <span />}
                {step < 3 ? (
                  (user || step > 0) && <button onClick={next} className="btn btn-dark">Continue</button>
                ) : (
                  <button onClick={placeOrder} disabled={placing || s.hasIssues || (method === 'cod' && codTooBig)} className="btn btn-primary btn-lg">
                    {placing ? <Spinner /> : <><Lock className="h-4 w-4" /> {method === 'cod' ? `Place order · ${inr(s.total)}` : `Pay ${inr(s.total)}`}</>}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="sticker space-y-4 bg-white p-6">
            <h2 className="display text-3xl text-grape">Order summary</h2>
            <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {cart.lines.filter((l) => !l.invalid).map((l) => (
                <li key={l._id} className="flex items-center gap-3">
                  <span className="relative grid h-14 w-12 shrink-0 place-items-center rounded-xl border-2 border-ink" style={{ background: l.kind === 'box' ? 'linear-gradient(135deg,#FF2E93,#FF8A00)' : gradient(colorsFor(l.product)) }}>
                    {l.kind === 'box' ? <PopArt color="#fff" className="h-10" /> : <ProductImage product={l.product} className="h-12 w-auto" />}
                    <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full border-2 border-ink bg-lemon px-1 text-[10px] font-extrabold">{l.qty}</span>
                  </span>
                  <span className="min-w-0 flex-1 text-sm"><span className="block truncate font-extrabold">{l.name}</span><span className="text-xs text-muted">{l.kind === 'box' ? l.box.selections.map((x) => `${x.qty}× ${x.product.name}`).join(', ') : l.variant.name}</span></span>
                  <span className="font-bold">{inr(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <CouponBox />
            <Summary cart={s} />
          </div>
          <p className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-muted"><Lock className="h-3 w-3" /> Payments are verified server-side. We never see your card details.</p>
        </aside>
      </div>
    </div>
  );
}
