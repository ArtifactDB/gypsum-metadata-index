import * as fs from "fs";
import * as path from "path";

export function readLog(registry, name) {
    const contents = fs.readFileSync(path.join(registry, "..logs", name), { encoding: 'utf8', flag: 'r' });
    return JSON.parse(contents);
}
