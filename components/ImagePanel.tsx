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
      
      <div className={styles.sidePanel}>
        {hasPrev ? (
          <>
            <button className={styles.arrowButton} onClick={onPrev}>&lt;</button>
            <div className={styles.thumbnail}>
              <img src={images[currentIndex - 1]} alt="Previous" />
            </div>
          </>
        ) : (
          <>
            <div className={styles.arrowSpacer} />
            <div className={styles.thumbnail} />
          </>
        )}
      </div>

      
      <div className={styles.mainImage}>
        {imageUrl && <CanvasAnnotator imageUrl={imageUrl} width={300} height={400} />}
      </div>

      
      <div className={styles.sidePanel}>
        {hasNext ? (
          <>
            <div className={styles.thumbnail}>
              <img src={images[currentIndex + 1]} alt="Next" />
            </div>
            <button className={styles.arrowButton} onClick={onNext}>&gt;</button>
          </>
        ) : (
          <>
            <div className={styles.thumbnail} />
            <div className={styles.arrowSpacer} />
          </>
        )}
      </div>
    </div>
  );
}
