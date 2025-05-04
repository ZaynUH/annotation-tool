import styles from '../styles/UploadPage.module.css';

interface Props {
  images: File[];
  onUploadSelect: (files: File[]) => void;
  onSelect: (file: File) => void;
  onRemove: (file: File) => void;
}

export default function ImageGrid({ images, onUploadSelect, onSelect, onRemove }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    onUploadSelect(files);
  };

  return (
    <div className={styles.grid}>
      {images.map((file, idx) => {
        const preview = URL.createObjectURL(file);
        return (
          <div key={idx} className={styles.gridItem} onClick={() => onSelect(file)}>
            <img src={preview} alt={`preview-${idx}`} className={styles.gridImage} />
            <button
              className={styles.removeButton}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(file);
              }}
            >
              X
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
