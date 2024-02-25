import { fetchFile, fetchJson } from "./utils.js";

export async function readMetadata(url, project, asset, version, to_extract, { parse = true } = {}) {
    const output = {};
    for (const s of to_extract) {
        output[s] = {};
    }

    let collected_base = [];
    let collected_dir = [];
    let collected_meta = [];

    // Only added for testing; this option should not be used in practice.
    const fun = (parse ? fetchJson : (url, key) => fetchFile(url, key).then(x => x.Body.transformToString("utf-8")));

    let manifest = await fetchJson(url, project + "/" + asset + "/" + version + "/..manifest");
    for (const [k, v] of Object.entries(manifest)) {
        let i = k.lastIndexOf("/");
        let base = (i < 0 ? k : k.slice(i + 1));

        if (base in output) {
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

            collected_base.push(base);
            collected_dir.push(k);
            collected_meta.push(fun(url, key));
        }
    }

    collected_meta = await Promise.all(collected_meta);
    for (var i = 0; i < collected_meta.length; ++i) {
        output[collected_base[i]][collected_dir[i]] = collected_meta[i];
    }

    return output;
}
