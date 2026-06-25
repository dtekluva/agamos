import { lazy, Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Landing from './pages/Landing'
import ProtectedRoute from './components/ProtectedRoute'
import { RegistryProvider } from './lib/registry'
import DashboardLayout from './components/DashboardLayout'
import FloatingContact from './components/FloatingContact'

// Landing + the dashboard shell stay eager (Landing is the main ad entry; the
// shell avoids a flash between tabs). Everything else is code-split so a visitor
// landing on "/" doesn't download the whole app up front.
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Overview = lazy(() => import('./pages/dashboard/Overview'))
const RegistrySettings = lazy(() => import('./pages/dashboard/RegistrySettings'))
const GiftBuilder = lazy(() => import('./pages/dashboard/GiftBuilder'))
const Exhibition = lazy(() => import('./pages/dashboard/Exhibition'))
const Gallery = lazy(() => import('./pages/dashboard/Gallery'))
const GuestUploads = lazy(() => import('./pages/dashboard/GuestUploads'))
const Account = lazy(() => import('./pages/dashboard/Account'))
const Contributions = lazy(() => import('./pages/dashboard/Contributions'))
const Withdrawals = lazy(() => import('./pages/dashboard/Withdrawals'))
const Guests = lazy(() => import('./pages/dashboard/Guests'))
const Invite = lazy(() => import('./pages/Invite'))
const CheckIn = lazy(() => import('./pages/CheckIn'))
const PublicRegistry = lazy(() => import('./pages/PublicRegistry'))
const ThankYou = lazy(() => import('./pages/ThankYou'))
const Contact = lazy(() => import('./pages/Contact'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const StartEvent = lazy(() => import('./pages/StartEvent'))

function PageLoader() {
  return <div className="min-h-screen grid place-items-center text-muted">Loading…</div>
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="card p-10 text-center text-muted">
      <h1 className="text-2xl font-semibold text-ink mb-2">{title}</h1>
      <p>This section is coming together in the next build step.</p>
    </div>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center text-center px-6">
      <div>
        <p className="eyebrow mb-3">404</p>
        <h1 className="text-4xl mb-3">This page is still being dreamt up</h1>
        <p className="text-muted mb-6">The link you followed doesn’t exist yet.</p>
        <Link to="/" className="btn-primary">Back home</Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/r/:slug" element={<PublicRegistry />} />
      <Route path="/r/:slug/thank-you" element={<ThankYou />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/create" element={<StartEvent />} />
      <Route path="/i/:token" element={<Invite />} />
      <Route path="/checkin/:doorToken" element={<CheckIn />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RegistryProvider>
              <DashboardLayout />
            </RegistryProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="new" element={<RegistrySettings forceNew />} />
        <Route path="registry" element={<RegistrySettings />} />
        <Route path="gifts" element={<GiftBuilder />} />
        <Route path="exhibition" element={<Exhibition />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="guest-uploads" element={<GuestUploads />} />
        <Route path="guests" element={<Guests />} />
        <Route path="account" element={<Account />} />
        <Route path="contributions" element={<Contributions />} />
        <Route path="withdrawals" element={<Withdrawals />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
    <FloatingContact />
    </>
  )
}
