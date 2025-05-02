import { useAnnotation, Layer as LayerType } from '../context/AnnotationContext';
import styles from '../styles/AnnotatePage.module.css';
import { useState } from 'react';

interface LayersPanelProps {
  layers: LayerType[];
  setLayers: (updated: LayerType[]) => void;
}

export default function LayersPanel({ layers, setLayers }: LayersPanelProps) {
  const { activeTool, setActiveTool } = useAnnotation();
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);

  const handleDeleteLayer = (id: number) => {
    const updated = layers.filter(layer => layer.id !== id);
    setLayers(updated);
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const handleAddLayer = () => {
    const newLayer: LayerType = {
      id: Date.now(),
      type: 'pen',
      colour: '#000000',
      points: [],
      name: `Layer ${layers.length + 1}`
    };
    setLayers([...layers, newLayer]);
  };

  const handleSelect = (id: number) => {
    setSelectedLayerId(id);
    setActiveTool('select');
  };

  return (
    <div className={styles.layers}>
      <h2>LAYERS</h2>
      {layers.length === 0 && <p style={{ color: '#6b7280' }}>No layers yet</p>}
      {layers.map((layer) => (
        <div
          key={layer.id}
          className={`${styles.layerItem} ${selectedLayerId === layer.id ? styles.layerItemSelected : ''}`}
          onClick={() => handleSelect(layer.id)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {layer.name || layer.type}
            <button onClick={() => handleDeleteLayer(layer.id)} style={{ marginLeft: '8px', color: 'red' }}>
              ✖
            </button>
          </div>
        </div>
      ))}
      <button
        style={{ marginTop: '1rem', backgroundColor: '#d1d5db', padding: '0.5rem', borderRadius: '4px' }}
        onClick={handleAddLayer}
      >
        + Add Layer
      </button>
    </div>
  );
}
