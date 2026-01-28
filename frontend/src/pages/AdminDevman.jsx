import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { Search, UserPlus, X, Eye, Trash2, AlertTriangle } from 'lucide-react';

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

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({ show: false, devMan: null });

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

    const handleDeleteClick = (devMan) => {
        setDeleteModal({ show: true, devMan });
    };

    const confirmDelete = async () => {
        if (!deleteModal.devMan) return;

        try {
            await api.delete(`/users/${deleteModal.devMan.userId}`);
            showNotification('DevMan deleted successfully!', 'success');
            setDeleteModal({ show: false, devMan: null });
            fetchData();
        } catch (error) {
            console.error('Error deleting DevMan:', error);
            showNotification('Failed to delete DevMan', 'error');
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
                    className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-300 ease-in-out ${notification.closing
                        ? 'opacity-0 translate-x-full'
                        : 'opacity-100 translate-x-0 animate-slide-in'
                        }`}
                    style={{
                        backgroundColor: notification.type === 'success' ? 'rgba(6, 208, 1, 0.2)' : notification.type === 'error' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 180, 216, 0.2)',
                        borderColor: notification.type === 'success' ? '#06D001' : notification.type === 'error' ? '#FF0000' : '#00B4D8'
                    }}
                >
                    {notification.type === 'success' ? (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="#06D001"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    ) : notification.type === 'error' ? (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="#FF0000"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="#00B4D8"
                            viewBox="0 0 24 24"
                            style={{ color: '#00B4D8' }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    )}
                    <span
                        className="font-bold"
                        style={{
                            color: notification.type === 'success' ? '#06D001' : notification.type === 'error' ? '#FF0000' : '#00B4D8',
                            fontSize: '14px'
                        }}
                    >
                        {notification.message}
                    </span>
                    <button
                        onClick={closeNotification}
                        className="ml-2 hover:opacity-70 transition-opacity"
                        style={{ color: notification.type === 'success' ? '#06D001' : notification.type === 'error' ? '#FF0000' : '#00B4D8' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            <div className="flex-1 p-8 ml-[267px]">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">DevMan Management</h1>
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
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#CAF0F8] text-black px-6 py-2.5 rounded-xl font-bold hover:bg-[#b8e8ef] transition-colors shadow-sm"
                    >
                        + Create DevMan
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#CAF0F8] border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 font-bold text-black">Name</th>
                                <th className="text-left py-4 px-6 font-bold text-black">Email</th>
                                <th className="text-center py-4 px-6 font-bold text-black">Status</th>
                                <th className="text-center py-4 px-6 font-bold text-black">Action</th>
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
                                                className="px-3 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    color: getDevManStatus(devMan.userId) === 'AVAILABLE' ? '#06D001' : '#FF0000',
                                                    backgroundColor: getDevManStatus(devMan.userId) === 'AVAILABLE' ? 'rgba(6, 208, 1, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                                                    border: getDevManStatus(devMan.userId) === 'AVAILABLE' ? '1px solid #06D001' : '1px solid #FF0000'
                                                }}
                                            >
                                                {getDevManStatus(devMan.userId)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetail(devMan)}
                                                    className="inline-flex items-center gap-1 text-gray-600 hover:text-[#0059FF] transition-colors"
                                                    title="View Detail"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(devMan)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete DevMan"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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
            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
                    <div className="bg-[#F5F5F5] rounded-2xl p-8 w-[400px] flex flex-col items-center animate-scale-in">
                        <div className="mb-4">
                            <AlertTriangle className="w-16 h-16 text-[#FBCD3F]" fill="#FBCD3F" stroke="#ffffff" />
                        </div>
                        <h2 className="text-3xl font-bold text-black mb-2 text-center" style={{ fontFamily: 'SF Pro Display' }}>Are you sure?</h2>
                        <p className="text-black text-center mb-8" style={{ fontFamily: 'SF Pro Display' }}>
                            You will not be able to recover this DevMan
                        </p>
                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => setDeleteModal({ show: false, devMan: null })}
                                className="flex-1 py-3 bg-[#D9D9D9] text-black rounded-xl font-bold hover:bg-gray-300 transition-colors"
                                style={{ fontFamily: 'SF Pro Display' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-[#FF0000] text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                                style={{ fontFamily: 'SF Pro Display' }}
                            >
                                Yes, delete it!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDevman;
