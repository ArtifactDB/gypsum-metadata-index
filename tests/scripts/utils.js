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
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v1", "..summary"), JSON.stringify({ upload_user_id: "aaron" }));
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v1", "stuff.json"), JSON.stringify(utils.mockMetadata["chicken"]));
    fs.mkdirSync(path.join(regdir, "foo", "bar", "v1", "blah"));
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v1", "blah", "other.json"), JSON.stringify(utils.mockMetadata["illustrious"]));

    fs.mkdirSync(path.join(regdir, "foo", "bar", "v2"));
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v2", "..summary"), JSON.stringify({ upload_user_id: "aaron" }));
    fs.mkdirSync(path.join(regdir, "foo", "bar", "v2", "blah"));
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v1", "blah", "stuff.json"), JSON.stringify(utils.mockMetadata["marcille"]));
    fs.mkdirSync(path.join(regdir, "foo", "bar", "v2", "blah", "sub"));
    fs.writeFileSync(path.join(regdir, "foo", "bar", "v2", "blah", "sub", "other.json"), JSON.stringify(utils.mockMetadata["macrophage"]));

    const confdir = path.join(testdir, "configs");
    fs.mkdirSync(confdir);
    const conf1 = path.join(confdir, "1.json");
    fs.writeFileSync(conf1, JSON.stringify({ 
        file_name: "stuff.json",
        db_name: "stuff.sqlite3",
        tokenizable: [ "description" ]
    }));
    const conf2 = path.join(confdir, "2.json");
    fs.writeFileSync(conf2, JSON.stringify({ 
        file_name: "other.json",
        db_name: "other.sqlite3",
        tokenizable: [ "motto" ]
    }));

    const inddir = path.join(testdir, "indices");
    fs.mkdirSync(inddir);
    return {
        registry: regdir,
        configs: [conf1, conf2],
        indices: inddir,
    };
}
