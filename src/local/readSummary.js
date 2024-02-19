import * as fs from "fs";
import * as path from "path";

export function readSummary(registry, project, asset, version) {
    const full = path.join(registry, project, asset, version, "..summary");
    const contents = fs.readFileSync(full, { encoding: 'utf8', flag: 'r' });
    return JSON.parse(contents);
}
