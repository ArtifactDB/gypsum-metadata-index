export function splitIntoTokens(string) {
    let tokens = string.split(/[^a-zA-Z0-9-]+/);
    let standardized = tokens.filter(x => x.length > 0).map(x => x.toLowerCase());
    return Array.from(new Set(standardized));
}
