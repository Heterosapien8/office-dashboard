import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROLES } from '../../config/constants'
import { Leaf, Eye, EyeOff, AlertCircle } from 'lucide-react'

// Role redirect map — where each role lands after login
const ROLE_HOME = {
  [ROLES.SUPER_ADMIN]:      '/dashboard',
  [ROLES.REGIONAL_OFFICER]: '/dashboard',
  [ROLES.MONITORING_TEAM]:  '/dashboard',
  [ROLES.INDUSTRY_USER]:    '/dashboard',
}

export default function LoginPage() {
  const { login, error: authError } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [remember, setRemember] = useState(false)

  const from = location.state?.from?.pathname ?? '/dashboard'

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header strip */}
        <div className="bg-primary-700 px-8 py-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-eco-400 rounded-xl flex items-center justify-center shadow-lg">
              <Leaf size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-white font-bold text-lg leading-tight">
            Environment Department
          </h1>
          <p className="text-primary-200 text-sm mt-0.5">
            Chhattisgarh Government
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-7">
          <h2 className="text-center text-primary-700 font-semibold text-base mb-6">
            Secured Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error banner */}
            {(error || authError) && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error || authError}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                User Name (Email)
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="input-base"
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="input-base pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600
                           focus:ring-primary-500"
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Remember me
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-center mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : 'LOG IN'}
            </button>

            {/* Links */}
            <div className="text-center space-y-2 pt-1">
              <a href="#" className="block text-xs text-primary-600 hover:underline">
                Forgot Password
              </a>
              <p className="text-xs text-gray-500">
                Not a registered user?{' '}
                <a href="#" className="text-primary-600 hover:underline font-medium">
                  Sign in
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-primary-200 text-xs mt-4 opacity-75">
        Web Application Wireframe v3.0 — PrithviNet
      </p>
    </div>
  )
}
