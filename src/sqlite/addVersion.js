import { splitIntoTokens } from "./splitIntoTokens.js";

export function addVersion(db, project, asset, version, latest, summary, metadata) {
    const trans = db.transaction(() => {
        db.prepare("DELETE FROM versions WHERE project = ? AND asset = ? AND VERSION = ?").run(project, asset, version);
        if (latest) {
            db.prepare("UPDATE versions SET latest = 0 WHERE project = ? AND asset = ?").run(project, asset);
        }

        let vinfo = db.prepare("INSERT INTO versions(project, asset, version, latest, user, time) VALUES(?, ?, ?, ?, ?, ?) RETURNING vid").get(
            project, 
            asset, 
            version, 
            Number(latest), 
            summary.upload_user_id,
            Number(new Date(summary.upload_finish))
        );

        const vid = vinfo.vid;

        const token_stmt = db.prepare("INSERT OR IGNORE INTO tokens(token) VALUES(?)");
        const field_stmt = db.prepare("INSERT OR IGNORE INTO fields(field) VALUES(?)");
        const link_stmt = db.prepare("INSERT INTO links(pid, fid, tid) VALUES(?, (SELECT fid FROM fields WHERE field = ?), (SELECT tid FROM tokens WHERE token = ?))");
        function insert_token(pid, field, token) {
            token_stmt.run(token);
            field_stmt.run(field);
            link_stmt.run(pid, field, token);
        }

        for (const [p, m] of Object.entries(metadata)) {
            let pinfo = db.prepare("INSERT INTO paths(vid, path, metadata) VALUES(?, ?, jsonb(?)) RETURNING pid").get(vid, p, JSON.stringify(m));
            let pid = pinfo.pid;
            traverse_metadata(db, pid, m, null, insert_token);
        }
    });

    trans();
    return;
}

function traverse_metadata(db, pid, metadata, property, insert_token) {
    if (metadata instanceof Array) {
        for (const v of metadata) {
            traverse_metadata(db, pid, v, property, insert_token);
        }
    } else if (metadata instanceof Object) {
        for (const [k, v] of Object.entries(metadata)) {
            let newname = (property == null ? k : property + "." + k);
            traverse_metadata(db, pid, v, newname, insert_token);
        }
    } else {
        if (typeof metadata == "string") {
            let tokens = splitIntoTokens(metadata);
            for (const t of tokens) {
                insert_token(pid, property, t);
            }
        }
    }
}
