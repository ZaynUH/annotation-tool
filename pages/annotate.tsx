import { useState } from 'react';
import Toolbar from '../components/Toolbar';
import ToolsPanel from '../components/ToolsPanel';
import ImagePanels from '../components/ImagePanels';
import LayersPanel from '../components/LayersPanel';
import styles from '../styles/AnnotatePage.module.css';

const dummyImages = [
  '/sample1.jpg',
  '/sample2.jpg',
  '/sample3.jpg',
];

export default function AnnotatePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTool, setSelectedTool] = useState<'pen' | 'shape' | 'color'>('pen');
  const [layers, setLayers] = useState<any[]>([]);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(dummyImages.length - 1, prev + 1));
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <Toolbar />
        <ToolsPanel selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
        <div className={styles.workspace}>
          <ImagePanels
            images={dummyImages}
            currentIndex={currentIndex}
            onPrev={handlePrev}
            onNext={handleNext}
            selectedTool={selectedTool}
          />
          <LayersPanel layers={layers} setLayers={setLayers} />
        </div>
      </div>
    </div>
  );
}
