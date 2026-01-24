import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import * as XLSX from 'xlsx';

const Activities = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('extend');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info', closing: false });
    const [rejectionModal, setRejectionModal] = useState({ show: false, reason: '' });

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

    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/requests/history');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching activities:', error);
            showNotification('Failed to fetch activities', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const extendData = requests.filter(r => r.type === 'EXTEND' || r.type === 'RELEASE');
    const releaseData = requests.filter(r => r.type === 'RELEASE'); // Actually EXTEND tab might handle both or separate?
    // Looking at the dummy data, extendData had both APPROVED and REJECTED but all were type? 
    // Wait, dummy data for release was just pointing to extendData.

    // Let's refine based on the tabs in the code:
    // Tab 1: Extend 
    // Tab 2: Release
    // Tab 3: Assignment
    // Tab 4: Project

    const filteredExtend = requests.filter(r => r.type === 'EXTEND');
    const filteredRelease = requests.filter(r => r.type === 'RELEASE');
    const filteredAssignment = requests.filter(r => r.type === 'ASSIGN');
    const filteredProject = requests.filter(r => r.type === 'PROJECT');

    const getStatusColor = (status) => {
        if (status === 'APPROVED') {
            return {
                bg: 'rgba(6, 208, 1, 0.15)',
                text: '#06D001',
                border: '#06D001'
            };
        } else if (status === 'REJECTED') {
            return {
                bg: 'rgba(255, 0, 0, 0.15)',
                text: '#FF0000',
                border: '#FF0000'
            };
        }
        return {
            bg: 'rgba(169, 169, 169, 0.15)',
            text: '#A9A9A9',
            border: '#A9A9A9'
        };
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
                        <svg className="w-5 h-5" fill="none" stroke="#06D001" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : notification.type === 'error' ? (
                        <svg className="w-5 h-5" fill="none" stroke="#FF0000" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="#00B4D8" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 ml-[267px] p-8">
                {/* Page Title */}
                <h1 className="text-4xl font-bold text-gray-800 mb-8">Activities</h1>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-8">
                    {/* Left: Tab Navigation */}
                    <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                        {['extend', 'release', 'assignment', 'project'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab
                                    ? 'bg-[#00B4D8] text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                style={{ fontFamily: 'SF Pro Display' }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExportLogHistory}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm group"
                            title="Export Log History"
                        >
                            <svg className="w-5 h-5 text-[#00B4D8] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg overflow-hidden">
                    {isLoading ? (
                        <div className="text-center py-12 text-gray-500 font-bold">Loading activities...</div>
                    ) : (
                        <>
                            {/* Extend Tab */}
                            {activeTab === 'extend' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">PERFORMER</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">PROJECT</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">RESOURCE</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">ROLE</th>
                                                <th className="text-center py-5 px-6 font-bold text-gray-700 text-xs">OLD END</th>
                                                <th className="text-center py-5 px-6 font-bold text-gray-700 text-xs">NEW END</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">DESCRIPTION</th>
                                                <th className="text-center py-5 px-6 font-bold text-gray-700 text-xs">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredExtend.length === 0 ? (
                                                <tr><td colSpan="7" className="text-center py-12 text-gray-400 font-medium">No extend activities found</td></tr>
                                            ) : (
                                                filteredExtend.map((item) => (
                                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-5 px-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-800 font-bold text-sm">{item.requester}</span>
                                                                <span className="text-gray-400 text-[10px]">{new Date(item.submittedDate).toLocaleString('id-ID')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-6 text-sm font-medium text-gray-600">{item.project}</td>
                                                        <td className="py-5 px-6 text-sm font-bold text-gray-800">{item.resource}</td>
                                                        <td className="py-5 px-6 text-sm text-gray-600">{item.role}</td>
                                                        <td className="py-5 px-6 text-center text-sm text-gray-500">{formatDateShort(item.currentEndDate)}</td>
                                                        <td className="py-5 px-6 text-center text-sm font-bold text-[#F97316]">{formatDateShort(item.newEndDate)}</td>
                                                        <td className="py-5 px-6 text-sm italic text-gray-500 max-w-[200px] truncate" title={item.reason}>{item.reason || '-'}</td>
                                                        <td className="py-5 px-6">
                                                            <div className="flex justify-center">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.status === 'REJECTED' ? 'cursor-pointer hover:opacity-80 transition-all' : ''}`}
                                                                    onClick={() => item.status === 'REJECTED' && setRejectionModal({ show: true, reason: item.rejectionReason || 'No reason provided.' })}
                                                                    style={{
                                                                        backgroundColor: getStatusColor(item.status).bg,
                                                                        color: getStatusColor(item.status).text,
                                                                        border: `1px solid ${getStatusColor(item.status).border}`
                                                                    }}
                                                                >
                                                                    {item.status}
                                                                </span>
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
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">PERFORMER</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">PROJECT</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">RESOURCE</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">ROLE</th>
                                                <th className="text-center py-5 px-6 font-bold text-gray-700 text-xs">RELEASE DATE</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">DESCRIPTION</th>
                                                <th className="text-center py-5 px-6 font-bold text-gray-700 text-xs">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRelease.length === 0 ? (
                                                <tr><td colSpan="6" className="text-center py-12 text-gray-400 font-medium">No release activities found</td></tr>
                                            ) : (
                                                filteredRelease.map((item) => (
                                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-5 px-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-800 font-bold text-sm">{item.requester}</span>
                                                                <span className="text-gray-400 text-[10px]">{new Date(item.submittedDate).toLocaleString('id-ID')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-6 text-sm font-medium text-gray-600">{item.project}</td>
                                                        <td className="py-5 px-6 text-sm font-bold text-gray-800">{item.resource}</td>
                                                        <td className="py-5 px-6 text-sm text-gray-600">{item.role}</td>
                                                        <td className="py-5 px-6 text-center text-sm font-bold text-red-500">{formatDateShort(item.newEndDate)}</td>
                                                        <td className="py-5 px-6 text-sm italic text-gray-500 max-w-[200px] truncate" title={item.reason}>{item.reason || '-'}</td>
                                                        <td className="py-5 px-6">
                                                            <div className="flex justify-center">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.status === 'REJECTED' ? 'cursor-pointer hover:opacity-80 transition-all' : ''}`}
                                                                    onClick={() => item.status === 'REJECTED' && setRejectionModal({ show: true, reason: item.rejectionReason || 'No reason provided.' })}
                                                                    style={{
                                                                        backgroundColor: getStatusColor(item.status).bg,
                                                                        color: getStatusColor(item.status).text,
                                                                        border: `1px solid ${getStatusColor(item.status).border}`
                                                                    }}
                                                                >
                                                                    {item.status}
                                                                </span>
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
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">PERFORMER</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">PROJECT</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">RESOURCE</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">ROLE</th>
                                                <th className="text-center py-5 px-6 font-bold text-gray-700 text-xs">PERIOD</th>
                                                <th className="text-center py-5 px-6 font-bold text-gray-700 text-xs">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAssignment.length === 0 ? (
                                                <tr><td colSpan="6" className="text-center py-12 text-gray-400 font-medium">No assignment activities found</td></tr>
                                            ) : (
                                                filteredAssignment.map((item) => (
                                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-5 px-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-800 font-bold text-sm">{item.requester}</span>
                                                                <span className="text-gray-400 text-[10px]">{new Date(item.submittedDate).toLocaleString('id-ID')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-6 text-sm font-medium text-gray-600">{item.project}</td>
                                                        <td className="py-5 px-6 text-sm font-bold text-gray-800">{item.resource}</td>
                                                        <td className="py-5 px-6 text-sm text-gray-600">{item.role}</td>
                                                        <td className="py-5 px-6 text-center text-sm font-medium text-gray-500">{formatDateShort(item.startDate)} - {formatDateShort(item.newEndDate)}</td>
                                                        <td className="py-5 px-6">
                                                            <div className="flex justify-center">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.status === 'REJECTED' ? 'cursor-pointer hover:opacity-80 transition-all' : ''}`}
                                                                    onClick={() => item.status === 'REJECTED' && setRejectionModal({ show: true, reason: item.rejectionReason || 'No reason provided.' })}
                                                                    style={{
                                                                        backgroundColor: getStatusColor(item.status).bg,
                                                                        color: getStatusColor(item.status).text,
                                                                        border: `1px solid ${getStatusColor(item.status).border}`
                                                                    }}
                                                                >
                                                                    {item.status}
                                                                </span>
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
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">PERFORMER</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">PROJECT NAME</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">CLIENT</th>
                                                <th className="text-left py-5 px-6 font-bold text-gray-700 text-xs">DESCRIPTION</th>
                                                <th className="text-center py-5 px-6 font-bold text-gray-700 text-xs">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredProject.length === 0 ? (
                                                <tr><td colSpan="5" className="text-center py-12 text-gray-400 font-medium">No project activities found</td></tr>
                                            ) : (
                                                filteredProject.map((item) => (
                                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-5 px-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-800 font-bold text-sm">{item.requester}</span>
                                                                <span className="text-gray-400 text-[10px]">{new Date(item.submittedDate).toLocaleString('id-ID')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-6 text-sm font-bold text-[#00B4D8]">{item.projectName}</td>
                                                        <td className="py-5 px-6 text-sm text-gray-600">{item.clientName}</td>
                                                        <td className="py-5 px-6 text-sm italic text-gray-500">{item.description || 'No description'}</td>
                                                        <td className="py-5 px-6">
                                                            <div className="flex justify-center">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.status === 'REJECTED' ? 'cursor-pointer hover:opacity-80 transition-all' : ''}`}
                                                                    onClick={() => item.status === 'REJECTED' && setRejectionModal({ show: true, reason: item.rejectionReason || 'No reason provided.' })}
                                                                    style={{
                                                                        backgroundColor: getStatusColor(item.status).bg,
                                                                        color: getStatusColor(item.status).text,
                                                                        border: `1px solid ${getStatusColor(item.status).border}`
                                                                    }}
                                                                >
                                                                    {item.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Rejection Reason Modal */}
            {rejectionModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 transition-all animate-fade-in">
                    <div className="bg-white rounded-2xl p-8 w-[450px] shadow-2xl animate-scale-in relative border border-red-100">
                        <button
                            onClick={() => setRejectionModal({ show: false, reason: '' })}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Rejection Reason</h2>
                            <p className="text-gray-500 text-sm mb-6 px-4">This request was declined by the administrator.</p>

                            <div className="w-full bg-gray-50 rounded-xl p-6 border border-gray-100 text-left">
                                <p className="text-gray-700 italic leading-relaxed font-medium">
                                    "{rejectionModal.reason}"
                                </p>
                            </div>

                            <button
                                onClick={() => setRejectionModal({ show: false, reason: '' })}
                                className="mt-8 w-full py-3 bg-[#00B4D8] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
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

export default Activities;
