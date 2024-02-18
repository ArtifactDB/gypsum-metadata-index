import { splitIntoTokens } from "./splitIntoTokens.js";

export function addVersion(db, project, asset, version, latest, metadata, tokenizable) {
    db.prepare("DELETE FROM versions WHERE project = ? AND asset = ? AND VERSION = ?").run(project, asset, version);
    if (latest) {
        db.prepare("UPDATE versions SET latest = 0 WHERE project = ? AND asset = ?").run(project, asset);
    }

    let vinfo = db.prepare("INSERT INTO versions(project, asset, version, latest) VALUES(?, ?, ?, ?) RETURNING vid").get(project, asset, version, Number(latest));
    const vid = vinfo.vid;

    for (const [p, m] of Object.entries(metadata)) {
        let pinfo = db.prepare("INSERT INTO paths(vid, path) VALUES(?, ?) RETURNING pid").get(vid, p);
        let pid = pinfo.pid;
        traverse_metadata(db, pid, m, null, tokenizable);
    }

    return;
}

function traverse_metadata(db, pid, metadata, property, tokenizable) {
    if (metadata instanceof Array) {
        for (const v of metadata) {
            traverse_metadata(db, pid, v, property, tokenizable);
        }
    } else if (metadata instanceof Object) {
        for (const [k, v] of Object.entries(metadata)) {
            let newname = (property == null ? k : property + "." + k);
            traverse_metadata(db, pid, v, newname, tokenizable);
        }
    } else {
        if (typeof metadata == "string" && tokenizable.has(property)) {
            let tokens = splitIntoTokens(metadata);
            for (const t of tokens) {
                db.prepare("INSERT INTO tokens(pid, field, token) VALUES(?, ?, ?)").run(pid, property, t);
            }
        } else {
            db.prepare("INSERT INTO tokens(pid, field, token) VALUES(?, ?, ?)").run(pid, property, String(metadata));
        }
    }
}
