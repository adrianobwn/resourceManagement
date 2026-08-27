import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Folder, Users, ClipboardList, LogOut, User, Bell } from 'lucide-react';
import api from '../utils/api';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifCount, setNotifCount] = useState(0);

    // The page you are looking at counts as read, so its badge is hidden immediately
    // instead of waiting for the next poll to catch up with the server.
    const notifBadge = location.pathname === '/notifications' ? 0 : notifCount;
    const activitiesBadge = location.pathname === '/activities' ? 0 : unreadCount;

    const isDevMan = user.userType && (
        user.userType.toUpperCase().includes('DEV') ||
        user.userType.toUpperCase().includes('MANAGER')
    );

    // Define sections based on user role
    const getSections = () => {
        const sections = [
            {
                title: 'OVERVIEW',
                items: [
                    {
                        name: 'Dashboard',
                        path: '/dashboard',
                        icon: LayoutGrid,
                    }
                ]
            },
            {
                title: 'MENU UTAMA',
                items: isDevMan ? [
                    {
                        name: 'Resources',
                        path: '/resources',
                        icon: Users,
                    },
                    {
                        name: 'Project',
                        path: '/project',
                        icon: Folder,
                    }
                ] : [
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
                        name: 'Devman',
                        path: '/devman',
                        icon: Users,
                    }
                ]
            },
            {
                title: 'WORKFLOW & HISTORY',
                items: [
                    {
                        name: 'Activities',
                        path: '/activities',
                        icon: ClipboardList,
                        badge: activitiesBadge > 0 ? activitiesBadge : null
                    },
                    {
                        name: 'Notifications',
                        path: '/notifications',
                        icon: Bell,
                        badge: notifBadge > 0 ? notifBadge : null
                    }
                ]
            }
        ];
        return sections;
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    // Unread notification badge, for both Admin and DevMan.
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const { data } = await api.get('/notifications/unread-count');
                setNotifCount(data.count || 0);
                setUnreadCount(data.activities || 0);
            } catch (error) {
                console.error('Error fetching unread notifications:', error);
            }
        };

        fetchUnreadCount();
        // ponytail: polling every 30s, swap for websockets if it ever needs to be instant
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [location.pathname]);


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

                {/* Menu Sections */}
                <nav className="mt-4 px-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                    {getSections().map((section, idx) => (
                        <div key={section.title} className={idx !== 0 ? 'mt-6' : ''}>
                            <h3 className="px-5 mb-2 text-[12px] font-bold text-[#CAF0F8]/60 uppercase tracking-wider">
                                {section.title}
                            </h3>
                            {section.items.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => navigate(item.path)}
                                        className={`w-full flex items-center justify-between px-5 py-3 mb-1 text-left transition-all rounded-lg text-lg font-sf ${isActive(item.path)
                                            ? 'bg-[#CAF0F8] text-black'
                                            : 'text-white hover:bg-[#CAF0F8]/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <IconComponent className="w-5 h-5" />
                                            <span className="font-bold text-base">{item.name}</span>
                                        </div>
                                        {item.badge && (
                                            <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
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
