import React from "react"
import { Button } from "../ui/Button"
import { showToast } from "../../util/alertHelper"

const CopyTokenButton = ({ token }) => {
    const handleCopy = async () => {
        const inviteUrl = `${window.location.origin}/invite?token=${token}`
        try {
            await navigator.clipboard.writeText(inviteUrl)
            showToast("success", "Invitation link copied to clipboard!")
        } catch (err) {
            showToast("error", "Failed to copy invitation link")
            console.error("Copy failed:", err)
        }
    }

    return (
        <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="w-[120px]">
            Copy Link
        </Button>
    )
}

export default CopyTokenButton
