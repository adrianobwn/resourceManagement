import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import api from '../utils/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, name, email: userEmail, userType } = response.data;
            login({ name, email: userEmail, userType }, token);
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
                <h1 className="text-5xl font-bold text-[#000000] mb-14">
                    Welcome Back!
                </h1>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 w-full max-w-[360px] text-sm">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form className="w-full max-w-[460px]" onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div className="mb-5">
                        <label className="block text-2xl font-medium text-gray-800 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full h-[60px] px-4 text-xl border border-black rounded-lg bg-white focus:outline-none focus:border-[#0a9396] transition-colors"
                            placeholder="name@inteleq.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div className="mb-5">
                        <label className="block text-2xl font-medium text-gray-800 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="w-full h-[60px] px-4 text-xl border border-black rounded-lg bg-white focus:outline-none focus:border-[#0a9396] transition-colors pr-12"
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
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Sign In Button */}
                    <button
                        type="submit"
                        className="w-full h-[60px] text-2xl font-medium text-gray-800 bg-[#CAF0F8] rounded-lg hover:bg-[#89c2c4] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mt-2"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                {/* Forgot Password */}
                <p className="text-center mt-5 text-xl text-gray-600">
                    <span className="font-semibold text-gray-700">Forgot Password?</span>
                    <span> Contact it support</span>
                </p>

                {/* Footer */}
                <div className="absolute bottom-8 flex items-center gap-2 text-black text-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span>Restricted Area. Authorized Access Only.</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
