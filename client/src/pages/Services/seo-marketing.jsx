import React from "react";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import WebDevelopmentSolutions from "../../components/ServicesComponents/webSolution";
import WebSteps from "../../components/ServicesComponents/webSteps";
// import { NeuPricing } from "../../components/ServicesComponents/pricing";
import BasicFAQ from "../../components/ServicesComponents/faq";

function SeoMarketingPage() {
  const descriptions = [
    "Elevate your digital presence with our cutting-edge SEO services designed to boost your rankings, drive targeted traffic, and enhance your website’s performance. We combine data-driven strategies with industry expertise to ensure your online growth is both impactful and sustainable.",
    "SEO doesn’t have to be complicated. We simplify the process to attract the right audience, increase engagement, and maximize conversions through tailored SEO solutions.",
    "Our team uses proven techniques to enhance your online visibility, ensuring long-term success and measurable results that matter.",
  ];
  const features = [
    {
      id: 1,
      callout: "Keyword Research",
      title: "Unleashing the Power of High-Impact Keywords",
      description:
        "Effective SEO begins with finding the perfect keywords. We don’t just look at search volumes — we dig deeper into user intent and emerging trends to uncover high-impact, low-competition keywords that drive quality traffic. Our tailored approach ensures your website surfaces for the right searches, turning visibility into genuine engagement.",
      contentPosition: "r",
      image: "/seo1.jpg",
    },
    {
      id: 2,
      callout: "On-Page SEO",
      title: "Crafting Content for Maximum Search Impact",
      description:
        "On-page optimization is the key to boosting your website’s visibility. We fine-tune every detail — from content and HTML structure to keyword placement — ensuring your title tags, meta descriptions, headers, and images are fully optimized. This approach not only enhances your rankings but also ensures both search engines and users easily navigate and engage with your content.",
      contentPosition: "l",
      image: "/seo2.jpg",
    },
    {
      id: 3,
      callout: "Link Building",
      title: "Building a Rock-Solid SEO Foundation",
      description:
        "Technical SEO is the backbone of your website’s performance. We ensure your site meets all search engine standards for speed, security, and mobile optimization. Our team conducts thorough audits, fixes technical issues, and enhances performance to improve crawlability — delivering a flawless user experience and boosting your search rankings.",
      contentPosition: "r",
      image: "/seo3.jpg",
    },
    {
      id: 4,
      callout: "Technical SEO",
      title: "Your Website Deserves to Be Seen. Let’s Make It Unmissable.",
      description:
        "Backlinks from reputable sites are key to building credibility and climbing the ranks. We use ethical link-building strategies to earn high-quality inbound links, boosting your site's reputation and trustworthiness with search engines. This drives consistent organic traffic and solidifies your authority online.",
      contentPosition: "l",
      image: "/seo5.jpg",
    },
    {
      id: 5,
      callout: "SEO Analytics",
      title: "Monitoring & Maximizing Performance",
      description:
        "SEO is a journey, not a one-time fix. We continuously track key metrics — from traffic and rankings to conversions — using data-driven insights to fine-tune strategies. This ensures sustained growth and ongoing improvement in your search visibility, keeping you ahead of the competition.",
      contentPosition: "r",
      image: "/seo6.jpg",
    },
  ];
  // const pricingOptions = [
  //   {
  //     title: "Starter",
  //     price: "2000",
  //     statement: "Perfect for small businesses starting with SEO.",
  //     items: [
  //       { children: "5 Optimized Pages", checked: true },
  //       { children: "Keyword Research & Strategy", checked: true },
  //       { children: "On-Page SEO Optimization", checked: true },
  //       { children: "Basic Technical SEO Audit", checked: false },
  //     ],
  //   },
  //   {
  //     title: "Growth",
  //     price: "4000",
  //     statement: "Designed for businesses aiming for higher rankings.",
  //     highlight: true,
  //     items: [
  //       { children: "10 Optimized Pages", checked: true },
  //       { children: "Advanced Keyword Research", checked: true },
  //       { children: "Technical SEO Fixes & Optimization", checked: true },
  //       { children: "Monthly Performance Reports", checked: true },
  //     ],
  //   },
  //   {
  //     title: "Elite",
  //     price: "7000",
  //     statement: "For enterprises dominating search engine rankings.",
  //     items: [
  //       { children: "20 Optimized Pages", checked: true },
  //       {
  //         children: "Technical SEO & Speed Boost",
  //         checked: true,
  //       },
  //       { children: "High-Quality Link Building Strategy", checked: true },
  //       { children: "SEO-Optimized Content Strategy", checked: true },
  //     ],
  //   },
  // ];
  const faqQuestions = [
    {
      title: "How does SEO help my business?",
      content:
        "SEO improves your website’s visibility on search engines, helping you attract more organic traffic, enhance brand credibility, and generate more leads without relying on paid ads.",
      defaultOpen: true,
    },
    {
      title: "How long does SEO take to show results?",
      content:
        "SEO is a long-term strategy. Generally, noticeable improvements can be seen within 3-6 months, but significant growth and rankings take continuous effort over time.",
    },
    {
      title: "What’s the difference between on-page and off-page SEO?",
      content:
        "On-page SEO involves optimizing website content, keywords, and technical elements, while off-page SEO focuses on external factors like backlinks and online reputation management.",
    },
    {
      title: "Do you provide keyword research and content strategy?",
      content:
        "Yes, we conduct in-depth keyword research and develop a content strategy tailored to your industry, ensuring your website ranks for high-intent search queries.",
    },
    {
      title: "Will I need to continue SEO after reaching the top rankings?",
      content:
        "Yes! SEO is ongoing. Search engine algorithms change, competitors evolve, and maintaining top rankings requires consistent optimization and content updates.",
    },
    {
      title: "How do you track SEO performance?",
      content:
        "We provide monthly reports that include keyword rankings, traffic analysis, backlinks, and other key performance metrics to measure the effectiveness of our SEO efforts.",
    },
  ];

  return (
    <div>
      <ServiceBanner
        heading="🔍 SEO – Because Page 2 of Google Is a Dead End"
        subHeading="Let’s face it — nobody’s clicking through to Page 2. That’s why our SEO strategies are laser-focused on getting you where it counts: the top."
        backgroundImage="/seo7.jpg"
        ctaText="Get Started"
        ctaLink="/contact-us"
        badgeText="HEY!"
        badgeLink="https://www.producthunt.com"
      />
      <WebDevelopmentSolutions
        image="/seo4.jpg"
        heading="Supercharge Your Online Visibility with Expert SEO"
        descriptions={descriptions}
      />
      <WebSteps features={features} />
      {/* <Portfolio /> */}
      {/* <NeuPricing heading="Tailored SEO Packages for Growth" pricingOptions={pricingOptions} /> */}
      <BasicFAQ
        heading="Frequently Asked Questions Seo"
        questions={faqQuestions}
      />
    </div>
  );
}

export default SeoMarketingPage;
