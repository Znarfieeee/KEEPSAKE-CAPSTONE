import React from "react"
import GoogleIcon from "../../assets/google-logo.png"
import LoadingButton from "./LoadingButton"

/**
 * A styled button that matches the main “Sign in” button but contains
 * the Google logo and a label. Width and margin are controlled by the
 * `className` prop (e.g. `w-[90%] mt-6 ...` just like the primary button).
 */
const GoogleButton = ({ className = "" }) => {
    return (
        <LoadingButton
            className={`flex items-center justify-center gap-2 ${className}`}
            onClick={() => console.log("Google button clicked")}>
            <img src={GoogleIcon} alt="Google" className="h-5 w-5" />
            <span className="font-medium">Sign in with Google</span>
        </LoadingButton>
    )
}

export default GoogleButton
