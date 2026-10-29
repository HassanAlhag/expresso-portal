// Existing, approved SEO copy reused on the /service/seo-marketing brand
// reference page. Every string below already exists in the repository and is
// copied verbatim; nothing here is new marketing copy. The page's own content
// still comes from its CMS service record.

// Source: client/src/pages/Pricing/seoPricingPage.jsx (/pricing/seo), the
// "Crafting Success Through SEO" section — used to introduce the SEO services.
export const SEO_SERVICES_INTRO = {
  title: "Crafting Success Through SEO",
  text: "Unlock the full potential of your website with expert SEO strategies. From keyword research to technical optimizations, we ensure your site ranks higher, drives traffic, and converts visitors into customers.",
};

// Source: client/src/pages/Pricing/seoPricingPage.jsx — the "Optimizing SEO for
// Maximum Impact" section and its four SEO feature cards. Pricing tiers are
// not reused.
export const SEO_WHY = {
  title: "Optimizing SEO for Maximum Impact",
  text: "SEO is more than just keywords—it's about delivering the best user experience. We optimize your site's design, speed, and mobile performance to improve engagement and reduce bounce rates.",
  features: [
    {
      key: "keywords",
      title: "Keyword Research & Strategy",
      description: "Discover high-ranking keywords tailored to your industry. Our advanced keyword research helps increase organic traffic and conversions.",
    },
    {
      key: "onpage",
      title: "On-Page SEO Optimization",
      description: "Enhance your website’s visibility with optimized content, structured headings, meta descriptions, and improved internal linking.",
    },
    {
      key: "technical",
      title: "Technical SEO & Performance Fixes",
      description: "Boost site speed, mobile usability, and fix crawlability issues. Ensure your website is optimized for search engines and user experience.",
    },
    {
      key: "backlinks",
      title: "Backlink Building & Off-Page SEO",
      description: "Strengthen your domain authority with high-quality backlinks and off-page SEO strategies that improve search engine credibility.",
    },
  ],
  pricingLink: { to: "/pricing/seo", label: "SEO pricing" }, // Source: components/MainHeader/navData.js
};
