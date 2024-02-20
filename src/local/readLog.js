import * as fs from "fs";
import * as path from "path";

export async function readLog(registry, name) {
    const full = path.join(registry, "..logs", name);
    const contents = await fs.promises.readFile(full, { encoding: 'utf8' });
    return JSON.parse(contents);
}
