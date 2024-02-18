export function deleteVersion(db, project, asset, version) {
    db.prepare("DELETE FROM versions WHERE project = ? AND asset = ? AND VERSION = ?").run(project, asset, version);
    return;
}
