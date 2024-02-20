import * as fs from "fs";

export async function listDirectories(path) {
    const listing = await fs.promises.readdir(path, { withFileTypes: true });
    let output = [];
    for (const l of listing) {
        if (!l.name.startsWith("..") && l.isDirectory()) {
            output.push(l.name);
        }
    }
    return output;
}
