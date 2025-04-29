import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

// Define a Layer type
export type Layer = {
  id: number;
  type: 'pen' | 'arrow' | 'text' | 'shape';
  color: string;
  data: any;
};

// Define the shape of our context
interface AnnotationContextType {
  images: string[];
  setImages: Dispatch<SetStateAction<string[]>>;
  currentIndex: number;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  layers: Record<number, Layer[]>;
  setLayers: Dispatch<SetStateAction<Record<number, Layer[]>>>;
  activeTool: string;
  setActiveTool: Dispatch<SetStateAction<string>>;
  activeColor: string;
  setActiveColor: Dispatch<SetStateAction<string>>;
}

// Create the context
const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined);

// Context provider component
export function AnnotationProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [layers, setLayers] = useState<Record<number, Layer[]>>({});
  const [activeTool, setActiveTool] = useState<string>('pen');
  const [activeColor, setActiveColor] = useState<string>('#000000');

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
        activeColor,
        setActiveColor
      }}
    >
      {children}
    </AnnotationContext.Provider>
  );
}

// Hook to access context
export function useAnnotation() {
  const context = useContext(AnnotationContext);
  if (!context) {
    throw new Error('useAnnotation must be used inside an AnnotationProvider');
  }
  return context;
}
