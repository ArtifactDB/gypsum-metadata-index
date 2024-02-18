import * as fs from "fs";
import * as path from "path";

export function readLogs(registry, since) {
    // Subtracting a day to avoid problems with timezones.
    let threshold_string = null;
    if (since != null) {
        threshold_string = (new Date(since.getTime() - 1000 * 60 * 60 * 24)).toISOString()
    }

    const logdir = path.join(registry, "..logs");
    const all_logs = fs.readdirSync(logdir);

    let output = []
    for (const l of all_logs) {
        if (l < threshold_string) {
            continue;
        }

        let i_ = l.indexOf("_")
        if (i_ < 0) {
            continue;
        }

        let parsed = new Date(l.slice(0, i_));
        if (Number.isNaN(parsed)) {
            continue;
        }

        if (parsed <= since) {
            continue;
        }

        const contents = fs.readFileSync(path.join(logdir, l), { encoding: 'utf8', flag: 'r' });
        output.push({ time: parsed, log: JSON.parse(contents) });
    }

    return output;
}
