import styles from '../styles/AnnotatePage.module.css';

interface ToolsPanelProps {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  activeColour: string;
  setActiveColour: (colour: string) => void;
}

export default function ToolsPanel({
  selectedTool,
  setSelectedTool,
  activeColour,
  setActiveColour
}: ToolsPanelProps) {
  return (
    <div className={styles.toolsWrapper}>
      <div className={styles.tools}>
        {['pen', 'line', 'arrow', 'rectangle', 'circle'].map(tool => (
          <button
            key={tool}
            className={`${styles.toolButton} ${selectedTool === tool ? styles.activeTool : ''}`}
            onClick={() => setSelectedTool(tool)}
          >
            {tool}
          </button>
        ))}
        <input
          type="color"
          value={activeColour}
          onChange={(e) => setActiveColour(e.target.value)}
          className={styles.colorPicker}
        />
      </div>
    </div>
  );
}
