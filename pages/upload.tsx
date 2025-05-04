import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Toolbar from '../components/Toolbar';
import ImageGrid from '../components/ImageGrid';
import AuthModal from '../components/AuthModal';
import { createDeckWithImages, fetchDecksByUser, deleteDeck } from '../lib/decks';
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
      localStorage.removeItem('imageDecks');
      localStorage.removeItem('currentDeck');
      fetchDecksByUser(user.id).then(({ decks }) => {
        setDecks(decks);
      });
    } else {
      // Don't persist guest decks anymore
      setDecks([]);
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
  
    if (!user) {
      alert('You must be logged in to annotate and save decks.');
      return;
    }
  
    const uploadedPaths: string[] = [];
  
    for (const file of imageFiles) {
      const filePath = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);
  
      if (uploadError) {
        console.error('Upload failed:', uploadError.message);
        continue;
      }
  
      uploadedPaths.push(filePath);
    }
  
    const { deck, error } = await createDeckWithImages(trimmedName, user.id, uploadedPaths);
    if (error || !deck) {
      alert('Failed to save to database');
      return;
    }
  
    // Wait until localStorage is set
    localStorage.setItem('currentDeck', JSON.stringify(deck));
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Optional: ensure decks list is refreshed
    const { decks: updatedDecks } = await fetchDecksByUser(user.id);
    setDecks(updatedDecks);
  
    // Reset form state
    setDeckName('');
    setImageFiles([]);
    setSelected(null);
  
    // ✅ Navigate after everything else is done
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
                {user && deck.id && (
                  <button
                    className={styles.removeButton}
                    onClick={async () => {
                      const confirmDelete = window.confirm(`Delete deck "${deck.name}"?`);
                      if (!confirmDelete) return;

                      const { success, error } = await deleteDeck(deck.id!);
                      if (error) return alert('Failed to delete: ' + error);

                      const { decks: updatedDecks } = await fetchDecksByUser(user.id);
                      setDecks(updatedDecks);
                    }}
                  >
                    X
                  </button>
                )}
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
