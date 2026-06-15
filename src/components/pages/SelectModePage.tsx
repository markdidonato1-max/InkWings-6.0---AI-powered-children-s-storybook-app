'use client'

import { motion } from 'framer-motion'
import { Shield, Sparkles, ChevronLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function SelectModePage() {
  const { setPage, parentAccount, setMode, setCurrentChildId } = useAppStore()

  const handleParentMode = () => {
    setPage('parent-auth')
  }

  const handleChildMode = () => {
    const children = parentAccount?.children || []
    if (children.length === 1) {
      setCurrentChildId(children[0].id)
      setMode('child')
      setPage('child-home')
    } else if (children.length > 1) {
      setPage('select-child')
    } else {
      setPage('onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 flex flex-col p-6 relative overflow-hidden">
      {/* Animated orbs */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-md mx-auto w-full flex flex-col flex-1">
        {/* Back */}
        <button
          onClick={() => setPage('welcome')}
          className="text-purple-300 hover:text-white transition-colors mb-8 flex items-center gap-1"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Choose Mode</h1>
          <p className="text-purple-200/70">Select how you&apos;d like to use InkWings</p>
        </motion.div>

        <div className="space-y-4 flex-1 flex flex-col justify-center">
          {/* Parent Mode */}
          <motion.button
            onClick={handleParentMode}
            className="w-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 text-left hover:bg-white/10 hover:border-indigo-400/50 transition-all group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/30">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Parent Mode</h3>
                <p className="text-purple-200/60 text-sm">
                  Manage accounts, set controls, view reading stats, and approve content. Requires passcode.
                </p>
              </div>
            </div>
          </motion.button>

          {/* Child Mode */}
          <motion.button
            onClick={handleChildMode}
            className="w-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 text-left hover:bg-white/10 hover:border-pink-400/50 transition-all group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Child Mode</h3>
                <p className="text-purple-200/60 text-sm">
                  Read stories, create new books, and explore magical adventures. No authentication needed.
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
