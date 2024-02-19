import * as utils from "./utils.js";
import { listVersions } from "../../src/gypsum/listVersions.js";

test("listVersions works as expected", async () => {
    let contents = await listVersions(utils.testUrl, "test-R", "basic");
    expect(contents.length).toBeGreaterThan(0);
    expect(contents.indexOf("v1")).toBeGreaterThanOrEqual(0);
});
