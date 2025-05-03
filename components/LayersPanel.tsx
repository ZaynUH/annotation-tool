import React from 'react';
import { useAnnotation, Layer as LayerType } from '../context/AnnotationContext';
import styles from '../styles/AnnotatePage.module.css';

interface LayersPanelProps {
  layers: LayerType[];
  setLayers: (updated: LayerType[]) => void;
}

const Preview = ({ layer }: { layer: LayerType }) => {
  const size = 32;
  const style = {
    width: size,
    height: size,
    border: '1px solid #000',
    display: 'inline-block',
    marginRight: 8,
    background: '#fff',
  };

  const renderShape = () => {
    const [x, y, w, h] = layer.points;
    const svgProps = {
      stroke: layer.colour,
      strokeWidth: 2,
      fill: 'transparent',
    };

    switch (layer.type) {
      case 'rectangle':
        return <rect x={4} y={4} width={24} height={24} {...svgProps} />;
      case 'circle':
        return <ellipse cx={16} cy={16} rx={12} ry={12} {...svgProps} />;
      case 'ellipse':
        return <ellipse cx={16} cy={16} rx={12} ry={8} {...svgProps} />;
      case 'line':
        return <line x1={4} y1={28} x2={28} y2={4} {...svgProps} />;
      case 'arrow':
        return (
          <>
            <line x1={4} y1={28} x2={28} y2={4} {...svgProps} />
            <polygon points="24,4 28,4 28,8" fill={layer.colour} />
          </>
        );
      case 'pen':
        return (
        <>
          <line x1={4} y1={28} x2={28} y2={4} {...svgProps} />
          <polygon points="24,4 28,4 28,8" fill={layer.colour} stroke="none" />
        </>
        );
        
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 32 32" style={style}>
      {renderShape()}
    </svg>
  );
};

export default function LayersPanel({ layers, setLayers }: LayersPanelProps) {
  const { selectedId, setSelectedId, setActiveTool } = useAnnotation();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setLayers(layers.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className={styles.layers}>
      <h2>LAYERS</h2>
      <div className={styles.layerHeader}>
        <span>X</span>
        <span>Y</span>
        <span>Deg</span>
      </div>
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
          <Preview layer={layer} />
          <span>{layer.name || layer.type}</span>
          <button
            onClick={(e) => handleDelete(e, layer.id)}
            style={{
              marginLeft: 'auto',
              color: 'red',
              background: 'none',
              border: 'none',
              fontWeight: 'bold',
            }}
          >
            ✖
          </button>
        </div>
      ))}
    </div>
  );
}
