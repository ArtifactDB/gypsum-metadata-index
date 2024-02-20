import * as fs from "fs";
import * as path from "path";

export async function readSummary(registry, project, asset, version) {
    const full = path.join(registry, project, asset, version, "..summary");
    const contents = await fs.promises.readFile(full, { encoding: 'utf8' });
    return JSON.parse(contents);
}
