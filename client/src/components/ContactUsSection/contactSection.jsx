import React from "react";

const BRAND = "#7F8AD1"; // Expresso logo color

// Reusable header section (use everywhere for consistency)
const ContactUsSection = ({
  highlight = "Contact Us", // colored part
  title = "For More Information", // normal part
  content,
  align = "center", // "center" | "left"
}) => {
  const alignClass = align === "left" ? "text-left" : "text-center";

  return (
    <section className="relative mx-auto max-w-[1100px] px-4 py-10 text-black">
      {/* Header */}
      <div className={`mb-10 ${alignClass}`}>
        <h1 className="mx-auto max-w-4xl text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl md:text-5xl">
          <span style={{ color: BRAND }}>{highlight}</span>{" "}
          <span className="text-neutral-950">{title}</span>
        </h1>

        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-neutral-600 sm:text-lg whitespace-pre-line">
          {content}
        </p>
      </div>
    </section>
  );
};

export default ContactUsSection;
