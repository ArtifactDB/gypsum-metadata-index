import { addVersion } from "../sqlite/addVersion.js"; 
import { deleteVersion } from "../sqlite/deleteVersion.js"; 
import { deleteAsset } from "../sqlite/deleteAsset.js"; 
import { deleteProject } from "../sqlite/deleteProject.js"; 
import { setLatest } from "../sqlite/setLatest.js"; 
import Database from "better-sqlite3"

function is_latest(log) {
    return "latest" in log && log.latest;
}

export async function updateHandler(db_paths, last_modified, read_logs, read_metadata, find_latest, tokenizable) {
    const logs = await read_logs(last_modified);

    // Need to make sure they're sorted so we execute the responses to the
    // actions in the right order.
    if (logs.length > 1) {
        let sorted = true;
        for (var i = 1; i < logs.length; ++i) {
            if (logs[i].time < logs[i-1].time) {
                sorted = false;
            }
        }
        if (!sorted) {
            logs.sort((a, b) => a.time - b.time);
        }
    }

    const db_handles = {};
    for (const [k, v] of Object.entries(db_paths)) {
        db_handles[k] = Database(v);
    }
    const to_extract = Object.keys(db_handles);

    for (const l of logs) {
        const type = l.log.type;

        if (type == "add-version") {
            const project = l.log.project;
            const asset = l.log.asset;
            const version = l.log.version;
            let output = await read_metadata(project, asset, version, to_extract);
            for (const e of to_extract) {
                addVersion(db_handles[e], project, asset, version, is_latest(l.log), output[e], tokenizable);
            }

        } else if (type == "delete-version") {
            const project = l.log.project;
            const asset = l.log.asset;
            const version = l.log.version;
            for (const e of to_extract) {
                deleteVersion(db_handles[e], project, asset, version);
            }

            // If we just deleted the latest version, we need to reset the
            // previous version with the latest information.
            if (is_latest(l.log)) {
                const latest = await find_latest(project, asset);
                if (latest != null) {
                    for (const e of to_extract) {
                        setLatest(db_handles[e], project, asset, latest);
                    }
                }
            }

        } else if (type == "delete-asset") {
            for (const e of to_extract) {
                deleteAsset(db_handles[e], project, asset);
            }

        } else if (type == "delete-project") {
            for (const e of to_extract) {
                deleteProject(db_handles[e], project);
            }
        }
    }

    return;
}

