'use client'

import { motion } from 'framer-motion'
import { Plus, ChevronLeft, LogOut } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function SelectChildPage() {
  const { parentAccount, setPage, setCurrentChildId, setMode, clearParentAccount } = useAppStore()

  const children = parentAccount?.children || []

  const selectChild = (childId: string) => {
    setCurrentChildId(childId)
    setMode('child')
    setPage('child-home')
  }

  const addChild = () => {
    useAppStore.getState().setOnboardingStep(2)
    setPage('onboarding')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 flex flex-col p-6 relative overflow-hidden">
      {/* Animated orbs */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setPage('select-mode')}
            className="text-purple-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => {
              clearParentAccount()
              setPage('welcome')
            }}
            className="text-purple-400/60 hover:text-purple-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Who&apos;s reading?</h1>
          <p className="text-purple-200/70">Select a profile to continue</p>
        </motion.div>

        {/* Children grid */}
        <div className="grid grid-cols-2 gap-4">
          {children.map((child, i) => (
            <motion.button
              key={child.id}
              onClick={() => selectChild(child.id)}
              className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 flex flex-col items-center gap-3 hover:bg-white/10 hover:border-indigo-400/50 transition-all group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-5xl group-hover:scale-110 transition-transform">{child.avatar}</span>
              <span className="text-white font-medium">{child.name}</span>
              <span className="text-xs text-purple-200/50">Ages {child.ageRange}</span>
            </motion.button>
          ))}

          {/* Add Child */}
          <motion.button
            onClick={addChild}
            className="rounded-2xl bg-white/5 backdrop-blur-sm border-2 border-dashed border-white/20 p-6 flex flex-col items-center gap-3 hover:bg-white/10 hover:border-white/40 transition-all group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: children.length * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <Plus className="w-8 h-8 text-purple-300" />
            </div>
            <span className="text-purple-200/70 font-medium">Add Child</span>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
