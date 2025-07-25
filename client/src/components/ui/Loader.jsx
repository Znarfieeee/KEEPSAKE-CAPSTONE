import React from "react"
import styled from "styled-components"

const Loader = () => {
    return (
        <StyledWrapper>
            <div className="loading">
                <svg height="48px" width="64px">
                    <polyline
                        id="back"
                        points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"
                    />
                    <polyline
                        id="front"
                        points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"
                    />
                </svg>
            </div>
        </StyledWrapper>
    )
}

const StyledWrapper = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #fffafa;
    z-index: 9999;

    .loading svg {
        width: 128px;
        height: 96px;
    }

    .loading svg polyline {
        fill: none;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    .loading svg polyline#back {
        fill: none;
    }

    .loading svg polyline#front {
        fill: none;
        stroke: #0082a6;
        stroke-dasharray: 48, 144;
        stroke-dashoffset: 192;
        animation: dash_682 1.4s linear infinite;
    }

    @keyframes dash_682 {
        72.5% {
            opacity: 0;
        }

        to {
            stroke-dashoffset: 0;
        }
    }
`

export default Loader
