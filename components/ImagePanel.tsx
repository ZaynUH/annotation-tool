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
    <div className={styles.imagePanelContainer}>
      {/* Image count and arrows above */}
      <div className={styles.imageControls}>
        <button onClick={onPrev} disabled={!hasPrev} className={styles.controlArrow}>
          &lt;
        </button>
        <span className={styles.imageCount}>
          {currentIndex + 1} / {images.length}
        </span>
        <button onClick={onNext} disabled={!hasNext} className={styles.controlArrow}>
          &gt;
        </button>
      </div>

      {/* Image layout row */}
      <div className={styles.imageRow}>
        {/* Left thumbnail (only if previous image exists) */}
        <div className={styles.imageBoxSmall}>
          {hasPrev ? <img src={images[currentIndex - 1]} alt="Previous" /> : null}
        </div>

        {/* Main image */}
        <div className={styles.imageBoxLarge}>
          {imageUrl && <CanvasAnnotator imageUrl={imageUrl}/>}
        </div>

        {/* Right thumbnail (only if next image exists) */}
        <div className={styles.imageBoxSmall}>
          {hasNext ? <img src={images[currentIndex + 1]} alt="Next" /> : null}
        </div>
      </div>
    </div>
  );
}
