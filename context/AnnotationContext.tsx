import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Layer = {
  id: number;
  type: 'pen' | 'arrow' | 'text' | 'shape' | 'line';
  colour: string;
  points: number[];
  name?: string;
};

interface AnnotationContextType {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  layers: Record<number, Layer[]>;
  setLayers: React.Dispatch<React.SetStateAction<Record<number, Layer[]>>>;
  activeTool: string;
  setActiveTool: React.Dispatch<React.SetStateAction<string>>;
  activeColour: string;
  setActiveColour: React.Dispatch<React.SetStateAction<string>>;
}

const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined);

export function AnnotationProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [layers, setLayers] = useState<Record<number, Layer[]>>({});
  const [activeTool, setActiveTool] = useState<string>('pen');
  const [activeColour, setActiveColour] = useState<string>('#000000');

  // Load layers from localStorage on mount
  useEffect(() => {
    const currentDeck = localStorage.getItem('currentDeck');
    if (currentDeck) {
      const parsed = JSON.parse(currentDeck);
      const savedLayers = localStorage.getItem(`layers_${parsed.name}`);
      if (savedLayers) {
        setLayers(JSON.parse(savedLayers));
      } else {
        setLayers({});
      }
    }
  }, []);

  // Save layers when they change
  useEffect(() => {
    const currentDeck = localStorage.getItem('currentDeck');
    if (currentDeck) {
      const parsed = JSON.parse(currentDeck);
      localStorage.setItem(`layers_${parsed.name}`, JSON.stringify(layers));
    }
  }, [layers]);

  return (
    <AnnotationContext.Provider
      value={{
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
      }}
    >
      {children}
    </AnnotationContext.Provider>
  );
}

export function useAnnotation() {
  const context = useContext(AnnotationContext);
  if (!context) {
    throw new Error('useAnnotation must be used inside an AnnotationProvider');
  }
  return context;
}
