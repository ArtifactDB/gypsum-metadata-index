import { quickList } from "./utils.js";

export async function listAssets(url, project) {
    let prefix = project + "/";
    let options = { Prefix: prefix, Delimiter: "/" };

    let accumulated = [];
    await quickList(url, options, resp => {
        if ("CommonPrefixes" in resp) {
            for (const x of resp.CommonPrefixes) {
                let y = x.Prefix;
                let i = y.lastIndexOf("/");
                if (i >= 0) {
                    y = y.slice(prefix.length, i);
                } else {
                    y = y.slice(prefix.length);
                }

                if (y.startsWith("..")) {
                    continue
                }
                accumulated.push(y);
            }
        }
    });

    return accumulated;
}
