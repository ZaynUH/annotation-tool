import styles from '../styles/AnnotatePage.module.css';

interface ToolsPanelProps {
  selectedTool: 'pen' | 'shape' | 'color';
  setSelectedTool: (tool: 'pen' | 'shape' | 'color') => void;
}

export default function ToolsPanel({ selectedTool, setSelectedTool }: ToolsPanelProps) {
  return (
    <div className={styles.toolsWrapper}>
      <div className={styles.tools}>
        <button
          className={`${styles.toolButton} ${selectedTool === 'pen' ? styles.activeTool : ''}`}
          onClick={() => setSelectedTool('pen')}
        >
          🖊️ Pen
        </button>
        <button
          className={`${styles.toolButton} ${selectedTool === 'shape' ? styles.activeTool : ''}`}
          onClick={() => setSelectedTool('shape')}
        >
          ◯ Shape
        </button>
        <button
          className={`${styles.toolButton} ${selectedTool === 'color' ? styles.activeTool : ''}`}
          onClick={() => setSelectedTool('color')}
        >
          🎨 Color
        </button>
      </div>
    </div>
  );
}
