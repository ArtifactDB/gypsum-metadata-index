import * as fs from "fs";
import * as path from "path";

export function readMetadata(registry, project, asset, version, to_extract) {
    const output = {};
    for (const s of to_extract) {
        output[s] = {};
    }
    collect_metadata(path.join(registry, project, asset, version), null, null, output);
    return output;
}

function collect_metadata(full, at, base, output) {
    let info = fs.statSync(full);
    if (info.isDirectory()) {
        const contents = fs.readdirSync(full);
        for (const p of contents) {
            let new_at = (at == null ? base : at + "/" + base);
            collect_metadata(path.join(full, p), new_at, p, output);
        }
    } else if (base in output) {
        const contents = fs.readFileSync(full, { encoding: 'utf8', flag: 'r' });
        const key = (at == null ? "." : at);
        output[base][key] = JSON.parse(contents);
    }
}
