import { useState } from "react";
import { VolunteerAnnualSummary } from "./VolunteerAnnualSummary";
import { VolunteerCurrentMatches } from "./VolunteerCurrentMatches";
import { VolunteerRecentImpacts } from "./VolunteerRecentImpacts";
import { CarouselButtons } from "./CarouselButtons";

import styles from "./styles/volunteerStats.module.css";

export const VolunteerCarouselCards = () => {
  const carouselData = [
    <VolunteerAnnualSummary simpleMode />,
    <VolunteerCurrentMatches simpleMode />,
    <VolunteerRecentImpacts simpleMode />,
  ];

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState(
    carouselData[currentCardIndex]
  );

  const nextSlide = () => {
    setCurrentCardIndex((prevIndex) => {
      if (prevIndex === carouselData.length - 1) {
        return 0;
      }
      return prevIndex + 1;
    });

    if (currentCardIndex < carouselData.length) {
      setCurrentCard(carouselData[currentCardIndex]);
    }
  };

  const prevSlide = () => {
    setCurrentCardIndex((prevIndex) => {
      if (prevIndex === 0) {
        return carouselData.length - 1;
      }
      return prevIndex - 1;
    });

    if (currentCardIndex >= 0) {
      setCurrentCard(carouselData[currentCardIndex]);
    }
  };

  return (
    <div className={styles.volunteerCarouselCards}>
      <div className={styles.carouselContent}>{currentCard}</div>
      <CarouselButtons prevSlide={prevSlide} nextSlide={nextSlide} />
    </div>
  );
};
