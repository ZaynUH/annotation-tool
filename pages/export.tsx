import { useEffect, useRef, useState } from 'react';
import Toolbar from '../components/Toolbar';
import { useUser } from '../context/UserContext';
import styles from '../styles/ExportPage.module.css';

interface Deck {
  name: string;
  images: string[];
}

export default function ExportPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [exportDeck, setExportDeck] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const exportRefs = useRef<Record<string, HTMLCanvasElement>>({});
  const { user } = useUser();

  useEffect(() => {
    const stored = localStorage.getItem('imageDecks');
    if (stored) {
      setDecks(JSON.parse(stored));
    }
  }, []);

  const toggleImage = (img: string) => {
    setSelectedImages((prev) =>
      prev.includes(img) ? prev.filter((i) => i !== img) : [...prev, img]
    );
  };

  const addToExportDeck = () => {
    const unique = Array.from(new Set([...exportDeck, ...selectedImages]));
    setExportDeck(unique);
    setSelectedImages([]);
  };

  const handleExport = () => {
    exportDeck.forEach((img) => {
      const canvas = exportRefs.current[img];
      if (canvas) {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'annotated-image.png';
        a.click();
      }
    });
    alert('Images exported!');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <Toolbar />

        <div className={styles.section}>
          <input className={styles.deckInput} type="text" value="Decks" readOnly />
          <div className={styles.grid}>
            {decks.flatMap((deck) =>
              deck.images.map((img, idx) => (
                <div
                  key={`${deck.name}-${idx}`}
                  className={`${styles.gridItem} ${
                    selectedImages.includes(img) ? styles.selected : ''
                  }`}
                  onClick={() => toggleImage(img)}
                >
                  <img src={img} className={styles.gridImage} />
                </div>
              ))
            )}
            <button className={styles.nextButton} onClick={addToExportDeck}>
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
                  <canvas
                    ref={(el) => {
                      if (el) exportRefs.current[img] = el;
                    }}
                    width={300}
                    height={400}
                  />
                  {/* TODO: Draw background + annotations using Konva logic or 2D canvas here */}
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
