'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, LogOut, BookOpen, Clock, GraduationCap, Shield, Settings,
  Users, Repeat, Check, X, Timer, Eye, BookMarked, Trash2, Download
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

type TabKey = 'overview' | 'children' | 'settings' | 'controls'

export default function ParentDashboardPage() {
  const {
    parentAccount, books, setPage, setMode, setCurrentChildId, clearParentAccount,
    updateBook, updateChild, updateParentAccount
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [parentNotifications, setParentNotifications] = useState({
    readingReminders: true,
    newStoryAlerts: true,
    weeklySummary: false,
  })
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const children = parentAccount?.children || []
  const allBooks = books
  const totalBooks = allBooks.length
  const totalPages = allBooks.reduce((sum, b) => sum + b.readCount * b.pages.length, 0)
  const totalReadingTime = children.reduce((sum, c) => sum + c.readingStats.totalReadingTimeMinutes, 0)
  const totalWords = children.reduce((sum, c) => sum + c.vocabularyProgress.totalWordsLearned, 0)
  const pendingBooks = allBooks.filter((b) => b.status === 'draft')

  // Controlled inputs for settings tab
  const [editName, setEditName] = useState(parentAccount?.name || '')
  const [editEmail, setEditEmail] = useState(parentAccount?.email || '')

  const handleSwitchToChildMode = () => {
    if (children.length === 1) {
      setCurrentChildId(children[0].id)
      setMode('child')
      setPage('child-home')
    } else if (children.length > 1) {
      setPage('select-child')
    }
  }

  const handleExportData = () => {
    const data = {
      parentAccount,
      books,
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inkwings-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClearData = () => {
    clearParentAccount()
    setShowClearConfirm(false)
  }

  const handleSaveSettings = () => {
    updateParentAccount({ name: editName, email: editEmail })
  }

  const tabs: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
    { key: 'overview', label: 'Overview', icon: Eye },
    { key: 'children', label: 'Children', icon: Users },
    { key: 'controls', label: 'Controls', icon: Shield },
    { key: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Parent Dashboard</h1>
            <p className="text-sm text-purple-200/60">{parentAccount?.name || 'Parent'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSwitchToChildMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-purple-200 text-sm hover:bg-white/15 transition-colors"
            >
              <Repeat className="w-4 h-4" />
              Child Mode
            </button>
            <button
              onClick={() => {
                clearParentAccount()
                setPage('welcome')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-purple-300/60 text-sm hover:bg-white/10 hover:text-purple-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2">
        <div className="max-w-2xl mx-auto flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/30'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Books', value: totalBooks, icon: BookOpen, color: 'from-indigo-500/20 to-indigo-600/20' },
                  { label: 'Pages Read', value: totalPages, icon: BookMarked, color: 'from-purple-500/20 to-purple-600/20' },
                  { label: 'Reading Time', value: `${totalReadingTime}m`, icon: Clock, color: 'from-pink-500/20 to-pink-600/20' },
                  { label: 'Words Learned', value: totalWords, icon: GraduationCap, color: 'from-emerald-500/20 to-emerald-600/20' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-2xl bg-gradient-to-br ${stat.color} backdrop-blur-sm border border-white/10 p-4`}
                  >
                    <stat.icon className="w-5 h-5 text-white/60 mb-2" />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/40">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Pending approvals */}
              {pendingBooks.length > 0 && (
                <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Pending Approvals ({pendingBooks.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingBooks.map((book) => (
                      <div key={book.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                        <div>
                          <p className="text-sm text-white">{book.title}</p>
                          <p className="text-xs text-white/40">
                            {book.pages.length} pages · {book.genre}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateBook(book.id, { status: 'approved' })}
                            className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center justify-center transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateBook(book.id, { status: 'rejected' })}
                            className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subscription info */}
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                <h3 className="font-semibold text-white mb-2">Subscription</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                      parentAccount?.subscription.status === 'active'
                        ? parentAccount?.subscription.expiryDate === '2099-12-31T23:59:59Z'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-green-500/20 text-green-400'
                        : parentAccount?.subscription.status === 'trial'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                    }`}>
                      {parentAccount?.subscription.status === 'active' ? 'Active' : parentAccount?.subscription.status === 'trial' ? 'Trial' : 'Expired'}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">
                    {parentAccount?.subscription.status === 'trial' && 'Expires ' + new Date(parentAccount.subscription.expiryDate).toLocaleDateString()}
                    {parentAccount?.subscription.status === 'active' && (
                      <>
                        {parentAccount?.subscription.expiryDate === '2099-12-31T23:59:59Z' ? 'Free Forever 🎉' : 'Renews automatically'}
                      </>
                    )}
                    {parentAccount?.subscription.status === 'expired' && 'Subscribe to continue creating stories'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Children Tab */}
          {activeTab === 'children' && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {children.map((child) => {
                const childBooks = allBooks.filter((b) => b.childId === child.id)
                return (
                  <div
                    key={child.id}
                    className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{child.avatar}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{child.name}</h3>
                        <p className="text-xs text-white/40">Ages {child.ageRange}</p>

                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-sm font-bold text-white">{childBooks.length}</p>
                            <p className="text-[10px] text-white/40">Books</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-sm font-bold text-white">{child.readingStats.totalPagesRead}</p>
                            <p className="text-[10px] text-white/40">Pages</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-sm font-bold text-white">{child.vocabularyProgress.totalWordsLearned}</p>
                            <p className="text-[10px] text-white/40">Words</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {children.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/40">No children added yet</p>
                  <button
                    onClick={() => setPage('onboarding')}
                    className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm underline"
                  >
                    Add a child
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Controls Tab */}
          {activeTab === 'controls' && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Content approval */}
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Content Controls
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">Require approval for new stories</p>
                      <p className="text-xs text-white/40">Review stories before children can read them</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={parentAccount?.requireApproval ?? false}
                        onChange={(e) => updateParentAccount({ requireApproval: e.target.checked })}
                      />
                      <div className="w-10 h-5 bg-white/10 peer-checked:bg-indigo-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">Block mature content</p>
                      <p className="text-xs text-white/40">Automatically filter inappropriate content</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={parentAccount?.blockMatureContent ?? true}
                        onChange={(e) => updateParentAccount({ blockMatureContent: e.target.checked })}
                      />
                      <div className="w-10 h-5 bg-white/10 peer-checked:bg-indigo-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Reading time limits */}
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-purple-400" />
                  Reading Time Limits
                </h3>

                {children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{child.avatar}</span>
                      <span className="text-sm text-white">{child.name}</span>
                    </div>
                    <select
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white/70 focus:outline-none focus:border-indigo-400"
                      value={child.readingTimeLimit}
                      onChange={(e) => updateChild(child.id, { readingTimeLimit: parseInt(e.target.value) })}
                    >
                      <option value={0}>No limit</option>
                      <option value={15}>15 min/day</option>
                      <option value={30}>30 min/day</option>
                      <option value={45}>45 min/day</option>
                      <option value={60}>60 min/day</option>
                    </select>
                  </div>
                ))}
              </div>

              {/* Data management */}
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                <h3 className="font-semibold text-white mb-3">Data Management</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleExportData}
                    className="w-full py-2.5 rounded-xl bg-white/5 text-white/70 text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export All Data
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All Data
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                <h3 className="font-semibold text-white mb-3">Account Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                <h3 className="font-semibold text-white mb-3">Notifications</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Reading reminders', desc: 'Daily reminder to read', key: 'readingReminders' as const },
                    { label: 'New story alerts', desc: 'When a story is generated', key: 'newStoryAlerts' as const },
                    { label: 'Weekly summary', desc: 'Reading stats summary', key: 'weeklySummary' as const },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{item.label}</p>
                        <p className="text-xs text-white/40">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={parentNotifications[item.key]}
                          onChange={(e) => setParentNotifications((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                        />
                        <div className="w-10 h-5 bg-white/10 peer-checked:bg-indigo-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                <h3 className="font-semibold text-white mb-3">Security</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">Change Passcode</p>
                      <p className="text-xs text-white/40">Update your 4-digit passcode</p>
                    </div>
                    <button
                      onClick={() => setPage('settings')}
                      className="px-3 py-1.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">Face ID</p>
                      <p className="text-xs text-white/40">Use Face ID for authentication</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer">
                      <input type="checkbox" className="sr-only peer" disabled />
                      <div className="w-10 h-5 bg-white/10 peer-checked:bg-indigo-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5 opacity-50" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    useAppStore.getState().setLegalPageType('terms')
                    setPage('legal')
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => {
                    useAppStore.getState().setLegalPageType('privacy')
                    setPage('legal')
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => {
                    useAppStore.getState().setLegalPageType('coppa')
                    setPage('legal')
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                >
                  COPPA Compliance
                </button>
                <button
                  onClick={() => setPage('admin')}
                  className="w-full py-2.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                >
                  Admin Panel
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Delete All Data?</h3>
                <p className="text-sm text-gray-400 mt-1">
                  This will permanently remove all accounts, children, books, and settings. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearData}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                >
                  Delete Everything
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
