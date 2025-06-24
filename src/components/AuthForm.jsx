// components/AuthForm.js
import React, { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = isLogin
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950">
      <div className="w-full max-w-md transform transition-all duration-500 hover:scale-105">
        {/* Main Card */}
        <div className="bg-amber-100/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-amber-300/30 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-300/20 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

          {/* Header */}
          <div className="relative z-10 text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl mb-4 shadow-lg transform transition-transform duration-300 hover:rotate-12">
              <svg
                className="w-8 h-8 text-amber-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-800 mb-2 transition-all duration-300">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-amber-600 text-sm">
              {isLogin ? "Sign in to continue" : "Join us today"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Email Input */}
            <div className="group">
              <label className="block text-sm font-medium text-amber-900 mb-2 transition-colors duration-200">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 sm:py-4 text-amber-900 bg-stone-50 border-2 border-amber-800 rounded-2xl focus:border-amber-700 focus:bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-200/50 transition-all duration-300 placeholder-amber-700 text-sm sm:text-base"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-amber-400 group-focus-within:text-amber-600 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-sm font-medium text-amber-900 mb-2 transition-colors duration-200">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 sm:py-4 text-amber-900 bg-stone-50 border-2 border-amber-800 rounded-2xl focus:border-amber-700 focus:bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-200/50 transition-all duration-300 placeholder-amber-700 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 hover:text-amber-600 transition-colors duration-200 focus:outline-none"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-4 px-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-amber-50 font-semibold rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-amber-300/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base relative overflow-hidden group"
            >
              <span className="relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-50 rounded-full animate-spin"></div>
                    <span>Please wait...</span>
                  </div>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Sign Up"
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {/* Toggle Button */}
          <div className="mt-8 text-center relative z-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-amber-900"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-amber-400 rounded-full text-amber-900">
                  or
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="mt-4 text-amber-600 hover:text-amber-800 font-medium transition-all duration-300 hover:underline decoration-2 underline-offset-4 text-sm sm:text-base transform hover:scale-105"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
