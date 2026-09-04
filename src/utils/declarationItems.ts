/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Turning one Form 26 declaration string into the line items it actually
 * contains.
 *
 * This lives outside the components because two of them read the same strings
 * for different purposes: the dossier renders them as text, and the land-assets
 * map plots the properties among them. A second parser would be a second set of
 * answers about what a candidate declared, so there is only this one.
 *
 * The Node-side build scripts parse the same strings with the same rules — see
 * scripts/lib/propertyRecords.cjs, which carries the field-coverage figures
 * measured across all 11,107 declared properties.
 */

export function tidy(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Sign is handled separately from magnitude: 173 candidates declare liabilities
 * greater than assets, and a raw negative fell through the Cr/L branches to an
 * unabbreviated "₹-16,54,70,630".
 */
export const formatINR = (n: number) => {
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);
  if (v >= 10000000) return `${sign}₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `${sign}₹${(v / 100000).toFixed(2)} L`;
  return `${sign}₹${v.toLocaleString('en-IN')}`;
};

/**
 * The ECI export concatenates every line item into one string, each ending with
 * its value and a rounded magnitude hint:
 *
 *   "Axis Bank Avinashi Branch 52,829 52 Thou+ BOB Nanjappa Road 24,93,713 24 Lacs+ …"
 *
 * That boundary is the only reliable separator, and it holds for ~98% of
 * declared values. Anything that does not match is left intact rather than
 * guessed at.
 */
const ITEM_BOUNDARY = /(?:([\d][\d,.]*)\s+)?([\d][\d,.]*)\s*(Hund|Thou|Lacs?|Lakhs?|Crores?|Cr)\+/gi;

const MAGNITUDE: Record<string, number> = {
  hund: 100, thou: 1000, lac: 100000, lacs: 100000,
  lakh: 100000, lakhs: 100000, crore: 10000000, crores: 10000000, cr: 10000000,
};

/** Labelled sub-fields the ECI embeds in property declarations. */
const PROPERTY_FIELDS: Array<[string, RegExp]> = [
  ['Total area', /Total Area\s+([^]*?)(?=Built Up Area|Whether Inherited|Purchase Date|Purchase Cost|Development Cost|$)/i],
  ['Built-up area', /Built Up Area\s+([^]*?)(?=Whether Inherited|Purchase Date|Purchase Cost|Development Cost|$)/i],
  ['Inherited', /Whether Inherited\s+([YN])\b/i],
  ['Purchase date', /Purchase Date\s+([\d-]+)/i],
  ['Purchase cost', /Purchase Cost\s+([\d.,]+)/i],
  ['Development cost', /Development Cost\s+([\d.,]+)/i],
];

export interface DeclaredItem {
  description: string;
  amount: number | null;
  amountText: string | null;
  attributes: Array<{ label: string; value: string }>;
}

function parseAmount(exact?: string, rounded?: string, magnitude?: string): number | null {
  if (exact) {
    const n = parseFloat(exact.replace(/,/g, ''));
    if (Number.isFinite(n)) return n;
  }
  if (rounded && magnitude) {
    const n = parseFloat(rounded.replace(/,/g, ''));
    const mult = MAGNITUDE[magnitude.toLowerCase()];
    if (Number.isFinite(n) && mult) return n * mult;
  }
  return null;
}

function extractAttributes(text: string): { description: string; attributes: DeclaredItem['attributes'] } {
  const attributes: DeclaredItem['attributes'] = [];
  let description = text;

  for (const [label, pattern] of PROPERTY_FIELDS) {
    const match = description.match(pattern);
    if (!match) continue;
    const value = (match[1] || '').trim();
    if (value && !/^0*(\.0+)?$/.test(value)) {
      let display = value;
      if (label === 'Inherited') {
        display = value.toUpperCase() === 'Y' ? 'Yes' : 'No';
      } else if (label.endsWith('cost')) {
        const n = parseFloat(value.replace(/,/g, ''));
        if (Number.isFinite(n)) display = formatINR(n);
      }
      attributes.push({ label, value: display });
    }
    description = description.replace(match[0], ' ');
  }

  return { description: tidy(description), attributes };
}

export function itemizeDeclaration(raw: string): DeclaredItem[] {
  const source = tidy(raw);
  if (!source) return [];

  const items: DeclaredItem[] = [];
  let cursor = 0;

  ITEM_BOUNDARY.lastIndex = 0;
  for (const match of source.matchAll(ITEM_BOUNDARY)) {
    const index = match.index ?? 0;
    const head = source.slice(cursor, index);
    const { description, attributes } = extractAttributes(head);
    items.push({
      description,
      amount: parseAmount(match[1], match[2], match[3]),
      amountText: match[0].trim(),
      attributes,
    });
    cursor = index + match[0].length;
  }

  const tail = source.slice(cursor).trim();
  if (tail) {
    const { description, attributes } = extractAttributes(tail);
    if (description || attributes.length) {
      items.push({ description, amount: null, amountText: null, attributes });
    }
  }

  // A single unsplittable blob is not worth dressing up as a list.
  if (items.length === 1 && items[0].amount === null && !items[0].attributes.length) return [];
  return items;
}
