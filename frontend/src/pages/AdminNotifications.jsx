import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import api from '../utils/api';
import { Search, Bell, X, Folder, UserPlus, Clock, LogOut, User, Users, Calendar } from 'lucide-react';

const AdminNotifications = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    // Notification state
    const [notification, setNotification] = useState({ show: false, message: '', closing: false, type: 'success' });

    // Detail modal state
    const [viewDetailModal, setViewDetailModal] = useState({
        show: false,
        request: null,
        isRejecting: false,
        reason: ''
    });

    const filterTabs = ['All', 'Project', 'Assign', 'Extend', 'Release'];

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!token || !storedUser) {
            navigate('/');
            return;
        }

        setUser(JSON.parse(storedUser));
        fetchRequests();
    }, [navigate]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/requests');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
            showNotification('Failed to fetch requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request) => {
        try {
            await api.post(`/requests/${request.id}/approve`);
            setViewDetailModal({ show: false, request: null, isRejecting: false, reason: '' });
            showNotification(`Request has been approved!`, 'success');
            fetchRequests(); // Refresh data
        } catch (error) {
            console.error('Error approving request:', error);
            showNotification('Failed to approve request', 'error');
        }
    };

    const submitDecline = async () => {
        if (viewDetailModal.reason.trim()) {
            try {
                await api.post(`/requests/${viewDetailModal.request.id}/reject`, { reason: viewDetailModal.reason });
                setViewDetailModal({ show: false, request: null, isRejecting: false, reason: '' });
                showNotification(`Request has been declined.`, 'error');
                fetchRequests(); // Refresh data
            } catch (error) {
                console.error('Error declining request:', error);
                showNotification('Failed to decline request', 'error');
            }
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, closing: false, type });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, closing: true }));
            setTimeout(() => {
                setNotification({ show: false, message: '', closing: false, type: 'success' });
            }, 300);
        }, 4000);
    };

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, closing: true }));
        setTimeout(() => {
            setNotification({ show: false, message: '', closing: false, type: 'success' });
        }, 300);
    };

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

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const toTitleCase = (str) => {
        if (!str) return '-';
        if (str.includes('Developer') || str.includes('Assurance') || str.includes('Lead')) {
            return str;
        }
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getRequestIcon = (type) => {
        switch (type) {
            case 'PROJECT': return <Folder className="w-6 h-6 text-blue-500" />;
            case 'ASSIGN': return <UserPlus className="w-6 h-6 text-green-500" />;
            case 'EXTEND': return <Clock className="w-6 h-6 text-orange-500" />;
            case 'RELEASE': return <LogOut className="w-6 h-6 text-red-500" />;
            default: return <Bell className="w-6 h-6 text-gray-500" />;
        }
    };

    const getRequestBg = (type) => {
        switch (type) {
            case 'PROJECT': return 'bg-blue-100';
            case 'ASSIGN': return 'bg-green-100';
            case 'EXTEND': return 'bg-orange-100';
            case 'RELEASE': return 'bg-red-100';
            default: return 'bg-gray-100';
        }
    };

    const filteredRequests = requests.filter(r => {
        const matchesFilter = activeFilter === 'All' || r.type === activeFilter.toUpperCase();
        const searchInput = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery.trim() ||
            (r.projectName && r.projectName.toLowerCase().includes(searchInput)) ||
            (r.resource && r.resource.toLowerCase().includes(searchInput)) ||
            (r.project && r.project.toLowerCase().includes(searchInput)) ||
            (r.requester && r.requester.toLowerCase().includes(searchInput));
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="flex min-h-screen bg-[#E6F2F1] font-['SF_Pro_Display']">
            <Sidebar />
            <Toast
                show={notification.show}
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
                closing={notification.closing}
            />

            {/* Main Content */}
            <div className="flex-1 ml-[267px] flex flex-col h-screen overflow-hidden bg-[#E6F2F1]">
                <div className="p-8 pb-4">
                    <h1 className="text-4xl font-bold text-gray-800 mb-6">Notifications</h1>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-80 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CAF0F8]"
                            />
                        </div>

                        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                            {filterTabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFilter(tab)}
                                    className={`px-6 py-2 rounded-md font-bold transition-all ${activeFilter === tab ? 'bg-[#CAF0F8] text-black shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Request List */}
                <div className="px-8 pb-8 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="text-center py-12 text-gray-500 font-bold">Loading requests...</div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl text-gray-500 font-bold">No pending requests found.</div>
                        ) : (
                            filteredRequests.map(request => (
                                <div key={request.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 ${getRequestBg(request.type)} rounded-lg flex items-center justify-center`}>
                                            {getRequestIcon(request.type)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-1">
                                                {request.type === 'PROJECT' ? request.projectName : request.resource}
                                            </h3>
                                            <p className="text-gray-500 font-medium">
                                                {request.type === 'PROJECT' ? request.clientName : request.project} • <span className="text-[#00B4D8] font-bold">{request.requester}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <StatusBadge status={request.type} />
                                            <div className="text-gray-400 text-xs mt-2 font-medium">
                                                {formatDate(request.submittedDate || new Date())}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setViewDetailModal({ show: true, request, isRejecting: false, reason: '' })}
                                            className="px-6 py-2 bg-[#CAF0F8] text-black rounded-lg font-bold hover:bg-[#b8e8ef] transition-colors"
                                        >
                                            View Detail
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail Modal */}
                {viewDetailModal.show && viewDetailModal.request && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-auto animate-fade-in">
                        <div className="flex items-start gap-6 transition-all duration-300 min-w-min">
                            <div className="rounded-2xl p-6 relative bg-[#F5F5F5] flex-shrink-0 shadow-xl w-[620px] max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid #D3D3D3' }}>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold text-gray-800">Request Detail</h2>
                                        <span className="text-gray-600 font-medium">
                                            {viewDetailModal.request.type === 'EXTEND' ? 'Extend Assignment' :
                                                viewDetailModal.request.type === 'RELEASE' ? 'Release Assignment' :
                                                    viewDetailModal.request.type === 'ASSIGN' ? 'New Assignment' :
                                                        'New Project Submission'}
                                        </span>
                                    </div>
                                    <button onClick={() => setViewDetailModal({ show: false, request: null, isRejecting: false, reason: '' })} className="text-gray-500 hover:text-gray-700">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Common Content */}
                                <div className="space-y-4">
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-gray-500" />
                                            <span>Requester : <span className="font-bold">{viewDetailModal.request.requester}</span></span>
                                        </div>
                                        {viewDetailModal.request.type !== 'PROJECT' && (
                                            <div className="flex items-center gap-3">
                                                <User className="w-5 h-5 text-gray-500" />
                                                <span>Resource : <span className="font-bold">{viewDetailModal.request.resource}</span></span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <Folder className="w-5 h-5 text-gray-500" />
                                            <span>Project : <span className="font-bold">{viewDetailModal.request.projectName || viewDetailModal.request.project}</span></span>
                                        </div>
                                        {viewDetailModal.request.role && (
                                            <div className="flex items-center gap-3">
                                                <Users className="w-5 h-5 text-gray-500" />
                                                <span>Role : <span className="font-bold">{toTitleCase(viewDetailModal.request.role)}</span></span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-300 my-4"></div>

                                    {/* Specific Details */}
                                    {viewDetailModal.request.type === 'ASSIGN' && (
                                        <div className="mb-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Calendar className="w-5 h-5 text-gray-500" />
                                                <span className="font-bold text-gray-800">Assignment Period</span>
                                            </div>
                                            <div className="ml-8 space-y-1">
                                                <p className="text-gray-600">Start Date : {formatDate(viewDetailModal.request.startDate)}</p>
                                                <p className="text-gray-600">End Date : {formatDate(viewDetailModal.request.newEndDate)}</p>
                                            </div>
                                        </div>
                                    )}

                                    {(viewDetailModal.request.type === 'EXTEND' || viewDetailModal.request.type === 'RELEASE') && (
                                        <>
                                            <div className="mb-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Calendar className="w-5 h-5 text-gray-500" />
                                                    <span className="font-bold text-gray-800">Proposed Changes</span>
                                                </div>
                                                <div className="ml-8 space-y-1">
                                                    <p className="text-gray-600">Current End Date : {formatDate(viewDetailModal.request.currentEndDate)}</p>
                                                    <p className="text-gray-600">Requested New End : {formatDate(viewDetailModal.request.newEndDate)}</p>
                                                </div>
                                            </div>
                                            <div className="mb-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Bell className="w-5 h-5 text-gray-500" />
                                                    <span className="font-bold text-gray-800">Reason from DevMan</span>
                                                </div>
                                                <p className="ml-8 text-gray-600 italic">"{viewDetailModal.request.reason}"</p>
                                            </div>
                                        </>
                                    )}

                                    {viewDetailModal.request.type === 'PROJECT' && (
                                        <>
                                            <div className="mb-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Folder className="w-5 h-5 text-gray-500" />
                                                    <span className="font-bold text-gray-800">Project Profile</span>
                                                </div>
                                                <div className="ml-8 space-y-1">
                                                    <p className="text-gray-600">Client : <span className="font-bold">{viewDetailModal.request.clientName}</span></p>
                                                    <p className="text-gray-600">Description : <span className="font-medium italic">{viewDetailModal.request.description}</span></p>
                                                </div>
                                            </div>
                                            <div className="mb-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Users className="w-5 h-5 text-gray-500" />
                                                    <span className="font-bold text-gray-800">Resource Plan</span>
                                                </div>
                                                <div className="ml-8">
                                                    {viewDetailModal.request.resourcePlan && viewDetailModal.request.resourcePlan.map((item, index) => (
                                                        <div key={index} className="flex items-center gap-4 text-gray-600 mb-1 text-sm">
                                                            <span>{index + 1}. {item.name}</span>
                                                            <span className="font-bold">{toTitleCase(item.role)}</span>
                                                            <span>({formatDate(item.startDate)} - {formatDate(item.endDate)})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-6 mt-6" style={{ borderTop: '1px solid #D3D3D3' }}>
                                    <button
                                        onClick={() => setViewDetailModal({ show: false, request: null, isRejecting: false, reason: '' })}
                                        className="px-8 py-2 bg-gray-300 text-black font-bold rounded-lg hover:bg-gray-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setViewDetailModal(prev => ({ ...prev, isRejecting: true }))}
                                            className="px-6 py-2 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 transition-colors border border-red-200"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(viewDetailModal.request)}
                                            className="px-6 py-2 bg-green-100 text-green-600 font-bold rounded-lg hover:bg-green-200 transition-colors border border-green-200"
                                        >
                                            Approve Request
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Reject Reason Sidebar */}
                            {viewDetailModal.isRejecting && (
                                <div className="w-[400px] bg-[#F5F5F5] shadow-2xl rounded-3xl p-6 flex flex-col animate-scale-in border border-gray-200">
                                    <h3 className="text-2xl font-bold mb-2 text-center text-red-600">Decline Request</h3>
                                    <div className="border-b border-gray-300 mb-6 mt-4"></div>
                                    <div className="space-y-4">
                                        <p className="text-gray-600 font-medium">Please provide a reason for declining this request:</p>
                                        <textarea
                                            value={viewDetailModal.reason}
                                            onChange={(e) => setViewDetailModal(prev => ({ ...prev, reason: e.target.value }))}
                                            className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none shadow-sm"
                                            style={{ minHeight: '200px' }}
                                            placeholder="Enter reason..."
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-8 pt-6">
                                        <button
                                            onClick={() => setViewDetailModal(prev => ({ ...prev, isRejecting: false, reason: '' }))}
                                            className="flex-1 py-3 bg-gray-200 text-black rounded-xl font-bold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={submitDecline}
                                            disabled={!viewDetailModal.reason?.trim()}
                                            className={`flex-1 py-3 text-white rounded-xl font-bold ${!viewDetailModal.reason?.trim() ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'}`}
                                        >
                                            Confirm Decline
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminNotifications;
