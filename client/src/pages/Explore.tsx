import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { GeneratedImage } from '../types';
import ImageCard from '../components/ImageCard';
import SkeletonCard from '../components/SkeletonCard';

const Explore = () => {
    const STORAGE_KEY = 'visionstream-explore-cache';

    const cachedInitial = (() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { images: [] as GeneratedImage[], page: 1, total: 0 };

            const cached = JSON.parse(raw) as {
                images?: GeneratedImage[];
                page?: number;
                total?: number;
                scrollY?: number;
            };

            return {
                images: cached.images || [] as GeneratedImage[],
                page: cached.page || 1,
                total: cached.total || 0,
            };
        } catch {
            return { images: [] as GeneratedImage[], page: 1, total: 0 };
        }
    })();

    const [images, setImages] = useState<GeneratedImage[]>(cachedInitial.images);
    const [loading, setLoading] = useState(cachedInitial.images.length === 0);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(cachedInitial.page);
    const [limit] = useState(24);
    const [total, setTotal] = useState(cachedInitial.total);

    const loadCache = useCallback(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;

            const cached = JSON.parse(raw) as {
                images?: GeneratedImage[];
                page?: number;
                total?: number;
                scrollY?: number;
            };

            if (!cached.images || cached.images.length === 0) return false;

            setImages(cached.images);
            setPage(cached.page || 1);
            setTotal(cached.total || 0);
            setLoading(false);

            if (typeof cached.scrollY === 'number') {
                window.scrollTo(0, cached.scrollY);
            }

            return true;
        } catch (error) {
            console.warn('Failed to restore explore cache:', error);
            return false;
        }
    }, []);

    const saveCache = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                images,
                page,
                total,
                scrollY: window.scrollY,
            }));
        } catch (error) {
            console.warn('Failed to save explore cache:', error);
        }
    }, [images, page, total]);

    const fetchImages = useCallback(async (p = 1) => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/images', {
                params: { page: p, limit },
                timeout: 1000000,
            });

            const { images: fetched, total: t } = response.data;

            setTotal(t || 0);
            setImages(prev => (p === 1 ? fetched : [...prev, ...fetched]));
            setError(null);
        } catch (error: any) {
            console.error('Error fetching images:', error);
            setError(error.message || 'Failed to load images');
            if (p === 1) setImages([]);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        const hydrated = loadCache();
        if (!hydrated && images.length === 0) {
            fetchImages(1);
        }
    }, [fetchImages, loadCache, images.length]);

    useEffect(() => {
        if (!loading) {
            saveCache();
        }
    }, [images, page, total, loading, saveCache]);

    useEffect(() => {
        return () => {
            saveCache();
        };
    }, [saveCache]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-8 text-white cartoon-heading">Community Showcase</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 grid-cartoon">
                    <SkeletonCard count={12} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-8 text-white">Community Showcase</h1>
                <div className="text-center text-red-400">
                    <p>Failed to load images: {error}</p>
                    <p className="text-sm text-gray-400 mt-2">Make sure the backend is running on http://localhost:5000</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-white cartoon-heading">Community Showcase</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 grid-cartoon">
                {images.map((img) => (
                    <div key={img._id} className="group relative cartoon-card overflow-hidden transition-all" style={{ height: 240 }}>
                        <ImageCard src={img.imageUrl || ''} alt={img.prompt} className="image-squarish h-full w-full" />

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                            <p className="text-sm text-gray-200 line-clamp-2 italic">"{img.prompt}"</p>
                            <p className="text-xs text-blue-400 mt-2 font-semibold">By {img.author}</p>
                        </div>
                    </div>
                ))}
            </div>

            {images.length === 0 && !loading && (
                <div className="text-center text-gray-400 mt-12">
                    No images generated yet. Be the first to create something!
                </div>
            )}

            {images.length > 0 && images.length < total && (
                <div className="mt-8 text-center">
                    <button
                        className="cartoon-btn"
                        onClick={async () => {
                            const next = page + 1;
                            setPage(next);
                            setLoading(true);

                            try {
                                const response = await axios.get('http://localhost:5000/api/images', { params: { page: next, limit } });
                                setImages(prev => [...prev, ...(response.data.images || [])]);
                                setTotal(response.data.total || 0);
                            } catch (err: any) {
                                setError(err.message || 'Failed to load more');
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        Load more
                    </button>
                </div>
            )}
        </div>
    );
};

export default Explore;