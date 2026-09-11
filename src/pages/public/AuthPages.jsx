import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../../components/Brand'
import { Button, Field } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { STORAGE_KEYS, writeStorage } from '../../services/storage'

function AuthLayout({ eyebrow, title, description, children, footer }) {
  return <main className="auth-layout"><section className="auth-aside"><Brand /><div><p className="eyebrow">A private study workspace</p><blockquote>“The law is easier to learn when every concept has a place, every source is visible, and every session can continue where it stopped.”</blockquote></div><p>Frontend-only accounts are stored on this device. Connect a secure identity service before production use.</p></section><section className="auth-panel"><div className="auth-card"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="auth-card__description">{description}</p>{children}{footer}</div></section></main>
}

function PasswordInput({ id, value, onChange, autoComplete = 'current-password', ...props }) {
  const [visible, setVisible] = useState(false)
  return <div className="password-input"><input id={id} type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} {...props} /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
}

function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (user) return <Navigate to="/dashboard" replace />

  async function submit(event) {
    event.preventDefault(); setError('')
    if (!form.email || !form.password) return setError('Enter both your email address and password.')
    setLoading(true)
    try { await signIn(form); navigate(location.state?.from || '/dashboard', { replace: true }) } catch (reason) { setError(reason.message) } finally { setLoading(false) }
  }
  return <AuthLayout eyebrow="Welcome back" title="Continue your legal study" description="Sign in to return to your reading, research, and progress." footer={<p className="auth-footer">New to Lexora? <Link to="/register">Create an account</Link></p>}><form onSubmit={submit} className="auth-form" noValidate><Field label="Email address" id="login-email"><input id="login-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@university.edu" /></Field><Field label="Password" id="login-password"><PasswordInput id="login-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field><div className="form-split"><label className="checkbox-label"><input type="checkbox" checked={form.remember} onChange={(event) => setForm({ ...form, remember: event.target.checked })} /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>{error && <div className="form-alert" role="alert">{error}</div>}<Button loading={loading} type="submit">Sign in</Button></form></AuthLayout>
}

function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', university: '', year: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const strength = useMemo(() => [form.password.length >= 8, /[A-Z]/.test(form.password), /\d/.test(form.password), /[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length, [form.password])
  if (user) return <Navigate to="/onboarding" replace />

  async function submit(event) {
    event.preventDefault(); setError('')
    if (!form.fullName.trim() || !form.email.trim()) return setError('Enter your full name and email address.')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address.')
    if (strength < 2) return setError('Use at least 8 characters with a number or uppercase letter.')
    if (form.password !== form.confirmPassword) return setError('The passwords do not match.')
    setLoading(true)
    try { await register(form); navigate('/onboarding', { replace: true }) } catch (reason) { setError(reason.message) } finally { setLoading(false) }
  }
  return <AuthLayout eyebrow="Create your workspace" title="Start with a clean slate" description="No courses, results, or saved items are added for you. Your workspace begins empty." footer={<p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>}><form onSubmit={submit} className="auth-form" noValidate><Field label="Full name" id="register-name"><input id="register-name" autoComplete="name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></Field><Field label="Email address" id="register-email"><input id="register-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><div className="field-row"><Field label="University (optional)" id="register-university"><input id="register-university" value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} /></Field><Field label="Year (optional)" id="register-year"><select id="register-year" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })}><option value="">Select</option>{['1st year','2nd year','3rd year','4th year','Graduate','Professional'].map((year) => <option key={year}>{year}</option>)}</select></Field></div><Field label="Password" id="register-password" hint="At least 8 characters; mix letters and numbers."><PasswordInput id="register-password" value={form.password} autoComplete="new-password" onChange={(event) => setForm({ ...form, password: event.target.value })} /><div className="strength-meter" aria-label={`Password strength ${strength} of 4`}>{[0,1,2,3].map((step) => <span key={step} className={step < strength ? 'is-active' : ''} />)}</div></Field><Field label="Confirm password" id="register-confirm"><PasswordInput id="register-confirm" value={form.confirmPassword} autoComplete="new-password" onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></Field>{error && <div className="form-alert" role="alert">{error}</div>}<Button loading={loading} type="submit">Create account</Button><p className="security-note"><LockKeyhole size={15} /> For this frontend build, credentials stay in local browser storage and are not production-secure.</p></form></AuthLayout>
}

function ForgotPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  async function submit(event) { event.preventDefault(); if (!email) return; setLoading(true); await new Promise((resolve) => setTimeout(resolve, 300)); setLoading(false); setSent(true) }
  return <AuthLayout eyebrow="Account recovery" title={sent ? 'Check your next step' : 'Reset your password'} description={sent ? 'If an account exists, a production identity service would send a reset link. This local-only build does not send email.' : 'Enter the email address associated with this browser account.'}>{sent ? <div className="success-panel"><Mail size={25} /><h2>Recovery request recorded</h2><p>Connect an email and identity backend to deliver secure reset links.</p><Link className="button button--secondary" to="/login"><ArrowLeft size={17} /> Return to sign in</Link></div> : <form onSubmit={submit} className="auth-form"><Field label="Email address" id="forgot-email"><input id="forgot-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></Field><Button loading={loading} type="submit">Continue</Button><Link className="back-link" to="/login"><ArrowLeft size={16} /> Back to sign in</Link></form>}</AuthLayout>
}

function ResetPage() {
  return <AuthLayout eyebrow="Secure reset" title="A verified link is required" description="Password changes are intentionally disabled without a signed reset token from a production identity service."><div className="success-panel"><ShieldCheck size={27} /><h2>No unsafe local reset</h2><p>This screen is ready for a backend token-verification flow.</p><Link className="button button--secondary" to="/login">Return to sign in</Link></div></AuthLayout>
}

function VerifyPage() {
  return <AuthLayout eyebrow="Email verification" title="Verification endpoint ready" description="A production mail provider can direct verified links to this route."><div className="success-panel"><Mail size={27} /><h2>Connect your identity provider</h2><p>This frontend does not claim to verify an email address by itself.</p><Link className="button button--primary" to="/dashboard">Continue to workspace</Link></div></AuthLayout>
}

const interests = ['Constitutional Law','Civil Law','Criminal Law','Administrative Law','International Law','Business Law','Tax Law','Labor Law','Human Rights']
const goals = ['University coursework','Exam preparation','Legal research','Professional development','General legal knowledge']

function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState([])
  const [goal, setGoal] = useState('')
  function toggle(value) { setSelected((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]) }
  function finish() { writeStorage(STORAGE_KEYS.profile, { ...user, interests: selected, goal, onboardedAt: new Date().toISOString() }); navigate('/dashboard', { replace: true }) }
  return <main className="onboarding"><div className="onboarding__top"><Brand /><span>Step {step} of 2</span></div><section><p className="eyebrow">Shape your workspace</p><h1>{step === 1 ? 'What are you studying?' : 'What is your main study goal?'}</h1><p>{step === 1 ? 'Choose any fields you want available for personalization. You can change them later.' : 'This will guide how the dashboard prioritizes your work.'}</p>{step === 1 ? <div className="choice-grid">{interests.map((interest) => <button className={selected.includes(interest) ? 'is-selected' : ''} onClick={() => toggle(interest)} key={interest}>{selected.includes(interest) && <Check size={16} />}{interest}</button>)}</div> : <div className="goal-list">{goals.map((item) => <label className={goal === item ? 'is-selected' : ''} key={item}><input type="radio" name="goal" checked={goal === item} onChange={() => setGoal(item)} /><span>{item}</span></label>)}</div>}<div className="onboarding__actions">{step === 2 && <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>}<Button disabled={step === 1 ? !selected.length : !goal} onClick={() => step === 1 ? setStep(2) : finish()}>{step === 1 ? 'Continue' : 'Open my workspace'}</Button></div></section></main>
}

export default function AuthPages({ page }) {
  if (page === 'register') return <RegisterPage />
  if (page === 'forgot') return <ForgotPage />
  if (page === 'reset') return <ResetPage />
  if (page === 'verify') return <VerifyPage />
  if (page === 'onboarding') return <OnboardingPage />
  return <LoginPage />
}
