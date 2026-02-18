import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import api from '../utils/api';
import * as XLSX from 'xlsx';

const Activities = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('extend');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info', closing: false });
    const [statusFilter, setStatusFilter] = useState('PENDING');

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type, closing: false });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, closing: true }));
            setTimeout(() => {
                setNotification({ show: false, message: '', type: 'info', closing: false });
            }, 300);
        }, 4000);
    };

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, closing: true }));
        setTimeout(() => {
            setNotification({ show: false, message: '', closing: false });
        }, 300);
    };

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reasonModal, setReasonModal] = useState({ show: false, reason: '' });

    useEffect(() => {
        fetchActivities();
    }, []);

    // Scroll locking for modal
    useEffect(() => {
        if (reasonModal.show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [reasonModal.show]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            console.log('Fetching activities...');
            const response = await api.get('/requests/history');
            console.log('Activities API Response:', response.data);

            // Ensure response.data is an array
            if (Array.isArray(response.data)) {
                setActivities(response.data);
            } else {
                console.warn('API returned non-array data for activities:', response.data);
                setActivities([]);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
            showNotification('Failed to fetch activities', 'error');
            setActivities([]); // Fallback to empty array on error
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB');
    };



    const handleExportLogHistory = async () => {
        try {
            const response = await api.get('/history-logs');
            const logs = response.data;

            // Define headers
            const headers = [
                'Entity Type',
                'Activity Type',
                'Project',
                'Resource',
                'Role',
                'Assignment Period',
                'Description',
                'Performed By',
                'Timestamp'
            ];

            const exportData = logs.map(log => ({
                'Entity Type': log.entityType || '',
                'Activity Type': log.activityType || '',
                'Project': log.projectName || '',
                'Resource': log.resourceName || '',
                'Role': log.resourceRole || '',
                'Assignment Period': log.assignmentStartDate && log.assignmentEndDate
                    ? `${new Date(log.assignmentStartDate).toLocaleDateString('en-GB')} - ${new Date(log.assignmentEndDate).toLocaleDateString('en-GB')}`
                    : '',
                'Description': log.description || '',
                'Performed By': log.performedBy || '',
                'Timestamp': log.timestamp ? new Date(log.timestamp).toLocaleString('en-GB') : ''
            }));

            // Create worksheet with headers even if data is empty
            const worksheet = XLSX.utils.json_to_sheet(exportData, { header: headers });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Log');

            const columnWidths = [
                { wch: 15 }, // Entity Type
                { wch: 20 }, // Activity Type
                { wch: 30 }, // Project
                { wch: 25 }, // Resource
                { wch: 20 }, // Role
                { wch: 25 }, // Assignment Period
                { wch: 50 }, // Description
                { wch: 20 }, // Performed By
                { wch: 20 }  // Timestamp
            ];
            worksheet['!cols'] = columnWidths;

            const fileName = `Activity_Log_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            showNotification('Export successful! File downloaded.', 'success');
        } catch (error) {
            console.error('Error exporting log history:', error);
            showNotification('Failed to export log history', 'error');
        }
    };

    return (
        <div className="flex min-h-screen bg-[#E6F2F1] font-['SF_Pro_Display']">
            {/* Notification Toast */}
            <Toast
                show={notification.show}
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
                closing={notification.closing}
            />

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 ml-[267px] flex flex-col h-screen overflow-hidden bg-[#E6F2F1]">
                <div className="p-8 pb-4">
                    {/* Page Title */}
                    <h1 className="text-4xl font-bold text-gray-800 mb-8">Activities</h1>

                    {/* Tab Navigation */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex bg-[#F5F5F5] rounded-lg p-1">
                                <button
                                    onClick={() => setActiveTab('extend')}
                                    className={`px-8 py-3 font-sf font-bold text-base transition-all duration-200 rounded-lg flex items-center gap-2 ${activeTab === 'extend'
                                        ? 'bg-white text-black'
                                        : 'text-black hover:bg-gray-200'
                                        }`}
                                >
                                    Extend
                                </button>
                                <button
                                    onClick={() => setActiveTab('release')}
                                    className={`px-8 py-3 font-sf font-bold text-base transition-all duration-200 rounded-lg flex items-center gap-2 ${activeTab === 'release'
                                        ? 'bg-white text-black'
                                        : 'text-black hover:bg-gray-200'
                                        }`}
                                >
                                    Release
                                </button>
                                <button
                                    onClick={() => setActiveTab('assignment')}
                                    className={`px-8 py-3 font-sf font-bold text-base transition-all duration-200 rounded-lg flex items-center gap-2 ${activeTab === 'assignment'
                                        ? 'bg-white text-black'
                                        : 'text-black hover:bg-gray-200'
                                        }`}
                                >
                                    Assignment
                                </button>
                                <button
                                    onClick={() => setActiveTab('project')}
                                    className={`px-8 py-3 font-sf font-bold text-base transition-all duration-200 rounded-lg flex items-center gap-2 ${activeTab === 'project'
                                        ? 'bg-white text-black'
                                        : 'text-black hover:bg-gray-200'
                                        }`}
                                >
                                    Project
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] font-bold text-gray-700"
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                                <button
                                    onClick={handleExportLogHistory}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] rounded-lg text-black hover:bg-gray-200 transition-colors font-sf font-bold text-sm"
                                >
                                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export Log History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="px-8 pb-8 flex-1 flex flex-col min-h-0">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                        {/* Extend Tab */}
                        {activeTab === 'extend' && (
                            <div className="overflow-y-auto custom-scrollbar flex-1" style={{ maxHeight: 'inherit' }}>
                                <table className="w-full relative">
                                    <thead className="sticky top-0 z-10 bg-[#CAF0F8] shadow-sm">
                                        <tr>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Requester</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Project</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Resource Name</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Role</th>
                                            <th className="text-center py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Old End Date</th>
                                            <th className="text-center py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>New End Date</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Description</th>
                                            <th className="text-center py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.filter(a => a.type === 'EXTEND' && (statusFilter === 'ALL' || a.status === statusFilter)).length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4 text-gray-500">No activities found</td>
                                            </tr>
                                        ) : (
                                            activities.filter(a => a.type === 'EXTEND' && (statusFilter === 'ALL' || a.status === statusFilter)).map((item, index) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b border-gray-200 hover:bg-[#CAF0F8]/30 transition-colors bg-white"
                                                >
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.requester}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.project}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.resource}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.role}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{formatDate(item.currentEndDate)}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{formatDate(item.newEndDate)}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800 italic" style={{ fontSize: '14px' }}>{item.reason}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <StatusBadge status={item.status} className="px-3 py-1 font-semibold text-xs" />
                                                            {item.status === 'REJECTED' && (
                                                                <button
                                                                    onClick={() => setReasonModal({ show: true, reason: item.adminReason || item.rejectionReason || item.rejectReason || 'No reason provided' })}
                                                                    className="text-[#00B4D8] hover:text-[#0096B4] focus:outline-none"
                                                                    title="View Rejection Reason"
                                                                >
                                                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Release Tab */}
                        {activeTab === 'release' && (
                            <div className="overflow-y-auto custom-scrollbar flex-1" style={{ maxHeight: 'inherit' }}>
                                <table className="w-full relative">
                                    <thead className="sticky top-0 z-10 bg-[#CAF0F8] shadow-sm">
                                        <tr>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Requester</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Project</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Resource Name</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Role</th>
                                            <th className="text-center py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Old End Date</th>
                                            <th className="text-center py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>New End Date</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Description</th>
                                            <th className="text-center py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.filter(a => a.type === 'RELEASE' && (statusFilter === 'ALL' || a.status === statusFilter)).length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4 text-gray-500">No activities found</td>
                                            </tr>
                                        ) : (
                                            activities.filter(a => a.type === 'RELEASE' && (statusFilter === 'ALL' || a.status === statusFilter)).map((item, index) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b border-gray-200 hover:bg-[#CAF0F8]/30 transition-colors bg-white"
                                                >
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.requester}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.project}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.resource}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.role}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{formatDate(item.currentEndDate)}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{formatDate(item.newEndDate)}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800 italic" style={{ fontSize: '14px' }}>{item.reason}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <StatusBadge status={item.status} className="px-3 py-1 font-semibold text-xs" />
                                                            {item.status === 'REJECTED' && (
                                                                <button
                                                                    onClick={() => setReasonModal({ show: true, reason: item.adminReason || item.rejectionReason || item.rejectReason || 'No reason provided' })}
                                                                    className="text-[#00B4D8] hover:text-[#0096B4] focus:outline-none"
                                                                    title="View Rejection Reason"
                                                                >
                                                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Assignment Tab */}
                        {activeTab === 'assignment' && (
                            <div className="overflow-y-auto custom-scrollbar flex-1" style={{ maxHeight: 'inherit' }}>
                                <table className="w-full relative">
                                    <thead className="sticky top-0 z-10 bg-[#CAF0F8] shadow-sm">
                                        <tr>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Requester</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Project</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Assignment</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Role</th>
                                            <th className="text-center py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Start Date</th>
                                            <th className="text-center py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>End Date</th>
                                            <th className="text-center py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.filter(a => a.type === 'ASSIGN' && (statusFilter === 'ALL' || a.status === statusFilter)).length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4 text-gray-500">No activities found</td>
                                            </tr>
                                        ) : (
                                            activities.filter(a => a.type === 'ASSIGN' && (statusFilter === 'ALL' || a.status === statusFilter)).map((item, index) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b border-gray-200 hover:bg-[#CAF0F8]/30 transition-colors bg-white"
                                                >
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.requester}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.project}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.resource}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.role}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{formatDate(item.startDate)}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{formatDate(item.newEndDate)}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <StatusBadge status={item.status} className="px-3 py-1 font-semibold text-xs" />
                                                            {item.status === 'REJECTED' && (
                                                                <button
                                                                    onClick={() => setReasonModal({ show: true, reason: item.adminReason || item.rejectionReason || item.rejectReason || 'No reason provided' })}
                                                                    className="text-[#00B4D8] hover:text-[#0096B4] focus:outline-none"
                                                                    title="View Rejection Reason"
                                                                >
                                                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Project Tab */}
                        {activeTab === 'project' && (
                            <div className="overflow-y-auto custom-scrollbar flex-1" style={{ maxHeight: 'inherit' }}>
                                <table className="w-full relative">
                                    <thead className="sticky top-0 z-10 bg-[#CAF0F8] shadow-sm">
                                        <tr>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Requester</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Nama Project</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Nama Client</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Description</th>
                                            <th className="text-center py-4 px-6 font-bold text-gray-700 bg-[#CAF0F8]" style={{ fontSize: '16px' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.filter(a => a.type === 'PROJECT' && (statusFilter === 'ALL' || a.status === statusFilter)).length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4 text-gray-500">No activities found</td>
                                            </tr>
                                        ) : (
                                            activities.filter(a => a.type === 'PROJECT' && (statusFilter === 'ALL' || a.status === statusFilter)).map((item, index) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b border-gray-200 hover:bg-[#CAF0F8]/30 transition-colors bg-white"
                                                >
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.requester}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.projectName}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.clientName}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-gray-800 italic" style={{ fontSize: '14px' }}>{item.description}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <StatusBadge status={item.status} className="px-3 py-1 font-semibold text-xs" />
                                                            {item.status === 'REJECTED' && (
                                                                <button
                                                                    onClick={() => setReasonModal({ show: true, reason: item.adminReason || item.rejectionReason || item.rejectReason || 'No reason provided' })}
                                                                    className="text-[#00B4D8] hover:text-[#0096B4] focus:outline-none"
                                                                    title="View Rejection Reason"
                                                                >
                                                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Rejection Reason Modal */}
            {reasonModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-[500px] shadow-2xl animate-scale-in overflow-hidden">
                        {/* Header with Red Background */}
                        <div className="bg-red-50 p-6 flex flex-col items-center justify-center border-b border-red-100">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Request Rejected</h3>
                            <p className="text-gray-500 mt-2 text-center text-sm" style={{ fontFamily: 'SF Pro Display' }}>
                                This request was rejected with the following reason.
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 font-sf">Rejection Reason</h4>
                                <p className="text-gray-700 text-lg leading-relaxed italic" style={{ fontFamily: 'SF Pro Display' }}>
                                    "{reasonModal.reason}"
                                </p>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => setReasonModal({ show: false, reason: '' })}
                                    className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                    style={{ fontFamily: 'SF Pro Display' }}
                                >
                                    <span>Dismiss Message</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Activities;
