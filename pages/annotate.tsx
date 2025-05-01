import { useEffect, useRef } from 'react';
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
    activeColour,
    setActiveColour
  } = useAnnotation();

  // Store the current deck name so we can persist to localStorage
  const deckNameRef = useRef<string | null>(null);

  // Load deck + layers on mount
  useEffect(() => {
    const currentDeck = localStorage.getItem('currentDeck');
    if (currentDeck) {
      const parsed = JSON.parse(currentDeck);
      if (parsed.images?.length) {
        setImages(parsed.images);
        setCurrentIndex(0);
        deckNameRef.current = parsed.name;

        const savedLayers = localStorage.getItem(`layers_${parsed.name}`);
        if (savedLayers) {
          setLayers(JSON.parse(savedLayers));
        } else {
          setLayers({});
        }
      }
    }
  }, []);

  // Persist layers to localStorage whenever they change
  useEffect(() => {
    if (deckNameRef.current) {
      localStorage.setItem(`layers_${deckNameRef.current}`, JSON.stringify(layers));
    }
  }, [layers]);

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const currentLayers = layers[currentIndex] || [];

  const updateLayers = (updated: any[]) => {
    setLayers((prev) => ({
      ...prev,
      [currentIndex]: updated,
    }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <div className={styles.toolbarStrip}>
          <Toolbar />
        </div>
        <ToolsPanel
          selectedTool={activeTool}
          setSelectedTool={setActiveTool}
          activeColour={activeColour}
          setActiveColour={setActiveColour}
        />
        <div className={styles.workspace}>
          <ImagePanel
            images={images}
            currentIndex={currentIndex}
            onPrev={handlePrev}
            onNext={handleNext}
            selectedTool={activeTool}
          />
          <LayersPanel
            layers={currentLayers}
            setLayers={updateLayers}
          />
        </div>
      </div>
    </div>
  );
}
