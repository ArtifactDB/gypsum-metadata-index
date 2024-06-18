import * as path from "path";
import * as utils from "../utils.js";
import Database from "better-sqlite3"
import { addVersion } from "../../src/sqlite/addVersion.js"; 
import { deleteVersion } from "../../src/sqlite/deleteVersion.js"; 
import { createTables } from "../../src/sqlite/createTables.js"; 

test("Versions can be deleted", () => {
    const testdir = utils.setupTestDirectory("deleteVersion");
    let opath = path.join(testdir, "test.sqlite3")
    let db = Database(opath);
    createTables(db);

    addVersion(db, "foo", "bar", "whee", true, utils.mockSummary, { "a.txt": utils.mockMetadata["marcille"] });
    addVersion(db, "foo", "bar", "whee2", true, utils.mockSummary, { "a.txt": utils.mockMetadata["chicken"] });

    let tpayload1 = utils.scanForToken(db, 'chicken');
    expect(tpayload1.length).toBeGreaterThan(0);
    let tpayload2 = utils.scanForToken(db, 'marcille');
    expect(tpayload2.length).toBeGreaterThan(0);

    // Deletion cascades to all other tables.
    deleteVersion(db, "foo", "bar", "whee");

    tpayload1 = utils.scanForToken(db, 'chicken');
    expect(tpayload1.length).toBeGreaterThan(0);
    tpayload2 = utils.scanForToken(db, 'marcille');
    expect(tpayload2.length).toBe(0);
})
