import React from 'react'
import styled from 'styled-components'

const Loader = () => {
    return (
        <StyledWrapper>
            <div className="loading">
                <svg viewBox="0 0 128 96" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#00bcd4" />
                            <stop offset="100%" stopColor="#0082a6" />
                        </linearGradient>
                    </defs>
                    <polyline
                        id="back"
                        points="0.314 47.908, 28 47.908, 43.686 96, 86 0, 100 48, 128 48"
                    />
                    <polyline
                        id="front"
                        points="0.314 47.908, 28 47.908, 43.686 96, 86 0, 100 48, 128 48"
                    />
                </svg>
            </div>
        </StyledWrapper>
    )
}

const StyledWrapper = styled.div`
    position: fixed;
    width: 100%;
    height: 100%;
    min-height: inherit;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;

    .loading {
        width: 128px;
        height: 96px;
        max-width: 100%;
        max-height: 100%;
    }

    .loading svg {
        width: 100%;
        height: 100%;
        display: block;
    }

    .loading svg polyline {
        fill: none;
        stroke-width: 4;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    .loading svg polyline#back {
        stroke: #ddd;
    }

    .loading svg polyline#front {
        stroke: url(#loaderGradient);
        stroke-dasharray: 96, 288;
        stroke-dashoffset: 384;
        animation: dash_682 1.4s linear infinite;
    }

    /* Responsive sizing */
    @media (min-width: 640px) {
        .loading {
            width: min(160px, 100%);
            height: min(120px, 100%);
        }
    }

    @keyframes dash_682 {
        72.5% {
            opacity: 0;
        }
        to {
            stroke-dashoffset: 0;
        }
    }

    @keyframes scaleIn {
        0% {
            transform: scale(0.85);
            opacity: 0;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
`

export default Loader
