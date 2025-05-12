import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home/Home';
import About from '../pages/About/About';
import ErrorPage from '../pages/Error/ErrorPage';

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
