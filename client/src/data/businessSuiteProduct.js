// Public product copy, grounded in the currently implemented CRM, projects,
// HR, billing and procurement routes. These are product capabilities, not a
// promise of a self-service SaaS, full ERP, accounting system or payroll.
// Defaults use the EXISTING Solutions CMS block shapes. A published digital
// Solution with slug "business-suite" can replace them through `blocks`.
export const BUSINESS_SUITE_PRODUCT = Object.freeze({
  slug: "business-suite",
  title: "Expresso Business Suite",
  subtitle: "Modular business operations platform",
  tagline: "One connected platform. The modules your business needs.",
  description:
    "Bring customers, projects, people, finance and procurement into one connected workspace. Start with what you need. Add modules as your business grows.",
  to: "/digital-solutions/business-suite",
  badge: "Built by Expresso",
  ctaLabel: "Explore Business Suite",
  heroImageUrl: "/images/products/business-suite/crm-desktop.svg",
  demoCtaLabel: "Request a Business Suite Demo",
  demoCtaHref: "/contact-us?interest=business-suite-demo",
  order: 1,
});

// Representative compositions of existing UI; fictional sample records only.
// Mobile views are recomposed rather than shrinking a full desktop table.
export const BUSINESS_SUITE_IMAGES = {
  crm: {
    src: "/images/products/business-suite/crm-desktop.svg",
    mobile: "/images/products/business-suite/crm-mobile.svg",
    alt: "Illustrative Expresso CRM deals board with fictional opportunities in Discovery, Qualified and Proposal stages.",
    caption: "CRM deal stages · illustrative sample data",
  },
  projects: {
    src: "/images/products/business-suite/projects-desktop.svg",
    mobile: "/images/products/business-suite/projects-mobile.svg",
    alt: "Illustrative Expresso project list with fictional delivery records, statuses and priorities.",
    caption: "Project delivery · illustrative sample data",
  },
  hr: {
    src: "/images/products/business-suite/hr-desktop.svg",
    mobile: "/images/products/business-suite/hr-mobile.svg",
    compact: "/images/products/business-suite/hr-detail.svg",
    alt: "Illustrative Expresso leave request list with fictional staff, leave types and approval statuses. Private dates omitted.",
    caption: "HR leave requests · illustrative sample data",
  },
  finance: {
    src: "/images/products/business-suite/finance-desktop.svg",
    mobile: "/images/products/business-suite/finance-mobile.svg",
    alt: "Illustrative Expresso invoice list showing sample invoice statuses. All monetary values are omitted.",
    caption: "Billing and invoice statuses · values omitted",
  },
  procurement: {
    src: "/images/products/business-suite/procurement-desktop.svg",
    mobile: "/images/products/business-suite/procurement-mobile.svg",
    alt: "Illustrative Expresso staff RFQ list with fictional requirements, categories and publication statuses.",
    caption: "Procurement RFQs · illustrative sample data",
  },
  "client-portal": {
    src: "/images/products/business-suite/client-portal-desktop.svg",
    mobile: "/images/products/business-suite/client-portal-mobile.svg",
    alt: "Illustrative Expresso Client Overview with sample projects, support requests and shared documents. Summary values omitted.",
    caption: "Client Overview · company-scoped sample content",
  },
  "vendor-portal": {
    src: "/images/products/business-suite/vendor-portal-desktop.svg",
    mobile: "/images/products/business-suite/vendor-portal-mobile.svg",
    alt: "Illustrative Expresso Vendor Overview with sample open RFQs and the vendor’s own quotation statuses. Summary values omitted.",
    caption: "Vendor Overview · own quotations only",
  },
};

export const BUSINESS_SUITE_MODULE_VIEWS = {
  CRM: "crm", Projects: "projects", "HR & People": "hr", Finance: "finance",
  Procurement: "procurement", "Client Portal": "client-portal", "Vendor Portal": "vendor-portal",
};

// `useCases` = a module name, benefit (subtitle) and capability list (items).
// `process` = an illustrative workflow; `featureGrid` = related choices.
// All fields below are already editable by the existing Solutions block editor.
export const BUSINESS_SUITE_BLOCKS = [
  {
    type: "useCases", title: "CRM",
    subtitle: "Keep customer relationships and sales opportunities together.",
    items: ["Leads, deals, accounts and contacts", "Activities and follow-ups", "Lead-to-deal and deal-to-client conversion"],
  },
  {
    type: "useCases", title: "Projects",
    subtitle: "Keep delivery work connected to the client and the project.",
    items: ["Project details and status tracking", "Related jobs, files and invoices", "Client visibility for authorised projects"],
  },
  {
    type: "useCases", title: "HR & People",
    subtitle: "Bring everyday people records and requests into one place.",
    items: ["Staff records and skills", "Leave requests and expense claims", "KPI indicators, goals and check-ins"],
  },
  {
    type: "useCases", title: "Finance",
    subtitle: "See invoices, recorded payments and what remains outstanding.",
    items: ["Invoices and payment records", "Outstanding balances and finance statistics", "Expense tracking"],
  },
  {
    type: "useCases", title: "Procurement",
    subtitle: "Take a requirement through sourcing and quotation review.",
    items: ["Requests, vendors, applications and categories", "RFQs and vendor quotations", "Quotation review, award and status workflows"],
  },
  {
    type: "useCases", title: "Client Portal",
    subtitle: "Give clients access to the information they are authorised to see.",
    items: ["Relevant projects and invoices", "Shared files and documents", "Support tickets and account information"],
  },
  {
    type: "useCases", title: "Vendor Portal",
    subtitle: "Give approved vendors a focused place to respond to opportunities.",
    items: ["Vendor onboarding and access", "Relevant RFQs and quotation submission", "Own quotation and status visibility"],
  },
  {
    type: "process", eyebrow: "Customers & delivery", title: "From the first conversation to the invoice.",
    subtitle: "Your team connects each stage: lead → deal → client, then client → project → invoice.",
    steps: [
      { step: "01", title: "Lead", desc: "Capture an enquiry." },
      { step: "02", title: "Deal", desc: "Develop the opportunity." },
      { step: "03", title: "Client", desc: "Convert the relationship." },
      { step: "04", title: "Project", desc: "Organise the delivery." },
      { step: "05", title: "Invoice", desc: "Bill for the work." },
    ],
  },
  {
    type: "process", eyebrow: "Procurement & vendors", title: "From a requirement to an award.",
    subtitle: "Bring staff sourcing decisions and vendor responses into the same process.",
    steps: [
      { step: "01", title: "Request", desc: "Define what is needed." },
      { step: "02", title: "RFQ", desc: "Invite relevant vendors." },
      { step: "03", title: "Vendor quote", desc: "Receive and review responses." },
      { step: "04", title: "Award", desc: "Accept the chosen quotation." },
    ],
  },
  {
    type: "featureGrid", eyebrow: "Connected platform", title: "Keep the context of the work.",
    subtitle: "Related modules support the same operation. Your team decides what happens next.",
    items: [
      { title: "CRM → Clients → Projects → Billing", desc: "Carry the customer relationship into delivery and its related invoices." },
      { title: "Procurement ↔ Vendors / RFQs", desc: "Bring sourcing requirements and vendor responses together." },
      { title: "HR & People ↔ Internal operations", desc: "Connect people records with leave, expenses and goals." },
    ],
  },
  {
    type: "featureGrid", eyebrow: "People", title: "One team. Everyday needs connected.",
    subtitle: "Support your people with related records and requests, rather than separate spreadsheets.",
    items: [
      { title: "Leave", desc: "Submit requests and record decisions." },
      { title: "Expenses", desc: "Track claims and their approval status." },
      { title: "Goals", desc: "Maintain goals, KPI indicators and check-ins." },
    ],
  },
  {
    type: "featureGrid", eyebrow: "Modular by design", title: "Choose the modules that fit your operation.",
    subtitle: "Start with what you need. Add modules as your business grows. These are illustrative combinations, not fixed packages or prices.",
    items: [
      { title: "CRM + Projects", desc: "Connect customer relationships with delivery work." },
      { title: "HR + Finance", desc: "Bring people requests, expense tracking and finance records together." },
      { title: "Procurement + Vendor Portal", desc: "Connect your sourcing team with vendor responses." },
      { title: "Full Business Suite", desc: "Bring the modules together around your operation." },
    ],
  },
];

export function getBusinessSuiteBlocks(blocks) {
  return Array.isArray(blocks) && blocks.length ? blocks : BUSINESS_SUITE_BLOCKS;
}
