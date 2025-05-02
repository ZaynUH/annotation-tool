import React from 'react';
import { useAnnotation, Layer as LayerType } from '../context/AnnotationContext';
import styles from '../styles/AnnotatePage.module.css';

interface LayersPanelProps {
  layers: LayerType[];
  setLayers: (updated: LayerType[]) => void;
}

export default function LayersPanel({ layers, setLayers }: LayersPanelProps) {
  const {
    selectedId,
    setSelectedId,
    setActiveTool
  } = useAnnotation();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setLayers(layers.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className={styles.layers}>
      <h2>LAYERS</h2>
      {layers.length === 0 && <p style={{ color: '#6b7280' }}>No layers yet</p>}
      {layers.map((layer) => (
        <div
          key={layer.id}
          className={
            layer.id === selectedId
              ? `${styles.layerItem} ${styles.layerItemSelected}`
              : styles.layerItem
          }
          onClick={() => {
            setActiveTool('select');
            setSelectedId(layer.id);
          }}
        >
          <span>{layer.name || layer.type}</span>
          <button
            onClick={(e) => handleDelete(e, layer.id)}
            style={{ marginLeft: 'auto', color: 'red', background: 'none', border: 'none' }}
          >
            ✖
          </button>
        </div>
      ))}
      {/* note: we removed the “+ Add Layer” button per your request */}
    </div>
  );
}
