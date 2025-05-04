import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Toolbar from '../components/Toolbar';
import ImageGrid from '../components/ImageGrid';
import AuthModal from '../components/AuthModal';
import { createDeckWithImages, fetchDecksByUser } from '../lib/decks';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import styles from '../styles/UploadPage.module.css';

interface Deck {
  id?: string;
  name: string;
  images: string[];
}

export default function UploadPage() {
  const [deckName, setDeckName] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState<File | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchDecksByUser(user.id).then(({ decks }) => {
        setDecks(decks);
      });
    } else {
      setDecks([]); // Guests see no decks
    }
  }, [user]);

  const handleUploadSelect = (newFiles: File[]) => {
    setImageFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemove = (file: File) => {
    setImageFiles((prev) => prev.filter((f) => f !== file));
  };

  const handleAnnotate = async () => {
    if (!deckName.trim() || imageFiles.length === 0) return;
    const trimmedName = deckName.trim();

    if (decks.some((d) => d.name === trimmedName)) {
      alert('You already have a deck with this name');
      return;
    }

    if (user) {
      const uploadedPaths: string[] = [];

      for (const file of imageFiles) {
        const filePath = `${Date.now()}_${file.name}`;
        const { error } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (!error) uploadedPaths.push(filePath);
      }

      const { deck, error } = await createDeckWithImages(trimmedName, user.id, uploadedPaths);
      if (error || !deck) {
        alert('Failed to save to database');
        return;
      }

      localStorage.setItem('currentDeck', JSON.stringify(deck));
      fetchDecksByUser(user.id).then(({ decks }) => setDecks(decks));
    } else {
      // Guest: create a temporary deck, no saving
      const previewUrls = imageFiles.map((file) => URL.createObjectURL(file));
      const tempDeck = { name: trimmedName, images: previewUrls };
      localStorage.setItem('currentDeck', JSON.stringify(tempDeck));
    }

    setDeckName('');
    setImageFiles([]);
    setSelected(null);
    router.push('/annotate');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Image Annotation Tool</h1>
          <div
            className={`${styles.profileCircle} ${user ? styles.loggedIn : styles.loggedOut}`}
            onClick={async () => {
              if (user) {
                const confirmLogout = window.confirm('Are you sure you want to log out?');
                if (confirmLogout) {
                  await supabase.auth.signOut();
                  localStorage.removeItem('currentDeck');
                  router.reload();
                }
              } else {
                setShowModal(true);
              }
            }}
            title={user ? `Logged in as ${user.email}` : 'Click to log in'}
          />
        </div>

        <Toolbar disableTabs={{ annotate: true, export: true }} />

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
              images={imageFiles}
              onSelect={setSelected}
              onRemove={handleRemove}
              onUploadSelect={handleUploadSelect}
            />
            <button className={styles.nextButton} onClick={handleAnnotate}>
              &gt;
            </button>
          </div>
        </div>

        {user && (
          <div className={styles.importSection}>
            <input className={styles.deckInput} type="text" value="Your Decks" readOnly />
            <div className={styles.decksGrid}>
              {decks.map((deck, index) => (
                <div key={index} className={styles.deck}>
                  <input className={styles.deckTitle} value={deck.name} readOnly />
                  <div
                    className={styles.deckRow}
                    onClick={() => {
                      localStorage.setItem('currentDeck', JSON.stringify(deck));
                      router.push('/annotate');
                    }}
                  >
                    {deck.images.slice(0, 4).map((img, idx) => (
                      <div key={idx} className={styles.deckImg}>
                        <img src={img} className={styles.gridImage} />
                      </div>
                    ))}
                  </div>
                  <button
                    className={styles.nextButton}
                    onClick={() => {
                      localStorage.setItem('currentDeck', JSON.stringify(deck));
                      router.push('/annotate');
                    }}
                  >
                    &gt;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
