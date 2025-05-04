import Link from 'next/link';
import styles from '../styles/UploadPage.module.css';

interface NavbarProps 
{
  disableTabs?: {
    annotate?: boolean;
    export?: boolean;
  };
}

const Navbar = ({ disableTabs = {} }: NavbarProps) => 
{
  return (
    <div className={styles.navbar}>
      <Link href="/upload" className={styles.tab}>Import</Link>

      {/* Only disabled in Import Page */}
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

export default Navbar;
