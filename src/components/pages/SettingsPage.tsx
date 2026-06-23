'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Bell, Lock, Baby, Database, Info, Shield, FileText, BookOpen, Home, Plus, BookMarked, Wrench, Trash2, Download, Check, X } from 'lucide-react'
import { useAppStore, AVATARS, AGE_RANGES, type ChildProfile } from '@/lib/store'
import { hashPasscode, verifyPasscode } from '@/lib/utils'

export default function SettingsPage() {
  const { setPage, parentAccount, mode, updateParentAccount, clearParentAccount, updateChild, books } = useAppStore()

  // Notification settings (persisted in parent account if available, otherwise local)
  const [notifications, setNotifications] = useState({
    readingReminders: true,
    newStoryAlerts: true,
    weeklySummary: false,
  })

  // Passcode change state
  const [showPasscodeChange, setShowPasscodeChange] = useState(false)
  const [currentPasscodeInput, setCurrentPasscodeInput] = useState('')
  const [newPasscodeInput, setNewPasscodeInput] = useState('')
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState('')
  const [passcodeError, setPasscodeError] = useState('')
  const [passcodeSuccess, setPasscodeSuccess] = useState(false)

  // Child editing state
  const [editingChildId, setEditingChildId] = useState<string | null>(null)
  const [editChildName, setEditChildName] = useState('')
  const [editChildAge, setEditChildAge] = useState<'3-5' | '6-8' | '9-12'>('3-5')
  const [editChildAvatar, setEditChildAvatar] = useState('')

  // Clear data confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false)

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

  const handlePasscodeChange = () => {
    setPasscodeError('')
    setPasscodeSuccess(false)

    if (!parentAccount) {
      setPasscodeError('No parent account found')
      return
    }

    if (currentPasscodeInput.length !== 4) {
      setPasscodeError('Current passcode must be 4 digits')
      return
    }

    if (!verifyPasscode(currentPasscodeInput, parentAccount.passcode)) {
      setPasscodeError('Current passcode is incorrect')
      return
    }

    if (newPasscodeInput.length !== 4) {
      setPasscodeError('New passcode must be 4 digits')
      return
    }

    if (newPasscodeInput !== confirmPasscodeInput) {
      setPasscodeError('New passcodes do not match')
      return
    }

    const newHash = hashPasscode(newPasscodeInput)
    updateParentAccount({ passcode: newHash })
    setPasscodeSuccess(true)
    setCurrentPasscodeInput('')
    setNewPasscodeInput('')
    setConfirmPasscodeInput('')
    setTimeout(() => setShowPasscodeChange(false), 1500)
  }

  const startEditChild = (child: ChildProfile) => {
    setEditingChildId(child.id)
    setEditChildName(child.name)
    setEditChildAge(child.ageRange)
    setEditChildAvatar(child.avatar)
  }

  const saveEditChild = () => {
    if (!editingChildId) return
    updateChild(editingChildId, {
      name: editChildName,
      ageRange: editChildAge,
      avatar: editChildAvatar,
    })
    setEditingChildId(null)
  }

  const cancelEditChild = () => {
    setEditingChildId(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => setPage(mode === 'parent' ? 'parent-dashboard' : 'child-home')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Notifications */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 border-b border-purple-50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-500" />
                Notifications
              </h2>
            </div>
            <div className="divide-y divide-purple-50">
              {[
                { key: 'readingReminders' as const, label: 'Reading Reminders', desc: 'Daily reminders to read', checked: notifications.readingReminders },
                { key: 'newStoryAlerts' as const, label: 'New Story Alerts', desc: 'When a story is generated', checked: notifications.newStoryAlerts },
                { key: 'weeklySummary' as const, label: 'Weekly Summary', desc: 'Reading stats summary', checked: notifications.weeklySummary },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={item.checked}
                      onChange={(e) => setNotifications((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-checked:bg-indigo-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5" />
                  </label>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Parent Controls */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-4 border-b border-purple-50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-500" />
                Parent Controls
              </h2>
            </div>
            <div className="divide-y divide-purple-50">
              <button
                onClick={() => {
                  setShowPasscodeChange(!showPasscodeChange)
                  setPasscodeError('')
                  setPasscodeSuccess(false)
                  setCurrentPasscodeInput('')
                  setNewPasscodeInput('')
                  setConfirmPasscodeInput('')
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">Change Passcode</p>
                  <p className="text-xs text-gray-400">Update your 4-digit passcode</p>
                </div>
                <ChevronLeft className={`w-4 h-4 text-gray-300 transition-transform ${showPasscodeChange ? 'rotate-90' : '-rotate-90'}`} />
              </button>

              {/* Passcode Change Inline Form */}
              <AnimatePresence>
                {showPasscodeChange && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-purple-50/30"
                  >
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Current Passcode</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={currentPasscodeInput}
                          onChange={(e) => setCurrentPasscodeInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-gray-800 text-sm text-center tracking-[0.5em] focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">New Passcode</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={newPasscodeInput}
                          onChange={(e) => setNewPasscodeInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-gray-800 text-sm text-center tracking-[0.5em] focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Confirm New Passcode</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={confirmPasscodeInput}
                          onChange={(e) => setConfirmPasscodeInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-gray-800 text-sm text-center tracking-[0.5em] focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                      {passcodeError && (
                        <p className="text-xs text-red-500">{passcodeError}</p>
                      )}
                      {passcodeSuccess && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Passcode updated successfully!
                        </p>
                      )}
                      <button
                        onClick={handlePasscodeChange}
                        className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                      >
                        Update Passcode
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">Face ID</p>
                  <p className="text-xs text-gray-400">Use Face ID for authentication</p>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input type="checkbox" className="sr-only peer" disabled />
                  <div className="w-10 h-5 bg-gray-200 peer-checked:bg-indigo-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5 opacity-50" />
                </label>
              </div>
            </div>
          </motion.div>

          {/* Child Profile Editing */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-4 border-b border-purple-50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Baby className="w-4 h-4 text-purple-500" />
                Child Profiles
              </h2>
            </div>
            <div className="divide-y divide-purple-50">
              {(parentAccount?.children || []).map((child) => (
                <div key={child.id} className="p-4">
                  {editingChildId === child.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Name</label>
                        <input
                          type="text"
                          value={editChildName}
                          onChange={(e) => setEditChildName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-gray-800 text-sm focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Age Range</label>
                        <div className="flex gap-2">
                          {AGE_RANGES.map((range) => (
                            <button
                              key={range}
                              onClick={() => setEditChildAge(range)}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                                editChildAge === range
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-white border border-purple-200 text-gray-600'
                              }`}
                            >
                              Ages {range}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Avatar</label>
                        <div className="flex flex-wrap gap-2">
                          {AVATARS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => setEditChildAvatar(emoji)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                                editChildAvatar === emoji
                                  ? 'bg-indigo-500/30 border-2 border-indigo-400 scale-110'
                                  : 'bg-white border border-purple-200'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEditChild}
                          className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEditChild}
                          className="flex-1 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{child.avatar}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{child.name}</p>
                          <p className="text-xs text-gray-400">Ages {child.ageRange}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => startEditChild(child)}
                        className="text-xs text-indigo-500 hover:text-indigo-600 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Data Management */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="p-4 border-b border-purple-50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-500" />
                Data Management
              </h2>
            </div>
            <div className="divide-y divide-purple-50">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors"
              >
                <div className="text-left flex items-center gap-3">
                  <Download className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Export Data</p>
                    <p className="text-xs text-gray-400">Download all your data as JSON</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50/50 transition-colors"
              >
                <div className="text-left flex items-center gap-3">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-600">Clear All Data</p>
                    <p className="text-xs text-gray-400">Permanently delete all data</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
              </button>
            </div>
          </motion.div>

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
                  className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                      <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Delete All Data?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      This will permanently remove all accounts, children, books, and settings. This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
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

          {/* About & Legal */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="p-4 border-b border-purple-50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-500" />
                About & Legal
              </h2>
            </div>
            <div className="divide-y divide-purple-50">
              <button
                onClick={() => { useAppStore.getState().setLegalPageType('terms'); setPage('legal') }}
                className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-800">Terms of Service</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
              </button>
              <button
                onClick={() => { useAppStore.getState().setLegalPageType('privacy'); setPage('legal') }}
                className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-800">Privacy Policy</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
              </button>
              <button
                onClick={() => { useAppStore.getState().setLegalPageType('coppa'); setPage('legal') }}
                className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Baby className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-800">COPPA Compliance</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
              </button>
              <button
                onClick={() => setPage('admin')}
                className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-800">Admin Panel</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
              </button>
            </div>
          </motion.div>

          {/* App version */}
          <p className="text-center text-xs text-gray-400 py-4">
            InkWings v1.0.0 · Made with ❤️ for young readers
          </p>
        </div>
      </div>

      {/* Bottom navigation (if in child mode) */}
      {mode === 'child' && (
        <div className="bg-white/90 backdrop-blur-sm border-t border-purple-100 px-4 py-2 safe-area-bottom">
          <div className="max-w-lg mx-auto flex items-center justify-around">
            {[
              { icon: Home, label: 'Home', page: 'child-home' as const },
              { icon: BookMarked, label: 'My Books', page: 'my-books' as const },
              { icon: Plus, label: 'Create', page: 'create-book' as const },
              { icon: Wrench, label: 'Settings', page: 'settings' as const, active: true },
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
      )}
    </div>
  )
}
