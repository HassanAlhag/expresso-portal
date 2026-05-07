import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listProductions } from "../api";

export default function ProductionsPage() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await listProductions({ status: "published", q, limit: 24 });
      setItems(res?.items || []);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load productions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [q]);

  const total = useMemo(() => items.length, [items]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Our Productions
          </h1>
          <p className="mt-2 text-slate-600">
            Explore our latest work — design, web, content, and campaigns.
          </p>
        </div>

        <div className="w-full md:w-[340px]">
          <label className="block text-xs font-semibold tracking-[0.18em] text-slate-500 mb-2">
            SEARCH
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title/tags…"
            className="w-full h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-black/5"
          />
          <div className="mt-2 text-xs text-slate-500">
            Total: <span className="font-extrabold">{total}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-black/10 bg-slate-50 animate-pulse"
            />
          ))}
        </div>
      ) : err ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
          {err}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 text-sm font-extrabold text-slate-700">
          No productions found.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => {
            const cover = p.coverMedia?.thumbnailUrl || p.coverMedia?.url;
            return (
              <button
                key={p._id}
                type="button"
                onClick={() => nav(`/productions/${p.slug}`)}
                className="text-left rounded-2xl border border-black/10 bg-white overflow-hidden hover:shadow-md transition"
              >
                <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
                  {cover ? (
                    <img
                      src={cover}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full grid place-items-center text-xs font-extrabold text-slate-600">
                      NO COVER
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-lg font-black text-slate-900 line-clamp-1">
                    {p.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 line-clamp-2">
                    {p.excerpt || ""}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(p.tags || []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[11px] font-extrabold px-3 py-1 rounded-full border border-black/10 bg-slate-50 text-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
