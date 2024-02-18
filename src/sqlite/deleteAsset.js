export function deleteAsset(db, project, asset) {
    db.prepare("DELETE FROM versions WHERE project = ? AND asset = ?").run(project, asset);
    return;
}
