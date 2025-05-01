import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ImageGrid from '../components/ImageGrid';
import styles from '../styles/UploadPage.module.css';

interface Deck {
  name: string;
  images: string[];
}

export default function UploadPage() {
  const [deckName, setDeckName] = useState('');
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('imageDecks');
    if (stored) setDecks(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('imageDecks', JSON.stringify(decks));
  }, [decks]);

  const handleUpload = (newImages: string[]) => {
    setCurrentImages(prev => [...prev, ...newImages]);
  };

  const handleSaveAndAnnotate = () => {
    if (!deckName.trim() || currentImages.length === 0) return;

    const newDeck = { name: deckName.trim(), images: currentImages };
    const updated = [...decks, newDeck];

    setDecks(updated);
    localStorage.setItem('imageDecks', JSON.stringify(updated));
    localStorage.setItem('currentDeck', JSON.stringify(newDeck));

    // Clear local state
    setDeckName('');
    setCurrentImages([]);
    setSelected(null);

    router.push('/annotate');
  };

  const handleDeckClick = (deck: Deck) => {
    localStorage.setItem('currentDeck', JSON.stringify(deck));
    router.push('/annotate');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Image Annotation Tool</h1>
          <div className={styles.toolbar}>
            <span className={`${styles.tab} ${styles.active}`}>Import</span>
            <span className={styles.tab}>Annotate</span>
            <span className={styles.tab}>Export</span>
          </div>
        </div>

        <div className={styles.importSection}>
          <input
            className={styles.deckInput}
            placeholder="Enter Deck name"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
          />

          <div className={styles.gridRow}>
            <ImageGrid
              images={currentImages}
              onUpload={handleUpload}
              onSelect={setSelected}
            />
            <button className={styles.arrowButton} onClick={handleSaveAndAnnotate}>
              &gt;
            </button>
          </div>
        </div>

        <div className={styles.importSection}>
          <input className={styles.deckInput} value="Your Decks" readOnly />
          <div className={styles.decksContainer}>
            {decks.map((deck, index) => (
              <div key={index} className={styles.deckBox}>
                <input className={styles.deckTitle} value={deck.name} readOnly />
                <div className={styles.deckImages} onClick={() => handleDeckClick(deck)}>
                  {deck.images.slice(0, 4).map((img, i) => (
                    <div key={i} className={styles.deckImageThumb}>
                      <img src={img} alt={`img-${i}`} className={styles.gridImage} />
                    </div>
                  ))}
                </div>
                <button className={styles.arrowButton} onClick={() => handleDeckClick(deck)}>&gt;</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
