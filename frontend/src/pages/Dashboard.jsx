import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import {
    Users,
    UserPlus,
    FolderOpen,
    Clock,
    Check,
    X,
    AlertTriangle,
    Calendar,
    Folder
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Data states
    const [stats, setStats] = useState({
        totalResources: 0,
        availableResources: 0,
        activeProjects: 0,
        pendingRequests: 0
    });
    const [assignmentsEndingSoon, setAssignmentsEndingSoon] = useState([]);
    const [activeProjects, setActiveProjects] = useState([]);

    // Notification state
    const [notification, setNotification] = useState({ show: false, message: '', closing: false });

    // Decline modal state
    const [declineModal, setDeclineModal] = useState({ show: false, request: null, reason: '' });

    // Mock data for pending requests (since we don't have request entity yet)
    const pendingRequests = [
        { id: 1, type: 'EXTEND', resource: 'Rudi Tabuti Sugiharto', project: 'E-Commerce Platform', requestedBy: 'Rudi Tabuti Sugiharto', date: '15/12/2026', status: 'PENDING' },
        { id: 2, type: 'RELEASE', resource: 'Rudi Tabuti Sugiharto', project: 'E-Commerce Platform', requestedBy: 'Rudi Tabuti Sugiharto', date: '15/12/2026', status: 'PENDING' },
        { id: 3, type: 'EXTEND', resource: 'Rudi Tabuti Sugiharto', project: 'E-Commerce Platform', requestedBy: 'Rudi Tabuti Sugiharto', date: '15/12/2026', status: 'PENDING' },
        { id: 4, type: 'RELEASE', resource: 'Rudi Tabuti Sugiharto', project: 'E-Commerce Platform', requestedBy: 'Rudi Tabuti Sugiharto', date: '15/12/2026', status: 'PENDING' },
        { id: 5, type: 'EXTEND', resource: 'Rudi Tabuti Sugiharto', project: 'E-Commerce Platform', requestedBy: 'Rudi Tabuti Sugiharto', date: '15/12/2026', status: 'PENDING' },
    ];

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!token || !storedUser) {
            navigate('/');
            return;
        }

        setUser(JSON.parse(storedUser));
        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch stats
            const statsRes = await api.get('/dashboard/stats');
            setStats(statsRes.data);

            // Fetch assignments ending soon
            const assignmentsRes = await api.get('/dashboard/assignments-ending-soon?days=7');
            setAssignmentsEndingSoon(assignmentsRes.data);

            // Fetch active projects
            const projectsRes = await api.get('/dashboard/active-projects');
            setActiveProjects(projectsRes.data);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Get type badge colors based on request type
    const getTypeBadgeStyle = (type) => {
        if (type === 'EXTEND') {
            return {
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                border: '1px solid #F97316',
                color: '#F97316'
            };
        } else if (type === 'RELEASE') {
            return {
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid #FF0000',
                color: '#FF0000'
            };
        }
        return {
            backgroundColor: 'rgba(251, 205, 63, 0.2)',
            border: '1px solid #FBCD3F',
            color: '#FBCD3F'
        };
    };

    // Handle Accept action
    const handleAccept = (request) => {
        showNotification(`Request for ${request.resource} has been accepted!`);
    };

    // Handle Decline action - open modal
    const handleDecline = (request) => {
        setDeclineModal({ show: true, request, reason: '' });
    };

    // Submit decline with reason
    const submitDecline = () => {
        if (declineModal.reason.trim()) {
            // Here you would send the decline reason to the server
            console.log('Declined:', declineModal.request, 'Reason:', declineModal.reason);
            setDeclineModal({ show: false, request: null, reason: '' });
            showNotification(`Request has been declined.`);
        }
    };

    // Show notification
    const showNotification = (message) => {
        setNotification({ show: true, message, closing: false });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, closing: true }));
            setTimeout(() => {
                setNotification({ show: false, message: '', closing: false });
            }, 300);
        }, 4000);
    };

    // Close notification
    const closeNotification = () => {
        setNotification(prev => ({ ...prev, closing: true }));
        setTimeout(() => {
            setNotification({ show: false, message: '', closing: false });
        }, 300);
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#E6F2F1] font-sf">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#E6F2F1] font-['SF_Pro_Display']">
            {/* Sidebar */}
            <Sidebar />

            {/* Toast Notification */}
            {notification.show && (
                <div
                    className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out ${notification.closing
                        ? 'opacity-0 translate-x-full'
                        : 'opacity-100 translate-x-0'
                        }`}
                    style={{
                        backgroundColor: 'rgba(6, 208, 1, 0.2)',
                        border: '1px solid #06D001'
                    }}
                >
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
                    <span
                        className="font-bold"
                        style={{
                            color: '#06D001',
                            fontSize: '14px',
                            fontFamily: 'SF Pro Display'
                        }}
                    >
                        {notification.message}
                    </span>
                    <button
                        onClick={closeNotification}
                        className="ml-2 hover:opacity-70 transition-opacity"
                        style={{ color: '#06D001' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Decline Reason Modal */}
            {declineModal.show && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div
                        className="bg-white rounded-2xl p-6"
                        style={{ width: '450px' }}
                    >
                        <h2 className="font-bold text-xl mb-4" style={{ fontFamily: 'SF Pro Display' }}>
                            Decline Request
                        </h2>
                        <p className="text-gray-600 mb-4" style={{ fontFamily: 'SF Pro Display' }}>
                            Please provide a reason for declining this request:
                        </p>
                        <textarea
                            value={declineModal.reason}
                            onChange={(e) => setDeclineModal(prev => ({ ...prev, reason: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] resize-none"
                            style={{ height: '120px', fontFamily: 'SF Pro Display' }}
                            placeholder="Enter reason for declining..."
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setDeclineModal({ show: false, request: null, reason: '' })}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-bold"
                                style={{ fontFamily: 'SF Pro Display' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitDecline}
                                className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-bold"
                                style={{ backgroundColor: '#FF0000', fontFamily: 'SF Pro Display' }}
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 ml-[267px] p-8">
                {/* Page Title */}
                <h1 className="text-4xl font-bold text-gray-800 mb-8" style={{ fontFamily: 'SF Pro Display' }}>Dashboard</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {/* Total Resources */}
                    <div
                        className="rounded-xl p-5"
                        style={{
                            backgroundColor: '#F5F5F5',
                            border: '1px solid rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-lg font-bold text-black">Total Resources</span>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                            >
                                <Users className="w-6 h-6 text-black" />
                            </div>
                        </div>
                        <p className="text-5xl font-bold text-black">{stats.totalResources}</p>
                    </div>

                    {/* Available */}
                    <div
                        className="rounded-xl p-5"
                        style={{
                            backgroundColor: 'rgba(6, 208, 1, 0.2)',
                            border: '1px solid #06D001'
                        }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-lg font-bold" style={{ color: '#06D001' }}>Available</span>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(6, 208, 1, 0.2)' }}
                            >
                                <UserPlus className="w-6 h-6" style={{ color: '#06D001' }} />
                            </div>
                        </div>
                        <p className="text-5xl font-bold" style={{ color: '#06D001' }}>{stats.availableResources}</p>
                    </div>

                    {/* Active Projects */}
                    <div
                        className="rounded-xl p-5"
                        style={{
                            backgroundColor: 'rgba(0, 180, 216, 0.2)',
                            border: '1px solid #00B4D8'
                        }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-lg font-bold" style={{ color: '#00B4D8' }}>Active Projects</span>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(0, 180, 216, 0.2)' }}
                            >
                                <FolderOpen className="w-6 h-6" style={{ color: '#00B4D8' }} />
                            </div>
                        </div>
                        <p className="text-5xl font-bold" style={{ color: '#00B4D8' }}>{stats.activeProjects}</p>
                    </div>

                    {/* Pending Request */}
                    <div
                        className="rounded-xl p-5"
                        style={{
                            backgroundColor: 'rgba(251, 205, 63, 0.2)',
                            border: '1px solid #FBCD3F'
                        }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-lg font-bold" style={{ color: '#FBCD3F' }}>Pending Request</span>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(251, 205, 63, 0.2)' }}
                            >
                                <Clock className="w-6 h-6" style={{ color: '#FBCD3F' }} />
                            </div>
                        </div>
                        <p className="text-5xl font-bold" style={{ color: '#FBCD3F' }}>{stats.pendingRequests}</p>
                    </div>
                </div>

                {/* Pending Request Title - Outside the box */}
                <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'SF Pro Display' }}>Pending Request</h2>

                {/* Pending Request Table */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <table className="w-full">
                        <thead>
                            <tr className="text-gray-600 text-sm" style={{ fontFamily: 'SF Pro Display' }}>
                                <th className="text-left py-3 px-2 font-bold">Type</th>
                                <th className="text-left py-3 px-2 font-bold">Resource</th>
                                <th className="text-left py-3 px-2 font-bold">Project</th>
                                <th className="text-left py-3 px-2 font-bold">Requested By</th>
                                <th className="text-left py-3 px-2 font-bold">Date</th>
                                <th className="text-left py-3 px-2 font-bold">Status</th>
                                <th className="text-center py-3 px-2 font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontFamily: 'SF Pro Display' }}>
                            {pendingRequests.map((request) => (
                                <tr key={request.id} className="border-t border-gray-100">
                                    <td className="py-3 px-2">
                                        <span
                                            className="text-xs px-3 py-1 rounded-full font-bold"
                                            style={getTypeBadgeStyle(request.type)}
                                        >
                                            {request.type}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-gray-800 font-bold">{request.resource}</td>
                                    <td className="py-3 px-2 text-gray-600 font-bold">{request.project}</td>
                                    <td className="py-3 px-2 text-gray-600 font-bold">{request.requestedBy}</td>
                                    <td className="py-3 px-2 text-gray-600 font-bold">{request.date}</td>
                                    <td className="py-3 px-2">
                                        <span
                                            className="text-xs px-3 py-1 rounded-full font-bold"
                                            style={{
                                                backgroundColor: 'rgba(251, 205, 63, 0.2)',
                                                border: '1px solid #FBCD3F',
                                                color: '#FBCD3F'
                                            }}
                                        >
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <button
                                            className="text-green-500 hover:text-green-700 mx-1 transition-colors"
                                            onClick={() => handleAccept(request)}
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button
                                            className="text-red-500 hover:text-red-700 mx-1 transition-colors"
                                            onClick={() => handleDecline(request)}
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Assignments Ending Soon */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'SF Pro Display' }}>Assignments Ending Soon</h2>
                        <div className="space-y-3">
                            {assignmentsEndingSoon.length === 0 ? (
                                <div className="bg-white rounded-xl p-4 text-center text-gray-500" style={{ fontFamily: 'SF Pro Display' }}>
                                    No assignments ending soon
                                </div>
                            ) : (
                                assignmentsEndingSoon.map((assignment) => (
                                    <div
                                        key={assignment.assignmentId}
                                        className="rounded-xl p-4 flex items-center justify-between"
                                        style={{
                                            backgroundColor: 'rgba(255, 0, 0, 0.2)',
                                            border: '1px solid #FF0000'
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                            </div>
                                            <div style={{ fontFamily: 'SF Pro Display' }}>
                                                <p className="font-bold text-gray-800">{assignment.resourceName}</p>
                                                <p className="text-sm text-gray-600 font-bold">{assignment.projectRole}</p>
                                            </div>
                                        </div>
                                        <div className="text-right" style={{ fontFamily: 'SF Pro Display' }}>
                                            <p className="text-red-500 font-bold flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {assignment.daysLeft} Days
                                            </p>
                                            <p className="text-sm text-gray-600 font-bold">{formatDate(assignment.endDate)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Active Projects */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'SF Pro Display' }}>Active Projects</h2>
                        <div className="space-y-3">
                            {activeProjects.length === 0 ? (
                                <div className="bg-white rounded-xl p-4 text-center text-gray-500" style={{ fontFamily: 'SF Pro Display' }}>
                                    No active projects
                                </div>
                            ) : (
                                activeProjects.map((project) => (
                                    <div key={project.projectId} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Folder className="w-6 h-6 text-gray-500" />
                                            </div>
                                            <div style={{ fontFamily: 'SF Pro Display' }}>
                                                <p className="font-bold text-gray-800">{project.projectName}</p>
                                                <p className="text-sm text-gray-600">{project.clientName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4" style={{ fontFamily: 'SF Pro Display' }}>
                                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${project.status === 'ON_GOING'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {project.status === 'ON_GOING' ? 'ONGOING' : project.status}
                                            </span>
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <Users className="w-4 h-4" />
                                                <span className="text-sm">{project.memberCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;