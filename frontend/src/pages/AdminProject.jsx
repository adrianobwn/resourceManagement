import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import { Search, Users, Trash2, X, Calendar } from 'lucide-react';

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

    const handleOpenExtendModal = (resource) => {
        setSelectedResourceForAction(resource);
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
            fetchProjectResources(selectedProject.projectId);
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

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#E6F2F1]">
                <div className="text-xl font-bold">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#E6F2F1] font-['SF_Pro_Display']">
            <Sidebar />

            {/* Notification */}
            {notification.show && (
                <div
                    className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${notification.closing ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
                    style={{
                        backgroundColor: notification.type === 'error' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(6, 208, 1, 0.2)',
                        border: `1px solid ${notification.type === 'error' ? '#FF0000' : '#06D001'}`
                    }}
                >
                    <span className="font-bold" style={{ color: notification.type === 'error' ? '#FF0000' : '#06D001' }}>{notification.message}</span>
                    <button onClick={closeNotification} className="ml-2">
                        <X className="w-4 h-4" style={{ color: notification.type === 'error' ? '#FF0000' : '#06D001' }} />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 p-8 ml-[267px]">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800" style={{ fontFamily: 'SF Pro Display' }}>Admin Projects</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExport}
                            className="px-6 py-2 bg-white text-gray-700 rounded-lg font-bold border border-gray-200 hover:bg-gray-50"
                            style={{ fontFamily: 'SF Pro Display' }}
                        >
                            Export
                        </button>
                        <button
                            onClick={() => setShowNewProjectModal(true)}
                            className="px-6 py-2 bg-[#00B4D8] text-white rounded-lg font-bold hover:opacity-90"
                            style={{ fontFamily: 'SF Pro Display' }}
                        >
                            + New Project
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                        {filterTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={`px-6 py-2 rounded-md font-bold transition-all ${activeFilter === tab ? 'bg-[#00B4D8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                style={{ fontFamily: 'SF Pro Display' }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-80 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] font-medium"
                            style={{ fontFamily: 'SF Pro Display' }}
                        />
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
                                    <div className="w-12 h-12 bg-[#E6F2F1] rounded-xl flex items-center justify-center">
                                        <Users className="w-6 h-6 text-[#00B4D8]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1">{project.projectName}</h3>
                                        <p className="text-gray-500 font-medium">{project.clientName} • <span className="text-[#00B4D8] font-bold">PM: {project.pmName}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <span className="text-xs px-3 py-1 rounded-full font-bold" style={getStatusBadgeStyle(project.status)}>
                                            {getStatusLabel(project.status)}
                                        </span>
                                        <p className="text-gray-400 text-sm mt-2 font-medium">{project.memberCount} Members assigned</p>
                                    </div>
                                    <button
                                        onClick={() => handleViewDetail(project)}
                                        className="px-6 py-2 bg-[#E6F2F1] text-[#00B4D8] rounded-lg font-bold hover:bg-[#CAF0F8] transition-colors"
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

            {/* Detail Modal */}
            {showDetailModal && selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                    <div className={`bg-white rounded-2xl p-8 w-[800px] relative transition-transform duration-300 ${showExtendModal || showReleaseModal ? '-translate-x-[20%]' : ''}`}>
                        <button onClick={() => setShowDetailModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-3xl font-bold text-gray-800">{selectedProject.projectName}</h2>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">
                                {selectedProject.status === 'ON_GOING' ? 'ONGOING' : selectedProject.status}
                            </span>
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
                                    <thead className="border-b border-gray-200 text-left">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-gray-700 text-center">Name</th>
                                            <th className="px-6 py-4 font-bold text-center text-gray-700">Period</th>
                                            <th className="px-6 py-4 font-bold text-center text-gray-700">Status</th>
                                            <th className="px-6 py-4 font-bold text-center text-gray-100">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {projectResources.map((res, idx) => (
                                            <tr key={idx} className="border-b border-gray-50 last:border-none">
                                                <td className="px-6 py-6 font-bold text-gray-800">{res.resourceName}</td>
                                                <td className="px-6 py-6 text-center font-bold text-gray-800">{formatDate(res.startDate)} - {formatDate(res.endDate)}</td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className="px-4 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-600">
                                                        {res.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => handleOpenExtendModal(res)} className="px-4 py-1.5 rounded-full bg-[#FFEEDD] text-[#F97316] font-bold text-[10px] hover:bg-[#F97316]/20">EXTEND</button>
                                                        <button onClick={() => handleOpenReleaseModal(res)} className="px-4 py-1.5 rounded-full bg-[#FFDDEE] text-[#FF0000] font-bold text-[10px] hover:bg-[#FF0000]/20">RELEASE</button>
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
                    <div className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-60 transform transition-transform duration-300 rounded-l-2xl p-8 ${showExtendModal ? 'translate-x-0' : 'translate-x-full'}`}>
                        <h3 className="text-xl font-bold mb-6">Extend Assignment</h3>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-bold mb-2">New End Date</label><input type="date" value={actionDate} onChange={(e) => setActionDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00B4D8] outline-none" /></div>
                            <div><label className="block text-sm font-bold mb-2">Reason</label><textarea rows="4" value={actionReason} onChange={(e) => setActionReason(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00B4D8] outline-none" placeholder="Enter reason..."></textarea></div>
                        </div>
                        <div className="flex gap-3 mt-8"><button onClick={() => setShowExtendModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">Cancel</button><button onClick={handleExtendSubmit} className="flex-1 py-2 bg-[#0057FF] text-white rounded-lg font-bold">Confirm</button></div>
                    </div>

                    {/* Release Sidebar */}
                    <div className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-60 transform transition-transform duration-300 rounded-l-2xl p-8 ${showReleaseModal ? 'translate-x-0' : 'translate-x-full'}`}>
                        <h3 className="text-xl font-bold mb-6">Release Assignment</h3>
                        <div className="p-4 bg-yellow-50 text-yellow-800 text-sm mb-6 rounded-lg font-medium">Release effective today ({new Date().toLocaleDateString('id-ID')}).</div>
                        <div><label className="block text-sm font-bold mb-2">Reason</label><textarea rows="4" value={actionReason} onChange={(e) => setActionReason(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00B4D8] outline-none" placeholder="Reason for early release..."></textarea></div>
                        <div className="flex gap-3 mt-8"><button onClick={() => setShowReleaseModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">Cancel</button><button onClick={handleReleaseSubmit} className="flex-1 py-2 bg-[#FF0000] text-white rounded-lg font-bold">Confirm</button></div>
                    </div>
                </div>
            )}

            {/* New Project Modal */}
            {showNewProjectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-[500px]">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Project</h2>
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={newProject.projectName}
                                    onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00B4D8] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Client Name</label>
                                <input
                                    type="text"
                                    value={newProject.clientName}
                                    onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00B4D8] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">DevMan</label>
                                <select
                                    value={newProject.pmId}
                                    onChange={(e) => setNewProject({ ...newProject, pmId: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00B4D8] outline-none bg-white"
                                >
                                    <option value="">Select DevMan</option>
                                    {pmList.map(pm => (
                                        <option key={pm.userId} value={pm.userId}>{pm.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowNewProjectModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Cancel</button>
                            <button onClick={handleCreateProject} className="flex-1 px-6 py-3 bg-[#00B4D8] text-white rounded-lg font-bold hover:opacity-90">Save Project</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProject;
