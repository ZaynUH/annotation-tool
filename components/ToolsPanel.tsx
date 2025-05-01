import { useState } from 'react';
import styles from '../styles/AnnotatePage.module.css';

interface ToolsPanelProps {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
}

export default function ToolsPanel({ selectedTool, setSelectedTool }: ToolsPanelProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <div className={styles.toolsWrapper}>
      <div className={styles.tools}>
        <button
          className={`${styles.toolButton} ${selectedTool === 'pen' ? styles.activeTool : ''}`}
          onClick={() => setSelectedTool('pen')}
        >
          🖊️ Pen
        </button>

        <div className={styles.dropdown}>
          <button
            className={`${styles.toolButton} ${
              ['arrow', 'line', 'circle', 'rectangle'].includes(selectedTool) ? styles.activeTool : ''
            }`}
            onClick={toggleDropdown}
          >
            📐 Shapes ▾
          </button>
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              {['arrow', 'line', 'circle', 'rectangle'].map((tool) => (
                <div
                  key={tool}
                  className={styles.dropdownItem}
                  onClick={() => {
                    setSelectedTool(tool);
                    setDropdownOpen(false);
                  }}
                >
                  {tool}
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="color"
          className={styles.colorPicker}
          onChange={(e) => setSelectedTool(e.target.value)}
        />
      </div>
    </div>
  );
}
