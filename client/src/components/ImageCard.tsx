import React, { useState, useMemo } from 'react';

type Props = {
    src: string;
    alt?: string;
    className?: string;
    displayWidth?: number;
};

const isCloudinary = (url: string) => url.includes('res.cloudinary.com') || url.includes('/upload/');

const cloudinaryTransform = (url: string, w: number) => {
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;
    return `${parts[0]}/upload/w_${w},c_fill,g_auto,q_auto,f_auto,dpr_auto/${parts[1]}`;
};

export default function ImageCard({ src, alt = '', className = '', displayWidth = 400 }: Props) {
    const [loaded, setLoaded] = useState(false);
    const cloudinarySrc = isCloudinary(src);

    const displaySrc = useMemo(
        () => (cloudinarySrc ? cloudinaryTransform(src, displayWidth) : src),
        [src, cloudinarySrc, displayWidth]
    );

    const placeholderSrc = useMemo(
        () => (cloudinarySrc ? cloudinaryTransform(src, 40) : null),
        [src, cloudinarySrc]
    );

    return (
        <div className={`relative overflow-hidden ${className}`} aria-busy={!loaded}>
            <div
                aria-hidden
                style={{
                    backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06))`,
                }}
                className={`absolute inset-0 transition-opacity duration-300 skeleton ${loaded ? 'opacity-0' : 'opacity-100'}`}
            />

            {placeholderSrc && (
                <img
                    src={placeholderSrc}
                    alt=""
                    aria-hidden
                    className="w-full h-full object-cover blur-sm scale-105"
                    style={{ display: loaded ? 'none' : 'block' }}
                    decoding="async"
                    loading="lazy"
                />
            )}

            <img
                src={displaySrc}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100 image-loaded' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
                decoding="async"
                loading="lazy"
            />
        </div>
    );
}
