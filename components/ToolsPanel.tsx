import styles from '../styles/AnnotatePage.module.css';

interface ToolsPanelProps {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  activeColour: string;
  setActiveColour: (colour: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function ToolsPanel({
  selectedTool,
  setSelectedTool,
  activeColour,
  setActiveColour,
  fontSize,
  setFontSize,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolsPanelProps) {
  const tools = ['select', 'pen', 'line', 'arrow', 'rectangle', 'circle', 'ellipse', 'text'];

  return (
    <div className={styles.toolsWrapper}>
      <div className={styles.tools}>
        {tools.map(tool => (
          <button
            key={tool}
            className={`${styles.toolButton} ${selectedTool === tool ? styles.activeTool : ''}`}
            onClick={() => setSelectedTool(tool)}
          >
            {tool.charAt(0).toUpperCase() + tool.slice(1)}
          </button>
        ))}

        <input
          type="color"
          value={activeColour}
          onChange={(e) => setActiveColour(e.target.value)}
          className={styles.colorPicker}
          title="Pick Colour"
        />

        <label style={{ marginLeft: 8 }}>
          Size
          <input
            type="number"
            min={1}
            max={72}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className={styles.strokeInput}
            style={{ width: 60, marginLeft: 4 }}
          />
        </label>

        <button className={styles.toolButton} onClick={onUndo} disabled={!canUndo}>Undo</button>
        <button className={styles.toolButton} onClick={onRedo} disabled={!canRedo}>Redo</button>
        <button className={styles.toolButton} onClick={onSave}>Save</button>
      </div>
    </div>
  );
}
