import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import ImageGrid from '../components/ImageGrid';
import AuthModal from '../components/AuthModal';
import { createDeckWithImages, fetchDecksByUser, deleteDeck } from '../lib/decks';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import styles from '../styles/UploadPage.module.css';

interface Deck 
{
  id?: string;
  name: string;
  images: string[];
}

export default function UploadPage() 
{
  const [deckName, setDeckName] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState<File | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => 
  {
    // Sets up the users saved Decks or removes any decks if not logged in
    if (user) 
    {
      localStorage.removeItem('imageDecks');
      localStorage.removeItem('currentDeck');
      fetchDecksByUser(user.id).then(({ decks }) =>
      {
        setDecks(decks);
      });
    } else 
    {  
      setDecks([]);
    }
  }, [user]);

  // Importing Images
  const handleImportSelect = (newFiles: File[]) => 
  {
    setImageFiles((prev) => [...prev, ...newFiles]);
  };

  // Removing imported Images
  const handleRemove = (file: File) => 
  {
    setImageFiles((prev) => prev.filter((f) => f !== file));
  };

  // When creating a new Deck
  const handleAnnotate = async () => 
  {
    // Image and deck name Validation
    if (!deckName.trim() || imageFiles.length === 0) return;
    const trimmedName = deckName.trim(); // Just removed whitespace from names for ease
  
    if (decks.some((d) => d.name === trimmedName)) 
    {
      alert('You already have a deck with this name');
      return;
    }
    
    // Checks if the user is logged in
    if (!user) 
    {
      // "Guests" can annotate, but their deck won't be saved in the database
      const previewUrls = imageFiles.map((file) => URL.createObjectURL(file));
      const guestDeck = { name: trimmedName, images: previewUrls };
    
      localStorage.setItem('currentDeck', JSON.stringify(guestDeck)); // Decks will only save in local storage till the tab is closed
      
      // Resets Image Grid
      setDeckName('');
      setImageFiles([]);
      setSelected(null);
    
      router.push('/annotate');
      return;
    }
  
    // Each image is time stamped sent over to the database bucket for storage
    const uploadedPaths: string[] = [];
  
    for (const file of imageFiles) 
    {
      const filePath = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);
  
      if (uploadError) {
        console.error('Upload failed:', uploadError.message); // Print out Error message when failing to save
        continue;
      }
  
      uploadedPaths.push(filePath); // File name is saved
    }
  
    // All the Deck data is sent to the database
    const { deck, error } = await createDeckWithImages(trimmedName, user.id, uploadedPaths);
    if (error || !deck) 
    {
      alert('Failed to save to database');
      return;
    }
  
    // Set Local Storage for the current deck being annotated
    localStorage.setItem('currentDeck', JSON.stringify(deck));
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // small delay
    const { decks: updatedDecks } = await fetchDecksByUser(user.id);
    setDecks(updatedDecks);
  
    // Reset Image Grid 
    setDeckName('');
    setImageFiles([]);
    setSelected(null);
  
    // Route to annotate page 
    router.push('/annotate');
  };
  

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Image Annotation Tool</h1>
          <div
            // Profile Circle
            className={`${styles.profileCircle} ${user ? styles.loggedIn : styles.loggedOut}`}
            onClick={async () => 
            {
              if (user) 
              {
                // Logged in Promt user if they wanna be Logged Out
                const confirmLogout = window.confirm('Are you sure you want to log out?');
                if (confirmLogout) 
                {
                  // Logs out and removes all user deck data from webpage
                  await supabase.auth.signOut();
                  localStorage.removeItem('currentDeck');
                  router.reload();
                }
              } 
              else 
              {
                setShowModal(true); // If not logged in show the Login Modal
              }
            }}
            title={user ? `Logged in as ${user.email}` : 'Click to log in'}
          />
        </div>

        <Navbar disableTabs={{ annotate: true, export: true }} />

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
              onUploadSelect={handleImportSelect}
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
