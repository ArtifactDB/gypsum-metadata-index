import { fetchJson } from "./utils.js";

export function readLog(url, name) {
    return fetchJson(url, "..logs/" + name);
}
