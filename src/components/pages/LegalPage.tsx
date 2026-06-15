'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, FileText, Shield, Baby } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function LegalPage() {
  const { setPage, legalPageType, mode } = useAppStore()

  const handleBack = () => {
    if (mode === 'parent') {
      setPage('parent-dashboard')
    } else if (mode === 'child') {
      setPage('settings')
    } else {
      setPage('welcome')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">
            {legalPageType === 'terms' && 'Terms of Service'}
            {legalPageType === 'privacy' && 'Privacy Policy'}
            {legalPageType === 'coppa' && 'COPPA Compliance'}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          {legalPageType === 'terms' && <TermsContent />}
          {legalPageType === 'privacy' && <PrivacyContent />}
          {legalPageType === 'coppa' && <CoppaContent />}
        </div>
      </div>
    </div>
  )
}

function TermsContent() {
  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Terms of Service</h2>
          <p className="text-xs text-gray-400">Last updated: January 2024</p>
        </div>
      </div>

      <section className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            By accessing and using InkWings, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            If you do not agree with any of these terms, you are prohibited from using or accessing this application.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">2. Description of Service</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            InkWings is an AI-powered children&apos;s book creation application that allows parents and children to create personalized
            stories with beautiful illustrations. The service includes story generation, illustration creation, reading tracking,
            and parental controls.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">3. Account Requirements</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            You must be at least 18 years old to create an account. By creating an account, you represent that you are a parent
            or legal guardian of the children whose profiles you add to the service. You are responsible for maintaining the
            confidentiality of your account credentials.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">4. Parental Responsibility</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Parents and guardians are solely responsible for supervising their children&apos;s use of InkWings. While we implement
            safety measures and content filters, parents should regularly review generated content and utilize parental controls
            to ensure age-appropriate material.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">5. Content Guidelines</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            All generated content is intended to be family-friendly and age-appropriate. We use AI safety measures to filter
            inappropriate content. However, we recommend parental review of all generated stories. Users must not attempt to
            generate content that is harmful, offensive, or inappropriate for children.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">6. Subscription</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            InkWings offers a free trial period followed by a subscription service. Subscription fees are billed according to
            the selected plan. You may cancel your subscription at any time. Upon cancellation, you will retain access until
            the end of your current billing period.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">7. Intellectual Property</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Stories and illustrations generated through InkWings are owned by the account holder. You may use generated content
            for personal, non-commercial purposes. The InkWings name, logo, and software are the intellectual property of
            InkWings and are protected by applicable intellectual property laws.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">8. Limitation of Liability</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            InkWings is provided &quot;as is&quot; without warranties of any kind. We shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages resulting from your use of the service.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">9. Contact</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            For questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:support@inkwings.app" className="text-indigo-500 hover:text-indigo-600 underline">
              support@inkwings.app
            </a>
          </p>
        </div>
      </section>
    </motion.div>
  )
}

function PrivacyContent() {
  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Privacy Policy</h2>
          <p className="text-xs text-gray-400">Last updated: January 2024</p>
        </div>
      </div>

      <section className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Information We Collect</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">We collect the following types of information:</p>
          <ul className="space-y-2">
            {[
              { title: 'Parent Account Information', desc: 'Name, email address, and authentication method.' },
              { title: 'Child Profile Information', desc: 'First name, age range, and avatar selection. No last names or photos are collected.' },
              { title: 'Usage Data', desc: 'Reading statistics, books created, pages read, and vocabulary progress.' },
              { title: 'Device Information', desc: 'Device type and operating system for compatibility purposes.' },
            ].map((item) => (
              <li key={item.title} className="bg-purple-50/50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">How We Use Your Information</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            We use collected information to provide and improve our services, personalize the experience for each child,
            track reading progress and vocabulary development, and communicate important updates about the service.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Data Storage</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            All personal data is stored locally on your device. We do not maintain external databases with your personal
            information. Story generation requests are processed by our AI service and are not stored after delivery.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Third-Party Services</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            We use third-party services for story generation (AI language model) and illustration creation (AI image model).
            These services do not retain your data after processing. We may use analytics services to improve our product.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Parental Rights</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Parents have the right to review, modify, or delete any information associated with their account or their
            children&apos;s profiles. You can export all data or clear it entirely from the Settings page at any time.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Data Retention</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Data is retained on your device until you choose to delete it or uninstall the application. Upon account
            deletion, all associated data is permanently removed.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Contact</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            For privacy-related inquiries, please contact our Privacy Officer at{' '}
            <a href="mailto:privacy@inkwings.app" className="text-indigo-500 hover:text-indigo-600 underline">
              privacy@inkwings.app
            </a>
          </p>
        </div>
      </section>
    </motion.div>
  )
}

function CoppaContent() {
  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
          <Baby className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">COPPA Compliance</h2>
          <p className="text-xs text-gray-400">Children&apos;s Online Privacy Protection Act</p>
        </div>
      </div>

      <section className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 space-y-4">
        <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
          <p className="text-sm text-pink-800 leading-relaxed">
            InkWings is fully committed to complying with the Children&apos;s Online Privacy Protection Act (COPPA).
            We have built our service with children&apos;s privacy as a core principle.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Our COPPA Commitments</h3>
          <ul className="space-y-2">
            {[
              { icon: '🔒', title: 'Parental Consent', desc: 'We require verified parental consent before collecting any information from children under 13.' },
              { icon: '📦', title: 'Minimal Data Collection', desc: 'We only collect the minimum information necessary to provide our service.' },
              { icon: '🚫', title: 'No Third-Party Sharing', desc: 'We never sell, rent, or share children\'s personal information with third parties for marketing purposes.' },
              { icon: '🏠', title: 'Local Data Storage', desc: 'All data is stored locally on your device, not on external servers.' },
              { icon: '🗑️', title: 'Data Deletion Rights', desc: 'Parents can delete all data at any time from the Settings page.' },
              { icon: '🛡️', title: 'Secure Processing', desc: 'AI story generation requests are processed securely and not retained after delivery.' },
            ].map((item) => (
              <li key={item.title} className="flex items-start gap-3 bg-purple-50/50 rounded-xl p-3">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Parental Controls</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            InkWings provides comprehensive parental controls including content approval requirements, reading time limits,
            passcode-protected parent mode, and the ability to review and delete any generated content.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">FTC Safe Harbor</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            We follow FTC guidelines for COPPA compliance and maintain practices that meet or exceed the requirements
            set forth by the Children&apos;s Online Privacy Protection Rule.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Questions?</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            If you have questions about our COPPA compliance practices, please contact us at{' '}
            <a href="mailto:privacy@inkwings.app" className="text-indigo-500 hover:text-indigo-600 underline">
              privacy@inkwings.app
            </a>
          </p>
        </div>
      </section>
    </motion.div>
  )
}
