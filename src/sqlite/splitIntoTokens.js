export function splitIntoTokens(string) {
    // Normalizing the diacritics.
    string = string.normalize("NFKD").replace(/\p{Diacritic}/gu, "");

    // Case folding.
    string = string.toLowerCase();

    // Using the same rules, as much as possible, as fts5's unicode tokenizer (see 4.3.1 of https://www.sqlite.org/fts5.html).
    // The only exception is that we don't split on dashes because these are informative for scientific applications.
    let tokens = string.split(/[^\p{N}\p{L}\p{Co}-]/u)

    let filtered = tokens.filter(x => x.length > 0);
    return Array.from(new Set(filtered));
}
