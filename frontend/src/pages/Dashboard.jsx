import React from 'react';
import { useAuth } from '../components/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name} ({user?.userType})</p>
      {user?.userType === 'ADMIN' && (
        <a href="/user-management">Go to User Management</a>
      )}
      <br />
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;