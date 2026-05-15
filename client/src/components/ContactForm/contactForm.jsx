import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import emailjs from "@emailjs/browser";
import { useNavigate } from "react-router-dom";
import SuccessModal from "./successModal";

const BRAND = "#7F8AD1"; // your logo indigo
const BASE_TRANSITION = { type: "spring", stiffness: 260, damping: 28 };

const ShiftingContactForm = () => {
  const [selected, setSelected] = useState("individual");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <section className="relative bg-white px-4 py-10 md:py-16">
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.12)]">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Form
              selected={selected}
              setSelected={setSelected}
              setIsModalOpen={setIsModalOpen}
            />
          </div>

          <div className="relative lg:col-span-5">
            <Images selected={selected} />
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          navigate("/");
        }}
      />
    </section>
  );
};

const Form = ({ selected, setSelected, setIsModalOpen }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    message: "",
  });

  const isCompany = selected === "company";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const canSubmit = useMemo(() => {
    if (!formData.name.trim()) return false;
    if (!formData.email.trim()) return false;
    if (!formData.message.trim()) return false;
    if (isCompany && !formData.companyName.trim()) return false;
    return true;
  }, [formData, isCompany]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);

    const templateParams = {
      title: isCompany ? "Company Inquiry" : "Individual Inquiry",
      type: isCompany ? "Company" : "Individual",
      name: formData.name || "N/A",
      email: formData.email || "N/A",
      phone: formData.phone || "N/A",
      companyName: isCompany ? formData.companyName : "",
      message: formData.message || "N/A",
    };

    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        templateParams,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        companyName: "",
        message: "",
      });
      setSelected("individual");
      setIsModalOpen(true);
    } catch (error) {
      console.error("EmailJS error:", error);
      alert("Message failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative h-full">
      {/* top header strip (dark glass vibe like your header) */}
      <div className="relative overflow-hidden bg-neutral-950 px-7 py-8 sm:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(900px_circle_at_20%_10%,rgba(127,138,209,0.28),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(700px_circle_at_80%_80%,rgba(255,0,0,0.14),transparent_55%)]" />

        <h3 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Tell us about your project.
        </h3>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
          Choose the type of inquiry and we’ll get back to you quickly.
        </p>

        <div className="mt-6">
          <FormSelect selected={selected} setSelected={setSelected} />
        </div>
      </div>

      {/* form body */}
      <div className="bg-white px-7 py-8 sm:px-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Your name" required>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Hassan Ahmed"
            />
          </Field>

          <Field label="Email" required>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@company.com"
            />
          </Field>

          <Field label="Phone (optional)">
            <Input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+971 5X XXX XXXX"
            />
          </Field>

          {/* Always in the grid as the 4th slot — grid never reflows */}
          <div className={!isCompany ? "pointer-events-none hidden md:block" : ""}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isCompany ? 1 : 0 }}
              transition={BASE_TRANSITION}
            >
              <Field label="Company name" required>
                <Input
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Expresso Telecom Group"
                  tabIndex={isCompany ? 0 : -1}
                />
              </Field>
            </motion.div>
          </div>
        </div>

        <div className="mt-4">
          <Field label="Message" required>
            <Textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Tell us what you need: website, social media management, SEO, Google Ads…"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500">
            By submitting, you agree to be contacted by our team.
          </p>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={!canSubmit || submitting}
            className={[
              "inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold transition",
              "shadow-[0_18px_55px_rgba(127,138,209,0.25)]",
              !canSubmit || submitting
                ? "cursor-not-allowed bg-neutral-200 text-neutral-500"
                : "bg-neutral-950 text-white hover:bg-neutral-900",
            ].join(" ")}
          >
            {submitting ? "Sending..." : "Send message"}
            <span
              className="ml-3 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: BRAND }}
            />
          </motion.button>
        </div>
      </div>
    </form>
  );
};

const FormSelect = ({ selected, setSelected }) => {
  return (
    <div className="inline-flex overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
      <TabButton
        active={selected === "individual"}
        onClick={() => setSelected("individual")}
      >
        Individual
      </TabButton>

      <TabButton
        active={selected === "company"}
        onClick={() => setSelected("company")}
      >
        Company
      </TabButton>
    </div>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "relative rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition sm:text-sm",
      active ? "text-black" : "text-white/80 hover:text-white",
    ].join(" ")}
  >
    <span className="relative z-10">{children}</span>
    {active ? (
      <motion.span
        layoutId="contact-form-tab"
        transition={BASE_TRANSITION}
        className="absolute inset-0 z-0 rounded-xl bg-white"
      />
    ) : null}
  </button>
);

const Images = ({ selected }) => {
  return (
    <div className="relative h-[280px] overflow-hidden bg-neutral-950 lg:h-full">
      {/* subtle overlays */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/35 via-black/20 to-black/60" />
      <div className="pointer-events-none absolute inset-0 z-10 opacity-70 [background:radial-gradient(900px_circle_at_30%_20%,rgba(127,138,209,0.25),transparent_55%)]" />

      {/* slide A */}
      <motion.div
        initial={false}
        animate={{ x: selected === "individual" ? "0%" : "100%" }}
        transition={BASE_TRANSITION}
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1740&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* slide B */}
      <motion.div
        initial={false}
        animate={{ x: selected === "company" ? "0%" : "-100%" }}
        transition={BASE_TRANSITION}
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1932&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* tiny corner badge */}
      <div className="absolute bottom-4 left-4 z-20 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/80 backdrop-blur-xl">
        <div className="font-semibold text-white">Expresso Digital</div>
        <div className="mt-0.5 text-white/65">
          Websites • Social • SEO • Ads
        </div>
      </div>
    </div>
  );
};

/* ---------- UI bits ---------- */

const Field = ({ label, required, children }) => (
  <label className="block">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm font-semibold text-neutral-900">{label}</span>
      {required ? (
        <span className="text-xs text-neutral-500">Required</span>
      ) : null}
    </div>
    {children}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={[
      "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900",
      "shadow-[0_10px_28px_rgba(0,0,0,0.06)]",
      "placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-200/70 focus:border-neutral-300",
      className,
    ].join(" ")}
  />
);

const Textarea = ({ className = "", ...props }) => (
  <textarea
    {...props}
    className={[
      "min-h-[150px] w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900",
      "shadow-[0_10px_28px_rgba(0,0,0,0.06)]",
      "placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-200/70 focus:border-neutral-300",
      className,
    ].join(" ")}
  />
);

export default ShiftingContactForm;
