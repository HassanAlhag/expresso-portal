function normalizeImagePath(path) {
  if (!path || typeof path !== "string") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function labelFromPath(path) {
  const normalized = normalizeImagePath(path);
  const file = normalized.split("/").filter(Boolean).pop() || normalized;
  return file
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function image(path, label) {
  const defaultUrl = normalizeImagePath(path);
  return {
    key: defaultUrl,
    label: label || labelFromPath(defaultUrl),
    defaultUrl,
  };
}

function component(key, label, file, images = []) {
  return {
    key,
    label,
    file,
    images: images.map((entry) =>
      typeof entry === "string" ? image(entry) : image(entry.path, entry.label)
    ),
  };
}

function page(key, label, route, file, components = []) {
  return {
    key,
    label,
    route,
    file,
    components,
  };
}

const IT_SOLUTION_HERO_IMAGES = [
  "/it-solutions/software-licensing.webp",
  "/it-solutions/erp-solution.webp",
  "/it-solutions/crm-solution.webp",
  "/it-solutions/queue-management.webp",
  "/it-solutions/iot-solutions.webp",
  "/it-solutions/vas-solutions.webp",
  "/it-solutions/cloud-services.webp",
  "/it-solutions/web-hosting-domains.webp",
  "/it-solutions/data-center.webp",
  "/it-solutions/it-consultation.webp",
  "/it-solutions/networking-hardware.webp",
  "/it-solutions/data-center-hardware.webp",
];

const PORTFOLIO_CARD_IMAGES = [
  "/pat-thumb.jpg",
  "/odeur.jpg",
  "/godfel.jpeg",
  "/ultimate.png",
  "/odeur.png",
  "/baytward.png",
];

const PORTFOLIO_SOLUTION_IMAGES = [
  "/pat-gallery1.png",
  "/odeur1.jpeg",
  "/godfel1.png",
  "/ulti7.png",
  "/odeur1.jpeg",
  "/baytu7.png",
];

const PORTFOLIO_GALLERY_IMAGES = [
  "/pat5.png",
  "/pat6.png",
  "/pat7.png",
  "/pat-gallery1.png",
  "/pat-gallery2.jpeg",
  "/pat8.png",
  "/odeur1.jpeg",
  "/odeur2.jpeg",
  "/odeur3.jpeg",
  "/odeur4.jpeg",
  "/odeur-cart.png",
  "/odeur-create.png",
  "/godfel1.png",
  "/godfel2.png",
  "/godfel3.png",
  "/godfel4.png",
  "/godfel-logo.png",
  "/godfel5.png",
  "/ulti1.png",
  "/ulti2.png",
  "/ulti4.png",
  "/ulti6.png",
  "/ulti4.png",
  "/ulti3.png",
  "/odu1.png",
  "/odu2.png",
  "/odu6.png",
  "/odu3.png",
  "/odu4.png",
  "/odu5.png",
  "/baytu1.png",
  "/baytu2.png",
  "/baytu6.png",
  "/baytu3.png",
  "/baytu4.png",
  "/baytu5.png",
];

const SERVICES_SECTION_BG =
  "https://demo.casethemes.net/saira/wp-content/uploads/2023/09/u-bg6.jpg";

export const WEBSITE_PAGE_IMAGE_REGISTRY = [
  page("home", "Home", "/", "client/src/pages/Home/home.jsx", [
    component(
      "textParallax",
      "TextParallaxContentExample",
      "client/src/components/TextParallax/textParallaxComponent.jsx",
      ["/home2.jpg", "/home4.jpg"]
    ),
    component(
      "servicesSection",
      "ServicesSection",
      "client/src/components/ServicesSection/ServicesSection.jsx",
      ["/home2.jpg", "/logo.png"]
    ),
    component(
      "shuffleSection",
      "ShuffleSection",
      "client/src/components/ShuffleSection/shuffleSection.jsx",
      [
        "/ultimate1.png",
        "/odeur1.png",
        "/expresso1.png",
        "/ayur1.png",
        "/mih1.png",
        "/floraison1.png",
        "/smile1.png",
        "/angelic1.png",
      ]
    ),
    component(
      "stackedTestimonials",
      "StackedCardTestimonials",
      "client/src/components/TestimonialSection/testimonialSection.jsx",
      [
        "/godfel-logo.png",
        "/pat-logo.png",
        "/floraison-logo.png",
        "/mih-logo.png",
        "/alb-logo.png",
        "/aroma-logo.png",
        "/logo.png",
      ]
    ),
    component(
      "dragCards",
      "DragCards",
      "client/src/components/DragCardSection/dragCardSection.jsx",
      [
        "/logo.png",
        "/gal3.png",
        "/gal1.png",
        "/afrid.PNG",
        "/gal2.png",
        "/gal4.png",
        "/ultimate1.png",
        "/odeur1.png",
        "/mih1.png",
      ]
    ),
    component(
      "finalCta",
      "FinalCTASection",
      "client/src/components/FinalCTASection/FinalCTASection.jsx",
      ["/logo.png"]
    ),
  ]),

  page("aboutUs", "About Us", "/about-us", "client/src/pages/AboutUs/aboutUs.jsx", [
    component(
      "auroraHero",
      "AuroraHero",
      "client/src/components/BannerSection/bannerSection.jsx",
      ["/81.webp"]
    ),
    component(
      "aboutUsSection",
      "AboutUsSection",
      "client/src/components/AboutUsSection/aboutUsSection.jsx",
      ["/about.webp"]
    ),
    component(
      "aboutWebSection",
      "AboutWebSection",
      "client/src/components/AboutWebSection/aboutWebSection.jsx",
      ["/business.webp", "/iphone.webp"]
    ),
    component(
      "sectionHeader",
      "SectionHeader",
      "client/src/components/SectionHeader/SectionHeader.jsx",
      []
    ),
    component(
      "webDevelopmentProcess",
      "WebDevelopmentProcess",
      "client/src/components/WebDevolopmentProcess/webDevelopmentProcess.jsx",
      ["/professional.webp", "/designer.webp", "/developing.webp"]
    ),
    component(
      "disappearingFeatures",
      "DisappearingFeatures",
      "client/src/components/CaseStudySection/caseStudySection.jsx",
      [
        "/manager.webp",
        "/hassan.webp",
        "/swekshya.webp",
        "/11.webp",
        "/gal2.webp",
        "/saad.webp",
        "/10.webp",
      ]
    ),
    component(
      "drawCircleText",
      "DrawCircleText",
      "client/src/components/CircleText/circleText.jsx",
      []
    ),
  ]),

  page("servicesMain", "Services Main", "/services", "client/src/pages/ServiceMain/serviceMain.jsx", [
    component(
      "serviceBanner",
      "ServiceBanner",
      "client/src/components/ServicesBanner/servicesBanner.jsx",
      ["https://demo.themenio.com/genox/images/banner-c2.jpg"]
    ),
    component(
      "revealCards",
      "RevealCards",
      "client/src/components/OurServiceSection/ourServiceSection.jsx",
      ["/88.jpg", "/87.jpg", "/85.jpg", "/86.jpg"]
    ),
    component(
      "webDevelopmentProcess",
      "WebDevelopmentProcess",
      "client/src/components/WebDevolopmentProcess/webDevelopmentProcess.jsx",
      ["/creative.jpg", "/ideas.jpg", "/responsive.jpg"]
    ),
    component(
      "scrollingLogos",
      "ScrollingLogos",
      "client/src/components/ScrollingLogos/ScrollingLogos.jsx",
      [
        "/godfel-logo.png",
        "/floraison-logo.png",
        "/alpha-logo.png",
        "/baytwaard-logo.png",
        "/aroma-logo.png",
        "/mih-logo.png",
      ]
    ),
    component(
      "stackedTestimonials",
      "StackedCardTestimonials",
      "client/src/components/TestimonialSection/testimonialSection.jsx",
      [
        "/godfel-logo.png",
        "/pat-logo.png",
        "/floraison-logo.png",
        "/mih-logo.png",
        "/alb-logo.png",
        "/aroma-logo.png",
        "/logo.png",
      ]
    ),
  ]),

  page(
    "websiteDevelopment",
    "Website Development",
    "/service/web-dev",
    "client/src/pages/Services/webiste-dev.jsx",
    [
      component(
        "serviceBanner",
        "ServiceBanner",
        "client/src/components/ServicesBanner/servicesBanner.jsx",
        ["/web8.jpg"]
      ),
      component(
        "editorialSection",
        "Editorial Section",
        "client/src/pages/Services/webiste-dev.jsx",
        ["/web6.png"]
      ),
      component(
        "processTimeline",
        "Process Timeline",
        "client/src/pages/Services/webiste-dev.jsx",
        ["/web2.png", "/web5.png", "/web1.png", "/web3.png", "/web4.png", "/web7.png"]
      ),
    ]
  ),

  page(
    "socialMediaMarketing",
    "Social Media Marketing",
    "/service/social-media-marketing",
    "client/src/pages/Services/social-media-marketing.jsx",
    [
      component(
        "serviceBanner",
        "ServiceBanner",
        "client/src/components/ServicesBanner/servicesBanner.jsx",
        ["/sm7.jpg"]
      ),
      component(
        "webDevelopmentSolutions",
        "WebDevelopmentSolutions",
        "client/src/components/ServicesComponents/webSolution.jsx",
        ["/sm2.jpg", SERVICES_SECTION_BG]
      ),
      component(
        "webSteps",
        "WebSteps",
        "client/src/components/ServicesComponents/webSteps.jsx",
        ["/sm1.jpg", "/sm3.jpg", "/sm4.jpg", "/sm5.jpg", "/sm6.jpg"]
      ),
    ]
  ),

  page("seoMarketing", "SEO Marketing", "/service/seo-marketing", "client/src/pages/Services/seo-marketing.jsx", [
    component(
      "serviceBanner",
      "ServiceBanner",
      "client/src/components/ServicesBanner/servicesBanner.jsx",
      ["/seo7.jpg"]
    ),
    component(
      "webDevelopmentSolutions",
      "WebDevelopmentSolutions",
      "client/src/components/ServicesComponents/webSolution.jsx",
      ["/seo4.jpg", SERVICES_SECTION_BG]
    ),
    component("webSteps", "WebSteps", "client/src/components/ServicesComponents/webSteps.jsx", [
      "/seo1.jpg",
      "/seo2.jpg",
      "/seo3.jpg",
      "/seo5.jpg",
      "/seo6.jpg",
    ]),
  ]),

  page("googleAds", "Google Ads", "/service/google-ads", "client/src/pages/Services/google-ads.jsx", [
    component(
      "serviceBanner",
      "ServiceBanner",
      "client/src/components/ServicesBanner/servicesBanner.jsx",
      ["/84.jpg"]
    ),
    component(
      "webDevelopmentSolutions",
      "WebDevelopmentSolutions",
      "client/src/components/ServicesComponents/webSolution.jsx",
      ["/72.jpg", SERVICES_SECTION_BG]
    ),
    component("webSteps", "WebSteps", "client/src/components/ServicesComponents/webSteps.jsx", [
      "/73.jpg",
      "/74.jpg",
      "/83.jpeg",
      "/76.jpeg",
      "/77.jpg",
      "/86.jpg",
    ]),
  ]),

  page("videography", "Videography", "/service/videography", "client/src/pages/Services/videography.jsx", [
    component(
      "serviceBanner",
      "ServiceBanner",
      "client/src/components/ServicesBanner/servicesBanner.jsx",
      ["/web-banner.jpg"]
    ),
    component(
      "webDevelopmentSolutions",
      "WebDevelopmentSolutions",
      "client/src/components/ServicesComponents/webSolution.jsx",
      ["/image3.jpg", SERVICES_SECTION_BG]
    ),
    component("webSteps", "WebSteps", "client/src/components/ServicesComponents/webSteps.jsx", [
      "/web-plan.jpg",
      "/web-banner.jpg",
      "/image2.png",
      "/web-plan.jpg",
      "/web-banner.jpg",
      "/image2.png",
    ]),
  ]),

  page(
    "contentCreation",
    "Content Creation",
    "/service/content-creation",
    "client/src/pages/Services/content-creation.jsx",
    [
      component(
        "serviceBanner",
        "ServiceBanner",
        "client/src/components/ServicesBanner/servicesBanner.jsx",
        ["/web-banner.jpg"]
      ),
      component(
        "webDevelopmentSolutions",
        "WebDevelopmentSolutions",
        "client/src/components/ServicesComponents/webSolution.jsx",
        ["/image3.jpg", SERVICES_SECTION_BG]
      ),
      component("webSteps", "WebSteps", "client/src/components/ServicesComponents/webSteps.jsx", [
        "/web-plan.jpg",
        "/web-banner.jpg",
        "/image2.png",
        "/web-plan.jpg",
        "/web-banner.jpg",
        "/image2.png",
      ]),
    ]
  ),

  page("portfolio", "Portfolio", "/our-portfolio", "client/src/pages/Portfolio/portfolio.jsx", [
    component(
      "serviceBanner",
      "ServiceBanner",
      "client/src/components/ServicesBanner/servicesBanner.jsx",
      ["/80.jpg"]
    ),
    component(
      "portfolioGrid",
      "PortfolioGrid Cards",
      "client/src/components/PortfolioComponents/portfolioList.jsx",
      PORTFOLIO_CARD_IMAGES
    ),
    component(
      "creativePostsShowcase",
      "CreativePostsShowcase",
      "client/src/components/CreativePostsShowcase/CreativePostsShowcase.jsx",
      ["/creatives/posts/post1.jpg"]
    ),
  ]),

  page(
    "portfolioDetail",
    "Portfolio Details",
    "/portfolio/detail/:id",
    "client/src/pages/SingleViewPortfolio/singleViewPortfolio.jsx",
    [
      component(
        "serviceBanner",
        "ServiceBanner",
        "client/src/components/ServicesBanner/servicesBanner.jsx",
        PORTFOLIO_CARD_IMAGES
      ),
      component(
        "portfolioCaseStudy",
        "PortfolioCaseStudy",
        "client/src/components/PortfolioComponents/portfolioSolutionSection.jsx",
        PORTFOLIO_SOLUTION_IMAGES
      ),
      component(
        "portfolioGallery",
        "PortfolioGallerySection",
        "client/src/components/PortfolioComponents/portfolioGallerySection.jsx",
        PORTFOLIO_GALLERY_IMAGES
      ),
    ]
  ),

  page("contact", "Contact", "/contact-us", "client/src/pages/Contact/contactPage.jsx", [
    component(
      "serviceBanner",
      "ServiceBanner",
      "client/src/components/ServicesBanner/servicesBanner.jsx",
      ["/contact-bg.jpg"]
    ),
  ]),

  page("careers", "Careers", "/careers", "client/src/pages/Career/CareerPage.jsx", [
    component(
      "auroraHero",
      "AuroraHero",
      "client/src/components/BannerSection/bannerSection.jsx",
      ["/81.webp"]
    ),
  ]),

  page("itSolutions", "IT Solutions", "/it-solutions", "client/src/pages/ITSolutions/ITSolutionsPage.jsx", [
    component(
      "auroraHero",
      "AuroraHero",
      "client/src/components/BannerSection/bannerSection.jsx",
      ["/81.webp"]
    ),
  ]),

  page(
    "itSolutionDetails",
    "IT Solution Details",
    "/it-solutions/:slug",
    "client/src/pages/ITSolutions/ITSolutionDetailsPage.jsx",
    [
      component(
        "auroraHero",
        "AuroraHero",
        "client/src/components/BannerSection/bannerSection.jsx",
        IT_SOLUTION_HERO_IMAGES
      ),
    ]
  ),

  page("planBuilder", "Plan Builder", "/build-your-plan", "client/src/pages/PlanBuilder/planBuilderPage.jsx", [
    component(
      "auroraHero",
      "AuroraHero",
      "client/src/components/BannerSection/bannerSection.jsx",
      ["/81.webp"]
    ),
  ]),

  page("webPricing", "Web Pricing", "/pricing/web-dev", "client/src/pages/Pricing/webPricingPage.jsx", [
    component(
      "serviceBanner",
      "ServiceBanner",
      "client/src/components/ServicesBanner/servicesBanner.jsx",
      ["/web-banner.jpg"]
    ),
  ]),

  page("seoPricing", "SEO Pricing", "/pricing/seo", "client/src/pages/Pricing/seoPricingPage.jsx", [
    component(
      "serviceBanner",
      "ServiceBanner",
      "client/src/components/ServicesBanner/servicesBanner.jsx",
      ["/83.jpeg"]
    ),
  ]),

  page(
    "googleAdsPricing",
    "Google Ads Pricing",
    "/pricing/google-ads",
    "client/src/pages/Pricing/googleAdsPage.jsx",
    [
      component(
        "serviceBanner",
        "ServiceBanner",
        "client/src/components/ServicesBanner/servicesBanner.jsx",
        ["/84.jpg"]
      ),
    ]
  ),

  page(
    "socialMediaPricing",
    "Social Media Pricing",
    "/pricing/social-media",
    "client/src/pages/Pricing/socialMediaMarketingPage.jsx",
    [
      component(
        "serviceBanner",
        "ServiceBanner",
        "client/src/components/ServicesBanner/servicesBanner.jsx",
        ["/82.jpg"]
      ),
    ]
  ),

  page(
    "marketingSolutions",
    "Marketing Solutions",
    "/marketing-solutions",
    "client/src/pages/WebMarketing/webMarketing.jsx",
    [
      component(
        "landingHero",
        "LandingHero",
        "client/src/components/LandingHero/LandingHero.jsx",
        ["/landinghero.jpg", "/white-logo.png"]
      ),
      component(
        "aboutUsSectionForAd",
        "AboutUsSectionForAd",
        "client/src/components/About-Us-Section/aboutUsSectionGoogle.jsx",
        ["/aboutforppc.png"]
      ),
      component("recentWork", "RecentWork", "client/src/components/RecentWork/RecentWork.jsx", [
        "/pat-thumb.jpg",
        "/pat-gallery1.png",
        "/pat5.png",
        "/pat6.png",
        "/godfel.jpeg",
        "/godfel.png",
        "/godfel2.png",
        "/odeur.jpg",
        "/odeur1.jpeg",
        "/odeur2.jpeg",
        "/odeur3.jpeg",
      ]),
      component(
        "uniqueServices",
        "UniqueServices",
        "client/src/components/UniqueServices/UniqueServices.jsx",
        ["/youtube.jpg"]
      ),
      component("testimonials", "Testimonials", "client/src/components/Testimonials/Testimonials.jsx", [
        "/avatar1.png",
        "/avatar6.png",
        "/avatar3.png",
        "/avatar4.png",
        "/avatar5.png",
      ]),
    ]
  ),

  page("thankYou", "Thank You", "/greetings", "client/src/pages/ThankYou/ThankYouPage.jsx", [
    component("logo", "Logo", "client/src/pages/ThankYou/ThankYouPage.jsx", ["/logo.png"]),
  ]),

  page(
    "productions",
    "Productions",
    "/productions",
    "client/src/features/productions/pages/ProductionsPage.jsx",
    [
      component(
        "apiMediaCards",
        "Production Cards",
        "client/src/features/productions/pages/ProductionsPage.jsx",
        []
      ),
    ]
  ),

  page(
    "productionDetails",
    "Production Details",
    "/productions/:slug",
    "client/src/features/productions/pages/ProductionDetailsPage.jsx",
    [
      component(
        "apiMediaGallery",
        "Production Gallery",
        "client/src/features/productions/pages/ProductionDetailsPage.jsx",
        []
      ),
    ]
  ),

  page(
    "vendorRegistration",
    "Vendor Registration",
    "/vendor-registration",
    "client/src/pages/VendorRegistration/VendorRegistrationPage.jsx",
    [
      component(
        "formFlow",
        "Registration Form",
        "client/src/pages/VendorRegistration/VendorRegistrationPage.jsx",
        []
      ),
    ]
  ),

  page("notFound", "404 Page", "*", "client/src/pages/404Page/NotFoundPage.jsx", [
    component("illustration", "Inline Illustration", "client/src/pages/404Page/NotFoundPage.jsx", []),
  ]),

  page(
    "errorBoundary",
    "Error Boundary",
    "site wrapper",
    "client/src/pages/ErrorBoundary/errorBoundary.jsx",
    [
      component(
        "fallback",
        "Fallback UI",
        "client/src/pages/ErrorBoundary/errorBoundary.jsx",
        []
      ),
    ]
  ),
];

const LEGACY_WEBSITE_IMAGES = [
  "/logo.png",
  "/white-logo.png",
  "/home2.jpg",
  "/web-banner.jpg",
  "/creative.jpg",
  "/home4.jpg",
  "/business.webp",
  "/developing.webp",
  "/responsive.jpg",
  "/gal3.png",
  "/gal1.png",
  "/afrid.PNG",
  "/gal2.png",
  "/gal4.png",
  "/ultimate1.png",
  "/odeur1.png",
  "/mih1.png",
  "/expresso1.png",
  "/ayur1.png",
  "/floraison1.png",
  "/smile1.png",
  "/angelic1.png",
  "/godfel-logo.png",
  "/pat-logo.png",
  "/floraison-logo.png",
  "/mih-logo.png",
  "/alb-logo.png",
  "/aroma-logo.png",
  "/alpha-logo.png",
  "/baytwaard-logo.png",
  "/81.webp",
  "/about.webp",
  "/professional.webp",
  "/designer.webp",
  "/manager.webp",
  "/hassan.webp",
  "/swekshya.webp",
  "/11.webp",
  "/gal2.webp",
  "/saad.webp",
  "/10.webp",
  "/iphone.webp",
  "https://demo.themenio.com/genox/images/banner-c2.jpg",
  SERVICES_SECTION_BG,
  "/88.jpg",
  "/87.jpg",
  "/85.jpg",
  "/86.jpg",
  "/ideas.jpg",
  "/youtube.jpg",
  "/web8.jpg",
  "/web6.png",
  "/web1.png",
  "/web2.png",
  "/web3.png",
  "/web4.png",
  "/web5.png",
  "/web7.png",
  "/web-plan.jpg",
  "/image2.png",
  "/image3.jpg",
  "/sm1.jpg",
  "/sm2.jpg",
  "/sm3.jpg",
  "/sm4.jpg",
  "/sm5.jpg",
  "/sm6.jpg",
  "/sm7.jpg",
  "/seo1.jpg",
  "/seo2.jpg",
  "/seo3.jpg",
  "/seo4.jpg",
  "/seo5.jpg",
  "/seo6.jpg",
  "/seo7.jpg",
  "/72.jpg",
  "/73.jpg",
  "/74.jpg",
  "/76.jpeg",
  "/77.jpg",
  "/83.jpeg",
  "/84.jpg",
  "/80.jpg",
  "/contact-bg.jpg",
  "/pat-thumb.jpg",
  "/pat-gallery1.png",
  "/pat-gallery2.jpeg",
  "/pat5.png",
  "/pat6.png",
  "/pat7.png",
  "/pat8.png",
  "/pat.png",
  "/odeur.jpg",
  "/odeur.png",
  "/odeur1.jpeg",
  "/odeur2.jpeg",
  "/odeur3.jpeg",
  "/odeur4.jpeg",
  "/odeur-cart.png",
  "/odeur-create.png",
  "/godfel.jpeg",
  "/godfel1.png",
  "/godfel2.png",
  "/godfel3.png",
  "/godfel4.png",
  "/godfel5.png",
  "/ultimate.png",
  "/ulti1.png",
  "/ulti2.png",
  "/ulti3.png",
  "/ulti4.png",
  "/ulti6.png",
  "/ulti7.png",
  "/odu1.png",
  "/odu2.png",
  "/odu3.png",
  "/odu4.png",
  "/odu5.png",
  "/odu6.png",
  "/baytward.png",
  "/baytu1.png",
  "/baytu2.png",
  "/baytu3.png",
  "/baytu4.png",
  "/baytu5.png",
  "/baytu6.png",
  "/baytu7.png",
  "/creatives/posts/post1.jpg",
  "/82.jpg",
  "/landinghero.jpg",
  "/aboutforppc.png",
  "/godfel.png",
  "/avatar1.png",
  "/avatar3.png",
  "/avatar4.png",
  "/avatar5.png",
  "/avatar6.png",
];

function uniqueByKey(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (!entry?.key || seen.has(entry.key)) return false;
    seen.add(entry.key);
    return true;
  });
}

function uniquePaths(paths) {
  return uniqueByKey(
    paths.map((path) => {
      const defaultUrl = normalizeImagePath(path);
      return { key: defaultUrl, defaultUrl };
    })
  ).map((entry) => entry.defaultUrl);
}

const pageImageEntries = WEBSITE_PAGE_IMAGE_REGISTRY.flatMap((pageItem) =>
  pageItem.components.flatMap((componentItem) =>
    componentItem.images.map((imageItem) => ({
      ...imageItem,
      group: pageItem.label,
      pageKey: pageItem.key,
      pageLabel: pageItem.label,
      componentKey: componentItem.key,
      componentLabel: componentItem.label,
    }))
  )
);

const pageImageKeys = new Set(pageImageEntries.map((item) => item.key));

export const OTHER_WEBSITE_IMAGE_REGISTRY = uniquePaths(LEGACY_WEBSITE_IMAGES)
  .filter((path) => !pageImageKeys.has(path))
  .map((path) => ({
    key: path,
    group: "Other Website Images",
    label: labelFromPath(path),
    defaultUrl: path,
  }));

export const WEBSITE_IMAGE_REGISTRY = uniqueByKey([
  ...pageImageEntries,
  ...OTHER_WEBSITE_IMAGE_REGISTRY,
]);

export const WEBSITE_IMAGE_GROUPS = [
  "All",
  ...Array.from(new Set(WEBSITE_IMAGE_REGISTRY.map((item) => item.group))),
];

export { normalizeImagePath };
