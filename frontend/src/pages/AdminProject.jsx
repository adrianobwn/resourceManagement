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
                    <h1 className="text-4xl font-bold text-gray-800">Admin Projects</h1>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExport}
                            className="px-6 py-2 bg-white text-gray-700 rounded-lg font-bold border border-gray-200 hover:bg-gray-50"
                        >
                            Export
                        </button>
                        <button
                            onClick={() => setShowNewProjectModal(true)}
                            className="px-6 py-2 bg-[#00B4D8] text-white rounded-lg font-bold hover:opacity-90"
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
                    <div className="bg-white rounded-2xl p-8 w-[800px] relative">
                        <button onClick={() => setShowDetailModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedProject.projectName}</h2>
                            <p className="text-gray-500 font-medium">Client: {selectedProject.clientName} • PM: {selectedProject.pmName}</p>
                        </div>
                        <div className="border-t border-gray-100 my-6"></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Project Resources</h3>
                        {loadingResources ? (
                            <p className="text-center py-8 text-gray-500 font-bold">Loading resources...</p>
                        ) : projectResources.length === 0 ? (
                            <p className="text-center py-8 text-gray-500 font-bold">No resources assigned.</p>
                        ) : (
                            <div className="bg-gray-50 rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left bg-gray-100">
                                            <th className="px-6 py-4 font-bold text-gray-700">Name</th>
                                            <th className="px-6 py-4 font-bold text-gray-700">Role</th>
                                            <th className="px-6 py-4 font-bold text-center text-gray-700">Period</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {projectResources.map((res, idx) => (
                                            <tr key={idx} className="border-b border-gray-100 last:border-none">
                                                <td className="px-6 py-4 font-bold text-gray-800">{res.resourceName}</td>
                                                <td className="px-6 py-4 text-gray-600 font-medium">{res.role}</td>
                                                <td className="px-6 py-4 text-center text-gray-600 font-medium">{formatDate(res.startDate)} - {formatDate(res.endDate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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
