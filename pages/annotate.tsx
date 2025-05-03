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
    setActiveColour
  } = useAnnotation();

  const { user } = useUser();
  const deckNameRef = useRef<string | null>(null);
  const currentDeck = useRef<any>(null);
  const [loadedImageIds, setLoadedImageIds] = useState<Set<string>>(new Set());

  const BUCKET = 'images';
  const PROJECT_URL = 'https://sflyeuxvdpndrwuofgqb.supabase.co';

  // Load deck and images
  useEffect(() => {
    const storedDeck = localStorage.getItem('currentDeck');
    if (storedDeck) {
      const parsed = JSON.parse(storedDeck);
      currentDeck.current = parsed;
      deckNameRef.current = parsed.name;

      if (parsed.images?.length) {
        const imagePaths = parsed.images.map((path: string) => {
          // Guests have local blob URLs; users have Supabase file names
          return path.startsWith('blob:')
            ? path
            : `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/${path}`;
        });

        setImages(imagePaths);
        setCurrentIndex(0);

        if (!user) {
          const savedLayers = localStorage.getItem(`layers_${parsed.name}`);
          if (savedLayers) {
            setLayers(JSON.parse(savedLayers));
          }
        }
      }
    }
  }, [user]);

  // Persist to localStorage only for guests
  useEffect(() => {
    if (deckNameRef.current && !user) {
      localStorage.setItem(`layers_${deckNameRef.current}`, JSON.stringify(layers));
    }
  }, [layers, user]);

  // Load annotations from DB for current image if logged in
  useEffect(() => {
    const loadFromDB = async () => {
      if (!user || !currentDeck.current) return;

      const imageUrl = images[currentIndex];
      if (!imageUrl || loadedImageIds.has(imageUrl)) return;

      const storageFilePath = imageUrl.split('/').pop(); // Get just filename

      const { data: imageData, error } = await supabase
        .from('images')
        .select('id')
        .eq('deck_id', currentDeck.current.id)
        .eq('image_url', storageFilePath)
        .single();

      if (error || !imageData) {
        console.warn('Image not found in DB:', error);
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

      const parsed = layerData.map((layer) => ({
        id: Date.now() + Math.random(),
        type: layer.type,
        colour: layer.colour,
        points: layer.points,
      }));

      setLayers((prev) => ({
        ...prev,
        [currentIndex]: parsed,
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
    if (!user) return;

    const imageUrl = images[currentIndex];
    const deckId = currentDeck.current?.id;
    const storageFilePath = imageUrl.split('/').pop();

    const { data: imageData, error: fetchError } = await supabase
      .from('images')
      .select('id')
      .eq('deck_id', deckId)
      .eq('image_url', storageFilePath)
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
