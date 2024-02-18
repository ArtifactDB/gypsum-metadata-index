import * as fs from "fs";

export function listDirectories(path) {
    const listing = fs.readdirSync(path, { withFileTypes: true });
    let output = [];
    for (const l of listing) {
        if (!l.name.startsWith("..") && l.isDirectory()) {
            output.push(l.name);
        }
    }
    return output;
}
