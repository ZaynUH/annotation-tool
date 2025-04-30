import { useEffect, useState } from 'react';
import Toolbar from '../components/Toolbar';
import ImageGrid from '../components/ImageGrid';
import styles from '../styles/UploadPage.module.css';

export default function UploadPage() {
  const [deckName, setDeckName] = useState('');
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  // Load existing images (if any)
  useEffect(() => {
    // you can load persisted images here if needed
  }, []);

  const handleUpload = (newImages: string[]) => {
    setCurrentImages(prev => [...prev, ...newImages]);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header with title and profile circle */}
        <div className={styles.header}>
          <h1 className={styles.title}>Image Annotation Tool</h1>
          <div className={styles.profileCircle} />
        </div>

        {/* Tab bar */}
        <Toolbar/>

        {/* Import section */}
        <div className={styles.importSection}>
          <input
            className={styles.deckInput}
            type="text"
            placeholder="Enter Deck name"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
          />

          <div className={styles.gridContainer}>
            <ImageGrid
              images={currentImages}
              onUpload={handleUpload}
              onSelect={setSelected}
            />
            <button className={styles.nextButton}>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}