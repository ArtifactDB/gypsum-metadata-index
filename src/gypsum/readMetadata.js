import { fetchJson } from "./utils.js";

export async function readMetadata(url, project, asset, version, to_extract) {
    const output = {};
    for (const s of to_extract) {
        output[s] = {};
    }

    let manifest = await fetchJson(url, project + "/" + asset + "/" + version + "/..manifest");
    for (const [k, v] of Object.entries(manifest)) {
        let i = k.lastIndexOf("/");
        let base = (i < 0 ? k : k.slice(i + 1));
        if (base in output) {
            let dir = (i < 0 ? "." : k.slice(0, i));

            let key;
            if ("link" in v) {
                let target = v.target;
                if ("ancestor" in target) {
                    target = target.ancestor;
                }
                key = target.project + "/" + target.asset + "/" + target.version + "/" + target.path;
            } else {
                key = project + "/" + asset + "/" + version + "/" + k;
            }

            output[base][dir] = await fetchJson(url, key);
        }
    }

    return accumulated;
}
