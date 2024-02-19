import { quickList } from "./utils.js";

export async function listLogs(url, threshold) {
    const prefix = "..logs/";

    let accumulated = [];
    await quickList(
        url,
        { Prefix: prefix, StartAfter: threshold }, 
        resp => {
            if ("Contents" in resp) {
                for (const x of resp.Contents) {
                    accumulated.push(x.Key.slice(prefix.length));
                }
            }
        }
    );

    return accumulated;
}
