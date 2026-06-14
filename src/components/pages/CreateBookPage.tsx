'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, BookOpen, Image, Loader2, Camera, Upload, X } from 'lucide-react'
import { useAppStore, STORY_STYLES, GENRES, MORALS, AGE_RANGES, BOOK_COVER_GRADIENTS, BOOK_COVER_EMOJIS, type Book, type BookPage } from '@/lib/store'

const STEPS = [
  'Story Idea & Drawing',
  'Story Style',
  'Genre',
  'Reading Level',
  'Moral / Lesson',
  'Pages & Illustrations',
  'Preview & Create',
]

const PAGE_PRESETS = [
  { label: 'Short', emoji: '📖', pages: 6, images: 3 },
  { label: 'Medium', emoji: '📚', pages: 10, images: 5 },
  { label: 'Long', emoji: '📗', pages: 14, images: 7 },
  { label: 'Epic', emoji: '📕', pages: 20, images: 10 },
]

// Calculate which pages get images based on imageCount and pageCount
// Images are placed every 2 pages: image i goes on page (i*2) (0-indexed)
// If odd pages, the last image covers just 1 page
function getImagePositions(pageCount: number, imageCount: number): Set<number> {
  const positions = new Set<number>()
  if (imageCount <= 0 || pageCount <= 0) return positions

  // Place images every 2 pages from the start
  for (let i = 0; i < imageCount; i++) {
    const pos = i * 2
    if (pos < pageCount) {
      positions.add(pos)
    } else {
      // If more images than pairs, distribute remaining at the end
      const remaining = imageCount - i
      const startPos = pageCount - remaining
      for (let j = i; j < imageCount; j++) {
        positions.add(Math.max(startPos + (j - i), 0))
      }
      break
    }
  }
  return positions
}

// Get the text of the pages that an image covers for the prompt
// Image i covers pages (2i) and (2i+1). If odd pages and last image, covers just 1 page.
function getImagePromptText(pages: { text: string }[], imageIndex: number): string {
  const startPage = imageIndex * 2
  const endPage = Math.min(startPage + 1, pages.length - 1)

  let combinedText = ''
  for (let i = startPage; i <= endPage; i++) {
    if (pages[i]?.text) {
      combinedText += pages[i].text + ' '
    }
  }
  return combinedText.trim()
}

export default function CreateBookPage() {
  const {
    setPage, currentChildId, parentAccount, addBook, setCurrentBookId,
    createBookStep, setCreateBookStep, createBookData, setCreateBookData,
    nvidiaApiKey, nvidiaStoryModel, nvidiaImageStyle, nvidiaImageModel,
  } = useAppStore()

  const currentChild = parentAccount?.children.find((c) => c.id === currentChildId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [prompt, setPrompt] = useState(createBookData?.prompt || '')
  const [storyStyle, setStoryStyle] = useState(createBookData?.storyStyle || '')
  const [genre, setGenre] = useState(createBookData?.genre || '')
  const [ageRange, setAgeRange] = useState<'3-5' | '6-8' | '9-12'>(createBookData?.ageRange || currentChild?.ageRange || '3-5')
  const [moral, setMoral] = useState(createBookData?.moral || 'none')
  const [pageCount, setPageCount] = useState(createBookData?.pageCount || 6)
  const [imageCount, setImageCount] = useState(createBookData?.imageCount || 3)
  const [drawingPhoto, setDrawingPhoto] = useState<string | null>(createBookData?.drawingPhoto || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState('')
  const [generationProgress, setGenerationProgress] = useState(0)

  const step = createBookStep

  // Default image count = ceil(pageCount / 2), capped at 10
  const defaultImageCount = Math.min(10, Math.ceil(pageCount / 2))

  // Auto-adjust imageCount when pageCount changes
  useEffect(() => {
    const maxImages = Math.min(10, pageCount)
    if (imageCount > maxImages) {
      setImageCount(maxImages)
    }
  }, [pageCount])

  // Save data whenever values change
  useEffect(() => {
    setCreateBookData({ prompt, storyStyle, genre, ageRange, moral, pageCount, imageCount, drawingPhoto })
  }, [prompt, storyStyle, genre, ageRange, moral, pageCount, imageCount, drawingPhoto, setCreateBookData])

  const canProceed = () => {
    if (step === 0) return prompt.trim() !== ''
    if (step === 1) return storyStyle !== ''
    if (step === 2) return genre !== ''
    if (step === 3) return true
    if (step === 4) return true
    if (step === 5) return pageCount >= 4 && pageCount <= 20 && imageCount >= 1 && imageCount <= Math.min(10, pageCount)
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

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) return

    // Resize and convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = document.createElement('img')
      img.onload = () => {
        // Resize to max 1024x1024 for API calls
        const canvas = document.createElement('canvas')
        const maxSize = 1024
        let width = img.width
        let height = img.height

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const base64 = canvas.toDataURL('image/png').split(',')[1]
        setDrawingPhoto(base64)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const removePhoto = () => {
    setDrawingPhoto(null)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Step 1: Generate story text
      setGenerationStep('Creating your story...')

      const requestBody: Record<string, unknown> = {
        prompt,
        storyStyle,
        genre,
        ageRange,
        moral,
        pageCount,
        imageCount,
        childName: currentChild?.name || 'Friend',
      }

      // Use NVIDIA API if key is set, otherwise use default
      const storyEndpoint = nvidiaApiKey ? '/api/nvidia-story' : '/api/generate-story'

      if (nvidiaApiKey) {
        requestBody.apiKey = nvidiaApiKey
        requestBody.model = nvidiaStoryModel
      }

      const response = await fetch(storyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) throw new Error('Failed to generate story')

      const data = await response.json()
      setGenerationProgress(30)

      // Step 2: Plan illustrations
      setGenerationStep('Planning illustrations...')
      await new Promise((r) => setTimeout(r, 500))
      setGenerationProgress(40)

      // Determine image positions
      const imagePositions = getImagePositions(pageCount, imageCount)

      // Build pages with hasImage
      const pagesData: BookPage[] = (data.pages || []).map((p: { pageNumber: number; text: string; imageDescription?: string; hasImage?: boolean }, i: number) => ({
        id: crypto.randomUUID(),
        pageNumber: p.pageNumber || i + 1,
        text: p.text || '',
        imageUrl: undefined,
        imageDescription: '',
        imagePosition: 'top' as const,
        hasImage: imagePositions.has(i),
      }))

      // Step 3: Generate images for pages that have images
      let imagesGenerated = 0
      const totalImages = imageCount
      const imagePageIndices = Array.from(imagePositions).sort((a, b) => a - b)

      for (const pageIdx of imagePageIndices) {
        imagesGenerated++
        setGenerationStep(`Painting image ${imagesGenerated} of ${totalImages}...`)
        setGenerationProgress(40 + Math.round((imagesGenerated / totalImages) * 50))

        // Use the text of the 2 pages this image covers as the prompt
        // Image i covers pages (2i) and (2i+1); if odd pages, last image covers 1 page
        const imageIndex = imagesGenerated - 1
        const combinedText = getImagePromptText(pagesData, imageIndex)
        const imagePrompt = combinedText || data.pages[pageIdx]?.imageDescription || `A colorful watercolor illustration for page ${pageIdx + 1}`

        try {
          const imgRequestBody: Record<string, unknown> = {
            prompt: imagePrompt,
            style: nvidiaImageStyle,
          }

          // Always use nvidia-image route which has ZAI SDK fallback
          const imgEndpoint = '/api/nvidia-image'

          if (nvidiaApiKey) {
            imgRequestBody.apiKey = nvidiaApiKey
            // Only send model if it's an image model (not a text model)
            if (nvidiaImageModel && nvidiaImageModel !== 'nvidia/nemotron-3-ultra-550b-a55b') {
              imgRequestBody.model = nvidiaImageModel
            }
          }

          // Pass the drawing photo as reference for image-to-image generation
          if (drawingPhoto) {
            imgRequestBody.referenceImage = drawingPhoto
          }

          const imgResponse = await fetch(imgEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(imgRequestBody),
          })

          if (imgResponse.ok) {
            const imgData = await imgResponse.json()
            if (imgData.base64) {
              pagesData[pageIdx].imageUrl = `data:image/png;base64,${imgData.base64}`
            }
          } else {
            const errText = await imgResponse.text()
            console.error(`Image gen failed for page ${pageIdx + 1}:`, imgResponse.status, errText.substring(0, 200))
          }
        } catch (imgErr) {
          console.error(`Image gen error for page ${pageIdx + 1}:`, imgErr)
        }
      }

      // Step 4: Finishing touches
      setGenerationStep('Adding finishing touches...')
      setGenerationProgress(95)
      await new Promise((r) => setTimeout(r, 300))

      const gradientIndex = Math.floor(Math.random() * BOOK_COVER_GRADIENTS.length)
      const emojiIndex = Math.floor(Math.random() * BOOK_COVER_EMOJIS.length)

      const book: Book = {
        id: crypto.randomUUID(),
        childId: currentChildId!,
        title: data.title || 'My Story',
        pages: pagesData,
        storyStyle,
        genre,
        moral,
        status: 'approved',
        favorite: false,
        readCount: 0,
        createdAt: new Date().toISOString(),
        coverGradient: BOOK_COVER_GRADIENTS[gradientIndex],
        coverEmoji: BOOK_COVER_EMOJIS[emojiIndex],
        imageCount,
      }

      setGenerationProgress(100)
      addBook(book)
      setCurrentBookId(book.id)
      setPage('book-reader')
    } catch (error) {
      console.error('Generation error:', error)
      // Create a fallback book
      const gradientIndex = Math.floor(Math.random() * BOOK_COVER_GRADIENTS.length)
      const emojiIndex = Math.floor(Math.random() * BOOK_COVER_EMOJIS.length)
      const imagePositions = getImagePositions(pageCount, imageCount)

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
          hasImage: imagePositions.has(i),
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
        imageCount,
      }

      addBook(fallbackBook)
      setCurrentBookId(fallbackBook.id)
      setPage('book-reader')
    } finally {
      setIsGenerating(false)
      setGenerationStep('')
      setGenerationProgress(0)
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
          {/* Progress bar */}
          <div className="w-64 mx-auto mb-4">
            <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${generationProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{generationProgress}% complete</p>
          </div>
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-gray-400 text-sm mt-4">This may take a moment...</p>
        </motion.div>
      </div>
    )
  }

  const maxImageCount = Math.min(10, pageCount)
  const pagesPerImage = imageCount > 0 ? Math.round(pageCount / imageCount) : 0

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
              {/* Step 0: Story prompt + Drawing photo upload */}
              {step === 0 && (
                <div className="space-y-5">
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

                  {/* Drawing Photo Upload Section */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="w-5 h-5 text-purple-500" />
                      <h3 className="font-semibold text-gray-800">Add a Drawing</h3>
                      <span className="text-xs text-gray-400">(optional)</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Upload a photo of your child&apos;s drawing and we&apos;ll use it as inspiration for all the illustrations in the story! The images will be generated in the style your child chooses.
                    </p>

                    {drawingPhoto ? (
                      <div className="relative">
                        <img
                          src={`data:image/png;base64,${drawingPhoto}`}
                          alt="Child's drawing"
                          className="w-full max-h-48 object-contain rounded-xl bg-gray-50 border border-purple-100"
                        />
                        <button
                          onClick={removePhoto}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium">
                            ✓ Drawing uploaded
                          </span>
                          <span className="text-xs text-purple-500">
                            Illustrations will be based on this drawing
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex-1 py-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-dashed border-purple-200 text-purple-600 hover:border-purple-400 hover:bg-purple-100/50 transition-all flex flex-col items-center gap-2"
                        >
                          <Camera className="w-6 h-6" />
                          <span className="text-sm font-medium">Take Photo</span>
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-4 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-dashed border-pink-200 text-pink-600 hover:border-pink-400 hover:bg-pink-100/50 transition-all flex flex-col items-center gap-2"
                        >
                          <Upload className="w-6 h-6" />
                          <span className="text-sm font-medium">Upload</span>
                        </button>
                      </div>
                    )}

                    {/* Hidden file inputs */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

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

              {/* Step 5: Pages & Illustrations */}
              {step === 5 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Pages & Illustrations</h2>
                    <p className="text-gray-500 text-sm">Choose the length and how many illustrations to include</p>
                  </div>

                  {/* Quick Presets */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Quick presets:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {PAGE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => {
                            setPageCount(preset.pages)
                            setImageCount(preset.images)
                          }}
                          className={`py-3 px-2 rounded-xl text-center transition-all shadow-sm ${
                            pageCount === preset.pages && imageCount === preset.images
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                              : 'bg-white border border-purple-100 hover:border-indigo-200'
                          }`}
                        >
                          <span className="text-lg block">{preset.emoji}</span>
                          <p className={`text-sm font-bold mt-1 ${pageCount === preset.pages && imageCount === preset.images ? 'text-white' : 'text-gray-800'}`}>
                            {preset.label}
                          </p>
                          <p className={`text-[10px] ${pageCount === preset.pages && imageCount === preset.images ? 'text-white/80' : 'text-gray-400'}`}>
                            {preset.pages}p / {preset.images}i
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Count Slider */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold text-gray-800">Pages</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-800">{pageCount}</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={20}
                      step={1}
                      value={pageCount}
                      onChange={(e) => setPageCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      style={{ touchAction: 'none' }}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>4</span>
                      <span>20</span>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      {pageCount <= 6 ? '📖 Short & sweet story' : pageCount <= 10 ? '📖 Perfect bedtime story' : pageCount <= 14 ? '📖 Extended adventure' : '📖 Epic saga'}
                    </p>
                  </div>

                  {/* Image Count Slider */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold text-gray-800">Illustrations</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-800">{imageCount}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={maxImageCount}
                      step={1}
                      value={imageCount}
                      onChange={(e) => setImageCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      style={{ touchAction: 'none' }}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1</span>
                      <span>{maxImageCount}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
                        1 image every ~2 pages
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 text-xs font-medium">
                        Default: {defaultImageCount} images
                      </span>
                    </div>
                    <button
                      onClick={() => setImageCount(defaultImageCount)}
                      className="mt-2 w-full text-xs text-indigo-500 hover:text-indigo-600 transition-colors py-1"
                    >
                      Reset to default ({defaultImageCount} images)
                    </button>
                  </div>

                  {/* Drawing reminder */}
                  {drawingPhoto && (
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                      <p className="text-sm text-green-700">
                        🎨 Your child&apos;s drawing will be used as the reference for all {imageCount} illustrations. Each image will be generated in the <strong>{nvidiaImageStyle}</strong> style.
                      </p>
                    </div>
                  )}

                  {/* Visual Summary */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Preview layout (images every 2 pages):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: pageCount }, (_, i) => {
                        const imagePositions = getImagePositions(pageCount, imageCount)
                        const hasImg = imagePositions.has(i)
                        return (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-medium ${
                              hasImg
                                ? 'bg-gradient-to-br from-pink-200 to-purple-200 text-purple-700 border border-purple-300'
                                : 'bg-gray-50 text-gray-400 border border-gray-100'
                            }`}
                          >
                            {hasImg ? '🖼️' : i + 1}
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                      🖼️ = page with illustration (covers this page + next) &nbsp;|&nbsp; Number = text-only page
                      {pageCount % 2 !== 0 && (
                        <span className="block mt-1 text-purple-500">
                          Last image covers only 1 page (odd page count)
                        </span>
                      )}
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
                    {drawingPhoto && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase">Reference Drawing</p>
                        <img
                          src={`data:image/png;base64,${drawingPhoto}`}
                          alt="Child's drawing"
                          className="mt-1 w-24 h-24 object-contain rounded-lg bg-gray-50 border border-purple-100"
                        />
                      </div>
                    )}
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase">Pages</p>
                        <p className="text-gray-800 mt-1">{pageCount} pages</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase">Illustrations</p>
                        <p className="text-gray-800 mt-1">{imageCount} images ({nvidiaImageStyle} style)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-700">
                      ✨ Your story will be personalized for <strong>{currentChild?.name || 'your child'}</strong> with age-appropriate
                      content and {imageCount} beautiful {nvidiaImageStyle} illustrations across {pageCount} pages.
                      {drawingPhoto && (
                        <span className="block mt-1">
                          🎨 All illustrations will be inspired by the uploaded drawing!
                        </span>
                      )}
                    </p>
                  </div>

                  {nvidiaApiKey && (
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                      <p className="text-sm text-amber-700">
                        🚀 Using NVIDIA API ({nvidiaStoryModel}) for story generation
                      </p>
                    </div>
                  )}
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
