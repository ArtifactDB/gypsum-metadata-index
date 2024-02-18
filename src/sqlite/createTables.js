export function createTables(db) {
    db.prepare("CREATE TABLE versions (vid INTEGER PRIMARY KEY, project STRING NOT NULL, asset STRING NOT NULL, version STRING NOT NULL, latest INTEGER NOT NULL)").run();
    db.prepare("CREATE INDEX index_versions ON versions(project, asset, version)").run();
    db.prepare("CREATE TABLE paths (pid INTEGER PRIMARY KEY, vid INTEGER NOT NULL, path STRING NOT NULL, metadata BLOB NOT NULL, FOREIGN KEY(vid) REFERENCES versions(vid) ON DELETE CASCADE)").run();
    db.prepare("CREATE INDEX index_paths ON paths(path)").run();
    db.prepare("CREATE TABLE tokens (pid INTEGER, field STRING NOT NULL, token STRING NOT NULL, FOREIGN KEY(pid) REFERENCES paths(pid) ON DELETE CASCADE)").run();
    db.prepare("CREATE INDEX index_tokens_field ON tokens(field, token)").run();
    db.prepare("CREATE INDEX index_tokens_token ON tokens(token)").run();
    return;
}
