import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import About from '../pages/About';
import ErrorPage from '../pages/ErrorPage';
import MainLayout from '../layout/MainLayout';

export const AppRoutes = () => {
  return (
    <Routes>

      <Route path="/">
        <Route element={<MainLayout />}>

          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>
      </Route>

    </Routes>
  );
};

export default AppRoutes;
