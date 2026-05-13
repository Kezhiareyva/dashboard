import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css'; // Mengambil CSS dari folder luar

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Fungsi untuk pindah halaman

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Nanti di sini kamu bisa pasang validasi ke API Node.js / database
    console.log('Login berhasil untuk:', email);
    
    // Perintah untuk pindah ke rute /dashboard
    navigate('/dashboard'); 
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Selamat Datang</h2>
        <p>Silakan masuk ke sistem pemantauan</p>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="login-btn">Masuk Dashboard</button>
        </form>
      </div>
    </div>
  );
}
