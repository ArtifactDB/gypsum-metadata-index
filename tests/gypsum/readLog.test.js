import * as utils from "./utils.js";
import { listLogs } from "../../src/gypsum/listLogs.js";
import { readLog } from "../../src/gypsum/readLog.js";

test("readLog works as expected", async () => {
    // Hard to say if a lot is actually present, but if it is, we'll try to load it in.
    let all_logs = await listLogs(utils.testUrl, "zzzz");
    if (all_logs.length) {
        const out = readLog(utils.testUrl, all_logs[0])
        expect(typeof out.type).toBe("string");
    }
});
