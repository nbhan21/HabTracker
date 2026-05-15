import { createBrowserRouter, Navigate } from "react-router";
import { Root } from "./components/Root";
import { Dashboard } from "./pages/Dashboard";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Login } from "./pages/Login";
import { AuthCallback } from "./pages/AuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Lazy load pages that aren't critical for initial load
const Analytics = lazy(() => import("./pages/Analytics").then(m => ({ default: m.Analytics })));
const Reading = lazy(() => import("./pages/Reading").then(m => ({ default: m.Reading })));
const Manage = lazy(() => import("./pages/Manage").then(m => ({ default: m.Manage })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-[#004ac6] dark:text-[#a5c0ff]" />
      <p className="text-[14px] text-[#737686] dark:text-[#8b949e]">Loading page...</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/auth/callback",
    Component: AuthCallback,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        Component: Root,
        children: [
          { index: true, Component: Dashboard },
          { 
            path: "analytics", 
            Component: () => (
              <Suspense fallback={<PageLoader />}>
                <Analytics />
              </Suspense>
            )
          },
          { 
            path: "reading", 
            Component: () => (
              <Suspense fallback={<PageLoader />}>
                <Reading />
              </Suspense>
            )
          },
          { 
            path: "manage", 
            Component: () => (
              <Suspense fallback={<PageLoader />}>
                <Manage />
              </Suspense>
            )
          },
          { 
            path: "settings", 
            Component: () => (
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            )
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);