export function createTables(db) {
    db.prepare("CREATE TABLE versions (vid INTEGER PRIMARY KEY, project STRING NOT NULL, asset STRING NOT NULL, version STRING NOT NULL, latest INTEGER NOT NULL)").run();
    db.prepare("CREATE INDEX index_versions1 ON versions(project, asset, version)").run();
    db.prepare("CREATE INDEX index_versions2 ON versions(latest, project, asset)").run();

    db.prepare("CREATE TABLE paths (pid INTEGER PRIMARY KEY, vid INTEGER NOT NULL, path STRING NOT NULL, metadata BLOB NOT NULL, FOREIGN KEY(vid) REFERENCES versions(vid) ON DELETE CASCADE)").run();
    db.prepare("CREATE INDEX index_paths ON paths(path)").run();

    db.prepare("CREATE TABLE tokens (tid INTEGER PRIMARY KEY, token STRING NOT NULL UNIQUE)").run();
    db.prepare("CREATE INDEX index_tokens ON tokens(token)").run();

    db.prepare("CREATE TABLE fields (fid INTEGER PRIMARY KEY, field STRING NOT NULL UNIQUE)").run();
    db.prepare("CREATE INDEX index_fields ON fields(field)").run();

    db.prepare("CREATE TABLE links (pid INTEGER NOT NULL, fid INTEGER NOT NULL, tid INTEGER NOT NULL, FOREIGN KEY(pid) REFERENCES paths(pid) ON DELETE CASCADE)").run();
    db.prepare("CREATE INDEX index_links ON links(tid, fid)").run();
    return;
}
