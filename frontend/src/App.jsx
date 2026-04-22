import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import OtpLoginPage from './pages/OtpLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OAuthSuccessPage from './pages/OAuthSuccessPage';
import HomeFeedPage from './pages/HomeFeedPage';
import ProfilePage from './pages/ProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import ReelsPage from './pages/ReelsPage';
import FollowRequestsPage from './pages/FollowRequestsPage';
import CollabRequestsPage from './pages/CollabRequestsPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import ProtectedLayout from './components/ProtectedLayout';
import Layout from './components/Layout';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/login-otp" element={<OtpLoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/oauth-success" element={<OAuthSuccessPage />} />

            <Route element={<ProtectedLayout />}>
              <Route element={<Layout />}>
                <Route index element={<HomeFeedPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/:userId" element={<ProfilePage />} />
                <Route path="create-post" element={<CreatePostPage />} />
                <Route path="reels" element={<ReelsPage />} />
                <Route path="follow-requests" element={<FollowRequestsPage />} />
                <Route path="collab-requests" element={<CollabRequestsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
