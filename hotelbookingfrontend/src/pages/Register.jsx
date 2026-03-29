import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Sparkles } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      login(response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Email might be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="bg-white p-8 rounded-2xl shadow-sm border w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-gray-50 rounded-full border">
            <UserPlus className="h-6 w-6 text-gray-600" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-center mb-1 text-primary">Create an account</h2>
        <p className="text-center text-sm text-gray-500 mb-6">Start booking your perfect stay in minutes.</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full border-gray-300 border rounded p-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Sparkles className="h-3.5 w-3.5" /> Discover offers and track your trips
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
