import * as path from "path";
import * as utils from "../utils.js";
import Database from "better-sqlite3"
import { setLatest } from "../../src/sqlite/setLatest.js"; 
import { addVersion } from "../../src/sqlite/addVersion.js"; 
import { createTables } from "../../src/sqlite/createTables.js"; 

test("We can manually set a different latest version", () => {
    const testdir = utils.setupTestDirectory("setLatest");
    let opath = path.join(testdir, "test.sqlite3")
    let db = Database(opath);
    createTables(db);

    addVersion(db, "foo", "bar", "whee", true, { "a.txt": utils.mockMetadata["chicken"] }, new Set);
    addVersion(db, "foo", "bar", "whee2", true, { "a.txt": utils.mockMetadata["marcille"] }, new Set);

    let tpayload1 = db.prepare("SELECT * FROM tokens LEFT JOIN paths ON paths.pid = tokens.pid LEFT JOIN versions ON paths.vid = versions.vid WHERE token = 'chicken' AND versions.latest = 1").all();
    expect(tpayload1.length).toBe(0);
    let tpayload2 = db.prepare("SELECT * FROM tokens LEFT JOIN paths ON paths.pid = tokens.pid LEFT JOIN versions ON paths.vid = versions.vid WHERE token = 'Marcille' AND versions.latest = 1").all();
    expect(tpayload2.length).toBe(1);

    // Deletion cascades to all other tables.
    setLatest(db, "foo", "bar", "whee");

    tpayload1 = db.prepare("SELECT * FROM tokens LEFT JOIN paths ON paths.pid = tokens.pid LEFT JOIN versions ON paths.vid = versions.vid WHERE token = 'chicken' AND versions.latest = 1").all();
    expect(tpayload1.length).toBe(1);
    tpayload2 = db.prepare("SELECT * FROM tokens LEFT JOIN paths ON paths.pid = tokens.pid LEFT JOIN versions ON paths.vid = versions.vid WHERE token = 'Marcille' AND versions.latest = 1").all();
    expect(tpayload2.length).toBe(0);
})
