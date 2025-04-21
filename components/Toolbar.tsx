import Link from 'next/link';
import styles from '../styles/Toolbar.module.css';

const Toolbar = () => {
  return (
    <nav className={styles.toolbar}>
      <Link href="/upload" className={styles.tab}>Import</Link>
      <Link href="/annotate" className={styles.tab}>Annotate</Link>
      <Link href="/export" className={styles.tab}>Export</Link>
    </nav>
  );
};

export default Toolbar;
