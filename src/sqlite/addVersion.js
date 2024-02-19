import { splitIntoTokens } from "./splitIntoTokens.js";

export function addVersion(db, project, asset, version, latest, metadata, tokenizable) {
    db.prepare("DELETE FROM versions WHERE project = ? AND asset = ? AND VERSION = ?").run(project, asset, version);
    if (latest) {
        db.prepare("UPDATE versions SET latest = 0 WHERE project = ? AND asset = ?").run(project, asset);
    }

    let vinfo = db.prepare("INSERT INTO versions(project, asset, version, latest) VALUES(?, ?, ?, ?) RETURNING vid").get(project, asset, version, Number(latest));
    const vid = vinfo.vid;

    for (const [p, m] of Object.entries(metadata)) {
        let pinfo = db.prepare("INSERT INTO paths(vid, path, metadata) VALUES(?, ?, jsonb(?)) RETURNING pid").get(vid, p, JSON.stringify(m));
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
                insert_token(db, pid, property, t);
            }
        } else {
            insert_token(db, pid, property, String(metadata));
        }
    }
}

function insert_token(db, pid, field, token) {
    db.prepare("INSERT OR IGNORE INTO tokens(token) VALUES(?)").run(token);
    db.prepare("INSERT OR IGNORE INTO fields(field) VALUES(?)").run(field);
    db.prepare("INSERT INTO links(pid, fid, tid) VALUES(?, (SELECT fid FROM fields WHERE field = ?), (SELECT tid FROM tokens WHERE token = ?))").run(pid, field, token);
}
