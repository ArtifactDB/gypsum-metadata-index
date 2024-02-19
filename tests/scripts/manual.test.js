import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";
import * as utils from "../utils.js";
import * as sutils from "./utils.js";
import { execSync } from "child_process";

test("manual script works correctly", () => {
    const tmp = utils.setupTestDirectory("manual");
    const args = sutils.mockEnvironment("manual");

    execSync(`node ./scripts/fresh.js --config ${args.configs[0]} --config ${args.configs[1]} --dir ${args.indices} --registry ${tmp}`);
    {
        execSync(`node ./scripts/manual.js --config ${args.configs[0]} --config ${args.configs[1]} --dir ${args.indices} --registry ${args.registry} --project foo --asset bar --version v1`);
        const db1 = path.join(args.indices, "other.sqlite3");
        let con1 = new Database(db1);
        let output = con1.prepare("SELECT * FROM versions").all();
        expect(output.length).toBe(1);
        expect(output[0].version).toBe("v1");
        con1.close();

        execSync(`node ./scripts/manual.js --config ${args.configs[0]} --config ${args.configs[1]} --dir ${args.indices} --registry ${args.registry} --project foo --asset bar`);
        con1 = new Database(db1);
        output = con1.prepare("SELECT * FROM versions").all();
        expect(output.length).toBe(2);
        con1.close();
    }

    execSync(`node ./scripts/fresh.js --config ${args.configs[0]} --config ${args.configs[1]} --dir ${args.indices} --registry ${tmp}`);
    {
        execSync(`node ./scripts/manual.js --config ${args.configs[0]} --config ${args.configs[1]} --dir ${args.indices} --registry ${args.registry} --project foo`);
        const db1 = path.join(args.indices, "other.sqlite3");
        const con1 = new Database(db1);
        let output = con1.prepare("SELECT * FROM versions").all();
        expect(output.length).toBe(2);
    }
})
