# CareLink Guest Profile Page - Development Documentation

## Overview

The Guest Profile Page serves as an engaging onboarding experience for anonymous users accessing CareLink's learning disability screening system. It bridges the gap between the landing page and the actual screening process, building trust and demonstrating value through an interactive carousel and AI-powered chatbot.

The current flow allows a guest to browse content, use capped agentic chat (maximum 3 iterations), and then requires authentication to continue into full screening and persistence features. Guest progress is stored in a temporary session with expiry controls.

**Location**: `/guest` route (unprotected)
**Purpose**: Convert anonymous visitors into engaged screening participants
**Target Users**: Employees, job seekers, and individuals interested in learning disability assessment

## 🎯 Core Objectives

- **Build Trust**: Demonstrate credibility through statistics and professional presentation
- **Show Value**: Highlight multimodal AI screening capabilities beyond basic questionnaires
- **Engage Users**: Interactive carousel with auto-progression and manual controls
- **Provide Support**: Agentic chatbot assistance with a pre-auth cap of 3 iterations
- **Drive Conversion**: Clear call-to-action leading to screening initiation
- **Gate Sensitive Actions**: Require authentication before full assessment, history, and governance workflow access

## 🎨 Design & UX Features

### Auto-Playing Carousel

**Technical Implementation**:
- **Auto-progression**: 4-second intervals between slides
- **User Controls**: Pause/play toggle, navigation arrows, clickable dots
- **Progress Indicator**: Visual progress bar showing completion status
- **Responsive Design**: Adapts from mobile (single column) to desktop (two-column grid)

**Visual Design**:
- **Layout**: Left content area + right features grid
- **Typography**: Large emoji icons (7xl-8xl), gradient backgrounds
- **Stats Badges**: Prominent data points with gradient styling
- **Background Patterns**: Subtle dot patterns for visual interest

### Content Structure

**6 Comprehensive Slides**:

1. **Welcome Slide**
   - Title: "Welcome to CareLink - AI-Powered Learning Disability Screening"
   - Key Stat: "85% Retention Rate"
   - Features: Healthcare-HR Bridge, 3 Weeks to Support, Personalized Plans

2. **Multimodal Screening**
   - Title: "3-Way Screening Power"
   - Subtitle: "Questionnaire + Voice + Handwriting Analysis"
   - Key Stat: "94% Accuracy Rate"
   - Features: Smart Questionnaire, Voice Analysis, Writing Assessment

3. **AI Agent Assistant**
   - Title: "AI Agent Assistant - Your Personal Screening Guide"
   - Key Stat: "24/7 Available"
   - Features: Instant Answers, Process Guidance, Privacy Focus

4. **Personalized Support**
   - Title: "Personalized Support Plans - Cognitive + Workplace Fit"
   - Key Stat: "3 Weeks Faster"
   - Features: Clinical Validation, Workplace Accommodations, Progress Tracking

5. **Seamless Integration**
   - Title: "Seamless Integration - HR Collaboration Made Easy"
   - Key Stat: "Zero Disruption"
   - Features: HR System Integration, Performance Analytics, Team Collaboration

6. **Enterprise Security**
   - Title: "Enterprise Security - Healthcare-Grade Protection"
   - Key Stat: "HIPAA Compliant"
   - Features: End-to-End Encryption, Consent Management, Audit Trails

### AI Chatbot Widget

**Positioning**: Fixed bottom-right corner
**Visual Design**:
- Purple/blue gradient theme
- Animated notification dot
- Hover tooltip: "💬 Ask our AI assistant!"
- Smooth open/close animations

**Capabilities Showcase**:
- Pre-loaded helpful messages
- Specific help areas listed (questionnaire, voice, writing, privacy, results)
- Pro tip highlighting 94% accuracy
- "Powered by advanced AI • Responses in seconds" branding
- Guest mode clearly displays a "3 chats remaining" style counter before sign-in is required
- Guest session resumes previous remaining-turn state when returning within session TTL

**Interactive Elements**:
- Rounded chat bubbles with proper spacing
- Gradient input area with purple focus states
- "Ask AI" button with hover effects
- Turn-limit behavior that locks chat input after the third guest iteration and redirects to authentication
- Authentication page displays a contextual redirect banner with a 5-second countdown

## 🔧 Technical Implementation

### Component Structure

```typescript
// File: src/pages/GuestProfilePage.tsx
export default function GuestProfilePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [showChatbot, setShowChatbot] = useState(false)
   const [guestChatTurnsUsed, setGuestChatTurnsUsed] = useState(0)
   const [chatMessages, setChatMessages] = useState([])

  // Auto-play functionality with useEffect
   // Guest chat turn cap (max 3)
   // Auth redirect when turn limit is reached
   // Guest session persistence and resume
  // Navigation handlers
  // Carousel rendering with transform animations
  // Chatbot widget with conditional rendering
}
```

### Key Technical Features

**Auto-Play Logic**:
```typescript
useEffect(() => {
  if (!isAutoPlaying) return
  const interval = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
  }, 4000)
  return () => clearInterval(interval)
}, [isAutoPlaying])
```

**Responsive Design**:
- Mobile-first approach with `sm:`, `md:` breakpoints
- Grid layouts: `md:grid-cols-2`
- Flexible typography scaling

**Performance Optimizations**:
- CSS transforms for smooth 60fps animations
- Efficient re-renders with proper state management
- Lazy loading ready for future image assets

### Routing Integration

```typescript
// App.tsx routing
<Route path="/guest" element={<GuestProfilePage />} />
<Route path="/auth" element={<AuthPage />} />
```

**Navigation Flow**:
```
SplashPage (/welcome) → "Browse as guest" → GuestProfilePage (/guest) → Basic Questionnaire + up to 3 AI chat iterations → Authentication Gate → Full ScreeningPage (/screening)
```

## 📱 Mobile Compatibility

### Responsive Breakpoints
- **Mobile (< 640px)**: Single column layout, stacked content
- **Tablet (640px - 1024px)**: Two-column grid begins
- **Desktop (> 1024px)**: Full two-column layout with enhanced spacing

### Touch Interactions
- **Swipe Support**: Carousel designed for touch navigation
- **Touch Targets**: Minimum 44px touch targets for accessibility
- **Gesture Feedback**: Hover states and scale animations

### Performance Considerations
- **Bundle Size**: Uses existing Tailwind classes, no additional dependencies
- **Animation Performance**: Hardware-accelerated CSS transforms
- **Memory Management**: Proper cleanup of intervals and event listeners

## 🎯 User Experience Flow

### Entry Point
- User clicks "Browse as guest" on landing page
- Immediate visual engagement with large hero content
- Auto-playing carousel begins demonstrating value

### Engagement Loop
1. **Attention**: Large icons and bold typography grab focus
2. **Interest**: Statistics and feature lists build credibility
3. **Desire**: Clear value propositions create interest
4. **Action**: Prominent CTA buttons drive conversion

### Support System
- **Immediate Help**: Chatbot available throughout experience
- **Contextual Guidance**: Pre-loaded messages address common questions
- **Trust Building**: Professional design and security messaging
- **Guest Limit Handling**: After 3 chat iterations, users are redirected to sign-in to continue AI guidance
- **Redirect Transparency**: Authentication page shows why user was redirected and auto-hides the notice after 5 seconds

### Exit Points
- **Primary CTA**: "Start Your Assessment" → Authentication first, then full screening continuation
- **Secondary CTA**: "Register for Full Access" → Authentication
- **Navigation**: "Back to Home" link for easy exit

### Guest Status Visibility
- Header badge displays: **"You are browsing as a guest"** to clearly indicate limited-access mode

## 🔒 Security & Privacy Considerations

### Data Handling
- **Anonymous Access**: No personal data collection on this page
- **No Tracking**: No analytics or tracking implemented
- **Secure Context**: HTTPS required for production deployment
- **Temporary Guest Session**: Guest chat/intent state is stored in localStorage for resume support
- **TTL Enforcement**: Guest session expires after 24 hours and is auto-cleared when stale
- **Preliminary Output Only**: Guest interactions provide guidance, not final clinical workflow outputs

### Content Security
- **Static Content**: All content is client-side rendered
- **No External APIs**: Currently no backend integration
- **Safe Navigation**: All links are internal routes

## 📊 Analytics & Metrics (Future)

### User Engagement Metrics
- **Carousel Completion**: Percentage of users viewing all slides
- **Chatbot Interaction**: Open rate, message engagement
- **Conversion Rate**: Click-through to screening page
- **Time on Page**: Average engagement duration

### A/B Testing Opportunities
- **Carousel Timing**: Test different auto-play intervals
- **Content Variations**: Test different value propositions
- **CTA Placement**: Test button positioning and copy

## 🚀 Future Enhancements

### Phase 1 (Short Term)
- **Chatbot Integration**: Connect to actual AI backend
- **Analytics**: Add user interaction tracking
- **A/B Testing**: Implement content variations
- **Accessibility**: Enhanced screen reader support

### Phase 2 (Medium Term)
- **Personalization**: Dynamic content based on user context
- **Multimedia**: Video testimonials, interactive demos
- **Progressive Loading**: Lazy load carousel slides
- **Offline Support**: PWA capabilities for offline viewing

### Phase 3 (Long Term)
- **AI Personalization**: Content adapts based on user responses
- **Multilingual Support**: Localized content for different regions
- **Advanced Interactions**: Voice-guided carousel navigation
- **Integration**: Connect with user profiles and history

## 🧪 Testing & Quality Assurance

### Manual Testing Checklist
- [ ] Carousel auto-play functionality
- [ ] Manual navigation controls
- [ ] Chatbot open/close behavior
- [ ] Guest chat counter decrements and locks after 3 turns
- [ ] Guest turn-limit auto-redirects to authentication
- [ ] Authentication redirect banner appears with 5-second countdown
- [ ] Post-login resume redirects to `/screening`
- [ ] Guest session key is cleared after successful authentication
- [ ] Guest session expires after 24 hours (TTL)
- [ ] Responsive design across devices
- [ ] Touch interactions on mobile
- [ ] Keyboard accessibility
- [ ] Link navigation and routing

### Performance Testing
- [ ] Lighthouse scores (Performance, Accessibility, SEO)
- [ ] Bundle size analysis
- [ ] Animation frame rates
- [ ] Memory usage monitoring

### Cross-Browser Testing
- [ ] Chrome, Firefox, Safari, Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)
- [ ] Different screen sizes and orientations

## 📝 Development Notes

### Code Quality
- **TypeScript**: Fully typed with proper interfaces
- **ESLint**: Passes all linting rules
- **Accessibility**: ARIA labels and semantic HTML
- **Performance**: Optimized re-renders and animations

### Dependencies
- **React**: useState, useEffect hooks
- **React Router**: Link components for navigation
- **Tailwind CSS**: Utility-first styling
- **No External Libraries**: Pure React implementation

### File Structure
```
src/pages/
├── GuestProfilePage.tsx    # Main component
├── AuthPage.tsx            # Redirect reason banner + countdown
├── App.tsx                 # Route definition
└── SplashPage.tsx          # Entry point link

src/services/
└── guestSessionStore.ts    # Temporary guest session persistence with 24h TTL
```

## 🎉 Success Metrics

### User Engagement
- **85%+** of users complete at least 3 carousel slides
- **60%+** chatbot open rate
- **40%+** conversion rate to screening page

### Technical Performance
- **95+** Lighthouse performance score
- **< 3s** initial page load time
- **60fps** smooth animations

### Business Impact
- **Increased Screening Starts**: 50%+ uplift from anonymous users
- **Improved User Trust**: Higher completion rates in screening flow
- **Better User Experience**: Reduced bounce rate from landing page

---

**Last Updated**: April 11, 2026
**Version**: 1.2.0
**Status**: ✅ Production Ready
**Next Steps**: Backend chatbot integration, screening resume banner polish, automated tests for guest-flow guardrails, analytics implementation