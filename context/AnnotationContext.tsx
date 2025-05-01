import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';

export type Layer = {
  id: number;
  type: 'pen' | 'arrow' | 'text' | 'shape' | 'line';
  colour: string;
  points: number[];
  name?: string;
};

interface AnnotationContextType {
  images: string[];
  setImages: Dispatch<SetStateAction<string[]>>;
  currentIndex: number;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  layers: Record<number, Layer[]>;
  setLayers: Dispatch<SetStateAction<Record<number, Layer[]>>>;
  activeTool: string;
  setActiveTool: Dispatch<SetStateAction<string>>;
  activeColour: string;
  setActiveColour: Dispatch<SetStateAction<string>>;
}

const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined);

export function AnnotationProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [layers, setLayers] = useState<Record<number, Layer[]>>({});
  const [activeTool, setActiveTool] = useState<string>('pen');
  const [activeColour, setActiveColour] = useState<string>('#000000');

  // Load currentDeck and populate images + annotations
  useEffect(() => {
    const stored = localStorage.getItem('currentDeck');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.images)) {
        setImages(parsed.images);
      }
      if (parsed.annotations) {
        setLayers(parsed.annotations);
      }
    }
  }, []);

  // Automatically save annotations into currentDeck in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('currentDeck');
    if (stored) {
      const deck = JSON.parse(stored);
      deck.annotations = layers;
      localStorage.setItem('currentDeck', JSON.stringify(deck));

      // Optional: update main deck list
      const allDecksRaw = localStorage.getItem('imageDecks');
      if (allDecksRaw) {
        const allDecks = JSON.parse(allDecksRaw);
        const updatedDecks = allDecks.map((d: any) =>
          d.name === deck.name ? { ...deck } : d
        );
        localStorage.setItem('imageDecks', JSON.stringify(updatedDecks));
      }
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
        setActiveColour,
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
