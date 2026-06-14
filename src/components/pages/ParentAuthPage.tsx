'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Lock } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function ParentAuthPage() {
  const { setPage, parentAccount, setAuthenticated, setMode } = useAppStore()
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [shakeKey, setShakeKey] = useState(0)

  const handlePasscodeDigit = (digit: string) => {
    if (passcode.length >= 4) return
    setError('')
    const newPasscode = passcode + digit
    setPasscode(newPasscode)

    if (newPasscode.length === 4) {
      // Check passcode
      if (!parentAccount?.passcode) {
        // No passcode set, allow through
        setTimeout(() => {
          setAuthenticated(true)
          setMode('parent')
          setPage('parent-dashboard')
        }, 300)
      } else if (newPasscode === parentAccount.passcode) {
        // Correct passcode
        setTimeout(() => {
          setAuthenticated(true)
          setMode('parent')
          setPage('parent-dashboard')
        }, 300)
      } else {
        // Wrong passcode
        setError('Incorrect passcode. Try again.')
        setShakeKey((k) => k + 1)
        setTimeout(() => setPasscode(''), 600)
      }
    }
  }

  const handleDeleteDigit = () => {
    setPasscode(passcode.slice(0, -1))
    setError('')
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
          <h1 className="text-3xl font-bold text-white mb-2">Enter Passcode</h1>
          <p className="text-purple-200/70">Enter your 4-digit passcode to access parent mode</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Passcode display */}
          <motion.div
            key={shakeKey}
            className="flex justify-center gap-5 mb-8"
            animate={error ? { x: [0, -12, 12, -12, 12, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  i < passcode.length
                    ? 'bg-indigo-500 border-2 border-indigo-400 shadow-lg shadow-indigo-500/30'
                    : 'bg-white/5 border-2 border-white/20'
                }`}
              >
                {i < passcode.length && (
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white"
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
          <div className="grid grid-cols-3 gap-3 max-w-[300px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
              <button
                key={key || 'empty'}
                onClick={() => {
                  if (key === 'del') handleDeleteDigit()
                  else if (key) handlePasscodeDigit(key)
                }}
                disabled={key === ''}
                className={`h-16 rounded-2xl text-2xl font-semibold transition-all ${
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
        </motion.div>
      </div>
    </div>
  )
}
