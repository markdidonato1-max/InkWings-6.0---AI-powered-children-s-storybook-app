'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Heart, Home, Loader2 } from 'lucide-react'
import { useAppStore, type BookPage } from '@/lib/store'

// Fix MIME type for base64 images — ZAI SDK returns JPEG but old code used PNG prefix
function fixImageUrl(url: string | undefined): string | undefined {
  if (!url) return url
  // If URL has wrong PNG prefix but data is actually JPEG, fix it
  if (url.startsWith('data:image/png;base64,/9j/')) {
    return url.replace('data:image/png;base64,', 'data:image/jpeg;base64,')
  }
  return url
}

// Get the text of the pages surrounding an image for the prompt
// Image i covers pages (2i) and (2i+1). If odd pages, last image covers 1 page.
function getImagePromptText(pages: { text: string }[], currentPageIndex: number, totalImageCount: number): string {
  // Find which image index this page corresponds to
  // Images are placed every 2 pages: image i is at page (2i)
  const imageIndex = Math.floor(currentPageIndex / 2)

  // The image covers pages (2*imageIndex) and (2*imageIndex+1)
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

export default function BookReaderPage() {
  const { currentBookId, books, setPage, toggleFavorite, incrementReadCount, updateBook, nvidiaApiKey, nvidiaImageStyle, nvidiaImageModel } = useAppStore()
  const book = books.find((b) => b.id === currentBookId)

  const [currentPage, setCurrentPage] = useState(0)
  const [loadingImage, setLoadingImage] = useState(false)
  const hasCountedRead = useRef(false)

  const goNext = useCallback(() => {
    if (book && currentPage < book.pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }, [book, currentPage])

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage])

  // Track reading when reaching the last page — only once per session
  useEffect(() => {
    if (book && currentPage === book.pages.length - 1 && !hasCountedRead.current) {
      hasCountedRead.current = true
      incrementReadCount(book.id)
    }
  }, [currentPage, book, incrementReadCount])

  // Generate image for current page if it hasImage and no imageUrl yet
  useEffect(() => {
    if (!book) return
    const page = book.pages[currentPage]
    if (!page || !page.hasImage || page.imageUrl) return

    let cancelled = false
    setLoadingImage(true)

    const generateImage = async () => {
      try {
        // Build the best possible image prompt:
        // 1) Use the dedicated imageDescription from the story API (designed specifically for illustration)
        // 2) Fall back to combining the text of the pages this image covers
        // 3) Last resort: the page text or a generic prompt
        const surroundingText = getImagePromptText(book.pages, currentPage, book.imageCount)
        const imagePrompt = page.imageDescription || surroundingText || page.text || `Illustration for page ${currentPage + 1}`

        const requestBody: Record<string, unknown> = {
          prompt: imagePrompt,
          style: nvidiaImageStyle,
        }

        // Always use nvidia-image route which has ZAI SDK as primary
        const imgEndpoint = '/api/nvidia-image'

        // Only send NVIDIA credentials if both API key AND a valid image model are provided
        // Most NVIDIA API keys only have text/chat models — image models require separate subscription
        if (nvidiaApiKey && nvidiaImageModel) {
          requestBody.apiKey = nvidiaApiKey
          requestBody.model = nvidiaImageModel
        }

        const response = await fetch(imgEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })
        if (!response.ok) {
          const errText = await response.text()
          console.error(`[BookReader] Image gen failed for page ${currentPage + 1}:`, response.status, errText.substring(0, 200))
          throw new Error('Failed')
        }
        const data = await response.json()
        if (data.base64 && !cancelled) {
          // Detect image format from base64 header — ZAI SDK returns JPEG, NVIDIA may return PNG
          const isJpeg = data.base64.startsWith('/9j/')
          const imageUrl = `data:image/${isJpeg ? 'jpeg' : 'png'};base64,${data.base64}`
          updateBook(book.id, {
            pages: book.pages.map((p: BookPage) =>
              p.id === page.id ? { ...p, imageUrl } : p
            ),
          })
        }
      } catch (err) {
        console.error(`[BookReader] Image gen error for page ${currentPage + 1}:`, err)
      } finally {
        if (!cancelled) setLoadingImage(false)
      }
    }

    const timer = setTimeout(generateImage, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
      setLoadingImage(false)
    }
  }, [currentPage, book, updateBook, nvidiaApiKey, nvidiaImageStyle, nvidiaImageModel])

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <p className="text-gray-500">No book selected</p>
        <button onClick={() => setPage('child-home')} className="ml-2 text-indigo-500 underline">
          Go Home
        </button>
      </div>
    )
  }

  const page = book.pages[currentPage]
  const isLastPage = currentPage === book.pages.length - 1
  const pageHasImage = page?.hasImage

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setPage('child-home')}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center flex-1 mx-4">
          <p className="text-sm font-medium text-gray-800 truncate">{book.title}</p>
          <p className="text-xs text-gray-400">
            Page {currentPage + 1} of {book.pages.length}
          </p>
        </div>
        <button
          onClick={() => toggleFavorite(book.id)}
          className="transition-colors"
        >
          <Heart
            className={`w-6 h-6 ${
              book.favorite ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-400'
            }`}
          />
        </button>
      </div>

      {/* Page content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full flex-1 flex flex-col"
          >
            {pageHasImage ? (
              /* Page WITH image: show image on top, text below */
              <>
                {/* Illustration area */}
                <div className="flex-1 min-h-0 mb-4 flex items-center justify-center">
                  {page?.imageUrl ? (
                    <motion.div
                      className="w-full aspect-square max-h-[45vh] rounded-2xl overflow-hidden shadow-lg"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <img
                        src={fixImageUrl(page.imageUrl)}
                        alt={`Illustration for page ${currentPage + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ) : (
                    <div className="w-full aspect-square max-h-[45vh] rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shadow-sm border border-purple-100">
                      {loadingImage ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                          <p className="text-sm text-purple-400">Painting illustration...</p>
                        </div>
                      ) : (
                        <div className="text-center p-6">
                          <span className="text-6xl block mb-3">
                            {book.coverEmoji || '📖'}
                          </span>
                          <p className="text-sm text-purple-300">Illustration for page {currentPage + 1}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Text area */}
                <motion.div
                  className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-gray-800 text-lg leading-relaxed font-serif">
                    {page?.text}
                  </p>
                </motion.div>
              </>
            ) : (
              /* Page WITHOUT image: full text layout, larger and more readable */
              <motion.div
                className="flex-1 flex items-center justify-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-purple-100 w-full">
                  <p className="text-gray-800 text-xl leading-loose font-serif">
                    {page?.text}
                  </p>
                  <div className="mt-4 flex justify-center">
                    <span className="text-purple-200 text-2xl">
                      {book.coverEmoji || '✨'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-purple-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentPage === 0}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentPage === 0
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200 active:scale-95'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60vw] px-2">
            {book.pages.map((p, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`rounded-full transition-all shrink-0 ${
                  i === currentPage
                    ? 'bg-purple-500 w-6 h-2'
                    : p.hasImage
                      ? 'bg-pink-300 w-2 h-2'
                      : 'bg-purple-200 w-2 h-2 hover:bg-purple-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={isLastPage ? () => setPage('child-home') : goNext}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isLastPage
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/30'
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200 active:scale-95'
            }`}
          >
            {isLastPage ? <Home className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
