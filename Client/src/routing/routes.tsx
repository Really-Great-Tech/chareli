import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

const ErrorPage = lazy(() => import("../pages/ErrorPage"));
const Home = lazy(() => import("../pages/Home/Home"));
const About = lazy(() => import("../pages/About/About"));
const RegisterInvitationPage = lazy(() =>
  import("../pages/RegisterInvitation").then((module) => ({
    default: module.RegisterInvitationPage,
  }))
);
const MainLayout = lazy(() => import("../layout/MainLayout"));
const GamePlay = lazy(() => import("../pages/GamePlay/GamePlay"));
const Categories = lazy(() => import("../pages/Categories/Categories"));
const ResetPasswordPage = lazy(() =>
  import("../pages/ResetPassword/ResetPasswordPage").then((module) => ({
    default: module.ResetPasswordPage,
  }))
);
const AdminLayout = lazy(() => import("../layout/AdminLayout"));
const AdminHome = lazy(() => import("../pages/Admin/Home/Home"));
const GameManagement = lazy(
  () => import("../pages/Admin/Management/GameManagement")
);
const UserManagement = lazy(
  () => import("../pages/Admin/UserManagement/UserManagement")
);
const Analytics = lazy(() => import("../pages/Admin/Analytics/Analytics"));
const Configuration = lazy(
  () => import("../pages/Admin/Configuration/Configuration")
);
const ViewGame = lazy(() => import("../pages/Admin/ViewGame"));
const GameCategories = lazy(
  () => import("../pages/Admin/Category/GameCategories")
);
const CategoryDetail = lazy(
  () => import("../pages/Admin/Category/CategoryDetail")
);
const UserManagementView = lazy(() => import("../pages/Admin/UserMgtView"));
const TeamManagement = lazy(() => import("../pages/Admin/Team/TeamManagement"));
const Settings = lazy(() => import("../pages/Admin/Settings"));
const ViewProfile = lazy(() => import("../pages/Admin/ViewProfile"));
const Terms = lazy(() => import("../pages/TermsOfService/Terms"));
const Privacy = lazy(() => import("../pages/PrivacyPolicy/Privacy"));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#0F1221] text-white">
    <span className="text-lg font-dmmono">Loading...</span>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/">
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="categories" element={<Categories />} />
            <Route path="gameplay/:gameId" element={<GamePlay />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="*" element={<ErrorPage />} />
          </Route>
        </Route>

        <Route path="reset-password">
          <Route path=":token" element={<ResetPasswordPage />} />
          <Route path="phone/:userId" element={<ResetPasswordPage />} />
        </Route>
        <Route
          path="register-invitation/:token"
          element={<RegisterInvitationPage />}
        />

        <Route path="admin/" element={<ProtectedRoute requireAdmin={true} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            {/* <Route path="about" element={<AdminAbout />} />*/}
            <Route path="game-management" element={<GameManagement />} />
            <Route path="categories" element={<GameCategories />} />
            <Route path="categories/:categoryId" element={<CategoryDetail />} />
            <Route path="management" element={<UserManagement />} />
            <Route path="management/:userId" element={<UserManagementView />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="view-game/:gameId" element={<ViewGame />} />
            <Route path="view-profile" element={<ViewProfile />} />
          </Route>
        </Route>

        {/* Config routes - require config access (excludes viewers) */}
        <Route
          path="admin/"
          element={<ProtectedRoute requireAdmin={true} requireConfig={true} />}
        >
          <Route element={<AdminLayout />}>
            <Route path="config" element={<Configuration />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
