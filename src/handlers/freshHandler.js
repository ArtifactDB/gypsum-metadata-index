import * as fs from "fs";
import { addVersion } from "../sqlite/addVersion.js"; 
import { createTables } from "../sqlite/createTables.js"; 
import Database from "better-sqlite3"

export async function freshHandler(db_paths, list_projects, list_assets, list_versions, find_latest, read_summary, read_metadata) {
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
    let all_outcomes = [];
    for (const project of all_projects) {
        let projprom = internal_freshProject(db_handles, project, list_assets, list_versions, find_latest, read_summary, read_metadata);
        all_outcomes.push(projprom);
    }

    all_outcomes = await Promise.allSettled(all_outcomes);
    for (var i = 0; i < all_outcomes.length; ++i) {
        const outcome = all_outcomes[i];
        if (outcome.status == "rejected") {
            // Just report the error and keep going so that we don't stall at a single broken project. 
            console.error(new Error("failed to add project '" + all_projects[i] + "'", { cause: outcome.reason }));
        }
    }
}

// Only exported for the purpose of re-use in manualHandler.js.
export async function internal_freshProject(db_handles, project, list_assets, list_versions, find_latest, read_summary, read_metadata) {
    const all_assets = await list_assets(project);
    let all_outcomes = [];
    for (const asset of all_assets) {
        let assprom = internal_freshAsset(db_handles, project, asset, list_versions, find_latest, read_summary, read_metadata);
        all_outcomes.push(assprom);
    }

    all_outcomes = await Promise.allSettled(all_outcomes);
    for (var i = 0; i < all_outcomes.length; ++i) {
        const outcome = all_outcomes[i];
        if (outcome.status == "rejected") {
            throw new Error("failed to add asset '" + all_assets[i] + "'", { cause: outcome.reason });
        }
    }
}

export async function internal_freshAsset(db_handles, project, asset, list_versions, find_latest, read_summary, read_metadata) {
    const latest = await find_latest(project, asset);
    if (latest == null) { // short-circuit if latest=null, as that means that there are no non-probational versions.
        return; 
    }

    const all_versions = await list_versions(project, asset);
    let all_outcomes = [];
    for (const version of all_versions) {
        let verprom = internal_freshVersion(db_handles, project, asset, version, latest, read_summary, read_metadata);
        all_outcomes.push(verprom);
    }

    all_outcomes = await Promise.allSettled(all_outcomes);
    for (var i = 0; i < all_outcomes.length; ++i) {
        const outcome = all_outcomes[i];
        if (outcome.status == "rejected") {
            throw new Error("failed to add version '" + all_versions[i] + "'", { cause: outcome.reason });
        }
    }
}

export async function internal_freshVersion(db_handles, project, asset, version, latest, read_summary, read_metadata) {
    const summ = await read_summary(project, asset, version);
    if ("on_probation" in summ && summ.on_probation) {
        return;
    }
    const output = await read_metadata(project, asset, version, Object.keys(db_handles));
    for (const [e, db] of Object.entries(db_handles)) {
        try {
            addVersion(db, project, asset, version, (latest == version), output[e]);
        } catch (err) {
            throw new Error("failed to add to database '" + e + "'", { cause: err });
        } 
    }
}
