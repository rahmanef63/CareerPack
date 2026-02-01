import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { AIConfigProvider } from '@/store/AIConfigContext';
import { LoginPage } from '@/sections/LoginPage';
import { AdminDashboard } from '@/sections/AdminDashboard';
import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/sections/HeroSection';
import { CVGenerator } from '@/sections/CVGenerator';
import { SkillRoadmap } from '@/sections/SkillRoadmap';
import { DocumentChecklist } from '@/sections/DocumentChecklist';
import { CareerDashboard } from '@/sections/CareerDashboard';
import { MockInterview } from '@/sections/MockInterview';
import { FinancialCalculator } from '@/sections/FinancialCalculator';
import { AIChat } from '@/sections/AIChat';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { state } = useAuth();
  
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-career-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && state.user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Main App Content
function AppContent() {
  const { state, logout } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // If not authenticated, only show login
  if (!state.isAuthenticated && !state.isLoading) {
    return <LoginPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HeroSection onGetStarted={() => setCurrentView('cv')} />;
      case 'cv':
        return <CVGenerator />;
      case 'roadmap':
        return <SkillRoadmap />;
      case 'checklist':
        return <DocumentChecklist />;
      case 'dashboard':
        return <CareerDashboard />;
      case 'interview':
        return <MockInterview />;
      case 'calculator':
        return <FinancialCalculator />;
      default:
        return <HeroSection onGetStarted={() => setCurrentView('cv')} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={state.user}
        onLogout={logout}
      />
      
      <main>
        {renderView()}
      </main>

      {/* AI Chat Button */}
      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 z-40 bg-career-600 hover:bg-career-700 shadow-lg rounded-full px-6"
        >
          <Bot className="w-5 h-5 mr-2" />
          AI Assistant
        </Button>
      )}

      {/* AI Chat Panel */}
      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-career-500 to-career-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-slate-900">CareerPack</span>
              </div>
              <p className="text-sm text-slate-600">
                Starter pack lengkap untuk kesuksesan karir Anda. Dari pembuatan CV hingga mendapatkan pekerjaan impian.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Fitur</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><button onClick={() => setCurrentView('cv')} className="hover:text-career-600">Pembuat CV</button></li>
                <li><button onClick={() => setCurrentView('roadmap')} className="hover:text-career-600">Roadmap Skill</button></li>
                <li><button onClick={() => setCurrentView('checklist')} className="hover:text-career-600">Ceklis Dokumen</button></li>
                <li><button onClick={() => setCurrentView('interview')} className="hover:text-career-600">Simulasi Wawancara</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><button onClick={() => setCurrentView('dashboard')} className="hover:text-career-600">Dashboard</button></li>
                <li><button onClick={() => setCurrentView('calculator')} className="hover:text-career-600">Kalkulator Keuangan</button></li>
                <li><button onClick={() => setIsChatOpen(true)} className="hover:text-career-600">AI Assistant</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Admin</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                {state.user?.role === 'admin' && (
                  <li><a href="/admin" className="hover:text-career-600">Admin Dashboard</a></li>
                )}
                <li><a href="#" className="hover:text-career-600">Pusat Bantuan</a></li>
                <li><a href="#" className="hover:text-career-600">Kebijakan Privasi</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200 mt-8 pt-8 text-center">
            <p className="text-sm text-slate-500">
              © 2024 CareerPack. Dibuat dengan ❤️ untuk pencari kerja Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Router Setup
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AIConfigProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toaster />
        </AIConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
