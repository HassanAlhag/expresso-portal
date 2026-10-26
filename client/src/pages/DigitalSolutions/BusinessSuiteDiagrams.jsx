import React from "react";
import {
  FiArrowDown, FiArrowRight, FiAward, FiBriefcase, FiCalendar, FiCheckCircle,
  FiClipboard, FiDollarSign, FiFileText, FiGrid, FiMessageSquare, FiPlus,
  FiRepeat, FiSend, FiShoppingBag, FiTarget, FiTruck, FiUserCheck, FiUserPlus, FiUsers,
} from "react-icons/fi";
import BusinessSuiteVisual from "./BusinessSuiteVisual";

export const SUITE_MODULE_ICONS = {
  CRM: FiUsers, Projects: FiBriefcase, "HR & People": FiUserCheck, HR: FiUserCheck,
  Finance: FiDollarSign, Billing: FiDollarSign, Procurement: FiShoppingBag,
  "Client Portal": FiUsers, "Vendor Portal": FiTruck, Clients: FiUsers,
  "Vendors / RFQs": FiSend, "Internal operations": FiGrid,
};
const STAGE_ICONS = {
  Lead: FiUserPlus, Deal: FiBriefcase, Client: FiUsers, Project: FiBriefcase,
  Invoice: FiFileText, Request: FiClipboard, RFQ: FiSend,
  "Vendor quote": FiMessageSquare, Award: FiAward,
};
const PEOPLE_ICONS = { Leave: FiCalendar, Expenses: FiFileText, Goals: FiTarget };
const itemsOf = (block) => (Array.isArray(block.items) ? block.items : []).filter((item) => item && typeof item === "object");

export function WorkflowStrip({ block }) {
  const steps = (Array.isArray(block.steps) ? block.steps : []).filter((step) => step?.title);
  return (
    <div className="min-w-0 rounded-[24px] border border-ink-200 bg-white p-6 sm:p-8">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.15em] text-lotus-600">{block.eyebrow}</p>
      <h4 className="mb-2 mt-2 text-xl font-bold text-night sm:text-2xl">{block.title}</h4>
      {block.subtitle ? <p className="m-0 max-w-3xl text-sm leading-relaxed text-ink-600">{block.subtitle}</p> : null}
      <ol aria-label={block.title} className="mb-0 mt-7 grid list-none gap-8 p-0 md:grid-flow-col md:auto-cols-fr md:gap-6">
        {steps.map((step, index) => {
          const Icon = STAGE_ICONS[step.title] || FiCheckCircle;
          return (
            <li key={`${step.title}-${index}`} className="relative min-w-0">
              <div className="flex h-full min-w-0 items-center gap-4 rounded-2xl border border-ink-200 bg-mist p-4 md:flex-col md:items-start md:gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lotus-200 bg-white text-lotus-600"><Icon size={20} aria-hidden="true" /></span>
                <div className="min-w-0"><p className="mb-1 mt-0 break-words text-sm font-bold text-night">{step.title}</p><p className="m-0 text-xs leading-relaxed text-ink-600">{step.desc || step.description}</p></div>
              </div>
              {index < steps.length - 1 ? <span aria-hidden="true" className="absolute -bottom-7 left-5 flex h-6 items-center text-lotus-500 md:-right-6 md:bottom-auto md:left-auto md:top-6 md:w-6 md:justify-center"><FiArrowDown className="md:hidden" size={20} /><FiArrowRight className="hidden md:block" size={20} /></span> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ModuleChip({ label }) {
  const Icon = SUITE_MODULE_ICONS[label] || FiGrid;
  return <span className="inline-flex min-w-0 items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-night"><Icon className="shrink-0 text-lotus-600" size={18} aria-hidden="true" /><span className="min-w-0 break-words">{label}</span></span>;
}

function PlatformMap({ items }) {
  return (
    <div className="mt-6 min-w-0 rounded-[24px] border border-ink-200 bg-white p-5 sm:p-8">
      <div className="flex justify-center" aria-hidden="true"><span className="inline-flex items-center gap-3 rounded-2xl bg-night px-5 py-4 text-sm font-bold text-white"><FiGrid className="text-lotus-300" size={22} />Expresso Business Suite</span></div>
      <div className="mx-auto h-7 w-px bg-lotus-200" aria-hidden="true" />
      <ul className="m-0 grid list-none gap-4 p-0" aria-label="Connected platform relationships">
        {items.map((item, index) => {
          const nodes = String(item.title || "").split(/\s*[→↔]\s*/).filter(Boolean);
          const twoWay = String(item.title || "").includes("↔");
          return (
            <li key={index} className="min-w-0 rounded-2xl bg-mist p-4 sm:p-5">
              <h4 className="sr-only">{item.title}</h4>
              <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center" aria-hidden="true">
                {nodes.map((node, i) => <React.Fragment key={`${node}-${i}`}><span className="min-w-0 flex-1"><span className="flex h-full [&>span]:w-full"><ModuleChip label={node} /></span></span>{i < nodes.length - 1 ? <span className="flex h-5 shrink-0 items-center justify-center text-lotus-500 sm:h-auto sm:w-6">{twoWay ? <FiRepeat size={20} className="rotate-90 sm:rotate-0" /> : <FiArrowRight size={20} className="rotate-90 sm:rotate-0" />}</span> : null}</React.Fragment>)}
              </div>
              <p className="mb-0 mt-3 text-xs leading-relaxed text-ink-600">{item.desc || item.description}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PeopleVisual({ items }) {
  return (
    <div className="mt-6 grid min-w-0 items-center gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
      <div className="grid min-w-0 gap-3">{items.map((item, index) => {
        const Icon = PEOPLE_ICONS[item.title] || FiUserCheck;
        return <div key={index} className="flex min-w-0 items-start gap-4 rounded-2xl border border-ink-200 bg-white p-5"><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lotus-50 text-lotus-600"><Icon size={21} aria-hidden="true" /></span><div className="min-w-0"><h4 className="m-0 text-base font-bold text-night">{item.title}</h4><p className="mb-0 mt-2 text-sm leading-relaxed text-ink-600">{item.desc || item.description}</p></div></div>;
      })}</div>
      <BusinessSuiteVisual view="hr" compact />
    </div>
  );
}

function ModuleCombinations({ items, modules }) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Illustrative module combinations">
      {items.map((item, index) => {
        const combined = String(item.title || "").split(/\s*\+\s*/);
        const full = item.title === "Full Business Suite";
        return (
          <div key={index} className="min-w-0 rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
            <h4 className="sr-only">{item.title}</h4>
            <div className="flex flex-wrap items-center gap-2" aria-hidden="true">
              {combined.map((name, i) => <React.Fragment key={`${name}-${i}`}>{i ? <FiPlus className="shrink-0 text-lotus-500" size={18} /> : null}<ModuleChip label={name} /></React.Fragment>)}
            </div>
            {full ? <div className="mt-4 flex flex-wrap gap-2" aria-hidden="true">{modules.map((name) => { const Icon = SUITE_MODULE_ICONS[name] || FiGrid; return <span key={name} className="inline-flex items-center gap-1.5 rounded-lg bg-lotus-50 px-2.5 py-2 text-xs font-semibold text-lotus-700"><Icon size={13} />{name}</span>; })}</div> : null}
            <p className="mb-0 mt-4 text-sm leading-relaxed text-ink-600">{item.desc || item.description}</p>
          </div>
        );
      })}
    </div>
  );
}

export function SuiteFeatureGroup({ block, index, modules }) {
  const items = itemsOf(block);
  const kind = String(block.eyebrow || "").toLowerCase();
  return (
    <section aria-labelledby={`suite-group-${index}`}>
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-lotus-600">{block.eyebrow}</p>
      <h3 id={`suite-group-${index}`} className="mb-3 mt-2 max-w-3xl text-2xl font-bold tracking-tight text-night sm:text-3xl">{block.title}{block.highlight ? <> <span className="text-lotus-600">{block.highlight}</span></> : null}</h3>
      {block.subtitle ? <p className="m-0 max-w-3xl text-sm leading-relaxed text-ink-600 sm:text-base">{block.subtitle}</p> : null}
      {kind === "connected platform" ? <PlatformMap items={items} /> : kind === "people" ? <PeopleVisual items={items} /> : kind === "modular by design" ? <ModuleCombinations items={items} modules={modules} /> : (
        <div className={`mt-6 grid gap-3 ${items.length === 3 ? "md:grid-cols-3" : "sm:grid-cols-2"}`}>{items.map((item, i) => <div key={i} className="rounded-2xl border border-ink-200 bg-white p-5 sm:p-6"><h4 className="m-0 text-base font-bold text-night">{item.title}</h4><p className="mb-0 mt-2 text-sm leading-relaxed text-ink-600">{item.desc || item.description}</p></div>)}</div>
      )}
    </section>
  );
}
