import * as path from "path";
import * as utils from "./utils.js";
import Database from "better-sqlite3"
import { addVersion } from "../../src/sqlite/addVersion.js"; 
import { deleteVersion } from "../../src/sqlite/deleteVersion.js"; 
import { createTables } from "../../src/sqlite/createTables.js"; 

test("Versions can be deleted", () => {
    const testdir = utils.setupTestDirectory("deleteVersion");
    let opath = path.join(testdir, "test.sqlite3")
    let db = Database(opath);
    createTables(db);

    addVersion(db, "foo", "bar", "whee", true, { "a.txt": utils.mockMetadata2() }, new Set);
    addVersion(db, "foo", "bar", "whee2", true, { "a.txt": utils.mockMetadata1() }, new Set);

    let tpayload1 = db.prepare("SELECT * FROM tokens WHERE token = 'chicken'").all();
    expect(tpayload1.length).toBe(1);
    let tpayload2 = db.prepare("SELECT * FROM tokens WHERE token = 'Marcille'").all();
    expect(tpayload2.length).toBe(1);

    // Deletion cascades to all other tables.
    deleteVersion(db, "foo", "bar", "whee");

    tpayload1 = db.prepare("SELECT * FROM tokens WHERE token = 'chicken'").all();
    expect(tpayload1.length).toBe(1);
    tpayload2 = db.prepare("SELECT * FROM tokens WHERE token = 'Marcille'").all();
    expect(tpayload2.length).toBe(0);
})
