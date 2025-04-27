import Toolbar from '../components/Toolbar';
import ToolsPanel from '../components/ToolsPanel';
import ImagePanels from '../components/ImagePanels';
import LayersPanel from '../components/LayersPanel';
import styles from '../styles/AnnotatePage.module.css';

export default function AnnotatePage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <Toolbar />
        <div className={styles.toolsWrapper}>
          <ToolsPanel />
        </div>
        <div className={styles.workspace}>
          <ImagePanels />
          <LayersPanel />
        </div>
      </div>
    </div>
  );
}
