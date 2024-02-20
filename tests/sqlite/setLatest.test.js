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

    addVersion(db, "foo", "bar", "whee", true, { "a.txt": utils.mockMetadata["chicken"] });
    addVersion(db, "foo", "bar", "whee2", true, { "a.txt": utils.mockMetadata["marcille"] });

    let tpayload1 = utils.scanForToken(db, "chicken", { latest: true });
    expect(tpayload1.length).toBe(0);
    let tpayload2 = utils.scanForToken(db, "marcille", { latest: true });
    expect(tpayload2.length).toBeGreaterThan(0);

    setLatest(db, "foo", "bar", "whee");

    tpayload1 = utils.scanForToken(db, "chicken", { latest: true });
    expect(tpayload1.length).toBeGreaterThan(0);
    tpayload2 = utils.scanForToken(db, "marcille", { latest: true });
    expect(tpayload2.length).toBe(0);
})
