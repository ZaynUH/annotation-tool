import styles from '../styles/UploadPage.module.css';
import { useRouter } from 'next/router';

interface NavbarProps {
  disableTabs?: {
    annotate?: boolean;
    export?: boolean;
  };
  onSwitchTab?: (path: string) => void; // ✅ new prop
}

const Navbar = ({ disableTabs = {}, onSwitchTab }: NavbarProps) => {
  const router = useRouter();

  const handleClick = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSwitchTab) {
      onSwitchTab(path); // Handles any save/discard logic
    } else {
      router.push(path);
    }
  };

  return (
    <div className={styles.navbar}>
      <a href="/upload" className={styles.tab} onClick={handleClick('/upload')}>
        Import
      </a>

      {/* Tabs are disabled only on Upload Page */}
      {disableTabs.annotate ? (
        <span className={`${styles.tab} ${styles.disabledTab}`}>Annotate</span>
      ) : (
        <a href="/annotate" className={styles.tab} onClick={handleClick('/annotate')}>
          Annotate
        </a>
      )}

      {disableTabs.export ? (
        <span className={`${styles.tab} ${styles.disabledTab}`}>Export</span>
      ) : (
        <a href="/export" className={styles.tab} onClick={handleClick('/export')}>
          Export
        </a>
      )}
    </div>
  );
};

export default Navbar;
