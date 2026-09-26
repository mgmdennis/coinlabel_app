// Shared lookup-bar helpers: pasted-URL extraction and source auto-detection.

/**
 * Pull the bare ID out of a pasted Numista/OCRE catalogue URL — trailing
 * slashes, ".html" and ".jsonld" are dropped — so a pasted link leaves just
 * the number/id in the field and the URL is never rendered at all.
 * Non-URL input is returned trimmed and unchanged.
 */
export const extractLookupValue = (raw) => {
  let val = String(raw || '').trim();
  if (val.includes('numismatics.org/ocre/id/')) {
    val = val.split('numismatics.org/ocre/id/').pop().split(/[?#]/)[0];
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
 * Auto-detect which catalogue a lookup value targets. OCRE ids always start
 * with "ric." and Numista numbers are pure digits, so the two patterns never
 * overlap — detection is deterministic. Returns 'ocre' | 'numista' | null.
 */
export const detectLookupKind = (raw) => {
  const val = String(raw || '').trim();
  if (/^ric\./i.test(val)) return 'ocre';
  if (/^\d+$/.test(val)) return 'numista';
  return null;
};
