import * as utils from "./utils.js";
import { listProjects } from "../../src/gypsum/listProjects.js";

test("listProjects works as expected", async () => {
    let contents = await listProjects(utils.testUrl);
    expect(contents.length).toBeGreaterThan(0);
    expect(contents.indexOf("test-R")).toBeGreaterThanOrEqual(0);
})
