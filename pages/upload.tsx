import { useState } from 'react';
import { useAnnotation } from '../context/AnnotationContext';
import Toolbar from '../components/Toolbar';
import ImageGrid from '../components/ImageGrid';
import styles from '../styles/UploadPage.module.css';

export default function UploadPage() {
  const { images, setImages } = useAnnotation();
  const [selected, setSelected] = useState<string | null>(null);

  const handleUpload = (newImages: string[]) => {
    setImages([...images, ...newImages]);
  };

  const handleDelete = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (images[index] === selected) {
      setSelected(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Image Annotation Tool</h1>
        <Toolbar />
        <ImageGrid
          images={images}
          onUpload={handleUpload}
          onSelect={setSelected}
          onDelete={handleDelete}
        />
        <div className={styles.preview}>
          {selected ? (
            <img src={selected} alt="Selected" className={styles.selectedImage} />
          ) : (
            <p>Select an image to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
