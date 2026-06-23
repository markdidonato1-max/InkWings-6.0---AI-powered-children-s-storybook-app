'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Send, Activity, DollarSign, Zap, Image, BookOpen, Palette, CheckCircle, XCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const IMAGE_STYLES = [
  { value: 'watercolor', label: 'Watercolor', emoji: '🎨' },
  { value: 'anime', label: 'Anime', emoji: '🎌' },
  { value: 'cartoon', label: 'Cartoon', emoji: '🖍️' },
  { value: 'digital art', label: 'Digital Art', emoji: '✨' },
  { value: 'pencil sketch', label: 'Pencil Sketch', emoji: '✏️' },
  { value: 'oil painting', label: 'Oil Painting', emoji: '🖼️' },
  { value: '3d render', label: '3D Render', emoji: '🎮' },
  { value: 'pixel art', label: 'Pixel Art', emoji: '👾' },
]

export default function AdminPanel() {
  const {
    setPage, adminCallLogs, addAdminCallLog, imageStyle, setImageStyle,
  } = useAppStore()

  const [testPrompt, setTestPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [testImagePrompt, setTestImagePrompt] = useState('')
  const [imageResponse, setImageResponse] = useState('')
  const [isImageLoading, setIsImageLoading] = useState(false)

  const totalCalls = adminCallLogs.length
  const totalTokens = adminCallLogs.reduce((sum, log) => sum + log.tokens, 0)
  const estimatedCost = (totalTokens * 0.000002).toFixed(4)

  const handleTestStory = async () => {
    if (!testPrompt.trim()) return
    setIsLoading(true)
    setResponse('')

    try {
      const requestBody = {
        prompt: testPrompt,
        storyStyle: 'Fairy Tale',
        genre: 'adventure',
        ageRange: '3-5' as const,
        moral: 'kindness',
        pageCount: 4,
        imageCount: 2,
        childName: 'Test Child',
      }

      const res = await fetch('/api/custom-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json()
      const responseText = JSON.stringify(data)
      const tokens = data.usage?.total_tokens || Math.floor(responseText.length / 4)

      setResponse(JSON.stringify(data, null, 2))

      addAdminCallLog({
        timestamp: new Date().toISOString(),
        prompt: testPrompt,
        response: responseText.substring(0, 200),
        tokens,
      })
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestImage = async () => {
    if (!testImagePrompt.trim()) return
    setIsImageLoading(true)
    setImageResponse('')

    try {
      const requestBody = {
        prompt: testImagePrompt,
        style: imageStyle,
      }

      const res = await fetch('/api/custom-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json()

      if (data.base64) {
        setImageResponse(`Image generated successfully! Base64 length: ${data.base64.length} chars`)
      } else if (data.imageUrl) {
        setImageResponse(`Image generated successfully! URL: ${data.imageUrl.substring(0, 60)}...`)
      } else {
        setImageResponse(JSON.stringify(data, null, 2))
      }
    } catch (error) {
      setImageResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsImageLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setPage('settings')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Admin Panel
            </h1>
            <p className="text-xs text-gray-500">API Testing & Configuration</p>
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

          {/* Image Style Selector */}
          <motion.div
            className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-pink-400" />
              Illustration Style
            </h3>
            <div className="flex flex-wrap gap-2">
              {IMAGE_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setImageStyle(style.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                    imageStyle === style.value
                      ? 'bg-pink-500/20 border-2 border-pink-400 text-pink-300'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span>{style.emoji}</span>
                  {style.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5">
              Currently: <span className="text-pink-400">{imageStyle}</span>
            </p>
          </motion.div>

          {/* Test Story Generation */}
          <motion.div
            className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Test Story Generation
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                DeepInfra
              </span>
            </h3>
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a test prompt for story generation..."
              className="w-full h-24 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-indigo-400/50 resize-none font-mono"
            />
            <button
              onClick={handleTestStory}
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
                  Test Story Generation
                </>
              )}
            </button>
          </motion.div>

          {/* Test Image Generation */}
          <motion.div
            className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Image className="w-4 h-4 text-pink-400" />
              Test Image Generation
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                DeepInfra
              </span>
            </h3>
            <textarea
              value={testImagePrompt}
              onChange={(e) => setTestImagePrompt(e.target.value)}
              placeholder="Enter a test prompt for image generation..."
              className="w-full h-20 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-pink-400/50 resize-none font-mono"
            />
            <div className="flex items-center gap-2 mt-2 mb-3">
              <span className="text-xs text-gray-500">Style: {imageStyle}</span>
            </div>
            <button
              onClick={handleTestImage}
              disabled={isImageLoading || !testImagePrompt.trim()}
              className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                isImageLoading || !testImagePrompt.trim()
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-500/30'
              }`}
            >
              {isImageLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4" />
                  Test Image Generation
                </>
              )}
            </button>
          </motion.div>

          {/* Response display */}
          {(response || imageResponse) && (
            <motion.div
              className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-semibold text-white mb-2 text-sm">Response</h3>
              {response && (
                <pre className="bg-black/30 rounded-xl p-3 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap mb-2">
                  {response}
                </pre>
              )}
              {imageResponse && (
                <pre className="bg-black/30 rounded-xl p-3 text-xs text-pink-400 font-mono overflow-x-auto whitespace-pre-wrap">
                  {imageResponse}
                </pre>
              )}
            </motion.div>
          )}

          {/* Call Logs */}
          <motion.div
            className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Recent Call Logs
            </h3>
            {adminCallLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No API calls yet. Run a test to see logs.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {adminCallLogs.slice().reverse().map((log, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="text-xs text-blue-400">{log.tokens} tokens</span>
                    </div>
                    <p className="text-white/70 truncate">{log.prompt}</p>
                    <p className="text-gray-500 text-xs truncate mt-0.5">{log.response}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
