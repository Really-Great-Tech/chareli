import { Routes, Route } from 'react-router-dom';
import ErrorPage from '../pages/ErrorPage';
import Home from '../pages/Home/Home';
import About from '../pages/About/About';
import { RegisterInvitationPage } from '../pages/RegisterInvitation';
import MainLayout from '../layout/MainLayout';
import GamePlay from '../pages/GamePlay/GamePlay';
import Categories from '../pages/Categories/Categories';
import { ResetPasswordPage } from '../pages/ResetPassword/ResetPasswordPage';
import { ProtectedRoute } from './ProtectedRoute';
import AdminLayout from '../layout/AdminLayout';
import AdminHome from '../pages/Admin/Home/Home';
import GameManagement from '../pages/Admin/Management/GameManagement';
import UserManagement from '../pages/Admin/UserManagement/UserManagement';
import Analytics from '../pages/Admin/Analytics/Analytics';
import Configuration from '../pages/Admin/Configuration/Configuration';
import ViewGame from '../pages/Admin/ViewGame';
import GameCategories from '../pages/Admin/Category/GameCategories';
import UserManagementView from '../pages/Admin/UserMgtView';
import TeamManagement from '../pages/Admin/Team/TeamManagement';
import Settings from '../pages/Admin/Settings';
import ViewProfile from '../pages/Admin/ViewProfile';


export const AppRoutes = () => {
  return (
    <Routes>

      <Route path="/">
        <Route element={<MainLayout />}>

          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="categories" element={<Categories />} />
          <Route path="gameplay" element={<GamePlay />} />


          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Route>

        <Route path="reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="register-invitation/:token" element={<RegisterInvitationPage />} />

        <Route path="admin/" element={<ProtectedRoute requireAdmin={true} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            {/* <Route path="about" element={<AdminAbout />} />*/}
            <Route path="game-management" element={<GameManagement />} />
            <Route path="categories" element={<GameCategories />} />
            <Route path="management" element={<UserManagement />} />
            <Route path="management/:userId" element={<UserManagementView />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="config" element={<Configuration />} />
            <Route path="view-game/:gameId" element={<ViewGame />} />

            {/* settings */}
            <Route path="settings" element={<Settings />} />
            <Route path="view-profile" element={<ViewProfile />} />
          </Route>
        </Route>

            <Route path="*" element={<ErrorPage />} />

    </Routes>
  );
};

export default AppRoutes;
