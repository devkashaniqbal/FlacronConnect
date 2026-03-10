import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { User, Bell, Shield, CreditCard, Palette, Globe, Check, Building2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Input } from '@/components/ui'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useTheme } from '@/hooks/useTheme'
import { auth, db } from '@/lib/firebase'
import { COLLECTIONS } from '@/constants/firestore'
import { useBusinessStore } from '@/store/businessStore'
import { cn } from '@/utils/cn'

// ── Schemas ────────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName:  z.string().min(1, 'Last name required'),
  email:     z.string().email('Valid email required'),
  phone:     z.string().optional(),
  timezone:  z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword:     z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const notifSchema = z.object({
  emailBookings:     z.boolean(),
  emailPayments:     z.boolean(),
  emailReminders:    z.boolean(),
  smsBookings:       z.boolean(),
  smsReminders:      z.boolean(),
  pushNotifications: z.boolean(),
})

type ProfileForm  = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>
type NotifForm    = z.infer<typeof notifSchema>

// ── Sections ───────────────────────────────────────────────────────────────────

type Section = 'profile' | 'branding' | 'notifications' | 'security' | 'billing' | 'appearance' | 'localization'

const sections: { id: Section; icon: React.ElementType; label: string }[] = [
  { id: 'profile',       icon: User,       label: 'Profile' },
  { id: 'branding',      icon: Building2,  label: 'Branding' },
  { id: 'notifications', icon: Bell,       label: 'Notifications' },
  { id: 'security',      icon: Shield,     label: 'Security' },
  { id: 'billing',       icon: CreditCard, label: 'Billing' },
  { id: 'appearance',    icon: Palette,    label: 'Appearance' },
  { id: 'localization',  icon: Globe,      label: 'Localization' },
]

// ── Component ──────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const user                   = useAuthStore(s => s.user)
  const setUser                = useAuthStore(s => s.setUser)
  const { sidebarCollapsed, collapseSidebar } = useUIStore()
  const { theme }              = useTheme()
  const [active, setActive]    = useState<Section>('profile')

  // Business branding state — loaded from businessStore
  const business = useBusinessStore(s => s.business)
  const [brandName,    setBrandName]    = useState(business?.name        ?? '')
  const [brandColor,   setBrandColor]   = useState(business?.brandColor  ?? '#ea580c')
  const [brandLogo,    setBrandLogo]    = useState<string>(business?.logo ?? '')
  const [brandAddress, setBrandAddress] = useState(business?.address     ?? '')
  const [brandPhone,   setBrandPhone]   = useState(business?.phone       ?? '')
  const [brandEmail,   setBrandEmail]   = useState(business?.email       ?? '')
  const [brandWebsite, setBrandWebsite] = useState(business?.website     ?? '')
  const [savingBrand,  setSavingBrand]  = useState(false)

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500_000) { toast.error('Logo must be under 500 KB'); return }
    const reader = new FileReader()
    reader.onload = ev => setBrandLogo(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function saveBranding() {
    if (!user?.businessId) { toast.error('No business found'); return }
    setSavingBrand(true)
    try {
      await updateDoc(doc(db, COLLECTIONS.BUSINESSES, user.businessId), {
        name:       brandName.trim() || business?.name,
        brandColor: brandColor,
        logo:       brandLogo || null,
        address:    brandAddress,
        phone:      brandPhone,
        email:      brandEmail,
        website:    brandWebsite,
        updatedAt:  serverTimestamp(),
      })
      toast.success('Branding saved — invoices will now use your brand')
    } catch {
      toast.error('Failed to save branding')
    } finally {
      setSavingBrand(false)
    }
  }

  // Localization state — load from user doc or fall back to defaults
  const [language,   setLanguage]   = useState(user?.localization?.language   ?? 'English (US)')
  const [currency,   setCurrency]   = useState(user?.localization?.currency   ?? 'USD — US Dollar')
  const [dateFormat, setDateFormat] = useState(user?.localization?.dateFormat ?? 'MM/DD/YYYY')
  const [savingLocale, setSavingLocale] = useState(false)

  async function saveLocalization() {
    setSavingLocale(true)
    try {
      if (user?.uid) {
        await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
          localization: { language, currency, dateFormat },
          updatedAt: serverTimestamp(),
        })
      }
      toast.success('Localization saved')
    } catch {
      toast.error('Failed to save localization')
    } finally {
      setSavingLocale(false)
    }
  }

  // ── Profile form ──────────────────────────────────────────────────────────
  const { register: rp, handleSubmit: hp, formState: { errors: ep, isSubmitting: savingProfile } } =
    useForm<ProfileForm>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        firstName: user?.displayName?.split(' ')[0] ?? '',
        lastName:  user?.displayName?.split(' ').slice(1).join(' ') ?? '',
        email:     user?.email ?? '',
        phone:     '',
        timezone:  'UTC-5 (Eastern)',
      },
    })

  async function saveProfile(data: ProfileForm) {
    const displayName = `${data.firstName} ${data.lastName}`.trim()
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName })
      }
      if (user?.uid) {
        await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
          displayName,
          phone:     data.phone ?? '',
          timezone:  data.timezone ?? '',
          updatedAt: serverTimestamp(),
        })
      }
      setUser(prev => prev ? { ...prev, displayName } : prev)
      toast.success('Profile saved')
    } catch {
      toast.error('Failed to save profile')
    }
  }

  // ── Password form ────────────────────────────────────────────────────────
  const { register: rw, handleSubmit: hw, reset: resetPw, formState: { errors: ew, isSubmitting: savingPw } } =
    useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  async function changePassword(data: PasswordForm) {
    try {
      const fbUser = auth.currentUser
      if (!fbUser?.email) { toast.error('Not authenticated'); return }
      const cred = EmailAuthProvider.credential(fbUser.email, data.currentPassword)
      await reauthenticateWithCredential(fbUser, cred)
      await updatePassword(fbUser, data.newPassword)
      resetPw()
      toast.success('Password updated')
    } catch (err: any) {
      if (err?.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect')
      } else {
        toast.error('Failed to update password')
      }
    }
  }

  // ── Notification preferences ────────────────────────────────────────────
  const { register: rn, handleSubmit: hn, formState: { isSubmitting: savingNotif } } =
    useForm<NotifForm>({
      resolver: zodResolver(notifSchema),
      defaultValues: {
        emailBookings:     true,
        emailPayments:     true,
        emailReminders:    false,
        smsBookings:       false,
        smsReminders:      true,
        pushNotifications: true,
      },
    })

  async function saveNotifications(data: NotifForm) {
    try {
      if (user?.uid) {
        await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
          notificationPreferences: data,
          updatedAt: serverTimestamp(),
        })
      }
      toast.success('Notification preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    }
  }

  return (
    <DashboardShell title="Settings">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Settings</h2>
        <p className="text-ink-500 dark:text-ink-400 text-sm">Manage your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="space-y-1">
          {sections.map(s => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                  active === s.id
                    ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                    : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
                )}
              >
                <Icon size={16} />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Content panels */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {/* ── Profile ── */}
            {active === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Profile Information</h3>
                  <form onSubmit={hp(saveProfile)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="First name" {...rp('firstName')} error={ep.firstName?.message} />
                      <Input label="Last name"  {...rp('lastName')}  error={ep.lastName?.message} />
                      <Input label="Email" type="email" {...rp('email')} error={ep.email?.message} className="col-span-2" />
                      <Input label="Phone" placeholder="+1 (555) 000-0000" {...rp('phone')} />
                      <Input label="Timezone" {...rp('timezone')} />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" loading={savingProfile} icon={<Check size={14} />}>Save changes</Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}

            {/* ── Branding ── */}
            {active === 'branding' && (
              <motion.div key="branding" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <Card>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-1">Business Branding</h3>
                  <p className="text-xs text-ink-400 mb-5">This information appears on all invoices, receipts, and PDFs</p>

                  <div className="space-y-4">
                    {/* Logo upload */}
                    <div>
                      <label className="label">Business Logo</label>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-20 h-20 rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-700 flex items-center justify-center overflow-hidden bg-ink-50 dark:bg-ink-800 flex-shrink-0"
                          style={{ borderColor: brandLogo ? brandColor : undefined }}
                        >
                          {brandLogo
                            ? <img src={brandLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                            : <Building2 size={28} className="text-ink-300" />
                          }
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-2 rounded-xl border border-ink-200 dark:border-ink-700 text-sm text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
                            <Upload size={14} />
                            Upload logo (PNG/JPG, max 500 KB)
                            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                          </label>
                          {brandLogo && (
                            <button onClick={() => setBrandLogo('')} className="text-xs text-red-500 hover:underline">Remove logo</button>
                          )}
                          <p className="text-xs text-ink-400">Or paste a URL:</p>
                          <input
                            type="url"
                            value={brandLogo.startsWith('data:') ? '' : brandLogo}
                            onChange={e => setBrandLogo(e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="input-base w-full text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Brand color */}
                    <div>
                      <label className="label">Brand Colour</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={brandColor}
                          onChange={e => setBrandColor(e.target.value)}
                          className="w-12 h-10 rounded-xl border border-ink-200 dark:border-ink-700 cursor-pointer p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={brandColor}
                          onChange={e => setBrandColor(e.target.value)}
                          placeholder="#ea580c"
                          className="input-base w-32 font-mono text-sm"
                        />
                        <div
                          className="flex-1 h-10 rounded-xl flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                          style={{ backgroundColor: brandColor }}
                        >
                          Invoice Header Preview
                        </div>
                      </div>
                    </div>

                    {/* Business details */}
                    <Input label="Business name (on invoices)" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="My Business" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Phone" value={brandPhone} onChange={e => setBrandPhone(e.target.value)} placeholder="+1 555-000-0000" />
                      <Input label="Email" type="email" value={brandEmail} onChange={e => setBrandEmail(e.target.value)} placeholder="hello@mybusiness.com" />
                      <Input label="Address" value={brandAddress} onChange={e => setBrandAddress(e.target.value)} placeholder="123 Main St, City, State" />
                      <Input label="Website" value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} placeholder="https://mybusiness.com" />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <Button icon={<Check size={14} />} loading={savingBrand} onClick={saveBranding}>
                      Save Branding
                    </Button>
                  </div>
                </Card>

                {/* Live preview */}
                <Card>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-3 text-sm">Invoice Preview</h3>
                  <div className="rounded-xl overflow-hidden border border-ink-100 dark:border-ink-800 text-xs font-mono">
                    <div className="p-4 text-white flex items-center justify-between" style={{ backgroundColor: brandColor }}>
                      <div className="flex items-center gap-3">
                        {brandLogo && <img src={brandLogo} alt="logo" className="h-8 w-8 object-contain rounded bg-white/20 p-0.5" />}
                        <span className="font-bold text-base">INVOICE</span>
                      </div>
                      <div className="text-right text-white/80">
                        <p className="font-semibold text-white">{brandName || 'Business Name'}</p>
                        {brandPhone && <p>{brandPhone}</p>}
                        {brandEmail && <p>{brandEmail}</p>}
                      </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-ink-900 flex justify-between">
                      <div>
                        <p className="font-bold text-ink-900 dark:text-white">Invoice #ABC123</p>
                        <p className="text-ink-500">Date: {new Date().toLocaleDateString()}</p>
                        <p className="text-ink-500">Due: {new Date(Date.now() + 30*86400000).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: brandColor }}>BILL TO</p>
                        <p className="text-ink-700 dark:text-ink-300">John Smith</p>
                        <p className="text-ink-500">john@example.com</p>
                      </div>
                    </div>
                    <div className="px-4 pb-4 bg-white dark:bg-ink-900">
                      <div className="rounded-lg overflow-hidden border border-ink-100 dark:border-ink-800">
                        <div className="grid grid-cols-4 px-3 py-2 text-ink-500" style={{ backgroundColor: brandColor + '18' }}>
                          <span className="col-span-2 font-semibold">Description</span>
                          <span className="text-center font-semibold">Qty</span>
                          <span className="text-right font-semibold">Amount</span>
                        </div>
                        <div className="grid grid-cols-4 px-3 py-2 border-t border-ink-100 dark:border-ink-800">
                          <span className="col-span-2 text-ink-700 dark:text-ink-300">Hair Cut &amp; Style</span>
                          <span className="text-center text-ink-500">1</span>
                          <span className="text-right font-bold text-ink-900 dark:text-white">$85.00</span>
                        </div>
                        <div className="grid grid-cols-4 px-3 py-2 border-t text-white font-bold" style={{ backgroundColor: brandColor }}>
                          <span className="col-span-3">TOTAL</span>
                          <span className="text-right">$85.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── Notifications ── */}
            {active === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Notification Preferences</h3>
                  <form onSubmit={hn(saveNotifications)} className="space-y-1">
                    {[
                      { field: 'emailBookings',     label: 'New booking emails',        desc: 'Get an email for every new booking' },
                      { field: 'emailPayments',      label: 'Payment emails',            desc: 'Invoice paid, subscription changes' },
                      { field: 'emailReminders',     label: 'Reminder emails',           desc: 'Receive a copy of client reminders' },
                      { field: 'smsBookings',        label: 'Booking SMS alerts',        desc: 'Text when a new booking is created' },
                      { field: 'smsReminders',       label: 'Reminder SMS copy',         desc: 'Copy of client SMS reminders' },
                      { field: 'pushNotifications',  label: 'Push notifications',        desc: 'Browser push for real-time alerts' },
                    ].map(item => (
                      <label key={item.field} className="flex items-center justify-between py-3 border-b border-ink-100 dark:border-ink-800 last:border-0 cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-ink-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-ink-500">{item.desc}</p>
                        </div>
                        <input type="checkbox" {...rn(item.field as keyof NotifForm)} className="w-4 h-4 accent-brand-600" />
                      </label>
                    ))}
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" loading={savingNotif} icon={<Check size={14} />}>Save preferences</Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}

            {/* ── Security ── */}
            {active === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Change Password</h3>
                  <form onSubmit={hw(changePassword)} className="space-y-3">
                    <Input label="Current password"      type="password" placeholder="••••••••" {...rw('currentPassword')} error={ew.currentPassword?.message} />
                    <Input label="New password"          type="password" placeholder="••••••••" {...rw('newPassword')}     error={ew.newPassword?.message} />
                    <Input label="Confirm new password"  type="password" placeholder="••••••••" {...rw('confirmPassword')} error={ew.confirmPassword?.message} />
                    <div className="pt-2 flex justify-end">
                      <Button type="submit" loading={savingPw}>Update password</Button>
                    </div>
                  </form>
                </Card>

                <Card className="mt-4">
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-1">Account</h3>
                  <p className="text-xs text-ink-500 mb-4">Signed in as <span className="font-medium">{user?.email}</span></p>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-ink-900 dark:text-white">Role</p>
                      <p className="text-xs text-ink-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                    </div>
                    <p className="text-sm font-semibold text-brand-600 capitalize">{user?.plan} plan</p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── Billing ── */}
            {active === 'billing' && (
              <motion.div key="billing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-2">Subscription</h3>
                  <p className="text-sm text-ink-500 mb-4">
                    You are on the <span className="font-semibold text-brand-600 capitalize">{user?.plan}</span> plan.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => window.location.href = '/app/payments'}>Manage Billing</Button>
                    <Button variant="secondary" onClick={() => window.location.href = '/app/payments#plans-grid'}>Upgrade Plan</Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── Appearance ── */}
            {active === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Appearance</h3>
                  <div className="flex items-center justify-between py-3 border-b border-ink-100 dark:border-ink-800">
                    <div>
                      <p className="text-sm font-medium text-ink-900 dark:text-white">Dark mode</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">Currently: {theme}</p>
                    </div>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900 dark:text-white">Compact sidebar</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">Collapse sidebar by default</p>
                    </div>
                    <button
                      onClick={() => collapseSidebar(!sidebarCollapsed)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative',
                        sidebarCollapsed ? 'bg-brand-600' : 'bg-ink-200 dark:bg-ink-700'
                      )}
                    >
                      <div className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all',
                        sidebarCollapsed ? 'left-6' : 'left-1'
                      )} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── Localization ── */}
            {active === 'localization' && (
              <motion.div key="localization" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card>
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-4">Localization</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="label">Language</label>
                      <select
                        className="input-base w-full"
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                      >
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Currency</label>
                      <select
                        className="input-base w-full"
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                      >
                        <option>USD — US Dollar</option>
                        <option>EUR — Euro</option>
                        <option>GBP — British Pound</option>
                        <option>CAD — Canadian Dollar</option>
                        <option>AUD — Australian Dollar</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Date format</label>
                      <select
                        className="input-base w-full"
                        value={dateFormat}
                        onChange={e => setDateFormat(e.target.value)}
                      >
                        <option>MM/DD/YYYY</option>
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <Button icon={<Check size={14} />} loading={savingLocale} onClick={saveLocalization}>
                        Save
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardShell>
  )
}
