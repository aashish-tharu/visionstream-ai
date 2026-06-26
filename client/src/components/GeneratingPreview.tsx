import React from 'react';
import { Sparkles } from 'lucide-react';

export default function GeneratingPreview() {
    return (
        <div className="generating-wrap w-full">
            <div className="generating-card">
                <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexDirection: 'column' }}>
                    <div className="generating-orb">
                        <div style={{ width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles size={34} color="rgba(255,255,255,0.95)" />
                        </div>
                    </div>
                    <div className="generating-dots">Generating image<span className="dot-anim">..</span></div>
                </div>
            </div>
        </div>
    );
}
