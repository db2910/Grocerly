/**
 * Returns the quantity step for a given unit string.
 * Fractional units (kg, litre) use 0.5 increments.
 * Grams use 50g increments.
 * Count-based units use 1.
 */
export function getUnitStep(unit: string): number {
  const u = unit.toLowerCase();
  if (u === 'g' || u === 'gram' || u === 'grams') return 50;
  if (u.includes('kg') || u.includes('kilo')) return 0.5;
  if (u.includes('litre') || u.includes('liter') || u.includes('ltr') || u.includes('l ')) return 0.5;
  return 1;
}

/**
 * Returns a human-readable label for the quantity + unit,
 * e.g. 1.5 kg, 200g, 2 bunches, 3 packs
 */
export function formatQuantityLabel(quantity: number, unit: string): string {
  const u = unit.toLowerCase();
  if (u === 'g' || u === 'gram' || u === 'grams') return `${quantity}g`;
  if (u.includes('kg') || u.includes('kilo')) return `${quantity} kg`;
  if (u.includes('litre') || u.includes('liter') || u.includes('ltr')) return `${quantity} L`;
  return `${quantity} × ${unit}`;
}
