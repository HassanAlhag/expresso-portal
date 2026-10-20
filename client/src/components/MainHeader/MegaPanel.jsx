import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import BrandMark from "../../brand/BrandMark";

// One layout for every desktop menu (approved design direction):
//   [context panel · Night] [grouped links | featured cards] [action panel]
// Text sizes follow the Expresso type scale (13–15px in menus, not 11px).

function ContextPanel({ context }) {
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden bg-night p-6 text-white xl:p-7">
      <BrandMark
        size={250}
        tone="white"
        className="pointer-events-none absolute -bottom-10 -right-16 opacity-[0.06]"
      />
      <div className="relative flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-lotus-300">
        {context.mark ? <BrandMark size={18} tone="lotus-300" /> : null}
        {context.eyebrow}
      </div>
      <p className="relative m-0 font-dax-condensed text-[22px] font-bold leading-[1.08] text-white xl:text-[26px]">
        {context.title}
      </p>
      <p className="relative m-0 text-[14px] leading-relaxed text-white/65">{context.text}</p>
      {context.link ? (
        <Link
          to={context.link.to}
          className="relative mt-auto inline-flex items-center gap-1.5 pt-4 text-[14px] font-semibold text-lotus-300 transition-colors hover:text-white"
        >
          {context.link.label} <FiArrowRight size={14} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function MenuItem({ item, dense = false }) {
  return (
    <Link
      to={item.to}
      className="group flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-lotus-50 focus-visible:bg-lotus-50"
    >
      <span className="flex items-center gap-1.5 text-[15px] font-semibold leading-snug text-night group-hover:text-lotus-700">
        {item.title}
        <FiArrowRight
          size={13}
          aria-hidden="true"
          className="-translate-x-1 text-lotus-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
        />
      </span>
      {item.desc ? (
        <span
          className={`line-clamp-2 text-[13px] leading-snug text-ink-500 ${dense ? "hidden xl:block" : ""}`}
        >
          {item.desc}
        </span>
      ) : null}
    </Link>
  );
}

function Groups({ groups, emptyText }) {
  const visible = (groups || []).filter((g) => g.items?.length);
  if (!visible.length) {
    return <p className="m-0 p-6 text-[14px] text-ink-500">{emptyText || "Loading…"}</p>;
  }
  // A single group spreads over columns; several groups sit side by side.
  if (visible.length === 1) {
    const g = visible[0];
    const cols = g.columns || 2;
    // Long lists drop descriptions on smaller laptops so the panel stays compact.
    const dense = g.items.length > 6;
    return (
      <div className="p-6">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">
          {g.label}
        </div>
        <div className="grid gap-x-2 gap-y-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {g.items.map((item) => (
            <MenuItem key={item.to + item.title} item={item} dense={dense} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div
      className="grid gap-4 p-6"
      style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}
    >
      {visible.map((g) => (
        <div key={g.label} className="flex flex-col gap-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">
            {g.label}
          </div>
          {g.items.map((item) => (
            <MenuItem key={item.to + item.title} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Featured({ items }) {
  return (
    <div className="grid gap-3 p-6">
      {items.map((f) => (
        <Link
          key={f.to}
          to={f.to}
          className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-lotus-200 bg-lotus-50 p-5 transition hover:border-lotus-300 hover:bg-white"
        >
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-night px-3 py-1 text-[12px] font-bold text-lotus-200">
            <BrandMark size={16} tone="white" />
            {f.badge}
          </span>
          <span className="text-[18px] font-bold leading-snug text-night">{f.title}</span>
          <span className="text-[14px] leading-relaxed text-ink-600">{f.desc}</span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-semibold text-lotus-600 group-hover:text-lotus-700">
            {f.cta || "Explore"} <FiArrowRight size={14} aria-hidden="true" />
          </span>
        </Link>
      ))}
    </div>
  );
}

function ActionPanel({ action }) {
  const sand = action.tone === "sand";
  return (
    <div
      className={`flex flex-col gap-3 border-l p-6 xl:p-7 ${
        sand ? "border-[#EDE3D9] bg-sand" : "border-ink-200 bg-mist"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] ${
          sand ? "text-espresso" : "text-lotus-600"
        }`}
      >
        {sand ? <BrandMark size={20} tone="espresso" /> : null}
        {action.eyebrow}
      </div>
      <p className="m-0 font-dax-condensed text-[21px] font-bold leading-[1.08] text-night xl:text-[24px]">
        {action.title}
      </p>
      <p className="m-0 text-[14px] leading-relaxed text-ink-600">{action.text}</p>
      {action.links?.length ? (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {action.links.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="text-[14px] font-medium text-ink-600 hover:text-lotus-700">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Link
          to={action.primary.to}
          className={`rounded-full px-5 py-3 text-center text-[14px] font-bold transition ${
            sand
              ? "bg-night text-white hover:bg-night-800"
              : "bg-lotus-600 text-white hover:bg-lotus-700"
          }`}
        >
          {action.primary.label}
        </Link>
        {action.secondary ? (
          <Link
            to={action.secondary.to}
            className={`text-center text-[13px] font-semibold ${
              sand ? "text-espresso hover:underline" : "text-lotus-600 hover:underline"
            }`}
          >
            {action.secondary.label} →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function MegaPanel({ menu }) {
  const hasAction = Boolean(menu.action);
  // Narrower side panels on laptops (992–1199px), full size from 1200px.
  const columns = hasAction
    ? "grid-cols-[200px_minmax(0,1fr)_240px] xl:grid-cols-[240px_minmax(0,1fr)_280px]"
    : "grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]";
  return (
    <div
      className={`grid overflow-hidden rounded-[22px] bg-white text-night shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${columns}`}
    >
      <ContextPanel context={menu.context} />
      {menu.featured?.length ? (
        <Featured items={menu.featured} />
      ) : (
        <Groups groups={menu.groups} emptyText={menu.emptyText} />
      )}
      {hasAction ? <ActionPanel action={menu.action} /> : null}
    </div>
  );
}
