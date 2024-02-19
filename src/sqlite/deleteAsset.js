export function deleteAsset(db, project, asset) {
    // We don't bother pruning terms from the tokens and fields tables;
    // we'll probably need them later anyway.
    db.prepare("DELETE FROM versions WHERE project = ? AND asset = ?").run(project, asset);
    return;
}
