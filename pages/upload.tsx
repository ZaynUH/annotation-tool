import Toolbar from '../components/Toolbar';
import UploadPreview from '../components/UploadPreview';

const UploadPage = () => {
  return (
    <div>
      <h1 style={{ padding: '1rem' }}>Image Annotation Tool</h1>
      <Toolbar />
      <UploadPreview />
    </div>
  );
};

export default UploadPage;
