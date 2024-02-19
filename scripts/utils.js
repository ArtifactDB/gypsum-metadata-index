import * as local from "../src/local/index.js";
import * as fs from "fs";
import * as path from "path";

export function parseConfigurations(configs, dir) {
    const db_paths = {};
    const db_tokenizable = {};
    for (const cpath of configs) {
        let config = JSON.parse(fs.readFileSync(cpath, { encoding: "utf8" }));
        db_paths[config.file_name] = path.join(dir, config.db_name);
        db_tokenizable[config.file_name] = config.tokenizable;
    }
    return { db_paths, db_tokenizable };
}

export function chooseSourceFunctions(registry) {
    if (registry) {
        return {
            list_projects: () => local.listProjects(args.values.registry),
            list_assets: (project) => local.listProjects(args.values.registry, project),
            list_versions: (project, asset) => local.listProjects(args.values.registry, project, asset),
            read_logs: since => local.readLogs(args.values.registry, since),
            read_summary: (project, asset, version) => local.readSummary(args.values.registry, project, asset, version, to_extract),
            read_metadata: (project, asset, version, to_extract) => local.readMetadata(args.values.registry, project, asset, version, to_extract),
            find_latest: (project, asset) => local.findLatest(args.values.registry, project, asset),
        };
    } else {
        throw new Error("non-registry arguments are not yet supported");
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
