import * as fs from "fs";
import * as path from "path";
import * as utils from "../utils.js";
import { listVersions } from "../../src/local/listVersions.js";

test("listVersions works correctly", async () => {
    const testdir = utils.setupTestDirectory("listVersions");
    fs.mkdirSync(path.join(testdir, "foo"));
    fs.mkdirSync(path.join(testdir, "foo", "bar"));
    fs.mkdirSync(path.join(testdir, "foo", "bar", "whee"));
    fs.mkdirSync(path.join(testdir, "foo", "bar", "stuff"));
    fs.writeFileSync(path.join(testdir, "foo", "bar", "..latest"), "blahblahblah");

    const listing = await listVersions(testdir, "foo", "bar");
    listing.sort();
    expect(listing).toEqual(["stuff", "whee"]);
})
