# Operating Model Phase 1 — internal client delivery

Implemented on the approved Blueprint baseline `e3b91e7f55f2c50ce47da7248572c472cb892c33`. Blueprint closure and its external deployment acceptance remain unchanged. This chapter adds internal operating behavior; it does not authorize cleanup, seeds, production access or deployment.

## Relationships and authority

- Customer identifies the client. `accountManagerId` is the agency relationship owner; `ownerUserId` continues to identify the main client login.
- ServiceTemplate supplies editable defaults only.
- Enrollment owns an ongoing service agreement and its accepted revisions. Existing Customer/ServiceTemplate uniqueness remains.
- DeliveryPeriod is the only new core collection. It records recurring entitlement, adjustments and reconciliation.
- Project organizes phased/one-off work. A standalone Project owns its accepted agreement. A Project linked through `enrollmentId` references the Enrollment revision and stores no competing agreement copy.
- Job is the work/deliverable. Jobs, Productions and Content Calendar use the same records and managed mutation rules.

An Enrollment for a phased/one-off service activates into a linked managed Project and Jobs, not monthly periods. Independent additional engagements may be created directly from the client as standalone Projects, including repeated work of the same catalog service.

## Managed and legacy records

`operatingModelVersion: 1` marks explicitly confirmed/adopted records. Optional fields preserve legacy Customers, Enrollments, Projects and Jobs. Existing CRUD and suggested plans remain available for legacy records. Managed scope and state changes use the commands below.

CRM handoff creates an agreement draft. Drafts cannot use the old one-shot Enrollment generator. Confirming the agreement does not activate it or create obligations. Won alone also creates no obligations.

Activation refuses an adoption mapping outside the explicitly confirmed first-period quantities, so selected legacy work cannot be silently omitted.

There is no automatic migration, historical scope inference, Job regeneration or title-based adoption. No migration/seed was executed by this implementation.

## Agreement confirmation and revision

Open Enrollment or Project details and use **Delivery agreement and operations**. Confirm actual quantities, scope identifiers, units, delivery model, term, timezone, delivery cadence, commercial amount/currency/billing cycle, relationship responsibility, Execution Lead, Team, approval route and client acceptance evidence. A service selected on a standalone Project supplies defaults that staff must confirm. A Deal value is a suggestion requiring allocation/confirmation, not a price automatically copied into every accepted service.

Private agreement documents are selected from the client's Files, or an agreement reference is recorded. Internal reference IDs are validated on the API. File ownership/private storage, active internal staff and active Teams are checked. Required reviewers/recorders need effective `jobs.read` and `jobs.approve`; ownership never grants these permissions.

Accepted revisions are append-only snapshots with an ID/number, effective date, client acceptance, reason, recorder and timestamps. Catalog changes and ordinary notes edits do not rebuild accepted scope. Earlier periods/Jobs retain their original revision IDs.

Future monthly package changes take effect at a monthly boundary after already opened periods. Renewals may start a new partial first month, with explicit quantities. Existing delivery models are not silently changed by a revision. Current-month extras use an adjustment; a different engagement uses a separate Project.

Operational ownership can change with a reason without rewriting commercial history. New work resolves current owners; existing submitted approval routes retain their reviewers until explicitly delegated/re-submitted.

## DeliveryPeriod and activation

Periods store UTC instants plus the agreed IANA timezone. Start is inclusive and end is exclusive; agreement end dates are inclusive local calendar dates. Billing cadence and delivery cadence are separate. Phase 1 supports monthly recurring delivery and once-only project delivery.

The database invariant is unique `(enrollmentId, periodStart)`, excluding agreement revision. The Enrollment write inside the transaction serializes overlapping-period checks. A period cannot overlap another period or extend outside its effective term/month.

Preview proposes the next period. Partial first/last months require staff to confirm every quantity and explain the decision; there is no automatic proration. Activation creates the first period and its Jobs in one transaction. Later periods are opened manually. Existing-period and repeated/concurrent activation requests return existing resources without duplicate obligations.

The existing transaction utility is reused. Unsupported MongoDB topology is refused with 503; there is no non-transactional fallback. Failure rolls back activation, the period and all generated Jobs.

## Managed Job identity and delivery

Managed Jobs carry optional `originDeliveryPeriodId`, `workDeliveryPeriodId`, `agreementRevisionId`, `scopeLineId`, `scopeUnitOrdinal`, `managedObligationKey`, `phaseId` and `originalCommittedDueDate`. The obligation key has a partial unique index that excludes legacy rows. One generated Job represents one promised unit. Additional manually created legacy/unallocated work does not inflate contractual delivery counts.

Use the managed panel to assign staff, start work, attach/reference output, submit a revision, decide reviews, record blockers, schedule publication, reschedule a deadline and record delivery. `in_progress` supports general tasks; existing creative states remain.

Approved and scheduled are not delivered. Completion requires current required approvals, agreed delivery evidence and any predecessor phase acceptance. A publication criterion also requires recorded publication first. External publication records what staff published; it does not call a social network. Expresso website visibility remains a separate existing action.

Generic PATCH, old approval endpoints and website publication enforce managed rules. Changes to submitted output invalidate review state while retaining decisions. Managed Jobs cannot be hard-deleted, including through bulk delete. Bulk assignment records managed assignment history.

Reopening retains completion evidence, revokes current fulfillment and invalidates affected phase acceptances. A waiver is a distinct disposition and never counts as delivered. Original commitment and later scheduling dates remain separate.

## Carry, extras and reconciliation

Period summaries distinguish base entitlement, approved extras, carry-in workload, delivered original obligations, waived units and outstanding original obligations. Counts derive from immutable period scope and Job disposition history rather than editable totals.

Carry changes the original Job's work period, never its origin or identity. November 6 posts/8 videos with 5/7 delivered leaves 1/1 outstanding. December adds its own 6/8 Jobs, receives the two existing Jobs and shows 7/9 workload. Completing the carried work credits November; historical November outstanding remains reconstructable through event cutoffs.

Open the destination period first, select outstanding Jobs and record carry, reschedule, waive or leave-outstanding decisions with a reason. Carry destinations must belong to the same Enrollment and be later periods. Request IDs and period versions prevent duplicate/stale reconciliation or adjustment writes.

Approved extra units create separate adjustment Jobs and preserve base entitlement. `delivery.override` and client evidence are required. For new deliverable kinds or separate engagements, create an additional scoped Project instead of mutating historical base scope.

Expiry/pause prevents new entitlement. Existing work remains actionable. Expired services with open obligations display **Expired — Pending Closure**. After expiry, staff may reschedule/deliver the original Jobs without creating an out-of-term entitlement period. A missed historical period requires explicit override/reason after expiry. Early termination of future service requires an explicit override and client evidence; remaining obligations must still be resolved before closure.

## Phased and one-off Projects

Confirmed scope groups become stable phases with order, planned dates, optional predecessor, acceptance outcome and acceptance history. Managed Jobs reference phase IDs; text matching does not define managed membership. Phase plans can be edited before acceptance with a reason. Predecessors must be earlier phases, preventing cycles.

Required work must be delivered/waived before phase acceptance. The operational owner with `jobs.approve`, or a reasoned authorized override, accepts the outcome. A later phase cannot complete before its predecessor is accepted. Closing a managed Project requires resolved obligations and accepted phases. A reopened Job reopens the Project and invalidates its phase and subsequent acceptance history without deleting that history.

No DeliveryPeriod is created for phased/one-off Projects. Website work can originate from the CRM handoff or directly from an existing Customer.

## Approval route and recorded client decisions

Ordered sources are `EXECUTION_LEAD`, `ACCOUNT_OWNER`, `EXPLICIT_INTERNAL_USER` and `CLIENT_EXTERNAL_RECORDED`. Named internal reviewers and the authorized account-owner recorder are resolved to active internal Users. No employee name or job title is hard-coded.

Submission snapshots the route and output revision. Decisions bind to a step/revision and preserve actor, timestamp, decision, feedback and evidence. Required earlier steps must be approved first. A decision requires `jobs.approve` and the assigned identity. A different actor needs an explicit reasoned `delivery.override`.

For external client approval, the account-owner recorder supplies the client contact, decision date and evidence. The internal recorder is preserved; the system does not claim the client clicked an approval button. Changes-requested invalidates the submission; resubmission creates a new revision. Explicit delegation is audited and invalidates submitted review state.

## Blockers and provenance

Blockers are separate from workflow status. History records reason (`CONTENT`, `APPROVAL`, `ACCESS`, `FEEDBACK`, `DEPENDENCY`, `OTHER`), responsibility (`CLIENT`, `EXPRESSO`, `THIRD_PARTY`), start/end, staff recorder, note/evidence and next action/owner. Waiting does not automatically extend deadlines or excuse internal delay.

Critical agreement, period and Job events are persisted with the business transaction. The existing best-effort IAM audit log is not the sole authority. Data supports later promise/due/completed/outstanding/waived/carry, ownership, approval, blocker and deadline analysis. No KPI scoring or large reporting dashboard is implemented.

## API commands and permissions

All Operating Model routes require authenticated internal access. Existing permission resolution, stored-role authority, grants/revokes and external denials remain. Only `super_admin` bypasses permission checks. Even an authorized override must name an action and reason.

| Route | Use / permission |
|---|---|
| `GET /api/enrollments/:id/operating` | Overview, periods, preview and work; `enrollments.read` + `jobs.read` |
| `POST /api/enrollments/:id/operating/:command` | `confirm`, `revise`, `activate`, `open-period`, `ownership`, `state`; `enrollments.write`; activation/opening/adopted assignment also needs `jobs.write` |
| `POST /api/enrollments/:id/operating/periods/:periodId/:command` | `adjust`, `reconcile`; `enrollments.write` + `jobs.write`; reconciliation restricted to responsible lead/account owner or authorized manager |
| `GET /api/projects/:id/operating` | Overview, phases and work; `projects.read` + `jobs.read` |
| `POST /api/projects/:id/operating/:command` | `confirm`, `revise`, `activate`, `ownership`, `state`, `plan-phase`, `accept-phase`; `projects.write`, plus action-specific Job/approval checks |
| `POST /api/jobs/:id/operating/:command` | `submit`, `decide`, `publish`, `complete`, `reopen`, `start-blocker`, `end-blocker`, `delegate`, `waive`, `restore`, `exceptional-complete`; `jobs.read` and `jobs.write` or `jobs.approve` as appropriate |
| `GET /api/{customers,enrollments,projects,jobs}/:id/operating/options` | Minimal active internal staff/Team choices under the respective existing business write permission; no IAM management authority |

Mutations require a request ID. Job commands also require the displayed `expectedVersion`; period adjustments/reconciliation require the displayed period version. Repeat request IDs do not create duplicate decisions, carry or extra units. Stale work returns 409 and must be reloaded.

New keys are `jobs.approve` and `delivery.override`. Assign them deliberately through the existing IAM UI to appropriate internal roles/users. Stored roles are not silently expanded. Clients/vendors cannot acquire these internal capabilities, internal Jobs or Enrollment access. Customer/Project client projections exclude newly added commercial/operating internals.

## Reviewed adoption

Open a legacy Enrollment/Project, confirm actual accepted scope, cutover, ownership and the existing-work review. Optionally map selected outstanding legacy Jobs to explicit first-period/project units. Each selected Job/unit is unique and belongs to that owner/client. Completed/archived work is not automatically reclassified. Activation adopts those selected Jobs and creates only the remaining agreed units atomically. Unmapped work remains visible as unallocated legacy work.

Historical promise quantities and responsibility are not fabricated from Job titles. Adoption is a deliberate cutover, not a retrospective certification of earlier months. Existing phased work is adopted through its Project.

## Local validation and Phase 2 boundary

API tests include pure invariants/authorization and real disposable-Mongo journeys for SAH, website phases, CRM handoff, rollback, adoption, scope revision, ownership, concurrency and approval enforcement. The integration suite runs only with an explicit loopback test URI and creates/drops its own process-specific test database. It never uses production `MONGO_URI`. Client tests exercise agreement quantities, period counters, assigned approvals, recorded client decisions and stable phase actions.

Phase 1 intentionally leaves next-month opening, reconciliation, commercial confirmation, client decision recording and exceptions manual with system support. Phase 2 may add scheduled month opening, reminders/escalation and dedicated company-scoped client review. No client delivery self-service, scheduled generation, automatic assignment, social publishing integration, billing automation or KPI scoring is included.
