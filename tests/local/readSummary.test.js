import * as fs from "fs";
import * as path from "path";
import * as utils from "../utils.js";
import { readSummary } from "../../src/local/readSummary.js";

test("readSummary works correctly", async () => {
    const testdir = utils.setupTestDirectory("readSummary");
    fs.mkdirSync(path.join(testdir, "foo"));
    fs.mkdirSync(path.join(testdir, "foo", "bar"));
    fs.mkdirSync(path.join(testdir, "foo", "bar", "whee"));
    fs.writeFileSync(path.join(testdir, "foo", "bar", "whee", "..summary"), '{ "upload_user_id": "shigure", "on_probation": true }');

    const summ = await readSummary(testdir, "foo", "bar", "whee"); 
    expect(summ.upload_user_id).toBe("shigure");
    expect(summ.on_probation).toBe(true);
})
