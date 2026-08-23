import { ViewTransition } from 'react';

/**
 * Crossfades the page body on navigation.
 *
 * Browsers without the View Transitions API simply render the new page with no
 * animation, so this needs no fallback.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
