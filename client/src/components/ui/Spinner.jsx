import { Loader2 } from 'lucide-react';
export default function Spinner({ className = 'h-5 w-5' }) { return <Loader2 className={`animate-spin ${className}`} aria-label="Loading" />; }
export function PageSpinner() {
  return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-10 w-10 animate-spin text-purple" /></div>;
}
