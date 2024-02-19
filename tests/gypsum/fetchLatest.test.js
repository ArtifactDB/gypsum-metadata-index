import * as utils from "./utils.js";
import { fetchLatest } from "../../src/gypsum/fetchLatest.js";

test("fetchLatest works as expected", async () => {
    let v = await fetchLatest(utils.testUrl, "test-R", "basic");
    expect(v).not.toBeNull();

    // Just returns null if the ..latest file doesn't exist.
    let v0 = await fetchLatest(utils.testUrl, "test-R", "asset_does_not_exist");
    expect(v0).toBeNull();
});
