import * as fs from "fs";
import { addVersion } from "../sqlite/addVersion.js"; 
import { createTables } from "../sqlite/createTables.js"; 
import Database from "better-sqlite3"

export async function freshHandler(db_paths, list_projects, list_assets, list_versions, find_latest, read_summary, read_metadata, db_tokenizable) {
    const db_handles = {};
    for (const [k, v] of Object.entries(db_paths)) {
        if (fs.existsSync(v)) {
            fs.unlinkSync(v); // remove any existing file.
        }
        const db = Database(v);
        createTables(db);
        db_handles[k] = db;
    }

    const all_projects = await list_projects();
    for (const project of all_projects) {
        await internal_freshProject(db_handles, project, list_assets, list_versions, find_latest, read_summary, read_metadata, db_tokenizable);
    }
}

// Only exported for the purpose of re-use in manualHandler.js.
export async function internal_freshProject(db_handles, project, list_assets, list_versions, find_latest, read_summary, read_metadata, db_tokenizable) {
    const all_assets = await list_assets(project);
    for (const asset of all_assets) {
        await internal_freshAsset(db_handles, project, asset, list_versions, find_latest, read_summary, read_metadata, db_tokenizable);
    }
}

export async function internal_freshAsset(db_handles, project, asset, list_versions, find_latest, read_summary, read_metadata, db_tokenizable) {
    const latest = find_latest(project, asset);
    if (latest == null) { // short-circuit if latest=null, as that means that there are no non-probational versions.
        return; 
    }
    const all_versions = await list_versions(project, asset);
    for (const version of all_versions) {
        await internal_freshVersion(db_handles, project, asset, version, latest, read_summary, read_metadata, db_tokenizable);
    }
}

export async function internal_freshVersion(db_handles, project, asset, version, latest, read_summary, read_metadata, db_tokenizable) {
    const summ = await read_summary(project, asset, version);
    if ("on_probation" in summ && summ.on_probation) {
        return;
    }
    const output = await read_metadata(project, asset, version, Object.keys(db_handles));
    for (const [e, db] of Object.entries(db_handles)) {
        addVersion(db, project, asset, version, (latest == version), output[e], db_tokenizable[e]);
    }
}
