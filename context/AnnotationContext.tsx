import { createContext, useContext, useState } from 'react';

type Layer = {
  id: number;
  type: 'pen' | 'arrow' | 'text' | 'shape';
  color: string;
  data: any;
};

interface AnnotationContextType {
  images: string[];
  setImages: (images: string[]) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  layers: Record<number, Layer[]>;
  setLayers: (layers: Record<number, Layer[]>) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
}

const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined);

export function AnnotationProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [layers, setLayers] = useState<Record<number, Layer[]>>({});
  const [activeTool, setActiveTool] = useState('pen');
  const [activeColor, setActiveColor] = useState('#000000');

  return (
    <AnnotationContext.Provider value={{
      images, setImages,
      currentIndex, setCurrentIndex,
      layers, setLayers,
      activeTool, setActiveTool,
      activeColor, setActiveColor
    }}>
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
