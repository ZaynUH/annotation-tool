import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import ImageGrid from '../components/ImageGrid';
import AuthModal from '../components/AuthModal';
import { createDeckWithImages, fetchDecksByUser, deleteDeck } from '../lib/decks';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import styles from '../styles/UploadPage.module.css';

// Deck Structure
interface Deck 
{
  id?: string;
  name: string;
  images: string[];
}

// Constructors Methods
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
  const HandleSaveDeck = async () => 
    {
      // Validate name and image files
      if (!deckName.trim() || imageFiles.length === 0) return;
      const trimmedName = deckName.trim();
    
      // Prevent duplicates
      if (decks.some((d) => d.name === trimmedName)) 
      {
        alert('You already have a deck with this name');
        return;
      }
    
      // If guest (not logged in)
      if (!user) 
      {
        const previewUrls = imageFiles.map((file) => URL.createObjectURL(file));
        const guestDeck = { name: trimmedName, images: previewUrls };
    
        localStorage.setItem('currentDeck', JSON.stringify(guestDeck));
    
        // Reset UI state
        setDeckName('');
        setImageFiles([]);
        setSelected(null);
    
        router.push('/annotate');
        return;
      }
    
      // Upload image files to Supabase storage
      const uploadedPaths: string[] = [];
    
      for (const file of imageFiles) 
      {
        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);
    
        if (uploadError) 
        {
          console.error('Upload failed:', uploadError.message);
          continue;
        }
    
        uploadedPaths.push(filePath);
      }
    
      // Create deck in Supabase DB
      const { deck, error } = await createDeckWithImages(trimmedName, user.id, uploadedPaths);
      if (error || !deck) 
      {
        alert('Failed to save to database');
        return;
      }
    
      // Ensure deck uses full public image URLs like fetchDecksByUser does
      const baseUrl = 'https://sflyeuxvdpndrwuofgqb.supabase.co/storage/v1/object/public/images';
      const fullDeck = {
        ...deck,
        images: uploadedPaths.map((path) => `${baseUrl}/${path}`),
      };
    
      // Save to localStorage for annotation page to use
      localStorage.setItem('currentDeck', JSON.stringify(fullDeck));
    
      // Reset form
      setDeckName('');
      setImageFiles([]);
      setSelected(null);
    
      // Navigate to Annotate
      router.push('/annotate');
    };
    
  
  // Webpage Front End
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
            title={user ? `Logged in as ${user.email}` : 'Click to log in'} // When hovering PC shows one of two messages dependant on logged in or not
          />
        </div>
        
        <Navbar 
          disableTabs={{ annotate: true, export: true }} // Disallows you to naviagate without having a deck chosen
        />

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
            <button className={styles.nextButton} onClick={HandleSaveDeck}>
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
                  onClick={() => 
                  {
                    localStorage.setItem('currentDeck', JSON.stringify(deck)); // CLicking a deck will allow you to annotate them in the annotate tab
                    router.push('/annotate');
                  }}
                >
                  {deck.images.slice(0, 4).map((img, index) =>  // Preview of images in that deck
                  (
                    <div key={index} className={styles.deckImg}>
                      <img src={img} className={styles.gridImage} />
                    </div>
                  ))}
                </div>
                {user && deck.id && 
                (
                  <button
                    className={styles.removeButton}
                    onClick={async () => 
                    {
                      // Deck Deletion Removes from database and webpage
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

      {showModal && 
      (
        <AuthModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
