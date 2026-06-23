'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { hashPasscode, verifyPasscode, generateUUID } from './utils'
import { getImagePositions } from './image-utils'

export { getImagePositions } // Re-export for convenience

// ─── Data Models ───────────────────────────────────────────────

export interface ParentAccount {
  id: string
  name: string
  email: string
  authMethod: 'apple' | 'google' | 'passcode'
  passcode: string // NOTE: this is a HASH, not the raw passcode
  children: ChildProfile[]
  subscription: { status: 'active' | 'expired' | 'trial'; expiryDate: string }
  requireApproval: boolean
  blockMatureContent: boolean
  createdAt: string
}

export interface ChildProfile {
  id: string
  name: string
  ageRange: '3-5' | '6-8' | '9-12' | '9-12-advanced'
  avatar: string
  preferences: {
    favoriteGenres: string[]
    favoriteStyles: string[]
    preferredMoral: string
  }
  readingStats: {
    totalBooksRead: number
    totalPagesRead: number
    totalReadingTimeMinutes: number
    averageSessionMinutes: number
  }
  vocabularyProgress: {
    totalWordsLearned: number
    masteredWords: string[]
    learningWords: string[]
    newWords: string[]
    wordHistory: { word: string; date: string; context: string }[]
  }
  readingTimeLimit: number // minutes per day, 0 = no limit
  rememberMe: boolean
  createdAt: string
}

export interface BookPage {
  id: string
  pageNumber: number
  text: string
  imageUrl?: string
  imageDescription?: string
  imagePosition: 'top' | 'bottom' | 'full'
  hasImage: boolean
}

export interface Book {
  id: string
  childId: string
  title: string
  pages: BookPage[]
  storyStyle: string
  genre: string
  moral: string
  status: 'draft' | 'approved' | 'rejected'
  favorite: boolean
  readCount: number
  lastReadAt?: string
  lastReadPage?: number // Track where user left off
  createdAt: string
  coverGradient?: string
  coverEmoji?: string
  imageCount: number
}

export type PageName =
  | 'welcome'
  | 'onboarding'
  | 'parent-auth'
  | 'select-child'
  | 'select-mode'
  | 'child-home'
  | 'create-book'
  | 'book-reader'
  | 'my-books'
  | 'parent-dashboard'
  | 'settings'
  | 'legal'
  | 'admin'

// ─── Store State & Actions ─────────────────────────────────────

interface AppState {
  // Navigation
  currentPage: PageName
  previousPage: PageName | null
  legalPageType: 'terms' | 'privacy' | 'coppa'

  // Auth & User
  isAuthenticated: boolean
  parentAccount: ParentAccount | null
  currentChildId: string | null
  mode: 'parent' | 'child' | null

  // Books
  books: Book[]
  currentBookId: string | null

  // Onboarding
  onboardingStep: number

  // Book creation
  createBookStep: number
  createBookData: {
    prompt: string
    storyStyle: string
    genre: string
    ageRange: '3-5' | '6-8' | '9-12' | '9-12-advanced'
    moral: string
    pageCount: number
    imageCount: number
    drawingPhoto: string | null
  } | null

  // Image style preference (user-facing, not an API key)
  imageStyle: string

  // Admin call logs (for stats display)
  adminCallLogs: { timestamp: string; prompt: string; response: string; tokens: number }[]

  // Actions
  setPage: (page: PageName) => void
  goBack: () => void
  setLegalPageType: (type: 'terms' | 'privacy' | 'coppa') => void
  setAuthenticated: (value: boolean) => void
  setParentAccount: (account: ParentAccount) => void
  updateParentAccount: (updates: Partial<ParentAccount>) => void
  clearParentAccount: () => void
  setCurrentChildId: (id: string | null) => void
  setMode: (mode: 'parent' | 'child' | null) => void
  setOnboardingStep: (step: number) => void
  setCreateBookStep: (step: number) => void
  setCreateBookData: (data: AppState['createBookData']) => void
  setCurrentBookId: (id: string | null) => void

  // Child management
  addChild: (child: ChildProfile) => void
  updateChild: (id: string, updates: Partial<ChildProfile>) => void
  removeChild: (id: string) => void

  // Book management
  addBook: (book: Book) => void
  updateBook: (id: string, updates: Partial<Book>) => void
  removeBook: (id: string) => void
  toggleFavorite: (id: string) => void
  incrementReadCount: (id: string) => void

  // Image style
  setImageStyle: (style: string) => void

  // Admin
  addAdminCallLog: (log: { timestamp: string; prompt: string; response: string; tokens: number }) => void

  // Helpers
  getCurrentChild: () => ChildProfile | null
  getCurrentBook: () => Book | null
  getBooksForChild: (childId: string) => Book[]
  verifyPasscode: (input: string) => boolean
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPage: 'welcome',
      previousPage: null,
      legalPageType: 'terms',

      isAuthenticated: false,
      parentAccount: null,
      currentChildId: null,
      mode: null,

      books: [],
      currentBookId: null,

      onboardingStep: 0,
      createBookStep: 0,
      createBookData: null,

      imageStyle: 'watercolor',
      adminCallLogs: [],

      // Navigation
      setPage: (page) =>
        set((state) => ({
          previousPage: state.currentPage,
          currentPage: page,
        })),

      goBack: () =>
        set((state) => {
          const prev = state.previousPage
          if (prev) {
            return {
              previousPage: state.currentPage,
              currentPage: prev,
            }
          }
          return state
        }),

      setLegalPageType: (type) => set({ legalPageType: type }),

      setAuthenticated: (value) => set({ isAuthenticated: value }),

      setParentAccount: (account) => {
        // Hash the passcode if it's a raw 4-digit string (not already hashed)
        const rawPasscode = account.passcode
        const isAlreadyHashed = rawPasscode.length > 4 || !/^\d{4}$/.test(rawPasscode)
        const hashedPasscode = isAlreadyHashed ? rawPasscode : hashPasscode(rawPasscode)
        return set({
          parentAccount: { ...account, passcode: hashedPasscode },
          isAuthenticated: true,
        })
      },

      updateParentAccount: (updates) =>
        set((state) => ({
          parentAccount: state.parentAccount
            ? { ...state.parentAccount, ...updates }
            : null,
        })),

      clearParentAccount: () =>
        set({
          parentAccount: null,
          isAuthenticated: false,
          currentChildId: null,
          currentBookId: null,
          createBookStep: 0,
          createBookData: null,
          mode: null,
          currentPage: 'welcome',
          books: [],
        }),

      setCurrentChildId: (id) => set({ currentChildId: id }),
      setMode: (mode) => set({ mode }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      setCreateBookStep: (step) => set({ createBookStep: step }),
      setCreateBookData: (data) => set({ createBookData: data }),
      setCurrentBookId: (id) => set({ currentBookId: id }),

      // Child management
      addChild: (child) =>
        set((state) => ({
          parentAccount: state.parentAccount
            ? { ...state.parentAccount, children: [...state.parentAccount.children, child] }
            : null,
        })),

      updateChild: (id, updates) =>
        set((state) => ({
          parentAccount: state.parentAccount
            ? {
                ...state.parentAccount,
                children: state.parentAccount.children.map((c) =>
                  c.id === id ? { ...c, ...updates } : c
                ),
              }
            : null,
        })),

      removeChild: (id) =>
        set((state) => ({
          parentAccount: state.parentAccount
            ? {
                ...state.parentAccount,
                children: state.parentAccount.children.filter((c) => c.id !== id),
              }
            : null,
          currentChildId: state.currentChildId === id ? null : state.currentChildId,
          books: state.books.filter((b) => b.childId !== id),
          currentBookId: state.books.some((b) => b.id === state.currentBookId && b.childId === id)
            ? null
            : state.currentBookId,
        })),

      // Book management
      addBook: (book) => set((state) => ({ books: [...state.books, book] })),

      updateBook: (id, updates) =>
        set((state) => ({
          books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      removeBook: (id) =>
        set((state) => ({
          books: state.books.filter((b) => b.id !== id),
          currentBookId: state.currentBookId === id ? null : state.currentBookId,
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          books: state.books.map((b) =>
            b.id === id ? { ...b, favorite: !b.favorite } : b
          ),
        })),

      incrementReadCount: (id) =>
        set((state) => {
          const book = state.books.find((b) => b.id === id)
          if (!book) return state

          const updatedBooks = state.books.map((b) =>
            b.id === id
              ? { ...b, readCount: b.readCount + 1, lastReadAt: new Date().toISOString() }
              : b
          )

          // Also update the child's reading stats
          let updatedParent = state.parentAccount
          if (updatedParent && state.currentChildId) {
            updatedParent = {
              ...updatedParent,
              children: updatedParent.children.map((c) =>
                c.id === state.currentChildId
                  ? {
                      ...c,
                      readingStats: {
                        ...c.readingStats,
                        totalBooksRead: c.readingStats.totalBooksRead + 1,
                        totalPagesRead: c.readingStats.totalPagesRead + book.pages.length,
                        totalReadingTimeMinutes: c.readingStats.totalReadingTimeMinutes + 5, // rough estimate
                        averageSessionMinutes:
                          c.readingStats.totalBooksRead > 0
                            ? Math.round(
                                (c.readingStats.totalReadingTimeMinutes + 5) /
                                  (c.readingStats.totalBooksRead + 1)
                              )
                            : 5,
                      },
                    }
                  : c
              ),
            }
          }

          return {
            books: updatedBooks,
            parentAccount: updatedParent,
          }
        }),

      // Image style
      setImageStyle: (style) => set({ imageStyle: style }),

      // Admin
      addAdminCallLog: (log) =>
        set((state) => {
          const logs = [...state.adminCallLogs, log]
          // Cap at 100 entries to prevent unbounded localStorage growth
          if (logs.length > 100) {
            logs.splice(0, logs.length - 100)
          }
          return { adminCallLogs: logs }
        }),

      // Helpers
      getCurrentChild: () => {
        const state = get()
        if (!state.parentAccount || !state.currentChildId) return null
        return state.parentAccount.children.find((c) => c.id === state.currentChildId) || null
      },

      getCurrentBook: () => {
        const state = get()
        if (!state.currentBookId) return null
        return state.books.find((b) => b.id === state.currentBookId) || null
      },

      getBooksForChild: (childId) => {
        const state = get()
        return state.books.filter((b) => b.childId === childId)
      },

      verifyPasscode: (input) => {
        const state = get()
        if (!state.parentAccount) return false
        return verifyPasscode(input, state.parentAccount.passcode)
      },
    }),
    {
      name: 'inkwings-storage',
      partialize: (state) => ({
        parentAccount: state.parentAccount,
        isAuthenticated: state.isAuthenticated,
        currentChildId: state.currentChildId,
        mode: state.mode,
        books: state.books,
        currentPage: state.currentPage,
        imageStyle: state.imageStyle,
        adminCallLogs: state.adminCallLogs,
      }),
      // Migration: clear stale/invalid config values when loading from localStorage
      merge: (persistedState: unknown, currentState: unknown) => {
        const p = persistedState as Record<string, unknown>
        const c = currentState as Record<string, unknown>
        const merged = { ...c, ...p }

        // Migrate old nvidiaImageStyle to new imageStyle
        if (merged.nvidiaImageStyle && !merged.imageStyle) {
          merged.imageStyle = merged.nvidiaImageStyle
        }

        // Migrate raw 4-digit passcodes to hashed
        if (merged.parentAccount && typeof merged.parentAccount === 'object') {
          const pa = merged.parentAccount as Record<string, unknown>
          if (typeof pa.passcode === 'string' && pa.passcode.length === 4 && /^\d{4}$/.test(pa.passcode)) {
            pa.passcode = hashPasscode(pa.passcode)
          }
          // Add requireApproval and blockMatureContent if missing
          if (pa.requireApproval === undefined) {
            pa.requireApproval = false
          }
          if (pa.blockMatureContent === undefined) {
            pa.blockMatureContent = true
          }
          // Add readingTimeLimit to children if missing
          if (Array.isArray(pa.children)) {
            pa.children = pa.children.map((child: Record<string, unknown>) => ({
              ...child,
              readingTimeLimit: (child.readingTimeLimit as number) ?? 0,
            }))
          }
        }

        // Fix any existing book images with wrong MIME type (JPEG data labeled as PNG)
        if (Array.isArray(merged.books)) {
          merged.books = (merged.books as Book[]).map((book: Book) => ({
            ...book,
            pages: book.pages?.map((page: BookPage) => ({
              ...page,
              imageUrl: page.imageUrl?.replace(
                'data:image/png;base64,/9j/',
                'data:image/jpeg;base64,/9j/'
              ),
            })),
          }))
        }

        // Cap adminCallLogs if they somehow grew past the limit
        if (Array.isArray(merged.adminCallLogs) && merged.adminCallLogs.length > 100) {
          merged.adminCallLogs = merged.adminCallLogs.slice(-100)
        }

        // Remove any old API key fields that might have been persisted
        delete merged.nvidiaApiKey
        delete merged.nvidiaStoryModel
        delete merged.nvidiaImageModel
        delete merged.customApiBaseUrl
        delete merged.customApiKey
        delete merged.customStoryModel
        delete merged.customImageModel
        delete merged.customApiProvider
        delete merged.adminApiKey
        delete merged.nvidiaImageStyle

        return merged
      },
    }
  )
)

// ─── Constants ─────────────────────────────────────────────────

export const AVATARS = ['🦊', '🐻', '🦄', '🐱', '🐶', '🐰', '🦁', '🐼', '🐸', '🦋']

export const STORY_STYLES: { label: string; description: string; icon: string }[] = [
  { label: 'Silly & Funny', description: 'Goofy tales full of laughs', icon: '😂' },
  { label: 'Adventure Time', description: 'Exciting journeys and quests', icon: '⚔️' },
  { label: 'Fairy Tale', description: 'Magical kingdoms and enchantments', icon: '🏰' },
  { label: 'Bedtime', description: 'Calm, soothing sleepy stories', icon: '🌙' },
  { label: 'Educational', description: 'Fun facts wrapped in stories', icon: '📚' },
  { label: 'Mystery', description: 'Puzzles and detective adventures', icon: '🔍' },
  { label: 'Sci-Fi', description: 'Futuristic space adventures', icon: '🚀' },
  { label: 'Musical', description: 'Rhythmic stories with rhyme', icon: '🎵' },
]

export const GENRES: { label: string; icon: string }[] = [
  { label: 'adventure', icon: '🗺️' },
  { label: 'underwater', icon: '🐠' },
  { label: 'circus', icon: '🎪' },
  { label: 'fairy-tale', icon: '🧚' },
  { label: 'space', icon: '🪐' },
  { label: 'dinosaur', icon: '🦕' },
  { label: 'pirate', icon: '🏴‍☠️' },
  { label: 'superhero', icon: '🦸' },
  { label: 'farm', icon: '🌾' },
  { label: 'jungle', icon: '🌴' },
]

export const MORALS: { label: string; value: string }[] = [
  { label: 'No specific moral', value: 'none' },
  { label: 'Friendship', value: 'friendship' },
  { label: 'Kindness', value: 'kindness' },
  { label: 'Courage', value: 'courage' },
  { label: 'Honesty', value: 'honesty' },
  { label: 'Sharing', value: 'sharing' },
  { label: 'Perseverance', value: 'perseverance' },
]

export const AGE_RANGES: ('3-5' | '6-8' | '9-12' | '9-12-advanced')[] = ['3-5', '6-8', '9-12', '9-12-advanced']

export const BOOK_COVER_GRADIENTS = [
  'from-pink-400 to-purple-500',
  'from-blue-400 to-indigo-500',
  'from-green-400 to-teal-500',
  'from-orange-400 to-red-500',
  'from-purple-400 to-pink-500',
  'from-cyan-400 to-blue-500',
  'from-yellow-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-emerald-400 to-green-500',
  'from-violet-400 to-purple-500',
]

export const BOOK_COVER_EMOJIS = ['📖', '🦄', '🐉', '🌟', '🚀', '🧜‍♀️', '🦁', '🎪', '🏴‍☠️', '🦸']
