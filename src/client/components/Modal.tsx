import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const layers: HTMLElement[] = [];
let previousOverflow = '', previousPadding = '', rootWasInert = false;
const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]';

/** Dialogs live outside transformed cards/headers, with one active keyboard layer. */
export function Modal({ children, onClose, className = '' }: { children: ReactNode; onClose?: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();

  useLayoutEffect(() => {
    const layer = ref.current!;
    const panel = layer.querySelector<HTMLElement>('.modal-content')!;
    const title = panel.querySelector<HTMLElement>('.modal-header h2, .modal-header h3');
    if (title) { title.id = titleId; layer.setAttribute('aria-labelledby', titleId); }
    panel.tabIndex = -1;
    const previousFocus = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    if (!layers.length) {
      previousOverflow = document.body.style.overflow;
      previousPadding = document.body.style.paddingRight;
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
      rootWasInert = root?.inert || false;
      if (root) root.inert = true;
    }
    layers.push(layer);
    const syncLayers = () => layers.forEach((entry, index) => {
      entry.inert = index !== layers.length - 1;
      entry.style.zIndex = String(2000 + index);
      if (entry.inert) entry.setAttribute('aria-hidden', 'true');
      else entry.removeAttribute('aria-hidden');
    });
    syncLayers();
    panel.focus({ preventScroll: true });
    const focusable = () => [...panel.querySelectorAll<HTMLElement>(focusableSelector)].filter(el => el.getClientRects().length > 0 && !el.closest('[inert]'));
    const onKey = (event: KeyboardEvent) => {
      if (layers.at(-1) !== layer) return;
      if (event.key === 'Escape' && closeRef.current) { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const controls = focusable(), first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); panel.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last!.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const index = layers.indexOf(layer);
      if (index >= 0) layers.splice(index, 1);
      syncLayers();
      if (!layers.length) {
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPadding;
        if (root) root.inert = rootWasInert;
      }
      if (previousFocus?.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus({ preventScroll: true });
    };
  }, [titleId]);

  return createPortal(<div ref={ref} className={`modal active ${className}`} role="dialog" aria-modal="true">{children}</div>, document.body);
}
