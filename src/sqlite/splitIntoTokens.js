export function splitIntoTokens(string) {
    // Normalizing the diacritics.
    string = string.normalize("NFKD").replace(/\p{Diacritic}/gu, "");

    // Case folding.
    string = string.toLowerCase();

    // Splitting on ASCII non-alphanumerics (excluding dash, which is often
    // useful in scientific text).  This uses a non-consuming regular
    // expression (?=...) to mimic AND, whereby we split on anything that's
    // ASCII and not a lower-case alphanumeric/dash.
    let tokens = string.split(/(?=[^a-z0-9-])[\x00-\x7F]/)

    let standardized = tokens.filter(x => x.length > 0);
    return Array.from(new Set(standardized));
}
