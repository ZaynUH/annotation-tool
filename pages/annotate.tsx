import Toolbar from '../components/Toolbar';
import ToolsPanel from '../components/ToolsPanel';
import ImagePanel from '../components/ImagePanel';
import LayersPanel from '../components/LayersPanel';
import { useAnnotation } from '../context/AnnotationContext';
import styles from '../styles/AnnotatePage.module.css';

export default function AnnotatePage() {
  const {
    images,
    currentIndex,
    setCurrentIndex,
    activeTool,
    setActiveTool,
  } = useAnnotation();

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(images.length - 1, prev + 1));
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <Toolbar />
        <ToolsPanel selectedTool={activeTool} setSelectedTool={setActiveTool} />
        <div className={styles.workspace}>
          <ImagePanel
            images={images}
            currentIndex={currentIndex}
            onPrev={handlePrev}
            onNext={handleNext}
            selectedTool={activeTool}
          />
          <LayersPanel />
        </div>
      </div>
    </div>
  );
}
