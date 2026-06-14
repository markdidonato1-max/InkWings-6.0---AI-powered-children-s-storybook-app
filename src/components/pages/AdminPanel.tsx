'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Send, Activity, DollarSign, Zap, Key, Image, BookOpen, Cpu, Palette, CheckCircle, XCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const NVIDIA_STORY_MODELS = [
  { value: 'meta/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', description: 'Best for creative writing' },
  { value: 'moonshotai/kimi-k2.6', label: 'Kimi K2.6', description: 'Alternative creative model' },
  { value: 'glm-4', label: 'GLM-4', description: 'General purpose model' },
]

const NVIDIA_IMAGE_MODELS = [
  { value: 'stabilityai/stable-diffusion-xl', label: 'SDXL', description: 'Stable Diffusion XL - versatile' },
  { value: 'stabilityai/stable-diffusion-3-medium', label: 'SD3 Medium', description: 'SD3 - improved quality' },
  { value: 'black-forest-labs/flux-1-schnell', label: 'Flux Schnell', description: 'Fast generation' },
]

const IMAGE_STYLES = [
  { value: 'watercolor', label: 'Watercolor', emoji: '🎨' },
  { value: 'anime', label: 'Anime', emoji: '🎌' },
  { value: 'mythical', label: 'Mythical', emoji: '✨' },
  { value: 'cartoon', label: 'Cartoon', emoji: '🖍️' },
  { value: 'realistic', label: 'Realistic', emoji: '📷' },
]

export default function AdminPanel() {
  const {
    setPage, adminApiKey, setAdminApiKey, adminCallLogs, addAdminCallLog,
    nvidiaApiKey, setNvidiaApiKey, nvidiaStoryModel, setNvidiaStoryModel,
    nvidiaImageStyle, setNvidiaImageStyle, nvidiaImageModel, setNvidiaImageModel,
  } = useAppStore()

  const [testPrompt, setTestPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [testImagePrompt, setTestImagePrompt] = useState('')
  const [imageResponse, setImageResponse] = useState('')
  const [isImageLoading, setIsImageLoading] = useState(false)

  const totalCalls = adminCallLogs.length
  const totalTokens = adminCallLogs.reduce((sum, log) => sum + log.tokens, 0)
  const estimatedCost = (totalTokens * 0.00003).toFixed(4)

  const handleTestStory = async () => {
    if (!testPrompt.trim()) return
    setIsLoading(true)
    setResponse('')

    const startTime = Date.now()

    try {
      const requestBody: Record<string, unknown> = {
        prompt: testPrompt,
        storyStyle: 'Fairy Tale',
        genre: 'adventure',
        ageRange: '3-5',
        moral: 'kindness',
        pageCount: 4,
        imageCount: 2,
        childName: 'Test Child',
      }

      let endpoint = '/api/generate-story'

      if (nvidiaApiKey) {
        endpoint = '/api/nvidia-story'
        requestBody.apiKey = nvidiaApiKey
        requestBody.model = nvidiaStoryModel
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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

  const handleTestImage = async () => {
    if (!testImagePrompt.trim()) return
    setIsImageLoading(true)
    setImageResponse('')

    try {
      const requestBody: Record<string, unknown> = {
        prompt: testImagePrompt,
        style: nvidiaImageStyle,
      }

      let endpoint = '/api/generate-image'

      if (nvidiaApiKey) {
        endpoint = '/api/nvidia-image'
        requestBody.apiKey = nvidiaApiKey
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json()

      if (data.base64) {
        setImageResponse(`Image generated successfully! Base64 length: ${data.base64.length} chars`)
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

          {/* NVIDIA API Configuration */}
          <motion.div
            className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-green-400" />
              NVIDIA API Configuration
            </h3>

            {/* API Key */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={nvidiaApiKey}
                  onChange={(e) => setNvidiaApiKey(e.target.value)}
                  placeholder="nvapi-..."
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-white/20 focus:outline-none focus:border-green-400/50"
                />
                <button
                  onClick={() => setNvidiaApiKey('')}
                  className="px-3 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                >
                  Clear
                </button>
              </div>
              {nvidiaApiKey && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  API key set ({nvidiaApiKey.substring(0, 8)}...)
                </div>
              )}
              {!nvidiaApiKey && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
                  <XCircle className="w-3 h-3" />
                  No API key — using built-in SDK fallback
                </div>
              )}
            </div>

            {/* Story Model Selector */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Story Generation Model
              </label>
              <div className="grid grid-cols-3 gap-2">
                {NVIDIA_STORY_MODELS.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => setNvidiaStoryModel(model.value)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      nvidiaStoryModel === model.value
                        ? 'bg-green-500/20 border-2 border-green-400'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className={`text-sm font-medium ${nvidiaStoryModel === model.value ? 'text-green-300' : 'text-white/70'}`}>
                      {model.label}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{model.description}</p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">
                Currently: <span className="text-green-400">{nvidiaStoryModel}</span>
              </p>
            </div>

            {/* Image Model Selector */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5" />
                Image Generation Model
              </label>
              <div className="grid grid-cols-3 gap-2">
                {NVIDIA_IMAGE_MODELS.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => setNvidiaImageModel(model.value)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      nvidiaImageModel === model.value
                        ? 'bg-green-500/20 border-2 border-green-400'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className={`text-sm font-medium ${nvidiaImageModel === model.value ? 'text-green-300' : 'text-white/70'}`}>
                      {model.label}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{model.description}</p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">
                Currently: <span className="text-green-400">{nvidiaImageModel}</span>
              </p>
            </div>

            {/* Image Style Selector */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Illustration Style
              </label>
              <div className="flex flex-wrap gap-2">
                {IMAGE_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setNvidiaImageStyle(style.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                      nvidiaImageStyle === style.value
                        ? 'bg-green-500/20 border-2 border-green-400 text-green-300'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <span>{style.emoji}</span>
                    {style.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">
                Currently: <span className="text-green-400">{nvidiaImageStyle}</span>
              </p>
            </div>
          </motion.div>

          {/* Legacy API Key (for reference) */}
          <motion.div
            className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
              <Key className="w-4 h-4 text-amber-400" />
              Legacy API Key
            </h3>
            <div className="flex gap-2">
              <input
                type="password"
                value={adminApiKey}
                onChange={(e) => setAdminApiKey(e.target.value)}
                placeholder="Legacy key..."
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
              {nvidiaApiKey && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  NVIDIA
                </span>
              )}
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
              {nvidiaApiKey && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  NVIDIA
                </span>
              )}
            </h3>
            <textarea
              value={testImagePrompt}
              onChange={(e) => setTestImagePrompt(e.target.value)}
              placeholder="Enter a test prompt for image generation..."
              className="w-full h-20 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-pink-400/50 resize-none font-mono"
            />
            <div className="flex items-center gap-2 mt-2 mb-3">
              <span className="text-xs text-gray-500">Style: {nvidiaImageStyle}</span>
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

          {/* Story Response */}
          {response && (
            <motion.div
              className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-semibold text-white mb-3">Story Response</h3>
              <pre className="bg-black/30 rounded-xl p-4 text-xs text-green-400 font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                {response}
              </pre>
            </motion.div>
          )}

          {/* Image Response */}
          {imageResponse && (
            <motion.div
              className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-semibold text-white mb-3">Image Response</h3>
              <pre className="bg-black/30 rounded-xl p-4 text-xs text-green-400 font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                {imageResponse}
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
