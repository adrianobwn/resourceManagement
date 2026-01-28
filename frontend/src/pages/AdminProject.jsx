import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import { Search, Users, Trash2, X, Calendar, AlertTriangle, Folder, Edit2 } from 'lucide-react';

const AdminProject = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [devManList, setDevManList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    // Modal states
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [newProject, setNewProject] = useState({
        projectName: '',
        clientName: '',
        devManId: ''
    });

    // Notification state
    const [notification, setNotification] = useState({ show: false, message: '', closing: false, type: 'success' });

    // Delete Confirmation State
    const [deleteModal, setDeleteModal] = useState({ show: false, project: null });

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
    }, [navigate]);



    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projects');
            setProjects(response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching projects:', error);
            showNotification('Failed to fetch projects', 'error');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const fetchPmList = async () => {
        try {
            const response = await api.get('/users/pms');
            setDevManList(response.data);
        } catch (error) {
            console.error('Error fetching DevMan list:', error);
        }
    };

    // Detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectResources, setProjectResources] = useState([]);

    const [loadingResources, setLoadingResources] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);

    // Extend/Release Action states (for direct Admin actions)
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [selectedResourceForAction, setSelectedResourceForAction] = useState(null);
    const [actionDate, setActionDate] = useState('');
    const [actionReason, setActionReason] = useState('');
    const [minDate, setMinDate] = useState('');

    // Body scroll locking
    useEffect(() => {
        if (showNewProjectModal || showDetailModal || deleteModal.show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showNewProjectModal, showDetailModal, deleteModal.show]);

    const handleOpenExtendModal = (resource) => {
        setSelectedResourceForAction(resource);

        // Calculate min date based on current End Date
        const currentEndDate = new Date(resource.endDate);
        const nextDay = new Date(currentEndDate);
        nextDay.setDate(currentEndDate.getDate() + 1);
        const minDateStr = nextDay.toISOString().split('T')[0];

        setMinDate(minDateStr);
        setActionDate('');
        setActionReason('');
        setShowReleaseModal(false);
        setShowExtendModal(true);
    };

    const handleOpenReleaseModal = (resource) => {
        setSelectedResourceForAction(resource);
        setActionDate(new Date().toISOString().split('T')[0]);
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
            fetchProjectResources(selectedProject.projectId);
        } catch (error) {
            console.error('Error extending assignment:', error);
            showNotification('Failed to extend assignment', 'error');
        }
    };

    const handleReleaseSubmit = async () => {
        if (!actionReason) {
            showNotification('Please provide a reason', 'error');
            return;
        }
        try {
            await api.post('/assignments/release', {
                assignmentId: selectedResourceForAction.assignmentId,
                releaseDate: actionDate,
                reason: actionReason
            });
            showNotification('Resource released successfully!', 'success');
            setShowReleaseModal(false);

            // Refresh modal resources
            fetchProjectResources(selectedProject.projectId);

            // Refresh project list and update selected project
            const updatedProjects = await fetchProjects();
            const updatedCurrentProject = updatedProjects.find(p => p.projectId === selectedProject.projectId);
            if (updatedCurrentProject) {
                setSelectedProject(updatedCurrentProject);
            }
        } catch (error) {
            console.error('Error releasing assignment:', error);
            showNotification('Failed to release resource', 'error');
        }
    };

    const handleToggleStatus = async (projectId, currentStatus) => {
        const newStatus = currentStatus === 'ON_GOING' ? 'HOLD' : 'ON_GOING';
        try {
            const response = await api.patch(`/projects/${projectId}/status?status=${newStatus}`);
            showNotification(`Project status updated to ${newStatus}`, 'success');
            // Update local state for real-time update
            setProjects(prev => prev.map(p => p.projectId === projectId ? { ...p, status: newStatus } : p));
            if (selectedProject && selectedProject.projectId === projectId) {
                setSelectedProject(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error('Error toggling project status:', error);
            showNotification('Failed to update project status', 'error');
        }
    };

    const fetchProjectResources = async (projectId) => {
        try {
            setLoadingResources(true);

            // Fetch resources (required)
            const resourcesResponse = await api.get(`/projects/${projectId}/resources`);
            setProjectResources(resourcesResponse.data);

            // Fetch pending requests (optional - don't fail if this endpoint has issues)
            try {
                const pendingResponse = await api.get(`/requests/project/${projectId}/pending`);
                setPendingRequests(pendingResponse.data);
            } catch (pendingError) {
                console.warn('Failed to fetch pending requests, continuing without them:', pendingError);
                setPendingRequests([]); // Set to empty array if fetch fails
            }
        } catch (error) {
            console.error('Error fetching project resources:', error);
            showNotification('Failed to fetch project resources', 'error');
        } finally {
            setLoadingResources(false);
        }
    };

    const handleViewDetail = (project) => {
        setSelectedProject(project);
        setShowDetailModal(true);
        fetchProjectResources(project.projectId);
    };

    const handleExport = () => {
        const dataToExport = projects.map(project => ({
            'Project Name': project.projectName,
            'Client': project.clientName,
            'DevMan': project.devManName,
            'Status': project.status
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, "Projects");
        XLSX.writeFile(wb, "Projects_Data.xlsx");
        showNotification('Project data exported successfully!', 'success');
    };

    const handleCreateProject = async () => {
        if (!newProject.projectName.trim() || !newProject.clientName.trim() || !newProject.devManId) {
            showNotification('Please fill all fields', 'error');
            return;
        }

        try {
            await api.post('/projects', {
                projectName: newProject.projectName,
                clientName: newProject.clientName,
                devManId: parseInt(newProject.devManId, 10)
            });
            setShowNewProjectModal(false);
            setNewProject({ projectName: '', clientName: '', devManId: '' });
            showNotification('Project created successfully!', 'success');
            fetchProjects();
        } catch (error) {
            console.error('Error creating project:', error);
            if (error.response && error.response.data) {
                console.error('Backend validation errors:', JSON.stringify(error.response.data, null, 2));
            }
            showNotification('Failed to create project', 'error');
        }
    };

    const handleDeleteClick = (project) => {
        setDeleteModal({ show: true, project });
    };

    const confirmDelete = async () => {
        if (!deleteModal.project) return;

        try {
            // Assuming endpoint is DELETE /projects/:id
            await api.delete(`/projects/${deleteModal.project.projectId}`);
            showNotification('Project deleted successfully!', 'success');
            setDeleteModal({ show: false, project: null });
            fetchProjects();
        } catch (error) {
            console.error('Error deleting project:', error);
            showNotification('Failed to delete project', 'error');
        }
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

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'ON_GOING':
                return {
                    backgroundColor: 'rgba(6, 208, 1, 0.2)',
                    color: '#06D001',
                    border: '1px solid #06D001'
                };
            case 'HOLD':
                return {
                    backgroundColor: 'rgba(249, 115, 22, 0.2)', // #F97316
                    color: '#F97316',
                    border: '1px solid #F97316'
                };
            case 'CLOSED':
                return {
                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                    color: '#FF0000',
                    border: '1px solid #FF0000'
                };
            default:
                return {
                    backgroundColor: 'rgba(0, 180, 216, 0.2)',
                    color: '#00B4D8',
                    border: '1px solid #00B4D8'
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

    const filteredProjects = projects.filter(p => {
        const matchesStatus = activeFilter === 'All' ||
            (activeFilter === 'Ongoing' && p.status === 'ON_GOING') ||
            (activeFilter === 'Hold' && p.status === 'HOLD') ||
            (activeFilter === 'Closed' && p.status === 'CLOSED');

        const matchesSearch = !searchQuery.trim() ||
            p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.devManName.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });



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
                        <svg className="w-5 h-5" fill="none" stroke="#06D001" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    ) : notification.type === 'error' ? (
                        <svg className="w-5 h-5" fill="none" stroke="#FF0000" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="#00B4D8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    <span className="font-bold" style={{ color: notification.type === 'success' ? '#06D001' : notification.type === 'error' ? '#FF0000' : '#00B4D8', fontSize: '14px' }}>
                        {notification.message}
                    </span>
                    <button onClick={closeNotification} className="ml-2 hover:opacity-70 transition-opacity" style={{ color: notification.type === 'success' ? '#06D001' : notification.type === 'error' ? '#FF0000' : '#00B4D8' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 p-8 ml-[267px]">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Admin Projects</h1>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-8">
                    {/* Left: Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-80 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CAF0F8] font-medium"
                        />
                    </div>

                    {/* Right: Filters & Actions */}
                    <div className="flex items-center gap-4">
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

                        <button
                            onClick={() => setShowNewProjectModal(true)}
                            className="px-6 py-2 bg-[#CAF0F8] text-black rounded-lg font-bold hover:opacity-90"
                        >
                            + New Project
                        </button>
                    </div>
                </div>

                {/* Project List */}
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500 font-bold">Loading projects...</div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl text-gray-500 font-bold">No projects found.</div>
                    ) : (
                        filteredProjects.map(project => (
                            <div key={project.projectId} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Folder className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1">{project.projectName}</h3>
                                        <p className="text-gray-500 font-medium">{project.clientName} • <span className="text-[#00B4D8] font-bold">{project.devManName}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <span
                                            className="text-xs px-3 py-1 rounded-full font-bold cursor-pointer hover:opacity-80 transition-opacity inline-block"
                                            style={getStatusBadgeStyle(project.status)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (project.status !== 'CLOSED') {
                                                    handleToggleStatus(project.projectId, project.status);
                                                }
                                            }}
                                            title={project.status !== 'CLOSED' ? `Click to switch to ${project.status === 'ON_GOING' ? 'HOLD' : 'ON_GOING'}` : ''}
                                        >
                                            {getStatusLabel(project.status)}
                                        </span>
                                        <div className="text-gray-400 text-sm mt-2 font-medium flex items-center justify-end gap-2">
                                            <Users className="w-4 h-4" /> {project.memberCount}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto animate-fade-in">
                    <div className={`bg-white rounded-2xl p-8 w-[800px] relative transition-transform duration-300 animate-scale-in ${showExtendModal || showReleaseModal ? '-translate-x-[20%]' : ''}`}>
                        <button onClick={() => setShowDetailModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-3xl font-bold text-gray-800">{selectedProject.projectName}</h2>
                            <span
                                className="px-3 py-1 rounded-full text-xs font-bold"
                                style={getStatusBadgeStyle(selectedProject.status)}
                            >
                                {getStatusLabel(selectedProject.status)}
                            </span>
                            {selectedProject.status !== 'CLOSED' && (
                                <button
                                    onClick={() => handleToggleStatus(selectedProject.projectId, selectedProject.status)}
                                    className="px-3 py-1 rounded-lg text-xs font-bold border transition-colors ml-2"
                                    style={{
                                        borderColor: selectedProject.status === 'ON_GOING' ? '#FBCD3F' : '#06D001',
                                        color: selectedProject.status === 'ON_GOING' ? '#FBCD3F' : '#06D001',
                                        backgroundColor: 'transparent'
                                    }}
                                >
                                    {selectedProject.status === 'ON_GOING' ? 'Change to Hold' : 'Change to Ongoing'}
                                </button>
                            )}
                        </div>

                        <div className="flex gap-8 mb-6">
                            <div className="text-sm font-medium text-gray-500">Client Name : <span className="text-gray-800 font-bold">{selectedProject.clientName}</span></div>
                            <div className="text-sm font-medium text-gray-500">DevMan : <span className="text-gray-800 font-bold">{selectedProject.devManName}</span></div>
                        </div>

                        <div className="border-t border-gray-100 my-6"></div>

                        <h3 className="text-xl font-bold text-gray-800 mb-4">Assigned Resources</h3>

                        {loadingResources ? (
                            <p className="text-center py-8 text-gray-500 font-bold">Loading resources...</p>
                        ) : projectResources.length === 0 ? (
                            <p className="text-center py-8 text-gray-500 font-bold">No resources assigned.</p>
                        ) : (
                            <div className="bg-[#F8FBFC] rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-[#E6F2F1] border-b border-gray-200 text-left">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-gray-700 text-center">Name</th>
                                            <th className="px-6 py-4 font-bold text-center text-gray-700">Role</th>
                                            <th className="px-6 py-4 font-bold text-center text-gray-700">Period</th>
                                            <th className="px-6 py-4 font-bold text-center text-gray-700">Status</th>
                                            <th className="px-6 py-4 font-bold text-center text-gray-700 rounded-tr-xl">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-[#E6F2F1]">
                                        {projectResources.map((res, idx) => (
                                            <tr key={idx} className="border-b border-gray-200 last:border-none">
                                                <td className="px-6 py-6 font-bold text-gray-800">{res.resourceName}</td>
                                                <td className="px-6 py-6 text-center font-bold text-gray-600">{res.role}</td>
                                                <td className="px-6 py-6 text-center font-bold text-gray-800">{formatDate(res.startDate)} - {formatDate(res.endDate)}</td>
                                                <td className="px-6 py-6 text-center">
                                                    <span
                                                        className="px-4 py-1 rounded-full text-[10px] font-bold"
                                                        style={{
                                                            backgroundColor: res.status === 'ACTIVE' ? 'rgba(6, 208, 1, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                                                            color: res.status === 'ACTIVE' ? '#06D001' : '#FF0000',
                                                        }}
                                                    >
                                                        {res.status === 'ACTIVE' ? 'ACTIVE' : 'RELEASED'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        {res.status === 'RELEASED' ? (
                                                            // Show dash for released assignments
                                                            <span className="text-gray-400 text-xs font-bold">-</span>
                                                        ) : pendingRequests.some(req => req.assignmentId && String(req.assignmentId) === String(res.assignmentId)) ? (
                                                            // Show "Pending" badge if there's any pending request for this assignment
                                                            <span className="px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 font-bold text-[10px]">
                                                                PENDING
                                                            </span>
                                                        ) : res.status === 'ACTIVE' ? (
                                                            // Show buttons only if ACTIVE and no pending requests
                                                            <>
                                                                <button onClick={() => handleOpenExtendModal(res)} className="px-4 py-1.5 rounded-full bg-[#FFEEDD] text-[#F97316] font-bold text-[10px] hover:bg-[#F97316]/20">EXTEND</button>
                                                                <button onClick={() => handleOpenReleaseModal(res)} className="px-4 py-1.5 rounded-full bg-[#FFDDEE] text-[#FF0000] font-bold text-[10px] hover:bg-[#FF0000]/20">RELEASE</button>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Extend Sidebar */}
                    <div className={`fixed top-1/2 -translate-y-1/2 right-[calc(50%-350px)] w-[700px] h-fit bg-[#F5F5F5] shadow-2xl z-60 transition-all duration-300 rounded-3xl p-6 flex flex-col ${showExtendModal ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[200%] pointer-events-none'}`}>
                        <h3 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'SF Pro Display' }}>Extend Assignment</h3>

                        <div className="border-b border-gray-300 mb-6 mt-4"></div>

                        <div className="grid grid-cols-2 gap-8 flex-1">
                            <div className="space-y-4">
                                <h4 className="font-bold text-lg mb-4">Assignment Details</h4>
                                <div className="space-y-2">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-600 text-sm" style={{ fontFamily: 'SF Pro Display' }}>Resource Name</span>
                                        <span className="text-black font-bold text-lg">{selectedResourceForAction?.resourceName}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-600 text-sm" style={{ fontFamily: 'SF Pro Display' }}>Current End Date</span>
                                        <span className="text-black font-bold text-lg">{selectedResourceForAction?.endDate ? formatDate(selectedResourceForAction.endDate) : '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-600 text-sm" style={{ fontFamily: 'SF Pro Display' }}>Today's Date</span>
                                        <span className="text-black font-bold text-lg">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-black" style={{ fontFamily: 'SF Pro Display' }}>New End Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={actionDate}
                                            min={minDate}
                                            onChange={(e) => setActionDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-400 rounded-xl focus:ring-2 focus:ring-[#0057FF] outline-none text-black"
                                            style={{ fontFamily: 'SF Pro Display' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-2 text-black" style={{ fontFamily: 'SF Pro Display' }}>Reason for Extension</label>
                                    <textarea
                                        rows="4"
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-400 rounded-xl focus:ring-2 focus:ring-[#0057FF] outline-none text-black resize-none"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowExtendModal(false)}
                                className="flex-1 py-3 bg-[#D9D9D9] text-black rounded-xl font-bold hover:bg-gray-300 transition-colors"
                                style={{ fontFamily: 'SF Pro Display' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExtendSubmit}
                                className="flex-1 py-3 bg-[#0057FF] text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                                style={{ fontFamily: 'SF Pro Display' }}
                            >
                                Confirm Extension
                            </button>
                        </div>
                    </div>

                    {/* Release Sidebar */}
                    <div className={`fixed top-1/2 -translate-y-1/2 right-[calc(50%-350px)] w-[700px] h-fit bg-[#F5F5F5] shadow-2xl z-60 transition-all duration-300 rounded-3xl p-6 flex flex-col ${showReleaseModal ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[200%] pointer-events-none'}`}>
                        <h3 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'SF Pro Display' }}>Release Assignment</h3>

                        <div className="border-b border-gray-300 mb-6 mt-4"></div>

                        <div className="grid grid-cols-2 gap-8 flex-1">
                            <div className="space-y-4">
                                <h4 className="font-bold text-lg mb-4">Assignment Details</h4>
                                <div className="space-y-2">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-600 text-sm" style={{ fontFamily: 'SF Pro Display' }}>Resource Name</span>
                                        <span className="text-black font-bold text-lg">{selectedResourceForAction?.resourceName}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-600 text-sm" style={{ fontFamily: 'SF Pro Display' }}>Current End Date</span>
                                        <span className="text-black font-bold text-lg">{selectedResourceForAction?.endDate ? formatDate(selectedResourceForAction.endDate) : '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-600 text-sm" style={{ fontFamily: 'SF Pro Display' }}>Today's Date</span>
                                        <span className="text-black font-bold text-lg">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-black" style={{ fontFamily: 'SF Pro Display' }}>Reason for Release</label>
                                    <textarea
                                        rows="6"
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-400 rounded-xl focus:ring-2 focus:ring-[#FF0000] outline-none text-black resize-none"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowReleaseModal(false)}
                                className="flex-1 py-3 bg-[#D9D9D9] text-black rounded-xl font-bold hover:bg-gray-300 transition-colors"
                                style={{ fontFamily: 'SF Pro Display' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReleaseSubmit}
                                className="flex-1 py-3 bg-[#FF0000] text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                                style={{ fontFamily: 'SF Pro Display' }}
                            >
                                Confirm Release
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Project Modal */}
            {showNewProjectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
                    <div className="bg-[#F5F5F5] rounded-2xl p-8 w-[700px] relative animate-scale-in">
                        <button
                            onClick={() => setShowNewProjectModal(false)}
                            className="absolute top-6 right-6 text-black hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h2 className="text-3xl font-bold text-black mb-8" style={{ fontFamily: 'SF Pro Display' }}>New Project</h2>

                        {/* Line below title */}
                        <div className="border-b border-gray-300 mb-8"></div>

                        <div className="space-y-6 mb-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-black mb-2" style={{ fontFamily: 'SF Pro Display' }}>Project Name</label>
                                    <input
                                        type="text"
                                        value={newProject.projectName}
                                        onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:ring-2 focus:ring-[#CAF0F8] outline-none"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-black mb-2" style={{ fontFamily: 'SF Pro Display' }}>Client Name</label>
                                    <input
                                        type="text"
                                        value={newProject.clientName}
                                        onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:ring-2 focus:ring-[#CAF0F8] outline-none"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    />
                                </div>
                            </div>

                            <div className="w-1/2 pr-3">
                                <label className="block text-sm font-bold text-black mb-2" style={{ fontFamily: 'SF Pro Display' }}>DevMan Name</label>
                                <div className="relative">
                                    <select
                                        value={newProject.devManId}
                                        onChange={(e) => setNewProject({ ...newProject, devManId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:ring-2 focus:ring-[#CAF0F8] outline-none appearance-none cursor-pointer"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    >
                                        <option value="">Select DevMan</option>
                                        {devManList.map(devMan => (
                                            <option key={devMan.userId} value={devMan.userId}>{devMan.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line above buttons */}
                        <div className="border-t border-gray-300 mt-8 pt-6">
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setShowNewProjectModal(false)}
                                    className="font-bold text-black hover:text-gray-700 transition-colors"
                                    style={{ fontFamily: 'SF Pro Display' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    className="px-6 py-2 bg-[#CAF0F8] text-black rounded-lg font-bold hover:opacity-90 transition-colors"
                                    style={{ fontFamily: 'SF Pro Display' }}
                                >
                                    Save Project
                                </button>
                            </div>
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
                            You will not be able to recover this project
                        </p>
                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => setDeleteModal({ show: false, project: null })}
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

export default AdminProject;
