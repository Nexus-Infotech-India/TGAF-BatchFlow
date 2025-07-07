/**
 * Converts a quantity from one unit to the base unit.
 * Supported base units: ton, kg, g, litre, ml, piece
 * Supported conversions: g <-> kg <-> ton, ml <-> litre, etc.
 */
export function convertToBaseUOM(
  quantity: number,
  fromUnit: string,
  baseUnit: string
): number {
  const from = fromUnit.toLowerCase().trim();
  const base = baseUnit.toLowerCase().trim();
  const conversions: Record<string, Record<string, number>> = {
    ton:    { ton: 1, tonne: 1, tonnes: 1, tons: 1, kg: 1 / 1000, g: 1 / 1_000_000 },
    tonne:  { ton: 1, tonne: 1, tonnes: 1, tons: 1, kg: 1 / 1000, g: 1 / 1_000_000 },
    tonnes: { ton: 1, tonne: 1, tonnes: 1, tons: 1, kg: 1 / 1000, g: 1 / 1_000_000 },
    tons:   { ton: 1, tonne: 1, tonnes: 1, tons: 1, kg: 1 / 1000, g: 1 / 1_000_000 },
    kg:     { kg: 1, g: 1 / 1000, ton: 1000, tonne: 1000, tonnes: 1000, tons: 1000 },
    g:      { g: 1, kg: 1000, ton: 1_000_000, tonne: 1_000_000, tonnes: 1_000_000, tons: 1_000_000 },
    litre:  { litre: 1, liter: 1, ml: 1 / 1000 },
    liter:  { litre: 1, liter: 1, ml: 1 / 1000 },
    ml:     { ml: 1, litre: 1000, liter: 1000 },
    piece:  { piece: 1, pcs: 1 },
    pcs:    { pcs: 1, piece: 1 },
  };

  if (!conversions[base] || !conversions[base][from]) {
    throw new Error(`Cannot convert from ${from} to ${base}`);
  }

  return quantity * conversions[base][from];
}