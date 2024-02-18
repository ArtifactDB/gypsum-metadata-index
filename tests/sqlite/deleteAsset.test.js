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

    addVersion(db, "foo", "bar", "whee", true, { "a.txt": utils.mockMetadata["marcille"] }, new Set);
    addVersion(db, "foo", "bar", "whee2", true, { "b.txt": utils.mockMetadata["marcille"] }, new Set);
    addVersion(db, "foo", "stuff", "whee", true, { "a.txt": utils.mockMetadata["chicken"] }, new Set);

    let tpayload1 = db.prepare("SELECT * FROM tokens WHERE token = 'chicken'").all();
    expect(tpayload1.length).toBe(1);
    let tpayload2 = db.prepare("SELECT * FROM tokens WHERE token = 'Donato'").all();
    expect(tpayload2.length).toBe(2);

    // Deletion cascades to all other tables.
    deleteAsset(db, "foo", "bar");

    tpayload1 = db.prepare("SELECT * FROM tokens WHERE token = 'chicken'").all();
    expect(tpayload1.length).toBe(1);
    tpayload2 = db.prepare("SELECT * FROM tokens WHERE token = 'Donato'").all();
    expect(tpayload2.length).toBe(0);
})
