#!/usr/bin/env node

import { freshHandler } from "../src/handlers/freshHandler.js";
import { parseArgs } from "node:util";
import * as fs from "fs";
import * as path from "path";
import * as utils from "./utils.js";

const args = parseArgs({
    options: {
        class: {
            type: "string",
            multiple: true,
        },
        registry: {
            type: "string",
        },
        gypsum: {
            type: "string",
        },
        dir: {
            type: "string",
        }
    }
});

const dir = utils.required(args, "dir");
const db_paths = utils.parseConfigurations(utils.required(args, "class"), dir);
const { list_projects, list_assets, list_versions, find_latest, read_summary, read_metadata } = utils.chooseSourceFunctions(utils.optional(args, "registry"), utils.optional(args, "gypsum"));

// Creating the timestamp here, just so that if there are any operations
// between now and completion of the index, we catch them in the updates. This
// is okay as all logged operations are idempotent from our perspective; we're
// just (re)aligning with whatever's in the bucket.
fs.writeFileSync(path.join(dir, "modified"), String((new Date).getTime()))

await freshHandler(db_paths, list_projects, list_assets, list_versions, find_latest, read_summary, read_metadata, { verbose: true });
