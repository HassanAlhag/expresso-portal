import React, { useId, useRef, useState } from "react";
import { FiArrowRight, FiCheck, FiGrid } from "react-icons/fi";
import { getBusinessSuiteBlocks, BUSINESS_SUITE_MODULE_VIEWS } from "../../data/businessSuiteProduct";
import BusinessSuiteVisual from "./BusinessSuiteVisual";
import { SUITE_MODULE_ICONS as MODULE_ICONS, WorkflowStrip, SuiteFeatureGroup } from "./BusinessSuiteDiagrams";
import SolutionDetailRenderer from "../../components/SolutionDetailRenderer/SolutionDetailRenderer";

const strings = (items) => (Array.isArray(items) ? items : [])
  .map((item) => typeof item === "string" ? item : item?.title || item?.label || item?.text || "")
  .filter(Boolean);

function ModuleExplorer({ modules }) {
  const [selected, setSelected] = useState(0);
  const tabs = useRef([]);
  const id = useId();
  const index = Math.min(selected, modules.length - 1);
  const module = modules[index];
  if (!module) return null;
  const Icon = MODULE_ICONS[module.title] || FiGrid;

  const onKeyDown = (event, current) => {
    let next;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % modules.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (current + modules.length - 1) % modules.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = modules.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  };

  return (
    <div id="suite-modules" className="scroll-mt-28 overflow-hidden rounded-[28px] border border-ink-200 bg-white">
      <div className="border-b border-ink-200 px-6 py-6 sm:px-8">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-lotus-600">Inside the Business Suite</p>
        <h3 className="mb-2 mt-2 text-2xl font-bold tracking-tight text-night sm:text-3xl">One platform. Connected modules.</h3>
        <p className="m-0 text-sm leading-relaxed text-ink-600">Explore a module to see how it supports your day-to-day operation.</p>
      </div>
      <div className="grid min-w-0 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)]">
        <div role="tablist" aria-label="Business Suite modules" className="grid grid-cols-2 content-start gap-2 border-b border-ink-200 bg-mist p-4 md:grid-cols-1 md:border-b-0 md:border-r md:p-5">
          {modules.map((item, i) => {
            const ItemIcon = MODULE_ICONS[item.title] || FiGrid;
            return (
              <button
                key={`${item.title}-${i}`} type="button" role="tab"
                id={`${id}-tab-${i}`} aria-controls={`${id}-panel`} aria-selected={index === i}
                tabIndex={index === i ? 0 : -1} ref={(node) => { tabs.current[i] = node; }}
                onClick={() => setSelected(i)} onKeyDown={(event) => onKeyDown(event, i)}
                className={`inline-flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lotus-600 sm:px-4 ${index === i ? "border-lotus-300 bg-white text-lotus-700 shadow-sm" : "border-transparent text-ink-600 hover:bg-white hover:text-night"}`}
              >
                <ItemIcon size={17} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">{item.title}</span>
                {index === i ? <FiArrowRight className="ml-auto hidden shrink-0 sm:block" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
        <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${index}`} tabIndex={0} className="min-w-0 p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-lotus-500 sm:p-9 lg:p-12">
          <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-lotus-50 text-lotus-600"><Icon size={23} aria-hidden="true" /></span>
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">An Expresso Business Suite module</p>
          <h4 className="mb-3 mt-2 text-3xl font-bold tracking-tight text-night">{module.title}</h4>
          {module.subtitle ? <p className="m-0 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">{module.subtitle}</p> : null}
          <ul className="mb-0 mt-7 grid list-none gap-4 p-0">
            {strings(module.items).map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink-700"><FiCheck size={17} className="mt-0.5 shrink-0 text-lotus-600" aria-hidden="true" /><span>{item}</span></li>)}
          </ul>
          {BUSINESS_SUITE_MODULE_VIEWS[module.title] ? <div className="mt-8"><BusinessSuiteVisual view={BUSINESS_SUITE_MODULE_VIEWS[module.title]} focused /></div> : null}
        </div>
      </div>
    </div>
  );
}

export default function BusinessSuiteSection({ product }) {
  const blocks = getBusinessSuiteBlocks(product.blocks).filter((block) => block && typeof block === "object");
  const modules = blocks.filter((block) => block.type === "useCases" && block.title);
  const workflows = blocks.filter((block) => block.type === "process");
  const groups = blocks.filter((block) => block.type === "featureGrid");
  const otherBlocks = blocks.filter((block) => !["useCases", "process", "featureGrid"].includes(block.type));
  return (
    <section id="modules" aria-label="Business Suite modules and workflows" className="scroll-mt-24 bg-mist py-16 md:py-24">
      <div className="mx-auto flex w-[min(1200px,92vw)] min-w-0 flex-col gap-12 md:gap-16">
        <ModuleExplorer modules={modules} />

        {workflows.length ? (
          <div className="flex flex-col gap-5" aria-labelledby="suite-workflows">
            <div><p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-lotus-600">Connected workflows</p><h3 id="suite-workflows" className="mb-2 mt-2 text-2xl font-bold tracking-tight text-night sm:text-3xl">Move the work forward, together.</h3></div>
            {workflows.map((block, i) => <WorkflowStrip key={i} block={block} />)}
          </div>
        ) : null}

        {groups.map((block, index) => <SuiteFeatureGroup key={index} block={block} index={index} modules={modules.map((module) => module.title)} />)}
        {otherBlocks.length ? <SolutionDetailRenderer blocks={otherBlocks} /> : null}
      </div>
    </section>
  );
}
