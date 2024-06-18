import * as utils from "../utils.js";
import * as path from "path";
import * as fs from "fs";

export function mockEnvironment(name) {
    const testdir = utils.setupTestDirectory(name);

    const regdir = path.join(testdir, "registry") 
    fs.mkdirSync(regdir);
    fs.mkdirSync(path.join(regdir, "foo", "bar"), { recursive: true });
    fs.writeFileSync(path.join(regdir, "foo", "bar", "..latest"), JSON.stringify({ version: "v2" }));

    fs.mkdirSync(path.join(regdir, "foo", "bar", "v1"));
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v1", "..summary"), JSON.stringify({ upload_user_id: "aaron", upload_finish: "2024-06-18T13:29:56-0700" }));
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v1", "stuff.json"), JSON.stringify(utils.mockMetadata["chicken"]));
    fs.mkdirSync(path.join(regdir, "foo", "bar", "v1", "blah"));
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v1", "blah", "other.json"), JSON.stringify(utils.mockMetadata["illustrious"]));

    fs.mkdirSync(path.join(regdir, "foo", "bar", "v2"));
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v2", "..summary"), JSON.stringify({ upload_user_id: "jayaram", upload_finish: "2024-06-18T13:30:50+0700" }));
    fs.mkdirSync(path.join(regdir, "foo", "bar", "v2", "blah"));
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v1", "blah", "stuff.json"), JSON.stringify(utils.mockMetadata["marcille"]));
    fs.mkdirSync(path.join(regdir, "foo", "bar", "v2", "blah", "sub"));
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v2", "blah", "sub", "other.json"), JSON.stringify(utils.mockMetadata["macrophage"]));

    const inddir = path.join(testdir, "indices");
    fs.mkdirSync(inddir);
    return {
        registry: regdir,
        classs: ["stuff.json,stuff.sqlite3", "other.json,other.sqlite3"],
        indices: inddir,
    };
}
