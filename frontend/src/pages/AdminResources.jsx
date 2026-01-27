import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import * as XLSX from 'xlsx';

const AdminResources = () => {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [filteredResources, setFilteredResources] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '' });
    const [detailModal, setDetailModal] = useState({ show: false, resource: null, projects: [] });
    const [addResourceModal, setAddResourceModal] = useState({ show: false });
    const [addDevManModal, setAddDevManModal] = useState({ show: false });
    const [assignModal, setAssignModal] = useState({ show: false, resource: null });
    const [trackRecordModal, setTrackRecordModal] = useState({ show: false, resource: null });
    const [newResource, setNewResource] = useState({
        fullName: '',
        email: ''
    });
    const [newDevMan, setNewDevMan] = useState({
        fullName: '',
        email: '',
        password: ''
    });
    const [assignmentData, setAssignmentData] = useState({
        project: '',
        role: '',
        startDate: '',
        endDate: ''
    });
    const [skillInput, setSkillInput] = useState('');
    const [hoveredProject, setHoveredProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (!token || !storedUser) {
            navigate('/');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchResources();
        fetchProjects();
    }, [navigate]);

    const fetchResources = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/resources?t=${Date.now()}`);
            setResources(response.data);
            setFilteredResources(response.data);
            console.log('Fetched resources count:', response.data.length);
        } catch (error) {
            console.error('Error fetching resources:', error);
            showNotification('Failed to fetch resources', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleDateFilterChange = (e) => {
        setDateFilter(e.target.value);
    };

    useEffect(() => {
        // Start with all resources
        let result = resources.map(r => ({ ...r })); // create shallow copy

        // 1. apply DATE FILTER first to determine status/availability on that specific date
        if (dateFilter) {
            const selectedDate = new Date(dateFilter);
            selectedDate.setHours(0, 0, 0, 0);

            result = result.map(resource => {
                // Check if resource has an active assignment on the selected date
                const activeAssignmentOnDate = resource.currentAssignments?.find(assignment => {
                    const start = new Date(assignment.startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(assignment.endDate);
                    end.setHours(0, 0, 0, 0);

                    // Check if selected date is within range [start, end]
                    // Also check assignmentStatus if needed, but usually date range + ACTIVE status is enough
                    // Assuming we only care about 'ACTIVE' assignments or similar. 
                    // If the backend returns all history, we should check status too.
                    return selectedDate >= start && selectedDate <= end && assignment.assignmentStatus === 'ACTIVE';
                });

                if (activeAssignmentOnDate) {
                    return {
                        ...resource,
                        status: 'ASSIGNED',
                        // Store the role for this specific date for role filtering later
                        _dateSpecificRole: activeAssignmentOnDate.projectRole
                    };
                } else {
                    return {
                        ...resource,
                        status: 'AVAILABLE',
                        _dateSpecificRole: null
                    };
                }
            });
        }

        // 2. Filter by status
        if (activeFilter !== 'all') {
            result = result.filter(
                (r) => r.status.toLowerCase() === activeFilter.toLowerCase()
            );
        }

        // 3. Filter by search query
        if (searchQuery) {
            result = result.filter((r) =>
                r.resourceName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // 4. Filter by role
        if (roleFilter !== 'all') {
            result = result.filter((r) => {
                // If date is selected, use the specific role determined above
                if (dateFilter) {
                    return r._dateSpecificRole === roleFilter;
                }

                // Fallback to original logic: check any current assignment
                if (!r.currentAssignments || r.currentAssignments.length === 0) {
                    return false;
                }
                return r.currentAssignments.some(
                    (assignment) => assignment.projectRole === roleFilter
                );
            });
        }

        setFilteredResources(result);
    }, [searchQuery, activeFilter, roleFilter, resources, dateFilter]);

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type, closing: false });
        // Auto hide after 4 seconds with smooth animation
        setTimeout(() => {
            setNotification(prev => ({ ...prev, closing: true }));
            setTimeout(() => {
                setNotification({ show: false, message: '', type: 'info', closing: false });
            }, 300);
        }, 4000);
    };

    const handleExport = () => {
        try {
            // Prepare data rows
            const exportData = [];

            resources.forEach((resource) => {
                if (resource.status === 'AVAILABLE') {
                    // For AVAILABLE resources, add one row with empty project fields
                    exportData.push({
                        'Nama': resource.resourceName,
                        'Role': '',
                        'Status': resource.status,
                        'Project': '',
                        'Start Date': '',
                        'End Date': ''
                    });
                } else if (resource.status === 'ASSIGNED' && resource.currentAssignments) {
                    // For ASSIGNED resources, add a row for each active assignment
                    if (resource.currentAssignments.length === 0) {
                        // If no assignments found, add one row with empty project fields
                        exportData.push({
                            'Nama': resource.resourceName,
                            'Role': '',
                            'Status': resource.status,
                            'Project': '',
                            'Start Date': '',
                            'End Date': ''
                        });
                    } else {
                        resource.currentAssignments.forEach((assignment) => {
                            exportData.push({
                                'Nama': resource.resourceName,
                                'Role': assignment.projectRole,
                                'Status': resource.status,
                                'Project': assignment.projectName,
                                'Start Date': new Date(assignment.startDate).toLocaleDateString('en-GB'),
                                'End Date': new Date(assignment.endDate).toLocaleDateString('en-GB')
                            });
                        });
                    }
                }
            });

            // Create workbook and worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Resources');

            // Set column widths for better readability
            const columnWidths = [
                { wch: 30 }, // Nama
                { wch: 25 }, // Role
                { wch: 12 }, // Status
                { wch: 35 }, // Project
                { wch: 15 }, // Start Date
                { wch: 15 }  // End Date
            ];
            worksheet['!cols'] = columnWidths;

            // Generate filename with current date
            const fileName = `Resource_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Export file
            XLSX.writeFile(workbook, fileName);

            showNotification('Export successful! File downloaded.', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showNotification('Failed to export data', 'error');
        }
    };

    const handleAddDevMan = () => {
        setAddDevManModal({ show: true });
    };

    const closeAddDevManModal = () => {
        setAddDevManModal({ show: false });
        setNewDevMan({
            fullName: '',
            email: '',
            password: ''
        });
    };

    const handleSaveDevMan = async () => {
        // Validation
        if (!newDevMan.fullName || !newDevMan.email || !newDevMan.password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await api.post('/users/pm', {
                name: newDevMan.fullName,
                email: newDevMan.email,
                password: newDevMan.password
            });
            console.log('DevMan API Response Status:', response.status);
            console.log('DevMan successfully created:', response.data);
            closeAddDevManModal();
            showNotification('Saved Successfully! DevMan created successfully.', 'success');
            setSearchQuery('');
            setActiveFilter('all');
        } catch (error) {
            console.error('Error creating DevMan:', error);
            showNotification(error.response?.data?.message || 'Failed to create DevMan', 'error');
        }
    };

    const handleAssignToProject = (resource) => {
        setAssignModal({ show: true, resource });
    };

    const closeAssignModal = () => {
        setAssignModal({ show: false, resource: null });
        setAssignmentData({
            project: '',
            role: '',
            startDate: '',
            endDate: ''
        });
    };

    const handleAssign = async () => {
        // Validation
        if (!assignmentData.project || !assignmentData.role || !assignmentData.startDate || !assignmentData.endDate) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Date range validation
        if (new Date(assignmentData.endDate) < new Date(assignmentData.startDate)) {
            showNotification('End Date cannot be before Start Date', 'error');
            return;
        }

        try {
            const assignData = {
                resourceId: assignModal.resource.resourceId,
                projectId: parseInt(assignmentData.project),
                projectRole: assignmentData.role,
                startDate: assignmentData.startDate,
                endDate: assignmentData.endDate
            };

            if (user.userType === 'ADMIN') {
                await api.post('/resources/assign', assignData);
                showNotification('Assigned Successfully!', 'success');
            } else {
                await api.post('/requests/assign', assignData);
                showNotification('Assignment request submitted for approval!', 'success');
            }

            closeAssignModal();
            fetchResources(); // Refresh the list
        } catch (error) {
            console.error('Error assigning resource:', error);
            showNotification(error.response?.data?.message || 'Failed to assign resource', 'error');
        }
    };

    const getProjectBadgeColors = (projectCount) => {
        if (projectCount <= 1) {
            return {
                border: '#06D001',
                background: 'rgba(6, 208, 1, 0.2)',
                text: '#06D001'
            };
        } else if (projectCount === 2) {
            return {
                border: '#F97316',
                background: 'rgba(249, 115, 22, 0.2)',
                text: '#F97316'
            };
        } else {
            return {
                border: '#FF0000',
                background: 'rgba(255, 0, 0, 0.2)',
                text: '#FF0000'
            };
        }
    };;

    const handleAddResource = () => {
        setAddResourceModal({ show: true });
    };

    const closeAddResourceModal = () => {
        setAddResourceModal({ show: false });
        setNewResource({
            fullName: '',
            email: ''
        });
    };

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            if (!newResource.skills.includes(skillInput.trim())) {
                setNewResource(prev => ({
                    ...prev,
                    skills: [...prev.skills, skillInput.trim()]
                }));
            }
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setNewResource(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    const handleSaveResource = async () => {
        // Validation
        if (!newResource.fullName || !newResource.email) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            const resourceData = {
                resourceName: newResource.fullName,
                email: newResource.email,
                status: 'AVAILABLE'
            };
            const response = await api.post('/resources', resourceData);
            console.log('Resource API Response Status:', response.status);
            console.log('Resource successfully created:', response.data);
            closeAddResourceModal();
            showNotification('Saved Successfully! Resource created successfully.', 'success');
            setSearchQuery('');
            setActiveFilter('all');
            fetchResources(); // Refresh the list
        } catch (error) {
            console.error('Error creating resource:', error);
            showNotification(error.response?.data?.message || 'Failed to create resource', 'error');
        }
    };

    const handleViewDetail = async (resource) => {
        if (resource.status === 'AVAILABLE') {
            showNotification(`${resource.resourceName} Currently Available for Assignment`);
        } else {
            try {
                const response = await api.get(`/resources/${resource.resourceId}/assignments`);
                const assignments = response.data;

                // Format assignments for display
                const formattedProjects = assignments.map(a => ({
                    projectName: a.projectName,
                    role: a.projectRole,
                    startDate: new Date(a.startDate).toLocaleDateString('en-GB'),
                    endDate: new Date(a.endDate).toLocaleDateString('en-GB')
                }));

                setDetailModal({ show: true, resource, projects: formattedProjects });
            } catch (error) {
                console.error('Error fetching assignments:', error);
                showNotification('Failed to fetch resource assignments', 'error');
            }
        }
    };

    const closeDetailModal = () => {
        setDetailModal({ show: false, resource: null, projects: [] });
    };

    const handleViewTrackRecord = (resource) => {
        console.log('Track Record Resource:', resource);
        console.log('Resource Status:', resource.status);
        setTrackRecordModal({ show: true, resource });
    };

    const closeTrackRecordModal = () => {
        setTrackRecordModal({ show: false, resource: null });
    };

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, closing: true }));
        setTimeout(() => {
            setNotification({ show: false, message: '', closing: false });
        }, 300);
    };

    return (
        <div className="flex min-h-screen bg-[#E6F2F1] font-['SF_Pro_Display']">
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
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="#06D001"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    ) : notification.type === 'error' ? (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="#FF0000"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="#00B4D8"
                            viewBox="0 0 24 24"
                            style={{ color: '#00B4D8' }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
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

            {/* Detail Modal for ASSIGNED resources */}
            {detailModal.show && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out animate-fade-in"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div
                        className="bg-white rounded-2xl relative flex flex-col items-center animate-scale-in"
                        style={{ width: '700px', height: '424px' }}
                    >
                        {/* Header with Name, Status and Close Button */}
                        <div className="flex items-center justify-between mt-8 mb-4 px-8 w-full">
                            <h2 className="font-bold text-gray-800 whitespace-nowrap" style={{ fontSize: '30px' }}>
                                {detailModal.resource?.resourceName}
                            </h2>
                            <div className="flex items-center gap-4">
                                <span
                                    className="px-3 py-1 rounded-full font-bold whitespace-nowrap"
                                    style={{
                                        fontSize: '12px',
                                        color: '#00B4D8',
                                        backgroundColor: 'rgba(0, 180, 216, 0.2)',
                                        border: '1px solid #00B4D8'
                                    }}
                                >
                                    ACTIVE IN {detailModal.projects.length} PROJECTS
                                </span>
                                <button
                                    onClick={closeDetailModal}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Separator Line */}
                        <div className="w-[600px] border-b border-gray-200 mb-4"></div>

                        {/* Projects Table */}
                        <div
                            className="overflow-hidden rounded-lg border border-gray-200"
                            style={{ width: '600px', height: '234px' }}
                        >
                            <div className="overflow-auto h-full">
                                <table className="w-full table-fixed" style={{ borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr className="bg-[#CAF0F8] border-b border-gray-200">
                                            <th className="text-center py-3 px-4 font-bold text-gray-700 border-r border-gray-200" style={{ fontSize: '14px', width: '35%' }}>Project Name</th>
                                            <th className="text-center py-3 px-4 font-bold text-gray-700 border-r border-gray-200" style={{ fontSize: '14px', width: '25%' }}>Role</th>
                                            <th className="text-center py-3 px-4 font-bold text-gray-700 border-r border-gray-200" style={{ fontSize: '14px', width: '20%' }}>Start Date</th>
                                            <th className="text-center py-3 px-4 font-bold text-gray-700" style={{ fontSize: '14px', width: '20%' }}>End Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailModal.projects.map((project, index) => (
                                            <tr key={index} className="hover:bg-gray-50 border-b border-gray-200">
                                                <td className="py-3 px-4 font-bold text-gray-800 border-r border-gray-200 truncate text-center" style={{ fontSize: '14px' }}>{project.projectName}</td>
                                                <td className="py-3 px-4 font-bold text-gray-600 border-r border-gray-200 truncate text-center" style={{ fontSize: '14px' }}>{project.role}</td>
                                                <td className="py-3 px-4 font-bold text-gray-600 border-r border-gray-200 text-center" style={{ fontSize: '14px' }}>{project.startDate}</td>
                                                <td className="py-3 px-4 font-bold text-gray-600 text-center" style={{ fontSize: '14px' }}>{project.endDate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Resource Modal */}
            {addResourceModal.show && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out animate-fade-in"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div
                        className="rounded-2xl relative flex flex-col animate-scale-in"
                        style={{ width: '500px', maxHeight: '90vh', backgroundColor: '#F5F5F5' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pt-6 pb-4">
                            <h2 className="font-bold text-black" style={{ fontSize: '30px', fontFamily: 'SF Pro Display' }}>
                                Add New Resource
                            </h2>
                            <button
                                onClick={closeAddResourceModal}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Line below title */}
                        <div className="border-b border-gray-300 mx-0" style={{ width: '500px' }}></div>

                        {/* Form Content */}
                        <div className="px-8 py-4">
                            {/* Identity & Contact Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="font-bold text-black" style={{ fontSize: '20px', fontFamily: 'SF Pro Display' }}>Identity & contact</span>
                                </div>
                                <div className="space-y-4 px-4">
                                    <div>
                                        <label className="block mb-2 text-black" style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'SF Pro Display' }}>Full Name</label>
                                        <input
                                            type="text"
                                            value={newResource.fullName}
                                            onChange={(e) => setNewResource(prev => ({ ...prev, fullName: e.target.value }))}
                                            className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6] w-full"
                                            style={{ height: '35px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', fontSize: '14px' }}
                                        />
                                    </div>
                                    <div className="flex justify-between">
                                        <div style={{ width: '100%' }}>
                                            <label className="block mb-2 text-black" style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'SF Pro Display' }}>Email Address</label>
                                            <input
                                                type="email"
                                                value={newResource.email}
                                                onChange={(e) => setNewResource(prev => ({ ...prev, email: e.target.value }))}
                                                className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6] w-full"
                                                style={{ height: '35px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', fontSize: '14px' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Separator before buttons */}
                        <div className="border-b border-gray-300 mx-0 mb-4" style={{ width: '500px' }}></div>

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-between px-8 pb-6">
                            <button
                                onClick={closeAddResourceModal}
                                className="font-bold text-black bg-white hover:bg-gray-100 transition-colors"
                                style={{ width: '76px', height: '40px', fontSize: '14px', fontFamily: 'SF Pro Display', border: '1px solid #A9A9A9', borderRadius: '8px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveResource}
                                disabled={!newResource.fullName || !newResource.email}
                                className="font-bold text-black hover:opacity-90 transition-colors"
                                style={{
                                    width: '180px',
                                    height: '40px',
                                    fontSize: '14px',
                                    fontFamily: 'SF Pro Display',
                                    backgroundColor: '#CAF0F8',
                                    borderRadius: '8px',
                                    opacity: (!newResource.fullName || !newResource.email) ? 0.5 : 1,
                                    cursor: (!newResource.fullName || !newResource.email) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Save & Create Resource
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add DevMan Modal */}
            {addDevManModal.show && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out animate-fade-in"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div
                        className="rounded-2xl relative flex flex-col animate-scale-in"
                        style={{ width: '500px', maxHeight: '90vh', backgroundColor: '#F5F5F5' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pt-6 pb-4">
                            <h2 className="font-bold text-black" style={{ fontSize: '30px', fontFamily: 'SF Pro Display' }}>
                                Add DevMan
                            </h2>
                            <button
                                onClick={closeAddDevManModal}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Line below title */}
                        <div className="border-b border-gray-300 mx-0" style={{ width: '500px' }}></div>

                        {/* Form Content */}
                        <div className="px-8 py-6 mb-6">
                            {/* Identity & Contact Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="font-bold text-black" style={{ fontSize: '20px', fontFamily: 'SF Pro Display' }}>Identity & contact</span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block mb-2 text-black" style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'SF Pro Display' }}>Full Name</label>
                                        <input
                                            type="text"
                                            value={newDevMan.fullName}
                                            onChange={(e) => setNewDevMan(prev => ({ ...prev, fullName: e.target.value }))}
                                            className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6] w-full"
                                            style={{ height: '35px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', fontSize: '14px' }}
                                        />
                                    </div>
                                    <div className="flex justify-between">
                                        <div style={{ width: '48%' }}>
                                            <label className="block mb-2 text-black" style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'SF Pro Display' }}>Email Address</label>
                                            <input
                                                type="email"
                                                value={newDevMan.email}
                                                onChange={(e) => setNewDevMan(prev => ({ ...prev, email: e.target.value }))}
                                                className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6] w-full"
                                                style={{ height: '35px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', fontSize: '14px' }}
                                            />
                                        </div>
                                        <div style={{ width: '48%' }}>
                                            <label className="block mb-2 text-black" style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'SF Pro Display' }}>Password</label>
                                            <input
                                                type="password"
                                                value={newDevMan.password}
                                                onChange={(e) => setNewDevMan(prev => ({ ...prev, password: e.target.value }))}
                                                className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6] w-full"
                                                style={{ height: '35px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', fontSize: '14px' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Separator before buttons */}
                        <div className="border-b border-gray-300 mx-0 mb-4" style={{ width: '500px' }}></div>

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-between px-8 pb-6">
                            <button
                                onClick={closeAddDevManModal}
                                className="font-bold text-black bg-white hover:bg-gray-100 transition-colors"
                                style={{ width: '76px', height: '40px', fontSize: '14px', fontFamily: 'SF Pro Display', border: '1px solid #A9A9A9', borderRadius: '8px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveDevMan}
                                disabled={!newDevMan.fullName || !newDevMan.email || !newDevMan.password}
                                className="font-bold text-black hover:opacity-90 transition-colors"
                                style={{
                                    width: '180px',
                                    height: '40px',
                                    fontSize: '14px',
                                    fontFamily: 'SF Pro Display',
                                    backgroundColor: '#CAF0F8',
                                    borderRadius: '8px',
                                    opacity: (!newDevMan.fullName || !newDevMan.email || !newDevMan.password) ? 0.5 : 1,
                                    cursor: (!newDevMan.fullName || !newDevMan.email || !newDevMan.password) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Save & Create DevMan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign to Project Modal */}
            {assignModal.show && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out animate-fade-in"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div
                        className="rounded-2xl relative flex flex-col animate-scale-in bg-white"
                        style={{ width: '620px', height: '580px' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pt-6 pb-4">
                            <h2 className="font-bold text-black" style={{ fontSize: '30px', fontFamily: 'SF Pro Display' }}>
                                Assign to a Project
                            </h2>
                            <button
                                onClick={closeAssignModal}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Line below title */}
                        <div className="border-b border-gray-300"></div>

                        {/* Form Content */}
                        <div className="px-8 py-6 flex-1 overflow-y-auto">
                            {/* User Info - Layout matching reference image */}
                            <div
                                className="flex items-center justify-between mb-6 px-4 py-3 rounded-lg"
                                style={{
                                    backgroundColor: 'rgba(200, 200, 200, 0.3)'
                                }}
                            >
                                {/* Left side: Profile picture and name */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#00B4D8] flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-black" style={{ fontSize: '16px', fontFamily: 'SF Pro Display' }}>
                                        {assignModal.resource?.resourceName}
                                    </h3>
                                </div>
                                {/* Right side: Status badges */}
                                <div className="flex items-center gap-2">
                                    <span
                                        className="px-2 py-0.5 text-xs font-medium rounded-full"
                                        style={{
                                            backgroundColor: getProjectBadgeColors(assignModal.resource?.projectCount || 0).background,
                                            color: getProjectBadgeColors(assignModal.resource?.projectCount || 0).text,
                                            border: `1px solid ${getProjectBadgeColors(assignModal.resource?.projectCount || 0).border}`,
                                            fontFamily: 'SF Pro Display',
                                            fontSize: '11px'
                                        }}
                                    >
                                        ACTIVE IN {assignModal.resource?.projectCount || 0} PROJECT{assignModal.resource?.projectCount !== 1 ? 'S' : ''}
                                    </span>
                                    <span
                                        className="px-2 py-0.5 text-xs font-bold rounded-full"
                                        style={{
                                            backgroundColor: assignModal.resource?.status === 'AVAILABLE' ? 'rgba(6, 208, 1, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                                            color: assignModal.resource?.status === 'AVAILABLE' ? '#06D001' : '#FF0000',
                                            fontSize: '11px',
                                            border: assignModal.resource?.status === 'AVAILABLE' ? '1px solid #06D001' : '1px solid #FF0000'
                                        }}
                                    >
                                        {assignModal.resource?.status}
                                    </span>
                                </div>
                            </div>

                            {/* Current Projects (Only show Active) */}
                            {assignModal.resource?.currentAssignments &&
                                assignModal.resource.currentAssignments.filter(a => a.assignmentStatus === 'ACTIVE').length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-bold text-black mb-3" style={{ fontSize: '20px', fontFamily: 'SF Pro Display' }}>
                                            Current Project{assignModal.resource.currentAssignments.filter(a => a.assignmentStatus === 'ACTIVE').length > 1 ? 's' : ''}
                                        </h4>
                                        <div className="space-y-2">
                                            {assignModal.resource.currentAssignments
                                                .filter(a => a.assignmentStatus === 'ACTIVE')
                                                .map((assignment, index) => (
                                                    <p key={assignment.assignmentId} className="text-black" style={{ fontSize: '14px', fontFamily: 'SF Pro Display' }}>
                                                        {index + 1}. {assignment.projectName} - Ends : {new Date(assignment.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}

                            {/* Separator */}
                            <div className="border-b border-gray-300 mb-6"></div>

                            {/* Project Selection */}
                            <div className="space-y-4">
                                {/* 1. Project */}
                                <div>
                                    <label className="block mb-2 font-bold text-black" style={{ fontSize: '16px', fontFamily: 'SF Pro Display' }}>
                                        1. Project
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={assignmentData.project}
                                            onChange={(e) => {
                                                const proj = projects.find(p => p.projectId === parseInt(e.target.value));
                                                if (proj && proj.status === 'CLOSED') {
                                                    showNotification('Cannot assign to a CLOSED project', 'error');
                                                    return;
                                                }
                                                setAssignmentData(prev => ({ ...prev, project: e.target.value }));
                                            }}
                                            className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6] w-full appearance-none"
                                            style={{ height: '40px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 35px 0 12px', fontSize: '14px', fontFamily: 'SF Pro Display' }}
                                        >
                                            <option value="">Select project</option>
                                            {projects.map(project => (
                                                <option key={project.projectId} value={project.projectId} disabled={project.status === 'CLOSED'}>
                                                    {project.projectName} {project.status === 'CLOSED' ? '(CLOSED)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* 2. Select Project */}
                                <div>
                                    <label className="block mb-3 font-bold text-black" style={{ fontSize: '16px', fontFamily: 'SF Pro Display' }}>
                                        2. Select Project
                                    </label>

                                    {/* Project Role */}
                                    <div className="mb-4">
                                        <label className="block mb-2 text-black" style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'SF Pro Display' }}>
                                            Project Role
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={assignmentData.role}
                                                onChange={(e) => setAssignmentData(prev => ({ ...prev, role: e.target.value }))}
                                                className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6] w-full appearance-none"
                                                style={{ height: '40px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 35px 0 12px', fontSize: '14px', fontFamily: 'SF Pro Display' }}
                                            >
                                                <option value="">Select role</option>
                                                <option value="TEAM LEAD">TEAM LEAD</option>
                                                <option value="BACKEND DEVELOPER">BACKEND DEVELOPER</option>
                                                <option value="FRONTEND DEVELOPER">FRONTEND DEVELOPER</option>
                                                <option value="QUALITY ASSURANCE">QUALITY ASSURANCE</option>
                                            </select>
                                            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Assignment Duration */}
                                    <div>
                                        <label className="block mb-2 text-black" style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'SF Pro Display' }}>
                                            Assignment Duration
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    type="date"
                                                    value={assignmentData.startDate}
                                                    onChange={(e) => setAssignmentData(prev => ({ ...prev, startDate: e.target.value }))}
                                                    className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6] w-full"
                                                    style={{ height: '40px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', fontSize: '14px', fontFamily: 'SF Pro Display' }}
                                                />
                                            </div>
                                            <span className="text-gray-600" style={{ fontSize: '14px', fontFamily: 'SF Pro Display' }}>to</span>
                                            <div className="relative flex-1">
                                                <input
                                                    type="date"
                                                    value={assignmentData.endDate}
                                                    onChange={(e) => setAssignmentData(prev => ({ ...prev, endDate: e.target.value }))}
                                                    className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6] w-full"
                                                    style={{ height: '40px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', fontSize: '14px', fontFamily: 'SF Pro Display' }}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-gray-500 mt-2" style={{ fontSize: '12px', fontFamily: 'SF Pro Display' }}>
                                            Hint : Project ends Mar 2025
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-between px-8 pb-6 pt-4 border-t border-gray-300">
                            <button
                                onClick={closeAssignModal}
                                className="font-bold text-black bg-white hover:bg-gray-100 transition-colors"
                                style={{ width: '100px', height: '40px', fontSize: '14px', fontFamily: 'SF Pro Display', border: '1px solid #A9A9A9', borderRadius: '8px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={
                                    !assignmentData.project ||
                                    !assignmentData.role ||
                                    !assignmentData.startDate ||
                                    !assignmentData.endDate ||
                                    new Date(assignmentData.endDate) < new Date(assignmentData.startDate)
                                }
                                className="font-bold text-black hover:opacity-90 transition-colors"
                                style={{
                                    width: '100px',
                                    height: '40px',
                                    fontSize: '14px',
                                    fontFamily: 'SF Pro Display',
                                    backgroundColor: '#CAF0F8',
                                    borderRadius: '8px',
                                    opacity: (
                                        !assignmentData.project ||
                                        !assignmentData.role ||
                                        !assignmentData.startDate ||
                                        !assignmentData.endDate ||
                                        new Date(assignmentData.endDate) < new Date(assignmentData.startDate)
                                    ) ? 0.5 : 1,
                                    cursor: (
                                        !assignmentData.project ||
                                        !assignmentData.role ||
                                        !assignmentData.startDate ||
                                        !assignmentData.endDate ||
                                        new Date(assignmentData.endDate) < new Date(assignmentData.startDate)
                                    ) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Track Record Modal */}
            {trackRecordModal.show && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out animate-fade-in"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div
                        className="rounded-2xl relative flex flex-col animate-scale-in bg-white"
                        style={{ width: '1300px', height: '771px' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pt-6 pb-4">
                            <h2 className="font-bold text-black" style={{ fontSize: '30px', fontFamily: 'SF Pro Display' }}>
                                {trackRecordModal.resource?.resourceName}
                            </h2>
                            <button
                                onClick={closeTrackRecordModal}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Line below title */}
                        <div className="border-b border-gray-300"></div>

                        {/* Timeline Content */}
                        <div className="flex items-center justify-center px-8 py-6 flex-1">
                            <div className="rounded-lg" style={{ width: '1240px', height: '588px' }}>
                                {/* Month Headers */}
                                <div className="grid grid-cols-9 gap-0">
                                    {(() => {
                                        const now = new Date();
                                        const currentMonth = now.getMonth(); // 0-11
                                        const currentYear = now.getFullYear();
                                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

                                        // Generate 9 months starting from 4 months ago
                                        const months = [];
                                        for (let i = -4; i <= 4; i++) {
                                            const date = new Date(currentYear, currentMonth + i, 1);
                                            const monthName = monthNames[date.getMonth()];
                                            const year = date.getFullYear();
                                            months.push(`${monthName} ${year}`);
                                        }

                                        const currentMonthStr = `${monthNames[currentMonth]} ${currentYear}`;

                                        return months.map((month, index) => (
                                            <div
                                                key={month}
                                                className="text-center py-3 font-bold border border-gray-300"
                                                style={{
                                                    fontSize: '20px',
                                                    fontFamily: 'SF Pro Display',
                                                    backgroundColor: month === currentMonthStr ? '#0059FF' : 'rgba(0, 180, 216, 0.2)',
                                                    color: month === currentMonthStr ? '#FFFFFF' : '#000000',
                                                    borderTopLeftRadius: index === 0 ? '8px' : '0',
                                                    borderTopRightRadius: index === 8 ? '8px' : '0'
                                                }}
                                            >
                                                {month}
                                            </div>
                                        ));
                                    })()}
                                </div>

                                {/* Project Timeline Rows */}
                                <div className="space-y-0">
                                    {(() => {
                                        const now = new Date();
                                        const currentMonth = now.getMonth();
                                        const currentYear = now.getFullYear();
                                        const startDate = new Date(currentYear, currentMonth - 4, 1);
                                        const assignments = trackRecordModal.resource?.currentAssignments || [];

                                        // Function to calculate position based on date
                                        const getMonthPosition = (date) => {
                                            const d = new Date(date);
                                            const monthDiff = (d.getFullYear() - startDate.getFullYear()) * 12 + (d.getMonth() - startDate.getMonth());
                                            return Math.max(0, Math.min(9, monthDiff));
                                        };

                                        // Function to get project color based on status
                                        const getProjectColor = (assignment) => {
                                            if (assignment.projectStatus === 'CLOSED' || assignment.assignmentStatus === 'RELEASED') {
                                                return '#FF0000'; // Closed
                                            }
                                            if (assignment.projectStatus === 'HOLD') {
                                                return '#F97316'; // Hold
                                            }
                                            return '#06D001'; // Ongoing
                                        };

                                        // Create 4 rows - fill with assignments first, then empty rows
                                        const rows = [];
                                        for (let i = 0; i < 4; i++) {
                                            const assignment = assignments[i];
                                            if (assignment) {
                                                const startPos = getMonthPosition(assignment.startDate);
                                                const endPos = getMonthPosition(assignment.endDate) + 1;
                                                const width = ((endPos - startPos) / 9) * 100;
                                                const left = (startPos / 9) * 100;
                                                const color = getProjectColor(assignment);
                                                const startDateObj = new Date(assignment.startDate);
                                                const endDateObj = new Date(assignment.endDate);
                                                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                                                rows.push(
                                                    <div key={i} className="relative" style={{ height: '117.6px' }}>
                                                        <div className="grid grid-cols-9 h-full">
                                                            {Array.from({ length: 9 }).map((_, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="border-r border-b border-l border-gray-300"
                                                                    style={{
                                                                        borderBottomLeftRadius: i === 3 && index === 0 ? '8px' : '0',
                                                                        borderBottomRightRadius: i === 3 && index === 8 ? '8px' : '0'
                                                                    }}
                                                                ></div>
                                                            ))}
                                                        </div>
                                                        <div
                                                            className="absolute flex items-center justify-center rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                            style={{
                                                                left: `${left}%`,
                                                                width: `${Math.min(width, 100 - left)}%`,
                                                                height: '60px',
                                                                top: '50%',
                                                                transform: 'translateY(-50%)',
                                                                backgroundColor: color
                                                            }}
                                                            onMouseEnter={() => setHoveredProject(`project${i}`)}
                                                            onMouseLeave={() => setHoveredProject(null)}
                                                        >
                                                            <span className="font-bold text-white text-center px-4 truncate" style={{ fontSize: '16px', fontFamily: 'SF Pro Display' }}>
                                                                {assignment.projectName} • {assignment.projectRole}
                                                            </span>

                                                            {/* Tooltip */}
                                                            {hoveredProject === `project${i}` && (
                                                                <div
                                                                    className="absolute z-10 bg-white rounded-lg shadow-xl p-4 border border-gray-200"
                                                                    style={{
                                                                        top: '-120px',
                                                                        left: '50%',
                                                                        transform: 'translateX(-50%)',
                                                                        width: '300px',
                                                                        fontFamily: 'SF Pro Display'
                                                                    }}
                                                                >
                                                                    <div className="space-y-2">
                                                                        <h4 className="font-bold text-black" style={{ fontSize: '16px' }}>{assignment.projectName}</h4>
                                                                        <div className="text-sm text-gray-700">
                                                                            <p><span className="font-semibold">Role:</span> {assignment.projectRole}</p>
                                                                            <p><span className="font-semibold">Start:</span> {monthNames[startDateObj.getMonth()]} {startDateObj.getFullYear()}</p>
                                                                            <p><span className="font-semibold">End:</span> {monthNames[endDateObj.getMonth()]} {endDateObj.getFullYear()}</p>
                                                                            <p><span className="font-semibold">Status:</span> <span className={endDateObj < now ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{endDateObj < now ? 'Closed' : 'Ongoing'}</span></p>
                                                                        </div>
                                                                    </div>
                                                                    {/* Arrow */}
                                                                    <div
                                                                        className="absolute"
                                                                        style={{
                                                                            bottom: '-8px',
                                                                            left: '50%',
                                                                            transform: 'translateX(-50%)',
                                                                            width: '0',
                                                                            height: '0',
                                                                            borderLeft: '8px solid transparent',
                                                                            borderRight: '8px solid transparent',
                                                                            borderTop: '8px solid white'
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // Empty row
                                                rows.push(
                                                    <div key={i} className="relative" style={{ height: '117.6px' }}>
                                                        <div className="grid grid-cols-9 h-full">
                                                            {Array.from({ length: 9 }).map((_, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="border-r border-b border-l border-gray-300"
                                                                    style={{
                                                                        borderBottomLeftRadius: i === 3 && index === 0 ? '8px' : '0',
                                                                        borderBottomRightRadius: i === 3 && index === 8 ? '8px' : '0'
                                                                    }}
                                                                ></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        }
                                        return rows;
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 pb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#06D001' }}></div>
                                <span style={{ fontSize: '14px', fontFamily: 'SF Pro Display', fontWeight: '500' }}>Ongoing</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                                <span style={{ fontSize: '14px', fontFamily: 'SF Pro Display', fontWeight: '500' }}>Hold</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FF0000' }}></div>
                                <span style={{ fontSize: '14px', fontFamily: 'SF Pro Display', fontWeight: '500' }}>Closed</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 ml-[267px] p-8">
                {/* Page Title */}
                <h1 className="text-4xl font-bold text-gray-800 mb-8">Resources</h1>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-8">
                    {/* Left: Search Bar */}
                    <div className="relative">
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Find resources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-4 py-3 w-[300px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent transition-all shadow-sm font-medium"
                            style={{ fontFamily: 'SF Pro Display' }}
                        />
                    </div>

                    {/* Right: Filters & Actions */}
                    <div className="flex items-center gap-4">
                        {/* Status Filter */}
                        <div className="relative group">
                            <select
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                                className="pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4D8] appearance-none cursor-pointer font-bold text-gray-700 shadow-sm transition-all hover:border-gray-300 text-xs"
                                style={{ minWidth: '130px', fontFamily: 'SF Pro Display' }}
                            >
                                <option value="all">Statuses</option>
                                <option value="available">Available</option>
                                <option value="assigned">Assigned</option>
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        {/* Date Filters */}
                        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={handleDateFilterChange}
                                className="px-3 py-1.5 border-none bg-transparent focus:ring-0 font-bold text-xs"
                                style={{ fontFamily: 'SF Pro Display' }}
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="relative group">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4D8] appearance-none cursor-pointer font-bold text-gray-700 shadow-sm transition-all hover:border-gray-300 text-xs"
                                style={{ minWidth: '160px', fontFamily: 'SF Pro Display' }}
                            >
                                <option value="all">Role Categories</option>
                                <option value="TEAM LEAD">TEAM LEAD</option>
                                <option value="BACKEND DEVELOPER">BACKEND DEVELOPER</option>
                                <option value="FRONTEND DEVELOPER">FRONTEND DEVELOPER</option>
                                <option value="QUALITY ASSURANCE">QUALITY ASSURANCE</option>
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        {/* Main Actions */}
                        <div className="h-10 w-px bg-gray-200 mx-2"></div>

                        <button
                            onClick={handleExport}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm group"
                            title="Export to Excel"
                        >
                            <svg className="w-5 h-5 text-[#00B4D8] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>

                        <button
                            onClick={handleAddDevMan}
                            className="bg-[#CAF0F8] text-[#00B4D8] px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[#b8e8ef] transition-all shadow-sm whitespace-nowrap"
                            style={{ fontFamily: 'SF Pro Display' }}
                        >
                            + DevMan
                        </button>

                        <button
                            onClick={handleAddResource}
                            className="bg-[#00B4D8] text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-md shadow-cyan-100 whitespace-nowrap"
                            style={{ fontFamily: 'SF Pro Display' }}
                        >
                            + Resource
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '20px' }}>Name</th>
                                    <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '20px' }}>Status</th>
                                    <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '20px' }}>Detail</th>
                                    <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '20px' }}>Track Record</th>
                                    <th className="text-right py-4 px-6 font-bold text-gray-700"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResources.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-500">
                                            No resources found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResources.map((resource) => (
                                        <tr
                                            key={resource.resourceId}
                                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-gray-800" style={{ fontSize: '20px' }}>
                                                    {resource.resourceName}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span
                                                    className="px-3 py-1 rounded-full font-bold"
                                                    style={{
                                                        fontSize: '12px',
                                                        color: resource.status === 'AVAILABLE' ? '#06D001' : '#FF0000',
                                                        backgroundColor: resource.status === 'AVAILABLE' ? 'rgba(6, 208, 1, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                                                        border: resource.status === 'AVAILABLE' ? '1px solid #06D001' : '1px solid #FF0000'
                                                    }}
                                                >
                                                    {resource.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => handleViewDetail(resource)}
                                                    className="inline-flex items-center gap-1 text-gray-600 hover:text-[#0059FF] transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <span style={{ fontSize: '15px' }}>View Detail</span>
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => handleViewTrackRecord(resource)}
                                                    className="inline-flex items-center gap-1 text-gray-600 hover:text-[#0059FF] transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span style={{ fontSize: '15px' }}>View Track Record</span>
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleAssignToProject(resource)}
                                                    className="px-4 py-2 bg-[#CAF0F8] text-black rounded-lg hover:bg-[#b8e8ef] transition-colors font-bold"
                                                    style={{ fontSize: '15px' }}
                                                >
                                                    Assign to Project
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminResources;
