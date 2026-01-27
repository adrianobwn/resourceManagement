import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Folder, Users, ClipboardList, LogOut, User } from 'lucide-react';
import api from '../utils/api';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [unreadCount, setUnreadCount] = useState(0);

    const isDevMan = user.userType && (
        user.userType.toUpperCase().includes('DEV') ||
        user.userType.toUpperCase().includes('MANAGER') ||
        user.userType.toUpperCase() === 'PM'
    );

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
        // Only show DevMan menu for Admin (not for DevMan/PM)
        ...(!isDevMan ? [{
            name: 'DevMan',
            path: '/devman',
            icon: Users, // Or another icon like UserCog if available, reusing Users for now
        }] : []),
        {
            name: 'Resources',
            path: '/resources',
            icon: Users,
        },
        {
            name: 'Activities',
            path: '/activities',
            icon: ClipboardList,
            badge: unreadCount > 0 ? unreadCount : null
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    // Fetch activities and calculate unread count
    useEffect(() => {
        if (!isDevMan || !user.email) return;

        const storageKey = `readNotifications_${user.email}`;

        const checkNotifications = async () => {
            try {
                const response = await api.get('/requests/history');
                const completedRequests = response.data.filter(r =>
                    r.status === 'APPROVED' || r.status === 'REJECTED'
                );

                // If on activities page, mark all as read immediately
                if (location.pathname === '/activities') {
                    setUnreadCount(0);
                    const allIds = completedRequests.map(r => r.id);
                    localStorage.setItem(storageKey, JSON.stringify(allIds));
                    return;
                }

                const storedReadIds = localStorage.getItem(storageKey);

                // FIRST LOAD SCENARIO:
                // If no storage exists for this user, assume this is a fresh login/device.
                // We don't want to spam them with old notifications.
                // Mark ALL current items as read.
                if (storedReadIds === null) {
                    const allIds = completedRequests.map(r => r.id);
                    localStorage.setItem(storageKey, JSON.stringify(allIds));
                    setUnreadCount(0);
                    return;
                }

                // NORMAL SCENARIO:
                // Storage exists, compare against it.
                const readNotificationIds = JSON.parse(storedReadIds || '[]');
                const newUnreadCount = completedRequests.filter(r =>
                    !readNotificationIds.includes(r.id)
                ).length;

                setUnreadCount(newUnreadCount);

            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        checkNotifications();

        // Optional: Poll every 30 seconds to keep fresh
        const interval = setInterval(checkNotifications, 30000);
        return () => clearInterval(interval);

    }, [location.pathname, isDevMan, user.email]);

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
                                className={`w-full flex items-center justify-between px-5 py-4 mb-2 text-left transition-all rounded-lg text-lg font-sf ${isActive(item.path)
                                    ? 'bg-[#CAF0F8] text-black'
                                    : 'text-white hover:bg-[#CAF0F8]/20'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <IconComponent className="w-6 h-6" />
                                    <span className="font-bold">{item.name}</span>
                                </div>
                                {item.badge && (
                                    <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                                        {item.badge}
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
