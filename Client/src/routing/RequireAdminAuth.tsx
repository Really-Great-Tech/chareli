import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import LoginModal from '../components/modals/AdminModals/LoginModal';

// Dummy authentication check (replace with real logic)
const isAuthenticated = () => {
  // For example, check localStorage or context for a token
  return !!localStorage.getItem('admin_token');
};

export default function RequireAdminAuth() {
  const [loginOpen, setLoginOpen] = useState(!isAuthenticated());

  if (!isAuthenticated()) {
    return (
      <>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        {/* Optionally, block the UI or redirect */}
      </>
    );
  }

  return <Outlet />;
}