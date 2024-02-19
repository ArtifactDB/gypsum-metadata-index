import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";
import * as utils from "../utils.js";
import { execSync } from "child_process";

test("configure script works correctly", () => {
    const testdir = utils.setupTestDirectory("configure");
    const schema_path = path.join(testdir, "schema.json");
    fs.writeFileSync(
        schema_path,
        `{
    "type": "object",
    "properties": {
        "foo": {
            "type": "string"
        },
        "bar": {
            "type": "number"
        },
        "whee": {
            "type": "string",
            "_attributes": [ "free_text" ]
        },
        "blah": {
            "type": "array",
            "items": {
                "type": "number"
            }
        },
        "stuff": {
            "type": "array",
            "items": {
                "type": "string",
                "_attributes": [ "free_text" ]
            }
        },
        "other": {
            "type": "object",
            "properties": {
                "blah": {
                    "type": "string"
                },
                "foobar": {
                    "type": "string",
                    "_attributes": [ "free_text" ]
                }
            }
        }
    }
}`);

    let output = execSync(`node ./scripts/configure.js --schema ${schema_path} --file_name falin --db_name marcille`);
    const dec = new TextDecoder;
    let parsed = JSON.parse(dec.decode(output));
    expect(parsed.file_name).toBe("falin");
    expect(parsed.db_name).toBe("marcille");

    parsed.tokenizable.sort();
    const expected = [ "stuff", "whee", "other.foobar" ];
    expected.sort();
    expect(parsed.tokenizable).toEqual(expected);

    // Schema is actually optional.
    output = execSync(`node ./scripts/configure.js --file_name falin --db_name marcille`);
    parsed = JSON.parse(dec.decode(output));
    expect(parsed.tokenizable).toEqual([]);
})
