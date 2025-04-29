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
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  return (
    <div className={styles.imageNavigator}>
      {/* LEFT SIDE */}
      <div className={styles.sidePanel}>
        <button
          className={styles.arrowButton}
          onClick={onPrev}
          disabled={!hasPrev}
          style={{ visibility: hasPrev ? 'visible' : 'hidden' }}
        >
          &lt;
        </button>
        <div className={styles.thumbnail}>
          {hasPrev && <img src={images[currentIndex - 1]} alt="Previous" />}
        </div>
      </div>

      {/* MAIN IMAGE */}
      <div className={styles.mainImage}>
        {imageUrl && <CanvasAnnotator imageUrl={imageUrl} width={300} height={400} />}
      </div>

      {/* RIGHT SIDE */}
      <div className={styles.sidePanel}>
        <div className={styles.thumbnail}>
          {hasNext && <img src={images[currentIndex + 1]} alt="Next" />}
        </div>
        <button
          className={styles.arrowButton}
          onClick={onNext}
          disabled={!hasNext}
          style={{ visibility: hasNext ? 'visible' : 'hidden' }}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
