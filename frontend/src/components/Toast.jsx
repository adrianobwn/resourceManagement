import React, { useEffect } from 'react';

const Toast = ({ show, message, type = 'success', onClose, closing }) => {
    if (!show) return null;

    const getStyles = () => {
        switch (type) {
            case 'success': // Approved/Acc
                return {
                    backgroundColor: 'rgba(6, 208, 1, 0.2)',
                    borderColor: '#06D001',
                    color: '#06D001',
                    iconColor: '#06D001'
                };
            case 'error': // Reject
                return {
                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                    borderColor: '#FF0000',
                    color: '#FF0000',
                    iconColor: '#FF0000'
                };
            case 'info': // Information
            default:
                return {
                    backgroundColor: 'rgba(0, 89, 255, 0.2)', // #0059FF 20% opacity
                    borderColor: '#0059FF',
                    color: '#0059FF',
                    iconColor: '#0059FF'
                };
        }
    };

    const styles = getStyles();

    return (
        <div
            className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-300 ease-in-out ${closing
                ? 'opacity-0 translate-x-full'
                : 'opacity-100 translate-x-0 animate-slide-in'
                }`}
            style={{
                backgroundColor: styles.backgroundColor,
                border: `1px solid ${styles.borderColor}`
            }}
        >
            <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke={styles.iconColor}
                viewBox="0 0 24 24"
            >
                {type === 'success' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                ) : type === 'error' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
            </svg>
            <span
                className="font-bold"
                style={{
                    color: styles.color,
                    fontSize: '14px',
                    fontFamily: 'SF Pro Display'
                }}
            >
                {message}
            </span>
            <button
                onClick={onClose}
                className="ml-2 hover:opacity-70 transition-opacity flex-shrink-0"
                style={{ color: styles.iconColor }}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default Toast;
