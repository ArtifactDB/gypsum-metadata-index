import * as fs from "fs";
import * as path from "path";

export async function fetchLatest(registry, project, asset) {
    const full = path.join(registry, project, asset, "..latest");

    // equivalent to existsSync but operates asynchronously.
    try {
        await fs.promises.stat(full);
    } catch (err) {
        if (err.code == "ENOENT") {
            return null;
        }
    }

    const latest = await fs.promises.readFile(full, { encoding: "utf8" });
    return JSON.parse(latest).version;
}
