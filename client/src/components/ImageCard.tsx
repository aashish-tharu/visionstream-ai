import React, { useState, useMemo } from 'react';

type Props = {
    src: string;
    alt?: string;
    className?: string;
};

const isCloudinary = (url: string) => url.includes('res.cloudinary.com') || url.includes('/upload/');

const cloudinaryThumb = (url: string, w = 80) => {
    try {
        // insert transformation after /upload/
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            return parts[0] + '/upload/w_' + w + ',c_fill,q_auto,f_auto/' + parts[1];
        }
        return url;
    } catch {
        return url;
    }
};

export default function ImageCard({ src, alt = '', className = '' }: Props) {
    const [loaded, setLoaded] = useState(false);

    const tiny = useMemo(() => (isCloudinary(src) ? cloudinaryThumb(src, 60) : src), [src]);

    return (
        <div className={`relative overflow-hidden ${className}`} aria-busy={!loaded}>
            <div
                aria-hidden
                style={{
                    backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06))`,
                }}
                className={`absolute inset-0 transition-opacity duration-300 skeleton ${loaded ? 'opacity-0' : 'opacity-100'}`}
            />

            <img
                src={tiny}
                alt={alt}
                className="w-full h-full object-cover blur-sm scale-105"
                style={{ display: loaded ? 'none' : 'block' }}
                decoding="async"
                loading="lazy"
            />

            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100 image-loaded' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
                decoding="async"
                loading="lazy"
            />
        </div>
    );
}
