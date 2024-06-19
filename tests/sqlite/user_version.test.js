import * as fs from "fs";
import * as path from "path";
import * as utils from "../utils.js";
import Database from "better-sqlite3"
import { createTables } from "../../src/sqlite/createTables.js"; 

test("User and package versions are consistent", () => {
    const testdir = utils.setupTestDirectory("user_version");
    let opath = path.join(testdir, "test.sqlite3")
    let db = Database(opath);
    createTables(db);

    const user = db.prepare("PRAGMA user_version").get();
    const pkg = JSON.parse(fs.readFileSync("package.json", { encoding: "utf8" }))

    let expected = 0;
    for (const [i, a] of Object.entries(pkg.version.split("."))) {
        expected += Number(a) * 10 ** (3 * (2 - i));
    }

    expect(user.user_version).toBe(expected);
})
