// context/NewsTickerContext.js
import React, { createContext, useState, useEffect } from "react";

export const NewsTickerContext = createContext();

const demoNews = ["Free Delivery", "Premium", "New Arrival", "Hot Offer"];

export const NewsTickerProvider = ({ children }) => {
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % demoNews.length;
      setVisibleIndex(currentIndex);
    }, 3000);

    return () => clearInterval(interval); // ✅ safe cleanup
  }, []);

  return (
    <NewsTickerContext.Provider value={{ visibleIndex, demoNews }}>
      {children}
    </NewsTickerContext.Provider>
  );
};
