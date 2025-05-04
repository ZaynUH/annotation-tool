import { useEffect } from 'react';
import 
{ 
  FaMousePointer, FaPencilAlt, FaSlash, FaArrowRight, FaSquare, FaCircle, FaEllipsisH, FaFont 
} from 'react-icons/fa'; // React icons for tools
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

  // Tool data for icon and shortcuts
  const tools = [
    { name: 'select', icon: <FaMousePointer />, shortcut: 'Ctrl+1' },
    { name: 'pen', icon: <FaPencilAlt />, shortcut: 'Ctrl+2' },
    { name: 'line', icon: <FaSlash />, shortcut: 'Ctrl+3' },
    { name: 'arrow', icon: <FaArrowRight />, shortcut: 'Ctrl+4' },
    { name: 'rectangle', icon: <FaSquare />, shortcut: 'Ctrl+5' },
    { name: 'circle', icon: <FaCircle />, shortcut: 'Ctrl+6' },
    { name: 'ellipse', icon: <FaEllipsisH />, shortcut: 'Ctrl+7' },
    { name: 'text', icon: <FaFont />, shortcut: 'Ctrl+8' },
  ];

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl + 1-8 -> tool selection
      if (e.ctrlKey && !e.shiftKey && /^[1-8]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const tool = tools[index];
        if (tool) {
          setSelectedTool(tool.name);
          e.preventDefault();
        }
      }

      // Ctrl + S -> save
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }

      // Ctrl + Z -> undo
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canUndo) onUndo();
      }

      // Ctrl + Shift + Z -> redo
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canRedo) onRedo();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [setSelectedTool, onSave, onUndo, onRedo, canUndo, canRedo]);

  return (
    <div className={styles.toolsWrapper}>
      <div className={styles.tools}>
        {/* Tool selection buttons with icons and tooltips */}
        {tools.map((tool, i) => (
          <button
            key={tool.name}
            className={`${styles.toolButton} ${selectedTool === tool.name ? styles.activeTool : ''}`}
            onClick={() => setSelectedTool(tool.name)}
            title={`${tool.name.charAt(0).toUpperCase() + tool.name.slice(1)} (${tool.shortcut})`}
          >
            {tool.icon}
          </button>
        ))}

        {/* Colour picker */}
        <input
          type="color"
          value={activeColour}
          onChange={(e) => setActiveColour(e.target.value)}
          className={styles.colorPicker}
          title="Pick Colour"
        />

        {/* Font or stroke size input */}
        <label className={styles.label}>
          Size
          <input
            type="number"
            min={1}
            max={100}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className={styles.strokeInput}
            title="Stroke width or font size"
          />
        </label>

        {/* Undo/Redo/Save controls */}
        <button className={styles.toolButton} onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button className={styles.toolButton} onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          Redo
        </button>
        <button className={styles.toolButton} onClick={onSave} title="Save (Ctrl+S)">
          Save
        </button>
      </div>
    </div>
  );
}
