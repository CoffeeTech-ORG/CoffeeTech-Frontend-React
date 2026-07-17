import { useEffect, useState } from 'react';

/**
 * Does a media query match right now?
 *
 * `matchMedia` with its `change` event, not `resize` on `window.innerWidth`: the latter fires a render
 * per pixel the window edge is dragged, the former only when the breakpoint is crossed.
 *
 * This is for what CSS CANNOT do -- change what is rendered, not how it looks. Hiding something with
 * `display: none` is still the stylesheet's job.
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

/** The app's mobile breakpoint: the same the stylesheets use. */
export const MOBILE = '(max-width: 768px)';

export const useIsMobile = (): boolean => useMediaQuery(MOBILE);

/**
 * Width below which sign-in and sign-up stop being two columns.
 *
 * LARGER than `MOBILE` because the cut is set by the content, not the device: two panels at once need
 * more than 900 px for neither to be cramped. It is here, not loose in the component, because
 * `Auth.scss` uses the same number and the two have to move together -- split, between 768 and 900 px
 * the language selector lands in the wrong panel.
 */
export const AUTH_STACKED = '(max-width: 900px)';
