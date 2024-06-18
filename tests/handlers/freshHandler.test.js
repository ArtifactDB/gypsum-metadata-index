import * as path from "path";
import * as utils from "../utils.js";
import { freshHandler } from "../../src/handlers/freshHandler.js";
import Database from "better-sqlite3";

test("freshHandler works correctly without probation", async () => {
    const testdir = utils.setupTestDirectory("freshHandler");
    let all_paths = {};
    for (const p of [ "_meta", "_alt" ]) {
        all_paths[p] = path.join(testdir, "test" + p + ".sqlite3")
    }

    await freshHandler(
        all_paths, 
        async () => [ "test", "retest" ],
        async project => {
            if (project == "test") {
                return ["foo"];
            } else {
                return ["whee", "stuff"];
            }
        },
        async (project, asset) => {
            if (project == "test") {
                return ["bar1", "bar2"];
            } else {
                return ["v1" ];
            }
        },
        async (project, asset) => {
            if (project == "test") {
                return "bar2";
            } else {
                return "v1";
            }
        },
        async (project, asset, version) => {
            return utils.mockSummary;
        },
        async (project, asset, version, to_extract) => {
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
        }
    );

    // Check that all versions are added, along with their metadata entries.
    for (const [x, p] of Object.entries(all_paths)) {
        const db = Database(p);

        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(4);
        expect(vpayload.map(x => x.project)).toEqual(["test", "test", "retest", "retest" ]);
        expect(vpayload.map(x => x.asset)).toEqual(["foo", "foo", "whee", "stuff"]);
        expect(vpayload.map(x => x.version)).toEqual(["bar1", "bar2", "v1", "v1"]);
        expect(vpayload.map(x => x.latest)).toEqual([0, 1, 1, 1]);

        let tpayload = utils.scanForToken(db, 'donato');
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
});

test("freshHandler works correctly with probation", async () => {
    const testdir = utils.setupTestDirectory("freshHandler");
    let all_paths = {};
    for (const p of [ "_meta", "_alt" ]) {
        all_paths[p] = path.join(testdir, "test" + p + ".sqlite3")
    }

    await freshHandler(
        all_paths, 
        async () => [ "test", "retest" ],
        async project => {
            if (project == "test") {
                return ["foo"];
            } else {
                return ["whee", "stuff"];
            }
        },
        async (project, asset) => {
            if (project == "test") {
                return ["bar1", "bar2"];
            } else {
                return ["v1" ];
            }
        },
        async (project, asset) => {
            if (project == "test") {
                return "bar1";
            } else {
                return null; // i.e., no non-probational versions.
            }
        },
        async (project, asset, version) => {
            const copy = { ...utils.mockSummary };
            if (project == "test" && version == "bar2") {
                copy.on_probation = true; // 'bar2' is not probational. 
            }
            return copy;
        },
        async (project, asset, version, to_extract) => {
            return {
                "_meta": { "AAA.json": utils.mockMetadata["marcille"] },
                "_alt": { "BBB/CCC.txt": utils.mockMetadata["chicken"] }
            }
        }
    );

    // Check that all versions are added, along with their metadata entries.
    for (const [x, p] of Object.entries(all_paths)) {
        const db = Database(p);

        const vpayload = db.prepare("SELECT * FROM versions").all();
        expect(vpayload.length).toBe(1);
        expect(vpayload[0].project).toBe("test");
        expect(vpayload[0].asset).toBe("foo");
        expect(vpayload[0].version).toBe("bar1");
        expect(vpayload[0].latest).toBe(1);

        let tpayload = utils.scanForToken(db, 'donato');
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
    }
})
