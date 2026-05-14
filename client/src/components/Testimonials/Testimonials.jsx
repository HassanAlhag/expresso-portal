import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { resolveWebsiteImages } from "../../utils/websiteImages";

const BRAND = "#838FC6";

const Testimonials = () => {
  const settings = useSiteSettings();
  const [order, setOrder] = useState([
    "front",
    "middle",
    "back",
    "behind1",
    "behind2",
  ]);

  const handleShuffle = () => {
    const orderCopy = [...order];
    orderCopy.unshift(orderCopy.pop());
    setOrder(orderCopy);
  };

  // (optional) keep data stable
  const cards = useMemo(
    () =>
      resolveWebsiteImages(settings, [
      {
        imgUrl: "/avatar1.png",
        testimonial:
          "Our new React website loads in under two seconds and our conversion rate has doubled. The team made our vision come alive beautifully!",
        author: "Sarah M. – Marketing Lead @ Baytward",
      },
      {
        imgUrl: "/avatar6.png",
        testimonial:
          "The WordPress site redesign was seamless. From design to deployment, everything was handled with precision and care. Highly recommend!",
        author: "James L. – Brand Manager @ Godfel Group",
      },
      {
        imgUrl: "/avatar3.png",
        testimonial:
          "Our eCommerce platform now runs smoother than ever. The custom backend integrations saved our team hours every week!",
        author: "Priya K. – Operations Manager @ M-Region",
      },
      {
        imgUrl: "/avatar4.png",
        testimonial:
          "The developers understood our business goals from day one. The site is fast, mobile-friendly, and perfectly reflects our brand.",
        author: "Carlos D. – Head of Growth Marketing @ Odeur",
      },
      {
        imgUrl: "/avatar5.png",
        testimonial:
          "Fantastic experience! Their web team delivered a scalable and modern solution that’s helped us grow 3x faster online.",
        author: "Hannah W. – Co-Founder @ Profit Assurance",
      },
    ]),
    [settings]
  );

  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 px-6">
      {/* Background vibes */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-25"
          style={{ background: BRAND }}
        />
        <div className="absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-black/35" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Heading */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-white/55">
              TESTIMONIALS
            </p>
            <h2 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-white">
              RESULTS THAT <br />
              <span style={{ color: BRAND }}>INSPIRE TRUST</span>
            </h2>
          </div>

          <div className="max-w-md mt-6 md:mt-0">
            <p className="text-white/70 text-sm leading-relaxed">
              From startups to enterprises, we’ve helped businesses achieve
              measurable growth through design, technology, and a smooth
              delivery process.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                Verified feedback
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                UAE + Global clients
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                Conversion-focused
              </span>
            </div>
          </div>
        </div>

        {/* Deck */}
        <div className="grid place-items-center px-2 sm:px-8 py-16 text-white">
          <div className="relative h-[460px] w-[360px] sm:h-[480px] sm:w-[380px]">
            {cards.map((c, i) => (
              <Card
                key={c.author}
                imgUrl={c.imgUrl}
                testimonial={c.testimonial}
                author={c.author}
                handleShuffle={handleShuffle}
                position={order[i]}
              />
            ))}
          </div>

          {/* Hint */}
          <div className="mt-10 text-center">
            <p className="text-xs text-white/55">
              Drag the front card left to see the next one
            </p>
            <div className="mt-3 flex justify-center gap-2">
              {order.map((p, i) => (
                <span
                  key={i}
                  className="h-1.5 w-6 rounded-full"
                  style={{
                    background:
                      p === "front" ? BRAND : "rgba(255,255,255,0.22)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Card = ({ handleShuffle, testimonial, position, imgUrl, author }) => {
  const mousePosRef = useRef(0);

  const onDragStart = (e) => {
    mousePosRef.current = e.clientX;
  };

  const onDragEnd = (e) => {
    const diff = mousePosRef.current - e.clientX;
    if (diff > 140) handleShuffle();
    mousePosRef.current = 0;
  };

  // Position mapping (more depth + nicer spread)
  let x = "0%";
  let y = "0%";
  let rotateZ = "0deg";
  let scale = 1;
  let zIndex = 0;
  let opacity = 1;
  let blur = 0;

  switch (position) {
    case "front":
      x = "0%";
      y = "0%";
      rotateZ = "-5deg";
      zIndex = 5;
      scale = 1;
      opacity = 1;
      blur = 0;
      break;
    case "middle":
      x = "18%";
      y = "2%";
      rotateZ = "-2deg";
      zIndex = 4;
      scale = 0.96;
      opacity = 0.95;
      blur = 0;
      break;
    case "back":
      x = "36%";
      y = "4%";
      rotateZ = "2deg";
      zIndex = 3;
      scale = 0.92;
      opacity = 0.85;
      blur = 0.5;
      break;
    case "behind1":
      x = "54%";
      y = "6%";
      rotateZ = "4deg";
      zIndex = 2;
      scale = 0.88;
      opacity = 0.75;
      blur = 1;
      break;
    case "behind2":
      x = "72%";
      y = "8%";
      rotateZ = "6deg";
      zIndex = 1;
      scale = 0.84;
      opacity = 0.65;
      blur = 1.5;
      break;
    default:
      break;
  }

  const draggable = position === "front";

  return (
    <motion.div
      style={{ zIndex, filter: `blur(${blur}px)` }}
      animate={{ rotate: rotateZ, x, y, scale, opacity }}
      drag
      dragElastic={0.25}
      dragListener={draggable}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={[
        "absolute left-0 top-0 h-[460px] w-[360px] sm:h-[480px] sm:w-[380px]",
        "select-none rounded-3xl border border-white/12",
        "bg-white/5 backdrop-blur-xl shadow-[0_28px_90px_rgba(0,0,0,0.45)]",
        "p-7 sm:p-8",
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
      ].join(" ")}
    >
      {/* subtle gradient / liquid highlight */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-25"
        style={{ background: BRAND }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/10 via-white/0 to-white/0" />

      <div className="relative flex h-full flex-col">
        {/* header */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={imgUrl}
              alt={author}
              className="pointer-events-none h-14 w-14 rounded-2xl border border-white/15 bg-white/10 object-cover"
              draggable={false}
            />
            <span
              className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-slate-950"
              style={{ backgroundColor: BRAND }}
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-extrabold text-white line-clamp-1">
              {author}
            </p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-white/60">
              <span>★★★★★</span>
              <span className="mx-1">•</span>
              <span>Client feedback</span>
            </div>
          </div>
        </div>

        {/* quote */}
        <div className="mt-6 flex-1">
          <p className="text-[15px] sm:text-base leading-relaxed text-white/80">
            <span className="text-white/90 font-semibold">“</span>
            {testimonial}
            <span className="text-white/90 font-semibold">”</span>
          </p>
        </div>

        {/* footer */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs font-semibold text-white/60">
            Expresso Digital
          </span>
          <span
            className="h-1 w-16 rounded-full"
            style={{ backgroundColor: BRAND, opacity: 0.9 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Testimonials;
