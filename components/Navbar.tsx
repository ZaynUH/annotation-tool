import styles from '../styles/UploadPage.module.css';
import { useRouter } from 'next/router';

interface NavbarProps 
{
  disableTabs?: 
  {
    annotate?: boolean;
    export?: boolean;
  };
  onSwitchTab?: (path: string) => void; // save/discard handler
}

const Navbar = ({ disableTabs = {}, onSwitchTab }: NavbarProps) => 
{
  const router = useRouter();

  const handleClick = (path: string, useSwitch: boolean = false) => (e: React.MouseEvent) => 
  {
    e.preventDefault();
    if (useSwitch && onSwitchTab)
    {
      onSwitchTab(path); // Save/discard flow
    } 
    else
    {
      router.push(path); // Direct nav
    }
  };

  return (
    <div className={styles.navbar}>
      {/* Only Import uses onSwitchTab */}
      <a href="/upload" className={styles.tab} onClick={handleClick('/upload', true)}>
        Import
      </a>

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
