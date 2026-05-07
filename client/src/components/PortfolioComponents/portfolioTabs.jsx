// portfolioTabs.jsx
import React from "react";

export const PortfolioTab = ({ selected, setSelected }) => {
  return (
    <div className="bg-white">
      <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3 px-4 pb-8">
        {TAB_DATA.map((t) => (
          <ToggleButton
            key={t.id}
            id={t.id}
            selected={selected}
            setSelected={setSelected}
          >
            {t.title}
          </ToggleButton>
        ))}
      </div>
    </div>
  );
};

const ToggleButton = ({ children, selected, setSelected, id }) => {
  const active = selected === id;

  return (
    <button
      onClick={() => setSelected(id)}
      className={[
        "rounded-full px-5 py-2 text-sm font-medium transition",
        "border bg-white",
        active
          ? "border-[#7F8AD1] text-[#7F8AD1] shadow-[0_10px_30px_rgba(127,138,209,0.22)]"
          : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
};

export const TAB_DATA = [
  { id: 1, title: "All" },
  { id: 2, title: "Website" },
  { id: 3, title: "Social Media" },
  { id: 4, title: "Google Ads" },
  { id: 5, title: "SEO" },
];
