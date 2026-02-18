import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import { Search, Users, Trash2, X, Calendar, AlertTriangle, Folder, Edit2 } from 'lucide-react';

const AdminProject = () => {
    const navigate = useNavigate();
    const location = useLocation();
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
    const [restrictionModal, setRestrictionModal] = useState({ show: false, message: '', title: '' });

    // Edit Modal State
    const [editModal, setEditModal] = useState({
        show: false,
        project: null,
        formData: { projectName: '', clientName: '', status: '' }
    });

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

    // Handle deep-linking from dashboard
    useEffect(() => {
        if (!loading && projects.length > 0 && location.state?.openProjectId) {
            const projectToOpen = projects.find(p => String(p.projectId) === String(location.state.openProjectId));
            if (projectToOpen) {
                console.log('Auto-opening project detail for ID:', location.state.openProjectId);
                handleViewDetail(projectToOpen);
                // Clear state so it doesn't reopen on refresh
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [loading, projects, location.state, navigate]);



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
        if (showNewProjectModal || showDetailModal || deleteModal.show || editModal.show || restrictionModal.show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showNewProjectModal, showDetailModal, deleteModal.show, editModal.show, restrictionModal.show]);

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
        // Check if project has any active resources (memberCount > 0)
        if (project.memberCount > 0) {
            setRestrictionModal({
                show: true,
                title: 'Cannot Delete Project',
                message: `This project still has ${project.memberCount} active resource(s). Please release all resources before deleting.`
            });
            return;
        }
        setDeleteModal({ show: true, project });
    };

    const confirmDelete = async () => {
        if (!deleteModal.project) return;

        try {
            await api.delete(`/projects/${deleteModal.project.projectId}`);
            showNotification('Project deleted successfully!', 'success');
            setDeleteModal({ show: false, project: null });
            fetchProjects();
        } catch (error) {
            console.error('Error deleting project:', error);
            showNotification(error.response?.data?.message || 'Failed to delete project', 'error');
        }
    };

    const handleEditClick = (project) => {
        setEditModal({
            show: true,
            project: project,
            formData: {
                projectName: project.projectName,
                clientName: project.clientName,
                status: project.status
            }
        });
    };

    const confirmEdit = async () => {
        if (!editModal.project) return;

        const isChanged = editModal.formData.projectName !== editModal.project.projectName ||
            editModal.formData.clientName !== editModal.project.clientName ||
            editModal.formData.status !== editModal.project.status;

        if (!isChanged) {
            setEditModal({ show: false, project: null, formData: { projectName: '', clientName: '', status: '' } });
            return;
        }

        try {
            await api.put(`/projects/${editModal.project.projectId}`, editModal.formData);
            showNotification('Project updated successfully', 'success');
            setEditModal({ show: false, project: null, formData: { projectName: '', clientName: '', status: '' } });
            fetchProjects();
        } catch (error) {
            console.error('Error updating project:', error);
            showNotification(error.response?.data?.message || 'Failed to update project', 'error');
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



    const filteredProjects = projects.filter(p => {
        const matchesStatus = activeFilter === 'All' ||
            (activeFilter === 'Ongoing' && p.status === 'ONGOING') ||
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

            {/* Notification Toast */}
            <Toast
                show={notification.show}
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(prev => ({ ...prev, closing: true }))}
                closing={notification.closing}
            />

            {/* Main Content */}
            <div className="flex-1 ml-[267px] flex flex-col h-screen overflow-hidden bg-[#E6F2F1]">
                <div className="p-8 pb-4">
                    <h1 className="text-4xl font-bold text-gray-800 mb-6">Admin Projects</h1>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-6">
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
                </div>

                {/* Project List */}
                <div className="px-8 pb-8 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="text-center py-12 text-gray-500 font-bold">Loading projects...</div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl text-gray-500 font-bold">No projects found.</div>
                        ) : (
                            filteredProjects.map(project => (
                                <div key={project.projectId} onClick={() => handleViewDetail(project)} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="flex items-center gap-6">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Folder className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-1">{project.projectName}</h3>
                                            <p className="text-gray-500 font-medium">{project.clientName} • <span className="text-[#00B4D8] font-bold">{project.devManName}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <StatusBadge status={project.status} />
                                            </div>
                                            <div className="text-black text-sm mt-2 font-medium flex items-center justify-end gap-2">
                                                <Users className="w-4 h-4" /> {project.memberCount}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetail(project);
                                            }}
                                            className="px-6 py-2 bg-[#CAF0F8] text-black rounded-lg font-bold hover:opacity-90 transition-colors"
                                        >
                                            View Detail
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(project);
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Project"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick(project);
                                            }}
                                            className="p-2 text-[#00B4D8] hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Project"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail Modal Container - Wraps both Project Detail and Action Modals */}
                {
                    showDetailModal && selectedProject && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto animate-fade-in">
                            <div className="flex items-start gap-6 transition-all duration-300 min-w-min">
                                {/* Project Detail Modal */}
                                <div className="bg-white rounded-2xl p-8 w-[800px] flex-shrink-0 relative shadow-xl">
                                    <button onClick={() => setShowDetailModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                                        <X className="w-6 h-6" />
                                    </button>

                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="text-3xl font-bold text-gray-800">{selectedProject.projectName}</h2>
                                        <StatusBadge status={selectedProject.status} />
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
                                        <div className="bg-[#F8FBFC] rounded-xl overflow-hidden flex flex-col" style={{ maxHeight: '400px' }}>
                                            <div className="overflow-y-auto custom-scrollbar">
                                                <table className="w-full relative">
                                                    <thead className="sticky top-0 z-10 bg-[#E6F2F1] border-b border-gray-200 text-left shadow-sm">
                                                        <tr>
                                                            <th className="px-6 py-4 font-bold text-gray-700 text-center bg-[#E6F2F1]">Name</th>
                                                            <th className="px-6 py-4 font-bold text-center text-gray-700 bg-[#E6F2F1]">Role</th>
                                                            <th className="px-6 py-4 font-bold text-center text-gray-700 bg-[#E6F2F1]">Period</th>
                                                            <th className="px-6 py-4 font-bold text-center text-gray-700 bg-[#E6F2F1]">Status</th>
                                                            <th className="px-6 py-4 font-bold text-center text-gray-700 rounded-tr-xl bg-[#E6F2F1]">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-[#E6F2F1]">
                                                        {projectResources.map((res, idx) => (
                                                            <tr key={idx} className="border-b border-gray-200 last:border-none">
                                                                <td className="px-6 py-6 font-bold text-gray-800">{res.resourceName}</td>
                                                                <td className="px-6 py-6 text-center font-bold text-gray-600">{res.role}</td>
                                                                <td className="px-6 py-6 text-center font-bold text-gray-800">{formatDate(res.startDate)} - {formatDate(res.endDate)}</td>
                                                                <td className="px-6 py-6 text-center">
                                                                    <StatusBadge status={res.status === 'ACTIVE' ? 'ACTIVE' : 'RELEASED'} className="text-[10px]" />
                                                                </td>
                                                                <td className="px-6 py-6 text-center">
                                                                    <div className="flex justify-center gap-2">
                                                                        {res.status === 'RELEASED' ? (
                                                                            // Show dash for released assignments
                                                                            <span className="text-gray-400 text-xs font-bold">-</span>
                                                                        ) : pendingRequests.some(req => req.assignmentId && String(req.assignmentId) === String(res.assignmentId)) ? (
                                                                            // Show "Pending" badge if there's any pending request for this assignment
                                                                            <StatusBadge status="PENDING" className="text-[10px]" />
                                                                        ) : res.status === 'ACTIVE' ? (
                                                                            // Show buttons only if ACTIVE and no pending requests
                                                                            <>
                                                                                <button onClick={() => handleOpenExtendModal(res)} className="px-4 py-1.5 rounded-full bg-[#FFEEDD] text-[#F97316] font-bold text-[10px] border border-[#F97316] hover:bg-[#F97316]/20" style={{ fontFamily: "SF Pro Display" }}>EXTEND</button>
                                                                                <button onClick={() => handleOpenReleaseModal(res)} className="px-4 py-1.5 rounded-full bg-[#FFDDEE] text-[#FF0000] font-bold text-[10px] border border-[#FF0000] hover:bg-[#FF0000]/20" style={{ fontFamily: "SF Pro Display" }}>RELEASE</button>
                                                                            </>
                                                                        ) : null}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Extend/Release Actions - Rendered Side-by-Side */}
                                {(showExtendModal || showReleaseModal) && (
                                    <div className="w-[400px] h-fit bg-[#F5F5F5] shadow-2xl rounded-3xl p-6 flex flex-col animate-scale-in">

                                        {showExtendModal && (
                                            <>
                                                <h3 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'SF Pro Display' }}>Extend Assignment</h3>
                                                <div className="border-b border-gray-300 mb-6 mt-4"></div>

                                                <div className="space-y-6 flex-1">
                                                    <div className="space-y-2">
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
                                                                min={minDate}
                                                                onChange={(e) => setActionDate(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0057FF] outline-none text-black shadow-sm"
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
                                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0057FF] outline-none text-black resize-none shadow-sm"
                                                            style={{ fontFamily: 'SF Pro Display' }}
                                                        ></textarea>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 mt-8 pt-4">
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
                                            </>
                                        )}

                                        {showReleaseModal && (
                                            <>
                                                <h3 className="text-2xl font-bold mb-2 text-center text-red-600" style={{ fontFamily: 'SF Pro Display' }}>Release Assignment</h3>
                                                <div className="border-b border-gray-300 mb-6 mt-4"></div>

                                                <div className="space-y-6 flex-1">
                                                    <div className="space-y-2">
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
                                                        <label className="block text-sm font-bold mb-2 text-black" style={{ fontFamily: 'SF Pro Display' }}>Reason for Release</label>
                                                        <textarea
                                                            rows="4"
                                                            value={actionReason}
                                                            onChange={(e) => setActionReason(e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-black resize-none shadow-sm"
                                                            style={{ fontFamily: 'SF Pro Display' }}
                                                        ></textarea>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 mt-8 pt-4">
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
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* New Project Modal */}
                {
                    showNewProjectModal && (
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
                                            className="px-8 py-2 bg-[#D9D9D9] text-black font-bold rounded-lg hover:bg-gray-300 transition-colors"
                                            style={{ width: '120px', fontSize: '16px', fontFamily: 'SF Pro Display' }}
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
                    )
                }

                {/* Edit Project Modal */}
                {editModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
                        <div className="bg-[#F5F5F5] rounded-2xl p-8 w-[600px] relative animate-scale-in">
                            <button
                                onClick={() => setEditModal({ show: false, project: null, formData: { projectName: '', clientName: '' } })}
                                className="absolute top-6 right-6 text-black hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-3xl font-bold text-black mb-8" style={{ fontFamily: 'SF Pro Display' }}>Edit Project</h2>

                            {/* Line below title */}
                            <div className="border-b border-gray-300 mb-8"></div>

                            <div className="space-y-6 mb-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2" style={{ fontFamily: 'SF Pro Display' }}>Project Name</label>
                                        <input
                                            type="text"
                                            value={editModal.formData.projectName}
                                            onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, projectName: e.target.value } })}
                                            className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:ring-2 focus:ring-[#CAF0F8] outline-none"
                                            style={{ fontFamily: 'SF Pro Display' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2" style={{ fontFamily: 'SF Pro Display' }}>Client Name</label>
                                        <input
                                            type="text"
                                            value={editModal.formData.clientName}
                                            onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, clientName: e.target.value } })}
                                            className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:ring-2 focus:ring-[#CAF0F8] outline-none"
                                            style={{ fontFamily: 'SF Pro Display' }}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-black mb-2" style={{ fontFamily: 'SF Pro Display' }}>Project Status</label>
                                        <div className="relative">
                                            <select
                                                value={editModal.formData.status}
                                                onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, status: e.target.value } })}
                                                disabled={editModal.project?.status === 'CLOSED'}
                                                className={`w-full px-4 py-3 bg-white border border-black rounded-xl focus:ring-2 focus:ring-[#CAF0F8] outline-none appearance-none cursor-pointer ${editModal.project?.status === 'CLOSED' ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
                                                style={{ fontFamily: 'SF Pro Display' }}
                                            >
                                                {editModal.project?.status === 'CLOSED' ? (
                                                    <option value="CLOSED">CLOSED</option>
                                                ) : (
                                                    <>
                                                        <option value="ONGOING">ONGOING</option>
                                                        <option value="HOLD">HOLD</option>
                                                    </>
                                                )}
                                            </select>
                                            {editModal.project?.status !== 'CLOSED' && (
                                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            )}
                                        </div>
                                        {editModal.project?.status === 'CLOSED' && (
                                            <p className="mt-2 text-xs text-gray-500 font-medium italic">Closed projects cannot be reopened manually.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Line above buttons */}
                            <div className="border-t border-gray-300 mt-8 pt-6">
                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={() => setEditModal({ show: false, project: null, formData: { projectName: '', clientName: '', status: '' } })}
                                        className="px-8 py-2 bg-[#D9D9D9] text-black font-bold rounded-lg hover:bg-gray-300 transition-colors"
                                        style={{ width: '120px', fontSize: '16px', fontFamily: 'SF Pro Display' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmEdit}
                                        disabled={!editModal.formData.projectName.trim() || !editModal.formData.clientName.trim() || !editModal.formData.status}
                                        className="px-6 py-2 bg-[#CAF0F8] text-black rounded-lg font-bold hover:opacity-90 transition-colors"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Delete Confirmation Modal */}
                {
                    deleteModal.show && (
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
                    )
                }

                {/* Restriction Modal */}
                {restrictionModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                        <div className="bg-[#F5F5F5] rounded-2xl p-8 w-[400px] flex flex-col items-center animate-scale-in">
                            <div className="mb-6 flex justify-center">
                                <AlertTriangle className="w-16 h-16 text-[#FBCD3F]" fill="#FBCD3F" stroke="#ffffff" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 text-center mb-4" style={{ fontFamily: 'SF Pro Display' }}>
                                {restrictionModal.title}
                            </h2>
                            <p className="text-gray-600 text-center mb-8 font-medium leading-relaxed">
                                {restrictionModal.message}
                            </p>
                            <button
                                onClick={() => setRestrictionModal({ ...restrictionModal, show: false })}
                                className="w-full py-4 bg-[#D9D9D9] hover:bg-gray-300 text-black rounded-2xl font-bold transition-all duration-200"
                                style={{ fontFamily: 'SF Pro Display' }}
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProject;
