import * as fs from "fs";
import * as path from "path";
import * as utils from "../utils.js";
import { readLog } from "../../src/local/readLog.js";

test("readLog works correctly", () => {
    const testdir = utils.setupTestDirectory("readLog");
    fs.mkdirSync(path.join(testdir, "..logs"));

    const name = "2021-02-19T05:21:42.12+08:00_000000";
    fs.writeFileSync(path.join(testdir, "..logs", name), '{ "type": "foo" }')

    let curlog = readLog(testdir, name);
    expect(curlog.type).toBe("foo");
})
