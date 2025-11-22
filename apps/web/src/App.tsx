import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import FreePracticeSetupPage from './pages/FreePracticeSetupPage';
import FreePracticePage from './pages/FreePracticePage';
import WeaknessPracticeSetupPage from './pages/WeaknessPracticeSetupPage';
import WeaknessPracticePage from './pages/WeaknessPracticePage';
import AnalyticsPage from './pages/AnalyticsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/free"
            element={
              <ProtectedRoute>
                <FreePracticeSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/free/play"
            element={
              <ProtectedRoute>
                <FreePracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/weakness"
            element={
              <ProtectedRoute>
                <WeaknessPracticeSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/weakness/play"
            element={
              <ProtectedRoute>
                <WeaknessPracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
