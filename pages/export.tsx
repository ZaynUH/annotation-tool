import { useEffect, useRef, useState } from 'react';
import Toolbar from '../components/Toolbar';
import styles from '../styles/ExportPage.module.css';
import { Layer } from '../context/AnnotationContext';
import { Stage, Layer as KonvaLayer, Image as KonvaImage, Line, Arrow, Rect, Circle } from 'react-konva';
import useImage from 'use-image';

interface AnnotatedImageProps {
  imageUrl: string;
  layers: Layer[];
  width: number;
  height: number;
  onRender: (url: string) => void;
}

function AnnotatedImage({ imageUrl, layers, width, height, onRender }: AnnotatedImageProps) {
  const [bgImage] = useImage(imageUrl);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL();
      onRender(uri);
    }
  }, [bgImage, layers]);

  return (
    <Stage width={width} height={height} ref={stageRef}>
      <KonvaLayer>
        {bgImage && (
          <KonvaImage image={bgImage} width={width} height={height} listening={false} />
        )}
        {layers.map((layer) => {
          const { id, type, points, colour } = layer;
          switch (type) {
            case 'pen':
            case 'line':
              return (
                <Line
                  key={id}
                  points={points}
                  stroke={colour}
                  strokeWidth={2}
                  lineCap="round"
                />
              );
            case 'arrow':
              return (
                <Arrow
                  key={id}
                  points={points}
                  stroke={colour}
                  fill={colour}
                  strokeWidth={2}
                />
              );
            case 'rectangle':
              return (
                <Rect
                  key={id}
                  x={points[0]}
                  y={points[1]}
                  width={points[2]}
                  height={points[3]}
                  stroke={colour}
                  strokeWidth={2}
                />
              );
            case 'circle':
              return (
                <Circle
                  key={id}
                  x={points[0]}
                  y={points[1]}
                  radius={points[2]}
                  stroke={colour}
                  strokeWidth={2}
                />
              );
            default:
              return null;
          }
        })}
      </KonvaLayer>
    </Stage>
  );
}

export default function ExportPage() {
  const [deck, setDeck] = useState<{ name: string; images: string[] } | null>(null);
  const [layers, setLayers] = useState<Record<number, Layer[]>>({});
  const [annotatedUrls, setAnnotatedUrls] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const currentDeck = localStorage.getItem('currentDeck');
    if (currentDeck) {
      const parsed = JSON.parse(currentDeck);
      setDeck(parsed);
      const savedLayers = localStorage.getItem(`layers_${parsed.name}`);
      if (savedLayers) {
        setLayers(JSON.parse(savedLayers));
      }
    }
  }, []);

  const handleToggle = (url: string) => {
    setSelected((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleExport = () => {
    selected.forEach((dataUrl, index) => {
      const link = document.createElement('a');
      link.download = `annotated_image_${index + 1}.png`;
      link.href = dataUrl;
      link.click();
    });
  };

  const handleRender = (index: number, uri: string) => {
    setAnnotatedUrls((prev) => {
      const copy = [...prev];
      copy[index] = uri;
      return copy;
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Export Annotated Images</h1>
        <Toolbar />

        {deck && (
          <>
            <h2 className={styles.subtitle}>{deck.name}</h2>
            <div className={styles.grid}>
              {deck.images.map((imageUrl, index) => (
                <div
                  key={index}
                  className={`${styles.gridItem} ${
                    selected.includes(annotatedUrls[index]) ? styles.selected : ''
                  }`}
                  onClick={() => handleToggle(annotatedUrls[index])}
                >
                  <AnnotatedImage
                    imageUrl={imageUrl}
                    layers={layers[index] || []}
                    width={150}
                    height={200}
                    onRender={(uri) => handleRender(index, uri)}
                  />
                </div>
              ))}
            </div>

            {selected.length > 0 && (
              <button className={styles.exportButton} onClick={handleExport}>
                Export {selected.length} Image{selected.length > 1 ? 's' : ''}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
