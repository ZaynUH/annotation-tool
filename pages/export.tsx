import { useEffect, useState } from 'react';
import styles from '../styles/ExportPage.module.css';
import Toolbar from '../components/Toolbar';

interface Deck {
  name: string;
  images: string[];
}

export default function ExportPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [exportDeck, setExportDeck] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('imageDecks');
    if (stored) setDecks(JSON.parse(stored));
  }, []);

  const toggleImageSelection = (img: string) => {
    setSelectedImages(prev =>
      prev.includes(img) ? prev.filter(i => i !== img) : [...prev, img]
    );
  };

  const handleAddToExportDeck = () => {
    const unique = Array.from(new Set([...exportDeck, ...selectedImages]));
    setExportDeck(unique);
    setSelectedImages([]);
  };

  const handleExport = () => {
    alert('Exported ' + exportDeck.length + ' image(s)!');
    setExportDeck([]);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <Toolbar />

        <div className={styles.section}>
          <input className={styles.deckInput} type="text" value="Deck 1" readOnly />
          <div className={styles.grid}>
            {decks.flatMap(deck =>
              deck.images.map((img, idx) => (
                <div
                  key={`${deck.name}-${idx}`}
                  className={`${styles.gridItem} ${
                    selectedImages.includes(img) ? styles.selected : ''
                  }`}
                  onClick={() => toggleImageSelection(img)}
                >
                  <img src={img} className={styles.gridImage} />
                </div>
              ))
            )}
            <button className={styles.nextButton} onClick={handleAddToExportDeck}>
              &gt;
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <input className={styles.deckInput} type="text" value="Export" readOnly />
          <div className={styles.exportArea}>
            <input className={styles.deckInput} type="text" value="File Name" readOnly />
            <div className={styles.deckImages}>
              {exportDeck.map((img, idx) => (
                <div key={idx} className={styles.gridItem}>
                  <img src={img} className={styles.gridImage} />
                </div>
              ))}
            </div>
            <button className={styles.exportButton} onClick={handleExport}>
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
