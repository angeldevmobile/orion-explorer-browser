import { useState } from 'react';
import { authService } from '../services/api';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        const response = await authService.register({ email, password, username });
        setSuccess('¡Registro exitoso! Token guardado.');
        console.log('Registro:', response);
      } else {
        const response = await authService.login({ email, password });
        setSuccess('¡Login exitoso! Token guardado.');
        console.log('Login:', response);
      }
    } catch (err: unknown) {
      type ApiError = {
        response?: {
          data?: {
            error?: string;
          };
        };
      };
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as ApiError).response?.data?.error
      ) {
        setError((err as ApiError).response!.data!.error!);
      } else {
        setError('Error en la operación');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: '20px' }}>
        {isRegister ? 'Registro' : 'Login'} - Orion Browser
      </h1>
      
      <form onSubmit={handleSubmit}>
        {isRegister && (
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
              required
            />
          </div>
        )}
        
        <div style={{ marginBottom: '15px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
            required
          />
        </div>
        
        {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
        {success && <p style={{ color: 'green', marginBottom: '10px' }}>{success}</p>}
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Iniciar Sesión'}
        </button>
      </form>
      
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
        <button 
          onClick={() => setIsRegister(!isRegister)}
          style={{ marginLeft: '5px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isRegister ? 'Inicia sesión' : 'Regístrate'}
        </button>
      </p>
    </div>
  );
}