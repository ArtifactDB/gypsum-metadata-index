import * as path from "path";
import * as utils from "../utils.js";
import Database from "better-sqlite3"
import { addVersion } from "../../src/sqlite/addVersion.js"; 
import { deleteProject } from "../../src/sqlite/deleteProject.js"; 
import { createTables } from "../../src/sqlite/createTables.js"; 

test("Projects can be deleted", () => {
    const testdir = utils.setupTestDirectory("deleteProject");
    let opath = path.join(testdir, "test.sqlite3")
    let db = Database(opath);
    createTables(db);

    addVersion(db, "foo", "bar", "whee", true, { "a.txt": utils.mockMetadata["marcille"] });
    addVersion(db, "foo", "bar2", "whee", true, { "b.txt": utils.mockMetadata["marcille"] });
    addVersion(db, "foo2", "stuff", "whee", true, { "a.txt": utils.mockMetadata["chicken"] });

    let tpayload1 = utils.scanForToken(db, 'chicken');
    expect(tpayload1.length).toBeGreaterThan(0);
    let tpayload2 = utils.scanForToken(db, 'donato');
    expect(tpayload2.length).toBeGreaterThan(0);

    // Deletion cascades to all other tables.
    deleteProject(db, "foo");

    tpayload1 = utils.scanForToken(db, 'chicken');
    expect(tpayload1.length).toBeGreaterThan(0);
    tpayload2 = utils.scanForToken(db, 'donato');
    expect(tpayload2.length).toBe(0);
})
