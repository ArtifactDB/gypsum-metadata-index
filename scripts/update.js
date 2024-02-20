import { updateHandler } from "../src/handlers/updateHandler.js";
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
        }
    }
});

const dir = utils.required(args, "dir");
const { db_paths, db_tokenizable } = utils.parseConfigurations(utils.required(args, "config"), dir);
const { list_logs, read_log, read_metadata, find_latest } = utils.chooseSourceFunctions(utils.optional(args, "registry"), utils.optional(args, "gypsum"));

let lastmod_path = path.join(dir, "modified");
let lastmod = new Date(Number(fs.readFileSync(lastmod_path)));
let all_logs = await updateHandler(db_paths, lastmod, list_logs, read_log, read_metadata, find_latest, db_tokenizable);

// Storing the timestamp of the last processed job.
if (all_logs.length) {
    let last_time = all_logs[all_logs.length - 1].time.getTime();
    fs.writeFileSync(lastmod_path, String(last_time));
}
