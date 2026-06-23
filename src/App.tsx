import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import AdminCovers from "./pages/AdminCovers.tsx";
import DriveRedirect from "./pages/DriveRedirect.tsx";
import PwaInstall from "./components/PwaInstall";
import { SupportWidget } from "./components/SupportWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PwaInstall />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/abrir-drive" element={<DriveRedirect />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/admin/covers" element={<AdminCovers />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <>
                    <Index />
                    <SupportWidget />
                  </>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
