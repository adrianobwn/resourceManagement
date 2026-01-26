import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import { Search, Users, Trash2, X, Calendar, AlertTriangle, Folder } from 'lucide-react';

const AdminProject = () => {
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

    // Extend/Release Action states (for direct Admin actions)
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [selectedResourceForAction, setSelectedResourceForAction] = useState(null);
    const [actionDate, setActionDate] = useState('');
    const [actionReason, setActionReason] = useState('');

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
        // Set minimum date to the day after current end date
        const currentEndDate = new Date(resource.endDate);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Use the later of: day after current end date or tomorrow
        const minDate = currentEndDate > tomorrow ? currentEndDate : tomorrow;
        minDate.setDate(minDate.getDate() + 1); // Day after the max
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

            // Real-time update for list (optimistic)
            setProjects(prev => prev.map(p => {
                if (p.projectId === selectedProject.projectId) {
                    const newCount = Math.max(0, p.memberCount - 1);
                    const newStatus = newCount === 0 ? 'CLOSED' : p.status;

                    // Also update selectedProject if status changed
                    if (newStatus !== p.status) {
                        setSelectedProject(curr => ({ ...curr, status: newStatus }));
                    }

                    return { ...p, memberCount: newCount, status: newStatus };
                }
                return p;
            }));
        } catch (error) {
            console.error('Error releasing assignment:', error);
            showNotification('Failed to release resource', 'error');
        }
    };

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

    const handleViewDetail = (project) => {
        setSelectedProject(project);
        setShowDetailModal(true);
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

    const handleCreateProject = async () => {
        if (!newProject.projectName.trim() || !newProject.clientName.trim() || !newProject.pmId) {
            showNotification('Please fill all fields', 'error');
            return;
        }

        try {
            await api.post('/projects', {
                projectName: newProject.projectName,
                clientName: newProject.clientName,
                pmId: parseInt(newProject.pmId)
            });
            setShowNewProjectModal(false);
            setNewProject({ projectName: '', clientName: '', pmId: '' });
            showNotification('Project created successfully!', 'success');
            fetchProjects();
        } catch (error) {
            console.error('Error creating project:', error);
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
            p.pmName.toLowerCase().includes(searchQuery.toLowerCase());

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
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Projects</h1>
                    <div className="flex items-center gap-4">
                        {/* Empty header actions as per request to move New Project button */}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                        {filterTabs.map(tab => (
                            <button key={tab} onClick={() => setActiveFilter(tab)} className={`px-6 py-2 rounded-md font-bold transition-all ${activeFilter === tab ? 'bg-[#CAF0F8] text-black shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>{tab}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Find projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-4 pr-10 py-2 w-80 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] font-medium"
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-white text-gray-700 rounded-lg font-bold border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
                            style={{ fontFamily: 'SF Pro Display' }}
                        >
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export
                        </button>
                        <button
                            onClick={() => setShowNewProjectModal(true)}
                            className="px-6 py-2 bg-[#CAF0F8] text-black rounded-lg font-bold hover:opacity-90 transition-all shadow-md shadow-cyan-100 flex items-center gap-2"
                            style={{ fontFamily: 'SF Pro Display' }}
                        >
                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            New Project
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
                                        <p className="text-gray-500 font-medium">{project.clientName} • <span className="text-gray-500 font-bold">PM: {project.pmName}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xs px-3 py-1 rounded-full font-bold" style={getStatusBadgeStyle(project.status)}>
                                            {getStatusLabel(project.status)}
                                        </span>
                                        <div className="flex items-center gap-1 text-black font-bold mt-1 justify-end">
                                            <Users className="w-4 h-4" />
                                            <span className="text-sm">{project.memberCount}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleViewDetail(project)}
                                            className="px-6 py-2 bg-[#CAF0F8] text-black rounded-lg font-bold hover:bg-[#b8e8ef] transition-colors"
                                            style={{ fontFamily: 'SF Pro Display' }}
                                        >
                                            View Detail
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(project)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete Project"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
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
                            <div className="relative">
                                {selectedProject.status === 'CLOSED' ? (
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-bold"
                                        style={{
                                            backgroundColor: 'rgba(255, 0, 0, 0.2)',
                                            color: '#FF0000',
                                            display: 'inline-block',
                                            textAlign: 'center',
                                            border: '1px solid #FF0000'
                                        }}
                                    >
                                        CLOSED
                                    </span>
                                ) : (
                                    <select
                                        value={selectedProject.status}
                                        onChange={async (e) => {
                                            try {
                                                const newStatus = e.target.value;
                                                await api.put(`/projects/${selectedProject.projectId}/status`, null, { params: { status: newStatus } });

                                                // Real-time update
                                                setSelectedProject(prev => ({ ...prev, status: newStatus }));
                                                setProjects(prev => prev.map(p => p.projectId === selectedProject.projectId ? { ...p, status: newStatus } : p));

                                                showNotification(`Status updated to ${newStatus}`, 'success');
                                            } catch (error) {
                                                console.error('Error updating status:', error);
                                                showNotification('Failed to update status', 'error');
                                            }
                                        }}
                                        className="px-3 py-1 rounded-full text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                        style={{
                                            backgroundColor: selectedProject.status === 'ON_GOING' ? 'rgba(6, 208, 1, 0.2)' : 'rgba(251, 205, 63, 0.2)',
                                            color: selectedProject.status === 'ON_GOING' ? '#06D001' : '#FBCD3F',
                                            border: selectedProject.status === 'ON_GOING' ? '1px solid #06D001' : '1px solid #FBCD3F',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <option value="ON_GOING">ONGOING</option>
                                        <option value="HOLD">HOLD</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-8 mb-6">
                            <div className="text-sm font-medium text-gray-500">Client Name : <span className="text-gray-800 font-bold">{selectedProject.clientName}</span></div>
                            <div className="text-sm font-medium text-gray-500">DevMan : <span className="text-gray-800 font-bold">{selectedProject.pmName}</span></div>
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
                                            <th className="px-6 py-4 font-bold text-gray-700 text-center rounded-tl-xl">Name</th>
                                            <th className="px-6 py-4 font-bold text-center text-gray-700">Period</th>
                                            <th className="px-6 py-4 font-bold text-center text-gray-700">Status</th>
                                            <th className="px-6 py-4 font-bold text-center text-gray-700 rounded-tr-xl">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-[#E6F2F1]">
                                        {projectResources.map((res, idx) => (
                                            <tr key={idx} className="border-b border-gray-200 last:border-none">
                                                <td className="px-6 py-6 font-bold text-gray-800">{res.resourceName}</td>
                                                <td className="px-6 py-6 text-center font-bold text-gray-800">{formatDate(res.startDate)} - {formatDate(res.endDate)}</td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className={`px-4 py-1 rounded-full text-[10px] font-bold border ${(res.status === 'RELEASED' || res.status === 'EXPIRED') ? 'bg-red-100 text-red-600 border-red-600' : 'bg-green-100 text-green-600 border-green-600'}`}>
                                                        {res.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    {(res.status !== 'RELEASED' && res.status !== 'EXPIRED') && (
                                                        <div className="flex justify-center gap-2">
                                                            <button onClick={() => handleOpenExtendModal(res)} className="px-4 py-1.5 rounded-full bg-[#FFEEDD] text-[#F97316] font-bold text-[10px] border border-[#F97316] hover:bg-[#F97316]/20">EXTEND</button>
                                                            <button onClick={() => handleOpenReleaseModal(res)} className="px-4 py-1.5 rounded-full bg-[#FFDDEE] text-[#FF0000] font-bold text-[10px] border border-[#FF0000] hover:bg-[#FF0000]/20">RELEASE</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Extend Sidebar */}
                    <div className={`fixed top-1/2 -translate-y-1/2 right-[calc(50%-400px-20px)] w-[400px] h-fit bg-[#F5F5F5] shadow-2xl z-60 transition-all duration-300 rounded-3xl p-6 flex flex-col ${showExtendModal ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[200%] pointer-events-none'}`}>
                        <h3 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'SF Pro Display' }}>Extend Assignment</h3>

                        <div className="border-b border-gray-300 mb-6 mt-4"></div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-black" style={{ fontFamily: 'SF Pro Display' }}>Resource</span>
                                    <span className="text-black">: {selectedResourceForAction?.resourceName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold text-black" style={{ fontFamily: 'SF Pro Display' }}>Current Date</span>
                                    <span className="text-black">: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-black" style={{ fontFamily: 'SF Pro Display' }}>New End Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={actionDate}
                                        onChange={(e) => setActionDate(e.target.value)}
                                        min={selectedResourceForAction?.endDate ? (() => {
                                            const currentEnd = new Date(selectedResourceForAction.endDate);
                                            const today = new Date();
                                            const minDate = currentEnd > today ? currentEnd : today;
                                            minDate.setDate(minDate.getDate() + 1);
                                            return minDate.toISOString().split('T')[0];
                                        })() : new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-400 rounded-xl focus:ring-2 focus:ring-[#0057FF] outline-none text-black"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    />
                                    {/* Calendar icon logic if custom input needed, but native date picker usually suffices or shows icon */}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-black" style={{ fontFamily: 'SF Pro Display' }}>Reason for Extension</label>
                                <textarea
                                    rows="6"
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-400 rounded-xl focus:ring-2 focus:ring-[#0057FF] outline-none text-black resize-none"
                                    style={{ fontFamily: 'SF Pro Display' }}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-auto pt-4">
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
                    <div className={`fixed top-1/2 -translate-y-1/2 right-[calc(50%-400px-20px)] w-[400px] h-fit bg-[#F5F5F5] shadow-2xl z-60 transition-all duration-300 rounded-3xl p-6 flex flex-col ${showReleaseModal ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[200%] pointer-events-none'}`}>
                        <h3 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'SF Pro Display' }}>Release Assignment</h3>

                        <div className="border-b border-gray-300 mb-6 mt-4"></div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-black" style={{ fontFamily: 'SF Pro Display' }}>Resource</span>
                                    <span className="text-black">: {selectedResourceForAction?.resourceName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold text-black" style={{ fontFamily: 'SF Pro Display' }}>Current Date</span>
                                    <span className="text-black">: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-black" style={{ fontFamily: 'SF Pro Display' }}>Reason for Extension</label>
                                <textarea
                                    rows="6"
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-400 rounded-xl focus:ring-2 focus:ring-[#FF0000] outline-none text-black resize-none"
                                    style={{ fontFamily: 'SF Pro Display' }}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-auto pt-4">
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
                                        value={newProject.pmId}
                                        onChange={(e) => setNewProject({ ...newProject, pmId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:ring-2 focus:ring-[#CAF0F8] outline-none appearance-none cursor-pointer"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    >
                                        <option value="">Select DevMan</option>
                                        {pmList.map(pm => (
                                            <option key={pm.userId} value={pm.userId}>{pm.name}</option>
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
