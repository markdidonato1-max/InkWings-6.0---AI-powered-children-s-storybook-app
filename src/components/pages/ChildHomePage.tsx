'use client'

import { motion } from 'framer-motion'
import { BookOpen, ArrowRight, Repeat, Plus, Home, Settings, Sparkles, BookMarked, GraduationCap } from 'lucide-react'
import { useAppStore, BOOK_COVER_GRADIENTS, BOOK_COVER_EMOJIS } from '@/lib/store'

export default function ChildHomePage() {
  const { parentAccount, currentChildId, books, setPage, setCurrentChildId } = useAppStore()

  const currentChild = parentAccount?.children.find((c) => c.id === currentChildId)
  const childBooks = books.filter((b) => b.childId === currentChildId)
  const recentBooks = childBooks
    .filter((b) => b.lastReadAt)
    .sort((a, b) => new Date(b.lastReadAt!).getTime() - new Date(a.lastReadAt!).getTime())
    .slice(0, 3)
  const favoriteBooks = childBooks.filter((b) => b.favorite)

  const masteredWords = currentChild?.vocabularyProgress.masteredWords || []
  const learningWords = currentChild?.vocabularyProgress.learningWords || []

  if (!currentChild) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-6">
        <p className="text-purple-600">No child profile selected</p>
        <button onClick={() => setPage('select-child')} className="ml-2 text-indigo-600 underline">
          Select a profile
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentChild.avatar}</span>
            <div>
              <h1 className="text-lg font-bold text-gray-800">{currentChild.name}&apos;s Library</h1>
              <p className="text-xs text-purple-500">Ages {currentChild.ageRange}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setPage('parent-auth')
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-600 text-sm font-medium hover:bg-purple-200 transition-colors"
          >
            <Repeat className="w-4 h-4" />
            Switch
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Stats bar */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {[
              { label: 'Books Read', value: currentChild.readingStats.totalBooksRead, icon: BookOpen, color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Pages Read', value: currentChild.readingStats.totalPagesRead, icon: BookMarked, color: 'bg-purple-50 text-purple-600' },
              { label: 'Words Learned', value: currentChild.vocabularyProgress.totalWordsLearned, icon: GraduationCap, color: 'bg-pink-50 text-pink-600' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className={`${stat.color} rounded-2xl p-3 text-center`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <stat.icon className="w-5 h-5 mx-auto mb-1" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs opacity-70">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Create New Story CTA */}
          <motion.button
            onClick={() => {
              useAppStore.getState().setCreateBookStep(0)
              useAppStore.getState().setCreateBookData(null)
              setPage('create-book')
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-6 h-6" />
            Create New Story
          </motion.button>

          {/* Continue Reading */}
          {recentBooks.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-800">Continue Reading</h2>
                <button
                  onClick={() => setPage('my-books')}
                  className="text-sm text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                >
                  See All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {recentBooks.map((book, i) => (
                  <motion.button
                    key={book.id}
                    onClick={() => {
                      useAppStore.getState().setCurrentBookId(book.id)
                      setPage('book-reader')
                    }}
                    className="shrink-0 w-28"
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className={`w-28 h-36 rounded-xl bg-gradient-to-br ${book.coverGradient || BOOK_COVER_GRADIENTS[i % BOOK_COVER_GRADIENTS.length]} flex items-center justify-center shadow-md`}
                    >
                      <span className="text-4xl">{book.coverEmoji || BOOK_COVER_EMOJIS[i % BOOK_COVER_EMOJIS.length]}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-700 mt-1.5 line-clamp-2 text-left">{book.title}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Vocabulary Progress */}
          {(masteredWords.length > 0 || learningWords.length > 0) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Vocabulary Progress</h2>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
                {masteredWords.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-green-600 mb-2">Mastered ✨</p>
                    <div className="flex flex-wrap gap-1.5">
                      {masteredWords.slice(0, 8).map((word) => (
                        <span key={word} className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium">
                          {word}
                        </span>
                      ))}
                      {masteredWords.length > 8 && (
                        <span className="px-2.5 py-1 rounded-lg bg-green-50 text-green-600 text-xs">
                          +{masteredWords.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {learningWords.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-600 mb-2">Learning 📖</p>
                    <div className="flex flex-wrap gap-1.5">
                      {learningWords.slice(0, 6).map((word) => (
                        <span key={word} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
                          {word}
                        </span>
                      ))}
                      {learningWords.length > 6 && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs">
                          +{learningWords.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* My Books */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">My Books</h2>
              <button
                onClick={() => setPage('my-books')}
                className="text-sm text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
              >
                See All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {childBooks.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-purple-100 text-center">
                <span className="text-5xl mb-3 block">📚</span>
                <p className="text-gray-600 font-medium">No books yet!</p>
                <p className="text-gray-400 text-sm mt-1">Create your first story to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {childBooks.slice(0, 6).map((book, i) => (
                  <motion.button
                    key={book.id}
                    onClick={() => {
                      useAppStore.getState().setCurrentBookId(book.id)
                      setPage('book-reader')
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${book.coverGradient || BOOK_COVER_GRADIENTS[i % BOOK_COVER_GRADIENTS.length]} flex items-center justify-center shadow-md`}
                    >
                      <span className="text-3xl">{book.coverEmoji || BOOK_COVER_EMOJIS[i % BOOK_COVER_EMOJIS.length]}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-700 mt-1.5 line-clamp-2 text-left">{book.title}</p>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-purple-100 px-4 py-2 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {[
            { icon: Home, label: 'Home', page: 'child-home' as const, active: true },
            { icon: BookMarked, label: 'My Books', page: 'my-books' as const, active: false },
            { icon: Plus, label: 'Create', page: 'create-book' as const, active: false },
            { icon: Settings, label: 'Settings', page: 'settings' as const, active: false },
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
                item.active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
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
