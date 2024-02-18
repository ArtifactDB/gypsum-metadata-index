import * as fs from "fs";
import * as path from "path";
import { listDirectories } from "./utils.js";

export function listAssets(registry, project) {
    return listDirectories(path.join(registry, project));
}
