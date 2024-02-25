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

// Only exported for testing purposes.
export async function readLogs(last_modified, list_logs, read_log) {
    // Rewinding a day and using that as the threshold key. The idea is to
    // potentially improve the efficiency of list_logs by skipping logs that we
    // already processed, assuming that the list_logs function can benefit from
    // listing logfiles with names that sort after the threshold key.
    //
    // Note, though, that this part is only approximate as the list_logs is not
    // obliged to consider the threshold. Even if it did, an alphanumeric sort
    // doesn't check for timezones or account for variable precision of
    // fractional seconds. Hence, we rewind by a full day to be conservative
    // and ensure that we only skip things that we must have already processed;
    // for everything else, we still list the log files, extract the times and
    // compare them manually to 'since' in the subsequent loop.
    let threshold_string = (new Date(last_modified.getTime() - 1000 * 60 * 60 * 24)).toISOString()
    const log_list = await list_logs(threshold_string);

    const log_names = [];
    const log_times = [];
    let log_contents = [];
    for (const l of log_list) {
        let i_ = l.indexOf("_")
        if (i_ < 0) {
            continue;
        }

        let parsed = new Date(l.slice(0, i_));
        if (Number.isNaN(parsed)) {
            continue;
        }
        if (parsed <= last_modified) {
            continue;
        }

        log_names.push(l);
        log_times.push(parsed);
        log_contents.push(read_log(l));
    }

    log_contents = await Promise.allSettled(log_contents);
    let logs = [];
    for (var i = 0; i < log_contents.length; ++i) {
        const outcome = log_contents[i];
        if (outcome.status == "rejected") {
            // Report the error but keep going so that we don't stall at a single broken log.
            console.err(new Error("failed to parse log '" + log_names[i] + "'", { cause: outcome.reason }));
        } else {
            logs.push({ name: log_names[i], time: log_times[i], log: outcome.value });
        }
    }

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

    return logs;
}

export async function updateHandler(db_paths, last_modified, list_logs, read_log, read_metadata, find_latest, { verbose = false } = {}) {
    const db_handles = {};
    for (const [k, v] of Object.entries(db_paths)) {
        db_handles[k] = Database(v);
    }
    const to_extract = Object.keys(db_handles);

    const logs = await readLogs(last_modified, list_logs, read_log);
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
                    addVersion(db, project, asset, version, is_latest(parameters), output[e]);
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

            if (verbose) {
                console.log("processed log '" + l.name + "'");
            }
        } catch (err) {
            // Report the error but keep going so that we don't stall at a single broken log.
            console.error(new Error("failed update for '" + l.name + "' ('" + JSON.stringify(parameters) + "')", { cause: err }));
        }
    }

    return logs;
}
