/**
 * The dark panel palette, shared by the landing hero and the dashboard band.
 *
 * These are literals rather than theme tokens on purpose. The token ramps
 * invert under dark mode, which would turn a panel that is meant to be dark in
 * both themes light in one of them.
 */
export const NIGHT = '#0b1824';
export const PANEL = '#13263a';
export const EDGE = '#24435f';
export const SKY = '#8fb3d1';
export const DIM = '#6d8ead';
export const FLAME = '#e07f5c';

/** A soft pool of colour behind a dark panel. */
export const glow = (colour: string) =>
  `radial-gradient(circle, ${colour} 0%, transparent 70%)`;
