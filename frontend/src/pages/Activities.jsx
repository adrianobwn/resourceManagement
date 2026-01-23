import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Activities = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('extend');

    // Dummy data for Extend
    const extendData = [
        {
            id: 1,
            requester: 'Rudi Tabuti Sugiharto',
            project: 'E-Commerce Web Revamp',
            resourceName: 'Rudi Tabuti Sugiharto',
            role: 'Backend Developer',
            oldEndDate: '14/06/2026',
            newEndDate: '14/08/2026',
            description: '"Extend rul tukul, karena belum selesa"',
            status: 'APPROVED'
        },
        {
            id: 2,
            requester: 'Rudi Tabuti Sugiharto',
            project: 'E-Commerce Web Revamp',
            resourceName: 'Rudi Tabuti Sugiharto',
            role: 'Backend Developer',
            oldEndDate: '14/06/2026',
            newEndDate: '14/04/2026',
            description: '"Release rul tukul, karena sudah selesa"',
            status: 'REJECTED'
        },
        {
            id: 3,
            requester: 'Rudi Tabuti Sugiharto',
            project: 'E-Commerce Web Revamp',
            resourceName: 'Rudi Tabuti Sugiharto',
            role: 'Backend Developer',
            oldEndDate: '14/06/2026',
            newEndDate: '14/08/2026',
            description: '"Extend rul tukul, karena belum selesa"',
            status: 'APPROVED'
        },
        {
            id: 4,
            requester: 'Rudi Tabuti Sugiharto',
            project: 'E-Commerce Web Revamp',
            resourceName: 'Rudi Tabuti Sugiharto',
            role: 'Backend Developer',
            oldEndDate: '14/06/2026',
            newEndDate: '14/04/2026',
            description: '"Release rul tukul, karena sudah selesa"',
            status: 'APPROVED'
        }
    ];

    // Dummy data for Release (same structure as Extend)
    const releaseData = extendData;

    // Dummy data for Assignment
    const assignmentData = [
        {
            id: 1,
            requester: 'Rudi Tabuti Sugiharto',
            project: 'E-Commerce Web Revamp',
            resourceName: 'Rudi Tabuti Sugiharto',
            role: 'Backend Developer',
            startDate: '14/06/2026',
            endDate: '14/08/2026',
            status: 'APPROVED'
        },
        {
            id: 2,
            requester: 'Rudi Tabuti Sugiharto',
            project: 'E-Commerce Web Revamp',
            resourceName: 'Rudi Tabuti Sugiharto',
            role: 'Backend Developer',
            startDate: '14/06/2026',
            endDate: '14/08/2026',
            status: 'REJECTED'
        },
        {
            id: 3,
            requester: 'Rudi Tabuti Sugiharto',
            project: 'E-Commerce Web Revamp',
            resourceName: 'Rudi Tabuti Sugiharto',
            role: 'Backend Developer',
            startDate: '14/06/2026',
            endDate: '14/08/2026',
            status: 'APPROVED'
        },
        {
            id: 4,
            requester: 'Rudi Tabuti Sugiharto',
            project: 'E-Commerce Web Revamp',
            resourceName: 'Rudi Tabuti Sugiharto',
            role: 'Backend Developer',
            startDate: '14/06/2026',
            endDate: '14/08/2026',
            status: 'APPROVED'
        }
    ];

    // Dummy data for Project
    const projectData = [
        {
            id: 1,
            requester: 'Rudi Tabuti Sugiharto',
            projectName: 'E-Commerce Web Revamp',
            clientName: 'PT Teleopedia',
            description: '"Lorem ipsum odiusdsdf sdsdsddsvsvsvsnsn snspsosronsispsnnagsngspsn snsgsipsdsosogsdngjsgsn gnsospjedsojgadsngjsn"',
            status: 'APPROVED'
        },
        {
            id: 2,
            requester: 'Rudi Tabuti Sugiharto',
            projectName: 'E-Commerce Web Revamp',
            clientName: 'PT Teleopedia',
            description: '"Kebutugan neosusemfinml xinhuglshngudl sdsnslxksnglsingsisn sdnsmlakmlsdkfndkjfngfnk"',
            status: 'REJECTED'
        },
        {
            id: 3,
            requester: 'Rudi Tabuti Sugiharto',
            projectName: 'E-Commerce Web Revamp',
            clientName: 'PT Teleopedia',
            description: '"Lorem ipsum odiusdsdf sdsdsddsvsvsvsnsn snspsosronsispsnnagsngspsn snsgsipsdsosogsdngjsgsn gnsospjedsojgadsngjsn"',
            status: 'APPROVED'
        },
        {
            id: 4,
            requester: 'Rudi Tabuti Sugiharto',
            projectName: 'E-Commerce Web Revamp',
            clientName: 'PT Teleopedia',
            description: '"Kebutugan neosusemfinml xinhuglshngudl sdsnslxksnglsingsisn sdnsmlakmlsdkfndkjfngfnk"',
            status: 'REJECTED'
        }
    ];

    const getStatusColor = (status) => {
        if (status === 'APPROVED') {
            return {
                bg: 'rgba(6, 208, 1, 0.2)',
                text: '#06D001',
                border: '#06D001'
            };
        } else if (status === 'REJECTED') {
            return {
                bg: 'rgba(255, 0, 0, 0.2)',
                text: '#FF0000',
                border: '#FF0000'
            };
        }
        return {
            bg: 'rgba(169, 169, 169, 0.2)',
            text: '#A9A9A9',
            border: '#A9A9A9'
        };
    };

    return (
        <div className="flex min-h-screen bg-[#E6F2F1] font-['SF_Pro_Display']">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 ml-[267px] p-8">
                {/* Page Title */}
                <h1 className="text-4xl font-bold text-gray-800 mb-8">Activities</h1>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('extend')}
                            className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${
                                activeTab === 'extend'
                                    ? 'bg-white text-gray-800 border-t-2 border-l-2 border-r-2 border-gray-300'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            style={{ fontSize: '16px', fontFamily: 'SF Pro Display' }}
                        >
                            Extend
                        </button>
                        <button
                            onClick={() => setActiveTab('release')}
                            className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${
                                activeTab === 'release'
                                    ? 'bg-white text-gray-800 border-t-2 border-l-2 border-r-2 border-gray-300'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            style={{ fontSize: '16px', fontFamily: 'SF Pro Display' }}
                        >
                            Release
                        </button>
                        <button
                            onClick={() => setActiveTab('assignment')}
                            className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${
                                activeTab === 'assignment'
                                    ? 'bg-white text-gray-800 border-t-2 border-l-2 border-r-2 border-gray-300'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            style={{ fontSize: '16px', fontFamily: 'SF Pro Display' }}
                        >
                            Assignment
                        </button>
                        <button
                            onClick={() => setActiveTab('project')}
                            className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${
                                activeTab === 'project'
                                    ? 'bg-white text-gray-800 border-t-2 border-l-2 border-r-2 border-gray-300'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            style={{ fontSize: '16px', fontFamily: 'SF Pro Display' }}
                        >
                            Project
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Extend Tab */}
                    {activeTab === 'extend' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#CAF0F8]">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Requester</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Project</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Resource Name</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Role</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Old End Date</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>New End Date</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Description</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {extendData.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.requester}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.project}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.resourceName}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.role}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.oldEndDate}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.newEndDate}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800 italic" style={{ fontSize: '14px' }}>{item.description}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex justify-center">
                                                    <span
                                                        className="px-3 py-1 rounded font-semibold"
                                                        style={{
                                                            fontSize: '12px',
                                                            backgroundColor: getStatusColor(item.status).bg,
                                                            color: getStatusColor(item.status).text,
                                                            border: `1px solid ${getStatusColor(item.status).border}`
                                                        }}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Release Tab */}
                    {activeTab === 'release' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#CAF0F8]">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Requester</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Project</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Resource Name</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Role</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Old End Date</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>New End Date</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Description</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {releaseData.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.requester}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.project}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.resourceName}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.role}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.oldEndDate}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.newEndDate}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800 italic" style={{ fontSize: '14px' }}>{item.description}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex justify-center">
                                                    <span
                                                        className="px-3 py-1 rounded font-semibold"
                                                        style={{
                                                            fontSize: '12px',
                                                            backgroundColor: getStatusColor(item.status).bg,
                                                            color: getStatusColor(item.status).text,
                                                            border: `1px solid ${getStatusColor(item.status).border}`
                                                        }}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Assignment Tab */}
                    {activeTab === 'assignment' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#CAF0F8]">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Requester</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Project</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Resource Name</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Role</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Start Date</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>End Date</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignmentData.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.requester}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.project}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.resourceName}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.role}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.startDate}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.endDate}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex justify-center">
                                                    <span
                                                        className="px-3 py-1 rounded font-semibold"
                                                        style={{
                                                            fontSize: '12px',
                                                            backgroundColor: getStatusColor(item.status).bg,
                                                            color: getStatusColor(item.status).text,
                                                            border: `1px solid ${getStatusColor(item.status).border}`
                                                        }}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Project Tab */}
                    {activeTab === 'project' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#CAF0F8]">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Requester</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Nama Project</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Nama Client</th>
                                        <th className="text-left py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Description</th>
                                        <th className="text-center py-4 px-6 font-bold text-gray-700" style={{ fontSize: '16px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectData.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.requester}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.projectName}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800" style={{ fontSize: '14px' }}>{item.clientName}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-gray-800 italic" style={{ fontSize: '14px' }}>{item.description}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex justify-center">
                                                    <span
                                                        className="px-3 py-1 rounded font-semibold"
                                                        style={{
                                                            fontSize: '12px',
                                                            backgroundColor: getStatusColor(item.status).bg,
                                                            color: getStatusColor(item.status).text,
                                                            border: `1px solid ${getStatusColor(item.status).border}`
                                                        }}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Activities;
