import { Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useRegistry } from '../lib/registry'
import { getEvent } from '../lib/eventTypes'
import EventSwitcher from './EventSwitcher'
import DashboardChrome, { NavItem } from './DashboardChrome'
import VerifyEmailBanner from './VerifyEmailBanner'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { registry } = useRegistry()

  const storyLabel = registry ? getEvent(registry.event_type).storyToggleLabel : 'Story'
  const nav: NavItem[] = [
    { to: '/dashboard', label: 'Overview', end: true, icon: '🏠' },
    { to: '/dashboard/registry', label: 'Event page', icon: '💍' },
    { to: '/dashboard/gifts', label: 'Gifts', icon: '🎁' },
    { to: '/dashboard/exhibition', label: storyLabel, icon: '💌' },
    { to: '/dashboard/gallery', label: 'Gallery', icon: '📸' },
    { to: '/dashboard/guest-uploads', label: 'Guest uploads', icon: '🤳' },
    { to: '/dashboard/contributions', label: 'Contributions', icon: '💸' },
    { to: '/dashboard/withdrawals', label: 'Withdrawals', icon: '🏦' },
  ]

  return (
    <DashboardChrome
      nav={nav}
      switcher={<EventSwitcher />}
      userLabel={user?.full_name || user?.email}
      publicUrl={registry ? `/r/${registry.slug}` : undefined}
      onLogout={logout}
      banner={<VerifyEmailBanner />}
    >
      <Outlet />
    </DashboardChrome>
  )
}
