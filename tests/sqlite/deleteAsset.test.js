import * as path from "path";
import * as utils from "../utils.js";
import Database from "better-sqlite3"
import { addVersion } from "../../src/sqlite/addVersion.js"; 
import { deleteAsset } from "../../src/sqlite/deleteAsset.js"; 
import { createTables } from "../../src/sqlite/createTables.js"; 

test("Assets can be deleted", () => {
    const testdir = utils.setupTestDirectory("deleteAsset");
    let opath = path.join(testdir, "test.sqlite3")
    let db = Database(opath);
    createTables(db);

    addVersion(db, "foo", "bar", "whee", true, { "a.txt": utils.mockMetadata["marcille"] });
    addVersion(db, "foo", "bar", "whee2", true, { "b.txt": utils.mockMetadata["marcille"] });
    addVersion(db, "foo", "stuff", "whee", true, { "a.txt": utils.mockMetadata["chicken"] });

    let tpayload1 = utils.scanForToken(db, "chicken");
    expect(tpayload1.length).toBeGreaterThan(0);
    let tpayload2 = utils.scanForToken(db, "donato");
    expect(tpayload2.length).toBeGreaterThan(0);

    // Deletion cascades to all other tables.
    deleteAsset(db, "foo", "bar");

    tpayload1 = utils.scanForToken(db, "chicken");
    expect(tpayload1.length).toBeGreaterThan(1);
    tpayload2 = utils.scanForToken(db, "donato");
    expect(tpayload2.length).toBe(0);
})
