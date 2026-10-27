import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LoadingState from "../../../shared/ui/LoadingState";
import Badge from "../../../shared/ui/Badge";
import { JOB_STAGES, getColumnKey, nextStage, prevStage } from "../pipeline";
import { customerName, dueNote, formatDate, jobStatusLabel, jobStatusTone } from "../format";

// Jobs by stage (PI tail, PUI board styles). Columns and moves come only from
// pipeline.js: a job moves one column at a time, and only users who can edit
// jobs see the move buttons. The board shows the jobs it was given (the page
// says when that is not every matching job); column counts are of those.
export default function JobsPipelineBoard({ items = [], loading = false, canMove = false, onMove, busyId = "" }) {
  const columns = useMemo(() => {
    const map = Object.fromEntries(JOB_STAGES.map((s) => [s.key, []]));
    for (const j of items) map[getColumnKey(j.status || "brief")].push(j);
    return map;
  }, [items]);

  if (loading) return <LoadingState rows={4} label="Loading the board" />;

  return (
    <div className="px-board" role="list" aria-label="Jobs by stage">
      {JOB_STAGES.map((stage, i) => {
        const col = columns[stage.key];
        return (
          <section key={stage.key} className="px-board-col" role="listitem" aria-label={`${stage.label}, ${col.length} shown`}>
            <h3>
              {stage.label}
              <small>{col.length}</small>
            </h3>
            {col.length ? (
              col.map((j) => {
                const due = dueNote(j);
                const sub = [customerName(j), j.dueDate ? `Due ${formatDate(j.dueDate)}` : null].filter(Boolean).join(" · ");
                return (
                  <article key={j._id} className="px-board-card">
                    <Link to={`/portal/jobs/${j._id}`}>{j.title || "Untitled job"}</Link>
                    <span className="px-s">{sub || "No client or due date"}</span>
                    <span>
                      <Badge tone={jobStatusTone(j.status)}>{jobStatusLabel(j.status)}</Badge>
                      {due ? <small className="px-s" data-tone={due.tone}>{` ${due.text}`}</small> : null}
                    </span>
                    {canMove ? (
                      <div className="px-board-moves">
                        <button
                          type="button"
                          className="px-btn px-btn--ghost px-btn--sm"
                          disabled={i === 0 || busyId === j._id}
                          onClick={() => onMove?.(j, prevStage(j.status))}
                          aria-label={`Move ${j.title || "job"} back to ${JOB_STAGES[i - 1]?.label || stage.label}`}
                        >
                          <ChevronLeft size={14} aria-hidden="true" />
                          Back
                        </button>
                        <button
                          type="button"
                          className="px-btn px-btn--ghost px-btn--sm"
                          disabled={i === JOB_STAGES.length - 1 || busyId === j._id}
                          onClick={() => onMove?.(j, nextStage(j.status))}
                          aria-label={`Move ${j.title || "job"} on to ${JOB_STAGES[i + 1]?.label || stage.label}`}
                        >
                          Next
                          <ChevronRight size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <p className="px-board-more">No jobs</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
