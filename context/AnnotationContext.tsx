import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction
} from 'react';

export type Layer = {
  id: number;
  type: 'pen' | 'line' | 'arrow' | 'circle' | 'rectangle';
  colour: string;
  points: number[];
  name?: string;
};

export interface AnnotationContextType {
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
  /** NEW */
  selectedId: number | null;
  setSelectedId: Dispatch<SetStateAction<number | null>>;
}

const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined);

export function AnnotationProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [layers, setLayers] = useState<Record<number, Layer[]>>({});
  const [activeTool, setActiveTool] = useState<string>('pen');
  const [activeColour, setActiveColour] = useState<string>('#000000');
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
        selectedId,
        setSelectedId
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
