'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Heart, BookOpen, Home, Plus, Settings, BookMarked } from 'lucide-react'
import { useAppStore, BOOK_COVER_GRADIENTS, BOOK_COVER_EMOJIS } from '@/lib/store'

type FilterTab = 'all' | 'favorites' | 'recent'

export default function MyBooksPage() {
  const { currentChildId, books, setPage, setCurrentBookId, toggleFavorite } = useAppStore()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const childBooks = books.filter((b) => b.childId === currentChildId)
  const favoriteBooks = childBooks.filter((b) => b.favorite)
  const recentBooks = childBooks
    .filter((b) => b.lastReadAt)
    .sort((a, b) => new Date(b.lastReadAt!).getTime() - new Date(a.lastReadAt!).getTime())

  const filteredBooks =
    activeTab === 'all'
      ? childBooks
      : activeTab === 'favorites'
        ? favoriteBooks
        : recentBooks

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => setPage('child-home')} className="text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 flex-1">My Books</h1>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          {[
            { key: 'all' as FilterTab, label: 'All', count: childBooks.length },
            { key: 'favorites' as FilterTab, label: 'Favorites', count: favoriteBooks.length },
            { key: 'recent' as FilterTab, label: 'Recently Read', count: recentBooks.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-gray-500 border border-purple-100 hover:bg-purple-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Books grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        <div className="max-w-lg mx-auto">
          {filteredBooks.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-6xl block mb-4">📚</span>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No books yet</h3>
              <p className="text-gray-400 mb-6">
                {activeTab === 'favorites'
                  ? 'Favorite some books to see them here'
                  : activeTab === 'recent'
                    ? 'Start reading to see your history'
                    : 'Create your first story to get started'}
              </p>
              {activeTab === 'all' && (
                <button
                  onClick={() => {
                    useAppStore.getState().setCreateBookStep(0)
                    useAppStore.getState().setCreateBookData(null)
                    setPage('create-book')
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all"
                >
                  Create Your First Story
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredBooks.map((book, i) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative group"
                  >
                    <button
                      onClick={() => {
                        setCurrentBookId(book.id)
                        setPage('book-reader')
                      }}
                      className="w-full text-left"
                    >
                      <div
                        className={`aspect-[3/4] rounded-2xl bg-gradient-to-br ${book.coverGradient || BOOK_COVER_GRADIENTS[i % BOOK_COVER_GRADIENTS.length]} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow relative overflow-hidden`}
                      >
                        <span className="text-4xl group-hover:scale-110 transition-transform">
                          {book.coverEmoji || BOOK_COVER_EMOJIS[i % BOOK_COVER_EMOJIS.length]}
                        </span>

                        {/* Read count badge */}
                        {book.readCount > 0 && (
                          <div className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm rounded-lg px-2 py-0.5">
                            <span className="text-xs text-white font-medium">📖 {book.readCount}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700 mt-2 line-clamp-2">{book.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {book.pages.length} pages · {book.storyStyle}
                      </p>
                    </button>

                    {/* Favorite button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(book.id)
                      }}
                      className="absolute top-2 right-2 z-10"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          book.favorite
                            ? 'text-red-500 fill-red-500'
                            : 'text-white/60 hover:text-red-400'
                        } drop-shadow-md`}
                      />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-purple-100 px-4 py-2 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {[
            { icon: Home, label: 'Home', page: 'child-home' as const },
            { icon: BookMarked, label: 'My Books', page: 'my-books' as const, active: true },
            { icon: Plus, label: 'Create', page: 'create-book' as const },
            { icon: Settings, label: 'Settings', page: 'settings' as const },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.page === 'create-book') {
                  useAppStore.getState().setCreateBookStep(0)
                  useAppStore.getState().setCreateBookData(null)
                }
                setPage(item.page)
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
                'active' in item && item.active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
