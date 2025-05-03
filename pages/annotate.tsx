import { useEffect, useRef, useState } from 'react';
import Toolbar from '../components/Toolbar';
import ToolsPanel from '../components/ToolsPanel';
import ImagePanel from '../components/ImagePanel';
import LayersPanel from '../components/LayersPanel';
import { useAnnotation } from '../context/AnnotationContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { saveLayersForImage } from '../lib/layers';
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
    setActiveColour,
    undo,
    canUndo,
    redo,  
    canRedo,
  } = useAnnotation();

  const { user } = useUser();
  const deckNameRef = useRef<string | null>(null);
  const currentDeck = useRef<any>(null);
  const [loadedImageIds, setLoadedImageIds] = useState<Set<string>>(new Set());

  // Load deck and images
  useEffect(() => {
    const storedDeck = localStorage.getItem('currentDeck');
    if (storedDeck) {
      const parsed = JSON.parse(storedDeck);
      currentDeck.current = parsed;
      deckNameRef.current = parsed.name;

      if (parsed.images?.length) {
        setImages(parsed.images);
        setCurrentIndex(0);

        // For guests, load layers from localStorage
        if (!user) {
          const savedLayers = localStorage.getItem(`layers_${parsed.name}`);
          if (savedLayers) {
            setLayers(JSON.parse(savedLayers));
          }
        }
      }
    }
  }, [user]);

  // For guests: persist changes to localStorage
  useEffect(() => {
    if (deckNameRef.current && !user) {
      localStorage.setItem(`layers_${deckNameRef.current}`, JSON.stringify(layers));
    }
  }, [layers, user]);

  // Load layers for the current image from the database
  useEffect(() => {
    const loadFromDB = async () => {
      if (!user || !currentDeck.current) return;

      const imageUrl = images[currentIndex];
      if (!imageUrl || loadedImageIds.has(imageUrl)) return;

      const imagePath = imageUrl.split('/').pop(); // extract just the filename

      const { data: imageData, error: fetchError } = await supabase
        .from('images')
        .select('id')
        .eq('deck_id', currentDeck.current.id)
        .eq('image_url', imagePath)
        .single();

      if (fetchError || !imageData) {
        console.warn('Image not found in DB:', fetchError);
        return;
      }

      const { data: layerData, error: layerError } = await supabase
        .from('layers')
        .select('*')
        .eq('image_id', imageData.id);

      if (layerError) {
        console.warn('Could not fetch layers:', layerError);
        return;
      }

      const parsedLayers = layerData.map((layer) => ({
        id: Date.now() + Math.random(), // Ensure unique id
        type: layer.type,
        colour: layer.colour,
        points: layer.points,
      }));

      setLayers((prev) => ({
        ...prev,
        [currentIndex]: parsedLayers,
      }));

      setLoadedImageIds((prev) => new Set(prev).add(imageUrl));
    };

    loadFromDB();
  }, [user, currentIndex, images]);

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

  const handleSave = async () => {
    if (!user || !currentDeck.current) return;

    const imageUrl = images[currentIndex];
    const imagePath = imageUrl.split('/').pop();

    const { data: imageData, error: fetchError } = await supabase
      .from('images')
      .select('id')
      .eq('deck_id', currentDeck.current.id)
      .eq('image_url', imagePath)
      .single();

    if (fetchError || !imageData) {
      alert('Could not find image in database.');
      return;
    }

    const { error: saveError } = await saveLayersForImage(imageData.id, currentLayers);
    if (saveError) {
      alert('Failed to save annotations.');
    } else {
      alert('Annotations saved successfully!');
    }
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
          onSave={handleSave}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
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
