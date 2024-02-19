import * as utils from "./utils.js";
import { readSummary } from "../../src/gypsum/readSummary.js";

test("fetchLatest works as expected", async () => {
    let v = await readSummary(utils.testUrl, "test-R", "basic", "v1");
    expect(typeof v.upload_user_id).toBe("string");
});
