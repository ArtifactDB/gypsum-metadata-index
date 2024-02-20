import * as fs from "fs";
import * as path from "path";
import * as utils from "../utils.js";
import { readMetadata } from "../../src/local/readMetadata.js";

test("readMetadata works correctly", async () => {
    const testdir = utils.setupTestDirectory("readMetadata");
    fs.mkdirSync(path.join(testdir, "foo"));
    fs.mkdirSync(path.join(testdir, "foo", "bar"));
    fs.mkdirSync(path.join(testdir, "foo", "bar", "whee"));

    fs.writeFileSync(path.join(testdir, "foo", "bar", "whee", "_metadata.json"), '{ "title": "shigure" }');
    fs.writeFileSync(path.join(testdir, "foo", "bar", "whee", "_alternative.json"), '{ "title": "yuudachi" }');

    fs.mkdirSync(path.join(testdir, "foo", "bar", "whee", "stuff"));
    fs.writeFileSync(path.join(testdir, "foo", "bar", "whee", "stuff", "_metadata.json"), '{ "title": "shimakaze" }');

    fs.mkdirSync(path.join(testdir, "foo", "bar", "whee", "stuff", "blah"));
    fs.writeFileSync(path.join(testdir, "foo", "bar", "whee", "stuff", "blah", "_alternative.json"), '{ "title": "murasame" }');

    fs.mkdirSync(path.join(testdir, "foo", "bar", "whee", "random"));
    fs.writeFileSync(path.join(testdir, "foo", "bar", "whee", "random", "_alternative.json"), '{ "title": "shiratsuyu" }');

    {
        let solo = await readMetadata(testdir, "foo", "bar", "whee", [ "_metadata.json" ])
        expect(Object.keys(solo)).toEqual([ "_metadata.json" ]);

        let meta = solo["_metadata.json"]; 
        expect(Object.keys(meta).length).toEqual(2);
        expect(meta["."].title).toEqual("shigure");
        expect(meta["stuff"].title).toEqual("shimakaze");
    }

    {
        let multi = await readMetadata(testdir, "foo", "bar", "whee", [ "_metadata.json", "_alternative.json" ])
        expect(Object.keys(multi)).toEqual([ "_metadata.json", "_alternative.json" ]);

        let meta = multi["_metadata.json"]; 
        expect(Object.keys(meta).length).toEqual(2);
        expect(meta["."].title).toEqual("shigure");
        expect(meta["stuff"].title).toEqual("shimakaze");

        meta = multi["_alternative.json"]; 
        expect(Object.keys(meta).length).toEqual(3);
        expect(meta["."].title).toEqual("yuudachi");
        expect(meta["stuff/blah"].title).toEqual("murasame");
        expect(meta["random"].title).toEqual("shiratsuyu");
    }
})
