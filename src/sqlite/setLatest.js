export function setLatest(db, project, asset, version) {
    db.prepare("UPDATE versions SET latest = 0 WHERE project = ? AND asset = ? AND version != ?").run(project, asset, version);
    db.prepare("UPDATE versions SET latest = 1 WHERE project = ? AND asset = ? AND version = ?").run(project, asset, version);
    return;
}
