import React from 'react';
import type { GeneratedImage } from '../types';

const mockImages: GeneratedImage[] = [
    {
        _id: '1',
        prompt: 'A futuristic city with neon lights and flying cars',
        author: 'Aashish',
        imageUrl: 'https://via.placeholder.com/400x500',
        createdAt: new Date().toISOString(),
    },
];

const Explore = () => {
    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-white">Community Showcase</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {mockImages.map((img) => (
                    <div key={img._id} className="group relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-all">
                        <img src={img.imageUrl} alt={img.prompt} className="w-full h-auto object-cover" />

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                            <p className="text-sm text-gray-200 line-clamp-2 italic">"{img.prompt}"</p>
                            <p className="text-xs text-blue-400 mt-2 font-semibold">By {img.author}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Explore;