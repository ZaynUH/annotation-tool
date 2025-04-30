import { useEffect, useState } from 'react';
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
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  // Load decks from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('imageDecks');
    if (stored) {
      setDecks(JSON.parse(stored));
    }
  }, []);

  // Save decks when updated
  useEffect(() => {
    localStorage.setItem('imageDecks', JSON.stringify(decks));
  }, [decks]);

  const handleUpload = (newImages: string[]) => {
    setCurrentImages(prev => [...prev, ...newImages]);
  };

  const handleSaveDeck = () => {
    if (!deckName.trim() || currentImages.length === 0) return;

    const updatedDecks = [...decks, { name: deckName.trim(), images: currentImages }];
    setDecks(updatedDecks);
    setDeckName('');
    setCurrentImages([]);
    setSelected(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <Toolbar />

        <input
          className={styles.deckInput}
          type="text"
          placeholder="Enter deck name"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
        />

        <ImageGrid
          images={currentImages}
          onUpload={handleUpload}
          onSelect={setSelected}
        />

        {selected && (
          <div className={styles.preview}>
            <img src={selected} alt="Selected" className={styles.selectedImage} />
          </div>
        )}

        {currentImages.length > 0 && (
          <button className={styles.saveButton} onClick={handleSaveDeck}>
            Save Deck
          </button>
        )}

        <h2 className={styles.subtitle}>Your Decks</h2>
        <div className={styles.decksGrid}>
          {decks.map((deck, index) => (
            <div key={index} className={styles.deck}>
              <h3 className={styles.deckTitle}>{deck.name}</h3>
              <div className={styles.deckImages}>
                {deck.images.map((img, i) => (
                  <div key={i} className={styles.gridItem}>
                    <img src={img} className={styles.gridImage} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
