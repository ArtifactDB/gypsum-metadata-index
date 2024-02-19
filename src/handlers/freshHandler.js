import * as fs from "fs";
import { addVersion } from "../sqlite/addVersion.js"; 
import { createTables } from "../sqlite/createTables.js"; 
import Database from "better-sqlite3"

export async function freshHandler(db_paths, list_projects, list_assets, list_versions, find_latest, read_summary, read_metadata, tokenizable) {
    const db_handles = {};
    for (const [k, v] of Object.entries(db_paths)) {
        if (fs.existsSync(v)) {
            fs.unlinkSync(v); // remove any existing file.
        }
        const db = Database(v);
        createTables(db);
        db_handles[k] = db;
    }
    const to_extract = Object.keys(db_handles);

    const all_projects = await list_projects();
    for (const proj of all_projects) {
        const all_assets = await list_assets(proj);
        for (const ass of all_assets) {
            const latest = find_latest(proj, ass);
            if (latest == null) {
                continue;
            }

            const all_versions = await list_versions(proj, ass);
            for (const ver of all_versions) {
                const summ = await read_summary(proj, ass, ver);
                if ("on_probation" in summ && summ.on_probation) {
                    continue;
                }

                const output = await read_metadata(proj, ass, ver, to_extract);
                for (const e of to_extract) {
                    addVersion(db_handles[e], proj, ass, ver, (latest == ver), output[e], tokenizable);
                }
            }
        }
    }

    return;
}
