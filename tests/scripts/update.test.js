import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";
import * as sutils from "./utils.js";
import { execSync } from "child_process";

test("update script works correctly", () => {
    const args = sutils.mockEnvironment("update");
    execSync(`./scripts/fresh.js --class ${args.classs[0]} --class ${args.classs[1]} --dir ${args.indices} --registry ${args.registry}`);

    // Adding some juicy logs.
    const logdir = path.join(args.registry, "..logs");
    fs.mkdirSync(logdir);

    const now = new Date;
    const older = new Date(now.getTime() - 100000);
    fs.writeFileSync(path.join(logdir, older.toISOString() + "_000000"), '{ "type":"delete-project", "project":"foo" }');
    const newer = new Date(now.getTime() + 100000);
    fs.writeFileSync(path.join(logdir, newer.toISOString() + "_000000"), '{ "type":"delete-version", "project":"foo", "asset":"bar", "version":"v1" }');

    execSync(`./scripts/update.js --class ${args.classs[0]} --class ${args.classs[1]} --dir ${args.indices} --registry ${args.registry}`, {stdio: 'inherit'});

    const db0 = path.join(args.indices, "stuff.sqlite3");
    const con0 = new Database(db0);
    let output = con0.prepare("SELECT * FROM versions").all();
    expect(output.length).toBe(1);
    expect(output[0].version).toBe("v2");

    const mod = path.join(args.indices, "modified");
    expect(Number(fs.readFileSync(mod, { encoding: "utf8" }))).toEqual(newer.getTime());

    // Re-running works as expected.
    execSync(`./scripts/update.js --class ${args.classs[0]} --class ${args.classs[1]} --dir ${args.indices} --registry ${args.registry}`);
    expect(Number(fs.readFileSync(mod, { encoding: "utf8" }))).toEqual(newer.getTime());
})
