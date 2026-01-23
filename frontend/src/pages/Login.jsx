import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Eye, EyeOff, Lock } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Clear old tokens on login page load
    useEffect(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, name, email: userEmail, userType } = response.data;

            // Build user object from response
            const user = { name, email: userEmail, userType };

            // Store token and user data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen font-sf">
            {/* Left Side - Image */}
            <div
                className="w-1/2 lg:w-[881px] flex-shrink-0 bg-cover bg-center bg-no-repeat min-h-screen hidden md:block"
                style={{ backgroundImage: "url('/image/image 5.png')" }}
            />

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col justify-center items-center bg-[#E6F2F1] px-6 md:px-10 py-10 pb-32 relative min-h-screen">
                {/* Logo */}
                <img
                    src="/Logo.png"
                    alt="INTELEQ Logo"
                    className="w-[294px] h-[64px] mb-12"
                />

                {/* Welcome Text */}
                <h1 className="text-5xl font-bold text-[#000000] mb-14 font-sf">
                    Welcome Back!
                </h1>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 w-full max-w-[360px] text-sm font-sf">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form className="w-full max-w-[460px]" onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div className="mb-5">
                        <label className="block text-2xl font-medium text-gray-800 mb-2 font-sf">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full h-[60px] px-4 text-xl border border-black rounded-lg bg-white focus:outline-none focus:border-[#0a9396] transition-colors font-sf"
                            placeholder="name@inteleq.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div className="mb-5">
                        <label className="block text-2xl font-medium text-gray-800 mb-2 font-sf">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="w-full h-[60px] px-4 text-xl border border-black rounded-lg bg-white focus:outline-none focus:border-[#0a9396] transition-colors pr-12 font-sf"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-0 bg-transparent border-none cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Sign In Button */}
                    <button
                        type="submit"
                        className="w-full h-[60px] text-2xl font-medium text-gray-800 bg-[#CAF0F8] rounded-lg hover:bg-[#89c2c4] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mt-2 font-sf"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                {/* Forgot Password */}
                <p className="text-center mt-5 text-xl text-gray-600 font-sf">
                    <span className="font-semibold text-gray-700">Forgot Password?</span>
                    <span> Contact it support</span>
                </p>

                {/* Footer */}
                <div className="absolute bottom-8 flex items-center gap-2 text-black text-xl font-sf">
                    <Lock className="w-4 h-4" />
                    <span>Restricted Area. Authorized Access Only.</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
