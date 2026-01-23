import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DevmanDashboard from './pages/DevmanDashboard';
import AdminResources from './pages/AdminResources';
import DevmanResources from './pages/DevmanResources';
import AdminProject from './pages/AdminProject';
import DevmanProject from './pages/DevmanProject';
import AdminActivities from './pages/AdminActivities';
import DevmanActivities from './pages/DevmanActivities';

// Role Checker Helper
const useUserRole = () => {
  const userStr = localStorage.getItem('user');
  let isDevman = false;

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      isDevman = user.userType && (
        user.userType.toUpperCase().includes('DEV') ||
        user.userType.toUpperCase().includes('MANAGER') ||
        user.userType.toUpperCase() === 'PM'
      );
      console.log("App.jsx Debug: UserType:", user.userType, "IsDevman:", isDevman);
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
    }
  } else {
    console.log("App.jsx Debug: No user in localStorage");
  }

  return { isDevman };
};

// Wrappers
const DashboardWrapper = () => {
  const { isDevman } = useUserRole();
  return isDevman ? <DevmanDashboard /> : <AdminDashboard />;
};

const ProjectWrapper = () => {
  const { isDevman } = useUserRole();
  return isDevman ? <DevmanProject /> : <AdminProject />;
};

const ResourcesWrapper = () => {
  const { isDevman } = useUserRole();
  return isDevman ? <DevmanResources /> : <AdminResources />;
};

const ActivitiesWrapper = () => {
  const { isDevman } = useUserRole();
  return isDevman ? <DevmanActivities /> : <AdminActivities />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashboardWrapper />} />
        <Route path="/project" element={<ProjectWrapper />} />
        <Route path="/resources" element={<ResourcesWrapper />} />
        <Route path="/activities" element={<ActivitiesWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
