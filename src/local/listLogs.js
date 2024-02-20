import * as fs from "fs";
import * as path from "path";

export async function listLogs(registry, threshold) {
    const logdir = path.join(registry, "..logs");
    const all_logs = await fs.promises.readdir(logdir);
    return all_logs.filter(x => (x > threshold));
}
