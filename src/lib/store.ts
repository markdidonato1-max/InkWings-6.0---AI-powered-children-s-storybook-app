'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Data Models ───────────────────────────────────────────────

export interface ParentAccount {
  id: string
  name: string
  email: string
  authMethod: 'apple' | 'google' | 'passcode'
  passcode: string
  children: ChildProfile[]
  subscription: { status: 'active' | 'expired' | 'trial'; expiryDate: string }
  createdAt: string
}

export interface ChildProfile {
  id: string
  name: string
  ageRange: '3-5' | '6-8' | '9-12'
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
    ageRange: '3-5' | '6-8' | '9-12'
    moral: string
    pageCount: number
    imageCount: number
  } | null

  // Admin
  adminApiKey: string
  adminCallLogs: { timestamp: string; prompt: string; response: string; tokens: number }[]

  // NVIDIA API
  nvidiaApiKey: string
  nvidiaStoryModel: string
  nvidiaImageStyle: string

  // Actions
  setPage: (page: PageName) => void
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

  // Admin
  setAdminApiKey: (key: string) => void
  addAdminCallLog: (log: { timestamp: string; prompt: string; response: string; tokens: number }) => void

  // NVIDIA
  setNvidiaApiKey: (key: string) => void
  setNvidiaStoryModel: (model: string) => void
  setNvidiaImageStyle: (style: string) => void

  // Helpers
  getCurrentChild: () => ChildProfile | null
  getCurrentBook: () => Book | null
  getBooksForChild: (childId: string) => Book[]
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

      adminApiKey: '',
      adminCallLogs: [],

      nvidiaApiKey: '',
      nvidiaStoryModel: 'meta/llama-3.3-70b-instruct',
      nvidiaImageStyle: 'watercolor',

      // Navigation
      setPage: (page) =>
        set((state) => ({
          previousPage: state.currentPage,
          currentPage: page,
        })),

      setLegalPageType: (type) => set({ legalPageType: type }),

      setAuthenticated: (value) => set({ isAuthenticated: value }),

      setParentAccount: (account) =>
        set({ parentAccount: account, isAuthenticated: true }),

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
        set((state) => ({
          books: state.books.map((b) =>
            b.id === id
              ? { ...b, readCount: b.readCount + 1, lastReadAt: new Date().toISOString() }
              : b
          ),
        })),

      // Admin
      setAdminApiKey: (key) => set({ adminApiKey: key }),
      addAdminCallLog: (log) =>
        set((state) => ({ adminCallLogs: [...state.adminCallLogs, log] })),

      // NVIDIA
      setNvidiaApiKey: (key) => set({ nvidiaApiKey: key }),
      setNvidiaStoryModel: (model) => set({ nvidiaStoryModel: model }),
      setNvidiaImageStyle: (style) => set({ nvidiaImageStyle: style }),

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
        adminApiKey: state.adminApiKey,
        adminCallLogs: state.adminCallLogs,
        nvidiaApiKey: state.nvidiaApiKey,
        nvidiaStoryModel: state.nvidiaStoryModel,
        nvidiaImageStyle: state.nvidiaImageStyle,
      }),
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

export const AGE_RANGES: ('3-5' | '6-8' | '9-12')[] = ['3-5', '6-8', '9-12']

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
