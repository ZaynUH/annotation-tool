import { useAnnotation, Layer } from '../context/AnnotationContext';
import styles from '../styles/AnnotatePage.module.css';

export default function LayersPanel() {
  const { layers, setLayers, currentIndex } = useAnnotation();
  const currentLayers = layers[currentIndex] || [];

  const handleDeleteLayer = (id: number) => {
    const updated: Layer[] = currentLayers.filter(layer => layer.id !== id);
    setLayers(prev => ({
      ...prev,
      [currentIndex]: updated
    }));
  };

  const handleAddLayer = () => {
    const newLayer: Layer = {
      id: Date.now(),
      type: 'pen',
      colour: '#000000',
      points: [],
      name: `Layer ${currentLayers.length + 1}`
    };
    const updated: Layer[] = [...currentLayers, newLayer];
    setLayers(prev => ({
      ...prev,
      [currentIndex]: updated
    }));
  };

  return (
    <div className={styles.layers}>
      <h2>LAYERS</h2>
      {currentLayers.length === 0 && <p style={{ color: '#6b7280' }}>No layers yet</p>}
      {currentLayers.map((layer) => (
        <div key={layer.id} className={styles.layerItem}>
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
