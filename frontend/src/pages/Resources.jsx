import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

const Resources = () => {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [filteredResources, setFilteredResources] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '' });
    const [detailModal, setDetailModal] = useState({ show: false, resource: null, projects: [] });
    const [addResourceModal, setAddResourceModal] = useState({ show: false });
    const [addDevManModal, setAddDevManModal] = useState({ show: false });
    const [assignModal, setAssignModal] = useState({ show: false, resource: null });
    const [trackRecordModal, setTrackRecordModal] = useState({ show: false, resource: null });
    const [newResource, setNewResource] = useState({
        fullName: '',
        email: '',
        employeeType: '',
        joinDate: '',
        skills: []
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        fetchResources();
    }, [navigate]);

    const fetchResources = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/resources');
            setResources(response.data);
            setFilteredResources(response.data);
        } catch (error) {
            console.error('Error fetching resources:', error);
            // Use dummy data for now if API fails
            const dummyData = generateDummyData();
            setResources(dummyData);
            setFilteredResources(dummyData);
        } finally {
            setIsLoading(false);
        }
    };

    const generateDummyData = () => {
        return Array.from({ length: 10 }, (_, i) => ({
            resourceId: i + 1,
            name: 'Rudi Tabuti Sugiharto',
            status: i % 2 === 0 ? 'AVAILABLE' : 'ASSIGNED',
        }));
    };

    useEffect(() => {
        let result = resources;

        // Filter by status
        if (activeFilter !== 'all') {
            result = result.filter(
                (r) => r.status.toLowerCase() === activeFilter.toLowerCase()
            );
        }

        // Filter by search query
        if (searchQuery) {
            result = result.filter((r) =>
                r.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredResources(result);
    }, [searchQuery, activeFilter, resources]);

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
        // Export functionality
        alert('Export feature coming soon!');
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

    const handleSaveDevMan = () => {
        // Save DevMan logic here
        console.log('Saving DevMan:', newDevMan);
        closeAddDevManModal();
        showNotification('Saved Successfully! DevMan created successfully.', 'success');
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

    const handleAssign = () => {
        // Assign logic here
        console.log('Assigning:', assignmentData);
        closeAssignModal();
        showNotification('Assigned Successfully!', 'success');
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
            email: '',
            employeeType: '',
            joinDate: '',
            skills: []
        });
        setSkillInput('');
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

    const handleSaveResource = () => {
        // Save resource logic here
        console.log('Saving resource:', newResource);
        closeAddResourceModal();
        showNotification('Saved Successfully! Resources created successfully.', 'success');
    };

    const handleViewDetail = (resource) => {
        if (resource.status === 'AVAILABLE') {
            showNotification(`${resource.name} Currently Available for Assignment`);
        } else {
            // Show modal with project details for ASSIGNED resources
            const dummyProjects = [
                { projectName: 'E-Commerce Web Revamp', role: 'Backend Developer', startDate: '14/09/2026', endDate: '14/10/2026' },
                { projectName: 'E-Commerce Web Revamp', role: 'Backend Developer', startDate: '14/09/2026', endDate: '14/10/2026' },
                { projectName: 'E-Commerce Web Revamp', role: 'Backend Developer', startDate: '14/09/2026', endDate: '14/10/2026' },
                { projectName: 'E-Commerce Web Revamp', role: 'Backend Developer', startDate: '14/09/2026', endDate: '14/10/2026' },
            ];
            setDetailModal({ show: true, resource, projects: dummyProjects });
        }
    };

    const closeDetailModal = () => {
        setDetailModal({ show: false, resource: null, projects: [] });
    };

    const handleViewTrackRecord = (resource) => {
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
                    className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-300 ease-in-out ${
                        notification.closing 
                            ? 'opacity-0 translate-x-full' 
                            : 'opacity-100 translate-x-0 animate-slide-in'
                    }`}
                    style={{ 
                        backgroundColor: notification.type === 'success' ? 'rgba(6, 208, 1, 0.2)' : 'rgba(0, 180, 216, 0.2)',
                        borderColor: notification.type === 'success' ? '#06D001' : '#00B4D8'
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
                            color: notification.type === 'success' ? '#06D001' : '#00B4D8', 
                            fontSize: '14px' 
                        }}
                    >
                        {notification.message}
                    </span>
                    <button 
                        onClick={closeNotification}
                        className="ml-2 hover:opacity-70 transition-opacity"
                        style={{ color: notification.type === 'success' ? '#06D001' : '#00B4D8' }}
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
                        <div className="flex items-center mt-8 mb-4 px-8 w-full flex-nowrap">
                            <h2 className="font-bold text-gray-800 whitespace-nowrap" style={{ fontSize: '30px' }}>
                                {detailModal.resource?.name}
                            </h2>
                            <span 
                                className="px-3 py-1 rounded font-bold whitespace-nowrap"
                                style={{ 
                                    fontSize: '12px',
                                    color: '#0059FF',
                                    backgroundColor: 'rgba(0, 89, 255, 0.2)',
                                    marginLeft: '166px'
                                }}
                            >
                                ACTIVE IN {detailModal.projects.length} PROJECTS
                            </span>
                            <button 
                                onClick={closeDetailModal}
                                className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                                style={{ marginLeft: '23px' }}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
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
                                            <tr key={index} className={`hover:bg-gray-50 ${index < detailModal.projects.length - 1 ? 'border-b border-gray-200' : ''}`}>
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
                                <div className="flex justify-between px-4">
                                    <div>
                                        <label className="block mb-2 text-black" style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'SF Pro Display' }}>Full Name</label>
                                        <input
                                            type="text"
                                            value={newResource.fullName}
                                            onChange={(e) => setNewResource(prev => ({ ...prev, fullName: e.target.value }))}
                                            className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6]"
                                            style={{ width: '170px', height: '35px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', fontSize: '14px' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-black" style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'SF Pro Display' }}>Email Address</label>
                                        <input
                                            type="email"
                                            value={newResource.email}
                                            onChange={(e) => setNewResource(prev => ({ ...prev, email: e.target.value }))}
                                            className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6]"
                                            style={{ width: '170px', height: '35px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', fontSize: '14px' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="border-b border-gray-300 mb-6"></div>

                            {/* Employment Status Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-bold text-black" style={{ fontSize: '20px', fontFamily: 'SF Pro Display' }}>Emplyoment Status</span>
                                </div>
                                <div className="flex justify-between px-4">
                                    <div>
                                        <label className="block mb-2 text-black" style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'SF Pro Display' }}>Employee Type</label>
                                        <div className="relative">
                                            <select
                                                value={newResource.employeeType}
                                                onChange={(e) => setNewResource(prev => ({ ...prev, employeeType: e.target.value }))}
                                                className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6] appearance-none cursor-pointer"
                                                style={{ width: '170px', height: '35px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', paddingRight: '32px', fontSize: '14px', fontFamily: 'SF Pro Display', fontWeight: '400' }}
                                            >
                                                <option value="">Select</option>
                                                <option value="full-time">Full Time</option>
                                                <option value="part-time">Part Time</option>
                                                <option value="contract">Contract</option>
                                                <option value="intern">Intern</option>
                                            </select>
                                            <svg 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-500" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-black" style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'SF Pro Display' }}>Join Date</label>
                                        <input
                                            type="date"
                                            value={newResource.joinDate}
                                            onChange={(e) => setNewResource(prev => ({ ...prev, joinDate: e.target.value }))}
                                            placeholder="DD/MM/YYYY"
                                            className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6]"
                                            style={{ width: '170px', height: '35px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', fontSize: '14px', fontFamily: 'SF Pro Display', fontWeight: '400' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="border-b border-gray-300 mb-6"></div>

                            {/* Skills Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-bold text-black" style={{ fontSize: '20px', fontFamily: 'SF Pro Display' }}>Skills & Tags</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    {/* Skills Tags */}
                                    <div className="flex flex-wrap gap-2 mb-3 justify-center">
                                        {newResource.skills.map((skill, index) => (
                                            <span 
                                                key={index} 
                                                className="flex items-center gap-1 px-3 py-1 rounded-md text-white"
                                                style={{ backgroundColor: '#0059FF', fontSize: '14px' }}
                                            >
                                                {skill}
                                                <button 
                                                    onClick={() => removeSkill(skill)}
                                                    className="hover:opacity-70 ml-1"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={handleAddSkill}
                                        placeholder="Type to add skills..."
                                        className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6]"
                                        style={{ width: '200px', height: '35px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 12px', fontSize: '13px', fontFamily: 'SF Pro Display', fontWeight: '300', fontStyle: 'italic' }}
                                    />
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
                                className="font-bold text-black hover:opacity-90 transition-colors"
                                style={{ width: '180px', height: '40px', fontSize: '14px', fontFamily: 'SF Pro Display', backgroundColor: '#CAF0F8', borderRadius: '8px' }}
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
                                className="font-bold text-black hover:opacity-90 transition-colors"
                                style={{ width: '180px', height: '40px', fontSize: '14px', fontFamily: 'SF Pro Display', backgroundColor: '#CAF0F8', borderRadius: '8px' }}
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
                            {/* User Info */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-[#00B4D8] flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-black" style={{ fontSize: '16px', fontFamily: 'SF Pro Display' }}>
                                        Rudi Tabuti Sugiharto
                                    </h3>
                                    <div className="flex gap-2 mt-1">
                                        <span 
                                            className="px-2 py-0.5 text-xs font-medium rounded" 
                                            style={{ 
                                                backgroundColor: getProjectBadgeColors(2).background, 
                                                color: getProjectBadgeColors(2).text,
                                                border: `1px solid ${getProjectBadgeColors(2).border}`,
                                                fontFamily: 'SF Pro Display',
                                                fontSize: '11px'
                                            }}
                                        >
                                            ACTIVE IN 2 PROJECTS
                                        </span>
                                        <span className="px-2 py-0.5 text-xs font-medium rounded" style={{ backgroundColor: '#D1FAE5', color: '#059669', fontFamily: 'SF Pro Display', fontSize: '11px', border: '1px solid #059669' }}>
                                            AVAILABLE
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Current Projects */}
                            <div className="mb-6">
                                <h4 className="font-bold text-black mb-3" style={{ fontSize: '20px', fontFamily: 'SF Pro Display' }}>
                                    Current Project
                                </h4>
                                <div className="space-y-2">
                                    <p className="text-black" style={{ fontSize: '14px', fontFamily: 'SF Pro Display' }}>
                                        1. E-commerce Web Revamp - Ends : 1 Desember 2025
                                    </p>
                                    <p className="text-black" style={{ fontSize: '14px', fontFamily: 'SF Pro Display' }}>
                                        2. E-commerce Web Revamp - Ends : 1 Desember 2025
                                    </p>
                                </div>
                            </div>

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
                                            onChange={(e) => setAssignmentData(prev => ({ ...prev, project: e.target.value }))}
                                            className="bg-white focus:outline-none focus:ring-1 focus:ring-[#00B4A6] w-full appearance-none"
                                            style={{ height: '40px', border: '1px solid #A9A9A9', borderRadius: '8px', padding: '0 35px 0 12px', fontSize: '14px', fontFamily: 'SF Pro Display' }}
                                        >
                                            <option value="">Select project</option>
                                            <option value="ecommerce">E-commerce Web Revamp</option>
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
                                                <option value="backend">Backend Developer</option>
                                                <option value="frontend">Frontend Developer</option>
                                                <option value="fullstack">Fullstack Developer</option>
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
                                className="font-bold text-black hover:opacity-90 transition-colors"
                                style={{ width: '100px', height: '40px', fontSize: '14px', fontFamily: 'SF Pro Display', backgroundColor: '#CAF0F8', borderRadius: '8px' }}
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
                                Rudi Tabuti Sugiharto
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
                                    {['Sep 2025', 'Oct 2025', 'Nov 2025', 'Des 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'Mei 2026'].map((month, index) => (
                                        <div 
                                            key={month}
                                            className="text-center py-3 font-bold border border-gray-300"
                                            style={{ 
                                                fontSize: '20px', 
                                                fontFamily: 'SF Pro Display',
                                                backgroundColor: month === 'Jan 2026' ? '#0059FF' : 'rgba(0, 180, 216, 0.2)',
                                                color: month === 'Jan 2026' ? '#FFFFFF' : '#000000',
                                                borderTopLeftRadius: index === 0 ? '8px' : '0',
                                                borderTopRightRadius: index === 8 ? '8px' : '0'
                                            }}
                                        >
                                            {month}
                                        </div>
                                    ))}
                                </div>

                                {/* Project Timeline Rows */}
                                <div className="space-y-0">
                                    {trackRecordModal.resource && trackRecordModal.resource.status === 'AVAILABLE' ? (
                                        // Empty rows for available resources
                                        <>
                                            {Array.from({ length: 4 }).map((_, rowIndex) => (
                                                <div key={rowIndex} className="relative" style={{ height: '117.6px' }}>
                                                    <div className="grid grid-cols-9 h-full">
                                                        {Array.from({ length: 9 }).map((_, index) => (
                                                            <div 
                                                                key={index} 
                                                                className="border-r border-b border-l border-gray-300"
                                                                style={{
                                                                    borderBottomLeftRadius: rowIndex === 3 && index === 0 ? '8px' : '0',
                                                                    borderBottomRightRadius: rowIndex === 3 && index === 8 ? '8px' : '0'
                                                                }}
                                                            ></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        // Project rows for assigned resources
                                        <>
                                            {/* Row 1 - Closed (Red) - Sep to Jan */}
                                            <div className="relative" style={{ height: '117.6px' }}>
                                                <div className="grid grid-cols-9 h-full">
                                                    {Array.from({ length: 9 }).map((_, index) => (
                                                        <div key={index} className="border-r border-b border-l border-gray-300"></div>
                                                    ))}
                                                </div>
                                                <div 
                                                    className="absolute flex items-center justify-center rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                    style={{ 
                                                        left: '0%', 
                                                        width: '44.4%', 
                                                        height: '60px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                backgroundColor: '#FF0000'
                                            }}
                                            onMouseEnter={() => setHoveredProject('project1')}
                                            onMouseLeave={() => setHoveredProject(null)}
                                        >
                                            <span className="font-bold text-white text-center px-4" style={{ fontSize: '20px', fontFamily: 'SF Pro Display' }}>
                                                E-Commerce Web Revamp • Backend Develop
                                            </span>
                                            
                                            {/* Tooltip */}
                                            {hoveredProject === 'project1' && (
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
                                                        <h4 className="font-bold text-black" style={{ fontSize: '16px' }}>E-Commerce Web Revamp</h4>
                                                        <div className="text-sm text-gray-700">
                                                            <p><span className="font-semibold">Role:</span> Backend Developer</p>
                                                            <p><span className="font-semibold">Start:</span> Sep 2025</p>
                                                            <p><span className="font-semibold">End:</span> Jan 2026</p>
                                                            <p><span className="font-semibold">Status:</span> <span className="text-red-600 font-bold">Closed</span></p>
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

                                    {/* Row 2 - Ongoing (Green) - Feb to Apr */}
                                    <div className="relative" style={{ height: '117.6px' }}>
                                        <div className="grid grid-cols-9 h-full">
                                            {Array.from({ length: 9 }).map((_, index) => (
                                                <div key={index} className="border-r border-b border-l border-gray-300"></div>
                                            ))}
                                        </div>
                                        <div 
                                            className="absolute flex items-center justify-center rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                            style={{ 
                                                left: '55.5%', 
                                                width: '33.3%', 
                                                height: '60px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                backgroundColor: '#06D001'
                                            }}
                                            onMouseEnter={() => setHoveredProject('project2')}
                                            onMouseLeave={() => setHoveredProject(null)}
                                        >
                                            <span className="font-bold text-white text-center px-4" style={{ fontSize: '20px', fontFamily: 'SF Pro Display' }}>
                                                E-Commerce Web Revamp • Backend Develop
                                            </span>
                                            
                                            {/* Tooltip */}
                                            {hoveredProject === 'project2' && (
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
                                                        <h4 className="font-bold text-black" style={{ fontSize: '16px' }}>E-Commerce Web Revamp</h4>
                                                        <div className="text-sm text-gray-700">
                                                            <p><span className="font-semibold">Role:</span> Backend Developer</p>
                                                            <p><span className="font-semibold">Start:</span> Feb 2026</p>
                                                            <p><span className="font-semibold">End:</span> Apr 2026</p>
                                                            <p><span className="font-semibold">Status:</span> <span className="text-green-600 font-bold">Ongoing</span></p>
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

                                    {/* Row 3 - Hold (Orange) - Oct to Feb */}
                                    <div className="relative" style={{ height: '117.6px' }}>
                                        <div className="grid grid-cols-9 h-full">
                                            {Array.from({ length: 9 }).map((_, index) => (
                                                <div key={index} className="border-r border-b border-l border-gray-300"></div>
                                            ))}
                                        </div>
                                        <div 
                                            className="absolute flex items-center justify-center rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                            style={{ 
                                                left: '11.1%', 
                                                width: '44.4%', 
                                                height: '60px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                backgroundColor: '#F97316'
                                            }}
                                            onMouseEnter={() => setHoveredProject('project3')}
                                            onMouseLeave={() => setHoveredProject(null)}
                                        >
                                            <span className="font-bold text-white text-center px-4" style={{ fontSize: '20px', fontFamily: 'SF Pro Display' }}>
                                                E-Commerce Web Revamp • Backend Develop
                                            </span>
                                            
                                            {/* Tooltip */}
                                            {hoveredProject === 'project3' && (
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
                                                        <h4 className="font-bold text-black" style={{ fontSize: '16px' }}>E-Commerce Web Revamp</h4>
                                                        <div className="text-sm text-gray-700">
                                                            <p><span className="font-semibold">Role:</span> Backend Developer</p>
                                                            <p><span className="font-semibold">Start:</span> Oct 2025</p>
                                                            <p><span className="font-semibold">End:</span> Feb 2026</p>
                                                            <p><span className="font-semibold">Status:</span> <span className="text-orange-600 font-bold">Hold</span></p>
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

                                            {/* Row 4 - Empty */}
                                            <div className="relative" style={{ height: '117.6px' }}>
                                                <div className="grid grid-cols-9 h-full">
                                                    {Array.from({ length: 9 }).map((_, index) => (
                                                        <div 
                                                            key={index} 
                                                            className="border-r border-b border-l border-gray-300"
                                                            style={{
                                                                borderBottomLeftRadius: index === 0 ? '8px' : '0',
                                                                borderBottomRightRadius: index === 8 ? '8px' : '0'
                                                            }}
                                                        ></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 pb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#06D001' }}></div>
                                <span style={{ fontSize: '14px', fontFamily: 'SF Pro Display', fontWeight: '500' }}>Ongoing</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#F97316' }}></div>
                                <span style={{ fontSize: '14px', fontFamily: 'SF Pro Display', fontWeight: '500' }}>Hold</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#FF0000' }}></div>
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
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
                            placeholder="Search resources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-[350px] h-[40px] border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4A6] focus:border-transparent placeholder:italic placeholder:font-light"
                            style={{ fontSize: '15px' }}
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-lg overflow-hidden">
                            {['all', 'available', 'assigned'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-4 py-2 font-bold transition-colors ${
                                        activeFilter === filter
                                            ? 'bg-[#CAF0F8] text-black'
                                            : 'bg-white text-black hover:bg-[#CAF0F8]/50'
                                    }`}
                                    style={{ fontSize: '15px' }}
                                >
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-[#CAF0F8] rounded-lg text-black hover:bg-[#b8e8ef] transition-colors font-bold"
                            style={{ fontSize: '15px' }}
                        >
                            <svg className="w-5 h-5 text-[#00B4A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export
                        </button>
                        <button
                            onClick={handleAddDevMan}
                            className="flex items-center gap-2 px-4 py-2 bg-[#CAF0F8] rounded-lg text-black hover:bg-[#b8e8ef] transition-colors font-bold"
                            style={{ fontSize: '15px' }}
                        >
                            + Add DevMan
                        </button>
                        <button
                            onClick={handleAddResource}
                            className="flex items-center gap-2 px-4 py-2 bg-[#CAF0F8] text-black rounded-lg hover:bg-[#b8e8ef] transition-colors font-bold"
                            style={{ fontSize: '15px' }}
                        >
                            + Add Resource
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
                                                    {resource.name}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span
                                                    className={`px-3 py-1 rounded font-semibold ${
                                                        resource.status === 'AVAILABLE'
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-red-100 text-red-600'
                                                    }`}
                                                    style={{ 
                                                        fontSize: '12px',
                                                        border: resource.status === 'AVAILABLE' 
                                                            ? '1px solid #059669' 
                                                            : '1px solid #DC2626'
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
                                                    onClick={() => handleViewTrackRecord(resource.resourceId)}
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
                                                    onClick={() => handleAssignToProject(resource.resourceId)}
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

export default Resources;
