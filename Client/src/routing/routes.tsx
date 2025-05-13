import { Routes, Route } from 'react-router-dom';
import Home from '../pages/PopularSection';
import About from '../pages/About';
import ErrorPage from '../pages/ErrorPage';

export const AppRoutes = () => {
  return (
    <Routes>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
};

export default AppRoutes;
