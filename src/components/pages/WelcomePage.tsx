'use client'

import { motion } from 'framer-motion'
import { BookOpen, Sparkles, Shield } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function WelcomePage() {
  const setPage = useAppStore((s) => s.setPage)
  const setLegalPageType = useAppStore((s) => s.setLegalPageType)

  const handleAppleSignIn = () => {
    // Simulate Apple Sign In
    setPage('onboarding')
  }

  const handleGoogleSignIn = () => {
    // Simulate Google Sign In
    setPage('onboarding')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated glowing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <motion.div
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <BookOpen className="w-12 h-12 text-white" />
        </motion.div>

        <motion.h1
          className="text-4xl font-bold text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          InkWings
        </motion.h1>

        <motion.p
          className="text-lg text-purple-200 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Where stories take flight ✨
        </motion.p>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { icon: Sparkles, title: 'AI-powered personalized stories', color: 'from-indigo-500/20 to-purple-500/20' },
            { icon: BookOpen, title: 'Beautiful illustrations for every page', color: 'from-purple-500/20 to-pink-500/20' },
            { icon: Shield, title: 'Safe & COPPA compliant for kids', color: 'from-pink-500/20 to-indigo-500/20' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className={`rounded-2xl bg-gradient-to-br ${feature.color} backdrop-blur-sm border border-white/10 p-4 flex flex-col items-center text-center gap-2`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
            >
              <feature.icon className="w-8 h-8 text-indigo-300" />
              <p className="text-sm text-purple-100 leading-snug">{feature.title}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Sign in buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          {/* Apple Sign In */}
          <button
            onClick={handleAppleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3.5 px-6 rounded-2xl shadow-lg hover:bg-gray-100 active:scale-[0.98] transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Sign in with Apple
          </button>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-black text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg hover:bg-gray-900 active:scale-[0.98] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          {/* Admin link */}
          <button
            onClick={() => setPage('admin')}
            className="text-purple-400/60 text-xs hover:text-purple-300 transition-colors mt-2"
          >
            Admin Panel
          </button>
        </motion.div>

        {/* Legal links */}
        <motion.div
          className="flex gap-4 mt-6 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <button
            onClick={() => { setLegalPageType('terms'); setPage('legal') }}
            className="text-purple-300/70 hover:text-purple-200 transition-colors underline"
          >
            Terms of Service
          </button>
          <button
            onClick={() => { setLegalPageType('privacy'); setPage('legal') }}
            className="text-purple-300/70 hover:text-purple-200 transition-colors underline"
          >
            Privacy Policy
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-purple-400/40 text-xs mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          © 2024 InkWings. Made with ❤️ for young readers.
        </motion.p>
      </motion.div>
    </div>
  )
}
