import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

const DevmanActivities = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('extend');
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info', closing: false });
    const [reasonModal, setReasonModal] = useState({ show: false, reason: '' });

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            console.log('Fetching Devman activities...');
            const response = await api.get('/requests/history');
            console.log('Devman Activities API Response:', response.data);

            // Ensure response.data is an array
            if (Array.isArray(response.data)) {
                setActivities(response.data);
            } else {
                console.warn('API returned non-array data for Devman activities:', response.data);
                setActivities([]);
            }
        } catch (error) {
            console.error('Error fetching Devman activities:', error);
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

    const getStatusColor = (status) => {
        if (status === 'APPROVED') {
            return {
                bg: 'rgba(6, 208, 1, 0.2)',
                text: '#06D001',
                border: '#06D001'
            };
        } else if (status === 'REJECTED') {
            return {
                bg: 'rgba(255, 0, 0, 0.2)',
                text: '#FF0000',
                border: '#FF0000'
            };
        } else if (status === 'PENDING') {
            return {
                bg: 'rgba(251, 205, 63, 0.2)', // #FBCD3F with 20% opacity
                text: '#FBCD3F',
                border: '#FBCD3F'
            };
        }
        return {
            bg: 'rgba(169, 169, 169, 0.2)',
            text: '#A9A9A9',
            border: '#A9A9A9'
        };
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
                        <svg className="w-5 h-5" fill="none" stroke="#06D001" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    ) : notification.type === 'error' ? (
                        <svg className="w-5 h-5" fill="none" stroke="#FF0000" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="#00B4D8" style={{ color: '#00B4D8' }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    <span className="font-bold" style={{ color: notification.type === 'success' ? '#06D001' : notification.type === 'error' ? '#FF0000' : '#00B4D8', fontSize: '14px' }}>
                        {notification.message}
                    </span>
                    <button onClick={closeNotification} className="ml-2 hover:opacity-70 transition-opacity" style={{ color: notification.type === 'success' ? '#06D001' : notification.type === 'error' ? '#FF0000' : '#00B4D8' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 ml-[267px] p-8">
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

                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg overflow-hidden">
                    {/* Extend Tab */}
                    {activeTab === 'extend' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#CAF0F8]">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Requester</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Project</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Resource Name</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Role</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Old End Date</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>New End Date</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Description</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.filter(a => a.type === 'EXTEND').length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-4 text-gray-500">No activities found</td>
                                        </tr>
                                    ) : (
                                        activities.filter(a => a.type === 'EXTEND').map((item) => (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-[#00B4D8] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-gray-800 italic" style={{ fontSize: '14px' }}>{item.reason}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <span
                                                            className="px-3 py-1 rounded-full font-semibold"
                                                            style={{
                                                                fontSize: '12px',
                                                                backgroundColor: getStatusColor(item.status).bg,
                                                                color: getStatusColor(item.status).text,
                                                                border: `1px solid ${getStatusColor(item.status).border}`
                                                            }}
                                                        >
                                                            {item.status}
                                                        </span>
                                                        {item.status === 'REJECTED' && (
                                                            <button
                                                                onClick={() => setReasonModal({ show: true, reason: item.reason || 'No reason provided' })}
                                                                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                                                title="View Rejection Reason"
                                                            >
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#CAF0F8]">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Requester</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Project</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Resource Name</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Role</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Old End Date</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>New End Date</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Description</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.filter(a => a.type === 'RELEASE').length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-4 text-gray-500">No activities found</td>
                                        </tr>
                                    ) : (
                                        activities.filter(a => a.type === 'RELEASE').map((item) => (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-[#00B4D8] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-gray-800 italic" style={{ fontSize: '14px' }}>{item.reason}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <span
                                                            className="px-3 py-1 rounded-full font-semibold"
                                                            style={{
                                                                fontSize: '12px',
                                                                backgroundColor: getStatusColor(item.status).bg,
                                                                color: getStatusColor(item.status).text,
                                                                border: `1px solid ${getStatusColor(item.status).border}`
                                                            }}
                                                        >
                                                            {item.status}
                                                        </span>
                                                        {item.status === 'REJECTED' && (
                                                            <button
                                                                onClick={() => setReasonModal({ show: true, reason: item.reason || 'No reason provided' })}
                                                                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                                                title="View Rejection Reason"
                                                            >
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#CAF0F8]">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Requester</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Project</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Resource Name</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Role</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Start Date</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>End Date</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.filter(a => a.type === 'ASSIGN').length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4 text-gray-500">No activities found</td>
                                        </tr>
                                    ) : (
                                        activities.filter(a => a.type === 'ASSIGN').map((item) => (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                                                        <span
                                                            className="px-3 py-1 rounded-full font-semibold"
                                                            style={{
                                                                fontSize: '12px',
                                                                backgroundColor: getStatusColor(item.status).bg,
                                                                color: getStatusColor(item.status).text,
                                                                border: `1px solid ${getStatusColor(item.status).border}`
                                                            }}
                                                        >
                                                            {item.status}
                                                        </span>
                                                        {item.status === 'REJECTED' && (
                                                            <button
                                                                onClick={() => setReasonModal({ show: true, reason: item.reason || 'No reason provided' })}
                                                                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                                                title="View Rejection Reason"
                                                            >
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#CAF0F8]">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Requester</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Nama Project</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Nama Client</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Description</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.filter(a => a.type === 'PROJECT').length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4 text-gray-500">No activities found</td>
                                        </tr>
                                    ) : (
                                        activities.filter(a => a.type === 'PROJECT').map((item) => (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-[#00B4D8] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-gray-800 italic" style={{ fontSize: '14px' }}>{item.description}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <span
                                                            className="px-3 py-1 rounded-full font-semibold"
                                                            style={{
                                                                fontSize: '12px',
                                                                backgroundColor: getStatusColor(item.status).bg,
                                                                color: getStatusColor(item.status).text,
                                                                border: `1px solid ${getStatusColor(item.status).border}`
                                                            }}
                                                        >
                                                            {item.status}
                                                        </span>
                                                        {item.status === 'REJECTED' && (
                                                            <button
                                                                onClick={() => setReasonModal({ show: true, reason: item.reason || 'No reason provided' })}
                                                                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                                                title="View Rejection Reason"
                                                            >
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
            {/* Rejection Reason Modal */}
            {reasonModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl p-6 w-[400px] animate-scale-in relative">
                        <button
                            onClick={() => setReasonModal({ show: false, reason: '' })}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Rejection Reason</h3>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-gray-700 italic">
                            "{reasonModal.reason}"
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setReasonModal({ show: false, reason: '' })}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold"
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

export default DevmanActivities;
