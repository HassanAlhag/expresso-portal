import React from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import Badge from "../../../shared/ui/Badge";
import { BriefcaseBusiness } from "lucide-react";

export default function CustomerProjectsTab({
  projectsLoading,
  projectsError,
  projects,
  onOpenProject,
}) {
  if (projectsLoading) {
    return (
      <Card className="p-6">
        <div className="grid gap-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  if (projectsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
        {projectsError}
      </div>
    );
  }

  if (!projects.length) {
    return (
      <EmptyState
        icon={BriefcaseBusiness}
        title="No projects yet"
        message="This client has no additional or delivery projects yet."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {projects.map((project) => (
        <button
          key={project._id}
          className="rounded-[28px] border border-black/[0.07] bg-white p-5 text-left shadow-sm transition hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]"
          onClick={() => onOpenProject(project._id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-black text-slate-900">
                  {project.name}
                </div>

                <Badge tone="neutral">
                  {String(project.type || "project").toUpperCase()}
                </Badge>

                <Badge tone="info">
                  {String(project.status || "draft").toUpperCase()}
                </Badge>
              </div>

              <div className="mt-2 text-sm text-slate-600">
                {project.description || project.notes || "No description"}
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>
                  Priority:{" "}
                  <span className="font-black text-slate-900">
                    {project.priority || "—"}
                  </span>
                </span>

                <span>
                  Team:{" "}
                  <span className="font-black text-slate-900">
                    {project.team || "—"}
                  </span>
                </span>

                <span>
                  Created:{" "}
                  <span className="font-black text-slate-900">
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </span>
              </div>
            </div>

            <Button variant="outline">Open</Button>
          </div>
        </button>
      ))}
    </div>
  );
}
