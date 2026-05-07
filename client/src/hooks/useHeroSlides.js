import { useEffect, useState } from "react";
import { fetchHomeHeroSlides } from "../services/strapi";

export default function useHeroSlides() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeHeroSlides()
      .then((data) =>
        setSlides(data.filter((s) => s.heading || s.description || s.mainBg))
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { slides, loading };
}
