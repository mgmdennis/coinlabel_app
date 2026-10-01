// Label details text formatting.
//
// The stored `details` value always keeps FULL words — abbreviation and the
// smaller font are presentation-only (see label.jsx), applied when the text
// won't fit or grade notes take space on the label.

// Character budgets for the details area on a 44mm label. Tunable — measured
// against the default 45% details width at the 6cqw font.
export const DETAILS_ABBREV_THRESHOLD = 200;
export const DETAILS_COMPACT_THRESHOLD = 210;

const ABBREVIATIONS = [
  [/\bstanding\b/gi, 'stg.'],
  [/\bseated\b/gi, 'seat.'],
  [/\bwalking\b/gi, 'walk.'],
  [/\brunning\b/gi, 'run.'],
  [/\bkneeling\b/gi, 'kneel.'],
  [/\bright\b/gi, 'r.'],
  [/\bleft\b/gi, 'l.'],
  [/\bholding\b/gi, 'hold.'],
  [/\bwearing\b/gi, 'wear.'],
  [/\bcrowned\b/gi, 'crown.'],
  [/\bdraped\b/gi, 'drap.'],
  [/\bradiate\b/gi, 'rad.'],
  [/\blaureate\b/gi, 'laur.'],
];

export const abbreviate = (text) =>
  String(text || '').split('\n').map((line) => {
    let out = line;
    for (const [re, abbr] of ABBREVIATIONS) out = out.replace(re, abbr);
    return out.replace(/\.{2,}/g, '.');
  }).join('\n');

/**
 * Compose the label's obverse lines from an OCRE obverse description:
 *   "Bust of Hadrian, laureate, draped, right, viewed from front"
 *     -> "(Hadrian)\nObv: Bust, laureate, draped, right."
 *   "Bust of Philip the Arab, radiate, draped, cuirassed, right"
 *     -> "(Philip)\nObv: Bust, radiate, draped, cuirassed, right."
 * The ruler moves into the parenthetical anchor (epithets and numerals drop
 * from it), the bust noun stays as the Obv line's subject, and "viewed from
 * ..." framing noise is dropped. Unrecognized descriptions pass through.
 */
export const formatObverse = (desc) => {
  if (!desc) return '';
  const text = String(desc).trim().replace(/\.$/, '');
  const head = /^(?:(Laureate|Radiate|Draped|Cuirassed)\s+)?([Bb]ust|[Hh]ead|[Pp]ortrait)\s+of\s+([^.]+)$/.exec(text);
  if (!head) return text;

  // Split modifiers at commas; they never carry commas inside.
  const parts = head[3].split(',').map((s) => s.trim()).filter(Boolean);
  // The ruler is the leading words up to an epithet/numeral — keep the plain
  // name for the "(Ruler)" anchor.
  let ruler = parts.shift() || '';
  ruler = ruler.replace(/\s+(the\s+[A-Za-z]+)$/i, '').replace(/\s+[IVX]+$/, '').trim();

  let modifiers = [];
  if (head[1]) modifiers.push(head[1].toLowerCase());
  modifiers = modifiers.concat(parts.filter((p) => !/^viewed from\b/i.test(p)));
  modifiers = modifiers.map((p) => p.replace(/,?\s*viewed from.*$/gi, ''))
    .filter((p) => !/^(?:sometimes)?\s*$/.test(p));

  const body = [head[2][0].toUpperCase() + head[2].slice(1).toLowerCase(), ...modifiers].filter(Boolean).join(', ');
  return `Ruler: ${ruler}\nObv: ${body ? body + '.' : ''}`.trim();
};
