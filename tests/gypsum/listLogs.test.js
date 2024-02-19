import * as utils from "./utils.js";
import { listLogs } from "../../src/gypsum/listLogs.js";

test("listLogs works as expected", async () => {
    const threshold = (new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)).toISOString();

    // Can't really do a lot of tests here, as we don't know what the current logs are.
    let all_logs = await listLogs(utils.testUrl, threshold);
    for (const x of all_logs) {
        expect(x >= threshold).toBe(true);
    }
});
