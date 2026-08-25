import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context'
import { AppLayout } from './components/layout/AppLayout'
import { PublicRoute } from './components/guards/PublicRoute'
import { ProtectedRoute } from './components/guards/ProtectedRoute'
import { RoleProtectedRoute } from './components/guards/RoleProtectedRoute'

// Pages
import { LandingPage } from './pages/LandingPage'
import { SessionsPage } from './pages/SessionsPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { GitHubCallbackPage } from './pages/GitHubCallbackPage'
import { UserDashboardPage } from './pages/UserDashboardPage'
import { BookingsPage } from './pages/BookingsPage'
import { CreatorDashboardPage } from './pages/CreatorDashboardPage'
import { CreatorSessionsPage } from './pages/CreatorSessionsPage'
import { NewSessionPage } from './pages/NewSessionPage'
import { EditSessionPage } from './pages/EditSessionPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Public Entry Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/callback" element={<GitHubCallbackPage />} />
            <Route
              path="/auth/github/callback"
              element={<GitHubCallbackPage />}
            />

            {/* Public Only (Redirects to dashboard if already logged in) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Authenticated Routes (Accessible to all logged-in users) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/sessions/:id" element={<SessionDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Authenticated USER Only Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['USER']} />}>
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
            </Route>

            {/* Authenticated CREATOR Only Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['CREATOR']} />}>
              <Route path="/creator" element={<CreatorDashboardPage />} />
              <Route
                path="/creator/sessions"
                element={<CreatorSessionsPage />}
              />
              <Route path="/creator/sessions/new" element={<NewSessionPage />} />
              <Route
                path="/creator/sessions/:id/edit"
                element={<EditSessionPage />}
              />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
