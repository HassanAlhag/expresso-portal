import React from "react";
import { Link } from "react-router-dom";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  breadcrumb = [],
  right,
  className = "",
}) {
  return (
    <div className={["flex flex-col gap-4", className].join(" ")}>
      {breadcrumb.length ? (
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
          {breadcrumb.map((item, index) => {
            const last = index === breadcrumb.length - 1;

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {item.to && !last ? (
                  <Link
                    to={item.to}
                    className="transition hover:text-indigo-600"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={last ? "text-slate-900" : ""}>
                    {item.label}
                  </span>
                )}

                {!last ? <span className="text-slate-300">›</span> : null}
              </React.Fragment>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {eyebrow ? (
            <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
              {eyebrow}
            </div>
          ) : null}

          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {subtitle}
            </p>
          ) : null}
        </div>

        {right ? <div className="flex-shrink-0">{right}</div> : null}
      </div>
    </div>
  );
}
