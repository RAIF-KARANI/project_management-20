import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import ProjectsPage from "./pages/Projects";
import TasksPage from "./pages/Tasks";
import UsersPage from "./pages/Users";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "./hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppLayout>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/users" element={<UsersPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// Avoid calling createRoot multiple times during HMR/reloads
const container = document.getElementById("root");
if (container) {
  const anyWindow = window as any;
  try {
    if (!anyWindow.__APP_ROOT) {
      anyWindow.__APP_ROOT = createRoot(container);
    }
    anyWindow.__APP_ROOT.render(<App />);
  } catch (err) {
    // If React warns about multiple createRoot calls or render fails, unmount and recreate
    // This handles edge cases during HMR where module state might be inconsistent.
    // eslint-disable-next-line no-console
    console.warn("Root render failed, recreating root:", err);
    try {
      if (anyWindow.__APP_ROOT?.unmount) anyWindow.__APP_ROOT.unmount();
    } catch (e) {
      /* ignore */
    }
    anyWindow.__APP_ROOT = createRoot(container);
    anyWindow.__APP_ROOT.render(<App />);
  }
}
