import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import api from '../utils/api';
import {
    Users,
    User,
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
    const [notification, setNotification] = useState({ show: false, message: '', closing: false, type: 'success' });

    // View Detail modal state with integrated rejection logic
    const [viewDetailModal, setViewDetailModal] = useState({
        show: false,
        request: null,
        isRejecting: false,
        reason: ''
    });

    // Mock data for pending requests (since we don't have request entity yet)
    const [pendingRequests, setPendingRequests] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!token || !storedUser) {
            navigate('/');
            return;
        }

        setUser(JSON.parse(storedUser));
        fetchDashboardData();

        // Refresh data when user returns to dashboard (tab/window focus)
        const handleFocus = () => {
            fetchDashboardData();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
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

            // Fetch pending requests
            const requestsRes = await api.get('/requests');
            setPendingRequests(requestsRes.data);

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



    // Handle Accept action
    const handleAccept = (request) => {
        showNotification(`Request for ${request.resource} has been accepted!`);
    };

    // Submit decline with reason
    const submitDecline = async () => {
        if (viewDetailModal.reason.trim()) {
            try {
                await api.post(`/requests/${viewDetailModal.request.id}/reject`, { reason: viewDetailModal.reason });
                setViewDetailModal({ show: false, request: null, isRejecting: false, reason: '' });
                showNotification(`Request has been declined.`, 'error');
                fetchDashboardData(); // Refresh data
            } catch (error) {
                console.error('Error declining request:', error);
                showNotification('Failed to decline request', 'error');
            }
        }
    };

    const handleApprove = async (request) => {
        try {
            await api.post(`/requests/${request.id}/approve`);
            setViewDetailModal({ show: false, request: null, isRejecting: false, reason: '' });
            showNotification(`Request has been approved!`, 'success');
            fetchDashboardData(); // Refresh data
        } catch (error) {
            console.error('Error approving request:', error);
            showNotification('Failed to approve request', 'error');
        }
    };

    // Show notification
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, closing: false, type });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, closing: true }));
            setTimeout(() => {
                setNotification({ show: false, message: '', closing: false, type: 'success' });
            }, 300);
        }, 4000);
    };

    // Close notification
    const closeNotification = () => {
        setNotification(prev => ({ ...prev, closing: true }));
        setTimeout(() => {
            setNotification({ show: false, message: '', closing: false, type: 'success' });
        }, 300);
    };

    // Body scroll locking
    useEffect(() => {
        if (viewDetailModal.show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [viewDetailModal.show]);

    const toTitleCase = (str) => {
        if (!str) return '-';
        // If already title case or proper case, return as is
        if (str.includes('Developer') || str.includes('Assurance') || str.includes('Lead')) {
            return str;
        }
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };



    return (
        <div className="flex min-h-screen bg-[#E6F2F1] font-['SF_Pro_Display']">
            {/* Sidebar */}
            <Sidebar />

            {/* Notification Toast */}
            <Toast
                show={notification.show}
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
                closing={notification.closing}
            />



            {/* View Detail Modal */}
            {viewDetailModal.show && viewDetailModal.request && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto animate-fade-in"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div className="flex items-start gap-6 transition-all duration-300 min-w-min">
                        <div
                            className="rounded-2xl p-6 relative bg-[#F5F5F5] flex-shrink-0 shadow-xl"
                            style={{
                                width: '620px',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid #D3D3D3' }}>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>
                                        Request Detail
                                    </h2>
                                    <span className="text-gray-600 font-medium" style={{ fontFamily: 'SF Pro Display' }}>
                                        {viewDetailModal.request.type === 'EXTEND' ? 'Extend Assignment' :
                                            viewDetailModal.request.type === 'RELEASE' ? 'Release Assignment' :
                                                viewDetailModal.request.type === 'ASSIGN' ? 'New Assignment' :
                                                    'New Project Submission'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setViewDetailModal({ show: false, request: null, isRejecting: false, reason: '' })}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* ASSIGN Type Modal */}
                            {viewDetailModal.request.type === 'ASSIGN' && (
                                <>
                                    {/* Resource Info */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Requester : <span className="font-bold">{viewDetailModal.request.requester}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Resource : <span className="font-bold">{viewDetailModal.request.resource}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Folder className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Project : <span className="font-bold">{viewDetailModal.request.project}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Users className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Role : <span className="font-bold">{viewDetailModal.request.role ? toTitleCase(viewDetailModal.request.role) : '-'}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-300 my-4"></div>

                                    {/* Assignment Details */}
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Calendar className="w-5 h-5 text-gray-500" />
                                            <span className="font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Assignment Period</span>
                                        </div>
                                        <div className="ml-8 space-y-1" style={{ fontFamily: 'SF Pro Display' }}>
                                            <p className="text-gray-600">Start Date : {formatDate(viewDetailModal.request.startDate)}</p>
                                            <p className="text-gray-600">End Date : {formatDate(viewDetailModal.request.newEndDate)}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* EXTEND Type Modal */}
                            {viewDetailModal.request.type === 'EXTEND' && (
                                <>
                                    {/* Resource Info */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Requester : <span className="font-bold">{viewDetailModal.request.requester}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Resource : <span className="font-bold">{viewDetailModal.request.resource}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Folder className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Project : <span className="font-bold">{viewDetailModal.request.project}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Users className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Role : <span className="font-bold">{viewDetailModal.request.role ? toTitleCase(viewDetailModal.request.role) : '-'}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-300 my-4"></div>

                                    {/* Proposed Changes */}
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Calendar className="w-5 h-5 text-gray-500" />
                                            <span className="font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Proposed Changes</span>
                                        </div>
                                        <div className="ml-8 space-y-1" style={{ fontFamily: 'SF Pro Display' }}>
                                            <p className="text-gray-600">Current End Date : {formatDate(viewDetailModal.request.currentEndDate)}</p>
                                            <p className="text-gray-600">
                                                Requested New End : {formatDate(viewDetailModal.request.newEndDate)}
                                                {viewDetailModal.request.extensionMonths > 0 && (
                                                    <span className="text-red-500 font-medium"> (+ {viewDetailModal.request.extensionMonths} Months)</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Reason from DevMan */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            <span className="font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Reason from DevMan</span>
                                        </div>
                                        <p className="ml-8 text-gray-600 italic" style={{ fontFamily: 'SF Pro Display' }}>
                                            "{viewDetailModal.request.reason}"
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* RELEASE Type Modal */}
                            {viewDetailModal.request.type === 'RELEASE' && (
                                <>
                                    {/* Resource Info */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Requester : <span className="font-bold">{viewDetailModal.request.requester}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Resource : <span className="font-bold">{viewDetailModal.request.resource}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Folder className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Project : <span className="font-bold">{viewDetailModal.request.project}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Users className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Role : <span className="font-bold">{viewDetailModal.request.role ? toTitleCase(viewDetailModal.request.role) : '-'}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-300 my-4"></div>

                                    {/* Proposed Changes */}
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Calendar className="w-5 h-5 text-gray-500" />
                                            <span className="font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Proposed Changes</span>
                                        </div>
                                        <div className="ml-8 space-y-1" style={{ fontFamily: 'SF Pro Display' }}>
                                            <p className="text-gray-600">Original End Date : {formatDate(viewDetailModal.request.currentEndDate)}</p>
                                            <p className="text-gray-600">
                                                Requested New End : {formatDate(viewDetailModal.request.newEndDate)}
                                                {viewDetailModal.request.earlyReleaseMonths > 0 && (
                                                    <span className="text-red-500 font-medium"> (Early Release by {viewDetailModal.request.earlyReleaseMonths} Month)</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Reason from DevMan */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            <span className="font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Reason from DevMan</span>
                                        </div>
                                        <p className="ml-8 text-gray-600 italic" style={{ fontFamily: 'SF Pro Display' }}>
                                            "{viewDetailModal.request.reason}"
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* PROJECT Type Modal */}
                            {viewDetailModal.request.type === 'PROJECT' && (
                                <>
                                    {/* Requester Info */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Requester : <span className="font-bold">{viewDetailModal.request.requester}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-gray-500" />
                                            <span style={{ fontFamily: 'SF Pro Display' }}>
                                                Submitted : <span className="font-bold">{viewDetailModal.request.submittedDate ? new Date(viewDetailModal.request.submittedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-300 my-4"></div>

                                    {/* Project Profile */}
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Folder className="w-5 h-5 text-gray-500" />
                                            <span className="font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Project Profile</span>
                                        </div>
                                        <div className="ml-8 space-y-1" style={{ fontFamily: 'SF Pro Display' }}>
                                            <p className="text-gray-600">Project Name : <span className="font-bold">{viewDetailModal.request.projectName}</span></p>
                                            <p className="text-gray-600">Client : <span className="font-bold">{viewDetailModal.request.clientName}</span></p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            <span className="font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Description</span>
                                        </div>
                                        <p className="ml-8 text-gray-600 italic" style={{ fontFamily: 'SF Pro Display' }}>
                                            "{viewDetailModal.request.description}"
                                        </p>
                                    </div>

                                    {/* Resource Plan */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Users className="w-5 h-5 text-gray-500" />
                                            <span className="font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Resource Plan</span>
                                        </div>
                                        <div className="ml-8" style={{ fontFamily: 'SF Pro Display' }}>
                                            <p className="text-gray-600 mb-2">DevMan Requesting :</p>
                                            {viewDetailModal.request.resourcePlan && viewDetailModal.request.resourcePlan.map((item, index) => (
                                                <div key={index} className="flex items-center gap-4 text-gray-600 mb-1">
                                                    <span>{index + 1}. {item.name}</span>
                                                    <span className="font-bold">{toTitleCase(item.role)}</span>
                                                    <span>{item.startDate}</span>
                                                    <span>-</span>
                                                    <span>{item.endDate}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #D3D3D3' }}>
                                <button
                                    onClick={() => setViewDetailModal({ show: false, request: null, isRejecting: false, reason: '' })}
                                    className="px-6 py-2 rounded-lg hover:opacity-90 transition-colors font-bold"
                                    style={{ backgroundColor: '#D3D3D3', color: '#000000', fontFamily: 'SF Pro Display' }}
                                >
                                    Cancel
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setViewDetailModal(prev => ({ ...prev, isRejecting: true }))}
                                        className="px-6 py-2 rounded-lg hover:opacity-90 transition-colors font-bold"
                                        style={{ backgroundColor: 'rgba(255, 0, 0, 0.2)', color: '#FF0000', fontFamily: 'SF Pro Display' }}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(viewDetailModal.request)}
                                        className="px-6 py-2 rounded-lg hover:opacity-90 transition-colors font-bold"
                                        style={{ backgroundColor: 'rgba(6, 208, 1, 0.2)', color: '#06D001', fontFamily: 'SF Pro Display' }}
                                    >
                                        Approve Request
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Reject Sidebar - Now Side-by-Side in Flex Container */}
                        {viewDetailModal.isRejecting && (
                            <div className="w-[400px] h-fit bg-[#F5F5F5] shadow-2xl rounded-3xl p-6 flex flex-col animate-scale-in">
                                <h3 className="text-2xl font-bold mb-2 text-center text-red-600" style={{ fontFamily: 'SF Pro Display' }}>Decline Request</h3>

                                <div className="border-b border-gray-300 mb-6 mt-4"></div>

                                <div className="space-y-6 flex-1">
                                    <div>
                                        <p className="text-gray-600 mb-4 font-medium" style={{ fontFamily: 'SF Pro Display' }}>
                                            Please provide a reason for declining this request:
                                        </p>
                                        <textarea
                                            value={viewDetailModal.reason}
                                            onChange={(e) => setViewDetailModal(prev => ({ ...prev, reason: e.target.value }))}
                                            className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none flex-1 shadow-sm"
                                            style={{ minHeight: '150px', fontFamily: 'SF Pro Display' }}
                                            placeholder="Enter reason for declining..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-auto pt-6">
                                    <button
                                        onClick={() => setViewDetailModal(prev => ({ ...prev, isRejecting: false, reason: '' }))}
                                        className="flex-1 py-3 bg-[#D9D9D9] text-black rounded-xl font-bold hover:bg-gray-300 transition-colors"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitDecline}
                                        disabled={!viewDetailModal.reason?.trim()}
                                        className={`flex-1 py-3 text-white rounded-xl font-bold transition-colors ${!viewDetailModal.reason?.trim() ? 'opacity-50 cursor-not-allowed bg-red-400' : 'hover:bg-red-700 bg-[#FF0000]'}`}
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    >
                                        Confirm Decline
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 ml-[267px] p-8">
                {/* Page Title */}
                <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>

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
                            <span className="text-lg font-bold text-black">Available</span>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(6, 208, 1, 0.2)' }}
                            >
                                <UserPlus className="w-6 h-6" style={{ color: '#06D001' }} />
                            </div>
                        </div>
                        <p className="text-5xl font-bold text-black">{stats.availableResources}</p>
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
                            <span className="text-lg font-bold text-black">Active Projects</span>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(0, 180, 216, 0.2)' }}
                            >
                                <FolderOpen className="w-6 h-6" style={{ color: '#00B4D8' }} />
                            </div>
                        </div>
                        <p className="text-5xl font-bold text-black">{stats.activeProjects}</p>
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
                            <span className="text-lg font-bold text-black">Pending Request</span>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(251, 205, 63, 0.2)' }}
                            >
                                <Clock className="w-6 h-6" style={{ color: '#FBCD3F' }} />
                            </div>
                        </div>
                        <p className="text-5xl font-bold text-black">{stats.pendingRequests}</p>
                    </div>
                </div>

                {/* Pending Request Title */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Pending Request</h2>
                    <button
                        onClick={() => navigate('/notifications')}
                        className="text-[#00B4D8] font-bold hover:underline"
                        style={{ fontFamily: 'SF Pro Display' }}
                    >
                        See All
                    </button>
                </div>

                {/* Pending Request Cards */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 overflow-hidden">
                    <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                        {pendingRequests.length === 0 ? (
                            <div className="col-span-2 text-center py-4 text-gray-500 font-sf font-medium">
                                No pending requests
                            </div>
                        ) : (
                            pendingRequests.slice(0, 4).map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center justify-between p-4 rounded-xl"
                                    style={{ backgroundColor: '#E8E8E8' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={request.type} />
                                        <div style={{ fontFamily: 'SF Pro Display' }}>
                                            <p className="font-bold text-gray-800">
                                                {request.type === 'PROJECT' ? request.projectName : request.resource}
                                            </p>
                                            {['ASSIGN', 'EXTEND', 'RELEASE'].includes(request.type) && (
                                                <p className="text-sm text-gray-500">
                                                    {request.project}
                                                </p>
                                            )}
                                            {request.type === 'PROJECT' && (
                                                <p className="text-sm text-gray-500">
                                                    {request.clientName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setViewDetailModal({ show: true, request, isRejecting: false, reason: '' })}
                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        <span className="font-medium">View Detail</span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Assignments Ending Soon */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'SF Pro Display' }}>Assignments Ending Soon</h2>
                        <div className="bg-white rounded-xl shadow-sm p-6 overflow-hidden">
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {assignmentsEndingSoon.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 font-sf font-medium">
                                        No assignments ending soon
                                    </div>
                                ) : (
                                    assignmentsEndingSoon.filter(a => a.daysLeft === 1).map((assignment) => (
                                        <div
                                            key={assignment.assignmentId}
                                            onClick={() => navigate('/project', { state: { openProjectId: assignment.projectId } })}
                                            className="rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                            style={{
                                                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                                                border: '1px solid #FF0000'
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                    style={{ backgroundColor: 'rgba(255, 0, 0, 0.2)' }}
                                                >
                                                    <AlertTriangle className="w-6 h-6" style={{ color: '#FF0000' }} />
                                                </div>
                                                <div style={{ fontFamily: 'SF Pro Display' }}>
                                                    <p className="font-bold text-gray-800 text-lg">{assignment.resourceName}</p>
                                                    <p className="font-regular text-gray-800">
                                                        {assignment.projectRole} • <span className="font-bold">{assignment.projectName}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right" style={{ fontFamily: 'SF Pro Display' }}>
                                                <p className="font-bold flex items-center justify-end gap-1" style={{ color: '#FF0000', fontSize: '18px' }}>
                                                    <Calendar className="w-5 h-5" />
                                                    {assignment.daysLeft} Days
                                                </p>
                                                <p className="text-sm text-gray-600 font-regular">{formatDate(assignment.endDate)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;