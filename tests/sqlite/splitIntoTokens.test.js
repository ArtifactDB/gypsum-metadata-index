import { splitIntoTokens } from "../../src/sqlite/splitIntoTokens.js";

test("splitIntoTokens works correctly", () => {
    // Strips case.
    var split = new Set(splitIntoTokens("Aaron has a little lamb"));
    expect(split.has("aaron")).toBe(true);
    expect(split.has("lamb")).toBe(true);

    // Handles different separators.
    var split = new Set(splitIntoTokens("F-35 Lightning II\nJoint Strike Fighter"));
    expect(split.has("f-35")).toBe(true);
    expect(split.has("ii")).toBe(true);

    var split = new Set(splitIntoTokens("I was confused, tired and lost."));
    expect(split.has("confused")).toBe(true);
    expect(split.has("lost")).toBe(true);

    // Decomposes diacritics as much as possible.
    var split = new Set(splitIntoTokens("Émeline, Renée, Maëlys, Müller"));
    expect(split.has("emeline")).toBe(true);
    expect(split.has("renee")).toBe(true);
    expect(split.has("maelys")).toBe(true);
    expect(split.has("muller")).toBe(true);

    // Otherwise it just holds onto stuff.
    var split = new Set(splitIntoTokens("hi every人 Aaron's here"));
    expect(split.has("aaron")).toBe(true);
    expect(split.has("every人")).toBe(true);
})
