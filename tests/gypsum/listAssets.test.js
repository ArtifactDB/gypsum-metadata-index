import * as utils from "./utils.js";
import { listAssets } from "../../src/gypsum/listAssets.js";

test("listAssets works as expected", async () => {
    let contents = await listAssets(utils.testUrl, "test-R");
    expect(contents.length).toBeGreaterThan(0);
    expect(contents.indexOf("basic")).toBeGreaterThanOrEqual(0);
});
