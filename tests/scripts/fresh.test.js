import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";
import * as sutils from "./utils.js";
import { execSync } from "child_process";
import * as utils from "../utils.js";

test("fresh script works correctly", () => {
    const args = sutils.mockEnvironment("fresh");
    execSync(`node ./scripts/fresh.js --config ${args.configs[0]} --config ${args.configs[1]} --dir ${args.indices} --registry ${args.registry}`);

    const db0 = path.join(args.indices, "stuff.sqlite3");
    const con0 = new Database(db0);
    let output = utils.scanForToken(con0, 'creamy');
    expect(output.length).toBeGreaterThan(0);
    output = utils.scanForToken(con0, 'vox');
    expect(output.length).toBe(0);

    const db1 = path.join(args.indices, "other.sqlite3");
    const con1 = new Database(db1);
    output = utils.scanForToken(con1, 'creamy');
    expect(output.length).toBe(0);
    output = utils.scanForToken(con1, 'vox');
    expect(output.length).toBeGreaterThan(0);

    const mod = path.join(args.indices, "modified");
    expect(Number(fs.readFileSync(mod, { encoding: "utf8" }))).toBeLessThan((new Date).getTime());
})
