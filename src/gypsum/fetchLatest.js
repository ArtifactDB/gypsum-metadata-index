import { fetchJson } from "./utils.js";

export async function fetchLatest(url, project, asset) {
    const found = await fetchJson(url, project + "/" + asset + "/..latest", { mustWork: false });
    if (found == null) {
        return null;
    }
    return found.version;
}
