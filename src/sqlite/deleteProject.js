export function deleteProject(db, project) {
    db.prepare("DELETE FROM versions WHERE project = ?").run(project);
    return;
}
