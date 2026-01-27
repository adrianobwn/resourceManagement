import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Folder, Users, ClipboardList, LogOut, User } from 'lucide-react';
import api from '../utils/api';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [pendingCount, setPendingCount] = useState(0);

    const isDevman = user.userType && (
        user.userType.toUpperCase().includes('DEV') ||
        user.userType.toUpperCase().includes('MANAGER')
    );

    useEffect(() => {
        // Only fetch for devman
        if (isDevman) {
            fetchPendingCount();
            // Auto-refresh every 30 seconds
            const interval = setInterval(fetchPendingCount, 30000);
            return () => clearInterval(interval);
        }
    }, [isDevman]);

    const fetchPendingCount = async () => {
        try {
            const response = await api.get('/requests/history');
            if (Array.isArray(response.data)) {
                const pendingActivities = response.data.filter(activity => 
                    activity.status === 'PENDING'
                ).length;
                setPendingCount(pendingActivities);
            }
        } catch (error) {
            console.error('Error fetching pending count:', error);
        }
    };

    const menuItems = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: LayoutGrid,
        },
        {
            name: 'Project',
            path: '/project',
            icon: Folder,
        },
        {
            name: 'Resources',
            path: '/resources',
            icon: Users,
        },
        {
            name: 'Activities',
            path: '/activities',
            icon: ClipboardList,
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="w-[267px] min-h-screen bg-[#025D66] flex flex-col justify-between fixed left-0 top-0 font-sf">
            {/* Logo */}
            <div>
                <div className="p-6 pt-8">
                    <img
                        src="/Logo.png"
                        alt="INTELEQ Logo"
                        className="h-12"
                    />
                </div>

                {/* Menu Items */}
                <nav className="mt-8 px-4">
                    {menuItems.map((item) => {
                        const IconComponent = item.icon;
                        const showBadge = isDevman && item.name === 'Activities' && pendingCount > 0;
                        return (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-4 px-5 py-4 mb-2 text-left transition-all rounded-lg text-lg font-sf relative ${isActive(item.path)
                                    ? 'bg-[#CAF0F8] text-black'
                                    : 'text-white hover:bg-[#CAF0F8]/20'
                                    }`}
                            >
                                <IconComponent className="w-6 h-6" />
                                <span className="font-bold">{item.name}</span>
                                {showBadge && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                                        {pendingCount > 99 ? '99+' : pendingCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* User Profile */}
            <div className="p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                            <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="font-sf">
                            <p className="font-bold text-white text-sm">{user.name || 'User'}</p>
                            <p className="text-[#CAF0F8] italic text-xs">{user.userType === 'DEV_MANAGER' ? 'Development Manager' : (user.userType?.replace('_', ' ') || 'Admin')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-white hover:text-[#CAF0F8] transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
