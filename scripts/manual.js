#!/usr/bin/env node

import { manualHandler } from "../src/handlers/manualHandler.js";
import { parseArgs } from "node:util";
import * as fs from "fs";
import * as path from "path";
import * as utils from "./utils.js";

const args = parseArgs({
    options: {
        config: {
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
        },
        project: {
            type: "string",
        },
        asset: {
            type: "string",
        },
        version: {
            type: "string",
        },
    }
});

const { db_paths, db_tokenizable } = utils.parseConfigurations(utils.required(args, "config"), utils.required(args, "dir"));
const { list_projects, list_assets, list_versions, find_latest, read_summary, read_metadata } = utils.chooseSourceFunctions(utils.optional(args, "registry"), utils.optional(args, "gypsum"));

await manualHandler(
    db_paths, 
    utils.required(args, "project"), 
    utils.optional(args, "asset"), 
    utils.optional(args, "version"), 
    list_assets, 
    list_versions, 
    find_latest, 
    read_summary, 
    read_metadata, 
    db_tokenizable
);
