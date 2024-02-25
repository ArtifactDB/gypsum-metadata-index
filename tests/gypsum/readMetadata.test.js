import { readMetadata } from "../../src/gypsum/readMetadata.js";
import * as utils from "./utils.js";

test("readMetadata works in the simple case", async () => {
    let contents = await readMetadata(utils.testUrl, "test-R", "basic", "v1", [ "blah.txt", "bar.txt" ], { parse: false });
    let sub = contents["blah.txt"];
    expect(typeof sub["blah.txt"]).toBe("string");

    sub = contents["bar.txt"];
    expect(typeof sub["foo/bar.txt"]).toBe("string");
})

test("readMetadata works with links", async () => {
    // v2 is linked to v1.
    {
        let contents = await readMetadata(utils.testUrl, "test-R", "basic", "v2", [ "blah.txt", "bar.txt" ], { parse: false });
        let sub = contents["blah.txt"];
        expect(typeof sub["blah.txt"]).toBe("string");

        sub = contents["bar.txt"];
        expect(typeof sub["foo/bar.txt"]).toBe("string");
    }

    // v3 is linked to v1 via v2.
    {
        let contents = await readMetadata(utils.testUrl, "test-R", "basic", "v3", [ "blah.txt", "bar.txt" ], { parse: false });
        let sub = contents["blah.txt"];
        expect(typeof sub["blah.txt"]).toBe("string");

        sub = contents["bar.txt"];
        expect(typeof sub["foo/bar.txt"]).toBe("string");
    }
});
