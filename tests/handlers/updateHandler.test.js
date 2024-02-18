import * as path from "path";
import * as utils from "../utils.js";
import { createTables } from "../../src/sqlite/createTables.js";
import { updateHandler } from "../../src/handlers/updateHandler.js";
import Database from "better-sqlite3";

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
                    "_meta": {
                        "AAA.json": utils.mockMetadata["marcille"],
                    },
                    "_alt": {
                        "BBB/CCC.txt": utils.mockMetadata["chicken"],
                    }
                }
            } else {
                return {
                    "_meta": {
                        "azur/CV.json": utils.mockMetadata["illustrious"],
                        "thingy.csv": utils.mockMetadata["macrophage"],
                    },
                    "_alt": {
                        "thingy.csv": utils.mockMetadata["macrophage"]
                    }
                }
            }
        },
        (project, asset) => {
            return null;
        },
        new Set(["description", "motto"])
    );

    let all_handles = {};
    for (const [k, v] of Object.entries(all_paths)) {
        all_handles[k] = Database(v);
    }

    // Check that it sorts correctly.
    for (const [x, db] of Object.entries(all_handles)) {
        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(2);
        expect(vpayload[0].vid).toBe(1);
        expect(vpayload[0].project).toBe('retest'); // retest is first as it has a lower time.
        expect(vpayload[0].latest).toBe(1);
        expect(vpayload[1].vid).toBe(2);
        expect(vpayload[1].project).toBe('test');
        expect(vpayload[1].latest).toBe(0);
    }

    {
        const db = all_handles["_meta"];
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
        const db = all_handles["_alt"];
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
