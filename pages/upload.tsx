import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Toolbar from '../components/Toolbar';
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

  const handleAnnotate = () => {
    if (!deckName.trim() || currentImages.length === 0) return;

    const newDeck = { name: deckName.trim(), images: currentImages };
    const updated = [...decks, newDeck];
    setDecks(updated);
    localStorage.setItem('imageDecks', JSON.stringify(updated));
    localStorage.setItem('currentDeck', JSON.stringify(newDeck));

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
          <div className={styles.profileCircle} />
        </div>

        <Toolbar />

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
          </div>

          {currentImages.length > 0 && (
            <button className={styles.annotateButton} onClick={handleAnnotate}>
              Save & Annotate
            </button>
          )}
        </div>

        <div className={styles.importSection}>
          <input className={styles.deckInput} type="text" value="Your Decks" readOnly />

          <div className={styles.decksGrid}>
            {decks.map((deck, index) => (
              <div key={index} className={styles.deck}>
                <input className={styles.deckTitle} value={deck.name} readOnly />
                <div className={styles.deckRow}>
                  {deck.images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className={styles.deckImg}>
                      <img src={img} className={styles.gridImage} />
                    </div>
                  ))}
                  <button className={styles.nextButton} onClick={() => handleDeckClick(deck)}>&gt;</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
