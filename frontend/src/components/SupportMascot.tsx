'use client';

export default function SupportMascot({ 
    size = 'md', 
    animated = true, 
    showHalo = true,
    className = '' 
}: { 
    size?: 'sm' | 'md' | 'lg' | 'xl'; 
    animated?: boolean; 
    showHalo?: boolean;
    className?: string;
}) {
    const sizeMap = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    };

    return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
            {/* Halo Glow phía sau */}
            {showHalo && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-400/30 via-emerald-400/20 to-indigo-400/30 blur-md animate-pulse" />
            )}

            {/* SVG MASCOT HOẠT HÌNH NOVA BOT DỄ THƯƠNG */}
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`w-full h-full relative z-10 select-none ${animated ? 'hover:scale-110 transition-transform duration-300' : ''}`}
            >
                <defs>
                    <linearGradient id="bodyGrad" x1="20" y1="20" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFFFFF" />
                        <stop offset="0.6" stopColor="#E0F2FE" />
                        <stop offset="1" stopColor="#BAE6FD" />
                    </linearGradient>

                    <linearGradient id="visorGrad" x1="30" y1="40" x2="70" y2="65" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0F172A" />
                        <stop offset="1" stopColor="#1E293B" />
                    </linearGradient>

                    <linearGradient id="earGrad" x1="10" y1="45" x2="25" y2="60" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#38BDF8" />
                        <stop offset="1" stopColor="#0284C7" />
                    </linearGradient>

                    <linearGradient id="blushGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop stopColor="#FDA4AF" stopOpacity="0.8" />
                        <stop offset="1" stopColor="#FB7185" stopOpacity="0.3" />
                    </linearGradient>

                    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15" />
                    </filter>
                </defs>

                {/* Headset Arc nối đỉnh đầu */}
                <path
                    d="M26 44 C26 22 74 22 74 44"
                    stroke="#0284C7"
                    strokeWidth="5"
                    strokeLinecap="round"
                />

                {/* Antenna đỉnh đầu phát sóng AI */}
                <path d="M50 24 L50 14" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
                <circle cx="50" cy="11" r="5" fill="#38BDF8" />
                <circle cx="50" cy="11" r="2.5" fill="#10B981" />

                {/* Headset Ear Cups 2 bên */}
                <rect x="18" y="40" width="10" height="18" rx="5" fill="url(#earGrad)" filter="url(#softShadow)" />
                <rect x="72" y="40" width="10" height="18" rx="5" fill="url(#earGrad)" filter="url(#softShadow)" />
                <rect x="20" y="44" width="6" height="10" rx="3" fill="#E0F2FE" />
                <rect x="74" y="44" width="6" height="10" rx="3" fill="#E0F2FE" />

                {/* Microphone vươn ra miệng */}
                <path d="M22 56 C22 68 32 72 38 72" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
                <circle cx="39" cy="72" r="3.5" fill="#10B981" />

                {/* Main Head Round Capsule */}
                <rect
                    x="25"
                    y="25"
                    width="50"
                    height="46"
                    rx="22"
                    fill="url(#bodyGrad)"
                    stroke="#0284C7"
                    strokeWidth="2.5"
                    filter="url(#softShadow)"
                />

                {/* Cheerful Visor Screen */}
                <rect x="31" y="36" width="38" height="24" rx="12" fill="url(#visorGrad)" />

                {/* Cute Eyes - Sparkling Aqua Green */}
                {/* Left Eye */}
                <ellipse cx="42" cy="47" rx="3.5" ry="4.5" fill="#38BDF8" />
                <circle cx="43.2" cy="45.5" r="1.5" fill="#FFFFFF" />
                {/* Right Eye */}
                <ellipse cx="58" cy="47" rx="3.5" ry="4.5" fill="#38BDF8" />
                <circle cx="59.2" cy="45.5" r="1.5" fill="#FFFFFF" />

                {/* Cute Happy Smile */}
                <path
                    d="M47 52 Q50 56 53 52"
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />

                {/* Rosy Blushing Cheeks */}
                <ellipse cx="36" cy="52" rx="3.5" ry="2" fill="url(#blushGrad)" />
                <ellipse cx="64" cy="52" rx="3.5" ry="2" fill="url(#blushGrad)" />

                {/* Collar / Little Body Hoodie */}
                <path
                    d="M32 71 C32 71 38 78 50 78 C62 78 68 71 68 71 L72 88 C72 90 70 92 68 92 L32 92 C30 92 28 90 28 88 Z"
                    fill="#0284C7"
                />
                <path
                    d="M40 76 L50 84 L60 76"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Waving Hand (Little Paw) */}
                <ellipse cx="76" cy="74" rx="4.5" ry="4.5" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
            </svg>
        </div>
    );
}
