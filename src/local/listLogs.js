import * as fs from "fs";
import * as path from "path";

export function listLogs(registry, threshold) {
    const logdir = path.join(registry, "..logs");
    const all_logs = fs.readdirSync(logdir);
    return all_logs.filter(x => (x > threshold));
}
