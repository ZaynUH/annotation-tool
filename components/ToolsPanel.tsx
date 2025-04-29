import styles from '../styles/AnnotatePage.module.css';

interface ToolsPanelProps {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
}

export default function ToolsPanel({ selectedTool, setSelectedTool }: ToolsPanelProps) {
  return (
    <div className={styles.toolsWrapper}>
      <div className={styles.tools}>
        {['pen', 'shape', 'line', 'colour'].map(tool => (
          <button
            key={tool}
            className={`${styles.toolButton} ${selectedTool === tool ? styles.activeTool : ''}`}
            onClick={() => setSelectedTool(tool)}
          >
            {tool}
          </button>
        ))}
      </div>
    </div>
  );
}
