import { useEffect, useState } from 'react';
import Toolbar from '../components/Toolbar';
import ImageGrid from '../components/ImageGrid';
import styles from '../styles/UploadPage.module.css';
import { useRouter } from 'next/router';

interface Deck {
  name: string;
  images: string[];
}

export default function UploadPage() {
  const [deckName, setDeckName] = useState('');
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
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

    const updatedDecks = [...decks, newDeck];
    setDecks(updatedDecks);
    localStorage.setItem('imageDecks', JSON.stringify(updatedDecks));
    localStorage.setItem('currentDeck', JSON.stringify(newDeck));

    setDeckName('');
    setCurrentImages([]);
    setSelected(null);

    router.push('/annotate');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <Toolbar />

        <input
          className={styles.deckInput}
          type="text"
          placeholder="Enter Deck name"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
        />

        <ImageGrid
          images={currentImages}
          onUpload={handleUpload}
          onSelect={setSelected}
        />

        <div className={styles.preview}>
          {selected ? (
            <img src={selected} alt="Selected" className={styles.selectedImage} />
          ) : (
            <p>Select an image to view details</p>
          )}
        </div>

        {currentImages.length > 0 && (
          <button className={styles.saveButton} onClick={handleSaveAndAnnotate}>
            Annotate
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
