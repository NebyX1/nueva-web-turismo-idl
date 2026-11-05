import { useEffect, useState } from 'react';

/** Controls the server-rendered navigation without re-rendering the header. */
export default function MobileNavigation() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const button = document.querySelector<HTMLButtonElement>('#menu-toggle');
    const menu = document.querySelector<HTMLElement>('#mobile-menu');
    if (!button || !menu) return;

    const toggle = () => setOpen(value => !value);
    const closeOnSelection = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a, button')) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    button.addEventListener('click', toggle);
    menu.addEventListener('click', closeOnSelection);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      button.removeEventListener('click', toggle);
      menu.removeEventListener('click', closeOnSelection);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    const button = document.querySelector<HTMLButtonElement>('#menu-toggle');
    const menu = document.querySelector<HTMLElement>('#mobile-menu');
    if (!button || !menu) return;
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.querySelector('#site-header')?.classList.toggle('scrolled', open || window.scrollY > 70);
  }, [open]);

  return null;
}
