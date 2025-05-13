import { Routes, Route } from 'react-router-dom';
import ErrorPage from '../pages/ErrorPage';
import Home from '../pages/Home/Home';
import About from '../pages/About/About';

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
