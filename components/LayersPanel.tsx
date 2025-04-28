import styles from '../styles/AnnotatePage.module.css';

interface Layer {
  id: string;
  name: string;
}

interface LayersPanelProps {
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
}

export default function LayersPanel({ layers, setLayers }: LayersPanelProps) {
  const handleDeleteLayer = (id: string) => {
    const newLayers = layers.filter(layer => layer.id !== id);
    setLayers(newLayers);
  };

  return (
    <div className={styles.layers}>
      <h2>LAYERS</h2>
      {layers.length === 0 && <p style={{ color: '#6b7280' }}>No layers yet</p>}
      {layers.map((layer) => (
        <div key={layer.id} className={styles.layerItem}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {layer.name}
            <button onClick={() => handleDeleteLayer(layer.id)} style={{ marginLeft: '8px', color: 'red' }}>
              ✖
            </button>
          </div>
        </div>
      ))}
      <button
        style={{ marginTop: '1rem', backgroundColor: '#d1d5db', padding: '0.5rem', borderRadius: '4px' }}
        onClick={() =>
          setLayers(prev => [...prev, { id: Math.random().toString(36).substring(7), name: `Layer ${prev.length + 1}` }])
        }
      >
        + Add Layer
      </button>
    </div>
  );
}
