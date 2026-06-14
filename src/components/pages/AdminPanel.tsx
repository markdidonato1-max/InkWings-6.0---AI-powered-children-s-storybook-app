'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Send, Activity, DollarSign, Zap, Key } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function AdminPanel() {
  const { setPage, adminApiKey, setAdminApiKey, adminCallLogs, addAdminCallLog } = useAppStore()

  const [testPrompt, setTestPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const totalCalls = adminCallLogs.length
  const totalTokens = adminCallLogs.reduce((sum, log) => sum + log.tokens, 0)
  const estimatedCost = (totalTokens * 0.00003).toFixed(4)

  const handleTestPrompt = async () => {
    if (!testPrompt.trim()) return
    setIsLoading(true)
    setResponse('')

    const startTime = Date.now()

    try {
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          storyStyle: 'Fairy Tale',
          genre: 'adventure',
          ageRange: '3-5',
          moral: 'kindness',
          pageCount: 4,
          childName: 'Test Child',
        }),
      })

      const data = await res.json()
      const duration = Date.now() - startTime

      setResponse(JSON.stringify(data, null, 2))

      addAdminCallLog({
        timestamp: new Date().toISOString(),
        prompt: testPrompt,
        response: JSON.stringify(data).substring(0, 200),
        tokens: Math.floor(duration / 100),
      })
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setPage('welcome')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Admin Panel
            </h1>
            <p className="text-xs text-gray-500">API Testing & Debugging</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {[
              { label: 'Total Calls', value: totalCalls, icon: Activity, color: 'from-blue-500/20 to-blue-600/20' },
              { label: 'Tokens Used', value: totalTokens, icon: Zap, color: 'from-amber-500/20 to-amber-600/20' },
              { label: 'Est. Cost', value: `$${estimatedCost}`, icon: DollarSign, color: 'from-green-500/20 to-green-600/20' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl bg-gradient-to-br ${stat.color} backdrop-blur-sm border border-white/10 p-4 text-center`}
              >
                <stat.icon className="w-5 h-5 text-white/60 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* API Key */}
          <motion.div
            className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              NVIDIA API Key
            </h3>
            <div className="flex gap-2">
              <input
                type="password"
                value={adminApiKey}
                onChange={(e) => setAdminApiKey(e.target.value)}
                placeholder="nvapi-..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-white/20 focus:outline-none focus:border-amber-400/50"
              />
              <button
                onClick={() => setAdminApiKey('')}
                className="px-3 py-2 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>

          {/* Test prompt */}
          <motion.div
            className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold text-white mb-3">Test Story Generation</h3>
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a test prompt for story generation..."
              className="w-full h-24 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-indigo-400/50 resize-none font-mono"
            />
            <button
              onClick={handleTestPrompt}
              disabled={isLoading || !testPrompt.trim()}
              className={`mt-3 w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                isLoading || !testPrompt.trim()
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/30'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test Prompt
                </>
              )}
            </button>
          </motion.div>

          {/* Response */}
          {response && (
            <motion.div
              className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-semibold text-white mb-3">Response</h3>
              <pre className="bg-black/30 rounded-xl p-4 text-xs text-green-400 font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                {response}
              </pre>
            </motion.div>
          )}

          {/* Call logs */}
          {adminCallLogs.length > 0 && (
            <motion.div
              className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-semibold text-white mb-3">API Call Logs</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {[...adminCallLogs].reverse().map((log, i) => (
                  <div key={i} className="bg-black/20 rounded-xl p-3 text-xs font-mono">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-400">{new Date(log.timestamp).toLocaleString()}</span>
                      <span className="text-white/40">{log.tokens} tokens</span>
                    </div>
                    <p className="text-white/60 truncate">{log.prompt}</p>
                    <p className="text-green-400/50 truncate mt-1">{log.response.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
