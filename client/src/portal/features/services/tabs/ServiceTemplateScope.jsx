import React, { useMemo, useState } from "react";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import {
  Plus,
  Trash2,
  Copy,
  Clapperboard,
  FileText,
  Image as ImageIcon,
  PenSquare,
  Pencil,
  Check,
  X,
  Layers3,
  MonitorSmartphone,
  Globe2,
  SearchCheck,
} from "lucide-react";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const JOB_TYPE_OPTIONS = [
  { value: "task", label: "Task" },
  { value: "post", label: "Post" },
  { value: "reel", label: "Reel" },
  { value: "story", label: "Story" },
  { value: "video", label: "Video" },
  { value: "design", label: "Design" },
  { value: "page", label: "Page" },
  { value: "other", label: "Other" },
];

const PHASE_TYPE_OPTIONS = [
  { value: "phase", label: "Phase" },
  { value: "milestone", label: "Milestone" },
  { value: "deliverable_group", label: "Deliverable Group" },
];

const JOB_PRIORITY_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "Low", label: "Low" },
  { value: "Normal", label: "Normal" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

const SEO_TARGET_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "Product", label: "Product" },
  { value: "Workflow", label: "Workflow" },
  { value: "Tools", label: "Tools" },
  { value: "Project Management", label: "Project Management" },
];

const SEO_FUNNEL_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "Top", label: "Top" },
  { value: "Middle", label: "Middle" },
  { value: "Bottom", label: "Bottom" },
];

const SEO_CONTENT_PHASE_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "Researching", label: "Researching" },
  { value: "Creation", label: "Creation" },
  { value: "Ready", label: "Ready" },
  { value: "Pending Review", label: "Pending Review" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const SEO_TASK_TYPE_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "Admin", label: "Admin" },
  { value: "Optimize", label: "Optimize" },
  { value: "Strategy", label: "Strategy" },
  { value: "Reporting", label: "Reporting" },
  { value: "Keyword Research", label: "Keyword Research" },
  { value: "SEO Goal", label: "SEO Goal" },
  { value: "Link Building", label: "Link Building" },
];

const RECURRING_PRESETS = [
  {
    label: "Post",
    icon: PenSquare,
    create: () => createRecurringItem("Feed Posts", "post", 8, "posts", 30),
  },
  {
    label: "Reel",
    icon: Clapperboard,
    create: () => createRecurringItem("Reels", "reel", 4, "reels", 30),
  },
  {
    label: "Story",
    icon: FileText,
    create: () => createRecurringItem("Stories", "story", 12, "stories", 30),
  },
  {
    label: "Video",
    icon: Clapperboard,
    create: () => createRecurringItem("Videos", "video", 2, "videos", 30),
  },
  {
    label: "Design",
    icon: ImageIcon,
    create: () => createRecurringItem("Designs", "design", 4, "designs", 30),
  },
];

const PHASE_PRESETS = [
  {
    label: "Discovery",
    icon: Layers3,
    create: () =>
      createPhase(
        "Discovery",
        "Research, planning, structure, and requirements alignment.",
        1,
        7,
        [
          createPhaseJob("Brief review", "task", 1, "task", 2),
          createPhaseJob("Sitemap / structure", "task", 1, "task", 3),
        ]
      ),
  },
  {
    label: "Design",
    icon: PenSquare,
    create: () =>
      createPhase(
        "Design",
        "Create visual direction and approved designs.",
        2,
        10,
        [
          createPhaseJob("Moodboard / direction", "design", 1, "design", 2),
          createPhaseJob("UI design", "design", 1, "design", 7),
        ]
      ),
  },
  {
    label: "Development",
    icon: MonitorSmartphone,
    create: () =>
      createPhase(
        "Development",
        "Build and implement approved screens or pages.",
        3,
        14,
        [
          createPhaseJob("Frontend build", "page", 1, "page", 7),
          createPhaseJob("Backend integration", "task", 1, "task", 7),
        ]
      ),
  },
];

function createWebsitePlanJob({
  title,
  type = "task",
  priority = "",
  startDays = 0,
  dueDays = 0,
  timeEstimate = "",
  effort = "Medium",
  assigneeName = "",
  processOwner = "",
  dependencies = [],
  description = "",
  ...extra
}) {
  return {
    id: uid(),
    title,
    description,
    type,
    quantity: 1,
    unit: "task",
    priority,
    startDays,
    dueDays,
    durationDays: Math.max(0, Number(dueDays || 0) - Number(startDays || 0)),
    timeEstimate,
    effort,
    assigneeName,
    processOwner,
    dependencies,
    ...extra,
    required: true,
    checklist: [],
  };
}

function createWebsiteDeliveryPlan() {
  const phase = (title, description, order, dueDays, jobs) =>
    createPhase(title, description, order, dueDays, jobs);

  return [
    phase("Discovery & Research", "Client alignment, requirements, sitemap, and UX goals.", 1, 12, [
      createWebsitePlanJob({ title: "Stakeholder interviews", startDays: 0, dueDays: 5, timeEstimate: "10h", effort: "High", processOwner: "Web Designer" }),
      createWebsitePlanJob({ title: "Assign team and kickoff", startDays: 0, dueDays: 5, timeEstimate: "2h", effort: "Low", processOwner: "Project Manager" }),
      createWebsitePlanJob({ title: "Set website objectives", startDays: 7, dueDays: 12, timeEstimate: "16h", effort: "High", processOwner: "Project Manager", dependencies: ["Assign team and kickoff"] }),
      createWebsitePlanJob({ title: "Draft high-level user stories", startDays: 7, dueDays: 12, timeEstimate: "24h", effort: "High", processOwner: "UX Designer/Developer", dependencies: ["Set website objectives"] }),
      createWebsitePlanJob({ title: "Finalize delivery timeline", startDays: 73, dueDays: 74, timeEstimate: "4h", effort: "Medium", processOwner: "Project Manager" }),
      createWebsitePlanJob({ title: "Confirm framework and stack", startDays: 7, dueDays: 11, effort: "Medium", processOwner: "Project Manager", dependencies: ["Set website objectives"] }),
      createWebsitePlanJob({ title: "Sitemap planning", startDays: 7, dueDays: 13, effort: "High", processOwner: "Full-Stack Developer", dependencies: ["Stakeholder interviews"] }),
      createWebsitePlanJob({ title: "UX goals and benchmarks", startDays: 7, dueDays: 13, effort: "Medium", processOwner: "UX Designer/Developer", dependencies: ["Stakeholder interviews"] }),
      createWebsitePlanJob({ title: "Kick off website delivery", startDays: 0, dueDays: 5, timeEstimate: "1h 30m", effort: "Medium", processOwner: "Project Manager" }),
    ]),
    phase("Design", "Mockups, design system, wireframes, content collaboration, and approval.", 2, 79, [
      createWebsitePlanJob({ title: "Create website mockups", type: "design", startDays: 14, dueDays: 19, timeEstimate: "24h", effort: "High", processOwner: "UX Designer/Developer", dependencies: ["Sitemap planning"] }),
      createWebsitePlanJob({ title: "Prepare the design system", type: "design", startDays: 7, dueDays: 13, effort: "High", processOwner: "UX Designer/Developer", dependencies: ["UX goals and benchmarks"] }),
      createWebsitePlanJob({ title: "Build website wireframes", type: "design", startDays: 14, dueDays: 19, timeEstimate: "48h", effort: "High", processOwner: "UX Designer/Developer", dependencies: ["Prepare the design system"] }),
      createWebsitePlanJob({ title: "Collaborate with content team", startDays: 77, dueDays: 82, effort: "Medium", processOwner: "Project Manager" }),
      createWebsitePlanJob({ title: "Website design approval", type: "design", startDays: 73, dueDays: 73, timeEstimate: "1h", effort: "High", processOwner: "Project Manager", dependencies: ["Build website wireframes"] }),
      createWebsitePlanJob({ title: "Initial website concepts", type: "design", startDays: 76, dueDays: 78, timeEstimate: "32h", effort: "High", processOwner: "Web Designer", dependencies: ["Create website mockups"] }),
    ]),
    phase("Development", "Content, frontend, backend, bilingual setup, SEO, QA, and documentation.", 3, 96, [
      createWebsitePlanJob({ title: "Website content preparation", startDays: 91, dueDays: 96, effort: "High", processOwner: "Full-Stack Developer", dependencies: ["Website design approval"] }),
      createWebsitePlanJob({ title: "Setup React environment", startDays: 91, dueDays: 96, timeEstimate: "32h", effort: "High", processOwner: "Full-Stack Developer" }),
      createWebsitePlanJob({ title: "Frontend development", type: "page", startDays: 70, dueDays: 75, timeEstimate: "27h", effort: "Medium", processOwner: "Web Analyst", dependencies: ["Setup React environment"] }),
      createWebsitePlanJob({ title: "Backend development", startDays: 70, dueDays: 75, effort: "Medium", processOwner: "Full-Stack Developer", dependencies: ["Confirm framework and stack"] }),
      createWebsitePlanJob({ title: "Multilingual content setup", startDays: 84, dueDays: 89, effort: "Medium", processOwner: "Full-Stack Developer", dependencies: ["Website content preparation"] }),
      createWebsitePlanJob({ title: "Setup mobile responsive layouts", type: "page", startDays: 77, dueDays: 82, timeEstimate: "16h", effort: "High", processOwner: "Full-Stack Developer", dependencies: ["Frontend development"] }),
      createWebsitePlanJob({ title: "SEO setup and analytics", startDays: 77, dueDays: 82, timeEstimate: "2h", effort: "Medium", processOwner: "Full-Stack Developer" }),
      createWebsitePlanJob({ title: "Apply SEO and metadata", startDays: 84, dueDays: 89, timeEstimate: "6h 30m", effort: "High", processOwner: "Technical Consultant", dependencies: ["SEO setup and analytics"] }),
      createWebsitePlanJob({ title: "Enter bilingual content", startDays: 70, dueDays: 75, effort: "High", processOwner: "Full-Stack Developer", dependencies: ["Multilingual content setup"] }),
      createWebsitePlanJob({ title: "Internal QA", startDays: 84, dueDays: 89, effort: "High", processOwner: "Technical Consultant", dependencies: ["Frontend development", "Backend development"] }),
      createWebsitePlanJob({ title: "Bug fixing and performance pass", startDays: 84, dueDays: 90, effort: "High", processOwner: "Full-Stack Developer", dependencies: ["Internal QA"] }),
      createWebsitePlanJob({ title: "Client user acceptance testing", startDays: 77, dueDays: 82, effort: "High", processOwner: "Technical Consultant", dependencies: ["Bug fixing and performance pass"] }),
      createWebsitePlanJob({ title: "Documentation", startDays: 91, dueDays: 96, effort: "High", processOwner: "Technical Consultant", dependencies: ["Client user acceptance testing"] }),
    ]),
    phase("Launch", "Production setup, launch testing, source handover, and deployment.", 4, 110, [
      createWebsitePlanJob({ title: "Setup the production environment", startDays: 98, dueDays: 103, timeEstimate: "1h", effort: "High", processOwner: "Project Manager", dependencies: ["Documentation"] }),
      createWebsitePlanJob({ title: "Perform on-page SEO", startDays: 98, dueDays: 103, timeEstimate: "16h", effort: "Medium", processOwner: "Full-Stack Developer", dependencies: ["Apply SEO and metadata"] }),
      createWebsitePlanJob({ title: "Test initial website launch", startDays: 105, dueDays: 110, timeEstimate: "32h", effort: "Medium", processOwner: "Full-Stack Developer", dependencies: ["Setup the production environment"] }),
      createWebsitePlanJob({ title: "Delivery of source code", startDays: 105, dueDays: 110, effort: "Low", processOwner: "Project Manager", dependencies: ["Test initial website launch"] }),
      createWebsitePlanJob({ title: "Launching the website", startDays: 105, dueDays: 110, effort: "High", processOwner: "Full-Stack Developer", dependencies: ["Delivery of source code"] }),
      createWebsitePlanJob({ title: "Final deployment", startDays: 98, dueDays: 103, effort: "High", processOwner: "Project Manager", dependencies: ["Launching the website"] }),
    ]),
    phase("Monitoring", "Post-launch monitoring, data review, maintenance setup, and report.", 5, 124, [
      createWebsitePlanJob({ title: "Brainstorm improvements", startDays: 119, dueDays: 124, effort: "Medium", processOwner: "Technical Consultant" }),
      createWebsitePlanJob({ title: "Analyze data from launch", startDays: 112, dueDays: 117, effort: "High", processOwner: "Web Analyst", dependencies: ["Launching the website"] }),
      createWebsitePlanJob({ title: "Set up maintenance plan", startDays: 112, dueDays: 118, effort: "Medium", processOwner: "Technical Consultant", dependencies: ["Final deployment"] }),
      createWebsitePlanJob({ title: "Create post-launch report", startDays: 119, dueDays: 124, effort: "Low", processOwner: "Project Manager", dependencies: ["Analyze data from launch"] }),
    ]),
  ];
}

function createSeoDeliveryPlan() {
  const phase = (title, description, order, dueDays, jobs) =>
    createPhase(title, description, order, dueDays, jobs);

  const seoJob = (item) =>
    createWebsitePlanJob({
      type: "task",
      unit: "task",
      effort: "",
      processOwner: "SEO Specialist",
      ...item,
    });

  const authorityGoal = "Improve Link & Brand Authority";
  const trafficGoal = "Increase Total Organic Traffic 10%";

  return [
    phase("KW Research", "Keyword research tasks grouped by readiness, target, funnel, and analytics reference.", 1, 27, [
      seoJob({ title: "KW Research: Primary product keywords", priority: "High", dueDays: 7, seoBoardStatus: "READY", seoTaskType: "Keyword Research", seoTarget: "Product", funnelStage: "Top" }),
      seoJob({ title: "KW Research: Workflow queries", priority: "High", dueDays: 8, seoBoardStatus: "READY", seoTaskType: "Keyword Research", seoTarget: "Workflow", funnelStage: "Top" }),
      seoJob({ title: "KW Research: Digital tools terms", priority: "Normal", dueDays: 9, seoBoardStatus: "READY", seoTaskType: "Keyword Research", seoTarget: "Tools", funnelStage: "Middle" }),
      seoJob({ title: "KW Research: Product keyword review", priority: "High", dueDays: 14, seoBoardStatus: "REVIEW & RESEARCH", seoTaskType: "Keyword Research", seoTarget: "Project Management", funnelStage: "Bottom" }),
      seoJob({ title: "KW Research: Tools keyword review", priority: "Normal", dueDays: 15, seoBoardStatus: "REVIEW & RESEARCH", seoTaskType: "Keyword Research", seoTarget: "Tools", funnelStage: "Top" }),
      seoJob({ title: "KW Research: Technical SEO keyword gaps", priority: "Normal", dueDays: 20, seoBoardStatus: "OPEN", seoTaskType: "Keyword Research", seoTarget: "Project Management", funnelStage: "Middle" }),
      seoJob({ title: "KW Research: Brand and competitor keywords", priority: "Normal", dueDays: 22, seoBoardStatus: "OPEN", seoTaskType: "Keyword Research", seoTarget: "Tools", funnelStage: "Middle" }),
    ]),
    phase("SEO Goals", "Goal tracking with parent goal links, status grouping, priority, and quarter.", 2, 30, [
      seoJob({ title: authorityGoal, priority: "High", dueDays: 7, seoBoardStatus: "CLOSED - ACHIEVED", seoTaskType: "SEO Goal", seoQuarter: "Q1 '22" }),
      seoJob({ title: "10k Sign-ups from Organic Search", priority: "High", dueDays: 14, seoBoardStatus: "CLOSED - ACHIEVED", seoTaskType: "SEO Goal", seoQuarter: "Q1 '22", parentGoalName: authorityGoal }),
      seoJob({ title: "Link Campaign", priority: "Low", dueDays: 16, seoBoardStatus: "CLOSED - ACHIEVED", seoTaskType: "SEO Goal", seoQuarter: "Q1 '22", parentGoalName: authorityGoal }),
      seoJob({ title: "100 Expert Content Pages", priority: "Normal", dueDays: 20, seoBoardStatus: "CLOSED - ACHIEVED", seoTaskType: "SEO Goal", seoQuarter: "Q1 '22", parentGoalName: authorityGoal }),
      seoJob({ title: "Increase Keyword Coverage", priority: "Normal", dueDays: 22, seoBoardStatus: "CLOSED - ACHIEVED", seoTaskType: "SEO Goal", seoQuarter: "Q1 '22", parentGoalName: trafficGoal }),
      seoJob({ title: trafficGoal, priority: "Normal", dueDays: 24, seoBoardStatus: "CLOSED - PARTIAL", seoTaskType: "SEO Goal", seoQuarter: "Q1 '22" }),
      seoJob({ title: "Increase Completed Site Audits", priority: "High", dueDays: 25, seoBoardStatus: "CLOSED - PARTIAL", seoTaskType: "SEO Goal", seoQuarter: "Q1 '22", parentGoalName: trafficGoal }),
      seoJob({ title: "Average 75% Optimization Score", priority: "Normal", dueDays: 28, seoBoardStatus: "CLOSED - MISSED", seoTaskType: "SEO Goal", seoQuarter: "Q1 '22", parentGoalName: trafficGoal }),
    ]),
    phase("Link Building", "Backlink pipeline grouped by active, review, inactive, and research stages.", 3, 30, [
      seoJob({ title: "Backlink: industry partner outreach", priority: "Normal", dueDays: 5, seoBoardStatus: "INACTIVE", seoTaskType: "Link Building", contentPhase: "Inactive" }),
      seoJob({ title: "Backlink: ABC content placement", priority: "High", dueDays: 12, seoBoardStatus: "PENDING REVIEW", seoTaskType: "Link Building", contentPhase: "Creation" }),
      seoJob({ title: "Backlink: PQR content placement", priority: "Normal", dueDays: 13, seoBoardStatus: "PENDING REVIEW", seoTaskType: "Link Building", contentPhase: "Creation" }),
      seoJob({ title: "Backlink: DEF company listing", priority: "Normal", dueDays: 18, seoBoardStatus: "ACTIVE", seoTaskType: "Link Building", contentPhase: "Ready" }),
      seoJob({ title: "Backlink: MNO niche mention", priority: "Normal", dueDays: 20, seoBoardStatus: "ACTIVE", seoTaskType: "Link Building", contentPhase: "Ready" }),
      seoJob({ title: "Backlink: GHI guest article", priority: "Normal", dueDays: 22, seoBoardStatus: "ACTIVE", seoTaskType: "Link Building", contentPhase: "Ready" }),
      seoJob({ title: "Backlink: STU prospect research", priority: "Normal", dueDays: 26, seoBoardStatus: "TO DO", seoTaskType: "Link Building", contentPhase: "Researching" }),
      seoJob({ title: "Backlink: VWX prospect research", priority: "Normal", dueDays: 27, seoBoardStatus: "TO DO", seoTaskType: "Link Building", contentPhase: "Researching" }),
    ]),
    phase("Admin", "SEO administration and housekeeping tasks.", 4, 12, [
      seoJob({ title: "Blog List Clearing", priority: "Normal", dueDays: 5, seoBoardStatus: "OPEN", seoTaskType: "Admin", processOwner: "SEO Coordinator" }),
      seoJob({ title: "Update Onboarding SEO Checklist", priority: "Normal", dueDays: 7, seoBoardStatus: "OPEN", seoTaskType: "Admin", processOwner: "SEO Coordinator" }),
      seoJob({ title: "Optimize Drive/Documents Structure", priority: "High", dueDays: 10, seoBoardStatus: "OPEN", seoTaskType: "Admin", processOwner: "SEO Coordinator" }),
    ]),
    phase("Optimize", "Optimization actions, assessments, and technical improvements.", 5, 22, [
      seoJob({ title: "Optimize High Traffic Pages", priority: "Urgent", dueDays: 7, seoBoardStatus: "OPEN", seoTaskType: "Optimize", processOwner: "SEO Specialist" }),
      seoJob({ title: "Optimization Assessment", priority: "Normal", dueDays: 12, seoBoardStatus: "OPEN", seoTaskType: "Optimize", processOwner: "SEO Specialist" }),
      seoJob({ title: "Optimization Audit", priority: "Low", dueDays: 16, seoBoardStatus: "OPEN", seoTaskType: "Optimize", processOwner: "SEO Specialist" }),
      seoJob({ title: "Optimization Actions", priority: "Normal", dueDays: 20, seoBoardStatus: "OPEN", seoTaskType: "Optimize", processOwner: "SEO Specialist" }),
    ]),
    phase("Strategy", "SEO analysis and strategic thought-leadership planning.", 6, 24, [
      seoJob({ title: "SEO Analysis", priority: "Normal", dueDays: 10, seoBoardStatus: "OPEN", seoTaskType: "Strategy", processOwner: "SEO Strategist" }),
      seoJob({ title: "Expertise & Thought Leadership Plan", priority: "High", dueDays: 18, seoBoardStatus: "OPEN", seoTaskType: "Strategy", processOwner: "SEO Strategist" }),
    ]),
    phase("Reporting", "Authority, optimization, and performance reporting tasks.", 7, 30, [
      seoJob({ title: "Link Authority Update", priority: "Urgent", dueDays: 24, seoBoardStatus: "OPEN", seoTaskType: "Reporting", processOwner: "SEO Analyst" }),
      seoJob({ title: "Review Optimization Score", priority: "High", dueDays: 28, seoBoardStatus: "OPEN", seoTaskType: "Reporting", processOwner: "SEO Analyst" }),
    ]),
  ];
}

function createRecurringItem(
  title = "",
  type = "post",
  quantity = 1,
  unit = "items",
  dueDays = 0
) {
  return {
    id: uid(),
    title,
    description: "",
    type,
    quantity,
    unit,
    priority: "",
    startDays: 0,
    dueDays,
    durationDays: dueDays,
    timeEstimate: "",
    effort: "",
    assigneeName: "",
    processOwner: "",
    dependencies: [],
    seoBoardStatus: "",
    seoTaskType: "",
    seoTarget: "",
    funnelStage: "",
    contentPhase: "",
    seoQuarter: "",
    executionPageUrl: "",
    analyticsUrl: "",
    parentGoalId: "",
    parentGoalName: "",
    parentGoalUrl: "",
    required: true,
    checklist: [],
    _saved: false,
  };
}

function createPhaseJob(
  title = "",
  type = "task",
  quantity = 1,
  unit = "items",
  dueDays = 0
) {
  return {
    id: uid(),
    title,
    description: "",
    type,
    quantity,
    unit,
    priority: "",
    startDays: 0,
    dueDays,
    durationDays: dueDays,
    timeEstimate: "",
    effort: "",
    assigneeName: "",
    processOwner: "",
    dependencies: [],
    seoBoardStatus: "",
    seoTaskType: "",
    seoTarget: "",
    funnelStage: "",
    contentPhase: "",
    seoQuarter: "",
    executionPageUrl: "",
    analyticsUrl: "",
    parentGoalId: "",
    parentGoalName: "",
    parentGoalUrl: "",
    required: true,
    checklist: [],
  };
}

function createPhase(
  title = "",
  description = "",
  order = 1,
  dueDays = 0,
  jobs = []
) {
  return {
    id: uid(),
    title,
    description,
    type: "phase",
    order,
    dueDays,
    jobs,
  };
}

function labelize(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-black tracking-[0.22em] text-slate-500">
      {children}
    </div>
  );
}

function SmallSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
    >
      {options.map((opt) => (
        <option key={`${opt.value}-${opt.label}`} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function PresetButton({ label, Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[28px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-6">
          <div>
            <div className="text-xl font-black text-slate-900">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function OutputSummaryCard({ item, onEdit, onDuplicate, onDelete }) {
  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-base font-black text-slate-900">
              {item.title || "Untitled output"}
            </div>

            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-slate-600">
              {labelize(item.type).toUpperCase()}
            </span>
          </div>

          <div className="mt-3 text-sm leading-6 text-slate-600">
            {item.description || "No description added."}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3">
        <div>
          <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">
            QUANTITY
          </div>
          <div className="mt-1 text-sm font-black text-slate-900">
            {item.quantity ?? 1}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">
            UNIT
          </div>
          <div className="mt-1 text-sm font-black text-slate-900">
            {item.unit || "items"}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-black tracking-[0.18em] text-slate-500">
            DUE
          </div>
          <div className="mt-1 text-sm font-black text-slate-900">
            {Number(item.dueDays || 0)} day(s)
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil size={16} />
          Edit
        </Button>

        <Button variant="outline" size="sm" onClick={onDuplicate}>
          <Copy size={16} />
          Duplicate
        </Button>

        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 size={16} />
          Delete
        </Button>
      </div>
    </Card>
  );
}

function OutputEditorRow({ item, onChange, onSave, onDuplicate, onDelete }) {
  const canSave = useMemo(
    () => (item.title || "").trim().length >= 2,
    [item.title]
  );

  return (
    <Card className="p-5">
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Input
            label="OUTPUT NAME"
            value={item.title || ""}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            placeholder="e.g. Instagram Posts"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="grid gap-2">
            <SectionLabel>TYPE</SectionLabel>
            <SmallSelect
              value={item.type || "post"}
              onChange={(e) => onChange({ ...item, type: e.target.value })}
              options={JOB_TYPE_OPTIONS}
            />
          </label>
        </div>

        <div className="lg:col-span-2">
          <Input
            label="QUANTITY"
            type="number"
            value={String(item.quantity ?? 1)}
            onChange={(e) =>
              onChange({
                ...item,
                quantity: Math.max(1, Number(e.target.value || 1)),
              })
            }
          />
        </div>

        <div className="lg:col-span-2">
          <Input
            label="UNIT"
            value={item.unit || ""}
            onChange={(e) => onChange({ ...item, unit: e.target.value })}
            placeholder="posts / reels / videos"
          />
        </div>

        <div className="lg:col-span-2">
          <Input
            label="DUE DAYS"
            type="number"
            value={String(item.dueDays ?? 0)}
            onChange={(e) =>
              onChange({
                ...item,
                dueDays: Math.max(0, Number(e.target.value || 0)),
              })
            }
          />
        </div>

        <div className="lg:col-span-9">
          <label className="grid gap-2">
            <SectionLabel>DESCRIPTION</SectionLabel>
            <textarea
              rows={2}
              value={item.description || ""}
              onChange={(e) =>
                onChange({ ...item, description: e.target.value })
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
              placeholder="Optional note about this output..."
            />
          </label>
        </div>

        <div className="lg:col-span-3 flex items-end justify-end gap-2">
          <Button variant="outline" onClick={onDuplicate}>
            <Copy size={16} />
            Duplicate
          </Button>

          <Button variant="outline" onClick={onDelete}>
            <Trash2 size={16} />
            Delete
          </Button>

          <Button onClick={onSave} disabled={!canSave}>
            <Check size={16} />
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PhaseCard({ phase, onEdit, onDuplicate, onDelete }) {
  const jobs = Array.isArray(phase?.jobs) ? phase.jobs : [];

  return (
    <Card className="p-5 transition hover:shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-lg font-black text-slate-900">
              {phase.title || "Untitled phase"}
            </div>

            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
              {labelize(phase.type || "phase")}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
            </span>

            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
              Due in {phase.dueDays || 0} days
            </span>
          </div>

          {phase.description ? (
            <div className="mt-3 text-sm text-slate-600">
              {phase.description}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Pencil size={16} />
            Edit
          </Button>
          <Button variant="outline" onClick={onDuplicate}>
            <Copy size={16} />
            Duplicate
          </Button>
          <Button variant="outline" onClick={onDelete}>
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      </div>

      {jobs.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-black text-slate-900">
                  {job.title || "Untitled job"}
                </div>

                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
                  {labelize(job.type)}
                </span>

                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
                  {job.quantity || 1} {job.unit || "items"}
                </span>

                {job.priority ? (
                  <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
                    {job.priority}
                  </span>
                ) : null}

                {job.effort ? (
                  <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
                    {job.effort}
                  </span>
                ) : null}

                {job.seoBoardStatus ? (
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                    {job.seoBoardStatus}
                  </span>
                ) : null}
              </div>

              {job.description ? (
                <div className="mt-2 text-sm text-slate-600">
                  {job.description}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span>Day {job.startDays ?? 0}-{job.dueDays ?? 0}</span>
                {job.timeEstimate ? <span>{job.timeEstimate}</span> : null}
                {job.assigneeName ? <span>{job.assigneeName}</span> : null}
                {job.processOwner ? <span>{job.processOwner}</span> : null}
                {job.seoTaskType ? <span>{job.seoTaskType}</span> : null}
                {job.seoTarget ? <span>Target: {job.seoTarget}</span> : null}
                {job.funnelStage ? <span>Funnel: {job.funnelStage}</span> : null}
                {job.contentPhase ? <span>Content: {job.contentPhase}</span> : null}
                {job.seoQuarter ? <span>{job.seoQuarter}</span> : null}
                {job.parentGoalName ? <span>Parent: {job.parentGoalName}</span> : null}
                {Array.isArray(job.dependencies) && job.dependencies.length ? (
                  <span>After {job.dependencies.join(", ")}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function PhaseEditorModal({ initial, onClose, onSubmit }) {
  const [phase, setPhase] = useState(
    initial || {
      id: uid(),
      title: "",
      description: "",
      type: "phase",
      order: 1,
      dueDays: 0,
      jobs: [],
    }
  );

  const jobs = Array.isArray(phase.jobs) ? phase.jobs : [];
  const canSave = (phase.title || "").trim().length >= 2;

  const addJob = () => {
    setPhase((prev) => ({
      ...prev,
      jobs: [
        ...(Array.isArray(prev.jobs) ? prev.jobs : []),
        createPhaseJob("", "task", 1, "items", 0),
      ],
    }));
  };

  const updateJob = (jobId, patch) => {
    setPhase((prev) => ({
      ...prev,
      jobs: (prev.jobs || []).map((job) =>
        job.id === jobId ? { ...job, ...patch } : job
      ),
    }));
  };

  const deleteJob = (jobId) => {
    setPhase((prev) => ({
      ...prev,
      jobs: (prev.jobs || []).filter((job) => job.id !== jobId),
    }));
  };

  return (
    <ModalShell
      title={initial ? "Edit phase" : "Add phase"}
      subtitle="Create a clean phase, then add the jobs inside it."
      onClose={onClose}
    >
      <div className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Input
              label="PHASE NAME"
              value={phase.title || ""}
              onChange={(e) =>
                setPhase((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Design"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="grid gap-2">
              <SectionLabel>TYPE</SectionLabel>
              <SmallSelect
                value={phase.type || "phase"}
                onChange={(e) =>
                  setPhase((prev) => ({ ...prev, type: e.target.value }))
                }
                options={PHASE_TYPE_OPTIONS}
              />
            </label>
          </div>

          <div className="lg:col-span-2">
            <Input
              label="ORDER"
              type="number"
              value={String(phase.order ?? 1)}
              onChange={(e) =>
                setPhase((prev) => ({
                  ...prev,
                  order: Math.max(1, Number(e.target.value || 1)),
                }))
              }
            />
          </div>

          <div className="lg:col-span-2">
            <Input
              label="DUE DAYS"
              type="number"
              value={String(phase.dueDays ?? 0)}
              onChange={(e) =>
                setPhase((prev) => ({
                  ...prev,
                  dueDays: Math.max(0, Number(e.target.value || 0)),
                }))
              }
            />
          </div>
        </div>

        <label className="grid gap-2">
          <SectionLabel>DESCRIPTION</SectionLabel>
          <textarea
            rows={3}
            value={phase.description || ""}
            onChange={(e) =>
              setPhase((prev) => ({ ...prev, description: e.target.value }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
            placeholder="Optional phase description..."
          />
        </label>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-black text-slate-900">Jobs</div>
            <div className="mt-1 text-sm text-slate-600">
              Add the work items that belong to this phase.
            </div>
          </div>

          <Button onClick={addJob}>
            <Plus size={16} />
            Add job
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card className="p-5">
            <div className="text-sm text-slate-600">No jobs added yet.</div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="p-5">
                <div className="grid gap-3 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <Input
                      label="JOB NAME"
                      value={job.title || ""}
                      onChange={(e) =>
                        updateJob(job.id, { title: e.target.value })
                      }
                      placeholder="e.g. Home page design"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="grid gap-2">
                      <SectionLabel>TYPE</SectionLabel>
                      <SmallSelect
                        value={job.type || "task"}
                        onChange={(e) =>
                          updateJob(job.id, { type: e.target.value })
                        }
                        options={JOB_TYPE_OPTIONS}
                      />
                    </label>
                  </div>

                  <div className="lg:col-span-2">
                    <Input
                      label="QUANTITY"
                      type="number"
                      value={String(job.quantity ?? 1)}
                      onChange={(e) =>
                        updateJob(job.id, {
                          quantity: Math.max(1, Number(e.target.value || 1)),
                        })
                      }
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Input
                      label="UNIT"
                      value={job.unit || ""}
                      onChange={(e) =>
                        updateJob(job.id, { unit: e.target.value })
                      }
                      placeholder="pages / items / designs"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="grid gap-2">
                      <SectionLabel>PRIORITY</SectionLabel>
                      <SmallSelect
                        value={job.priority || ""}
                        onChange={(e) =>
                          updateJob(job.id, { priority: e.target.value })
                        }
                        options={JOB_PRIORITY_OPTIONS}
                      />
                    </label>
                  </div>

                  <div className="lg:col-span-2">
                    <Input
                      label="START DAY"
                      type="number"
                      value={String(job.startDays ?? 0)}
                      onChange={(e) =>
                        updateJob(job.id, {
                          startDays: Math.max(0, Number(e.target.value || 0)),
                        })
                      }
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Input
                      label="DUE DAY"
                      type="number"
                      value={String(job.dueDays ?? 0)}
                      onChange={(e) =>
                        updateJob(job.id, {
                          dueDays: Math.max(0, Number(e.target.value || 0)),
                        })
                      }
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Input
                      label="DURATION"
                      type="number"
                      value={String(
                        job.durationDays ??
                          Math.max(0, Number(job.dueDays || 0) - Number(job.startDays || 0))
                      )}
                      onChange={(e) =>
                        updateJob(job.id, {
                          durationDays: Math.max(0, Number(e.target.value || 0)),
                        })
                      }
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Input
                      label="ESTIMATE"
                      value={job.timeEstimate || ""}
                      onChange={(e) =>
                        updateJob(job.id, { timeEstimate: e.target.value })
                      }
                      placeholder="e.g. 16h"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Input
                      label="EFFORT"
                      value={job.effort || ""}
                      onChange={(e) =>
                        updateJob(job.id, { effort: e.target.value })
                      }
                      placeholder="Low / Medium / High"
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <Input
                      label="ASSIGNEE"
                      value={job.assigneeName || ""}
                      onChange={(e) =>
                        updateJob(job.id, { assigneeName: e.target.value })
                      }
                      placeholder="Optional name"
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <Input
                      label="PROCESS OWNER"
                      value={job.processOwner || ""}
                      onChange={(e) =>
                        updateJob(job.id, { processOwner: e.target.value })
                      }
                      placeholder="Project Manager"
                    />
                  </div>

                  <div className="lg:col-span-8">
                    <Input
                      label="DEPENDENCIES"
                      value={
                        Array.isArray(job.dependencies)
                          ? job.dependencies.join(", ")
                          : job.dependencies || ""
                      }
                      onChange={(e) =>
                        updateJob(job.id, {
                          dependencies: e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Comma-separated task names"
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <Input
                      label="SEO STATUS"
                      value={job.seoBoardStatus || ""}
                      onChange={(e) =>
                        updateJob(job.id, { seoBoardStatus: e.target.value })
                      }
                      placeholder="READY / OPEN / ACTIVE"
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <label className="grid gap-2">
                      <SectionLabel>SEO TASK TYPE</SectionLabel>
                      <SmallSelect
                        value={job.seoTaskType || ""}
                        onChange={(e) =>
                          updateJob(job.id, { seoTaskType: e.target.value })
                        }
                        options={SEO_TASK_TYPE_OPTIONS}
                      />
                    </label>
                  </div>

                  <div className="lg:col-span-4">
                    <label className="grid gap-2">
                      <SectionLabel>TARGET</SectionLabel>
                      <SmallSelect
                        value={job.seoTarget || ""}
                        onChange={(e) =>
                          updateJob(job.id, { seoTarget: e.target.value })
                        }
                        options={SEO_TARGET_OPTIONS}
                      />
                    </label>
                  </div>

                  <div className="lg:col-span-4">
                    <label className="grid gap-2">
                      <SectionLabel>FUNNEL</SectionLabel>
                      <SmallSelect
                        value={job.funnelStage || ""}
                        onChange={(e) =>
                          updateJob(job.id, { funnelStage: e.target.value })
                        }
                        options={SEO_FUNNEL_OPTIONS}
                      />
                    </label>
                  </div>

                  <div className="lg:col-span-4">
                    <label className="grid gap-2">
                      <SectionLabel>CONTENT PHASE</SectionLabel>
                      <SmallSelect
                        value={job.contentPhase || ""}
                        onChange={(e) =>
                          updateJob(job.id, { contentPhase: e.target.value })
                        }
                        options={SEO_CONTENT_PHASE_OPTIONS}
                      />
                    </label>
                  </div>

                  <div className="lg:col-span-4">
                    <Input
                      label="QUARTER"
                      value={job.seoQuarter || ""}
                      onChange={(e) =>
                        updateJob(job.id, { seoQuarter: e.target.value })
                      }
                      placeholder="e.g. Q1 '22"
                    />
                  </div>

                  <div className="lg:col-span-6">
                    <Input
                      label="EXECUTION PAGE URL"
                      value={job.executionPageUrl || ""}
                      onChange={(e) =>
                        updateJob(job.id, { executionPageUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="lg:col-span-6">
                    <Input
                      label="ANALYTICS URL"
                      value={job.analyticsUrl || ""}
                      onChange={(e) =>
                        updateJob(job.id, { analyticsUrl: e.target.value })
                      }
                      placeholder="https://analytics..."
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <Input
                      label="PARENT GOAL ID"
                      value={job.parentGoalId || ""}
                      onChange={(e) =>
                        updateJob(job.id, { parentGoalId: e.target.value })
                      }
                    />
                  </div>

                  <div className="lg:col-span-5">
                    <Input
                      label="PARENT GOAL NAME"
                      value={job.parentGoalName || ""}
                      onChange={(e) =>
                        updateJob(job.id, { parentGoalName: e.target.value })
                      }
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <Input
                      label="PARENT URL"
                      value={job.parentGoalUrl || ""}
                      onChange={(e) =>
                        updateJob(job.id, { parentGoalUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="lg:col-span-10">
                    <label className="grid gap-2">
                      <SectionLabel>DESCRIPTION</SectionLabel>
                      <textarea
                        rows={2}
                        value={job.description || ""}
                        onChange={(e) =>
                          updateJob(job.id, { description: e.target.value })
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-black/5"
                        placeholder="Optional note about this job..."
                      />
                    </label>
                  </div>

                  <div className="lg:col-span-2 flex items-end justify-end">
                    <Button variant="outline" onClick={() => deleteJob(job.id)}>
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={() =>
              onSubmit({
                ...phase,
                title: phase.title.trim(),
                jobs: (phase.jobs || []).filter((job) =>
                  String(job.title || "").trim()
                ),
              })
            }
            disabled={!canSave}
          >
            <Check size={16} />
            Save phase
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

export default function ServiceTemplateScope({
  value = [],
  onChange,
  executionMode = "recurring",
}) {
  const groups = Array.isArray(value) ? value : [];
  const isRecurring = executionMode === "recurring";

  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);

  const setGroups = (next) => onChange?.(next);

  if (isRecurring) {
    const recurringGroup = groups[0] || {
      id: uid(),
      title: "Monthly Outputs",
      description: "",
      type: "deliverable_group",
      order: 1,
      dueDays: 0,
      jobs: [],
    };

    const jobs = Array.isArray(recurringGroup.jobs)
      ? recurringGroup.jobs.map((job) => ({
          ...job,
          _saved: job?._saved !== false,
        }))
      : [];

    const updateJobs = (nextJobs) => {
      setGroups([
        {
          ...recurringGroup,
          jobs: nextJobs,
        },
      ]);
    };

    const addItem = (item = null) => {
      updateJobs([...jobs, item || createRecurringItem()]);
    };

    const updateItem = (jobId, nextJob) => {
      updateJobs(jobs.map((job) => (job.id === jobId ? nextJob : job)));
    };

    const saveItem = (jobId) => {
      updateJobs(
        jobs.map((job) => (job.id === jobId ? { ...job, _saved: true } : job))
      );
    };

    const editItem = (jobId) => {
      updateJobs(
        jobs.map((job) => (job.id === jobId ? { ...job, _saved: false } : job))
      );
    };

    const duplicateItem = (job) => {
      updateJobs([
        ...jobs,
        {
          ...job,
          id: uid(),
          _saved: false,
        },
      ]);
    };

    const deleteItem = (jobId) => {
      updateJobs(jobs.filter((job) => job.id !== jobId));
    };

    return (
      <div className="grid gap-4">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-lg font-black text-slate-900">
                Monthly Outputs
              </div>
              <div className="mt-1 text-sm text-slate-600">
                For social media and recurring retainers, just add what you
                sell: posts, reels, stories, videos, designs, reports.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {RECURRING_PRESETS.map((preset) => (
                <PresetButton
                  key={preset.label}
                  label={preset.label}
                  Icon={preset.icon}
                  onClick={() => addItem(preset.create())}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => addItem()}>
              <Plus size={16} />
              Add custom output
            </Button>
          </div>
        </Card>

        {jobs.length === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-slate-600">
              No outputs yet. Add posts, reels, stories, videos, or any custom
              recurring output.
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) =>
              job._saved ? (
                <OutputSummaryCard
                  key={job.id}
                  item={job}
                  onEdit={() => editItem(job.id)}
                  onDuplicate={() => duplicateItem(job)}
                  onDelete={() => deleteItem(job.id)}
                />
              ) : (
                <OutputEditorRow
                  key={job.id}
                  item={job}
                  onChange={(next) => updateItem(job.id, next)}
                  onSave={() => saveItem(job.id)}
                  onDuplicate={() => duplicateItem(job)}
                  onDelete={() => deleteItem(job.id)}
                />
              )
            )}
          </div>
        )}
      </div>
    );
  }

  const phases = groups;

  const addPhase = (phase) => {
    setGroups([...phases, phase]);
  };

  const updatePhase = (phaseId, nextPhase) => {
    setGroups(
      phases.map((phase) => (phase.id === phaseId ? nextPhase : phase))
    );
  };

  const deletePhase = (phaseId) => {
    setGroups(phases.filter((phase) => phase.id !== phaseId));
  };

  const duplicatePhase = (phase) => {
    setGroups([
      ...phases,
      {
        ...phase,
        id: uid(),
        title: `${phase.title || "Phase"} Copy`,
        jobs: Array.isArray(phase.jobs)
          ? phase.jobs.map((job) => ({ ...job, id: uid() }))
          : [],
      },
    ]);
  };

  return (
    <>
      <div className="grid gap-4">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-lg font-black text-slate-900">
                Phases & Jobs
              </div>
              <div className="mt-1 text-sm text-slate-600">
                For websites, SEO, branding, apps, and one-time service
                delivery, create the workstreams first, then the jobs inside
                each one.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <PresetButton
                label="Website Plan"
                Icon={Globe2}
                onClick={() => setGroups(createWebsiteDeliveryPlan())}
              />
              <PresetButton
                label="SEO Plan"
                Icon={SearchCheck}
                onClick={() => setGroups(createSeoDeliveryPlan())}
              />
              {PHASE_PRESETS.map((preset) => (
                <PresetButton
                  key={preset.label}
                  label={preset.label}
                  Icon={preset.icon}
                  onClick={() => addPhase(preset.create())}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => {
                setEditingPhase(null);
                setPhaseModalOpen(true);
              }}
            >
              <Plus size={16} />
              Add phase
            </Button>
          </div>
        </Card>

        {phases.length === 0 ? (
          <Card className="p-6">
            <div className="text-sm text-slate-600">
              No phases yet. Add phases like Discovery, Design, Development, QA,
              or Launch.
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                onEdit={() => {
                  setEditingPhase(phase);
                  setPhaseModalOpen(true);
                }}
                onDuplicate={() => duplicatePhase(phase)}
                onDelete={() => deletePhase(phase.id)}
              />
            ))}
          </div>
        )}
      </div>

      {phaseModalOpen ? (
        <PhaseEditorModal
          initial={editingPhase}
          onClose={() => {
            setPhaseModalOpen(false);
            setEditingPhase(null);
          }}
          onSubmit={(phase) => {
            if (editingPhase?.id) {
              updatePhase(editingPhase.id, phase);
            } else {
              addPhase(phase);
            }
            setPhaseModalOpen(false);
            setEditingPhase(null);
          }}
        />
      ) : null}
    </>
  );
}
