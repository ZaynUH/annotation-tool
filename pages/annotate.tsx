import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import ToolsPanel from '../components/ToolsPanel';
import ImagePanel from '../components/ImagePanel';
import LayersPanel from '../components/LayersPanel';
import { useAnnotation } from '../context/AnnotationContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { saveLayersForImage } from '../lib/layers';
import styles from '../styles/AnnotatePage.module.css';
import { useRouter } from 'next/router';

export default function AnnotatePage() 
{
  const 
  {
    // Constructors and Methods Passed from Context For annotating
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
    fontSize,
    setFontSize,
    undo,
    canUndo,
    redo,  
    canRedo,
  } = useAnnotation();

  // Constructors and Methods
  const { user } = useUser();
  const router = useRouter();
  const deckNameRef = useRef<string | null>(null);
  const currentDeck = useRef<any>(null);
  const [loadedImageIds, setLoadedImageIds] = useState<Set<string>>(new Set());
  const [initialLayers, setInitialLayers] = useState<Record<number, any[]>>({});


  // Load deck and images
  useEffect(() => 
  {
    const storedDeck = localStorage.getItem('currentDeck');
    if (storedDeck) 
    {
      // Store Deck info
      const parsed = JSON.parse(storedDeck);
      currentDeck.current = parsed;
      deckNameRef.current = parsed.name;

      if (parsed.images?.length) 
      {
        setImages(parsed.images);
        setCurrentIndex(0);

        // For guests load layers from LocalStorage
        if (!user) 
        {
          const savedLayers = localStorage.getItem(`layers_${parsed.name}`);
          if (savedLayers) 
          {
            const parsedLayers = JSON.parse(savedLayers);
            setLayers(parsedLayers);
            setInitialLayers(parsedLayers);
          }
        }
      }
    }
  }, [user]);

  // For guests persist changes to LocalStorage for when switching to export tab and back
  useEffect(() => 
  {
    if (deckNameRef.current && !user) 
    {
      localStorage.setItem(`layers_${deckNameRef.current}`, JSON.stringify(layers));
    }
  }, [layers, user]);

  // Load layers for the current image from the database
  useEffect(() => 
  {
    const loadFromDB = async () => 
    {
      // Cannot access database storage if not logged in
      if (!user || !currentDeck.current) return;

      const imageUrl = images[currentIndex];
      if (!imageUrl || loadedImageIds.has(imageUrl)) return;

      const imagePath = imageUrl.split('/').pop(); // extract just the filename

      // Get Current saved Deck and Image data
      const { data: imageData, error: fetchError } = await supabase
        .from('images')
        .select('id')
        .eq('deck_id', currentDeck.current.id)
        .eq('image_url', imagePath)
        .single();

      if (fetchError || !imageData) 
      {
        console.warn('Image not found in DB:', fetchError);
        return;
      }

      // Get Current saved Layer data
      const { data: layerData, error: layerError } = await supabase
        .from('layers')
        .select('*')
        .eq('image_id', imageData.id);

      if (layerError) 
      {
        console.warn('Could not fetch layers:', layerError);
        return;
      }

      // Note: I seen somewhere where using }; will ensure no type erorrs will occur just in case
      const parsedLayers = layerData.map((layer) => (
      {
        id: Date.now() + Math.random(), // Ensure unique id
        type: layer.type,
        colour: layer.colour,
        points: layer.points,
      }));

      setLayers((prev) => (
      {
        ...prev,
        [currentIndex]: parsedLayers,
      }));

      setInitialLayers((prev) => (
      {
        ...prev,
        [currentIndex]: parsedLayers,
      }));

      setLoadedImageIds((prev) => new Set(prev).add(imageUrl));
    };

    loadFromDB();
  }, [user, currentIndex, images]);

  // Image Counter
  const handlePrev = () => 
  {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => 
  {
    if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
  };

  // Layers Output
  const currentLayers = layers[currentIndex] || [];

  const updateLayers = (updated: any[]) => 
  {
    setLayers((prev) => (
    {
      ...prev,
      [currentIndex]: updated,
    }));
  };

  const handleSave = async () => 
  {
    if (!user || !currentDeck.current) return;

    const imageUrl = images[currentIndex];
    const imagePath = imageUrl.split('/').pop();

    const { data: imageData, error: fetchError } = await supabase
      .from('images')
      .select('id')
      .eq('deck_id', currentDeck.current.id)
      .eq('image_url', imagePath)
      .single();

    if (fetchError || !imageData) 
    {
      alert('Could not find image in database.');
      return;
    }

    const { error: saveError } = await saveLayersForImage(imageData.id, currentLayers);
    if (saveError) 
    {
      alert('Failed to save annotations.');
    } 
    else 
    {
      alert('Annotations saved successfully!');
      setInitialLayers((prev) => (
      {
        ...prev,
        [currentIndex]: currentLayers,
      }));
    }
  };

  // Handle save/discard prompt when navigating away
  const handleTabSwitch = async (path: string) => 
  {
    // Only guard navigation when going to /upload
    if (path === '/upload') 
    {
      const hasUnsavedChanges =
        JSON.stringify(initialLayers[currentIndex]) !== JSON.stringify(currentLayers);
  
      if (hasUnsavedChanges) 
      {
        if (user) 
        {
          const confirmSave = confirm('You have unsaved changes. Do you want to save before leaving?');
          if (confirmSave) await handleSave();
        } 
        else 
        {
          const confirmLeave = confirm(
            'You are not logged in. Leaving this page will lose all unsaved annotations.\n\nAre you sure you want to leave?'
          );
          if (!confirmLeave) return;
        }
      }
    }
    // Navigate to destination
    router.push(path);
  };
  

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <div className={styles.toolbarStrip}>
          <Navbar onSwitchTab={handleTabSwitch}/> {/* Handles save/discard logic before navigating */}
        </div>
        <ToolsPanel
          selectedTool={activeTool}
          setSelectedTool={setActiveTool}
          activeColour={activeColour}
          setActiveColour={setActiveColour}
          fontSize={fontSize}
          setFontSize={setFontSize} 
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
