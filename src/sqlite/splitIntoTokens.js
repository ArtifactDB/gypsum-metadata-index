export function splitIntoTokens(string) {
    let tokens = string.split(/[^a-zA-Z0-9-]+/);
    return tokens.filter(x => x.length > 0).map(x => x.toLowerCase());
}
