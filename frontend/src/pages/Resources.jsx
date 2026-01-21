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
    const [newResource, setNewResource] = useState({
        fullName: '',
        email: '',
        employeeType: '',
        joinDate: '',
        skills: []
    });
    const [skillInput, setSkillInput] = useState('');

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
        // Add DevMan functionality
        alert('Add DevMan feature coming soon!');
    };

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

    const handleViewTrackRecord = (resourceId) => {
        alert(`View track record for resource ${resourceId}`);
    };

    const handleAssignToProject = (resourceId) => {
        alert(`Assign resource ${resourceId} to project`);
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
                        className="rounded-2xl relative flex flex-col animate-scale-in overflow-hidden"
                        style={{ width: '500px', height: '643px', backgroundColor: '#F5F5F5' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pt-6 pb-4">
                            <h2 className="font-bold text-black" style={{ fontSize: '30px' }}>
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
                        <div className="flex-1 px-8 py-4 overflow-y-auto">
                            {/* Identity & Contact Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="font-bold text-black" style={{ fontSize: '20px' }}>Identity & contact</span>
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
                                    <span className="font-bold text-black" style={{ fontSize: '20px' }}>Emplyoment Status</span>
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
                                    <span className="font-bold text-black" style={{ fontSize: '20px' }}>Skills & Tags</span>
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

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-between px-8 pb-6">
                            <button
                                onClick={closeAddResourceModal}
                                className="font-bold text-black bg-white hover:bg-gray-100 transition-colors"
                                style={{ width: '76px', height: '40px', fontSize: '14px', border: '1px solid #A9A9A9', borderRadius: '8px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveResource}
                                className="font-bold text-black hover:opacity-90 transition-colors"
                                style={{ width: '180px', height: '40px', fontSize: '14px', backgroundColor: '#CAF0F8', borderRadius: '8px' }}
                            >
                                Save & Create Resource
                            </button>
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
                                                    style={{ fontSize: '12px' }}
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
