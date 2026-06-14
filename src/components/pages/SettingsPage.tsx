'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, Bell, Lock, Baby, Database, Info, Shield, FileText, BookOpen, Home, Plus, BookMarked, Wrench } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function SettingsPage() {
  const { setPage, parentAccount, mode } = useAppStore()

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
                { label: 'Reading Reminders', desc: 'Daily reminders to read', defaultChecked: true },
                { label: 'New Story Alerts', desc: 'When a story is generated', defaultChecked: true },
                { label: 'Weekly Summary', desc: 'Reading stats summary', defaultChecked: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={item.defaultChecked} />
                    <div className="w-10 h-5 bg-gray-200 peer-checked:bg-indigo-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5"></div>
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
                onClick={() => setPage('parent-auth')}
                className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">Change Passcode</p>
                  <p className="text-xs text-gray-400">Update your 4-digit passcode</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
              </button>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">Face ID</p>
                  <p className="text-xs text-gray-400">Use Face ID for authentication</p>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-200 peer-checked:bg-indigo-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5"></div>
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
                <div key={child.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{child.avatar}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{child.name}</p>
                      <p className="text-xs text-gray-400">Ages {child.ageRange}</p>
                    </div>
                  </div>
                  <button className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">
                    Edit
                  </button>
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
              <button className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors">
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">Export Data</p>
                  <p className="text-xs text-gray-400">Download all your data</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-red-50/50 transition-colors">
                <div className="text-left">
                  <p className="text-sm font-medium text-red-600">Clear All Data</p>
                  <p className="text-xs text-gray-400">Permanently delete all data</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
              </button>
            </div>
          </motion.div>

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
