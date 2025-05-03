import Link from 'next/link';
import styles from '../styles/UploadPage.module.css';

interface ToolbarProps {
  disableTabs?: {
    annotate?: boolean;
    export?: boolean;
  };
}

const Toolbar = ({ disableTabs = {} }: ToolbarProps) => {
  return (
    <div className={styles.toolbar}>
      <Link href="/upload" className={styles.tab}>Import</Link>

      {disableTabs.annotate ? (
        <span className={`${styles.tab} ${styles.disabledTab}`}>Annotate</span>
      ) : (
        <Link href="/annotate" className={styles.tab}>Annotate</Link>
      )}

      {disableTabs.export ? (
        <span className={`${styles.tab} ${styles.disabledTab}`}>Export</span>
      ) : (
        <Link href="/export" className={styles.tab}>Export</Link>
      )}
    </div>
  );
};

export default Toolbar;
