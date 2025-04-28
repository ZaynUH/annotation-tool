import styles from '../styles/AnnotatePage.module.css';

interface ImagePanelsProps {
  images: string[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  selectedTool: 'pen' | 'shape' | 'color';
}

export default function ImagePanels({ images, currentIndex, onPrev, onNext }: ImagePanelsProps) {
  return (
    <div className={styles.imageNavigator}>
      <button className={styles.arrowButton} onClick={onPrev} disabled={currentIndex === 0}>
        &lt;
      </button>

      {/* Left Thumbnail */}
      {images[currentIndex - 1] && (
        <div className={styles.thumbnail}>
          <img src={images[currentIndex - 1]} alt="Previous" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {/* Main Focus Image */}
      <div className={styles.mainImage}>
        {/* Later we'll render canvas here */}
        <img src={images[currentIndex]} alt="Main" className="max-w-full max-h-full object-contain" />
      </div>

      {/* Right Thumbnail */}
      {images[currentIndex + 1] && (
        <div className={styles.thumbnail}>
          <img src={images[currentIndex + 1]} alt="Next" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      <button className={styles.arrowButton} onClick={onNext} disabled={currentIndex === images.length - 1}>
        &gt;
      </button>
    </div>
  );
}
