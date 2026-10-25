// Shared lookup-bar helpers: pasted-URL extraction and source auto-detection.

/**
 * Pull the bare ID out of a pasted Numista/OCRE catalogue URL — trailing
 * slashes, ".html" and ".jsonld" are dropped — so a pasted link leaves just
 * the number/id in the field and the URL is never rendered at all.
 * Non-URL input is returned trimmed and unchanged.
 */
export const extractLookupValue = (raw) => {
  let val = String(raw || '').trim();
  if (/numismatics\.org\/(ocr[oe]{1,2}|crro|sco|pella|pco|agco)\/id\//i.test(val)) {
    // All the numismatics.org TypeSeries datasets share the URL shape:
    // OCRE (…/ocre/id/…), CRRO (…/crro/id/…) and the HRC family
    // (SCO/PELLA/PCO/AGCO under their own path segments).
    val = val.split('/id/').pop().split(/[?#]/)[0];
    val = val.replace(/[/\s]+$/, '').replace(/\.(html|jsonld)$/i, '');
  } else if (val.includes('numista.com/catalogue/pieces')) {
    // Long form: https://en.numista.com/catalogue/pieces247381.html
    val = val.split('pieces').pop().replace(/[^0-9]/g, '');
  } else {
    // Short permalink: https://en.numista.com/2323 — a bare number after the
    // numista.com root (optional scheme/subdomain, optional trailing path or
    // query). These never matched the long-form pattern, which is why pasted
    // short links used to sit in the field as full URLs.
    const short = /^(?:https?:\/\/)?(?:[a-z]{2}\.)?numista\.com\/(\d+)(?:[\/?#].*)?$/i.exec(val);
    if (short) val = short[1];
  }
  return val;
};

/**
 * Auto-detect which catalogue a lookup value targets. Id prefixes are
 * disjoint across every supported dataset — OCRE ids start with "ric.",
 * CRRO with "rrc-", and the HRC family by series (sc. = Seleucid Coins,
 * price. = Price/Macedon, cpe. = CPE/Ptolemies, newell. = AGCO's Newell
 * numbering; other AGCO series ids may exist — extend here when seen); Numista numbers are pure
 * digits. AGCO (Antigonid) has no id pattern on record yet — add it here
 * once discovered. Returns the detected dataset kind or null.
 */
export const detectLookupKind = (raw) => {
  const val = String(raw || '').trim();
  if (/^ric\./i.test(val)) return 'ocre';
  if (/^rrc-/i.test(val)) return 'crro';
  if (/^sc\./i.test(val)) return 'sco';
  if (/^price\./i.test(val)) return 'pella';
  if (/^cpe\./i.test(val)) return 'pco';
  if (/^newell\./i.test(val)) return 'agco';
  if (/^\d+$/.test(val)) return 'numista';
  return null;
};
