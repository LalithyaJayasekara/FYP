import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getGuestSession, upsertGuestSession } from '../services/guestSessionStore'
import { requestGuestChatAnswer, type GuestChatHistoryEntry } from '../services/guestChatApi'

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

type CarouselSlide = {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string
  stats?: string
  features: string[]
  color: string
  gradient: string
}

const carouselSlides: CarouselSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to CareLink',
    subtitle: 'AI-Powered Learning Disability Screening',
    description: 'Making workplaces truly inclusive for neurodiverse professionals',
    icon: '🩺',
    stats: '85% Retention Rate',
    features: ['Healthcare-HR Bridge', '3 Weeks to Support', 'Personalized Plans'],
    color: 'bg-cyan-50 border-cyan-200 text-cyan-900',
    gradient: 'from-cyan-600 to-cyan-500'
  },
  {
    id: 'multimodal',
    title: '3-Way Screening Power',
    subtitle: 'Questionnaire + Voice + Handwriting Analysis',
    description: 'Comprehensive assessment using multiple data sources for accurate insights',
    icon: '🔍',
    stats: '94% Accuracy Rate',
    features: [
      '📝 Symptom Questionnaire',
      '🎤 Voice Fluency Tasks',
      '✍️ Handwriting Analysis'
    ],
    color: 'bg-blue-50 border-blue-200 text-blue-900',
    gradient: 'from-blue-600 to-blue-500'
  },
  {
    id: 'ai-agent',
    title: 'AI Agent Assistant',
    subtitle: 'Your Personal Screening Guide',
    description: 'Intelligent chatbot that answers questions and guides you through the process',
    icon: '🤖',
    stats: '24/7 Available',
    features: [
      '💬 Instant Answers',
      '🎯 Process Guidance',
      '🔒 Privacy Focused'
    ],
    color: 'bg-purple-50 border-purple-200 text-purple-900',
    gradient: 'from-purple-600 to-purple-500'
  },
  {
    id: 'support',
    title: 'Personalized Support Plans',
    subtitle: 'Cognitive + Workplace Fit',
    description: 'Receive tailored accommodation recommendations and connect with healthcare professionals',
    icon: '📋',
    stats: '3 Weeks Faster',
    features: [
      '🏥 Clinical Validation',
      '💼 Workplace Accommodations',
      '📈 Progress Tracking'
    ],
    color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    gradient: 'from-emerald-600 to-emerald-500'
  },
  {
    id: 'workplace',
    title: 'Seamless Integration',
    subtitle: 'HR Collaboration Made Easy',
    description: 'Workplace accommodations integrated with HR systems for smooth implementation',
    icon: '🏢',
    stats: 'Zero Disruption',
    features: [
      '🔗 HR System Integration',
      '📊 Performance Analytics',
      '🤝 Team Collaboration'
    ],
    color: 'bg-amber-50 border-amber-200 text-amber-900',
    gradient: 'from-amber-600 to-amber-500'
  },
  {
    id: 'privacy',
    title: 'Enterprise Security',
    subtitle: 'Healthcare-Grade Protection',
    description: 'Your data is protected with bank-level security and full privacy controls',
    icon: '🔒',
    stats: 'HIPAA Compliant',
    features: [
      '🛡️ End-to-End Encryption',
      '👥 Consent Management',
      '📋 Audit Trails'
    ],
    color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    gradient: 'from-indigo-600 to-indigo-500'
  }
]

export default function GuestProfilePage() {
  const maxGuestChatTurns = 3
  const navigate = useNavigate()
  const guestSession = getGuestSession()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [showChatbot, setShowChatbot] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [guestChatTurnsUsed, setGuestChatTurnsUsed] = useState(guestSession?.chatTurnsUsed ?? 0)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      content: "Hi there! I'm your AI assistant for the CareLink screening process."
    },
    {
      id: 'assistant-help',
      role: 'assistant',
      content:
        'I can help with questionnaire guidance, voice and writing tasks, privacy basics, and how to interpret preliminary screening insights.'
    },
    {
      id: 'assistant-tip',
      role: 'assistant',
      content:
        'Pro tip: You can ask up to 3 questions in guest mode before sign-in is required for full assistance.'
    },
  ])

  const remainingGuestTurns = maxGuestChatTurns - guestChatTurnsUsed
  const guestTurnLimitReached = remainingGuestTurns <= 0

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false) // Pause auto-play when user interacts
  }

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
  }

  const continueWithAuthentication = (reason: 'guest-chat-limit' | 'start-assessment' = 'start-assessment') => {
    upsertGuestSession({
      chatTurnsUsed: guestChatTurnsUsed,
      intendedPath: '/screening',
    })
    navigate('/auth', { state: { from: '/screening', reason } })
  }

  const sendGuestMessage = async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || guestTurnLimitReached || isChatLoading) {
      return
    }

    const nextTurn = guestChatTurnsUsed + 1
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }
    const assistantPlaceholder: ChatMessage = {
      id: `assistant-${Date.now()}-${nextTurn}`,
      role: 'assistant',
      content: 'Thinking... please wait while I gather guidance.',
    }

    setChatMessages((prev) => [...prev, userMessage, assistantPlaceholder])
    setGuestChatTurnsUsed(nextTurn)
    setChatInput('')
    setIsChatLoading(true)

    const history: GuestChatHistoryEntry[] = [
      ...chatMessages,
      userMessage,
    ]
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }))

    try {
      const answer = await requestGuestChatAnswer(trimmed, history)
      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === assistantPlaceholder.id
            ? { ...message, content: answer }
            : message
        )
      )
    } catch (error) {
      const fallback =
        error instanceof Error
          ? error.message
          : 'The assistant is unavailable right now. Please try again in a moment.'

      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === assistantPlaceholder.id
            ? { ...message, content: fallback }
            : message
        )
      )
    } finally {
      setIsChatLoading(false)
    }
  }

  useEffect(() => {
    upsertGuestSession({
      chatTurnsUsed: guestChatTurnsUsed,
      intendedPath: '/screening',
    })
  }, [guestChatTurnsUsed])

  useEffect(() => {
    if (guestTurnLimitReached) {
      upsertGuestSession({
        chatTurnsUsed: guestChatTurnsUsed,
        intendedPath: '/screening',
      })
      navigate('/auth', { replace: true, state: { from: '/screening', reason: 'guest-chat-limit' } })
    }
  }, [guestChatTurnsUsed, guestTurnLimitReached, navigate])

  return (
    <main className="relative min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/carelink-icon.svg" alt="CareLink" className="h-8 w-8" />
            <span className="text-xl font-bold text-slate-900">CareLink</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              You are browsing as a guest
            </span>
            <Link
              to="/welcome"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Carousel */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {carouselSlides.map((slide) => (
                <div key={slide.id} className="w-full flex-shrink-0">
                  <div className={`relative p-8 md:p-12 ${slide.color} min-h-[500px] flex items-center`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 2px, transparent 2px)`,
                        backgroundSize: '40px 40px'
                      }}></div>
                    </div>

                    <div className="relative mx-auto max-w-4xl">
                      <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Left Content */}
                        <div className="text-center md:text-left">
                          <div className="mb-6 text-7xl md:text-8xl">{slide.icon}</div>
                          <h2 className="mb-2 text-3xl md:text-4xl font-bold">
                            {slide.title}
                          </h2>
                          <p className="mb-4 text-xl font-semibold opacity-90">
                            {slide.subtitle}
                          </p>
                          <p className="text-lg leading-relaxed opacity-80 mb-6">
                            {slide.description}
                          </p>

                          {/* Stats Badge */}
                          {slide.stats && (
                            <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${slide.gradient} px-4 py-2 text-white font-semibold shadow-lg`}>
                              <span className="text-2xl">📊</span>
                              {slide.stats}
                            </div>
                          )}
                        </div>

                        {/* Right Content - Features Grid */}
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold mb-4 text-center md:text-left">Key Features</h3>
                          <div className="grid gap-3">
                            {slide.features.map((feature, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 rounded-lg bg-white/60 backdrop-blur-sm p-4 shadow-sm border border-white/20"
                              >
                                <span className="text-2xl">{feature.split(' ')[0]}</span>
                                <span className="font-medium">{feature.substring(feature.indexOf(' ') + 1)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm p-3 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
              aria-label="Previous slide"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <svg className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm p-3 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
              aria-label="Next slide"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <svg className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Auto-play Toggle */}
            <button
              onClick={toggleAutoPlay}
              className="absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-lg hover:bg-white transition-all duration-200"
              aria-label={isAutoPlaying ? "Pause auto-play" : "Start auto-play"}
            >
              {isAutoPlaying ? (
                <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15m-3 7.5A9.5 9.5 0 1121.5 12 9.5 9.5 0 0112 2.5z" />
                </svg>
              )}
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-3 w-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-white shadow-lg scale-125'
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700 ease-in-out"
                style={{ width: `${((currentSlide + 1) / carouselSlides.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-slate-50 to-cyan-50 rounded-2xl p-8 border border-slate-200">
          <div className="mb-6">
            <h3 className="mb-2 text-3xl font-bold text-slate-900">
              Ready to Experience AI-Powered Screening?
            </h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Join thousands of professionals who have discovered their learning strengths through our comprehensive multimodal assessment.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="text-4xl mb-3">📝</div>
              <h4 className="font-semibold text-slate-900 mb-2">Smart Questionnaire</h4>
              <p className="text-sm text-slate-600">Clinically validated questions adapted to your responses</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="text-4xl mb-3">🎤</div>
              <h4 className="font-semibold text-slate-900 mb-2">Voice Analysis</h4>
              <p className="text-sm text-slate-600">Natural speech patterns reveal reading fluency insights</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="text-4xl mb-3">✍️</div>
              <h4 className="font-semibold text-slate-900 mb-2">Writing Assessment</h4>
              <p className="text-sm text-slate-600">Handwriting analysis provides additional diagnostic signals</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate('/guest/questionnaire')}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Start Your Assessment
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 px-8 py-4 text-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Register for Full Access
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-500 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            No account required • 5-minute assessment • Completely confidential
          </p>
        </div>
      </div>

      {/* Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {showChatbot ? (
          <div className="mb-4 w-80 rounded-xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-lg">🤖</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">CareLink Assistant</p>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    AI-Powered • Online 24/7
                  </p>
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                {remainingGuestTurns} / {maxGuestChatTurns} chats left
              </div>
              <button
                onClick={() => setShowChatbot(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-80 p-4 overflow-y-auto">
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {guestTurnLimitReached ? (
                  <div className="flex justify-start">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 max-w-[80%]">
                      <p className="text-sm text-amber-900">
                        Guest chat limit reached. Sign in to continue AI guidance and full screening support.
                      </p>
                      <button
                        onClick={() => continueWithAuthentication('guest-chat-limit')}
                        className="mt-3 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Sign in to continue
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="border-t border-slate-200 p-4 bg-slate-50 rounded-b-xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      sendGuestMessage()
                    }
                  }}
                  placeholder="Ask me anything about screening..."
                  disabled={guestTurnLimitReached}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400"
                />
                <button
                  onClick={sendGuestMessage}
                  disabled={guestTurnLimitReached || chatInput.trim().length === 0 || isChatLoading}
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChatLoading ? 'Thinking…' : 'Ask AI'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Powered by advanced AI • {remainingGuestTurns} guest chats remaining
              </p>
            </div>
          </div>
        ) : null}

        <button
          onClick={() => setShowChatbot(!showChatbot)}
          className="group flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          aria-label="Open AI assistant"
        >
          {showChatbot ? (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="relative">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          )}
        </button>

        {/* Chatbot Tooltip */}
        {!showChatbot && (
          <div className="absolute bottom-20 right-0 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            💬 Ask our AI assistant!
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>
          </div>
        )}
      </div>
    </main>
  )
}