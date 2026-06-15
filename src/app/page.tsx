'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import WelcomePage from '@/components/pages/WelcomePage'
import OnboardingPage from '@/components/pages/OnboardingPage'
import ParentAuthPage from '@/components/pages/ParentAuthPage'
import SelectChildPage from '@/components/pages/SelectChildPage'
import SelectModePage from '@/components/pages/SelectModePage'
import ChildHomePage from '@/components/pages/ChildHomePage'
import CreateBookPage from '@/components/pages/CreateBookPage'
import BookReaderPage from '@/components/pages/BookReaderPage'
import MyBooksPage from '@/components/pages/MyBooksPage'
import ParentDashboardPage from '@/components/pages/ParentDashboardPage'
import SettingsPage from '@/components/pages/SettingsPage'
import LegalPage from '@/components/pages/LegalPage'
import AdminPanel from '@/components/pages/AdminPanel'

const pageComponents: Record<string, React.ComponentType> = {
  welcome: WelcomePage,
  onboarding: OnboardingPage,
  'parent-auth': ParentAuthPage,
  'select-child': SelectChildPage,
  'select-mode': SelectModePage,
  'child-home': ChildHomePage,
  'create-book': CreateBookPage,
  'book-reader': BookReaderPage,
  'my-books': MyBooksPage,
  'parent-dashboard': ParentDashboardPage,
  settings: SettingsPage,
  legal: LegalPage,
  admin: AdminPanel,
}

export default function Home() {
  const currentPage = useAppStore((s) => s.currentPage)
  const PageComponent = pageComponents[currentPage] || WelcomePage

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="min-h-screen"
      >
        <PageComponent />
      </motion.div>
    </AnimatePresence>
  )
}
