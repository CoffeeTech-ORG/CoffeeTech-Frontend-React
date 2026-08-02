/**
 * Y-axis ticks at numbers a person reads without effort. `axisDomainFor` already computes the
 * domain from the data and the engine's reference; this splits it into round values.
 *
 * The step between ticks is rounded to 1, 2 or 5 times a power of ten (2, 5, 10, 20, 50…), the
 * jumps the eye adds on its own: ticks at 15 / 20 / 25 read far better than 13.7 / 19.4 / 25.1.
 * Ticks are computed INSIDE the domain, without widening it, or the reference line would move.
 */
export function niceTicks(lo: number, hi: number, target = 5): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return [];

  const crudo = (hi - lo) / Math.max(2, target);
  const magnitud = 10 ** Math.floor(Math.log10(crudo));
  const normalizado = crudo / magnitud;
  const paso = (normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10) * magnitud;

  const marcas: number[] = [];
  // Starts at the first multiple of the step that falls inside the domain.
  for (let v = Math.ceil(lo / paso) * paso; v <= hi + paso * 1e-9; v += paso) {
    // Floating-point accumulation leaves values like 19.999999999999996; rounding to the step's
    // own decimal cleans them up without inventing precision.
    const decimales = Math.max(0, -Math.floor(Math.log10(paso)));
    marcas.push(Number(v.toFixed(decimales)));
  }
  return marcas;
}

/**
 * How a Y-axis tick is written. The decimals come from the step, not the value: on an axis
 * stepping by 5, "132.4" suggests a precision the scale does not have.
 */
export function formatTickValue(value: number, ticks: number[]): string {
  if (ticks.length < 2) return String(Math.round(value));
  const paso = Math.abs(ticks[1] - ticks[0]);
  const decimales = paso >= 1 ? 0 : Math.max(0, -Math.floor(Math.log10(paso)));
  return value.toFixed(decimales);
}
