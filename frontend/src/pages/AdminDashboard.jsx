import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
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
        } else if (type === 'PROJECT') {
            return {
                backgroundColor: 'rgba(0, 89, 255, 0.2)',
                border: '1px solid #0059FF',
                color: '#0059FF'
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
                        backgroundColor: notification.type === 'error' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(6, 208, 1, 0.2)',
                        border: `1px solid ${notification.type === 'error' ? '#FF0000' : '#06D001'}`
                    }}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke={notification.type === 'error' ? '#FF0000' : '#06D001'}
                        viewBox="0 0 24 24"
                    >
                        {notification.type === 'error' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        )}
                    </svg>
                    <span
                        className="font-bold"
                        style={{
                            color: notification.type === 'error' ? '#FF0000' : '#06D001',
                            fontSize: '14px',
                            fontFamily: 'SF Pro Display'
                        }}
                    >
                        {notification.message}
                    </span>
                    <button
                        onClick={closeNotification}
                        className="ml-2 hover:opacity-70 transition-opacity"
                        style={{ color: notification.type === 'error' ? '#FF0000' : '#06D001' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}



            {/* View Detail Modal */}
            {viewDetailModal.show && viewDetailModal.request && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div
                        className="rounded-2xl p-6 relative transition-all duration-300 max-h-[90vh] overflow-y-auto"
                        style={{
                            width: viewDetailModal.isRejecting ? '1000px' : '620px',
                            backgroundColor: '#F5F5F5'
                        }}
                    >
                        <div className="flex gap-8">
                            {/* Left Side: Detail Content */}
                            <div className="flex-1">
                                {/* Header */}
                                <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid #D3D3D3' }}>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>
                                            Request Detail
                                        </h2>
                                        <span className="text-gray-600 font-medium" style={{ fontFamily: 'SF Pro Display' }}>
                                            {viewDetailModal.request.type === 'EXTEND' ? 'Extend Assignment' :
                                                viewDetailModal.request.type === 'RELEASE' ? 'Release Assignment' : 'New Project Submission'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setViewDetailModal({ show: false, request: null, isRejecting: false, reason: '' })}
                                        className="text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* EXTEND Type Modal */}
                                {viewDetailModal.request.type === 'EXTEND' && (
                                    <>
                                        {/* Resource Info */}
                                        <div className="space-y-3 mb-6">
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
                                                    Role : <span className="font-bold">{viewDetailModal.request.role}</span>
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
                                                <p className="text-gray-600">Current End Date : {viewDetailModal.request.currentEndDate}</p>
                                                <p className="text-gray-600">
                                                    Requested New End : {viewDetailModal.request.newEndDate}
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
                                                    Role : <span className="font-bold">{viewDetailModal.request.role}</span>
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
                                                <p className="text-gray-600">Original End Date : {viewDetailModal.request.originalEndDate}</p>
                                                <p className="text-gray-600">
                                                    Requested New End : {viewDetailModal.request.requestedEndDate}
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
                                                    Submitted : <span className="font-bold">{viewDetailModal.request.submittedDate}</span>
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
                                                        <span className="font-bold">{item.role}</span>
                                                        <span>{item.startDate}</span>
                                                        <span>-</span>
                                                        <span>{item.endDate}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Action Buttons - Hidden when Rejecting to avoid duplication */}
                                {!viewDetailModal.isRejecting && (
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
                                )}
                            </div>

                            {/* Right Side: Rejection Form (Side-by-Side) */}
                            {viewDetailModal.isRejecting && (
                                <div className="w-[350px] border-l border-gray-300 pl-8 flex flex-col animate-slide-in-right">
                                    <h2 className="font-bold text-xl mb-4 text-red-600" style={{ fontFamily: 'SF Pro Display' }}>
                                        Decline Request
                                    </h2>
                                    <p className="text-gray-600 mb-4" style={{ fontFamily: 'SF Pro Display' }}>
                                        Please provide a reason for declining this request:
                                    </p>
                                    <textarea
                                        value={viewDetailModal.reason}
                                        onChange={(e) => setViewDetailModal(prev => ({ ...prev, reason: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none flex-1"
                                        style={{ minHeight: '150px', fontFamily: 'SF Pro Display' }}
                                        placeholder="Enter reason for declining..."
                                    />
                                    <div className="flex justify-end gap-3 mt-4">
                                        <button
                                            onClick={() => setViewDetailModal(prev => ({ ...prev, isRejecting: false, reason: '' }))}
                                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-bold"
                                            style={{ fontFamily: 'SF Pro Display' }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={submitDecline}
                                            disabled={!viewDetailModal.reason?.trim()}
                                            className={`px-4 py-2 text-white rounded-lg transition-colors font-bold ${!viewDetailModal.reason?.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                                            style={{ backgroundColor: '#FF0000', fontFamily: 'SF Pro Display' }}
                                        >
                                            Confirm Decline
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
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
                <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'SF Pro Display' }}>Pending Request</h2>

                {/* Pending Request Cards */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 overflow-hidden">
                    <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center justify-between p-4 rounded-xl"
                                style={{ backgroundColor: '#E8E8E8' }}
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className="text-xs px-3 py-1 rounded-full font-bold"
                                        style={getTypeBadgeStyle(request.type)}
                                    >
                                        {request.type}
                                    </span>
                                    <span className="font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>
                                        {request.type === 'PROJECT' ? request.projectName : request.resource}
                                    </span>
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
                        ))}
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Assignments Ending Soon */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'SF Pro Display' }}>Assignments Ending Soon</h2>
                        <div className="rounded-xl p-4" style={{ backgroundColor: '#F5F5F5' }}>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {assignmentsEndingSoon.length === 0 ? (
                                    <div className="bg-white rounded-xl p-4 text-center text-gray-500" style={{ fontFamily: 'SF Pro Display' }}>
                                        No assignments ending soon
                                    </div>
                                ) : (
                                    assignmentsEndingSoon.filter(a => a.daysLeft <= 1).map((assignment) => (
                                        <div
                                            key={assignment.assignmentId}
                                            className="rounded-xl p-4 flex items-center justify-between"
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
                                                    <p className="font-regular text-gray-800">{assignment.projectRole}</p>
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

                    {/* Active Projects */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'SF Pro Display' }}>Active Projects</h2>
                        <div className="rounded-xl p-4" style={{ backgroundColor: '#F5F5F5' }}>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {activeProjects.length === 0 ? (
                                    <div className="bg-white rounded-xl p-4 text-center text-gray-500" style={{ fontFamily: 'SF Pro Display' }}>
                                        No active projects
                                    </div>
                                ) : (
                                    activeProjects
                                        .filter(project => ['ON_GOING', 'HOLD'].includes(project.status))
                                        .map((project) => (
                                            <div
                                                key={project.projectId}
                                                className="rounded-xl p-4 flex items-center justify-between shadow-sm"
                                                style={{
                                                    backgroundColor: '#F5F5F5',
                                                    border: '1px solid #A9A9A9'
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <Folder className="w-6 h-6 text-blue-500" />
                                                    </div>
                                                    <div style={{ fontFamily: 'SF Pro Display' }}>
                                                        <p className="font-bold text-gray-800 text-lg">{project.projectName}</p>
                                                        <p className="text-sm font-regular text-gray-600">{project.clientName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1" style={{ fontFamily: 'SF Pro Display' }}>
                                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${project.status === 'ON_GOING'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {project.status === 'ON_GOING' ? 'ONGOING' : project.status}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-black font-bold">
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
        </div>
    );
};

export default Dashboard;