import { useEffect, useRef, useState } from 'react';
import Toolbar from '../components/Toolbar';
import styles from '../styles/ExportPage.module.css';
import dynamic from 'next/dynamic';

const CanvasAnnotator = dynamic(() => import('../components/CanvasAnnotator'), { ssr: false });

export default function ExportPage() {
  const [deck, setDeck] = useState<{ name: string; images: string[] }>({ name: '', images: [] });
  const [layers, setLayers] = useState<Record<number, any[]>>({});
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [exportUrls, setExportUrls] = useState<string[]>([]);
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);

  // Load the deck + its layers
  useEffect(() => {
    const current = localStorage.getItem('currentDeck');
    if (current) {
      const parsed = JSON.parse(current);
      setDeck(parsed);
      const saved = localStorage.getItem(`layers_${parsed.name}`);
      if (saved) {
        setLayers(JSON.parse(saved));
      }
    }
  }, []);

  const toggleImageSelection = (idx: number) => {
    setSelectedImages(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleExport = () => {
    const urls: string[] = [];
    refs.current.forEach((ref, idx) => {
      if (ref && selectedImages.includes(idx)) {
        const dataUrl = ref.toDataURL();
        urls.push(dataUrl);
      }
    });
    setExportUrls(urls);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Export Annotated Images</h1>
        <Toolbar />

        {/* Selection Grid */}
        <div className={styles.section}>
          <input className={styles.deckInput} value={deck.name || 'Current Deck'} readOnly />
          <div className={styles.grid}>
            {deck.images.map((img, idx) => (
              <div
                key={idx}
                className={`${styles.gridItem} ${selectedImages.includes(idx) ? styles.selected : ''}`}
                onClick={() => toggleImageSelection(idx)}
              >
                <CanvasAnnotator
                  imageUrl={img}
                  width={200}
                  height={300}
                  previewOnly
                  layers={layers[idx] || []}
                  ref={(el) => (refs.current[idx] = el?.getStage().toCanvas())}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Export Result */}
        <div className={styles.section}>
          <button className={styles.exportButton} onClick={handleExport}>Export</button>
          <div className={styles.grid}>
            {exportUrls.map((url, idx) => (
              <a key={idx} href={url} download={`annotated-${idx + 1}.png`}>
                <img src={url} className={styles.gridImage} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
