'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, UserPlus, Baby, Lock, Settings, Shield } from 'lucide-react'
import { useAppStore, AVATARS, AGE_RANGES, STORY_STYLES, GENRES, MORALS, type ChildProfile } from '@/lib/store'

const STEPS = [
  { label: 'Parent Profile', icon: UserPlus },
  { label: 'Set Passcode', icon: Lock },
  { label: 'Add Children', icon: Baby },
  { label: 'Preferences', icon: Settings },
  { label: 'COPPA', icon: Shield },
]

export default function OnboardingPage() {
  const { setPage, setParentAccount, setMode, setCurrentChildId, onboardingStep, setOnboardingStep } = useAppStore()

  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [authMethod, setAuthMethod] = useState<'apple' | 'google' | 'passcode'>('passcode')

  // Passcode state
  const [passcodeEntry, setPasscodeEntry] = useState('')
  const [passcodeConfirm, setPasscodeConfirm] = useState('')
  const [passcodePhase, setPasscodePhase] = useState<'create' | 'confirm'>('create')
  const [passcodeShakeKey, setPasscodeShakeKey] = useState(0)
  const [passcodeError, setPasscodeError] = useState('')
  const [confirmedPasscode, setConfirmedPasscode] = useState('')

  const [children, setChildren] = useState<Partial<ChildProfile>[]>([
    { name: '', ageRange: '3-5', avatar: '🦊', preferences: { favoriteGenres: [], favoriteStyles: [], preferredMoral: 'none' } },
  ])

  const [defaultStyle, setDefaultStyle] = useState('')
  const [defaultGenre, setDefaultGenre] = useState('')
  const [defaultMoral, setDefaultMoral] = useState('none')

  const [coppaAgreed, setCoppaAgreed] = useState(false)

  const step = onboardingStep

  const canProceed = () => {
    if (step === 0) return parentName.trim() !== '' && parentEmail.trim() !== ''
    if (step === 1) return confirmedPasscode.length === 4
    if (step === 2) return children.some((c) => c.name?.trim() !== '')
    if (step === 3) return true
    if (step === 4) return coppaAgreed
    return false
  }

  const handleNext = () => {
    if (step < 4) {
      setOnboardingStep(step + 1)
    } else {
      // Complete onboarding
      const validChildren = children
        .filter((c) => c.name?.trim() !== '')
        .map((c) => ({
          id: crypto.randomUUID(),
          name: c.name || '',
          ageRange: c.ageRange || '3-5',
          avatar: c.avatar || '🦊',
          preferences: c.preferences || { favoriteGenres: [], favoriteStyles: [], preferredMoral: 'none' },
          readingStats: { totalBooksRead: 0, totalPagesRead: 0, totalReadingTimeMinutes: 0, averageSessionMinutes: 0 },
          vocabularyProgress: { totalWordsLearned: 0, masteredWords: [], learningWords: [], newWords: [], wordHistory: [] },
          rememberMe: false,
          createdAt: new Date().toISOString(),
        }))

      const parentAccount = {
        id: crypto.randomUUID(),
        name: parentName,
        email: parentEmail,
        authMethod,
        passcode: confirmedPasscode,
        children: validChildren,
        subscription: { status: 'trial' as const, expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
        createdAt: new Date().toISOString(),
      }

      setParentAccount(parentAccount)
      if (validChildren.length > 0) {
        setCurrentChildId(validChildren[0].id)
      }
      setMode('child')
      setPage('child-home')
    }
  }

  const handleBack = () => {
    if (step > 0) setOnboardingStep(step - 1)
    else setPage('welcome')
  }

  const addChild = () => {
    setChildren([
      ...children,
      { name: '', ageRange: '3-5', avatar: AVATARS[children.length % AVATARS.length], preferences: { favoriteGenres: [], favoriteStyles: [], preferredMoral: 'none' } },
    ])
  }

  const updateChild = (index: number, updates: Partial<ChildProfile>) => {
    const updated = [...children]
    updated[index] = { ...updated[index], ...updates }
    setChildren(updated)
  }

  const removeChild = (index: number) => {
    if (children.length <= 1) return
    setChildren(children.filter((_, i) => i !== index))
  }

  // Passcode numpad handler
  const handlePasscodeDigit = (digit: string) => {
    setPasscodeError('')
    if (passcodePhase === 'create') {
      if (passcodeEntry.length >= 4) return
      const newPasscode = passcodeEntry + digit
      setPasscodeEntry(newPasscode)
      if (newPasscode.length === 4) {
        // Move to confirm phase
        setTimeout(() => {
          setPasscodePhase('confirm')
        }, 300)
      }
    } else {
      if (passcodeConfirm.length >= 4) return
      const newConfirm = passcodeConfirm + digit
      setPasscodeConfirm(newConfirm)
      if (newConfirm.length === 4) {
        // Check if they match
        if (newConfirm === passcodeEntry) {
          setConfirmedPasscode(newConfirm)
        } else {
          // Shake and reset
          setPasscodeError('Passcodes don\'t match. Try again.')
          setPasscodeShakeKey((k) => k + 1)
          setTimeout(() => {
            setPasscodeEntry('')
            setPasscodeConfirm('')
            setPasscodePhase('create')
            setPasscodeError('')
          }, 800)
        }
      }
    }
  }

  const handlePasscodeDelete = () => {
    setPasscodeError('')
    if (passcodePhase === 'confirm') {
      setPasscodeConfirm(passcodeConfirm.slice(0, -1))
    } else {
      setPasscodeEntry(passcodeEntry.slice(0, -1))
    }
  }

  const currentPasscodeValue = passcodePhase === 'create' ? passcodeEntry : passcodeConfirm

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 flex flex-col p-6 relative overflow-hidden">
      {/* Animated orbs */}
      <motion.div
        className="absolute top-20 right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-lg mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={handleBack} className="text-purple-300 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Set Up InkWings</h1>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  i < step
                    ? 'bg-indigo-500 text-white'
                    : i === step
                      ? 'bg-indigo-500/30 border-2 border-indigo-400 text-indigo-300'
                      : 'bg-white/10 text-white/40'
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-indigo-500' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {/* Step 0: Parent Profile */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Create your profile</h2>
                  <p className="text-purple-200/70">Tell us about yourself to get started</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-purple-200 mb-1.5 block">Your Name</label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-purple-200 mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Set Passcode */}
            {step === 1 && (
              <div className="space-y-6 flex flex-col items-center">
                <div className="text-center">
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Lock className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {passcodePhase === 'create' ? 'Create a passcode' : 'Confirm your passcode'}
                  </h2>
                  <p className="text-purple-200/70 text-sm">
                    {passcodePhase === 'create'
                      ? 'This will protect parent mode access'
                      : 'Enter the passcode again to confirm'}
                  </p>
                </div>

                {/* Digit circles */}
                <motion.div
                  key={passcodeShakeKey}
                  className="flex justify-center gap-5 my-4"
                  animate={passcodeError ? { x: [0, -12, 12, -12, 12, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                        i < currentPasscodeValue.length
                          ? 'bg-indigo-500 border-2 border-indigo-400 shadow-lg shadow-indigo-500/30'
                          : 'bg-white/5 border-2 border-white/20'
                      }`}
                    >
                      {i < currentPasscodeValue.length && (
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

                {passcodeError && (
                  <motion.p
                    className="text-red-400 text-sm text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {passcodeError}
                  </motion.p>
                )}

                {confirmedPasscode && (
                  <motion.div
                    className="flex items-center gap-2 text-green-400 text-sm"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Check className="w-4 h-4" />
                    Passcode set successfully
                  </motion.div>
                )}

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-3 max-w-[300px] mx-auto mt-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
                    <button
                      key={key || 'empty'}
                      onClick={() => {
                        if (key === 'del') handlePasscodeDelete()
                        else if (key) handlePasscodeDigit(key)
                      }}
                      disabled={key === '' || !!confirmedPasscode}
                      className={`h-16 rounded-2xl text-2xl font-semibold transition-all ${
                        key === ''
                          ? 'invisible'
                          : key === 'del'
                            ? 'bg-white/5 text-white/60 hover:bg-white/10 active:scale-95'
                            : 'bg-white/10 text-white hover:bg-white/20 active:scale-95 active:bg-white/15'
                      } ${confirmedPasscode ? 'opacity-50' : ''}`}
                    >
                      {key === 'del' ? '⌫' : key}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Add Children */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Add your children</h2>
                  <p className="text-purple-200/70">Create profiles for each child who will use InkWings</p>
                </div>

                <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                  {children.map((child, index) => (
                    <motion.div
                      key={index}
                      className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-purple-200">Child {index + 1}</span>
                        {children.length > 1 && (
                          <button
                            onClick={() => removeChild(index)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          value={child.name || ''}
                          onChange={(e) => updateChild(index, { name: e.target.value })}
                          placeholder="Child's first name"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all text-sm"
                        />

                        {/* Age range */}
                        <div>
                          <label className="text-xs font-medium text-purple-200/70 mb-1.5 block">Age Range</label>
                          <div className="flex gap-2">
                            {AGE_RANGES.map((range) => (
                              <button
                                key={range}
                                onClick={() => updateChild(index, { ageRange: range })}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                                  child.ageRange === range
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-white/5 border border-white/10 text-white/60'
                                }`}
                              >
                                Ages {range}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Avatar selection */}
                        <div>
                          <label className="text-xs font-medium text-purple-200/70 mb-1.5 block">Choose Avatar</label>
                          <div className="flex flex-wrap gap-2">
                            {AVATARS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => updateChild(index, { avatar: emoji })}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                                  child.avatar === emoji
                                    ? 'bg-indigo-500/30 border-2 border-indigo-400 scale-110'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={addChild}
                  className="w-full py-3 rounded-xl bg-white/5 border border-dashed border-white/20 text-purple-200 hover:bg-white/10 hover:border-white/30 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Another Child
                </button>
              </div>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Default preferences</h2>
                  <p className="text-purple-200/70">Set default story preferences (can be changed later)</p>
                </div>

                <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                  {/* Story Style */}
                  <div>
                    <label className="text-sm font-medium text-purple-200 mb-2 block">Favorite Story Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {STORY_STYLES.map((style) => (
                        <button
                          key={style.label}
                          onClick={() => setDefaultStyle(style.label)}
                          className={`p-3 rounded-xl text-left transition-all ${
                            defaultStyle === style.label
                              ? 'bg-indigo-500/30 border-2 border-indigo-400'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-lg">{style.icon}</span>
                          <p className="text-sm text-white font-medium mt-1">{style.label}</p>
                          <p className="text-xs text-purple-200/60 mt-0.5">{style.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Genre */}
                  <div>
                    <label className="text-sm font-medium text-purple-200 mb-2 block">Favorite Genre</label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map((genre) => (
                        <button
                          key={genre.label}
                          onClick={() => setDefaultGenre(genre.label)}
                          className={`px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5 ${
                            defaultGenre === genre.label
                              ? 'bg-indigo-500 text-white'
                              : 'bg-white/5 border border-white/10 text-white/70'
                          }`}
                        >
                          <span>{genre.icon}</span>
                          {genre.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Moral */}
                  <div>
                    <label className="text-sm font-medium text-purple-200 mb-2 block">Preferred Moral/Lesson</label>
                    <div className="flex flex-wrap gap-2">
                      {MORALS.map((moral) => (
                        <button
                          key={moral.value}
                          onClick={() => setDefaultMoral(moral.value)}
                          className={`px-3 py-2 rounded-xl text-sm transition-all ${
                            defaultMoral === moral.value
                              ? 'bg-indigo-500 text-white'
                              : 'bg-white/5 border border-white/10 text-white/70'
                          }`}
                        >
                          {moral.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: COPPA */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">COPPA Compliance</h2>
                  <p className="text-purple-200/70">We take children&apos;s privacy seriously</p>
                </div>

                <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-8 h-8 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">Children&apos;s Online Privacy Protection</h3>
                      <p className="text-sm text-purple-200/70 leading-relaxed">
                        InkWings is committed to complying with the Children&apos;s Online Privacy Protection Act (COPPA).
                        We only collect the minimum information necessary to provide our service and never share your
                        child&apos;s data with third parties for marketing purposes.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-purple-200/70">
                    <p>✅ We only collect parent-verified account information</p>
                    <p>✅ Child profiles are stored locally on your device</p>
                    <p>✅ No personal data is sold to third parties</p>
                    <p>✅ You can delete all data at any time</p>
                    <p>✅ Stories are generated locally and not stored on external servers</p>
                  </div>

                  <div className="flex items-start gap-3 cursor-pointer group" onClick={() => setCoppaAgreed(!coppaAgreed)}>
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5 shrink-0 ${
                        coppaAgreed
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-white/30 group-hover:border-white/50'
                      }`}
                    >
                      {coppaAgreed && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-sm text-purple-200/80 leading-relaxed">
                      I confirm that I am the parent or legal guardian of the children added to this account,
                      and I consent to InkWings collecting and processing the information provided as described
                      in the{' '}
                      <span
                        onClick={(e) => { e.stopPropagation(); useAppStore.getState().setLegalPageType('privacy'); setPage('legal') }}
                        className="text-indigo-400 underline hover:text-indigo-300 cursor-pointer"
                      >
                        Privacy Policy
                      </span>
                      .
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom navigation */}
        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              canProceed()
                ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/30'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {step === 4 ? 'Get Started' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
