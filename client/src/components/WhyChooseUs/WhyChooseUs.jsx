import { FaRocket, FaMobileAlt, FaRedoAlt, FaComments } from "react-icons/fa";

const WhyChooseUs = () => {
  const features = [
    {
      icon: <FaRocket size={22} />,
      title: "Fast Delivery",
      desc: "Get your website live in weeks, not months. We work efficiently without compromising quality.",
    },
    {
      icon: <FaMobileAlt size={22} />,
      title: "SEO & Mobile Friendly",
      desc: "Built to rank on Google and look perfect on every device from day one.",
    },
    {
      icon: <FaRedoAlt size={22} />,
      title: "Free Revisions",
      desc: "We don't stop until you're 100% satisfied. Unlimited revisions included.",
    },
    {
      icon: <FaComments size={22} />,
      title: "24/7 Support",
      desc: "Questions? Updates? We're here around the clock to help your business succeed.",
    },
  ];

  return (
    <section className="bg-gray-50 py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex flex-col text-start md:flex-row justify-between items-start md:items-center mb-16 border-b border-gray-300 pb-6">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-gray-900">
            WHY CHOOSE <br /> US?
          </h2>
          <p className="text-gray-600 max-w-md mt-6 md:mt-0 text-sm">
            We combine technical expertise with business understanding to deliver
          websites that actually drive results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 mb-4 rounded-lg bg-purple-500 text-white">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
