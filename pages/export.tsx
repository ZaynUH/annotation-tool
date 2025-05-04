import { useEffect, useRef, useState } from 'react';
import Toolbar from '../components/Navbar';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import styles from '../styles/ExportPage.module.css';

interface Deck 
{
  id?: string;
  name: string;
  images: string[];
}

interface Layer 
{
  type: string;
  colour: string;
  points: number[];
  text?: string;
  fontSize?: number;
}

export default function ExportPage() 
{
  const [deck, setDeck] = useState<Deck | null>(null); // Current deck
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // Selected images to export
  const [annotations, setAnnotations] = useState<Record<string, Layer[]>>({}); // Annotations per image
  const exportRefs = useRef<Record<string, HTMLCanvasElement>>({}); // Canvas refs for rendering
  const { user } = useUser();

  // Load current deck from localStorage
  useEffect(() => 
  {
    const stored = localStorage.getItem('currentDeck');
    if (stored) 
    {
      setDeck(JSON.parse(stored));
    }
  }, []);

  // Load annotations either from Supabase or localStorage
  useEffect(() => {
    const loadAnnotations = async () => 
    {
      if (!deck) return;

      if (user) 
      {
        // Logged-in user: fetch layers from Supabase
        for (const imageUrl of deck.images) 
        {
          const filePath = imageUrl.split('/').pop();

          const { data: imageRecord } = await supabase
            .from('images')
            .select('id')
            .eq('image_url', filePath)
            .single();

          if (!imageRecord) continue;

          const { data: layerData } = await supabase
            .from('layers')
            .select('*')
            .eq('image_id', imageRecord.id);

          if (layerData) 
          {
            setAnnotations((prev) => ({
              ...prev,
              [imageUrl]: layerData,
            }));
          }
        }
      } 
      else 
      {
        // Guest: use localStorage
        const key = `layers_${deck.name}`;
        const raw = localStorage.getItem(key);
        if (raw) 
        {
          const parsed = JSON.parse(raw); // Layers stored per image index
          const map: Record<string, Layer[]> = {};
          deck.images.forEach((img, i) => 
          {
            map[img] = parsed[i] || [];
          });
          setAnnotations(map);
        }
      }
    };

    loadAnnotations();
  }, [deck, user]);

  // Toggle image selection on click
  const toggleImage = (img: string) => 
  {
    setSelectedImages((prev) =>
      prev.includes(img) ? prev.filter((i) => i !== img) : [...prev, img]
    );
  };

  // Render image + its annotations on the given canvas
  const drawAnnotations = (canvas: HTMLCanvasElement, imageUrl: string) => 
  {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageUrl;

    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const layers = annotations[imageUrl] || [];

      for (const layer of layers) 
      {
        ctx.strokeStyle = layer.colour;
        ctx.fillStyle = layer.colour;
        ctx.lineWidth = layer.fontSize || 2;

        switch (layer.type) 
        {
          case 'pen':
            ctx.beginPath();
            ctx.moveTo(layer.points[0], layer.points[1]);
            for (let i = 2; i < layer.points.length; i += 2) {
              ctx.lineTo(layer.points[i], layer.points[i + 1]);
            }
            ctx.stroke();
            break;
          case 'line':
          case 'arrow':
            ctx.beginPath();
            ctx.moveTo(layer.points[0], layer.points[1]);
            ctx.lineTo(layer.points[2], layer.points[3]);
            ctx.stroke();
            break;
          case 'rectangle':
            ctx.strokeRect(
              layer.points[0],
              layer.points[1],
              layer.points[2],
              layer.points[3]
            );
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(
              layer.points[0],
              layer.points[1],
              layer.points[2],
              0,
              Math.PI * 2
            );
            ctx.stroke();
            break;
          case 'ellipse':
            ctx.beginPath();
            ctx.ellipse(
              layer.points[0],
              layer.points[1],
              layer.points[2],
              layer.points[3],
              0,
              0,
              2 * Math.PI
            );
            ctx.stroke();
            break;
          case 'text':
            const [x, y] = layer.points;
            ctx.font = `${layer.fontSize || 18}px sans-serif`;
            ctx.fillText(layer.text || '', x, y);
            break;
          default:
            break;
        }
      }
    };
  };

  // Export selected images as PNG
  const handleExport = () => 
  {
    selectedImages.forEach((img) => 
    {
      const canvas = exportRefs.current[img];
      if (canvas) {
        drawAnnotations(canvas, img); // Ensure canvas is rendered first
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'annotated-image.png';
        a.click();
      }
    });
    alert('Images exported!');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <Toolbar/> {/* Nav bar at the top */}

        {/* Deck name and image selector */}
        <div className={styles.section}>
          <input
            className={styles.deckName}
            type="text"
            value={deck?.name || ''}
            readOnly
          />
          <div className={styles.decksGrid}>
            {deck && (
              <div className={styles.deck}>
                <div className={styles.deckRow}>
                  {deck.images.map((img, index) => (
                    <div
                      key={index}
                      className={`${styles.deckImg} ${
                        selectedImages.includes(img) ? styles.selected : ''
                      }`}
                      onClick={() => toggleImage(img)}
                    >
                      <img src={img} className={styles.gridImage} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export preview and canvas rendering */}
        <div className={`${styles.section} ${styles.noTopMargin}`}>
          <input className={styles.deckName} type="text" value="Export Preview" readOnly />
          <div className={styles.deckRowPreview}>
            {selectedImages.map((img, index) => (
              <canvas
                key={index}
                ref={(elem) => 
                {
                  if (elem) 
                  {
                    exportRefs.current[img] = elem;
                    drawAnnotations(elem, img); // Draw immediately when rendered
                  }
                }}
                width={400}
                height={600}
                className={styles.exportCanvas}
              />
            ))}
          </div>
          <button className={styles.exportButton} onClick={handleExport}>
            Export as PNG
          </button>
        </div>
      </div>
    </div>
  );
}
