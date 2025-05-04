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

      <div className={styles.imageRow}>
        <div className={styles.imageBoxSmall}>
          {hasPrev ? <img src={images[currentIndex - 1]} alt="Previous" /> : null}
        </div>

        <div className={styles.imageBoxLarge}>
          {imageUrl && <CanvasAnnotator imageUrl={imageUrl} width={450} height={600} />}
        </div>

        <div className={styles.imageBoxSmall}>
          {hasNext ? <img src={images[currentIndex + 1]} alt="Next" /> : null}
        </div>
      </div>
    </div>
  );
}
