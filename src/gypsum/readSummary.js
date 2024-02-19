import { fetchJson } from "./utils.js";

export function readSummary(url, project, asset, version) {
    return fetchJson(url, project + "/" + asset + "/" + version + "/..summary");
}
