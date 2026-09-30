import { Children, cloneElement, isValidElement, useId } from 'react';

// Label + control + hint/error, wired up with htmlFor / aria-describedby so screen readers
// announce exactly the label text (and the hint as a description).
export default function Field({ label, error, children, hint, className = '' }) {
  const uid = useId();
  const only = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const id = only?.props?.id || `f${uid.replace(/:/g, '')}`;
  const descId = hint || error ? `${id}-desc` : undefined;
  const control = only ? cloneElement(only, { id, 'aria-describedby': descId, 'aria-invalid': error ? true : undefined }) : children;
  return (
    <div className={`block ${className}`}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      {control}
      {hint && !error && <span id={descId} className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span id={descId} className="mt-1 block text-xs font-bold text-magenta" role="alert">{error}</span>}
    </div>
  );
}
