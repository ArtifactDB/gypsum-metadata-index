import { addVersion } from "../sqlite/addVersion.js"; 
import { deleteVersion } from "../sqlite/deleteVersion.js"; 
import { deleteAsset } from "../sqlite/deleteAsset.js"; 
import { deleteProject } from "../sqlite/deleteProject.js"; 
import { setLatest } from "../sqlite/setLatest.js"; 
import Database from "better-sqlite3"

function safe_extract(x, p) {
    if (p in x) {
        return x[p];
    } else {
        throw new Error("expected a '" + p + "' property");
    }
}

function is_latest(log) {
    return "latest" in log && log.latest;
}

export async function updateHandler(db_paths, last_modified, read_logs, read_metadata, find_latest, db_tokenizable) {
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
        const parameters = l.log;
        try {
            const type = safe_extract(parameters, "type");

            if (type == "add-version") {
                const project = safe_extract(parameters, "project");
                const asset = safe_extract(parameters, "asset");
                const version = safe_extract(parameters, "version");
                let output = await read_metadata(project, asset, version, to_extract);
                for (const [e, db] of Object.entries(db_handles)) {
                    addVersion(db, project, asset, version, is_latest(parameters), output[e], db_tokenizable[e]);
                }

            } else if (type == "delete-version") {
                const project = safe_extract(parameters, "project");
                const asset = safe_extract(parameters, "asset");
                const version = safe_extract(parameters, "version");
                for (const db of Object.values(db_handles)) {
                    deleteVersion(db, project, asset, version);
                }

                // If we just deleted the latest version, we need to reset the
                // previous version with the latest information.
                if (is_latest(parameters)) {
                    const latest = await find_latest(project, asset);
                    if (latest != null) {
                        for (const db of Object.values(db_handles)) {
                            setLatest(db, project, asset, latest);
                        }
                    }
                }

            } else if (type == "delete-asset") {
                const project = safe_extract(parameters, "project");
                const asset = safe_extract(parameters, "asset");
                for (const db of Object.values(db_handles)) {
                    deleteAsset(db, project, asset);
                }

            } else if (type == "delete-project") {
                const project = safe_extract(parameters, "project");
                for (const db of Object.values(db_handles)) {
                    deleteProject(db, project);
                }

            } else {
                throw new Error("unknown update action type '" + type + "'");
            }
        } catch (err) {
            throw new Error("failed update for '" + l.name + "' ('" + JSON.stringify(parameters) + "')", { cause: err });
        }
    }
}
