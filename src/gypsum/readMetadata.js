import { fetchFile, fetchJson } from "./utils.js";

export async function readMetadata(url, project, asset, version, to_extract, { parse = true } = {}) {
    const output = {};
    for (const s of to_extract) {
        output[s] = {};
    }

    const fun = (parse ? fetchJson : (url, key) => fetchFile(url, key).then(x => x.Body.transformToString("utf-8")));

    let manifest = await fetchJson(url, project + "/" + asset + "/" + version + "/..manifest");
    for (const [k, v] of Object.entries(manifest)) {
        let i = k.lastIndexOf("/");
        let base = (i < 0 ? k : k.slice(i + 1));
        if (base in output) {
            let dir = (i < 0 ? "." : k.slice(0, i));

            let key;
            if ("link" in v) {
                let target = v.link;
                if ("ancestor" in target) {
                    target = target.ancestor;
                }
                key = target.project + "/" + target.asset + "/" + target.version + "/" + target.path;
            } else {
                key = project + "/" + asset + "/" + version + "/" + k;
            }

            output[base][dir] = await fun(url, key);
        }
    }

    return output;
}
