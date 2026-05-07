import React from "react";

const ContactMap = () => {
  return (
    <div style={{ position: "relative", width: "100%", height: "80vh" }}>
      <iframe
        title="Expresso Business Solution Location"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.529023711816!2d55.336304175165424!3d25.252783477675212!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f5dac0817ed4b%3A0x1c488c67d297ab56!2sExpresso%20Business%20Solution%20%2F%20Etisalat%20Premium%20Channel%20Partner!5e0!3m2!1sen!2sae!4v1737464988569!5m2!1sen!2sae"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          filter: "grayscale(100%)",
          pointerEvents: "none",
        }}
      ></div>
    </div>
  );
};

export default ContactMap;
