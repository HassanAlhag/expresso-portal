import React from "react";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import WebDevelopmentSolutions from "../../components/ServicesComponents/webSolution";
import WebSteps from "../../components/ServicesComponents/webSteps";
// import { NeuPricing } from "../../components/ServicesComponents/pricing";
import BasicFAQ from "../../components/ServicesComponents/faq";

function GoogleAdsPage() {
  const descriptions = [
    "We provide expert Google Ads management to help businesses generate high-quality leads, boost conversions, and maximize ROI. Whether you need search, display, or remarketing ads, we create data-driven campaigns.",
    "Running successful Google Ads can be challenging for many. That’s why we are here to optimize your campaigns, ensuring that you reach the right audience and get the best return on investment.",
    "Our team delivers targeted, cost-effective advertising strategies tailored to your business goals, driving traffic, increasing engagement, and ensuring consistent growth through optimized campaigns.",
  ];
  const features = [
    {
      id: 1,
      callout: "Planning Google",
      title: "Setting Goals and Strategy",
      description:
        "In this stage, our experts analyze your business, industry, and competition to set clear advertising goals. We define target audiences, budget allocation, and ad formats to ensure a data-driven strategy that maximizes conversions and ROI.",
      contentPosition: "r",
      image: "/73.jpg",
    },
    {
      id: 2,
      callout: "Ad Creation",
      title: "Crafting High-Impact Ads",
      description:
        "Our team creates compelling ad copy, engaging visuals, and strategic placements tailored for Google Ads. From search ads to display and video campaigns, we ensure your ads attract attention and drive qualified traffic to your website.",
      contentPosition: "l",
      image: "/74.jpg",
    },
    {
      id: 3,
      callout: "Campaign Setup",
      title: "Building Optimized Campaigns",
      description:
        "Once the ads are created, we set up and structure campaigns, ad groups, and targeting parameters. This includes keyword research, bid strategy, audience segmentation, and A/B testing to maximize efficiency and ad performance.",
      contentPosition: "r",
      image: "/83.jpeg",
    },
    {
      id: 4,
      callout: "Performance Tracking",
      title: "Monitoring and Optimization",
      description:
        "We continuously track ad performance, analyzing key metrics like click-through rate, conversions, and cost per acquisition. This allows us to refine targeting, adjust bids, and optimize your campaign for the best possible results.",
      contentPosition: "l",
      image: "/76.jpeg",
    },
    {
      id: 5,
      callout: "Scaling Results",
      title: "Expanding Winning Strategies",
      description:
        "After identifying top-performing ads and audiences, we scale the campaign by reallocating budget to maximize returns. Our approach ensures sustainable growth while keeping costs in check and improving overall ad efficiency.",
      contentPosition: "r",
      image: "/77.jpg",
    },
    {
      id: 6,
      callout: "Ongoing Support",
      title: "Continuous Analysis & Growth",
      description:
        "Google Ads success requires ongoing adjustments. We provide monthly reports, strategic insights, and continuous optimizations to ensure long-term success, increased ROI, and alignment with your business objectives.",
      contentPosition: "l",
      image: "/86.jpg",
    },
  ];
  // const pricingOptions = [
  //   {
  //     title: "Starter",
  //     price: "2000",
  //     statement: "For businesses looking to establish their presence.",
  //     items: [
  //       { children: "Google Search Ads Setup", checked: true },
  //       { children: "Keyword Research & Targeting", checked: true },
  //       { children: "Ad Copywriting & Optimization", checked: true },
  //       { children: "Campaign Performance Tracking", checked: false },
  //     ],
  //   },
  //   {
  //     title: "Growth",
  //     price: "3500",
  //     statement: "For brands aiming to scale efficiently online.",
  //     highlight: true,
  //     items: [
  //       { children: "Search & Display Ads Setup", checked: true },
  //       { children: "Custom Audience Targeting", checked: true },
  //       { children: "A/B Testing for Ads", checked: true },
  //       { children: "Monthly Performance Reports", checked: true },
  //     ],
  //   },
  //   {
  //     title: "Elite",
  //     price: "6000",
  //     statement: "For enterprises looking for high ROI strategies.",
  //     items: [
  //       { children: "Full-Funnel Google Ads Strategy", checked: true },
  //       { children: "Conversion Rate Optimization", checked: true },
  //       { children: "Advanced Retargeting Campaigns", checked: true },
  //       { children: "Dedicated Account Manager", checked: true },
  //     ],
  //   },
  // ];
  const faqQuestions = [
    {
      title: "How does Google Ads help my business?",
      content:
        "Google Ads helps businesses gain immediate visibility on search engines, drive targeted traffic, and increase conversions through paid advertising campaigns.",
      defaultOpen: true,
    },
    {
      title: "What types of Google Ads campaigns do you manage?",
      content:
        "We manage Google Search Ads, Display Ads, Shopping Ads, Video Ads (YouTube), and Retargeting campaigns to maximize your online reach and conversions.",
    },
    {
      title: "How do you determine the right keywords for my ads?",
      content:
        "We conduct in-depth keyword research, analyzing search trends, competition, and user intent to ensure your ads target the most effective keywords.",
    },
    {
      title: "How do you track and optimize ad performance?",
      content:
        "We monitor key performance indicators like CTR, CPC, and conversions, continuously optimizing bids, ad copy, and audience targeting to maximize ROI.",
    },
    {
      title: "What budget should I allocate for Google Ads?",
      content:
        "Your budget depends on industry competition and goals. We help you set a cost-effective budget and allocate spend for the best possible results.",
    },
    {
      title: "Do you offer remarketing campaigns?",
      content:
        "Yes, we create remarketing campaigns that re-engage past website visitors with tailored ads to increase conversions and customer retention.",
    },
  ];
  return (
    <div>
      <ServiceBanner
        heading="💸 Performance Marketing – Ads With Real ROI"
        subHeading="No guesswork. No wasted budget. Just data-driven campaigns that drive results."
        backgroundImage="/84.jpg"
        ctaText="Get Started"
        ctaLink="/contact-us"
        badgeText="HEY!"
        badgeLink="https://www.producthunt.com"
      />
      <WebDevelopmentSolutions
        image="/72.jpg"
        heading="Google Ads Strategies That Drive Success"
        descriptions={descriptions}
      />
      <WebSteps features={features} />
      {/* <Portfolio /> */}
      {/* <NeuPricing
        heading="Pricing Plans Google"
        pricingOptions={pricingOptions}
      /> */}
      <BasicFAQ
        heading="Frequently Asked Questions Google"
        questions={faqQuestions}
      />
    </div>
  );
}

export default GoogleAdsPage;
