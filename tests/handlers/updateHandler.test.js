import * as path from "path";
import * as utils from "../utils.js";
import { createTables } from "../../src/sqlite/createTables.js";
import { addVersion } from "../../src/sqlite/addVersion.js";
import { updateHandler } from "../../src/handlers/updateHandler.js";
import Database from "better-sqlite3";

test("updateHandler adds versions correctly", async () => {
    const testdir = utils.setupTestDirectory("updateHandler");
    let all_paths = {};
    let all_tokenizable = {};
    for (const p of [ "_meta", "_alt" ]) {
        let opath = path.join(testdir, "test" + p + ".sqlite3")
        let db = Database(opath);
        createTables(db);
        db.close();
        all_paths[p] = opath;
        all_tokenizable[p] = new Set(["description", "motto"]);
    }

    await updateHandler(
        all_paths, 
        new Date,
        (threshold) => {
            return [
                {
                    time: new Date(threshold.getTime() + 100),
                    log: { type: "add-version", project: "test", asset: "foo", version: "whee" }
                },
                {
                    time: new Date(threshold.getTime() + 10),
                    log: { type: "add-version", project: "retest", asset: "stuff", version: "bar", latest: true }
                }
            ]
        },
        (project, asset, version, to_extract) => {
            if (project == "test") {
                return {
                    "_meta": { "AAA.json": utils.mockMetadata["marcille"] },
                    "_alt": { "BBB/CCC.txt": utils.mockMetadata["chicken"] }
                }
            } else {
                return {
                    "_meta": {
                        "azur/CV.json": utils.mockMetadata["illustrious"],
                        "thingy.csv": utils.mockMetadata["macrophage"],
                    },
                    "_alt": { "thingy.csv": utils.mockMetadata["macrophage"] }
                }
            }
        },
        (project, asset) => {
            throw new Error("I shouldn't be called here");
        },
        all_tokenizable
    );

    // Check that it sorts correctly.
    for (const [x, p] of Object.entries(all_paths)) {
        const db = Database(p);
        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(2);
        expect(vpayload[0].vid).toBe(1);
        expect(vpayload[0].project).toBe('retest'); // retest is first as it has a lower time.
        expect(vpayload[0].latest).toBe(1);
        expect(vpayload[1].vid).toBe(2);
        expect(vpayload[1].project).toBe('test');
        expect(vpayload[1].latest).toBe(0);
        db.close();
    }

    // Check that the correct metadata is inserted into each database.
    {
        const db = Database(all_paths["_meta"]);
        let tpayload = db.prepare("SELECT * FROM tokens WHERE token = 'laios'").all();
        expect(tpayload.length).toBe(1);
        expect(tpayload[0].pid).toBe(3);
        expect(tpayload[0].field).toBe("description");

        tpayload = db.prepare("SELECT * FROM tokens WHERE token = 'vox'").all();
        expect(tpayload.length).toBe(1);
        expect(tpayload[0].pid).toBe(1);
        expect(tpayload[0].field).toBe("motto");

        tpayload = db.prepare("SELECT * FROM tokens WHERE token = 'immune'").all();
        expect(tpayload.length).toBe(1);
        expect(tpayload[0].pid).toBe(2);
        expect(tpayload[0].field).toBe("description");

        tpayload = db.prepare("SELECT * FROM tokens WHERE token = 'chicken'").all();
        expect(tpayload.length).toBe(0);
    }

    {
        const db = Database(all_paths["_alt"]);
        let tpayload = db.prepare("SELECT * FROM tokens WHERE token = 'fish'").all();
        expect(tpayload.length).toBe(1);
        expect(tpayload[0].pid).toBe(2);
        expect(tpayload[0].field).toBe("variations");

        tpayload = db.prepare("SELECT * FROM tokens WHERE token LIKE '%stem cells%'").all();
        expect(tpayload.length).toBe(1);
        expect(tpayload[0].pid).toBe(1);
        expect(tpayload[0].field).toBe("lineage.from.from.name");

        tpayload = db.prepare("SELECT * FROM tokens WHERE token = 'marcille'").all();
        expect(tpayload.length).toBe(0);
    }
})

test("updateHandler deletes versions correctly", async () => {
    const testdir = utils.setupTestDirectory("updateHandler");
    let all_paths = {};
    let all_tokenizable = {};
    for (const p of [ "_meta", "_alt" ]) {
        let opath = path.join(testdir, "test" + p + ".sqlite3")
        let db = Database(opath);
        createTables(db);
        addVersion(db, "test", "foo", "v1", true, {}, new Set);
        addVersion(db, "test", "foo", "v2", true, {}, new Set);
        addVersion(db, "test", "foo", "v3", true, {}, new Set);
        db.close();
        all_paths[p] = opath;
        all_tokenizable[p] = new Set;
    }

    // Deleting the middle version.
    await updateHandler(
        all_paths, 
        new Date,
        (threshold) => {
            return [{
                time: new Date(threshold.getTime() + 100),
                log: { type: "delete-version", project: "test", asset: "foo", version: "v2" }
            }]
        },
        (project, asset, version, to_extract) => {
            throw new Error("I shouldn't be called here");
        },
        (project, asset) => {
            throw new Error("I shouldn't be called here");
        },
        all_tokenizable
    );

    for (const [x, p] of Object.entries(all_paths)) {
        const db = Database(p);
        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(2);
        expect(vpayload[0].vid).toBe(1);
        expect(vpayload[0].version).toBe('v1'); 
        expect(vpayload[0].latest).toBe(0);
        expect(vpayload[1].vid).toBe(3);
        expect(vpayload[1].version).toBe('v3'); 
        expect(vpayload[1].latest).toBe(1);
        db.close();
    }

    // Deleting the latest version.
    await updateHandler(
        all_paths, 
        new Date,
        (threshold) => {
            return [{
                time: new Date(threshold.getTime() + 100),
                log: { type: "delete-version", project: "test", asset: "foo", version: "v3", latest: true }
            }]
        },
        (project, asset, version, to_extract) => {
            throw new Error("I shouldn't be called here");
        },
        (project, asset) => {
            return "v1";
        },
        all_tokenizable
    );

    for (const [x, p] of Object.entries(all_paths)) {
        const db = Database(p);
        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(1);
        expect(vpayload[0].vid).toBe(1);
        expect(vpayload[0].version).toBe('v1'); 
        expect(vpayload[0].latest).toBe(1);
        db.close();
    }

    // Deleting the remaining version.
    await updateHandler(
        all_paths, 
        new Date,
        (threshold) => {
            return [{
                time: new Date(threshold.getTime() + 100),
                log: { type: "delete-version", project: "test", asset: "foo", version: "v1", latest: true }
            }]
        },
        (project, asset, version, to_extract) => {
            throw new Error("I shouldn't be called here");
        },
        (project, asset) => {
            return null;
        },
        all_tokenizable
    );

    for (const [x, p] of Object.entries(all_paths)) {
        let db = Database(p);
        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(0);
        db.close();
    }
});

test("updateHandler deletes assets correctly", async () => {
    const testdir = utils.setupTestDirectory("updateHandler");
    let all_paths = {};
    let all_tokenizable = {};
    for (const p of [ "_meta", "_alt" ]) {
        let opath = path.join(testdir, "test" + p + ".sqlite3")
        let db = Database(opath);
        createTables(db);
        addVersion(db, "test", "foo", "v1", true, {}, new Set);
        addVersion(db, "test", "bar", "v1", true, {}, new Set);
        db.close();
        all_paths[p] = opath;
        all_tokenizable[p] = new Set;
    }

    await updateHandler(
        all_paths, 
        new Date,
        (threshold) => {
            return [{
                time: new Date(threshold.getTime() + 100),
                log: { type: "delete-asset", project: "test", asset: "bar" }
            }]
        },
        (project, asset, version, to_extract) => {
            throw new Error("I shouldn't be called here");
        },
        (project, asset) => {
            throw new Error("I shouldn't be called here");
        },
        all_tokenizable
    );

    for (const [x, p] of Object.entries(all_paths)) {
        const db = Database(p);
        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(1);
        expect(vpayload[0].vid).toBe(1);
        expect(vpayload[0].asset).toBe('foo'); 
        db.close();
    }
})

test("updateHandler deletes projects correctly", async () => {
    const testdir = utils.setupTestDirectory("updateHandler");
    let all_paths = {};
    let all_tokenizable = {};
    for (const p of [ "_meta", "_alt" ]) {
        let opath = path.join(testdir, "test" + p + ".sqlite3")
        let db = Database(opath);
        createTables(db);
        addVersion(db, "test", "foo", "v1", true, {}, new Set);
        addVersion(db, "retest", "foo", "v1", true, {}, new Set);
        db.close();
        all_paths[p] = opath;
        all_tokenizable[p] = new Set;
    }

    await updateHandler(
        all_paths, 
        new Date,
        (threshold) => {
            return [{
                time: new Date(threshold.getTime() + 100),
                log: { type: "delete-project", project: "test" }
            }]
        },
        (project, asset, version, to_extract) => {
            throw new Error("I shouldn't be called here");
        },
        (project, asset) => {
            throw new Error("I shouldn't be called here");
        },
        all_tokenizable
    );

    for (const [x, p] of Object.entries(all_paths)) {
        const db = Database(p);
        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(1);
        expect(vpayload[0].vid).toBe(2);
        expect(vpayload[0].project).toBe('retest'); 
        db.close();
    }
});
