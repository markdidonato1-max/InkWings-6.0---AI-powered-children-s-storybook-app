'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Lock, Fingerprint } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function ParentAuthPage() {
  const { setPage, parentAccount, setAuthenticated, setMode } = useAppStore()
  const [authMethod, setAuthMethod] = useState<'apple' | 'google' | 'passcode' | null>(null)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [shakeKey, setShakeKey] = useState(0)

  const handlePasscodeDigit = (digit: string) => {
    if (passcode.length >= 4) return
    const newPasscode = passcode + digit
    setPasscode(newPasscode)
    setError('')

    if (newPasscode.length === 4) {
      // Check passcode
      if (parentAccount?.passcode && newPasscode === parentAccount.passcode) {
        setAuthenticated(true)
        setMode('parent')
        setPage('parent-dashboard')
      } else if (!parentAccount?.passcode) {
        // No passcode set, just authenticate
        setAuthenticated(true)
        setMode('parent')
        setPage('parent-dashboard')
      } else {
        setError('Incorrect passcode')
        setShakeKey((k) => k + 1)
        setTimeout(() => setPasscode(''), 600)
      }
    }
  }

  const handleDeleteDigit = () => {
    setPasscode(passcode.slice(0, -1))
    setError('')
  }

  const handleSocialAuth = (method: 'apple' | 'google') => {
    // Simulate social auth
    setAuthMethod(method)
    setTimeout(() => {
      setAuthenticated(true)
      setMode('parent')
      setPage('parent-dashboard')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated orbs */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-sm w-full">
        {/* Back button */}
        <button
          onClick={() => setPage('select-mode')}
          className="text-purple-300 hover:text-white transition-colors mb-8 flex items-center gap-1"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-purple-200/70">Authenticate to access parent mode</p>
        </motion.div>

        {/* Auth method selection or passcode entry */}
        {!authMethod || authMethod === 'passcode' ? (
          <motion.div
            key="passcode"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Passcode display */}
            <motion.div
              key={shakeKey}
              className="flex justify-center gap-4 mb-8"
              animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    i < passcode.length
                      ? 'bg-indigo-500 border-2 border-indigo-400 shadow-lg shadow-indigo-500/30'
                      : 'bg-white/5 border-2 border-white/20'
                  }`}
                >
                  {i < passcode.length && (
                    <motion.div
                      className="w-4 h-4 rounded-full bg-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    />
                  )}
                </div>
              ))}
            </motion.div>

            {error && (
              <motion.p
                className="text-red-400 text-sm text-center mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
                <button
                  key={key || 'empty'}
                  onClick={() => {
                    if (key === 'del') handleDeleteDigit()
                    else if (key) handlePasscodeDigit(key)
                  }}
                  disabled={key === ''}
                  className={`h-16 rounded-2xl text-xl font-semibold transition-all ${
                    key === ''
                      ? 'invisible'
                      : key === 'del'
                        ? 'bg-white/5 text-white/60 hover:bg-white/10 active:scale-95'
                        : 'bg-white/10 text-white hover:bg-white/20 active:scale-95 active:bg-white/15'
                  }`}
                >
                  {key === 'del' ? '⌫' : key}
                </button>
              ))}
            </div>

            {/* Social auth alternatives */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/40">or sign in with</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                onClick={() => handleSocialAuth('apple')}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-6 rounded-2xl shadow-lg hover:bg-gray-100 active:scale-[0.98] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </button>

              <button
                onClick={() => handleSocialAuth('google')}
                className="w-full flex items-center justify-center gap-3 bg-black text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:bg-gray-900 active:scale-[0.98] transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="social"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              {authMethod === 'apple' ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              ) : (
                <Fingerprint className="w-12 h-12 text-indigo-400" />
              )}
            </motion.div>
            <p className="text-purple-200 mt-4">Authenticating with {authMethod}...</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
