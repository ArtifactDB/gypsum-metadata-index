import { fetchJson } from "./utils.js";

export function fetchLatest(url, project, asset) {
    const found = fetchJson(url, project + "/" + asset + "/..latest", { mustWork: false });
    if (found == null) {
        return null;
    }
    return found.version;
}
