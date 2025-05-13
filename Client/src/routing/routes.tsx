import { Routes, Route } from 'react-router-dom';
import ErrorPage from '../pages/ErrorPage';
import Home from '../pages/Home/Home';
import About from '../pages/About/About';
import MainLayout from '../layout/MainLayout';
import GamePlay from '../pages/GamePlay/GamePlay';

export const AppRoutes = () => {
  return (
    <Routes>

      <Route path="/">
        <Route element={<MainLayout />}>

          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="gameplay" element={<GamePlay />} />


          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Route>

    </Routes>
  );
};

export default AppRoutes;
