import styles from '../styles/AnnotatePage.module.css';

export default function ToolsPanel() {
  return (
    <div className={styles.tools}>
      <div className={styles.toolButtons}>
        {[1, 2, 3, 4].map((tool, i) => (
          <button key={i} className={styles.toolBtn}></button>
        ))}
      </div>
      <div className={styles.imageNav}>
        <button>&lt;</button>
        <span>02 / 05</span>
        <button>&gt;</button>
      </div>
    </div>
  );
}
