import * as fs from "fs";
import * as path from "path";
import * as utils from "../utils.js";
import { listLogs } from "../../src/local/listLogs.js";

test("listLogs works correctly", () => {
    const testdir = utils.setupTestDirectory("listLogs");
    fs.mkdirSync(path.join(testdir, "..logs"));
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-19T05:21:42.12+08:00_000000"), '{ "type": "foo" }')
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-19T05:21:42.12-08:00_000000"), '{ "type": "bar" }')
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-19T05:21:42.12+03:00_000000"), '{ "type": "stuff" }')
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-15T06:21:12.47+08:00_000000"), '{ "type": "whee" }')
    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-21T19:01:54.98-08:00_000000"), '{ "type": "blah" }')

    let everything = listLogs(testdir, "2020-02-18T00:00:00Z")
    expect(everything.length).toBe(5);

    let filtered = listLogs(testdir, "2021-02-18T00:00:00Z");
    expect(filtered.length).toBe(4); // foo, bar, stuff and blah.

    filtered = listLogs(testdir, ("2021-02-19T05:21:42.12+05:00")); 
    expect(filtered.length).toBe(3); // foo, bar and blah

    filtered = listLogs(testdir, "2021-02-20T00:00:00+11:00");
    expect(filtered.length).toBe(1); // only blah
})

//test("listLogs skips ill-formed logs", () => {
//    const testdir = utils.setupTestDirectory("listLogs");
//    fs.mkdirSync(path.join(testdir, "..logs"));
//    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-19T05:21:42.12+08:00_000000"), '{ "type": "foo" }')
//    fs.writeFileSync(path.join(testdir, "..logs", "2021-02-19T05:21:42.12+08:00"), '{ "type": "bar" }')
//    fs.writeFileSync(path.join(testdir, "..logs", "asdasdasd"), '{ "type": "whee" }')
//
//    let everything = listLogs(testdir, null)
//    expect(everything.map(y => y.log.type)).toEqual([ "foo" ]);
//})
//
