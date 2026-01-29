import React from 'react';

const StatusBadge = ({ status, className = '' }) => {
    const getStatusStyle = (statusName) => {
        const upperStatus = statusName?.toUpperCase();

        // Green Group
        if (['ONGOING', 'APPROVED', 'ACTIVE', 'AVAILABLE', 'ASSIGN'].includes(upperStatus)) {
            return {
                color: '#06D001',
                borderColor: '#06D001',
                backgroundColor: 'rgba(6, 208, 1, 0.2)'
            };
        }

        // Orange Group
        if (['HOLD', 'EXTEND'].includes(upperStatus)) {
            return {
                color: '#F97316',
                borderColor: '#F97316',
                backgroundColor: 'rgba(249, 115, 22, 0.2)'
            };
        }

        // Red Group - Including 'RELEASED' and 'EXPIRED' based on typical usage context alongside user's 'RELEASE'
        if (['CLOSED', 'REJECTED', 'RELEASE', 'RELEASED', 'ASSIGNED', 'UNAVAILABLE', 'EXPIRED'].includes(upperStatus)) {
            return {
                color: '#FF0000',
                borderColor: '#FF0000',
                backgroundColor: 'rgba(255, 0, 0, 0.2)'
            };
        }

        // Yellow Group
        if (['PENDING'].includes(upperStatus)) {
            return {
                color: '#FBCD3F',
                borderColor: '#FBCD3F',
                backgroundColor: 'rgba(251, 205, 63, 0.2)'
            };
        }

        // Blue Group
        if (['PROJECT'].includes(upperStatus)) {
            return {
                color: '#0059FF',
                borderColor: '#0059FF',
                backgroundColor: 'rgba(0, 89, 255, 0.2)'
            };
        }

        // Default (Blue-ish fallback if needed, or keeping previous default)
        return {
            color: '#000000',
            borderColor: '#000000',
            backgroundColor: '#CAF0F8'
        };
    };

    const style = getStatusStyle(status);

    return (
        <span
            className={`px-3 py-1 rounded-full text-[12px] font-bold border inline-block text-center ${className}`}
            style={{
                fontFamily: 'SF Pro Display',
                ...style
            }}
        >
            {status}
        </span>
    );
};

export default StatusBadge;
