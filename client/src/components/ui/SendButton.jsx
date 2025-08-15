import React from "react"
import styled, { keyframes, css } from "styled-components"
import { Button } from "@/components/ui/button"

const flyForward = keyframes`
  0%   { transform: translateX(0) rotate(45deg) scale(1.1); }
  100% { transform: translateX(5em) rotate(45deg) scale(1.1); opacity: 0; }
`

const SendButton = ({ isLoading, isSuccess, onClick }) => {
    return (
        <StyledWrapper $isLoading={isLoading} $isSuccess={isSuccess}>
            <Button
                type="submit"
                onClick={onClick}
                disabled={isLoading}
                className="ml-auto flex items-center" // pushes to end in DialogFooter
            >
                <div className="svg-wrapper-1">
                    <div className="svg-wrapper">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width={16}
                            height={16}>
                            <path fill="none" d="M0 0h24v24H0z" />
                            <path
                                fill="currentColor"
                                d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                            />
                        </svg>
                    </div>
                </div>
                <span>
                    {isLoading ? "Sending..." : isSuccess ? "Sent!" : "Send"}
                </span>
            </Button>
        </StyledWrapper>
    )
}

const StyledWrapper = styled.div`
    button span {
        display: block;
        margin-left: 0.3em;
        transition: all 0.3s ease-in-out;
    }

    button svg {
        display: block;
        transform-origin: center center;
        transition: transform 0.3s ease-in-out;
    }

    /* Hover animation (normal state) */
    button:hover .svg-wrapper {
        animation: fly-1 0.6s ease-in-out infinite alternate;
    }

    @keyframes fly-1 {
        from {
            transform: translateY(0.1em);
        }
        to {
            transform: translateY(-0.1em);
        }
    }

    /* Loading state: lock hover animation */
    ${({ $isLoading }) =>
        $isLoading &&
        css`
            button .svg-wrapper {
                animation: fly-1 0.6s ease-in-out infinite alternate;
            }
            button svg {
                transform: translateX(1.2em) rotate(45deg) scale(1.1);
            }
        `}

    /* Success state: fly forward */
  ${({ $isSuccess }) =>
        $isSuccess &&
        css`
            button svg {
                animation: ${flyForward} 0.6s forwards;
            }
        `}
`

export default SendButton
