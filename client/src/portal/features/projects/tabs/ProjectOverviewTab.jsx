import React from "react";
import Card from "../../../shared/ui/Card";
import Badge from "../../../shared/ui/Badge";

function InfoItem({ label, value }) {
  return (
    <div>
      <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-800">{value || "—"}</div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
}

function formatMoney(currency, amount) {
  if (amount === null || amount === undefined || amount === "") return "—";
  return `${currency || "AED"} ${amount}`;
}

function humanize(value) {
  return String(value || "—").replaceAll("_", " ");
}

export default function ProjectOverviewTab({ project, customer }) {
  const isInternal = project?.projectMode === "internal";
  const tags = Array.isArray(project?.tags) ? project.tags : [];

  return (
    <div className="grid gap-4">
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{humanize(project?.projectMode)}</Badge>
          <Badge tone="neutral">{humanize(project?.source)}</Badge>
          <Badge tone="neutral">{humanize(project?.type)}</Badge>
          <Badge tone="neutral">{humanize(project?.status)}</Badge>
          <Badge tone="neutral">{humanize(project?.priority)}</Badge>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="PROJECT NAME" value={project?.name} />
          <InfoItem label="CODE" value={project?.code} />
          <InfoItem label="TEAM" value={project?.team} />
          <InfoItem label="OWNER" value={project?.ownerUserId?.fullName} />

          <InfoItem
            label="BUDGET"
            value={formatMoney(project?.currency, project?.budget)}
          />
          <InfoItem label="START DATE" value={formatDate(project?.startDate)} />
          <InfoItem label="DUE DATE" value={formatDate(project?.endDate)} />
          <InfoItem
            label="TARGET LAUNCH"
            value={formatDate(project?.targetLaunchDate)}
          />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
            PROJECT CONTEXT
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoItem label="MODE" value={humanize(project?.projectMode)} />
            <InfoItem label="SOURCE" value={humanize(project?.source)} />
            <InfoItem label="TYPE" value={humanize(project?.type)} />
            <InfoItem label="STATUS" value={humanize(project?.status)} />
            <InfoItem label="PRIORITY" value={humanize(project?.priority)} />
            <InfoItem
              label="ENROLLMENT LINK"
              value={project?.enrollmentId ? "Linked" : "Not linked"}
            />
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
              TAGS
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {tags.length ? (
                tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))
              ) : (
                <div className="text-sm text-slate-600">No tags yet</div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
            {isInternal ? "OWNER / INTERNAL CONTEXT" : "CLIENT"}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoItem
              label={isInternal ? "INTERNAL PROJECT" : "COMPANY"}
              value={isInternal ? "Yes" : customer?.companyName}
            />
            <InfoItem
              label={isInternal ? "OWNER" : "CONTACT"}
              value={
                isInternal
                  ? project?.ownerUserId?.fullName || "—"
                  : customer?.contactName
              }
            />
            <InfoItem
              label={isInternal ? "OWNER EMAIL" : "EMAIL"}
              value={
                isInternal
                  ? project?.ownerUserId?.email || "—"
                  : customer?.primaryEmail
              }
            />
            <InfoItem label="PHONE" value={customer?.phone} />
          </div>

          {!customer && !isInternal ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This project currently has no loaded customer details.
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
          DESCRIPTION
        </div>
        <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
          {project?.description || "—"}
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
          INTERNAL NOTES
        </div>
        <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
          {project?.notes || "—"}
        </div>
      </Card>
    </div>
  );
}
