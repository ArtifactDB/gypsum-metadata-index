export function deleteVersion(db, project, asset, version) {
    // We don't bother pruning terms from the tokens and fields tables;
    // we'll probably need them later anyway.
    db.prepare("DELETE FROM versions WHERE project = ? AND asset = ? AND VERSION = ?").run(project, asset, version);
    return;
}
