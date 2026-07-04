/**
 * Linen grain overlay — fixed full-viewport SVG noise at 50% opacity,
 * multiply-blended. This is what makes the cream feel like paper,
 * not plastic. Rendered server-side; no interactivity.
 */
export function LinenGrain() {
  return <div aria-hidden="true" className="linen-grain" />;
}
