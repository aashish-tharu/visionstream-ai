import React from 'react';

interface SkeletonCardProps {
    count?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 12 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={`skeleton-${index}`}
                    className="group relative cartoon-card overflow-hidden transition-all bg-gray-800"
                    style={{ height: 240 }}
                >
                    <div className="w-full h-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
                </div>
            ))}
        </>
    );
};

export default SkeletonCard;
