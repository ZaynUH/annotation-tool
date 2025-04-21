import Link from 'next/link';
import styles from '../styles/UploadPage.module.css';

const Toolbar = () => (
  <div className={styles.toolbar}>
    <Link href="/upload" className={`${styles.tab} ${styles.active}`}>Import</Link>
    <Link href="/annotate" className={styles.tab}>Annotate</Link>
    <Link href="/export" className={styles.tab}>Export</Link>
  </div>
);

export default Toolbar;
