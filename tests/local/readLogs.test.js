import * as fs from "fs";
import * as path from "path";
import * as utils from "../sqlite/utils.js";
import { readLogs } from "../../src/local/readLogs.js";

test("readLogs works correctly", () => {
    const testdir = utils.setupTestDirectory("readLogs");
    fs.mkdirSync(path.join(testdir, "..logs"));
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-19T05:21:42.12+08:00_000000"), '{ "type": "foo" }')
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-19T05:21:42.12-08:00_000000"), '{ "type": "bar" }')
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-19T05:21:42.12+03:00_000000"), '{ "type": "stuff" }')
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-15T06:21:12.47+08:00_000000"), '{ "type": "whee" }')
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-21T19:01:54.98-08:00_000000"), '{ "type": "blah" }')

    let everything = readLogs(testdir, null)
    everything.sort((a, b) => a.time - b.time);
    expect(everything.map(y => y.log.type)).toEqual([ "whee", "foo", "stuff", "bar", "blah" ]);

    let filtered = readLogs(testdir, new Date("2021-02-18T00:00:00Z")); 
    filtered.sort((a, b) => a.time - b.time);
    expect(filtered.map(y => y.log.type)).toEqual([ "foo", "stuff", "bar", "blah" ]);

    filtered = readLogs(testdir, new Date("2021-02-19T05:21:42.12Z")); 
    filtered.sort((a, b) => a.time - b.time);
    expect(filtered.map(y => y.log.type)).toEqual([ "bar", "blah" ]);

    filtered = readLogs(testdir, new Date("2021-02-20T00:00:00+11:00")); 
    filtered.sort((a, b) => a.time - b.time);
    expect(filtered.map(y => y.log.type)).toEqual([ "bar", "blah" ]);

    filtered = readLogs(testdir, new Date("2021-02-21T01:13:54.98+01:00")); 
    filtered.sort((a, b) => a.time - b.time);
    expect(filtered.map(y => y.log.type)).toEqual([ "blah" ]);
})

test("readLogs skips ill-formed logs", () => {
    const testdir = utils.setupTestDirectory("readLogs");
    fs.mkdirSync(path.join(testdir, "..logs"));
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-19T05:21:42.12+08:00_000000"), '{ "type": "foo" }')
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-19T05:21:42.12+08:00"), '{ "type": "bar" }')
    fs.writeFileSync(path.join(testdir, "..logs", "asdasdasd"), '{ "type": "whee" }')

    let everything = readLogs(testdir, null)
    expect(everything.map(y => y.log.type)).toEqual([ "foo" ]);
})

