import * as fs from "fs";
import * as path from "path";

export function fetchLatest(registry, project, asset) {
    const full = path.join(registry, project, asset, "..latest");
    if (!fs.existsSync(full)) {
        return null;
    }
    const latest = fs.readFileSync(full);
    return JSON.parse(latest).version;
}
