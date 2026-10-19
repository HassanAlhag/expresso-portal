import "dotenv/config";
import { connectDB } from "../config/db.js";
import DigitalService from "../modules/web-content/digitalService.model.js";
import Solution from "../modules/web-content/solution.model.js";
import { assertSafeTarget } from "./_guard.js";

// ─── Digital Services ─────────────────────────────────────────────────────────

const SERVICES = [
  {
    order: 0,
    title: "Website & App Development",
    tag: "WEB",
    slug: "web-dev",
    description: "Fast, responsive websites and web apps built to convert — from landing pages to full-stack platforms.",
    imageUrl: "/web8.jpg",
    heroHeading: "🌐 Website & App Development – Digital That Delivers",
    heroSubheading: "Your website isn't just your digital home — it's your best salesperson.",
    heroImageUrl: "/web8.jpg",
    heroCtaText: "Get Started",
    heroCtaLink: "/contact-us",
    isActive: true,
    blocks: [
      {
        type: "intro",
        eyebrow: "WEBSITE DEVELOPMENT",
        title: "Built to impress —",
        highlight: "engineered to convert.",
        imageUrl: "/web6.png",
        descriptions: [
          "We build fast, responsive websites and apps that look premium and perform even better — tailored to your business goals.",
          "From strategy to launch, we handle everything (design, development, testing, deployment) so you can focus on growth while we deliver an experience your customers trust.",
        ],
        chips: ["Performance-first", "Responsive UI", "SEO-ready", "CMS optional"],
        ctaText: "Request a Proposal",
        ctaLink: "/contact-us",
      },
      {
        type: "process",
        eyebrow: "PROCESS",
        title: "Your journey from idea to launch",
        steps: [
          { callout: "Planning",     title: "Defining Goals and Structure",  description: "We align on objectives, audience, sitemap, pages, features, integrations, and the right tech stack — so everything is built with purpose from day one.",                                                                                  image: "/web2.png" },
          { callout: "Design",       title: "Creating a Visual Concept",     description: "We craft a clean UI/UX direction (layout, colors, typography) with clear feedback rounds until it matches your brand perfectly.",                                                                                                           image: "/web5.png" },
          { callout: "Development",  title: "Building the Website",          description: "We develop with modern frameworks, integrate tools (payments, CRM, analytics), and optimize for performance, SEO, and accessibility.",                                                                                                       image: "/web1.png" },
          { callout: "Testing",      title: "Ensuring Quality",              description: "We test performance, responsiveness, forms, UX and security — ensuring everything works smoothly across devices.",                                                                                                                           image: "/web3.png" },
          { callout: "Launch",       title: "Going Live",                    description: "We deploy to production, configure hosting/SSL, and validate everything end-to-end before launch day.",                                                                                                                                      image: "/web4.png" },
          { callout: "Maintenance",  title: "Support & Growth",              description: "We monitor, update, and improve over time — keeping your site secure, stable, and ready to scale.",                                                                                                                                           image: "/web7.png" },
        ],
      },
      {
        type: "faq",
        heading: "FAQ",
        subtitle: "Quick answers before we build something great.",
        questions: [
          { title: "Will my website be mobile-friendly?",         content: "Absolutely. Everything we build is fully responsive across mobile, tablet, and desktop devices.",                                                                              defaultOpen: true },
          { title: "What technologies do you use?",               content: "Based on your needs: React, Node.js, WordPress, Shopify, and other modern frameworks — we choose what fits your business." },
          { title: "How long does it take to build a website?",   content: "Basic websites typically take 2–3 weeks. Larger projects usually take 6–8 weeks depending on scope and integrations." },
          { title: "Can I update the website myself after it's built?", content: "Yes. We can integrate a CMS (like Strapi) so you can update content easily without coding." },
          { title: "Do you provide website maintenance services?", content: "Yes — we offer support plans for updates, fixes, monitoring, performance, and security." },
          { title: "Will my website be SEO-friendly?",            content: "Yes. We implement best practices (speed, structure, metadata) and can add advanced SEO services if needed." },
          { title: "Can you help with domain and hosting setup?", content: "Absolutely — we can support domain, hosting setup, SSL, and production deployment." },
        ],
      },
    ],
  },

  {
    order: 1,
    title: "SEO",
    tag: "SEO",
    slug: "seo-marketing",
    description: "Data-driven SEO strategies that boost rankings, drive targeted traffic, and deliver sustainable growth.",
    imageUrl: "/seo7.jpg",
    heroHeading: "🔍 SEO – Because Page 2 of Google Is a Dead End",
    heroSubheading: "Let's face it — nobody's clicking through to Page 2. That's why our SEO strategies are laser-focused on getting you where it counts: the top.",
    heroImageUrl: "/seo7.jpg",
    heroCtaText: "Get Started",
    heroCtaLink: "/contact-us",
    isActive: true,
    blocks: [
      {
        type: "webSolutions",
        imageUrl: "/seo4.jpg",
        heading: "Supercharge Your Online Visibility with Expert SEO",
        descriptions: [
          "Elevate your digital presence with our cutting-edge SEO services designed to boost your rankings, drive targeted traffic, and enhance your website's performance. We combine data-driven strategies with industry expertise to ensure your online growth is both impactful and sustainable.",
          "SEO doesn't have to be complicated. We simplify the process to attract the right audience, increase engagement, and maximize conversions through tailored SEO solutions.",
          "Our team uses proven techniques to enhance your online visibility, ensuring long-term success and measurable results that matter.",
        ],
      },
      {
        type: "steps",
        items: [
          { id: 1, callout: "Keyword Research",  title: "Unleashing the Power of High-Impact Keywords",          description: "Effective SEO begins with finding the perfect keywords. We don't just look at search volumes — we dig deeper into user intent and emerging trends to uncover high-impact, low-competition keywords that drive quality traffic. Our tailored approach ensures your website surfaces for the right searches, turning visibility into genuine engagement.", contentPosition: "r", image: "/seo1.jpg" },
          { id: 2, callout: "On-Page SEO",       title: "Crafting Content for Maximum Search Impact",             description: "On-page optimization is the key to boosting your website's visibility. We fine-tune every detail — from content and HTML structure to keyword placement — ensuring your title tags, meta descriptions, headers, and images are fully optimized. This approach not only enhances your rankings but also ensures both search engines and users easily navigate and engage with your content.", contentPosition: "l", image: "/seo2.jpg" },
          { id: 3, callout: "Link Building",     title: "Building a Rock-Solid SEO Foundation",                  description: "Technical SEO is the backbone of your website's performance. We ensure your site meets all search engine standards for speed, security, and mobile optimization. Our team conducts thorough audits, fixes technical issues, and enhances performance to improve crawlability — delivering a flawless user experience and boosting your search rankings.", contentPosition: "r", image: "/seo3.jpg" },
          { id: 4, callout: "Technical SEO",     title: "Your Website Deserves to Be Seen. Let's Make It Unmissable.", description: "Backlinks from reputable sites are key to building credibility and climbing the ranks. We use ethical link-building strategies to earn high-quality inbound links, boosting your site's reputation and trustworthiness with search engines. This drives consistent organic traffic and solidifies your authority online.", contentPosition: "l", image: "/seo5.jpg" },
          { id: 5, callout: "SEO Analytics",     title: "Monitoring & Maximizing Performance",                   description: "SEO is a journey, not a one-time fix. We continuously track key metrics — from traffic and rankings to conversions — using data-driven insights to fine-tune strategies. This ensures sustained growth and ongoing improvement in your search visibility, keeping you ahead of the competition.", contentPosition: "r", image: "/seo6.jpg" },
        ],
      },
      {
        type: "faq",
        heading: "Frequently Asked Questions",
        subtitle: "Everything you need to know about our SEO services.",
        questions: [
          { title: "How does SEO help my business?",                             content: "SEO improves your website's visibility on search engines, helping you attract more organic traffic, enhance brand credibility, and generate more leads without relying on paid ads.", defaultOpen: true },
          { title: "How long does SEO take to show results?",                   content: "SEO is a long-term strategy. Generally, noticeable improvements can be seen within 3-6 months, but significant growth and rankings take continuous effort over time." },
          { title: "What's the difference between on-page and off-page SEO?",   content: "On-page SEO involves optimizing website content, keywords, and technical elements, while off-page SEO focuses on external factors like backlinks and online reputation management." },
          { title: "Do you provide keyword research and content strategy?",     content: "Yes, we conduct in-depth keyword research and develop a content strategy tailored to your industry, ensuring your website ranks for high-intent search queries." },
          { title: "Will I need to continue SEO after reaching the top rankings?", content: "Yes! SEO is ongoing. Search engine algorithms change, competitors evolve, and maintaining top rankings requires consistent optimization and content updates." },
          { title: "How do you track SEO performance?",                         content: "We provide monthly reports that include keyword rankings, traffic analysis, backlinks, and other key performance metrics to measure the effectiveness of our SEO efforts." },
        ],
      },
    ],
  },

  {
    order: 2,
    title: "Google Ads",
    tag: "PPC",
    slug: "google-ads",
    description: "Data-driven Google Ads campaigns that generate high-quality leads, maximize ROI, and scale your business.",
    imageUrl: "/84.jpg",
    heroHeading: "💸 Performance Marketing – Ads With Real ROI",
    heroSubheading: "No guesswork. No wasted budget. Just data-driven campaigns that drive results.",
    heroImageUrl: "/84.jpg",
    heroCtaText: "Get Started",
    heroCtaLink: "/contact-us",
    isActive: true,
    blocks: [
      {
        type: "webSolutions",
        imageUrl: "/72.jpg",
        heading: "Google Ads Strategies That Drive Success",
        descriptions: [
          "We provide expert Google Ads management to help businesses generate high-quality leads, boost conversions, and maximize ROI. Whether you need search, display, or remarketing ads, we create data-driven campaigns.",
          "Running successful Google Ads can be challenging for many. That's why we are here to optimize your campaigns, ensuring that you reach the right audience and get the best return on investment.",
          "Our team delivers targeted, cost-effective advertising strategies tailored to your business goals, driving traffic, increasing engagement, and ensuring consistent growth through optimized campaigns.",
        ],
      },
      {
        type: "steps",
        items: [
          { id: 1, callout: "Planning",            title: "Setting Goals and Strategy",       description: "In this stage, our experts analyze your business, industry, and competition to set clear advertising goals. We define target audiences, budget allocation, and ad formats to ensure a data-driven strategy that maximizes conversions and ROI.", contentPosition: "r", image: "/73.jpg" },
          { id: 2, callout: "Ad Creation",         title: "Crafting High-Impact Ads",         description: "Our team creates compelling ad copy, engaging visuals, and strategic placements tailored for Google Ads. From search ads to display and video campaigns, we ensure your ads attract attention and drive qualified traffic to your website.", contentPosition: "l", image: "/74.jpg" },
          { id: 3, callout: "Campaign Setup",      title: "Building Optimized Campaigns",     description: "Once the ads are created, we set up and structure campaigns, ad groups, and targeting parameters. This includes keyword research, bid strategy, audience segmentation, and A/B testing to maximize efficiency and ad performance.", contentPosition: "r", image: "/83.jpeg" },
          { id: 4, callout: "Performance Tracking",title: "Monitoring and Optimization",      description: "We continuously track ad performance, analyzing key metrics like click-through rate, conversions, and cost per acquisition. This allows us to refine targeting, adjust bids, and optimize your campaign for the best possible results.", contentPosition: "l", image: "/76.jpeg" },
          { id: 5, callout: "Scaling Results",     title: "Expanding Winning Strategies",     description: "After identifying top-performing ads and audiences, we scale the campaign by reallocating budget to maximize returns. Our approach ensures sustainable growth while keeping costs in check and improving overall ad efficiency.", contentPosition: "r", image: "/77.jpg" },
          { id: 6, callout: "Ongoing Support",     title: "Continuous Analysis & Growth",     description: "Google Ads success requires ongoing adjustments. We provide monthly reports, strategic insights, and continuous optimizations to ensure long-term success, increased ROI, and alignment with your business objectives.", contentPosition: "l", image: "/86.jpg" },
        ],
      },
      {
        type: "faq",
        heading: "Frequently Asked Questions",
        subtitle: "Everything you need to know about our Google Ads services.",
        questions: [
          { title: "How does Google Ads help my business?",          content: "Google Ads helps businesses gain immediate visibility on search engines, drive targeted traffic, and increase conversions through paid advertising campaigns.", defaultOpen: true },
          { title: "What types of Google Ads campaigns do you manage?", content: "We manage Google Search Ads, Display Ads, Shopping Ads, Video Ads (YouTube), and Retargeting campaigns to maximize your online reach and conversions." },
          { title: "How do you determine the right keywords for my ads?", content: "We conduct in-depth keyword research, analyzing search trends, competition, and user intent to ensure your ads target the most effective keywords." },
          { title: "How do you track and optimize ad performance?",    content: "We monitor key performance indicators like CTR, CPC, and conversions, continuously optimizing bids, ad copy, and audience targeting to maximize ROI." },
          { title: "What budget should I allocate for Google Ads?",    content: "Your budget depends on industry competition and goals. We help you set a cost-effective budget and allocate spend for the best possible results." },
          { title: "Do you offer remarketing campaigns?",              content: "Yes, we create remarketing campaigns that re-engage past website visitors with tailored ads to increase conversions and customer retention." },
        ],
      },
    ],
  },

  {
    order: 3,
    title: "Social Media Management",
    tag: "SMM",
    slug: "social-media-marketing",
    description: "Strategy, content & community management that drives real engagement and brand growth across all platforms.",
    imageUrl: "/sm7.jpg",
    heroHeading: "📱 Social Media – More Than Pretty Posts & Hashtags",
    heroSubheading: "Social isn't just about aesthetics — it's about attention. And we know how to get it.",
    heroImageUrl: "/sm7.jpg",
    heroCtaText: "Get Started",
    heroCtaLink: "/contact-us",
    isActive: true,
    blocks: [
      {
        type: "webSolutions",
        imageUrl: "/sm2.jpg",
        heading: "Unlock the Power of Social Media for Your Brand",
        descriptions: [
          "We craft tailored social media strategies to boost your brand presence, engage your audience, and drive real growth. Our approach ensures your messaging is consistent, impactful, and aligned with your business goals across every platform.",
          "Navigating social media doesn't have to be complex. Our team simplifies the process, helping you connect with the right audience, increase interaction, and achieve measurable success.",
          "Our experts craft engaging, high-quality content that aligns with your brand identity, ensuring your message resonates with your target audience and drives meaningful interactions.",
        ],
      },
      {
        type: "steps",
        items: [
          { id: 1, callout: "Strategy",               title: "Set the Stage for Success: Define Your Goals and Audience", description: "Understanding your business, goals, and audience is the foundation of a successful strategy. We start with data-driven research, selecting the best platforms and KPIs to craft a personalized roadmap. Our approach ensures your brand stays ahead of the curve, relevant, and engaging.", contentPosition: "r", image: "/sm1.jpg" },
          { id: 2, callout: "Content Creation",       title: "Create Content That Captivates",   description: "Content is at the heart of social media success. We design eye-catching visuals, write compelling captions, and produce engaging videos that speak directly to your audience. Consistency in brand identity and storytelling ensures your message resonates and sparks conversations.", contentPosition: "l", image: "/sm3.jpg" },
          { id: 3, callout: "Advertising",            title: "Running Targeted Ad Campaigns",    description: "We create and manage highly targeted ad campaigns to maximize reach and conversions. Whether it's Facebook Ads, Instagram promotions, LinkedIn ads, or TikTok marketing, we optimize budgets and strategies for the best return on investment (ROI).", contentPosition: "r", image: "/sm4.jpg" },
          { id: 4, callout: "Community Management",  title: "Building Brand Loyalty",           description: "Engagement is key to social media success. We actively respond to comments, messages, and mentions to foster relationships, improve customer satisfaction, and enhance brand credibility in your industry.", contentPosition: "l", image: "/sm5.jpg" },
          { id: 5, callout: "Analytics & Optimization", title: "Measuring and Improving Performance", description: "We track engagement, reach, and conversions using advanced analytics tools. Regular reports help refine strategies, optimize ad spend, and ensure your social media efforts generate real business results.", contentPosition: "r", image: "/sm6.jpg" },
        ],
      },
      {
        type: "faq",
        heading: "Frequently Asked Questions",
        subtitle: "Everything you need to know about our social media services.",
        questions: [
          { title: "Will my social media strategy be customized?",        content: "Yes! We tailor every social media strategy to align with your business goals, target audience, and industry trends for maximum impact.", defaultOpen: true },
          { title: "How often will you post on my social media accounts?", content: "Posting frequency depends on the package you choose. We offer plans with 8, 12, or 20+ posts per month, including videos and stories." },
          { title: "Do you create content or use existing materials?",     content: "We create fresh, engaging content based on your brand's needs. However, if you have specific materials you'd like to use, we can incorporate them." },
          { title: "Can you run paid ad campaigns on social media?",       content: "Absolutely! We specialize in targeted social media ad campaigns to increase reach, engagement, and conversions across various platforms." },
          { title: "Which social media platforms do you manage?",          content: "We manage Facebook, Instagram, LinkedIn, Twitter, TikTok, and YouTube. We help you choose the best platforms for your business." },
          { title: "How do you track the success of social media campaigns?", content: "We provide regular analytics reports, tracking key metrics like engagement, reach, clicks, and conversions to optimize strategy." },
          { title: "Will I have control over my social media accounts?",   content: "Yes! You retain full ownership of your accounts, and we collaborate with you to ensure all content aligns with your brand's vision." },
        ],
      },
    ],
  },

  {
    order: 4,
    title: "Videography",
    tag: "VIDEO",
    slug: "videography",
    description: "Brand films, product videos, and creative productions that tell your story and connect with your audience.",
    imageUrl: "/web-banner.jpg",
    heroHeading: "Launch your business with a cutting-edge Videography",
    heroSubheading: "Empowering businesses with innovative video production solutions that drive growth and enhance user experiences.",
    heroImageUrl: "/web-banner.jpg",
    heroCtaText: "Get Started",
    heroCtaLink: "/contact-us",
    isActive: true,
    blocks: [
      {
        type: "webSolutions",
        imageUrl: "/image3.jpg",
        heading: "Video Production That Drives Engagement",
        descriptions: [
          "We create high-impact brand videos, product showcases, and creative content that captures attention and drives action.",
          "From concept to final cut, we manage the entire production process so your brand's story is told with clarity, creativity, and purpose.",
          "Our team delivers professional, creative, and engaging video content tailored to the specific needs of your business.",
        ],
      },
      {
        type: "steps",
        items: [
          { id: 1, callout: "Pre-Production", title: "Planning & Concept",       description: "We work with you to define the video goals, script, storyboard, and production plan — ensuring every detail is aligned before we roll.",                                                    contentPosition: "r", image: "/web-plan.jpg" },
          { id: 2, callout: "Production",     title: "Filming",                  description: "Our team handles location scouting, equipment setup, direction, and filming to capture stunning, high-quality footage that brings your vision to life.",                                       contentPosition: "l", image: "/web-banner.jpg" },
          { id: 3, callout: "Post-Production",title: "Editing & Color Grading",  description: "We edit, color grade, add music, graphics, and voice-over to deliver a polished final video that meets your brand standards and captivates viewers.",                                      contentPosition: "r", image: "/image2.png" },
          { id: 4, callout: "Delivery",       title: "Final Output",             description: "We deliver in all required formats optimized for social media, websites, broadcast, or presentations — ready to publish and share.",                                                          contentPosition: "l", image: "/web-plan.jpg" },
        ],
      },
      {
        type: "faq",
        heading: "Frequently Asked Questions",
        subtitle: "Everything you need to know about our video services.",
        questions: [
          { title: "What types of videos do you produce?",           content: "We produce brand films, product videos, social media reels, corporate videos, testimonials, event coverage, and more.", defaultOpen: true },
          { title: "How long does video production take?",           content: "Simple social content can be turned around in a few days. Full brand films or multi-day productions typically take 2–4 weeks." },
          { title: "Do you handle scripting and storyboarding?",     content: "Yes — we offer full creative services from concept development and scripting through to the final delivered video." },
          { title: "What formats will I receive the final video in?", content: "We deliver in all required formats including MP4, MOV, and platform-specific exports optimized for YouTube, Instagram, LinkedIn, etc." },
          { title: "Can you add subtitles or translations?",         content: "Yes, we can add subtitles, closed captions, and provide localized versions of your video as required." },
        ],
      },
    ],
  },

  {
    order: 5,
    title: "Content Creation",
    tag: "CONTENT",
    slug: "content-creation",
    description: "Compelling written and visual content that educates, engages, and converts your target audience.",
    imageUrl: "/web-banner.jpg",
    heroHeading: "Compelling Content That Converts",
    heroSubheading: "Words and visuals that tell your brand story, engage your audience, and drive measurable results.",
    heroImageUrl: "/web-banner.jpg",
    heroCtaText: "Get Started",
    heroCtaLink: "/contact-us",
    isActive: true,
    blocks: [
      {
        type: "webSolutions",
        imageUrl: "/image3.jpg",
        heading: "Content That Works as Hard as You Do",
        descriptions: [
          "We create written and visual content that resonates with your audience — from blog posts and case studies to social graphics and infographics.",
          "Great content builds trust, drives organic traffic, and nurtures leads through every stage of the funnel.",
          "Our team delivers consistent, on-brand content tailored to your voice and business objectives.",
        ],
      },
      {
        type: "steps",
        items: [
          { id: 1, callout: "Strategy",      title: "Content Planning",           description: "We define your content pillars, audience personas, tone of voice, and publishing calendar — so every piece has a purpose.",                                                              contentPosition: "r", image: "/web-plan.jpg" },
          { id: 2, callout: "Creation",      title: "Writing & Design",           description: "Our writers and designers produce high-quality blog posts, social copy, email sequences, infographics, and visual assets aligned with your brand.",                                       contentPosition: "l", image: "/web-banner.jpg" },
          { id: 3, callout: "Optimization",  title: "SEO & Performance",          description: "Every piece of content is optimized for search and readability — structured with the right keywords, headings, and calls to action to drive organic results.",                           contentPosition: "r", image: "/image2.png" },
          { id: 4, callout: "Distribution",  title: "Publishing & Amplification", description: "We schedule and distribute content across the right channels, track performance metrics, and refine the strategy to maximize reach and engagement.",                                     contentPosition: "l", image: "/web-plan.jpg" },
        ],
      },
      {
        type: "faq",
        heading: "Frequently Asked Questions",
        subtitle: "Everything you need to know about our content services.",
        questions: [
          { title: "What types of content do you create?",              content: "We create blog posts, social media content, email newsletters, case studies, website copy, infographics, and more.", defaultOpen: true },
          { title: "How do you maintain brand voice consistency?",      content: "We start with a brand voice document and style guide, then apply it consistently across all content we produce." },
          { title: "Do you include SEO in your content?",               content: "Yes — all written content is SEO-optimized with keyword research, proper structure, and meta data guidance." },
          { title: "How often will you publish content?",               content: "Frequency depends on your package and goals. We typically recommend 4–8 blog posts per month alongside social content." },
          { title: "Can I review content before it's published?",       content: "Absolutely. We share all content for review and approval before publishing, with rounds of revision included." },
        ],
      },
    ],
  },
];

// ─── Technology Solutions ─────────────────────────────────────────────────────

const SOLUTIONS = [
  {
    order: 0,
    icon: "software",
    slug: "software-licensing",
    title: "Software Licensing",
    subtitle: "Enterprise software procurement",
    description: "We help businesses procure, manage, renew, and optimize enterprise software licenses with clear vendor comparison and proper commercial control.",
    heroImageUrl: "/it-solutions/software-licensing.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "License Coverage", title: "Software procurement made simpler", highlight: "and controlled", subtitle: "We support businesses across software sourcing, license management, renewals, compliance, and vendor coordination.", items: [
        { title: "Productivity Suites",   desc: "Microsoft 365, Google Workspace, email, collaboration, and business productivity tools." },
        { title: "Business Applications", desc: "CRM, ERP, HR, finance, operations, and department-specific software procurement." },
        { title: "Renewal Management",    desc: "Track renewals, compare pricing, and avoid last-minute license surprises." },
        { title: "License Optimization",  desc: "Review active usage and remove unnecessary or duplicated licenses." },
        { title: "Vendor Comparison",     desc: "Compare commercial offers, support terms, and suitability before purchase." },
        { title: "Compliance Support",    desc: "Help your team stay aligned with licensing terms and procurement documentation." },
      ]},
      { type: "process", eyebrow: "Procurement Flow", title: "From requirement to license activation", steps: [
        { step: "01", title: "Requirement Review", desc: "We understand the software need, users, departments, budget, and expected use." },
        { step: "02", title: "Vendor Options",     desc: "We shortlist suitable products or vendors based on your requirement." },
        { step: "03", title: "Commercial Review",  desc: "We compare pricing, contract terms, renewal rules, and support levels." },
        { step: "04", title: "Procurement",        desc: "We support purchasing, documentation, license issuance, and activation." },
      ]},
      { type: "useCases", eyebrow: "Best For", title: "Who needs this service?", items: [
        "Companies buying or renewing multiple software licenses",
        "Teams needing Microsoft 365, productivity, or business applications",
        "Organizations that want better control over subscriptions",
        "Businesses looking for vendor-neutral software recommendations",
      ]},
    ],
  },

  {
    order: 1,
    icon: "erp",
    slug: "erp-solution",
    title: "ERP Solution",
    subtitle: "Streamline operations end-to-end",
    description: "We help businesses select, scope, procure, and implement ERP solutions that connect finance, operations, inventory, sales, and reporting.",
    heroImageUrl: "/it-solutions/erp-solution.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "ERP Modules", title: "Connect your core", highlight: "business operations", subtitle: "ERP solutions help unify departments, reduce manual work, and create better visibility across the business.", items: [
        { title: "Finance & Accounting",    desc: "Manage financial operations, approvals, reporting, and accounting workflows." },
        { title: "Inventory & Procurement", desc: "Control stock, purchasing, suppliers, and procurement processes." },
        { title: "Sales & Orders",          desc: "Track customer orders, quotations, invoices, and sales performance." },
        { title: "HR & Payroll",            desc: "Support employee records, attendance, payroll, and HR workflows." },
        { title: "Reporting Dashboards",    desc: "Give management visibility into performance, operations, and finance." },
        { title: "Integrations",            desc: "Connect ERP with websites, CRM, payment systems, or internal tools." },
      ]},
      { type: "process", eyebrow: "Implementation", title: "ERP rollout process", steps: [
        { step: "01", title: "Business Analysis",      desc: "We study current workflows, departments, approvals, and pain points." },
        { step: "02", title: "Requirements Document",  desc: "We define modules, roles, integrations, reports, and implementation scope." },
        { step: "03", title: "Vendor Shortlist",       desc: "We recommend suitable ERP options based on budget and complexity." },
        { step: "04", title: "Implementation Support", desc: "We support configuration, migration, testing, training, and go-live." },
      ]},
      { type: "split", eyebrow: "Business Value", title: "ERP is not only software — it is an operating model.", desc: "The right ERP should match how your business actually works. Our role is to help define the requirement clearly, select the right vendor, and reduce the risk of buying a system that does not fit your process.", points: [
        "Better visibility across departments",
        "Reduced manual work and duplicate data entry",
        "Clear approval workflows and reporting",
        "A stronger foundation for business growth",
      ]},
    ],
  },

  {
    order: 2,
    icon: "crm",
    slug: "crm-solution",
    title: "CRM Solution",
    subtitle: "Manage & grow customer relationships",
    description: "We help companies implement CRM systems that improve lead tracking, sales pipelines, customer service, follow-ups, and business reporting.",
    heroImageUrl: "/it-solutions/crm-solution.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "CRM Capabilities", title: "Manage customers from", highlight: "lead to loyalty", subtitle: "A good CRM keeps your sales, service, and management teams aligned around one source of customer truth.", items: [
        { title: "Lead Management",   desc: "Capture, assign, track, and qualify leads from different channels." },
        { title: "Sales Pipeline",    desc: "Manage deals, stages, follow-ups, activities, and sales forecasting." },
        { title: "Customer Accounts", desc: "Maintain customer profiles, contacts, history, and communication logs." },
        { title: "Support Workflows", desc: "Track tickets, requests, issues, and service follow-up." },
        { title: "Automation",        desc: "Automate reminders, task creation, notifications, and lifecycle actions." },
        { title: "Dashboards",        desc: "Monitor team performance, conversion rates, revenue, and customer health." },
      ]},
      { type: "process", eyebrow: "CRM Setup", title: "How we implement CRM", steps: [
        { step: "01", title: "Workflow Mapping",  desc: "We understand your sales, service, and customer management workflow." },
        { step: "02", title: "Pipeline Design",   desc: "We define stages, fields, roles, activities, and reporting needs." },
        { step: "03", title: "System Setup",      desc: "We support CRM configuration, data import, users, and automation." },
        { step: "04", title: "Training & Adoption", desc: "We help your team understand how to use the CRM properly." },
      ]},
      { type: "useCases", eyebrow: "Use Cases", title: "CRM is useful when you need to manage", items: [
        "Sales leads and follow-ups",
        "Customer accounts and contacts",
        "Deals, proposals, and opportunities",
        "Support tickets and customer requests",
        "Customer history and reporting",
      ]},
    ],
  },

  {
    order: 3,
    icon: "queue",
    slug: "queue-management",
    title: "Queue Management",
    subtitle: "Smart flow for customers & staff",
    description: "We provide queue management solutions that help branches, offices, clinics, and service centers organize customer flow and reduce waiting time.",
    heroImageUrl: "/it-solutions/queue-management.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "Customer Flow", title: "Improve waiting experience", highlight: "and staff efficiency", subtitle: "Queue systems help control footfall, improve service visibility, and organize branch operations.", items: [
        { title: "Ticketing System",    desc: "Generate customer tickets based on service type and priority." },
        { title: "Display Screens",     desc: "Show queue numbers, counters, and service status clearly." },
        { title: "Counter Management",  desc: "Assign staff counters and track customer serving time." },
        { title: "Priority Queues",     desc: "Support VIP, elderly, appointment, or special-service queues." },
        { title: "Notifications",       desc: "Send customer alerts through screens, SMS, or other channels if required." },
        { title: "Reports",             desc: "Track waiting time, service time, counter performance, and branch load." },
      ]},
      { type: "useCases", eyebrow: "Best Fit", title: "Where queue management works well", items: [
        "Banks and financial service centers",
        "Government service offices",
        "Clinics and hospitals",
        "Telecom branches",
        "Customer service centers",
        "Retail service counters",
      ]},
      { type: "process", eyebrow: "Deployment", title: "Queue system setup", steps: [
        { step: "01", title: "Branch Assessment",    desc: "We review customer flow, counters, waiting areas, and service types." },
        { step: "02", title: "Solution Design",      desc: "We define ticketing logic, screens, counters, and reports." },
        { step: "03", title: "Hardware & Software",  desc: "We source and support the required system components." },
        { step: "04", title: "Training & Handover",  desc: "We train staff and support the launch process." },
      ]},
    ],
  },

  {
    order: 4,
    icon: "iot",
    slug: "iot-solutions",
    title: "IoT Solutions",
    subtitle: "Connected devices & smart systems",
    description: "We support businesses with IoT solutions for connected devices, monitoring, automation, and operational visibility.",
    heroImageUrl: "/it-solutions/iot-solutions.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "IoT Capabilities", title: "Connect devices, collect data,", highlight: "and act faster", subtitle: "IoT enables businesses to monitor assets, automate operations, and improve decisions with real-time data.", items: [
        { title: "Sensors & Devices", desc: "Support for sourcing sensors, meters, trackers, and smart devices." },
        { title: "Gateways",          desc: "Connect devices to cloud platforms or internal monitoring systems." },
        { title: "Dashboards",        desc: "View operational data, alerts, trends, and device status." },
        { title: "Automation",        desc: "Trigger actions based on readings, conditions, or alerts." },
        { title: "Connectivity",      desc: "Plan Wi-Fi, cellular, LPWAN, or other connectivity requirements." },
        { title: "Support",           desc: "Assist with deployment, monitoring, and maintenance planning." },
      ]},
      { type: "useCases", eyebrow: "IoT Use Cases", title: "Common IoT applications", items: [
        "Asset tracking",
        "Smart buildings",
        "Energy monitoring",
        "Cold-chain monitoring",
        "Fleet and equipment tracking",
        "Operational alerts and automation",
      ]},
      { type: "split", eyebrow: "Approach", title: "IoT should start with the business problem, not the device.", desc: "We help define what needs to be measured, why it matters, how data should be collected, and what action the system should trigger.", points: [
        "Clear use-case definition",
        "Device and connectivity selection",
        "Dashboard and alert planning",
        "Deployment and support model",
      ]},
    ],
  },

  {
    order: 5,
    icon: "vas",
    slug: "vas-solutions",
    title: "VAS Solutions",
    subtitle: "Value-added services for telcos",
    description: "We help telecom and digital service providers evaluate and launch value-added services that support engagement, revenue, and customer experience.",
    heroImageUrl: "/it-solutions/vas-solutions.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "VAS Scope", title: "Services that add", highlight: "business value", subtitle: "VAS solutions can help operators and service providers create new revenue streams and better digital engagement.", items: [
        { title: "VAS Platforms",          desc: "Support vendor selection and platform procurement for value-added services." },
        { title: "Subscription Services",  desc: "Enable recurring customer services with controlled activation and billing flows." },
        { title: "Customer Engagement",    desc: "Support tools for campaigns, notifications, loyalty, and service interaction." },
        { title: "Integration Support",    desc: "Coordinate integration needs with billing, CRM, USSD, SMS, or mobile apps." },
        { title: "Reporting",              desc: "Monitor service usage, customer activity, and performance." },
        { title: "Go-To-Market Support",   desc: "Support launch readiness, testing, and operational planning." },
      ]},
      { type: "process", eyebrow: "VAS Delivery", title: "From concept to launch", steps: [
        { step: "01", title: "Service Concept",        desc: "Define the target users, value proposition, and commercial model." },
        { step: "02", title: "Vendor Evaluation",      desc: "Review platform options, capabilities, integrations, and cost." },
        { step: "03", title: "Technical Coordination", desc: "Align integration, testing, reporting, and operational requirements." },
        { step: "04", title: "Launch Support",         desc: "Support readiness, deployment, and post-launch optimization." },
      ]},
    ],
  },

  {
    order: 6,
    icon: "cloud",
    slug: "cloud-services",
    title: "Cloud Services",
    subtitle: "Scalable infrastructure & hosting",
    description: "We help businesses plan, procure, migrate, and manage cloud infrastructure that is scalable, secure, and aligned with business growth.",
    heroImageUrl: "/it-solutions/cloud-services.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "Cloud Services", title: "Scalable infrastructure", highlight: "for modern businesses", subtitle: "Cloud services help businesses reduce infrastructure limitations, improve availability, and scale faster.", items: [
        { title: "Cloud Hosting",      desc: "Host websites, portals, applications, databases, and internal systems." },
        { title: "Migration Support",  desc: "Plan and support movement from legacy servers to cloud infrastructure." },
        { title: "Backup & Recovery",  desc: "Design backup, restore, and disaster recovery approaches." },
        { title: "Security Controls",  desc: "Support access control, SSL, firewall, monitoring, and best practices." },
        { title: "Cost Optimization",  desc: "Review cloud usage and reduce unnecessary or oversized resources." },
        { title: "Monitoring",         desc: "Support uptime, performance, alerts, and operational visibility." },
      ]},
      { type: "process", eyebrow: "Cloud Journey", title: "Cloud setup process", steps: [
        { step: "01", title: "Assessment",  desc: "Review applications, users, security, traffic, and hosting needs." },
        { step: "02", title: "Architecture",desc: "Design the right cloud structure, hosting model, and security setup." },
        { step: "03", title: "Migration",   desc: "Support deployment, data migration, DNS, SSL, and testing." },
        { step: "04", title: "Optimization",desc: "Monitor performance, cost, backups, and ongoing support needs." },
      ]},
      { type: "split", eyebrow: "Cloud Readiness", title: "Cloud should be designed around security, cost, and scale.", desc: "Moving to cloud is not only about hosting. It requires proper architecture, access control, backup planning, monitoring, and cost governance.", points: [
        "Secure access and environment setup",
        "Reliable hosting and performance planning",
        "Backup and recovery strategy",
        "Clear monthly cost visibility",
      ]},
    ],
  },

  {
    order: 7,
    icon: "hosting",
    slug: "web-hosting-domains",
    title: "Web Hosting & Domains",
    subtitle: "Fast, reliable hosting solutions",
    description: "We provide hosting, domain, DNS, SSL, and business email support for websites, portals, landing pages, and digital platforms.",
    heroImageUrl: "/it-solutions/web-hosting-domains.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "Hosting Scope", title: "Reliable setup for your", highlight: "digital presence", subtitle: "From domain registration to secure hosting, we help businesses keep their websites accessible and properly configured.", items: [
        { title: "Domain Support",        desc: "Register, renew, transfer, and manage domains." },
        { title: "DNS Configuration",     desc: "Configure A records, CNAME, MX, TXT, SPF, DKIM, and DMARC records." },
        { title: "Website Hosting",       desc: "Host websites, landing pages, portals, and web applications." },
        { title: "SSL Certificates",      desc: "Set up HTTPS certificates for secure website access." },
        { title: "Business Email",        desc: "Support email domain setup and basic email configuration." },
        { title: "Monitoring & Support",  desc: "Support uptime checks, renewals, and hosting troubleshooting." },
      ]},
      { type: "useCases", eyebrow: "Best For", title: "Useful for businesses needing", items: [
        "New website launch",
        "Domain and DNS setup",
        "Hosting migration",
        "Business email configuration",
        "SSL and security setup",
        "Website support and renewal management",
      ]},
    ],
  },

  {
    order: 8,
    icon: "datacenter",
    slug: "data-center",
    title: "Data Center",
    subtitle: "Managed data center services",
    description: "We support businesses with managed data center services, infrastructure planning, hosting, backup, monitoring, and operational support.",
    heroImageUrl: "/it-solutions/data-center.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "Data Center Services", title: "Reliable infrastructure", highlight: "for critical operations", subtitle: "Data center services help companies run systems with stronger reliability, monitoring, and operational control.", items: [
        { title: "Managed Infrastructure", desc: "Support hosted servers, infrastructure monitoring, and operations." },
        { title: "Server Hosting",         desc: "Support physical or virtual server hosting requirements." },
        { title: "Backup Services",        desc: "Plan and support backup, restore, and retention policies." },
        { title: "Monitoring",             desc: "Track availability, performance, storage, and system health." },
        { title: "Security Controls",      desc: "Support access control, network segmentation, and secure operations." },
        { title: "Documentation",          desc: "Maintain infrastructure documentation and handover records." },
      ]},
      { type: "process", eyebrow: "Infrastructure Flow", title: "Data center service setup", steps: [
        { step: "01", title: "Requirement Review",  desc: "Define workloads, storage, security, uptime, and support needs." },
        { step: "02", title: "Solution Design",     desc: "Plan infrastructure, hosting model, backup, and monitoring approach." },
        { step: "03", title: "Deployment",          desc: "Coordinate setup, migration, testing, and documentation." },
        { step: "04", title: "Operations Support",  desc: "Support monitoring, changes, renewals, and issue handling." },
      ]},
    ],
  },

  {
    order: 9,
    icon: "consultation",
    slug: "it-consultation",
    title: "IT Consultation",
    subtitle: "Expert guidance & roadmap planning",
    description: "We provide technology consultation to help businesses assess needs, select vendors, plan roadmaps, and make better IT decisions.",
    heroImageUrl: "/it-solutions/it-consultation.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "Consulting Scope", title: "Clear advice before", highlight: "technology decisions", subtitle: "We help translate business needs into technical requirements, realistic budgets, and practical implementation plans.", items: [
        { title: "Technology Assessment", desc: "Review current systems, gaps, risks, and improvement areas." },
        { title: "Roadmap Planning",      desc: "Define phased technology plans based on priority and budget." },
        { title: "Vendor Evaluation",     desc: "Compare vendors, proposals, capabilities, and commercial terms." },
        { title: "Solution Architecture", desc: "Design the right technical structure before implementation starts." },
        { title: "RFP Support",           desc: "Prepare technical requirements and evaluation criteria." },
        { title: "Project Advisory",      desc: "Support planning, review, QA, and stakeholder alignment." },
      ]},
      { type: "useCases", eyebrow: "Useful When", title: "IT consultation helps when you need", items: [
        "A technology roadmap",
        "Vendor selection support",
        "Review of technical proposals",
        "Budget and scope planning",
        "System architecture guidance",
        "Independent technology advice",
      ]},
      { type: "split", eyebrow: "Why It Matters", title: "Good consultation reduces wrong purchases and unclear scopes.", desc: "Many technology projects fail because the requirement is not clear before vendor selection. We help define the need properly so the business can buy and implement with confidence.", points: [
        "Clear requirements before procurement",
        "Better vendor comparison",
        "Lower implementation risk",
        "Stronger management visibility",
      ]},
    ],
  },

  {
    order: 10,
    icon: "networking",
    slug: "networking-hardware",
    title: "Networking Hardware",
    subtitle: "Enterprise-grade network equipment",
    description: "We source and support networking hardware for reliable connectivity, secure operations, and enterprise-grade performance.",
    heroImageUrl: "/it-solutions/networking-hardware.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "Network Equipment", title: "Build reliable and secure", highlight: "business connectivity", subtitle: "Networking hardware is the foundation for secure access, stable internet, internal connectivity, and branch operations.", items: [
        { title: "Switches",               desc: "Access, aggregation, and core switches for business networks." },
        { title: "Routers",                desc: "Reliable routing equipment for branches, offices, and sites." },
        { title: "Wireless Access Points", desc: "Enterprise Wi-Fi coverage for offices, stores, and service locations." },
        { title: "Firewalls",              desc: "Network security appliances for protection and access control." },
        { title: "Structured Planning",    desc: "Support network design, device selection, and capacity planning." },
        { title: "Vendor Sourcing",        desc: "Compare brands, models, pricing, warranty, and availability." },
      ]},
      { type: "process", eyebrow: "Network Procurement", title: "Hardware selection process", steps: [
        { step: "01", title: "Site Requirement",    desc: "Review number of users, floors, branches, devices, and security needs." },
        { step: "02", title: "Device Selection",    desc: "Recommend suitable equipment based on capacity and budget." },
        { step: "03", title: "Procurement",         desc: "Coordinate quotations, purchasing, delivery, and warranty." },
        { step: "04", title: "Deployment Support",  desc: "Support installation planning, configuration, and handover." },
      ]},
    ],
  },

  {
    order: 11,
    icon: "hardware",
    slug: "data-center-hardware",
    title: "Data Center Hardware",
    subtitle: "Servers, storage & infrastructure",
    description: "We help businesses procure servers, storage, racks, backup appliances, and supporting infrastructure for data center operations.",
    heroImageUrl: "/it-solutions/data-center-hardware.webp",
    isActive: true,
    blocks: [
      { type: "featureGrid", eyebrow: "Hardware Categories", title: "Infrastructure hardware", highlight: "for critical systems", subtitle: "We support sourcing and procurement of reliable data center hardware based on workload, performance, and budget requirements.", items: [
        { title: "Servers",            desc: "Rack, tower, or blade servers based on workload and capacity needs." },
        { title: "Storage",            desc: "SAN, NAS, backup storage, and scalable storage options." },
        { title: "Backup Appliances",  desc: "Hardware for backup, recovery, and business continuity." },
        { title: "Racks & Cabinets",   desc: "Rack infrastructure and supporting equipment for data center rooms." },
        { title: "Power & Accessories",desc: "UPS, PDUs, cables, rails, and supporting infrastructure items." },
        { title: "Vendor Comparison",  desc: "Compare models, warranty, delivery timelines, and pricing." },
      ]},
      { type: "split", eyebrow: "Procurement Focus", title: "Hardware selection must match workload, growth, and support needs.", desc: "We help clarify technical specifications before purchase so the business avoids underpowered, overpriced, or unsuitable infrastructure.", points: [
        "Right sizing based on workload",
        "Vendor and warranty comparison",
        "Delivery and handover coordination",
        "Infrastructure documentation support",
      ]},
      { type: "process", eyebrow: "Hardware Procurement", title: "From specification to delivery", steps: [
        { step: "01", title: "Technical Requirement", desc: "Define workload, storage, redundancy, performance, and budget." },
        { step: "02", title: "Specification",         desc: "Prepare hardware specs and compare suitable options." },
        { step: "03", title: "Quotation Review",      desc: "Review pricing, warranty, delivery, and vendor terms." },
        { step: "04", title: "Delivery & Handover",   desc: "Coordinate procurement, delivery, documentation, and support." },
      ]},
    ],
  },
];

const IMAGE_RICH_SOLUTION_BLOCKS = new Set(["imageShowcase", "imageCards", "gallery"]);

function solutionVisualPath(index, offset = 0) {
  const paths = SOLUTIONS.map((item) => item.heroImageUrl).filter(Boolean);
  return paths[(index + offset + paths.length) % paths.length] || "";
}

function createImageRichBlocks(solution, index) {
  return [
    {
      type: "imageShowcase",
      eyebrow: "Solution View",
      title: `${solution.title} in real business context`,
      desc: `A visual view of how ${solution.title.toLowerCase()} fits into procurement, deployment, operations, and ongoing support. Use this block to show the environment, platform, hardware, or workflow behind the solution.`,
      imageUrl: solution.heroImageUrl,
      secondaryImageUrl: solutionVisualPath(index, 3),
      points: [
        "Clear requirement mapping before procurement",
        "Vendor and solution comparison with business context",
        "Deployment planning, handover, and support readiness",
      ],
    },
    {
      type: "imageCards",
      eyebrow: "Visual Scope",
      title: "What clients can",
      highlight: "see and understand",
      subtitle: "Use image cards to explain the parts of the solution that are easier to understand visually.",
      items: [
        {
          imageUrl: solution.heroImageUrl,
          title: "Requirement & environment",
          desc: "Show the business setting, users, devices, systems, or operational context this solution supports.",
        },
        {
          imageUrl: solutionVisualPath(index, 1),
          title: "Technology components",
          desc: "Highlight the software, hardware, cloud, network, or platform layers involved in the scope.",
        },
        {
          imageUrl: solutionVisualPath(index, 2),
          title: "Delivery & support",
          desc: "Show how the solution moves from selection and procurement into implementation and ongoing support.",
        },
      ],
    },
  ];
}

function enrichTechnologySolutionBlocks(solutions) {
  solutions.forEach((solution, index) => {
    const existingTypes = new Set((solution.blocks || []).map((block) => block.type));
    const missingBlocks = createImageRichBlocks(solution, index).filter(
      (block) => !existingTypes.has(block.type)
    );
    solution.blocks = [...(solution.blocks || []), ...missingBlocks];
  });
}

enrichTechnologySolutionBlocks(SOLUTIONS);

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  assertSafeTarget();
  await connectDB();
  console.log("Connected to DB.");

  // ── Digital Services ──
  const existingServices = await DigitalService.countDocuments();
  if (existingServices > 0) {
    console.log(`⚠️  Skipping Digital Services — ${existingServices} records already exist. Drop the collection first to re-seed.`);
  } else {
    const created = await DigitalService.insertMany(SERVICES);
    console.log(`✅ Seeded ${created.length} Digital Services.`);
  }

  // ── Solutions ──
  const existingSolutions = await Solution.countDocuments();
  if (existingSolutions > 0) {
    let updatedCount = 0;
    let createdCount = 0;

    for (const seed of SOLUTIONS) {
      const existing = await Solution.findOne({ slug: seed.slug }).lean();
      if (!existing) {
        await Solution.create(seed);
        createdCount += 1;
        continue;
      }

      const existingTypes = new Set((existing.blocks || []).map((block) => block.type));
      const missingBlocks = (seed.blocks || []).filter(
        (block) => IMAGE_RICH_SOLUTION_BLOCKS.has(block.type) && !existingTypes.has(block.type)
      );

      if (missingBlocks.length > 0) {
        await Solution.findByIdAndUpdate(existing._id, {
          $push: { blocks: { $each: missingBlocks } },
        });
        updatedCount += 1;
      }
    }

    console.log(`✅ Technology Solutions checked — ${updatedCount} updated, ${createdCount} created, ${existingSolutions} existing.`);
  } else {
    const created = await Solution.insertMany(SOLUTIONS);
    console.log(`✅ Seeded ${created.length} Technology Solutions.`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
