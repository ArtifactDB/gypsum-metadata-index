import * as fs from "fs";
import * as path from "path";
import * as utils from "../sqlite/utils.js";
import { listProjects } from "../../src/local/listProjects.js";

test("listProjects works correctly", () => {
    const testdir = utils.setupTestDirectory("listProjects");
    fs.mkdirSync(path.join(testdir, "foo"));
    fs.mkdirSync(path.join(testdir, "bar"));
    fs.mkdirSync(path.join(testdir, "..logs"));
    fs.writeFileSync(path.join(testdir, "whee"), "asdasd");

    const listing = listProjects(testdir);
    listing.sort();
    expect(listing).toEqual(["bar", "foo"]);
})
