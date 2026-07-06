import { lazy } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import AppShell from './AppShell'
import { ROUTES } from '../routes/paths'

const OnboardingPage = lazy(() => import('../pages/OnboardingPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const SplitPage = lazy(() => import('../pages/SplitPage'))
const PredictPage = lazy(() => import('../pages/PredictPage'))
const FocusPage = lazy(() => import('../pages/FocusPage'))
const RetroPage = lazy(() => import('../pages/RetroPage'))
const DischargeEntryPage = lazy(() => import('../pages/DischargeEntryPage'))
const DischargeDashboardPage = lazy(() => import('../pages/DischargeDashboardPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export const routeObjects: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: ROUTES.onboarding, element: <OnboardingPage /> },
      { path: ROUTES.dashboard, element: <DashboardPage /> },
      { path: ROUTES.split, element: <SplitPage /> },
      { path: ROUTES.predict, element: <PredictPage /> },
      { path: ROUTES.focus, element: <FocusPage /> },
      { path: ROUTES.retro, element: <RetroPage /> },
      { path: ROUTES.dischargeEntry, element: <DischargeEntryPage /> },
      { path: ROUTES.dischargeDashboard, element: <DischargeDashboardPage /> },
      { path: ROUTES.settings, element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routeObjects)
