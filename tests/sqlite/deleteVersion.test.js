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

    addVersion(db, "foo", "bar", "whee", true, { "a.txt": utils.mockMetadata["marcille"] }, new Set);
    addVersion(db, "foo", "bar", "whee2", true, { "a.txt": utils.mockMetadata["chicken"] }, new Set);

    let tpayload1 = utils.scanForToken(db, 'chicken');
    expect(tpayload1.length).toBe(1);
    let tpayload2 = utils.scanForToken(db, 'Marcille');
    expect(tpayload2.length).toBe(1);

    // Deletion cascades to all other tables.
    deleteVersion(db, "foo", "bar", "whee");

    tpayload1 = utils.scanForToken(db, 'chicken');
    expect(tpayload1.length).toBe(1);
    tpayload2 = utils.scanForToken(db, 'Marcille');
    expect(tpayload2.length).toBe(0);
})
