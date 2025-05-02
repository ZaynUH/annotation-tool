import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Toolbar from '../components/Toolbar';
import ImageGrid from '../components/ImageGrid';
import AuthModal from '../components/AuthModal'; 
import { createDeckWithImages, fetchDecksByUser } from '../lib/decks';
import { useUser } from '../context/UserContext';
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

  const [showModal, setShowModal] = useState(false); 
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      localStorage.removeItem('imageDecks');
      localStorage.removeItem('currentDeck');

      fetchDecksByUser(user.id).then(({ decks }) => {
        setDecks(decks);
      });
    } else {
      const stored = localStorage.getItem('imageDecks');
      if (stored) setDecks(JSON.parse(stored));
    }
  }, [user]);

  const handleUpload = (newImages: string[]) => {
    setCurrentImages((prev) => [...prev, ...newImages]);
  };

  const handleRemove = (url: string) => {
    setCurrentImages((prev) => prev.filter((img) => img !== url));
  };

  const handleAnnotate = async () => {
    if (!deckName.trim() || currentImages.length === 0) return;

    const trimmedName = deckName.trim();
    if (decks.some((d) => d.name === trimmedName)) {
      alert('You already have a deck with this name');
      return;
    }

    if (!user) {
      const newDeck = { name: trimmedName, images: currentImages };
      const updated = [...decks, newDeck];

      setDecks(updated);
      localStorage.setItem('imageDecks', JSON.stringify(updated));
      localStorage.setItem('currentDeck', JSON.stringify(newDeck));

      setDeckName('');
      setCurrentImages([]);
      setSelected(null);
      router.push('/annotate');
      return;
    }

    const { deck, error } = await createDeckWithImages(trimmedName, user.id, currentImages);
    if (error || !deck) {
      alert('Failed to save to database');
      return;
    }

    setDeckName('');
    setCurrentImages([]);
    setSelected(null);

    fetchDecksByUser(user.id).then(({ decks }) => setDecks(decks));
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
          <div
            className={`${styles.profileCircle} ${user ? styles.loggedIn : styles.loggedOut}`}
            onClick={() => setShowModal(true)}
            title={user ? `Logged in as ${user.email}` : 'Click to log in'}
          />
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
              onRemove={handleRemove}
              onSelect={setSelected}
            />
            <button className={styles.nextButton} onClick={handleAnnotate}>
              &gt;
            </button>
          </div>
        </div>

        <div className={styles.importSection}>
          <input
            className={styles.deckInput}
            type="text"
            value="Your Decks"
            readOnly
          />
          <div className={styles.decksGrid}>
            {decks.map((deck, index) => (
              <div key={index} className={styles.deck}>
                <input
                  className={styles.deckTitle}
                  value={deck.name}
                  readOnly
                />
                <div
                  className={styles.deckRow}
                  onClick={() => handleDeckClick(deck)}
                >
                  {deck.images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className={styles.deckImg}>
                      <img src={img} className={styles.gridImage} />
                    </div>
                  ))}
                </div>
                <button
                  className={styles.nextButton}
                  onClick={() => handleDeckClick(deck)}
                >
                  &gt;
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <AuthModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
