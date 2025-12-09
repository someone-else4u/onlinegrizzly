import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import TestPreview from "./pages/TestPreview";
import ExamInterface from "./pages/ExamInterface";
import TestResults from "./pages/TestResults";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import CreateTest from "./pages/admin/CreateTest";
import TestsList from "./pages/admin/TestsList";
import TestEdit from "./pages/admin/TestEdit";
import Students from "./pages/admin/Students";
import Analytics from "./pages/admin/Analytics";
import Results from "./pages/admin/Results";
import AdminMessages from "./pages/admin/Messages";
import StudentTests from "./pages/student/Tests";
import StudentResults from "./pages/student/Results";
import StudentAnalytics from "./pages/student/Analytics";
import StudentMessages from "./pages/student/Messages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Student Routes */}
          <Route path="/student-dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/tests" element={<ProtectedRoute requiredRole="student"><StudentTests /></ProtectedRoute>} />
          <Route path="/student/results" element={<ProtectedRoute requiredRole="student"><StudentResults /></ProtectedRoute>} />
          <Route path="/student/analytics" element={<ProtectedRoute requiredRole="student"><StudentAnalytics /></ProtectedRoute>} />
          <Route path="/student/messages" element={<ProtectedRoute requiredRole="student"><StudentMessages /></ProtectedRoute>} />
          <Route path="/test/:testId/pre" element={<ProtectedRoute requiredRole="student"><TestPreview /></ProtectedRoute>} />
          <Route path="/test/:testId/exam" element={<ProtectedRoute requiredRole="student"><ExamInterface /></ProtectedRoute>} />
          <Route path="/test/:testId/results" element={<ProtectedRoute requiredRole="student"><TestResults /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/tests" element={<ProtectedRoute requiredRole="admin"><TestsList /></ProtectedRoute>} />
          <Route path="/admin/tests/new" element={<ProtectedRoute requiredRole="admin"><CreateTest /></ProtectedRoute>} />
          <Route path="/admin/tests/create" element={<ProtectedRoute requiredRole="admin"><CreateTest /></ProtectedRoute>} />
          <Route path="/admin/tests/:testId" element={<ProtectedRoute requiredRole="admin"><TestEdit /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute requiredRole="admin"><Students /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><Analytics /></ProtectedRoute>} />
          <Route path="/admin/results" element={<ProtectedRoute requiredRole="admin"><Results /></ProtectedRoute>} />
          <Route path="/admin/messages" element={<ProtectedRoute requiredRole="admin"><AdminMessages /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;