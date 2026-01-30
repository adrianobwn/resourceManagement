import React from 'react';
import Sidebar from './Sidebar';

const PageLayout = ({ children, title }) => {
    return (
        <div className="flex min-h-screen bg-[#E6F2F1] font-['SF_Pro_Display']">
            <Sidebar />

            <div className="flex-1 ml-[267px] flex flex-col h-screen overflow-hidden bg-[#E6F2F1]">
                <div className="p-8 pb-4">
                    <h1 className="text-4xl font-bold text-gray-800 mb-6">{title}</h1>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default PageLayout;
