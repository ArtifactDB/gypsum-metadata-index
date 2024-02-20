import * as fs from "fs";
import * as path from "path";
import * as utils from "../utils.js";
import { fetchLatest } from "../../src/local/fetchLatest.js";

test("fetchLatest works correctly", async () => {
    const testdir = utils.setupTestDirectory("fetchLatest");
    fs.mkdirSync(path.join(testdir, "foo"));
    fs.mkdirSync(path.join(testdir, "foo", "bar"));
    expect(await fetchLatest(testdir, "foo", "bar")).toBeNull();

    fs.writeFileSync(path.join(testdir, "foo", "bar", "..latest"), '{ "version": "blah" }');
    expect(await fetchLatest(testdir, "foo", "bar")).toEqual("blah");
    expect(await fetchLatest(testdir, "foo", "whee")).toBeNull();
})
