'use client';

import { useState } from 'react';
import { loginUser, signUpUser } from '../lib/AuthContext';
import styles from '../styles/UploadPage.module.css';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const res = await loginUser(username, password);
    if (res.error) setError(res.error);
    else {
      onSuccess(res.user);
      onClose();
    }
  };

  const handleSignUp = async () => {
    const res = await signUpUser(username, password);
    if (res.error) setError(res.error);
    else {
      onSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <button onClick={onClose} className={styles.closeButton}>
          ✖
        </button>
        <h2 className={styles.title}>Welcome!<br />Please Sign in</h2>

        <input
          type="text"
          placeholder="Enter username"
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.buttonRow}>
          <button onClick={handleLogin} className={styles.primaryButton}>Login</button>
          <button onClick={handleSignUp} className={styles.secondaryButton}>Sign Up</button>
        </div>
      </div>
    </div>
  );
}
