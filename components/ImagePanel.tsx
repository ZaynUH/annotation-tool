import dynamic from 'next/dynamic';
import styles from '../styles/AnnotatePage.module.css';

const CanvasAnnotator = dynamic(() => import('./CanvasAnnotator'), { ssr: false });

interface ImagePanelsProps {
  images: string[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  selectedTool: string;
}

export default function ImagePanel({ images, currentIndex, onPrev, onNext }: ImagePanelsProps) {
  const imageUrl = images[currentIndex];

  return (
    <div className={styles.imageNavigator}>
      <button className={styles.arrowButton} onClick={onPrev} disabled={currentIndex === 0}>
        &lt;
      </button>

      {images[currentIndex - 1] && (
        <div className={styles.thumbnail}>
          <img src={images[currentIndex - 1]} alt="Previous" />
        </div>
      )}

      <div className={styles.mainImage}>
        {imageUrl && <CanvasAnnotator imageUrl={imageUrl} width={300} height={400} />}
      </div>

      {images[currentIndex + 1] && (
        <div className={styles.thumbnail}>
          <img src={images[currentIndex + 1]} alt="Next" />
        </div>
      )}

      <button className={styles.arrowButton} onClick={onNext} disabled={currentIndex === images.length - 1}>
        &gt;
      </button>
    </div>
  );
}
