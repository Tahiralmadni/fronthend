import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Suspense, lazy, useEffect } from 'react';
import NavigationProgress from './components/ui/NavigationProgress';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/ui/PageTransition';
import { Toast } from './components/ui/Toast';
import MobileNavbarWrapper from './components/MobileNavbarWrapper';
import attendanceService from './services/attendanceService';

// Lazy loaded pages
const Login = lazy(() => import('./pages/Login'));
const AdminSetup = lazy(() => import('./pages/AdminSetup'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const TeacherManagement = lazy(() => import('./pages/admin/TeacherManagement'));
const AttendanceRecords = lazy(() => import('./pages/admin/AttendanceRecords'));
const TeacherProfile = lazy(() => import('./pages/admin/TeacherProfile'));
const TeacherAttendance = lazy(() => import('./pages/teacher/TeacherAttendance'));

// Loading component
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRoles }) => {
  const { currentUser, userRole } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && !requiredRoles.includes(userRole)) {
    // Redirect to user's dashboard if they don't have the required role
    return <Navigate to={userRole === 'admin' ? '/admin' : '/teacher'} replace />;
  }

  return children;
};

// AnimatedRoutes component to handle route animations
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
        <Route path="/login" element={
          <PageTransition>
            <Login />
          </PageTransition>
        } />
        <Route path="/admin-setup" element={
          <PageTransition>
            <AdminSetup />
          </PageTransition>
        } />

          {/* Protected Teacher Routes */}
          <Route path="/teacher" element={
            <ProtectedRoute requiredRoles={['teacher']}>
            <PageTransition>
              <TeacherDashboard />
            </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/teacher/attendance" element={
            <ProtectedRoute requiredRoles={['teacher']}>
            <PageTransition>
              <TeacherAttendance />
            </PageTransition>
            </ProtectedRoute>
          } />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRoles={['admin']}>
            <PageTransition>
              <AdminDashboard />
            </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/teachers" element={
            <ProtectedRoute requiredRoles={['admin']}>
            <PageTransition>
              <TeacherManagement />
            </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/teacher/:id" element={
            <ProtectedRoute requiredRoles={['admin']}>
            <PageTransition>
              <TeacherProfile />
            </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance" element={
            <ProtectedRoute requiredRoles={['admin']}>
            <PageTransition>
              <AttendanceRecords />
            </PageTransition>
            </ProtectedRoute>
          } />

          {/* Redirect to login if not authenticated */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    </AnimatePresence>
  );
};

function App() {
  // Process holidays for the current month on application startup
  useEffect(() => {
    const processHolidays = async () => {
      const { currentUser } = useAuth();
      
      // Only process if logged in as admin
      if (currentUser?.role === 'admin') {
        try {
          // Process holidays for the next 30 days
          const today = new Date();
          const thirtyDaysLater = new Date();
          thirtyDaysLater.setDate(today.getDate() + 30);
          
          const todayStr = today.toISOString().split('T')[0];
          const endDateStr = thirtyDaysLater.toISOString().split('T')[0];
          
          console.log('Starting holiday processing:', todayStr, 'to', endDateStr);
          
          // Process for all teachers
          // In a real app, you would fetch the teacher list from API
          const teacherIds = ['all-teachers']; // Special ID for all teachers
          
          for (const teacherId of teacherIds) {
            await attendanceService.processHolidaysForPeriod(
              teacherId,
              todayStr,
              endDateStr
            );
          }
          
          console.log('Holiday processing completed');
        } catch (error) {
          console.error('Error processing holidays:', error);
        }
      }
    };
    
    processHolidays();
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <NavigationProgress />
        <Toast />
        <Suspense fallback={<PageLoader />}>
          <AnimatedRoutes />
          <MobileNavbarWrapper />
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;