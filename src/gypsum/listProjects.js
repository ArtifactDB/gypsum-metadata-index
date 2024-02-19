import { quickList } from "./utils.js";

export async function listProjects(url) {
    let options = { Delimiter: "/" };

    let accumulated = [];
    await quickList(url, options, resp => {
        if ("CommonPrefixes" in resp) {
            for (const x of resp.CommonPrefixes) {
                let y = x.Prefix;
                if (y.startsWith("..")) {
                    continue
                }
                let i = y.indexOf("/");
                if (i >= 0) {
                    y = y.slice(0, i);
                }
                accumulated.push(y);
            }
        }
    });

    return accumulated;
}
