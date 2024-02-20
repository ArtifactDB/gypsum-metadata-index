import * as fs from "fs";
import * as path from "path";
import { listDirectories } from "./utils.js";

export function listVersions(registry, project, asset) {
    return listDirectories(path.join(registry, project, asset));
}
