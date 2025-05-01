import { useEffect } from 'react';
import Toolbar from '../components/Toolbar';
import ToolsPanel from '../components/ToolsPanel';
import ImagePanel from '../components/ImagePanel';
import LayersPanel from '../components/LayersPanel';
import { useAnnotation } from '../context/AnnotationContext';
import styles from '../styles/AnnotatePage.module.css';

export default function AnnotatePage() {
  const {
    images,
    setImages,
    currentIndex,
    setCurrentIndex,
    layers,
    setLayers,
    activeTool,
    setActiveTool,
  } = useAnnotation();

  useEffect(() => {
    const currentDeck = localStorage.getItem('currentDeck');
    if (currentDeck) {
      const parsed = JSON.parse(currentDeck);
      if (parsed.images?.length) {
        setImages(parsed.images);
        setCurrentIndex(0);
      }
    }
  }, []);

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const currentLayers = layers[currentIndex] || [];

  const updateLayers = (updated: any[]) => {
    setLayers(prev => ({
      ...prev,
      [currentIndex]: updated,
    }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <div className={styles.toolbarStrip}>
          <span className={`${styles.tab} ${styles.active}`}>Annotate Mode</span>
        </div>
        <ToolsPanel selectedTool={activeTool} setSelectedTool={setActiveTool} />
        <div className={styles.workspace}>
          <ImagePanel
            images={images}
            currentIndex={currentIndex}
            onPrev={handlePrev}
            onNext={handleNext}
            selectedTool={activeTool}
          />
          <LayersPanel/>
        </div>
      </div>
    </div>
  );
}
