import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { Search, UserPlus, X, Eye } from 'lucide-react';

const AdminDevman = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [devManagers, setDevManagers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Create DevMan Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDevMan, setNewDevMan] = useState({
        fullName: '',
        email: '',
        password: ''
    });

    // Detail Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDevMan, setSelectedDevMan] = useState(null);

    // Notification State
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!token || !storedUser) {
            navigate('/');
            return;
        }

        setUser(JSON.parse(storedUser));
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [devManagersRes, projectsRes] = await Promise.all([
                api.get('/users/pms'),
                api.get('/projects')
            ]);

            setDevManagers(devManagersRes.data);
            setProjects(projectsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            showNotification('Failed to fetch data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDevMan = async () => {
        if (!newDevMan.fullName || !newDevMan.email || !newDevMan.password) {
            showNotification('Please fill all fields', 'error');
            return;
        }

        try {
            await api.post('/users/pm', {
                name: newDevMan.fullName,
                email: newDevMan.email,
                password: newDevMan.password
            });

            showNotification('DevMan created successfully', 'success');
            setShowCreateModal(false);
            setNewDevMan({ fullName: '', email: '', password: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating DevMan:', error);
            showNotification('Failed to create DevMan', 'error');
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
    };

    const getDevManStatus = (devManId) => {
        const activeProjects = projects.filter(p =>
            p.devManId === devManId && (p.status === 'ON_GOING' || p.status === 'HOLD')
        );
        return activeProjects.length > 0 ? 'UNAVAILABLE' : 'AVAILABLE';
    };

    const getDevManProjects = (devManId) => {
        return projects.filter(p =>
            p.devManId === devManId && (p.status === 'ON_GOING' || p.status === 'HOLD')
        );
    };

    const handleViewDetail = (devMan) => {
        const devManProjects = getDevManProjects(devMan.userId);
        setSelectedDevMan({ ...devMan, activeProjects: devManProjects });
        setShowDetailModal(true);
    };

    const filteredDevManagers = devManagers.filter(devMan =>
        devMan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        devMan.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#E6F2F1] font-['SF_Pro_Display']">
            <Sidebar />

            {/* Notification */}
            {notification.show && (
                <div
                    className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg border flex items-center gap-2 shadow-lg animate-fade-in`}
                    style={{
                        backgroundColor: notification.type === 'error' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(6, 208, 1, 0.1)',
                        borderColor: notification.type === 'error' ? '#FF0000' : '#06D001',
                        color: notification.type === 'error' ? '#FF0000' : '#06D001'
                    }}
                >
                    <span className="font-bold">{notification.message}</span>
                </div>
            )}

            <div className="flex-1 p-8 ml-[267px]">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">DevMan Management</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#CAF0F8] text-[#00B4D8] px-6 py-2.5 rounded-xl font-bold hover:bg-[#b8e8ef] transition-colors shadow-sm"
                    >
                        + Create DevMan
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find DevMan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-80 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] font-medium"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 font-bold text-gray-700">Name</th>
                                <th className="text-left py-4 px-6 font-bold text-gray-700">Email</th>
                                <th className="text-center py-4 px-6 font-bold text-gray-700">Status</th>
                                <th className="text-center py-4 px-6 font-bold text-gray-700">Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="py-8 text-center text-gray-500 font-bold">Loading...</td></tr>
                            ) : filteredDevManagers.length === 0 ? (
                                <tr><td colSpan="4" className="py-8 text-center text-gray-500 font-bold">No DevMan found</td></tr>
                            ) : (
                                filteredDevManagers.map(devMan => (
                                    <tr key={devMan.userId} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-4 px-6 font-bold text-gray-800">{devMan.name}</td>
                                        <td className="py-4 px-6 text-gray-600">{devMan.email}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold border ${getDevManStatus(devMan.userId) === 'AVAILABLE'
                                                        ? 'bg-green-50 text-green-500 border-green-500'
                                                        : 'bg-red-50 text-red-500 border-red-500'
                                                    }`}
                                            >
                                                {getDevManStatus(devMan.userId)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => handleViewDetail(devMan)}
                                                className="text-gray-500 hover:text-[#00B4D8] transition-colors"
                                            >
                                                <Eye className="w-5 h-5 mx-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create DevMan Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-[500px] animate-scale-in">
                        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold">Add DevMan</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={newDevMan.fullName}
                                    onChange={(e) => setNewDevMan({ ...newDevMan, fullName: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00B4D8] outline-none"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={newDevMan.email}
                                    onChange={(e) => setNewDevMan({ ...newDevMan, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00B4D8] outline-none"
                                    placeholder="name@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={newDevMan.password}
                                    onChange={(e) => setNewDevMan({ ...newDevMan, password: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00B4D8] outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                onClick={handleCreateDevMan}
                                disabled={!newDevMan.fullName || !newDevMan.email || !newDevMan.password}
                                className="w-full py-3 bg-[#CAF0F8] text-black font-bold rounded-lg hover:bg-[#b8e8ef] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Save & Create DevMan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedDevMan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-[600px] animate-scale-in">
                        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedDevMan.name}</h2>
                                <p className="text-gray-500">{selectedDevMan.email}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8">
                            <h3 className="font-bold text-lg mb-4">Active Projects ({selectedDevMan.activeProjects.length})</h3>
                            {selectedDevMan.activeProjects.length === 0 ? (
                                <p className="text-gray-500 italic">No active projects currently.</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDevMan.activeProjects.map(proj => (
                                        <div key={proj.projectId} className="p-4 bg-[#F8FBFC] rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{proj.projectName}</h4>
                                                    <p className="text-sm text-gray-500">{proj.clientName}</p>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${proj.status === 'ON_GOING' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                                        }`}
                                                >
                                                    {proj.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="px-8 pb-8 pt-4">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="w-full py-2 bg-gray-100 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDevman;
