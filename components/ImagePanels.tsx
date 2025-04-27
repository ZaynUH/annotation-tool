import styles from '../styles/AnnotatePage.module.css';

export default function ImagePanels() {
  return (
    <div className={styles.images}>
      <button className={styles.navArrow}>&lt;</button>
      <div className={styles.imageBox}></div>
      <div className={styles.imageBox}></div>
      <div className={styles.imageBox}></div>
      <button className={styles.navArrow}>&gt;</button>
    </div>
  );
}
