import * as path from "path";
import * as utils from "../utils.js";
import { createTables } from "../../src/sqlite/createTables.js";
import { addVersion } from "../../src/sqlite/addVersion.js";
import { updateHandler, readLogs } from "../../src/handlers/updateHandler.js";
import Database from "better-sqlite3";

test("readLogs reports logs correctly", async () => {
    const logs = {
        "2021-02-19T05:21:42.12+08:00_000000": { "type": "foo" },
        "2021-02-19T05:21:42.12-08:00_000000": { "type": "bar" },
        "2021-02-19T05:21:42.12+03:00_000000": { "type": "stuff" },
        "2021-02-15T06:21:12.47+08:00_000000": { "type": "whee" },
        "2021-02-21T19:01:54.98-08:00_000000": { "type": "blah" }
    };

    const lister = (threshold) => (Object.keys(logs).filter(k => k > threshold));
    const reader = (n) => logs[n];

    let everything = await readLogs(new Date("2020-02-18T00:00:00Z"), lister, reader);
    everything.sort((a, b) => a.time - b.time);
    expect(everything.map(y => y.log.type)).toEqual([ "whee", "foo", "stuff", "bar", "blah" ]);

    let filtered = await readLogs(new Date("2021-02-18T00:00:00Z"), lister, reader); 
    filtered.sort((a, b) => a.time - b.time);
    expect(filtered.map(y => y.log.type)).toEqual([ "foo", "stuff", "bar", "blah" ]);

    filtered = await readLogs(new Date("2021-02-19T05:21:42.12Z"), lister, reader); 
    filtered.sort((a, b) => a.time - b.time);
    expect(filtered.map(y => y.log.type)).toEqual([ "bar", "blah" ]);

    filtered = await readLogs(new Date("2021-02-20T00:00:00+11:00"), lister, reader); 
    filtered.sort((a, b) => a.time - b.time);
    expect(filtered.map(y => y.log.type)).toEqual([ "bar", "blah" ]);

    filtered = await readLogs(new Date("2021-02-21T01:13:54.98+01:00"), lister, reader); 
    filtered.sort((a, b) => a.time - b.time);
    expect(filtered.map(y => y.log.type)).toEqual([ "blah" ]);

    // Skips ill-formed logs.
    const badlogs = {
        "2021-02-19T05:21:42.12+08:00_000000": { "type": "foo" },
        "2021-02-19T05:21:42.12+08:00": { "type": "bar" },
        "asdasdasd": { "type": "whee" }
    };

    const badlister = (threshold) => (Object.keys(badlogs).filter(k => k > threshold));
    const badreader = (n) => badlogs[n];
    let badeverything = await readLogs(new Date("2020-02-18T00:00:00Z"), badlister, badreader);
    expect(badeverything.map(y => y.log.type)).toEqual([ "foo" ]);
})

test("updateHandler adds versions correctly", async () => {
    const testdir = utils.setupTestDirectory("updateHandler");
    let all_paths = {};
    for (const p of [ "_meta", "_alt" ]) {
        let opath = path.join(testdir, "test" + p + ".sqlite3")
        let db = Database(opath);
        createTables(db);
        db.close();
        all_paths[p] = opath;
    }

    const now = new Date;
    const logname1 = new Date(now.getTime() + 100).toISOString() + "_000000";
    const logname2 = new Date(now.getTime() + 10).toISOString() + "_000000";

    await updateHandler(
        all_paths, 
        now, 
        (threshold) => [ logname1, logname2 ],
        (name) => {
            if (name == logname1) {
                return { type: "add-version", project: "test", asset: "foo", version: "whee" };
            } else {
                return { type: "add-version", project: "retest", asset: "stuff", version: "bar", latest: true };
            }
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
        }
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
        let tpayload = utils.scanForToken(db, 'laios');
        expect(tpayload.length).toBe(1);
        expect(tpayload[0].path).toBe("AAA.json");
        expect(tpayload[0].field).toBe("description");

        tpayload = utils.scanForToken(db, 'vox');
        expect(tpayload.length).toBe(1);
        expect(tpayload[0].path).toBe("azur/CV.json");
        expect(tpayload[0].field).toBe("motto");

        tpayload = utils.scanForToken(db, 'immune');
        expect(tpayload.length).toBe(1);
        expect(tpayload[0].path).toBe("thingy.csv");
        expect(tpayload[0].field).toBe("description");

        tpayload = utils.scanForToken(db, 'chicken');
        expect(tpayload.length).toBe(0);
    }

    {
        const db = Database(all_paths["_alt"]);
        let tpayload = utils.scanForToken(db, 'fish');
        expect(tpayload.length).toBe(1);
        expect(tpayload[0].path).toBe("BBB/CCC.txt");
        expect(tpayload[0].field).toBe("variations");

        tpayload = utils.scanForToken(db, 'hemato%', { partial: true });
        expect(tpayload.length).toBe(1);
        expect(tpayload[0].path).toBe("thingy.csv");
        expect(tpayload[0].field).toBe("lineage.from.from.name");

        tpayload = utils.scanForToken(db, 'marcille');
        expect(tpayload.length).toBe(0);
    }
})

test("updateHandler deletes versions correctly", async () => {
    const testdir = utils.setupTestDirectory("updateHandler");
    let all_paths = {};
    for (const p of [ "_meta", "_alt" ]) {
        let opath = path.join(testdir, "test" + p + ".sqlite3")
        let db = Database(opath);
        createTables(db);
        addVersion(db, "test", "foo", "v1", true, {}, new Set);
        addVersion(db, "test", "foo", "v2", true, {}, new Set);
        addVersion(db, "test", "foo", "v3", true, {}, new Set);
        db.close();
        all_paths[p] = opath;
    }

    const now = new Date;
    const logname = new Date(now.getTime() + 100).toISOString() + "_000000";

    // Deleting the middle version.
    await updateHandler(
        all_paths, 
        now,
        (threshold) => [logname],
        (name) => {
            return { type: "delete-version", project: "test", asset: "foo", version: "v2" };
        },
        (project, asset, version, to_extract) => {
            throw new Error("I shouldn't be called here");
        },
        (project, asset) => {
            throw new Error("I shouldn't be called here");
        }
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
        now,
        (threshold) => [logname],
        (name) => { 
            return { type: "delete-version", project: "test", asset: "foo", version: "v3", latest: true };
        },
        (project, asset, version, to_extract) => {
            throw new Error("I shouldn't be called here");
        },
        (project, asset) => {
            return "v1";
        }
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
        now,
        (threshold) => [logname],
        (name) => { 
            return { type: "delete-version", project: "test", asset: "foo", version: "v1", latest: true };
        },
        (project, asset, version, to_extract) => {
            throw new Error("I shouldn't be called here");
        },
        (project, asset) => {
            return null;
        }
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
    for (const p of [ "_meta", "_alt" ]) {
        let opath = path.join(testdir, "test" + p + ".sqlite3")
        let db = Database(opath);
        createTables(db);
        addVersion(db, "test", "foo", "v1", true, {}, new Set);
        addVersion(db, "test", "bar", "v1", true, {}, new Set);
        db.close();
        all_paths[p] = opath;
    }

    const now = new Date;
    const logname = new Date(now.getTime() + 100).toISOString() + "_000000";

    await updateHandler(
        all_paths, 
        now,
        (threshold) => [logname],
        (name ) => {
            return { type: "delete-asset", project: "test", asset: "bar" };
        },
        (project, asset, version, to_extract) => {
            throw new Error("I shouldn't be called here");
        },
        (project, asset) => {
            throw new Error("I shouldn't be called here");
        }
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
    for (const p of [ "_meta", "_alt" ]) {
        let opath = path.join(testdir, "test" + p + ".sqlite3")
        let db = Database(opath);
        createTables(db);
        addVersion(db, "test", "foo", "v1", true, {}, new Set);
        addVersion(db, "retest", "foo", "v1", true, {}, new Set);
        db.close();
        all_paths[p] = opath;
    }

    const now = new Date;
    const logname = new Date(now.getTime() + 100).toISOString() + "_000000";

    await updateHandler(
        all_paths, 
        now,
        (threshold) => [logname],
        (name) => {
            return { type: "delete-project", project: "test" };
        },
        (project, asset, version, to_extract) => {
            throw new Error("I shouldn't be called here");
        },
        (project, asset) => {
            throw new Error("I shouldn't be called here");
        }
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
