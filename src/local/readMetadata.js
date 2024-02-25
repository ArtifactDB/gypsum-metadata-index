import * as fs from "fs";
import * as path from "path";

export async function readMetadata(registry, project, asset, version, to_extract) {
    const output = {};
    for (const s of to_extract) {
        output[s] = {};
    }

    let collected_base = [];
    let collected_key = [];
    let collected_meta = [];
    function add(base, key, promise) {
        collected_base.push(base);
        collected_key.push(key);
        collected_meta.push(promise);
    }

    collect_metadata(path.join(registry, project, asset, version), null, null, output, add);

    collected_meta = await Promise.all(collected_meta);
    for (var i = 0; i < collected_meta.length; ++i) {
        output[collected_base[i]][collected_key[i]] = JSON.parse(collected_meta[i]);
    }

    return output;
}

function collect_metadata(full, at, base, extractable, add) {
    let info = fs.statSync(full);
    const new_at = (at == null ? base : at + "/" + base);
    if (info.isDirectory()) {
        const contents = fs.readdirSync(full);
        for (const p of contents) {
            collect_metadata(path.join(full, p), new_at, p, extractable, add);
        }
    } else if (base in extractable) {
        add(base, new_at, fs.promises.readFile(full, { encoding: 'utf8' }));
    }
}
