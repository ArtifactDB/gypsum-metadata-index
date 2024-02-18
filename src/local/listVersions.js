import * as fs from "fs";
import * as path from "path";

export function listVersions(registry, project, asset) {
    const full = path.join(registry, project, asset);
    const found = fs.readdirSync(full);
    return found.filter(x => !x.startsWith(".."));
}
