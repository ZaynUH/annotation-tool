import { useState } from 'react';
import styles from '../styles/UploadPreview.module.css';

const UploadPreview = () => {
  const [images, setImages] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  return (
    <div className={styles.container}>
      <input type="file" multiple accept="image/*" onChange={handleFileChange} className={styles.input} />
      <div className={styles.previewGrid}>
        {images.map((file, idx) => (
          <img
            key={idx}
            src={URL.createObjectURL(file)}
            alt={`preview-${idx}`}
            className={styles.previewImg}
          />
        ))}
      </div>
    </div>
  );
};

export default UploadPreview;
