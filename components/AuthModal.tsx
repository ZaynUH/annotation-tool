import { useState } from 'react';
import { loginUser, signUpUser } from '../lib/auth';
import { useUser } from '../context/UserContext';
import styles from '../styles/UploadPage.module.css'; // or your modal styles

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useUser();

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in both fields');
      return;
    }

    const action = mode === 'login' ? loginUser : signUpUser;
    const { user, error: err } = await action(email, password);

    if (err || !user) {
      setError(err || 'Something went wrong');
    } else {
      setUser(user);
      if (onSuccess) onSuccess(user);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2 className={styles.title}>{mode === 'login' ? 'Log In' : 'Sign Up'}</h2>

        <input
          className={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.buttonRow}>
          <button className={styles.submitButton} onClick={handleSubmit}>
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
          <button
            className={styles.switchButton}
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
          </button>
        </div>
      </div>
    </div>
  );
}
