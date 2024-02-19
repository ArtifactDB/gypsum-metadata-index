export function deleteProject(db, project) {
    // We don't bother pruning terms from the tokens and fields tables;
    // we'll probably need them later anyway.
    db.prepare("DELETE FROM versions WHERE project = ?").run(project);
    return;
}
