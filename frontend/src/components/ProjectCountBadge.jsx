import React from 'react';

const ProjectCountBadge = ({ count, size = 'normal' }) => {
    const getColors = (c) => {
        if (c === 0) {
            return {
                border: '#06D001',
                background: 'rgba(6, 208, 1, 0.2)',
                text: '#06D001'
            };
        } else if (c === 1) {
            return {
                border: '#0059FF',
                background: 'rgba(0, 89, 255, 0.2)',
                text: '#0059FF'
            };
        } else if (c === 2) {
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
    };

    const colors = getColors(count);
    const isSmall = size === 'small';

    return (
        <span
            className={`rounded-full font-bold whitespace-nowrap ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1'}`}
            style={{
                fontSize: isSmall ? '11px' : '12px',
                fontFamily: 'SF Pro Display',
                color: colors.text,
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`
            }}
        >
            ACTIVE IN {count} PROJECT{count !== 1 ? 'S' : ''}
        </span>
    );
};

export default ProjectCountBadge;
