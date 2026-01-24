import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import { Search, Users, Trash2, X, Calendar } from 'lucide-react';

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

    const handleProposeProject = async () => {
        if (!projectProposal.projectName.trim() || !projectProposal.clientName.trim() || projectProposal.resourcePlan.length === 0) {
            showNotification('Please fill project details and add resources', 'error');
            return;
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

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, closing: true }));
        setTimeout(() => {
            setNotification({ show: false, message: '', closing: false, type: 'success' });
        }, 300);
    };

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'ON_GOING':
                return { backgroundColor: 'rgba(6, 208, 1, 0.2)', color: '#06D001' };
            case 'HOLD':
                return { backgroundColor: 'rgba(251, 205, 63, 0.2)', color: '#FBCD3F' };
            case 'CLOSED':
                return { backgroundColor: 'rgba(255, 0, 0, 0.2)', color: '#FF0000' };
            default:
                return { backgroundColor: 'rgba(0, 180, 216, 0.2)', color: '#00B4D8' };
        }
    };

    const filteredProjects = projects.filter(p => {
        const matchesStatus = activeFilter === 'All' ||
            (activeFilter === 'Ongoing' && p.status === 'ON_GOING') ||
            (activeFilter === 'Hold' && p.status === 'HOLD') ||
            (activeFilter === 'Closed' && p.status === 'CLOSED');

        const matchesSearch = !searchQuery.trim() ||
            p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    if (!user) return null;

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
                    <button onClick={closeNotification} className="ml-2"><X className="w-4 h-4" style={{ color: notification.type === 'error' ? '#FF0000' : '#06D001' }} /></button>
                </div>
            )}

            <div className="flex-1 p-8 ml-[267px]">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Projects</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={handleExport} className="px-6 py-2 bg-white text-gray-700 rounded-lg font-bold border border-gray-200">Export</button>
                        <button onClick={() => setShowNewProjectModal(true)} className="px-6 py-2 bg-[#00B4D8] text-white rounded-lg font-bold">+ Propose Project</button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                        {filterTabs.map(tab => (
                            <button key={tab} onClick={() => setActiveFilter(tab)} className={`px-6 py-2 rounded-md font-bold ${activeFilter === tab ? 'bg-[#00B4D8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>{tab}</button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Find projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-80 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8]" />
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
                                    <div className="w-12 h-12 bg-[#E6F2F1] rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-[#00B4D8]" /></div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1">{project.projectName}</h3>
                                        <p className="text-gray-500 font-medium">{project.clientName} • <span className="text-[#00B4D8] font-bold">{project.pmName}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <span className="text-xs px-3 py-1 rounded-full font-bold" style={getStatusBadgeStyle(project.status)}>{project.status}</span>
                                        <p className="text-gray-400 text-sm mt-2 font-medium">{project.memberCount} Members</p>
                                    </div>
                                    <button onClick={() => handleViewDetail(project)} className="px-6 py-2 bg-[#E6F2F1] text-[#00B4D8] rounded-lg font-bold hover:bg-[#CAF0F8]">View Detail</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className={`bg-white rounded-2xl p-8 w-[800px] relative transition-transform duration-300 ${showExtendModal || showReleaseModal ? '-translate-x-[20%]' : ''}`}>
                        <button onClick={() => setShowDetailModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">{selectedProject.projectName}</h2>
                        <div className="bg-gray-50 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-100 text-left">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Resource</th>
                                        <th className="px-6 py-4 font-bold text-center">Period</th>
                                        <th className="px-6 py-4 font-bold text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectResources.map((res, idx) => (
                                        <tr key={idx} className="border-t border-gray-100">
                                            <td className="px-6 py-4 font-bold">{res.resourceName}</td>
                                            <td className="px-6 py-4 text-center text-sm">{formatDate(res.startDate)} - {formatDate(res.endDate)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleOpenExtendModal(res)} className="px-3 py-1 rounded bg-yellow-100 text-yellow-600 font-bold text-xs">EXTEND</button>
                                                    <button onClick={() => handleOpenReleaseModal(res)} className="px-3 py-1 rounded bg-red-100 text-red-600 font-bold text-xs">RELEASE</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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

            {/* Propose Project Modal */}
            {showNewProjectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-[800px] max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Propose New Project</h2><button onClick={() => setShowNewProjectModal(false)}><X className="w-6 h-6" /></button></div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div><label className="block text-sm font-bold mb-2">Project Name</label><input type="text" value={projectProposal.projectName} onChange={(e) => setProjectProposal({ ...projectProposal, projectName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
                            <div><label className="block text-sm font-bold mb-2">Client Name</label><input type="text" value={projectProposal.clientName} onChange={(e) => setProjectProposal({ ...projectProposal, clientName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
                        </div>
                        <div className="mb-6"><label className="block text-sm font-bold mb-2">Description</label><textarea value={projectProposal.description} onChange={(e) => setProjectProposal({ ...projectProposal, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows="3"></textarea></div>
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold">Required Resources</h3><button onClick={addResourceToPlan} className="text-[#00B4D8] font-bold text-sm">+ Add Resource</button></div>
                        <div className="space-y-4 mb-8">
                            {projectProposal.resourcePlan.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-end bg-gray-50 p-4 rounded-xl">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold mb-1">Resource</label>
                                        <select value={item.resourceId} onChange={(e) => updateResourcePlanItem(idx, 'resourceId', e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                                            <option value="">Select Resource</option>
                                            {availableResources.map(r => (<option key={r.resourceId} value={r.resourceId}>{r.resourceName}</option>))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold mb-1">Role</label>
                                        <input type="text" value={item.role} onChange={(e) => updateResourcePlanItem(idx, 'role', e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Role" />
                                    </div>
                                    <div className="w-32"><label className="block text-xs font-bold mb-1">Start</label><input type="date" value={item.startDate} onChange={(e) => updateResourcePlanItem(idx, 'startDate', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                    <div className="w-32"><label className="block text-xs font-bold mb-1">End</label><input type="date" value={item.endDate} onChange={(e) => updateResourcePlanItem(idx, 'endDate', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                    <button onClick={() => removeResourceFromPlan(idx)} className="p-2 text-red-500"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4"><button onClick={() => setShowNewProjectModal(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-lg">Cancel</button><button onClick={handleProposeProject} className="flex-1 py-3 bg-[#00B4D8] text-white font-bold rounded-lg">Submit Proposal</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevmanProject;
