'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, BookOpen, Loader2 } from 'lucide-react'
import { useAppStore, STORY_STYLES, GENRES, MORALS, AGE_RANGES, BOOK_COVER_GRADIENTS, BOOK_COVER_EMOJIS, type Book } from '@/lib/store'

const STEPS = [
  'Story Idea',
  'Story Style',
  'Genre',
  'Reading Level',
  'Moral / Lesson',
  'Page Count',
  'Preview & Create',
]

export default function CreateBookPage() {
  const {
    setPage, currentChildId, parentAccount, addBook, setCurrentBookId,
    createBookStep, setCreateBookStep, createBookData, setCreateBookData,
  } = useAppStore()

  const currentChild = parentAccount?.children.find((c) => c.id === currentChildId)

  const [prompt, setPrompt] = useState(createBookData?.prompt || '')
  const [storyStyle, setStoryStyle] = useState(createBookData?.storyStyle || '')
  const [genre, setGenre] = useState(createBookData?.genre || '')
  const [ageRange, setAgeRange] = useState<'3-5' | '6-8' | '9-12'>(createBookData?.ageRange || currentChild?.ageRange || '3-5')
  const [moral, setMoral] = useState(createBookData?.moral || 'none')
  const [pageCount, setPageCount] = useState(createBookData?.pageCount || 6)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState('')

  const step = createBookStep

  // Save data whenever step changes
  useEffect(() => {
    setCreateBookData({ prompt, storyStyle, genre, ageRange, moral, pageCount })
  }, [prompt, storyStyle, genre, ageRange, moral, pageCount, setCreateBookData])

  const canProceed = () => {
    if (step === 0) return prompt.trim() !== ''
    if (step === 1) return storyStyle !== ''
    if (step === 2) return genre !== ''
    if (step === 3) return true
    if (step === 4) return true
    if (step === 5) return pageCount >= 4 && pageCount <= 12
    return true
  }

  const handleNext = () => {
    if (step < 6) {
      setCreateBookStep(step + 1)
    } else {
      handleGenerate()
    }
  }

  const handleBack = () => {
    if (step > 0) setCreateBookStep(step - 1)
    else setPage('child-home')
  }

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      setGenerationStep('Creating your story...')
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          storyStyle,
          genre,
          ageRange,
          moral,
          pageCount,
          childName: currentChild?.name || 'Friend',
        }),
      })

      if (!response.ok) throw new Error('Failed to generate story')

      const data = await response.json()

      setGenerationStep('Painting illustrations...')

      // Try to generate first image
      let firstImageUrl: string | undefined
      try {
        if (data.pages?.[0]?.imageDescription) {
          const imgResponse = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: data.pages[0].imageDescription }),
          })
          if (imgResponse.ok) {
            const imgData = await imgResponse.json()
            firstImageUrl = imgData.base64 ? `data:image/png;base64,${imgData.base64}` : undefined
          }
        }
      } catch {
        // Image generation failed, continue without it
      }

      setGenerationStep('Adding finishing touches...')

      const gradientIndex = Math.floor(Math.random() * BOOK_COVER_GRADIENTS.length)
      const emojiIndex = Math.floor(Math.random() * BOOK_COVER_EMOJIS.length)

      const book: Book = {
        id: crypto.randomUUID(),
        childId: currentChildId!,
        title: data.title || 'My Story',
        pages: (data.pages || []).map((p: { pageNumber: number; text: string; imageDescription?: string }, i: number) => ({
          id: crypto.randomUUID(),
          pageNumber: p.pageNumber || i + 1,
          text: p.text || '',
          imageUrl: i === 0 ? firstImageUrl : undefined,
          imageDescription: p.imageDescription || '',
          imagePosition: i === 0 ? 'top' : 'top',
        })),
        storyStyle,
        genre,
        moral,
        status: 'approved',
        favorite: false,
        readCount: 0,
        createdAt: new Date().toISOString(),
        coverGradient: BOOK_COVER_GRADIENTS[gradientIndex],
        coverEmoji: BOOK_COVER_EMOJIS[emojiIndex],
      }

      addBook(book)
      setCurrentBookId(book.id)
      setPage('book-reader')
    } catch (error) {
      console.error('Generation error:', error)
      // Create a fallback book
      const gradientIndex = Math.floor(Math.random() * BOOK_COVER_GRADIENTS.length)
      const emojiIndex = Math.floor(Math.random() * BOOK_COVER_EMOJIS.length)

      const fallbackBook: Book = {
        id: crypto.randomUUID(),
        childId: currentChildId!,
        title: `${currentChild?.name || 'My'} ${genre} Adventure`,
        pages: Array.from({ length: pageCount }, (_, i) => ({
          id: crypto.randomUUID(),
          pageNumber: i + 1,
          text: i === 0
            ? `Once upon a time, ${currentChild?.name || 'a brave child'} set off on a wonderful ${genre} adventure.`
            : i === pageCount - 1
              ? `And so ${currentChild?.name || 'our hero'} returned home, knowing that the best adventures are the ones shared with friends. The end! 🌟`
              : `The adventure continued with more exciting discoveries along the way. ${currentChild?.name || 'Our hero'} was having such a wonderful time!`,
          imageDescription: `A colorful illustration of ${currentChild?.name || 'a child'} on page ${i + 1}`,
          imagePosition: 'top' as const,
        })),
        storyStyle,
        genre,
        moral,
        status: 'approved',
        favorite: false,
        readCount: 0,
        createdAt: new Date().toISOString(),
        coverGradient: BOOK_COVER_GRADIENTS[gradientIndex],
        coverEmoji: BOOK_COVER_EMOJIS[emojiIndex],
      }

      addBook(fallbackBook)
      setCurrentBookId(fallbackBook.id)
      setPage('book-reader')
    } finally {
      setIsGenerating(false)
      setGenerationStep('')
    }
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 flex flex-col items-center justify-center p-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/30"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
          <motion.h2
            className="text-2xl font-bold text-gray-800 mb-3"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {generationStep}
          </motion.h2>
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-gray-400 text-sm mt-4">This may take a moment...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">Create a Story</h1>
            <p className="text-xs text-purple-500">Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3">
        <div className="max-w-lg mx-auto">
          <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
              initial={false}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 0: Story prompt */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">What should the story be about?</h2>
                    <p className="text-gray-500 text-sm">Describe the story you want to create</p>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A brave little fox who discovers a magical forest..."
                    className="w-full h-40 px-4 py-3 rounded-2xl bg-white border border-purple-100 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none shadow-sm"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 text-right">{prompt.length}/500</p>

                  {/* Quick suggestions */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Quick ideas:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'A magical treehouse in the clouds',
                        'A talking animal who goes on a quest',
                        'An underwater kingdom with friendly fish',
                        'A superhero who helps their friends',
                        'A dinosaur who wants to learn to fly',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setPrompt(suggestion)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-purple-100 text-xs text-gray-600 hover:bg-purple-50 hover:border-purple-200 transition-all shadow-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Story style */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Choose a story style</h2>
                    <p className="text-gray-500 text-sm">What kind of story should we create?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {STORY_STYLES.map((style) => (
                      <button
                        key={style.label}
                        onClick={() => setStoryStyle(style.label)}
                        className={`p-4 rounded-2xl text-left transition-all shadow-sm ${
                          storyStyle === style.label
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-white border border-purple-100 hover:border-indigo-200'
                        }`}
                      >
                        <span className="text-2xl">{style.icon}</span>
                        <p className={`font-medium mt-2 ${storyStyle === style.label ? 'text-white' : 'text-gray-800'}`}>
                          {style.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${storyStyle === style.label ? 'text-white/80' : 'text-gray-400'}`}>
                          {style.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Genre */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Pick a genre</h2>
                    <p className="text-gray-500 text-sm">What world will the story take place in?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {GENRES.map((g) => (
                      <button
                        key={g.label}
                        onClick={() => setGenre(g.label)}
                        className={`p-4 rounded-2xl flex items-center gap-3 transition-all shadow-sm ${
                          genre === g.label
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-white border border-purple-100 hover:border-indigo-200'
                        }`}
                      >
                        <span className="text-2xl">{g.icon}</span>
                        <span className={`font-medium capitalize ${genre === g.label ? 'text-white' : 'text-gray-800'}`}>
                          {g.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Reading level */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Reading level</h2>
                    <p className="text-gray-500 text-sm">Select the appropriate age range for the story</p>
                  </div>
                  <div className="space-y-3">
                    {AGE_RANGES.map((range) => (
                      <button
                        key={range}
                        onClick={() => setAgeRange(range)}
                        className={`w-full p-5 rounded-2xl text-left transition-all shadow-sm ${
                          ageRange === range
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-white border border-purple-100 hover:border-indigo-200'
                        }`}
                      >
                        <p className={`text-xl font-bold ${ageRange === range ? 'text-white' : 'text-gray-800'}`}>
                          Ages {range}
                        </p>
                        <p className={`text-sm mt-1 ${ageRange === range ? 'text-white/80' : 'text-gray-400'}`}>
                          {range === '3-5' && 'Simple words, short sentences, lots of repetition'}
                          {range === '6-8' && 'Growing vocabulary, medium-length sentences'}
                          {range === '9-12' && 'Rich vocabulary, complex narratives and themes'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Moral */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Moral or lesson</h2>
                    <p className="text-gray-500 text-sm">Should the story teach something?</p>
                  </div>
                  <div className="space-y-2">
                    {MORALS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMoral(m.value)}
                        className={`w-full p-4 rounded-2xl text-left transition-all shadow-sm ${
                          moral === m.value
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-white border border-purple-100 hover:border-indigo-200'
                        }`}
                      >
                        <span className={`font-medium ${moral === m.value ? 'text-white' : 'text-gray-800'}`}>
                          {m.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Page count */}
              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">How many pages?</h2>
                    <p className="text-gray-500 text-sm">Choose the length of your story (4-12 pages)</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setPageCount(Math.max(4, pageCount - 1))}
                        className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 font-bold text-xl hover:bg-purple-100 transition-colors"
                      >
                        −
                      </button>
                      <div className="text-center">
                        <p className="text-5xl font-bold text-gray-800">{pageCount}</p>
                        <p className="text-sm text-gray-400 mt-1">pages</p>
                      </div>
                      <button
                        onClick={() => setPageCount(Math.min(12, pageCount + 1))}
                        className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 font-bold text-xl hover:bg-purple-100 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {[4, 5, 6, 8, 10, 12].map((count) => (
                        <button
                          key={count}
                          onClick={() => setPageCount(count)}
                          className={`py-2 rounded-xl text-sm font-medium transition-all ${
                            pageCount === count
                              ? 'bg-indigo-500 text-white'
                              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>

                    <p className="text-xs text-gray-400 text-center mt-4">
                      {pageCount <= 5 ? '📖 Short & sweet story' : pageCount <= 8 ? '📖 Perfect bedtime story' : '📖 Extended adventure'}
                    </p>
                  </div>

                  {/* Illustration settings */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      Illustration Settings
                    </h3>
                    <p className="text-sm text-gray-500">
                      AI-generated watercolor illustrations will be created for each page of your story.
                      The first page illustration will be generated immediately; others will load as you read.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 6: Preview */}
              {step === 6 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Ready to create!</h2>
                    <p className="text-gray-500 text-sm">Review your story settings</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase">Story Idea</p>
                      <p className="text-gray-800 mt-1">{prompt}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase">Style</p>
                        <p className="text-gray-800 mt-1">{STORY_STYLES.find((s) => s.label === storyStyle)?.icon} {storyStyle}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase">Genre</p>
                        <p className="text-gray-800 mt-1 capitalize">{GENRES.find((g) => g.label === genre)?.icon} {genre}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase">Reading Level</p>
                        <p className="text-gray-800 mt-1">Ages {ageRange}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase">Moral</p>
                        <p className="text-gray-800 mt-1">{MORALS.find((m) => m.value === moral)?.label}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase">Pages</p>
                      <p className="text-gray-800 mt-1">{pageCount} pages with AI illustrations</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-700">
                      ✨ Your story will be personalized for <strong>{currentChild?.name || 'your child'}</strong> with age-appropriate
                      content and beautiful watercolor illustrations.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-purple-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl bg-white border border-purple-100 text-gray-700 font-medium hover:bg-purple-50 transition-all flex items-center justify-center gap-2 shadow-sm"
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
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step === 6 ? (
              <>
                <Sparkles className="w-4 h-4" />
                Create Story
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
