import { supabase } from '../lib/supabase';
import styles from '../styles/UploadPage.module.css';

interface Props {
  images: string[];
  onUpload: (urls: string[]) => void;
  onSelect: (url: string) => void;
}

export default function ImageGrid({ images, onUpload, onSelect }: Props) {
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const filePath = `${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload failed:', uploadError.message);
        continue;
      }

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        uploadedUrls.push(data.publicUrl);
      }
    }

    onUpload(uploadedUrls);
  };

  return (
    <div className={styles.grid}>
      {images.slice(0, 4).map((src, idx) => (
        <div key={idx} className={styles.gridItem} onClick={() => onSelect(src)}>
          <img src={src} alt={`img-${idx}`} className={styles.gridImage} />
        </div>
      ))}
      <label className={`${styles.gridItem} ${styles.upload}`}>
        <span className={styles.plus}>+</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className={styles.fileInput}
          onChange={handleChange}
        />
      </label>
    </div>
  );
}
