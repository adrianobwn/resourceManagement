import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import { Search, Users, Trash2, X, Calendar, Folder } from 'lucide-react';

const DevmanProject = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    // Modal states
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
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
        fetchAvailableResources();
    }, [navigate]);

    const fetchAvailableResources = async () => {
        try {
            const response = await api.get('/resources');
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

    // Detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectResources, setProjectResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);

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

    // Extend/Release Action states
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [selectedResourceForAction, setSelectedResourceForAction] = useState(null);
    const [actionDate, setActionDate] = useState('');
    const [actionReason, setActionReason] = useState('');
    const [minDate, setMinDate] = useState('');

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
            showNotification('Extension request submitted for approval!', 'success');
            setShowExtendModal(false);
            fetchProjectResources(selectedProject.projectId);
        } catch (error) {
            console.error('Error extending assignment:', error);
            showNotification(error.response?.data?.message || 'Failed to extend assignment', 'error');
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
            showNotification('Release request submitted for approval!', 'success');
            setShowReleaseModal(false);
            fetchProjectResources(selectedProject.projectId);
        } catch (error) {
            console.error('Error releasing assignment:', error);
            showNotification(error.response?.data?.message || 'Failed to release assignment', 'error');
        }
    };

    const handleViewDetail = (project) => {
        setSelectedProject(project);
        setShowDetailModal(true);
        setShowExtendModal(false);
        setShowReleaseModal(false);
        fetchProjectResources(project.projectId);
    };

    // Body scroll locking
    useEffect(() => {
        if (showNewProjectModal || showDetailModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showNewProjectModal, showDetailModal]);

    const handleProposeProject = async () => {
        if (!projectProposal.projectName.trim() || !projectProposal.clientName.trim() || projectProposal.resourcePlan.length === 0) {
            showNotification('Please fill project details and add resources', 'error');
            return;
        }

        // Date validation for resource plan
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const item of projectProposal.resourcePlan) {
            const start = new Date(item.startDate);
            const end = new Date(item.endDate);

            if (start < today) {
                showNotification(`Start Date for a resource cannot be in the past`, 'error');
                return;
            }

            if (end <= start) {
                showNotification(`End Date must be after Start Date for all resources`, 'error');
                return;
            }
        }

        try {
            await api.post('/requests/project', projectProposal);
            setShowNewProjectModal(false);
            setProjectProposal({ projectName: '', clientName: '', description: '', resourcePlan: [] });
            showNotification('Project proposal submitted successfully!', 'success');
        } catch (error) {
            console.error('Error proposing project:', error);
            showNotification('Failed to submit proposal', 'error');
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
        // Prevent duplicate resource selection
        if (field === 'resourceId' || field === 'role') {
            const currentItem = projectProposal.resourcePlan[index];
            const resourceId = field === 'resourceId' ? value : currentItem.resourceId;
            const role = field === 'role' ? value : currentItem.role;

            if (resourceId && role) {
                const isDuplicate = projectProposal.resourcePlan.some((item, idx) =>
                    idx !== index && item.resourceId === resourceId && item.role === role
                );
                if (isDuplicate) {
                    showNotification('This resource is already added to the plan with this role', 'error');
                    return;
                }
            }
        }

        const newPlan = [...projectProposal.resourcePlan];
        newPlan[index][field] = value;
        setProjectProposal({ ...projectProposal, resourcePlan: newPlan });
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

    const handleExport = () => {
        try {
            const exportData = filteredProjects.map(project => ({
                'Project Name': project.projectName,
                'Client': project.clientName,
                'Status': project.status,
                'DevMan': project.devManName || '-',
                'Active Resources': project.activeResourceCount || 0
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Projects');
            XLSX.writeFile(wb, `DevMan_Projects_${new Date().toISOString().split('T')[0]}.xlsx`);

            showNotification('Project data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            showNotification('Failed to export data', 'error');
        }
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
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase());

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
            <div className="flex-1 p-8 ml-[267px]">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Projects</h1>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-8">
                    {/* Left: Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Find projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-80 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CAF0F8]" style={{ fontFamily: 'SF Pro Display' }} />
                    </div>

                    {/* Right: Filters & Actions */}
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                            {filterTabs.map(tab => (
                                <button key={tab} onClick={() => setActiveFilter(tab)} className={`px-6 py-2 rounded-md font-bold transition-colors ${activeFilter === tab ? 'bg-[#CAF0F8] text-black shadow-md' : 'text-gray-500 hover:bg-gray-100'}`} style={{ fontFamily: 'SF Pro Display' }}>{tab}</button>
                            ))}
                        </div>
                        <button onClick={() => setShowNewProjectModal(true)} className="px-6 py-2 bg-[#CAF0F8] text-black rounded-lg font-bold hover:bg-[#b8e8ef] transition-colors" style={{ fontFamily: 'SF Pro Display' }}>+ Propose Project</button>
                    </div>
                </div>

                {/* Project List */}
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500 font-bold" style={{ fontFamily: 'SF Pro Display' }}>Loading projects...</div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl text-gray-500 font-bold" style={{ fontFamily: 'SF Pro Display' }}>No projects found.</div>
                    ) : (
                        filteredProjects.map(project => (
                            <div key={project.projectId} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Folder className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'SF Pro Display' }}>{project.projectName}</h3>
                                        <p className="text-gray-500 font-medium" style={{ fontFamily: 'SF Pro Display' }}>{project.clientName} • <span className="text-[#00B4D8] font-bold">{project.devManName}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <StatusBadge status={project.status} />
                                        <div className="text-black text-sm mt-2 font-medium flex items-center justify-end gap-2" style={{ fontFamily: 'SF Pro Display' }}>
                                            <Users className="w-4 h-4" /> {project.memberCount}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleViewDetail(project)}
                                        className="px-6 py-2 bg-[#CAF0F8] text-black rounded-lg font-bold hover:bg-[#b8e8ef] transition-colors"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    >
                                        View Detail
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Modal Container - Wraps both Project Detail and Action Modals */}
            {showDetailModal && selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto animate-fade-in">
                    <div className="flex items-center gap-6 transition-smooth-layout min-w-min">
                        {/* Project Detail Modal */}
                        <div className="bg-white rounded-2xl p-8 w-[800px] flex-shrink-0 relative shadow-xl">
                            <button onClick={() => setShowDetailModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-4 mb-2">
                                <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>{selectedProject.projectName}</h2>
                                <StatusBadge status={selectedProject.status} />
                            </div>

                            <div className="flex gap-8 mb-6">
                                <div className="text-sm font-medium text-gray-500" style={{ fontFamily: 'SF Pro Display' }}>Client Name : <span className="text-gray-800 font-bold">{selectedProject.clientName}</span></div>
                                <div className="text-sm font-medium text-gray-500" style={{ fontFamily: 'SF Pro Display' }}>DevMan : <span className="text-gray-800 font-bold">{selectedProject.devManName}</span></div>
                            </div>

                            <div className="border-t border-gray-100 my-6"></div>

                            <h3 className="text-xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'SF Pro Display' }}>Assigned Resources</h3>

                            <div className="bg-[#F8FBFC] rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-[#CAF0F8] border-b border-gray-200 text-left">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-black text-center" style={{ fontFamily: 'SF Pro Display' }}>Name</th>
                                            <th className="px-6 py-4 font-bold text-center text-black" style={{ fontFamily: 'SF Pro Display' }}>Role</th>
                                            <th className="px-6 py-4 font-bold text-center text-black" style={{ fontFamily: 'SF Pro Display' }}>Period</th>
                                            <th className="px-6 py-4 font-bold text-center text-black" style={{ fontFamily: 'SF Pro Display' }}>Status</th>
                                            <th className="px-6 py-4 font-bold text-center text-black" style={{ fontFamily: 'SF Pro Display' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-[#E6F2F1]">
                                        {projectResources.map((res, idx) => (
                                            <tr key={idx} className="border-b border-gray-200 last:border-none">
                                                <td className="px-6 py-6 font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>{res.resourceName}</td>
                                                <td className="px-6 py-6 text-center font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>{res.role || '-'}</td>
                                                <td className="px-6 py-6 text-center font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>{formatDate(res.startDate)} - {formatDate(res.endDate)}</td>
                                                <td className="px-6 py-6 text-center">
                                                    <StatusBadge status={res.status} className="text-[10px]" />
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        {res.status === 'RELEASED' || res.status === 'EXPIRED' ? (
                                                            <span className="text-gray-400 text-xs font-bold" style={{ fontFamily: 'SF Pro Display' }}>-</span>
                                                        ) : pendingRequests.some(req => req.assignmentId && String(req.assignmentId) === String(res.assignmentId)) ? (
                                                            <StatusBadge status="PENDING" className="text-[10px]" />
                                                        ) : res.status === 'ACTIVE' ? (
                                                            <>
                                                                <button onClick={() => handleOpenExtendModal(res)} className="px-4 py-1.5 rounded-full bg-[#FFEEDD] text-[#F97316] font-bold text-[10px] border border-[#F97316] hover:bg-[#F97316]/20" style={{ fontFamily: 'SF Pro Display' }}>EXTEND</button>
                                                                <button onClick={() => handleOpenReleaseModal(res)} className="px-4 py-1.5 rounded-full bg-[#FFDDEE] text-[#FF0000] font-bold text-[10px] border border-[#FF0000] hover:bg-[#FF0000]/20" style={{ fontFamily: 'SF Pro Display' }}>RELEASE</button>
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

                        {/* Extend/Release Actions - Rendered Side-by-Side */}
                        {(showExtendModal || showReleaseModal) && (
                            <div className="w-[400px] h-fit bg-[#F5F5F5] shadow-2xl rounded-3xl p-6 flex flex-col animate-slide-reveal">

                                {showExtendModal && (
                                    <>
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
                                                        min={minDate}
                                                        onChange={(e) => setActionDate(e.target.value)}
                                                        className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-400 rounded-xl focus:ring-2 focus:ring-[#0057FF] outline-none text-black"
                                                        style={{ fontFamily: 'SF Pro Display' }}
                                                    />
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
                                    </>
                                )}

                                {showReleaseModal && (
                                    <>
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
                                                <label className="block text-sm font-bold mb-2 text-black" style={{ fontFamily: 'SF Pro Display' }}>Reason for Early Release</label>
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
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}



            {/* Propose Project Modal (Styled) */}
            {showNewProjectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
                    <div className="bg-[#F5F5F5] rounded-2xl p-8 w-[900px] max-h-[90vh] overflow-y-auto relative animate-scale-in">
                        <button
                            onClick={() => setShowNewProjectModal(false)}
                            className="absolute top-6 right-6 text-black hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h2 className="text-3xl font-bold text-black mb-8" style={{ fontFamily: 'SF Pro Display' }}>Propose New Project</h2>

                        <div className="border-b border-gray-300 mb-8"></div>

                        <div className="space-y-6 mb-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-black mb-2" style={{ fontFamily: 'SF Pro Display' }}>Project Name</label>
                                    <input
                                        type="text"
                                        value={projectProposal.projectName}
                                        onChange={(e) => setProjectProposal({ ...projectProposal, projectName: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:ring-2 focus:ring-[#CAF0F8] outline-none"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-black mb-2" style={{ fontFamily: 'SF Pro Display' }}>Client Name</label>
                                    <input
                                        type="text"
                                        value={projectProposal.clientName}
                                        onChange={(e) => setProjectProposal({ ...projectProposal, clientName: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:ring-2 focus:ring-[#CAF0F8] outline-none"
                                        style={{ fontFamily: 'SF Pro Display' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-black" style={{ fontFamily: 'SF Pro Display' }}>Description</label>
                                <textarea
                                    value={projectProposal.description}
                                    onChange={(e) => setProjectProposal({ ...projectProposal, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-black rounded-xl focus:ring-2 focus:ring-[#CAF0F8] outline-none resize-none"
                                    rows="3"
                                    style={{ fontFamily: 'SF Pro Display' }}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl text-black" style={{ fontFamily: 'SF Pro Display' }}>Required Resources</h3>
                            <button
                                onClick={addResourceToPlan}
                                className="text-black font-bold text-sm bg-[#CAF0F8] px-4 py-2 rounded-lg hover:bg-[#b8e8ef] transition-colors"
                                style={{ fontFamily: 'SF Pro Display' }}
                            >
                                + Add Resource
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            {projectProposal.resourcePlan.length === 0 ? (
                                <p className="text-gray-500 italic text-center py-4">No resources added to plan yet.</p>
                            ) : (
                                projectProposal.resourcePlan.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-end bg-white p-4 rounded-xl border border-gray-200">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold mb-1 ml-1 text-gray-700">Resource</label>
                                            <div className="relative">
                                                <select
                                                    value={item.resourceId}
                                                    onChange={(e) => updateResourcePlanItem(idx, 'resourceId', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg bg-white appearance-none text-sm"
                                                >
                                                    <option value="">Select Resource</option>
                                                    {availableResources.map(r => (<option key={r.resourceId} value={r.resourceId}>{r.resourceName}</option>))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold mb-1 ml-1 text-gray-700">Role</label>
                                            <div className="relative">
                                                <select
                                                    value={item.role}
                                                    onChange={(e) => updateResourcePlanItem(idx, 'role', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg bg-white appearance-none text-sm"
                                                >
                                                    <option value="">Select Role</option>
                                                    <option value="Team Lead">Team Lead</option>
                                                    <option value="Backend Developer">Backend Developer</option>
                                                    <option value="Frontend Developer">Frontend Developer</option>
                                                    <option value="Quality Assurance">Quality Assurance</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-xs font-bold mb-1 ml-1 text-gray-700">Start</label>
                                            <input
                                                type="date"
                                                value={item.startDate}
                                                onChange={(e) => updateResourcePlanItem(idx, 'startDate', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-xs font-bold mb-1 ml-1 text-gray-700">End</label>
                                            <input
                                                type="date"
                                                value={item.endDate}
                                                onChange={(e) => updateResourcePlanItem(idx, 'endDate', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                        </div>
                                        <button onClick={() => removeResourceFromPlan(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

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
                                    onClick={handleProposeProject}
                                    className="px-6 py-2 bg-[#CAF0F8] text-black rounded-lg font-bold hover:opacity-90 transition-colors"
                                    style={{ fontFamily: 'SF Pro Display' }}
                                >
                                    Submit Proposal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevmanProject;
