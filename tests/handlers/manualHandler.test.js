import * as path from "path";
import * as utils from "../utils.js";
import { manualHandler } from "../../src/handlers/manualHandler.js";
import { createTables } from "../../src/sqlite/createTables.js";
import Database from "better-sqlite3";

test("manualHandler works correctly", async () => {
    const testdir = utils.setupTestDirectory("manualHandler");
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

    // Set up the various functions.
    const listAssets = project => {
        return ["foo", "stuff"];
    };

    const listVersions = (project, asset) => {
        if (asset == "foo") {
            return ["bar1", "bar2"];
        } else {
            return ["v1" ];
        }
    };

    const findLatest = (project, asset) => {
        if (asset == "foo") {
            return "bar2";
        } else {
            return "v1";
        }
    };

    const readSummary = (project, asset, version) => {
        return {};
    };

    const readMetadata = (project, asset, version, to_extract) => {
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
    };

    // Refreshing a single version.
    await manualHandler(all_paths, "test", "foo", "bar1", listAssets, listVersions, findLatest, readSummary, readMetadata, all_tokenizable);

    for (const [x, p] of Object.entries(all_paths)) {
        const db = Database(p);

        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(1);
        expect(vpayload[0].project).toEqual("test");
        expect(vpayload[0].asset).toEqual("foo");
        expect(vpayload[0].version).toEqual("bar1");
        expect(vpayload[0].latest).toEqual(0);

        let tpayload = utils.scanForToken(db, 'Donato');
        if (x == "_meta") {
            expect(tpayload.length).toBeGreaterThan(0);
        } else {
            expect(tpayload.length).toEqual(0);
        }

        tpayload = utils.scanForToken(db, 'chicken');
        if (x == "_meta") {
            expect(tpayload.length).toEqual(0);
        } else {
            expect(tpayload.length).toBeGreaterThan(0);
        }

        db.close();
    }

    // Refreshing a single asset.
    await manualHandler(all_paths, "test", "foo", null, listAssets, listVersions, findLatest, readSummary, readMetadata, all_tokenizable);

    for (const [x, p] of Object.entries(all_paths)) {
        const db = Database(p);

        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(2);
        expect(vpayload[0].project).toEqual("test");
        expect(vpayload[0].asset).toEqual("foo");
        expect(vpayload[0].version).toEqual("bar1");
        expect(vpayload[0].latest).toEqual(0);
        expect(vpayload[1].project).toEqual("test");
        expect(vpayload[1].asset).toEqual("foo");
        expect(vpayload[1].version).toEqual("bar2");
        expect(vpayload[1].latest).toEqual(1);

        db.close();
    }

    // Refreshing a single project.
    await manualHandler(all_paths, "test", null, null, listAssets, listVersions, findLatest, readSummary, readMetadata, all_tokenizable);

    for (const [x, p] of Object.entries(all_paths)) {
        const db = Database(p);

        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(3);
        expect(vpayload[0].project).toEqual("test");
        expect(vpayload[0].asset).toEqual("foo");
        expect(vpayload[0].version).toEqual("bar1");
        expect(vpayload[0].latest).toEqual(0);
        expect(vpayload[1].project).toEqual("test");
        expect(vpayload[1].asset).toEqual("foo");
        expect(vpayload[1].version).toEqual("bar2");
        expect(vpayload[1].latest).toEqual(1);
        expect(vpayload[2].project).toEqual("test");
        expect(vpayload[2].asset).toEqual("stuff");
        expect(vpayload[2].version).toEqual("v1");
        expect(vpayload[2].latest).toEqual(1);

        db.close();
    }
});
