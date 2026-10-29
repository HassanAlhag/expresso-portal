// Existing, approved website-development copy reused on the /service/web-dev
// brand reference page. Every string below already exists elsewhere in the
// repository and is copied verbatim; the source is noted beside each group.
// Nothing here is new marketing copy. The page's own content still comes from
// its CMS service record.

// Source: client/src/components/WebServices/WebServices.jsx (the "Services /
// Built for the web" section of /marketing-solutions).
export const WEB_BUILDS = {
  eyebrow: "Services",
  title: "Built for the web",
  items: [
    {
      key: "react",
      title: "React / Next.js Websites",
      desc: "Modern builds that feel premium, load fast, and convert — perfect for brands that want performance and flexibility.",
      points: ["Lightning-fast UX", "SEO-ready structure", "Scalable components", "Clean animations"],
    },
    {
      key: "wordpress",
      title: "WordPress Websites",
      desc: "Flexible, editable websites with custom design — ideal for corporate sites, blogs, and content-heavy experiences.",
      points: ["Easy to manage", "SEO foundations", "Custom themes", "Plugin ecosystem"],
    },
    {
      key: "ecommerce",
      title: "eCommerce Stores",
      desc: "High-converting stores built for mobile shoppers — with smooth checkout and all the tools you need to scale.",
      points: ["Secure payments", "Inventory + products", "Mobile-first UX", "Tracking & analytics"],
    },
  ],
};

// Source: client/src/pages/Pricing/webPricingPage.jsx (/pricing/web-dev):
// the "Comprehensive Web Development Solutions" section and three of its
// feature cards. The hosting card is not reused because it states an uptime
// figure.
export const WEB_ENGINEERING = {
  title: "Comprehensive Web Development Solutions",
  text: "From design to deployment, we offer end-to-end web development services tailored to your business needs. Our expertise ensures a seamless, high-performance website that elevates your brand and enhances user experience.",
  features: [
    {
      key: "responsive",
      title: "Responsive Design",
      description: "Ensuring your website looks stunning and functions perfectly on all devices, from desktops to tablets and smartphones. A seamless experience for every user, regardless of screen size.",
    },
    {
      key: "seo",
      title: "SEO Optimization",
      description: "Improve your website's visibility on search engines with best-in-class SEO strategies. From keyword optimization to meta tags and speed enhancements, we help drive organic traffic and increase your online reach.",
    },
    {
      key: "custom",
      title: "Custom Features",
      description: "Get functionalities tailored to your business needs, from interactive elements and API integrations to advanced e-commerce solutions and automation. We build solutions that enhance user engagement and productivity.",
    },
  ],
  pricingLink: { to: "/pricing/web-dev", label: "Website pricing" }, // Source: components/MainHeader/navData.js
};

// Source: the published website case-study records (portfolio introDescription,
// e.g. "profit-assurance" in portal-api/src/scripts/seedPortfolio.js).
export const WEB_STATEMENT = "We don't just design websites — we build digital experiences that turn visitors into loyal customers.";

// Source: client/src/components/MainHeader/navData.js ("Our Work" menu) and
// client/src/components/PortfolioComponents/portfolioList.jsx (card link label).
export const WEB_WORK = {
  eyebrow: "Our Work",
  title: "Work we are proud of.",
  text: "Selected projects, the stories behind them and the brands we work with.",
  link: { to: "/case-studies", label: "Read case studies" },
  itemLinkLabel: "View project details & deliverables",
};

// Source: client/src/pages/Home/home.jsx (HOME_CTA, the site's final call to
// action) — primary action /build-your-plan, secondary /contact-us.
export const WEB_FINAL_CTA = {
  badge: "READY TO MOVE?",
  heading: "Let's turn your idea",
  headingHighlight: "into a clear growth plan",
  description: "Tell us your goal, your style, and what you need. We'll help shape the right direction for your brand, website, or campaign.",
  primary: { to: "/build-your-plan", label: "Build Your Plan" },
  secondary: { to: "/contact-us", label: "Schedule a Call" },
};

/** Published case studies that are website projects (category from the CMS). */
export const isWebsiteCaseStudy = (item) => /web/i.test(String(item?.category || ""));
