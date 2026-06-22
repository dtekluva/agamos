import { Routes, Route, Link } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import { RegistryProvider } from './lib/registry'
import DashboardLayout from './components/DashboardLayout'
import Overview from './pages/dashboard/Overview'
import RegistrySettings from './pages/dashboard/RegistrySettings'
import GiftBuilder from './pages/dashboard/GiftBuilder'
import Exhibition from './pages/dashboard/Exhibition'
import Gallery from './pages/dashboard/Gallery'
import GuestUploads from './pages/dashboard/GuestUploads'
import Account from './pages/dashboard/Account'
import Contributions from './pages/dashboard/Contributions'
import Withdrawals from './pages/dashboard/Withdrawals'
import PublicRegistry from './pages/PublicRegistry'
import ThankYou from './pages/ThankYou'
import Contact from './pages/Contact'
import VerifyEmail from './pages/VerifyEmail'
import FloatingContact from './components/FloatingContact'

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
        <Route path="account" element={<Account />} />
        <Route path="contributions" element={<Contributions />} />
        <Route path="withdrawals" element={<Withdrawals />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    <FloatingContact />
    </>
  )
}
