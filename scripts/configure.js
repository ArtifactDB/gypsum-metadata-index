import { parseArgs } from "node:util";
import * as fs from "fs";
import * as path from "path";
import * as utils from "./utils.js";

const args = parseArgs({
    options: {
        schema: {
            type: "string",
        },
        file_name: {
            type: "string",
        },
        db_name: {
            type: "string",
        }
    }
});

const schema = utils.optional(args, "schema");
const tokenizable = new Set;
if (schema != null) {
    function traverse_schema(x, path) {
        if (x.type == "object") {
            if ("properties" in x) {
                for (const [k, v] of Object.entries(x.properties)) {
                    traverse_schema(v, (path == null ? k : path + "." + k));
                }
            }
        } else if (x.type == "array") {
            if ("items" in x) {
                traverse_schema(x.items, path);
            }
        } else if (x.type == "string") {
            if ("_attributes" in x) {
                if (x._attributes.indexOf("free_text") >= 0) {
                    tokenizable.add(path);
                }
            }
        }
    }

    const schema_doc = fs.readFileSync(schema, { encoding: "utf8" });
    const loaded_schema = JSON.parse(schema_doc);
    traverse_schema(loaded_schema);
}

console.log(JSON.stringify({
    db_name: utils.required(args, "db_name"),
    file_name: utils.required(args, "file_name"),
    tokenizable: Array.from(tokenizable)
}))
