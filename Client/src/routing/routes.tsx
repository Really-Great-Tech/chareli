import { Routes, Route } from 'react-router-dom';
import ErrorPage from '../pages/ErrorPage';
import Home from '../pages/Home/Home';
import About from '../pages/About/About';
import MainLayout from '../layout/MainLayout';
import GamePlay from '../pages/GamePlay/GamePlay';
import Categories from '../pages/Categories/Categories';

// admin routes
import AdminLayout from '../layout/AdminLayout';

import AdminHome from '../pages/Admin/Home/Home';
// import AdminAbout from '../pages/Admin/About/About';
import GameManagement from '../pages/Admin/Management/GameManagement';
import UserManagement from '../pages/Admin/UserManagement/UserManagement';
import Analytics from '../pages/Admin/Analytics/Analytics';
import Configuration from '../pages/Admin/Configuration/Configuration';
import ViewGame from '../pages/Admin/ViewGame';
import GameCategories from '../pages/Admin/Category/GameCategories';

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

        {/* admin */}
      <Route path='admin/'>
        <Route element={<AdminLayout />}>

          <Route index element={<AdminHome />} />
          {/* <Route path="about" element={<AdminAbout />} />*/}
          <Route path="game-management" element={<GameManagement />} />
          <Route path="categories" element={<GameCategories />} />
          <Route path="management" element={<UserManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="config" element={<Configuration />} />

          <Route path="view-game" element={<ViewGame />} />


          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Route>

      </Route>

    </Routes>
  );
};

export default AppRoutes;
