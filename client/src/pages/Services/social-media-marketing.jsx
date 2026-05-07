import React from "react";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import WebDevelopmentSolutions from "../../components/ServicesComponents/webSolution";
import WebSteps from "../../components/ServicesComponents/webSteps";
// import { NeuPricing } from "../../components/ServicesComponents/pricing";
import BasicFAQ from "../../components/ServicesComponents/faq";

function SocialMediaMarketingPage() {
  const descriptions = [
    "We craft tailored social media strategies to boost your brand presence, engage your audience, and drive real growth. Our approach ensures your messaging is consistent, impactful, and aligned with your business goals across every platform.",
    "Navigating social media doesn’t have to be complex. Our team simplifies the process, helping you connect with the right audience, increase interaction, and achieve measurable success.",
    "Our experts craft engaging, high-quality content that aligns with your brand identity, ensuring your message resonates with your target audience and drives meaningful interactions.",
  ];
  const features = [
    {
      id: 1,
      callout: "Strategy",
      title: "Set the Stage for Success: Define Your Goals and Audience",
      description:
        "Understanding your business, goals, and audience is the foundation of a successful strategy. We start with data-driven research, selecting the best platforms and KPIs to craft a personalized roadmap. Our approach ensures your brand stays ahead of the curve, relevant, and engaging.",
      contentPosition: "r",
      image: "/sm1.jpg",
    },
    {
      id: 2,
      callout: "Content Creation",
      title: "Create Content That Captivates",
      description:
        "Content is at the heart of social media success. We design eye-catching visuals, write compelling captions, and produce engaging videos that speak directly to your audience. Consistency in brand identity and storytelling ensures your message resonates and sparks conversations.",
      contentPosition: "l",
      image: "/sm3.jpg",
    },
    {
      id: 3,
      callout: "Advertising",
      title: "Running Targeted Ad Campaigns",
      description:
        "We create and manage highly targeted ad campaigns to maximize reach and conversions. Whether it’s Facebook Ads, Instagram promotions, LinkedIn ads, or TikTok marketing, we optimize budgets and strategies for the best return on investment (ROI).",
      contentPosition: "r",
      image: "/sm4.jpg",
    },
    {
      id: 4,
      callout: "Community Management",
      title: "Building Brand Loyalty",
      description:
        "Engagement is key to social media success. We actively respond to comments, messages, and mentions to foster relationships, improve customer satisfaction, and enhance brand credibility in your industry.",
      contentPosition: "l",
      image: "/sm5.jpg",
    },
    {
      id: 5,
      callout: "Analytics & Optimization",
      title: "Measuring and Improving Performance",
      description:
        "We track engagement, reach, and conversions using advanced analytics tools. Regular reports help refine strategies, optimize ad spend, and ensure your social media efforts generate real business results.",
      contentPosition: "r",
      image: "/sm6.jpg",
    },
  ];

  // const pricingOptions = [
  //   {
  //     title: "Starter",
  //     price: "2000",
  //     statement: "For small businesses looking to build a social presence.",
  //     items: [
  //       { children: "Profile Setup & Optimization", checked: true },
  //       { children: "Content Strategy & Planning", checked: true },
  //       { children: "8 Posts per Month", checked: true },
  //       { children: "1 Video per Month", checked: true },
  //       { children: "Basic Analytics & Reporting", checked: true },
  //       { children: "Ad Campaign Management", checked: false },
  //     ],
  //   },
  //   {
  //     title: "Growth",
  //     price: "3500",
  //     statement: "For brands aiming to increase engagement and reach.",
  //     highlight: true,
  //     items: [
  //       { children: "Profile Setup & Branding", checked: true },
  //       { children: "Content Calendar & Scheduling", checked: true },
  //       { children: "12 Posts per Month", checked: true },
  //       { children: "4 Videos per Month", checked: true },
  //       { children: "Engagement & Community Management", checked: true },
  //       { children: "Basic Paid Ad Strategy", checked: true },
  //     ],
  //   },
  //   {
  //     title: "Elite",
  //     price: "6000",
  //     statement: "For businesses looking for high-impact social marketing.",
  //     items: [
  //       { children: "Custom Strategy & Consultation", checked: true },
  //       { children: "Advanced Content Creation", checked: true },
  //       { children: "20+ Posts per Month", checked: true },
  //       { children: "8 Videos per Month", checked: true },
  //       { children: "Influencer Collaborations", checked: true },
  //       { children: "Targeted Paid Ad Campaigns", checked: true },
  //     ],
  //   },
  // ];
  const faqQuestions = [
    {
      title: "Will my social media strategy be customized?",
      content:
        "Yes! We tailor every social media strategy to align with your business goals, target audience, and industry trends for maximum impact.",
      defaultOpen: true,
    },
    {
      title: "How often will you post on my social media accounts?",
      content:
        "Posting frequency depends on the package you choose. We offer plans with 8, 12, or 20+ posts per month, including videos and stories.",
    },
    {
      title: "Do you create content or use existing materials?",
      content:
        "We create fresh, engaging content based on your brand's needs. However, if you have specific materials you'd like to use, we can incorporate them.",
    },
    {
      title: "Can you run paid ad campaigns on social media?",
      content:
        "Absolutely! We specialize in targeted social media ad campaigns to increase reach, engagement, and conversions across various platforms.",
    },
    {
      title: "Which social media platforms do you manage?",
      content:
        "We manage Facebook, Instagram, LinkedIn, Twitter, TikTok, and YouTube. We help you choose the best platforms for your business.",
    },
    {
      title: "How do you track the success of social media campaigns?",
      content:
        "We provide regular analytics reports, tracking key metrics like engagement, reach, clicks, and conversions to optimize strategy.",
    },
    {
      title: "Will I have control over my social media accounts?",
      content:
        "Yes! You retain full ownership of your accounts, and we collaborate with you to ensure all content aligns with your brand’s vision.",
    },
  ];
  return (
    <div>
      <ServiceBanner
        heading="📱 Social Media – More Than Pretty Posts & Hashtags"
        subHeading="Social isn’t just about aesthetics — it’s about attention. And we know how to get it."
        backgroundImage="/sm7.jpg"
        ctaText="Get Started"
        ctaLink="/contact-us"
        badgeText="HEY!"
        badgeLink="https://www.producthunt.com"
      />
      <WebDevelopmentSolutions
        image="/sm2.jpg"
        heading="Unlock the Power of Social Media for Your Brand"
        descriptions={descriptions}
      />
      <WebSteps features={features} />
      {/* <Portfolio /> */}
      {/* <NeuPricing
        heading="Pricing Plans Social"
        pricingOptions={pricingOptions}
      /> */}
      <BasicFAQ heading="Frequently Asked Social" questions={faqQuestions} />
    </div>
  );
}

export default SocialMediaMarketingPage;
