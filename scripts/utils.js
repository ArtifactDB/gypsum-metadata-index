import * as local from "../src/local/index.js";
import * as gypsum from "../src/gypsum/index.js";
import * as fs from "fs";
import * as path from "path";

export function parseConfigurations(configs, dir) {
    const db_paths = {};
    for (const cpath of configs) {
        let i = cpath.indexOf(",");
        db_paths[cpath.slice(0, i)] = path.join(dir, cpath.slice(i + 1));
    }
    return db_paths;
}

export function chooseSourceFunctions(registry, gypsum_url) {
    if (registry !== null) {
        return {
            list_projects: () => local.listProjects(registry),
            list_assets: (project) => local.listAssets(registry, project),
            list_versions: (project, asset) => local.listVersions(registry, project, asset),
            list_logs: since => local.listLogs(registry, since),
            read_log: name => local.readLog(registry, name),
            read_summary: (project, asset, version) => local.readSummary(registry, project, asset, version),
            read_metadata: (project, asset, version, to_extract) => local.readMetadata(registry, project, asset, version, to_extract),
            find_latest: (project, asset) => local.fetchLatest(registry, project, asset),
        };
    } else if (gypsum_url !== null)  {
        return {
            list_projects: () => gypsum.listProjects(gypsum_url),
            list_assets: (project) => gypsum.listAssets(gypsum_url, project),
            list_versions: (project, asset) => gypsum.listVersions(gypsum_url, project, asset),
            list_logs: since => gypsum.listLogs(gypsum_url, since),
            read_log: name => gypsum.readLog(gypsum_url, name),
            read_summary: (project, asset, version) => gypsum.readSummary(gypsum_url, project, asset, version),
            read_metadata: (project, asset, version, to_extract) => gypsum.readMetadata(gypsum_url, project, asset, version, to_extract),
            find_latest: (project, asset) => gypsum.fetchLatest(gypsum_url, project, asset),
        };
    } else {
        throw new Error("one of 'registry' or 'gypsum' must be provided");
    }
}

export function required(args, name) {
    if (name in args.values) {
        return args.values[name];
    } else {
        throw new Error("expected a '" + name + "' argument");
    }
}

export function optional(args, name) {
    if (name in args.values) {
        return args.values[name];
    } else {
        return null;
    }
}
