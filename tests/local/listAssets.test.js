import * as fs from "fs";
import * as path from "path";
import * as utils from "../sqlite/utils.js";
import { listAssets } from "../../src/local/listAssets.js";

test("listAssets works correctly", () => {
    const testdir = utils.setupTestDirectory("listAssets");
    fs.mkdirSync(path.join(testdir, "foo"));
    fs.mkdirSync(path.join(testdir, "foo", "bar"));
    fs.mkdirSync(path.join(testdir, "foo", "whee"));
    fs.mkdirSync(path.join(testdir, "foo", "..other"));
    fs.writeFileSync(path.join(testdir, "foo", "whee"), "asdasd");
    fs.writeFileSync(path.join(testdir, "foo", "..permissions"), "asdasd");
    fs.writeFileSync(path.join(testdir, "foo", "..summary"), "asdasd");

    const listing = listAssets(testdir, "foo");
    listing.sort();
    expect(listing).toEqual(["bar", "whee"]);
})
