"use client";

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setStatus('error');
      setErrorMessage('Invalid email or password. Please try again.');
    } else if (res?.ok) {
      setStatus('success');
      router.push('/');
      router.refresh();
    } else {
      setStatus('idle');
    }
  };

  return (
    <div className="bg-[#FCFAF7] text-[#221A17] font-sans min-h-screen flex flex-col md:flex-row antialiased selection:bg-[#B85C45] selection:text-white">
      {/* Left Column: Brand & Editorial Artwork */}
      <div className="hidden md:flex md:w-1/2 bg-[#F5F1EA] flex-col justify-between p-16 border-r border-[#DDD7CE] relative overflow-hidden">
        {/* Decorative subtle background elements */}
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[#F0DFDB] rounded-full opacity-30 -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-[#E6E2DE] rounded-full opacity-40 translate-y-1/3 -translate-x-1/4 blur-3xl pointer-events-none"></div>
        
        {/* Brand Header */}
        <div className="relative z-10">
          <h1 className="text-3xl font-semibold tracking-tight text-[#242321] mb-2">ZuhraGraph</h1>
          <p className="text-lg text-[#55423E] max-w-sm">Turn your ideas into visual stories.</p>
        </div>
        
        {/* Editorial Artwork Focus */}
        <div className="relative z-10 w-full max-w-md mx-auto aspect-[4/5] my-10 flex items-center justify-center">
          <div className="w-full h-full relative p-4 bg-[#FFF8F6] rounded-lg border border-[#DDD7CE] shadow-sm flex flex-col group transition-transform duration-500 hover:scale-[1.02]">
            <div className="w-full h-full bg-[#E6E2DE] rounded flex items-center justify-center grayscale-[0.2] contrast-125 transition-all duration-700 group-hover:grayscale-0 relative overflow-hidden">
              {/* Fallback pattern since we don't have the image asset locally */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#99442F] to-transparent"></div>
              <span className="text-[#706C65] font-medium text-sm uppercase tracking-widest z-10">Artwork Placeholder</span>
            </div>
            
            <div className="absolute bottom-6 left-6 right-6 bg-[#FFF8F6]/90 backdrop-blur-sm p-4 rounded border border-[#DDD7CE] flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div>
                <span className="block text-sm font-medium uppercase text-[#221A17] mb-1 tracking-wider">Featured Exhibit</span>
                <span className="text-base text-[#55423E]">Texture Study #04</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#55423E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Footer / Credits */}
        <div className="relative z-10 text-xs text-[#706C65] flex justify-between w-full">
          <span>© 2024 ZuhraGraph Studio</span>
          <span>Curating excellence.</span>
        </div>
      </div>
      
      {/* Right Column: Login Form Canvas */}
      <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center p-8 md:p-16 relative">
        {/* Mobile Brand Header */}
        <div className="absolute top-8 left-8 md:hidden">
          <h1 className="text-2xl font-semibold text-[#242321] tracking-tight">ZuhraGraph</h1>
        </div>
        
        {/* Form Container */}
        <div className="w-full max-w-[400px]">
          <div className="mb-12">
            <h2 className="text-4xl md:text-3xl font-bold md:font-semibold text-[#242321] mb-2 tracking-tight">Welcome back</h2>
            <p className="text-base text-[#706C65]">Enter your credentials to access your studio space.</p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {status === 'error' && (
              <div className="bg-red-50 text-red-800 text-sm p-3 rounded border border-red-200">
                {errorMessage}
              </div>
            )}
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#221A17] uppercase tracking-wider mb-2" htmlFor="email">Email Address</label>
              <input 
                className="w-full px-4 py-3 bg-transparent border border-[#DDD7CE] rounded text-[#221A17] placeholder:text-[#CAC6C2] focus:outline-none focus:ring-1 focus:ring-[#242321] focus:border-[#242321] transition-colors text-base disabled:opacity-50" 
                id="email" 
                name="email" 
                placeholder="name@domain.com" 
                required 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'submitting' || status === 'success'}
              />
            </div>
            
            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-[#221A17] uppercase tracking-wider" htmlFor="password">Password</label>
                <a className="text-xs text-[#706C65] hover:text-[#99442F] transition-colors" href="#">Forgot password?</a>
              </div>
              <div className="relative">
                <input 
                  className="w-full px-4 py-3 pr-12 bg-transparent border border-[#DDD7CE] rounded text-[#221A17] placeholder:text-[#CAC6C2] focus:outline-none focus:ring-1 focus:ring-[#242321] focus:border-[#242321] transition-colors text-base disabled:opacity-50" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === 'submitting' || status === 'success'}
                />
                <button 
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#706C65] hover:text-[#221A17] transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={status === 'submitting' || status === 'success'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Remember Me */}
            <div className="flex items-center">
              <input 
                className="h-4 w-4 rounded border-[#DDD7CE] text-[#B85C45] focus:ring-[#B85C45] bg-transparent transition-colors cursor-pointer" 
                id="remember-me" 
                name="remember-me" 
                type="checkbox"
                disabled={status === 'submitting' || status === 'success'}
              />
              <label className="ml-2 block text-base text-[#706C65] cursor-pointer" htmlFor="remember-me">
                Remember me for 30 days
              </label>
            </div>
            
            {/* Primary Action */}
            <button 
              className="w-full bg-[#B85C45] text-white hover:bg-[#99442F] disabled:bg-[#CAC6C2] py-3 px-6 rounded text-sm font-medium uppercase tracking-wider transition-colors duration-200 flex justify-center items-center gap-2 mt-8" 
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
            >
              {status === 'submitting' ? 'Signing In...' : 'Sign In'}
              {status !== 'submitting' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-base text-[#706C65]">
              Don't have an account?{' '}
              <a className="text-[#99442F] hover:text-[#B85C45] font-semibold transition-colors underline underline-offset-4 decoration-[#DDD7CE] hover:decoration-[#99442F]" href="#">Create an account</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
