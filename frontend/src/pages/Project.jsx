import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import { Search, Users, Trash2, X, Calendar } from 'lucide-react';

const Project = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [pmList, setPmList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    // Modal states
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [newProject, setNewProject] = useState({
        projectName: '',
        clientName: '',
        pmId: ''
    });

    const [availableResources, setAvailableResources] = useState([]);
    const [projectProposal, setProjectProposal] = useState({
        projectName: '',
        clientName: '',
        description: '',
        resourcePlan: []
    });

    // Notification state
    const [notification, setNotification] = useState({ show: false, message: '', closing: false, type: 'success' });

    const filterTabs = ['All', 'Ongoing', 'Hold', 'Closed'];

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!token || !storedUser) {
            navigate('/');
            return;
        }

        setUser(JSON.parse(storedUser));
        fetchProjects();
        fetchPmList();
        fetchAvailableResources();
    }, [navigate]);

    const fetchAvailableResources = async () => {
        try {
            const response = await api.get('/resources');
            // Support filtering only available or showing all for proposal? 
            // User said "sesuai dengan daftar resource". I'll show all and maybe label them.
            setAvailableResources(response.data);
        } catch (error) {
            console.error('Error fetching resources:', error);
        }
    };

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            showNotification('Failed to fetch projects', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchPmList = async () => {
        try {
            const response = await api.get('/users/pms');
            setPmList(response.data);
        } catch (error) {
            console.error('Error fetching PM list:', error);
        }
    };

    // Detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectResources, setProjectResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);

    const fetchProjectResources = async (projectId) => {
        try {
            setLoadingResources(true);
            const response = await api.get(`/projects/${projectId}/resources`);
            setProjectResources(response.data);
        } catch (error) {
            console.error('Error fetching project resources:', error);
            showNotification('Failed to fetch project resources', 'error');
        } finally {
            setLoadingResources(false);
        }
    };

    // Extend/Release Action states
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [selectedResourceForAction, setSelectedResourceForAction] = useState(null);
    const [actionDate, setActionDate] = useState('');
    const [actionReason, setActionReason] = useState('');

    const handleOpenExtendModal = (resource) => {
        setSelectedResourceForAction(resource);
        setActionDate('');
        setActionReason('');
        setShowReleaseModal(false);
        setShowExtendModal(true);
    };

    const handleOpenReleaseModal = (resource) => {
        setSelectedResourceForAction(resource);
        setActionDate(new Date().toISOString().split('T')[0]); // Default today
        setActionReason('');
        setShowExtendModal(false);
        setShowReleaseModal(true);
    };

    const handleExtendSubmit = async () => {
        if (!actionDate || !actionReason) {
            showNotification('Please fill all fields', 'error');
            return;
        }

        try {
            await api.post('/assignments/extend', {
                assignmentId: selectedResourceForAction.assignmentId,
                newEndDate: actionDate,
                reason: actionReason
            });
            showNotification('Assignment extended successfully!', 'success');
            setShowExtendModal(false);
            fetchProjectResources(selectedProject.projectId); // Refresh list
        } catch (error) {
            console.error('Error extending assignment:', error);
            const errorMsg = error.response?.data?.message || 'Failed to extend assignment';
            showNotification(errorMsg, 'error');
        }
    };

    const handleReleaseSubmit = async () => {
        // Validation only for reason now, since date is automatic
        if (!actionReason) {
            showNotification('Please provide a reason for release', 'error');
            return;
        }

        try {
            await api.post('/assignments/release', {
                assignmentId: selectedResourceForAction.assignmentId,
                releaseDate: actionDate, // This is set to today by default in handleOpenReleaseModal
                reason: actionReason
            });
            showNotification('Assignment released successfully!', 'success');
            setShowReleaseModal(false);
            fetchProjectResources(selectedProject.projectId); // Refresh list
        } catch (error) {
            console.error('Error releasing assignment:', error);
            const errorMsg = error.response?.data?.message || 'Failed to release assignment';
            showNotification(errorMsg, 'error');
        }
    };

    const handleViewDetail = (project) => {
        setSelectedProject(project);
        setShowDetailModal(true);
        setShowExtendModal(false);
        setShowReleaseModal(false);
        fetchProjectResources(project.projectId);
    };

    const handleExport = () => {
        const dataToExport = projects.map(project => ({
            'Project Name': project.projectName,
            'Client': project.clientName,
            'PM': project.pmName,
            'Status': project.status
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, "Projects");
        XLSX.writeFile(wb, "Projects_Data.xlsx");
        showNotification('Project data exported successfully!', 'success');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

    const handleProposeProject = async () => {
        if (!projectProposal.projectName.trim() || !projectProposal.clientName.trim() || projectProposal.resourcePlan.length === 0) {
            showNotification('Please fill project details and add at least one resource', 'error');
            return;
        }

        try {
            await api.post('/requests/project', projectProposal);
            setShowNewProjectModal(false);
            setProjectProposal({ projectName: '', clientName: '', description: '', resourcePlan: [] });
            showNotification('Project proposal submitted successfully!', 'success');
        } catch (error) {
            console.error('Error proposing project:', error);
            showNotification('Failed to submit project proposal', 'error');
        }
    };

    const addResourceToPlan = () => {
        setProjectProposal({
            ...projectProposal,
            resourcePlan: [
                ...projectProposal.resourcePlan,
                { resourceId: '', role: '', startDate: '', endDate: '' }
            ]
        });
    };

    const removeResourceFromPlan = (index) => {
        const newPlan = [...projectProposal.resourcePlan];
        newPlan.splice(index, 1);
        setProjectProposal({ ...projectProposal, resourcePlan: newPlan });
    };

    const updateResourcePlanItem = (index, field, value) => {
        const newPlan = [...projectProposal.resourcePlan];
        newPlan[index][field] = value;
        setProjectProposal({ ...projectProposal, resourcePlan: newPlan });
    };

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'ON_GOING':
                return {
                    backgroundColor: 'rgba(6, 208, 1, 0.2)',
                    color: '#06D001',
                    border: 'none'
                };
            case 'HOLD':
                return {
                    backgroundColor: 'rgba(251, 205, 63, 0.2)',
                    color: '#FBCD3F',
                    border: 'none'
                };
            case 'CLOSED':
                return {
                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                    color: '#FF0000',
                    border: 'none'
                };
            default:
                return {
                    backgroundColor: 'rgba(0, 180, 216, 0.2)',
                    color: '#00B4D8',
                    border: 'none'
                };
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ON_GOING':
                return 'ONGOING';
            case 'HOLD':
                return 'HOLD';
            case 'CLOSED':
                return 'CLOSED';
            default:
                return status;
        }
    };

    const filterProjects = () => {
        let filtered = projects;

        // Filter by status
        if (activeFilter !== 'All') {
            const statusMap = {
                'Ongoing': 'ON_GOING',
                'Hold': 'HOLD',
                'Closed': 'CLOSED'
            };
            filtered = filtered.filter(p => p.status === statusMap[activeFilter]);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.projectName.toLowerCase().includes(query) ||
                p.clientName.toLowerCase().includes(query) ||
                p.pmName.toLowerCase().includes(query)
            );
        }

        return filtered;
    };

    const filteredProjects = filterProjects();

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

            {/* Detail Modal & Action Modals Container */}
            {showDetailModal && selectedProject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    {/* Main Detail Model */}
                    <div
                        className={`bg-white rounded-2xl p-8 relative transition-transform duration-300 ease-in-out ${showExtendModal || showReleaseModal ? '-translate-x-[20%]' : ''
                            }`}
                        style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto' }}
                    >
                        <button
                            onClick={() => {
                                setShowDetailModal(false);
                                setShowExtendModal(false);
                                setShowReleaseModal(false);
                            }}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>
                                {selectedProject.projectName}
                            </h2>
                            <span
                                className="text-xs px-3 py-1 rounded-full font-bold"
                                style={getStatusBadgeStyle(selectedProject.status)}
                            >
                                {getStatusLabel(selectedProject.status)}
                            </span>
                        </div>

                        <div className="flex gap-8 mb-6 text-gray-500 font-medium" style={{ fontFamily: 'SF Pro Display' }}>
                            <p>Client Name : <span className="text-gray-700 font-bold">{selectedProject.clientName}</span></p>
                            <p>DevMan : <span className="text-gray-700 font-bold">{selectedProject.pmName}</span></p>
                        </div>

                        <div className="border-t border-gray-200 my-6"></div>

                        <h3 className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: 'SF Pro Display' }}>
                            Assigned Resources
                        </h3>

                        {loadingResources ? (
                            <div className="text-center py-8 text-gray-500">Loading resources...</div>
                        ) : projectResources.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                No resources assigned to this project yet.
                            </div>
                        ) : (
                            <div className="bg-[#E6F2F1] rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left">
                                            <th className="px-6 py-4 font-bold text-gray-800">Name</th>
                                            <th className="px-6 py-4 font-bold text-gray-800 text-center">Period</th>
                                            <th className="px-6 py-4 font-bold text-gray-800 text-center">Status</th>
                                            <th className="px-6 py-4 font-bold text-gray-800 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {projectResources.map((resource, index) => (
                                            <tr key={index} className="border-b border-gray-100 last:border-none">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800">{resource.resourceName}</div>
                                                    <div className="text-gray-500 text-sm">{resource.role}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold">
                                                    {formatDate(resource.startDate)} - {formatDate(resource.endDate)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className="text-xs px-3 py-1 rounded-full font-bold inline-block"
                                                        style={getStatusBadgeStyle(resource.status)}
                                                    >
                                                        {getStatusLabel(resource.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${resource.status !== 'ACTIVE' && resource.status !== 'ASSIGNED' ? 'opacity-50 cursor-not-allowed' : ''
                                                                }`}
                                                            style={{ backgroundColor: 'rgba(251, 205, 63, 0.2)', color: '#FBCD3F' }}
                                                            disabled={resource.status !== 'ACTIVE' && resource.status !== 'ASSIGNED'}
                                                            onClick={() => handleOpenExtendModal(resource)}
                                                        >
                                                            EXTEND
                                                        </button>
                                                        <button
                                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${resource.status !== 'ACTIVE' && resource.status !== 'ASSIGNED' ? 'opacity-50 cursor-not-allowed' : ''
                                                                }`}
                                                            style={{ backgroundColor: 'rgba(255, 0, 0, 0.2)', color: '#FF0000' }}
                                                            disabled={resource.status !== 'ACTIVE' && resource.status !== 'ASSIGNED'}
                                                            onClick={() => handleOpenReleaseModal(resource)}
                                                        >
                                                            RELEASE
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Extend Modal (Side) */}
                    <div
                        className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-60 transform transition-transform duration-300 ease-in-out rounded-l-2xl ${showExtendModal ? 'translate-x-0' : 'translate-x-full'
                            }`}
                        style={{ zIndex: 60 }}
                    >
                        {selectedResourceForAction && (
                            <div className="p-8 h-full overflow-y-auto">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: 'SF Pro Display' }}>
                                    Extend Assignment
                                </h3>
                                <div className="border-b border-gray-200 mb-4"></div>

                                <div className="mb-4 text-sm">
                                    <p className="flex justify-between mb-2">
                                        <span className="font-bold">Resource</span>
                                        <span>: {selectedResourceForAction.resourceName}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="font-bold">Current Date</span>
                                        <span>: {formatDate(selectedResourceForAction.endDate)}</span>
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">New End Date</label>
                                        <input
                                            type="date"
                                            value={actionDate}
                                            onChange={(e) => setActionDate(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Extension</label>
                                        <textarea
                                            rows="4"
                                            value={actionReason}
                                            onChange={(e) => setActionReason(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                                            placeholder="Enter reason..."
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        onClick={() => setShowExtendModal(false)}
                                        className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleExtendSubmit}
                                        className="px-6 py-2 text-white rounded-lg font-bold bg-[#0057FF] hover:opacity-90 transition-colors"
                                    >
                                        Confirm Extension
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Release Modal (Side) */}
                    <div
                        className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-60 transform transition-transform duration-300 ease-in-out rounded-l-2xl ${showReleaseModal ? 'translate-x-0' : 'translate-x-full'
                            }`}
                        style={{ zIndex: 60 }}
                    >
                        {selectedResourceForAction && (
                            <div className="p-8 h-full overflow-y-auto">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: 'SF Pro Display' }}>
                                    Release Assignment
                                </h3>

                                <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
                                    <p className="flex justify-between mb-2">
                                        <span className="font-bold text-gray-600">Resource</span>
                                        <span className="font-medium text-gray-900">{selectedResourceForAction.resourceName}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="font-bold text-gray-600">Current End Date</span>
                                        <span className="font-medium text-gray-900">{formatDate(selectedResourceForAction.endDate)}</span>
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* Date input removed as per feedback */}
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                        Resource will be released effective <strong>today ({new Date().toLocaleDateString('id-ID')})</strong>.
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Release</label>
                                        <textarea
                                            rows="4"
                                            value={actionReason}
                                            onChange={(e) => setActionReason(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                                            placeholder="Enter reason for early release..."
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        onClick={() => setShowReleaseModal(false)}
                                        className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReleaseSubmit}
                                        className="px-6 py-2 text-white rounded-lg font-bold bg-[#FF0000] hover:opacity-90 transition-colors"
                                    >
                                        Confirm Release
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* New Project Modal (Admin) or Propose Project Modal (PM) */}
            {showNewProjectModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    {user.userType === 'ADMIN' ? (
                        <div
                            className="bg-white rounded-2xl p-6"
                            style={{ width: '500px' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>
                                    New Project
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowNewProjectModal(false);
                                        setNewProject({ projectName: '', clientName: '', pmId: '' });
                                    }}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'SF Pro Display' }}>
                                            Project Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newProject.projectName}
                                            onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                                            style={{ fontFamily: 'SF Pro Display' }}
                                            placeholder="Enter project name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'SF Pro Display' }}>
                                            Client Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newProject.clientName}
                                            onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                                            style={{ fontFamily: 'SF Pro Display' }}
                                            placeholder="Enter client name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'SF Pro Display' }}>
                                        DevMan Name
                                    </label>
                                    <select
                                        value={newProject.pmId}
                                        onChange={(e) => setNewProject({ ...newProject, pmId: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] bg-white"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    >
                                        <option value="">Select DevMan</option>
                                        {pmList.map((pm) => (
                                            <option key={pm.userId} value={pm.userId}>
                                                {pm.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowNewProjectModal(false);
                                        setNewProject({ projectName: '', clientName: '', pmId: '' });
                                    }}
                                    className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                                    style={{ fontFamily: 'SF Pro Display' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-bold"
                                    style={{ backgroundColor: '#00B4D8', fontFamily: 'SF Pro Display' }}
                                >
                                    Save Project
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="bg-white rounded-2xl p-8"
                            style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>
                                    Propose New Project
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowNewProjectModal(false);
                                        setProjectProposal({ projectName: '', clientName: '', description: '', resourcePlan: [] });
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'SF Pro Display' }}>
                                            Project Name
                                        </label>
                                        <input
                                            type="text"
                                            value={projectProposal.projectName}
                                            onChange={(e) => setProjectProposal({ ...projectProposal, projectName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5D5FEF] transition-all"
                                            style={{ fontFamily: 'SF Pro Display' }}
                                            placeholder="Enter project name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'SF Pro Display' }}>
                                            Client Name
                                        </label>
                                        <input
                                            type="text"
                                            value={projectProposal.clientName}
                                            onChange={(e) => setProjectProposal({ ...projectProposal, clientName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5D5FEF] transition-all"
                                            style={{ fontFamily: 'SF Pro Display' }}
                                            placeholder="Enter client name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'SF Pro Display' }}>
                                        Description
                                    </label>
                                    <textarea
                                        value={projectProposal.description}
                                        onChange={(e) => setProjectProposal({ ...projectProposal, description: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5D5FEF] transition-all resize-none"
                                        style={{ fontFamily: 'SF Pro Display', height: '100px' }}
                                        placeholder="Add project description..."
                                    />
                                </div>

                                {/* Resource Plan */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>
                                            Required Resources
                                        </h3>
                                        <button
                                            onClick={addResourceToPlan}
                                            className="flex items-center gap-1 text-[#5D5FEF] font-bold text-sm hover:underline"
                                            style={{ fontFamily: 'SF Pro Display' }}
                                        >
                                            + Add Resource
                                        </button>
                                    </div>

                                    {projectProposal.resourcePlan.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                            No resources added yet. Click "+ Add Resource" to start.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {projectProposal.resourcePlan.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300"
                                                >
                                                    <div className="flex-1 grid grid-cols-4 gap-3">
                                                        <select
                                                            value={item.resourceId}
                                                            onChange={(e) => updateResourcePlanItem(index, 'resourceId', e.target.value)}
                                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]"
                                                        >
                                                            <option value="">-- Select Resource --</option>
                                                            {availableResources.map(res => (
                                                                <option key={res.resourceId} value={res.resourceId}>
                                                                    {res.resourceName} ({res.status})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={item.role}
                                                            onChange={(e) => updateResourcePlanItem(index, 'role', e.target.value)}
                                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]"
                                                        >
                                                            <option value="">-- Select Role --</option>
                                                            <option value="Team Lead">Team Lead</option>
                                                            <option value="Backend Developer">Backend Developer</option>
                                                            <option value="Frontend Developer">Frontend Developer</option>
                                                            <option value="Quality Assurance">Quality Assurance</option>
                                                        </select>
                                                        <input
                                                            type="date"
                                                            value={item.startDate}
                                                            onChange={(e) => updateResourcePlanItem(index, 'startDate', e.target.value)}
                                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={item.endDate}
                                                            onChange={(e) => updateResourcePlanItem(index, 'endDate', e.target.value)}
                                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => removeResourceFromPlan(index)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-10">
                                <button
                                    onClick={() => {
                                        setShowNewProjectModal(false);
                                        setProjectProposal({ projectName: '', clientName: '', description: '', resourcePlan: [] });
                                    }}
                                    className="px-8 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-all"
                                    style={{ fontFamily: 'SF Pro Display' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProposeProject}
                                    className="px-8 py-3 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-[#5D5FEF]/30 hover:-translate-y-0.5"
                                    style={{ backgroundColor: '#5D5FEF', fontFamily: 'SF Pro Display' }}
                                >
                                    Submit Proposal
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 ml-[267px] p-8">
                {/* Page Title */}
                <h1 className="text-4xl font-bold text-gray-800 mb-8" style={{ fontFamily: 'SF Pro Display' }}>Projects</h1>

                {/* Search, Filters and Actions */}
                <div className="flex items-center justify-between mb-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] bg-white"
                            style={{ width: '300px', fontFamily: 'SF Pro Display' }}
                        />
                    </div>

                    {/* Filter Tabs & Actions */}
                    <div className="flex items-center gap-4">
                        {/* Filter Tabs */}
                        <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                            {filterTabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFilter(tab)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === tab
                                        ? 'bg-[#025D66] text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    style={{ fontFamily: 'SF Pro Display' }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-[#FBCD3F] text-black rounded-lg hover:opacity-90 transition-colors font-medium"
                            style={{ fontFamily: 'SF Pro Display' }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Export
                        </button>

                        {/* Propose/New Project Button */}
                        <button
                            onClick={() => setShowNewProjectModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            style={{ fontFamily: 'SF Pro Display' }}
                        >
                            {user.userType === 'ADMIN' ? '+ New Project' : '+ Propose Project'}
                        </button>
                    </div>
                </div>

                {/* Project Cards Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-xl text-gray-500">Loading projects...</div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-xl text-gray-500">No projects found</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.projectId}
                                className="bg-white rounded-xl p-5 shadow-sm"
                                style={{ border: '1px solid #E0E0E0' }}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>
                                            {project.projectName}
                                        </h3>
                                        <p className="text-gray-500 text-sm" style={{ fontFamily: 'SF Pro Display' }}>
                                            {project.clientName}
                                        </p>
                                    </div>
                                    <span
                                        className="text-xs px-3 py-1 rounded-full font-bold"
                                        style={getStatusBadgeStyle(project.status)}
                                    >
                                        {getStatusLabel(project.status)}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="flex items-center justify-between text-sm text-gray-600 mb-4" style={{ fontFamily: 'SF Pro Display' }}>
                                    <div>
                                        <span className="text-gray-500">Name DevMan : </span>
                                        <span className="font-bold">{project.pmName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span>{project.memberCount}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleViewDetail(project)}
                                        className="flex-1 py-2 rounded-lg font-medium text-black transition-colors"
                                        style={{ backgroundColor: '#CAF0F8', fontFamily: 'SF Pro Display' }}
                                    >
                                        Detail
                                    </button>
                                    <button
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Project;
