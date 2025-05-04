import styles from '../styles/UploadPage.module.css';

interface Props 
{
  images: File[];
  onUploadSelect: (files: File[]) => void;
  onSelect: (file: File) => void;
  onRemove: (file: File) => void;
}

export default function ImageGrid({ images, onUploadSelect, onSelect, onRemove }: Props) 
{
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => 
  {
    if (!e.target.files) return;
    const files = Array.from(e.target.files); // Convert FileList to Array
    onUploadSelect(files); // Pass selected files to parent
  };

  return (
    <div className={styles.grid}>
      {images.map((file, index) => 
      {
        const preview = URL.createObjectURL(file); // Create image preview from file
        return (
          <div key={index} className={styles.gridItem} onClick={() => onSelect(file)}>
            <img src={preview} alt={`preview-${index}`} className={styles.gridImage} />
            <button
              className={styles.removeButton}
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering onSelect when clicking remove
                onRemove(file); // Remove file from Grid
              }}
            >
              X
            </button>
          </div>
        );
      })}
      <label className={styles.gridItem}>
        <span className={styles.plus}>+</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className={styles.fileInput}
          onChange={handleChange} // Handle file input changes
        />
      </label>
    </div>
  );
}
