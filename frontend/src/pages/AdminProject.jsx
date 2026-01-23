import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const AdminProject = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [navigate]);

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-[#E6F2F1] font-['SF_Pro_Display']">
            <Sidebar />
            <div className="flex-1 p-8 ml-[240px]">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Projects (Admin)</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="font-bold text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.userType}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0)}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <p className="text-gray-600">Admin Project Management Content goes here.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminProject;
