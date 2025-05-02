import styles from '../styles/UploadPage.module.css';

interface Props {
  images: File[]; // store files, not URLs
  onSelect: (file: File) => void;
  onRemove: (file: File) => void;
  onUploadSelect: (files: File[]) => void;
}

export default function ImageGrid({ images, onSelect, onRemove, onUploadSelect }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    onUploadSelect(files);
  };

  return (
    <div className={styles.grid}>
      {images.slice(0, 4).map((file, idx) => {
        const previewUrl = URL.createObjectURL(file);
        return (
          <div key={idx} className={styles.gridItem} onClick={() => onSelect(file)}>
            <img src={previewUrl} alt={`img-${idx}`} className={styles.gridImage} />
            <button
              className={styles.removeButton}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(file);
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
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
