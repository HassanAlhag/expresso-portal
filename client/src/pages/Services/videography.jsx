import React from "react";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import WebDevelopmentSolutions from "../../components/ServicesComponents/webSolution";
import WebSteps from "../../components/ServicesComponents/webSteps";
// import { NeuPricing } from "../../components/ServicesComponents/pricing";
import BasicFAQ from "../../components/ServicesComponents/faq";

function VideographyPage() {
  const descriptions = [
    "We offer custom website development services to create responsive, fast, and user-friendly websites tailored to your business needs. Whether you need an e-commerce platform, portfolio site, or a corporate web presence, we deliver scalable and innovative solutions.",
    "Creating a website from scratch can be overwhelming for many. However, we are here to support you and ensure that your business and customers do not suffer due to the lack of a website.",
    "Our team will provide a professional, creative, and engaging design tailored to the specific needs of your business.",
  ];
  const features = [
    {
      id: 1,
      callout: "Planning Video",
      title: "Defining Goals and Structure",
      description:
        "During this stage, our website development team collaborates with the client to establish the website's goals and objectives, pinpoint the intended audience, and determine the crucial features and functionality, necessary to achieve these goals. Additionally, this stage involves defining the website's structure, content, technology and tools required to build the site.",
      contentPosition: "r",
      image: "/web-plan.jpg",
    },
    {
      id: 2,
      callout: "Design",
      title: "Creating a Visual Concept",
      description:
        "After the planning stage, the website development team proceeds to create a design concept for the website, encompassing elements such as layout, color scheme, typography, and other visual elements. Typically, this stage entails multiple rounds of revisions and feedback from the client to guarantee that the design aligns with their expectations.",
      contentPosition: "l",
      image: "/web-banner.jpg",
    },
    {
      id: 3,
      callout: "Development",
      title: "Building the Website",
      description:
        "After the design is approved, the website development team begins coding the site, using the chosen technology and tools to create the website's structure, functionality, and content. This stage may also include integrating third-party tools and services, such as payment gateways or social media platforms, and optimizing the site for search engines and accessibility.",
      contentPosition: "r",
      image: "/image2.png",
    },
    {
      id: 4,
      callout: "Testing",
      title: "Ensuring Quality and Functionality",
      description:
        "Once the development stage is complete, the website undergoes rigorous testing to ensure that it functions as intended and meets the client's specifications. This testing may include functional testing, usability testing, and security testing, among other types of testing.",
      contentPosition: "l",
      image: "/web-plan.jpg",
    },
    {
      id: 5,
      callout: "Launch",
      title: "Deploying the Website",
      description:
        "After the testing stage is complete, the website is launched, and made live on the internet. This stage involves deploying the site to a web server, configuring the necessary settings, and performing final checks to ensure that everything is functioning correctly.",
      contentPosition: "r",
      image: "/web-banner.jpg",
    },
    {
      id: 6,
      callout: "Maintenance",
      title: "Ongoing Support and Updates",
      description:
        "Once the site is live, ongoing maintenance is necessary to ensure that it continues to function correctly and meets the client's needs. This may include updating software and plugins, monitoring site performance, and addressing any issues or bugs that arise over time.",
      contentPosition: "l",
      image: "/image2.png",
    },
  ];
  // const pricingOptions = [
  //   {
  //     title: "Basic",
  //     price: "2000",
  //     statement: "For individuals looking to up their productivity gains.",
  //     items: [
  //       { children: "5 Pages Video", checked: true },
  //       { children: "Responsive Design", checked: true },
  //       { children: "Basic SEO Setup", checked: true },
  //       { children: "E-commerce Functionality", checked: false },
  //     ],
  //   },
  //   {
  //     title: "Premium",
  //     price: "3500",
  //     statement: "For teams looking to scale efficiently.",
  //     highlight: true,
  //     items: [
  //       { children: "10 Pages Website", checked: true },
  //       { children: "Fully Responsive Design", checked: true },
  //       { children: "Standard SEO Optimization", checked: true },
  //       { children: "E-commerce Functionality", checked: true },
  //     ],
  //   },
  //   {
  //     title: "Advanced",
  //     price: "6000",
  //     statement: "For enterprises looking to scale.",
  //     items: [
  //       { children: "20 Pages Website", checked: true },
  //       { children: "Fully Custom Responsive Design", checked: true },
  //       { children: "Advanced SEO Services", checked: true },
  //       { children: "Full E-commerce Functionality", checked: true },
  //     ],
  //   },
  // ];
  const faqQuestions = [
    {
      title: "Will my website be mobile-video?",
      content:
        "Absolutely. All websites we develop are fully responsive and optimized for mobile, tablet, and desktop devices.",
      defaultOpen: true,
    },
    {
      title: "What technologies do you use?",
      content:
        "It depends on the package you select. We have experts in React, Node.js, Angular, WordPress, Shopify, and other modern frameworks to meet your business needs.",
    },
    // Additional questions...
  ];
  return (
    <div>
      <ServiceBanner
        heading="Launch your business with a cutting-edge Videography"
        subHeading="Empowering businesses with innovative web development solutions that drive growth and enhance user experiences. Simple, effective, and tailored to your needs."
        backgroundImage="/web-banner.jpg"
        ctaText="Get Started"
        ctaLink="/contact-us"
        badgeText="HEY!"
        badgeLink="https://www.producthunt.com"
      />
      <WebDevelopmentSolutions
        image="/image3.jpg"
        heading="Solutions Any Business Can Benefit From"
        descriptions={descriptions}
      />
      <WebSteps features={features} />
      {/* <Portfolio /> */}
      {/* <NeuPricing heading="Pricing Plans Video" pricingOptions={pricingOptions} /> */}
      <BasicFAQ heading="Frequently Asked Questions Video" questions={faqQuestions} />
    </div>
  );
}

export default VideographyPage;
