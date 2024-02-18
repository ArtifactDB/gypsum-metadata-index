import * as fs from "fs";
import { listDirectories } from "./utils.js";

export function listProjects(registry) {
    return listDirectories(registry);
}
