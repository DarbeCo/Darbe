import styles from "./styles/volunteerStats.module.css";

interface CarouselButtonsProps {
  nextSlide: () => void;
  prevSlide: () => void;
}

export const CarouselButtons = ({
  nextSlide,
  prevSlide,
}: CarouselButtonsProps) => {
  return (
    <div className={styles.carouselButtons}>
      <button onClick={prevSlide} className={styles.carouselButton}>
        {"<"}
      </button>
      <button onClick={nextSlide} className={styles.carouselButton}>
        {">"}
      </button>
    </div>
  );
};
