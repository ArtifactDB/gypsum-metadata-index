import { deleteVersion } from "../sqlite/deleteVersion.js"; 
import { deleteAsset } from "../sqlite/deleteAsset.js"; 
import { deleteProject } from "../sqlite/deleteProject.js"; 
import * as fresh from "./freshHandler.js";
import Database from "better-sqlite3"

export async function manualHandler(db_paths, project, asset, version, list_assets, list_versions, find_latest, read_summary, read_metadata, db_tokenizable) {
    const db_handles = {};
    for (const [k, v] of Object.entries(db_paths)) {
        db_handles[k] = Database(v);
    }

    if (asset == null && version == null) {
        for (const db of Object.values(db_handles)) {
            deleteProject(db, project);
        }
        await fresh.internal_freshProject(db_handles, project, list_assets, list_versions, find_latest, read_summary, read_metadata, db_tokenizable);

    } else if (version == null) {
        for (const db of Object.values(db_handles)) {
            deleteAsset(db, project, asset);
        }
        await fresh.internal_freshAsset(db_handles, project, asset, list_versions, find_latest, read_summary, read_metadata, db_tokenizable);

    } else {
        for (const db of Object.values(db_handles)) {
            deleteVersion(db, project, asset, version);
        }
        const latest = find_latest(project, asset);
        if (latest != null) { // short-circuit if latest = null, as this implies that there are no (non-probational) versions.
            await fresh.internal_freshVersion(db_handles, project, asset, version, latest, read_summary, read_metadata, db_tokenizable);
        }
    }
}
