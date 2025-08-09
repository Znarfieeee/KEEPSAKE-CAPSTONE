import React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/Table"
import { Badge } from "../ui/Badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Button } from "../ui/Button"
import { MoreHorizontal } from "lucide-react"
import CopyTokenButton from "./CopyTokenButton"

const InvitationTable = ({
    invitations,
    facilities,
    onRevokeInvitation,
    isLoading,
}) => {
    const getStatusBadge = invitation => {
        const now = new Date()
        const expiryDate = new Date(invitation.expires_at)

        if (invitation.revoked_at) {
            return <Badge variant="destructive">Revoked</Badge>
        }

        if (expiryDate < now) {
            return <Badge variant="secondary">Expired</Badge>
        }

        return <Badge variant="success">Active</Badge>
    }

    const getFacilityName = facilityId => {
        return (
            facilities?.find(f => f.facility_id === facilityId)
                ?.facility_name || "N/A"
        )
    }

    const formatDate = dateString => {
        return new Date(dateString).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        })
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Facility</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invitations?.map(invitation => (
                        <TableRow
                            key={invitation.inv_id}
                            className={
                                invitation.revoked_at ? "opacity-60" : ""
                            }>
                            <TableCell>{invitation.email}</TableCell>
                            <TableCell className="capitalize">
                                {invitation.role.replace("_", " ")}
                            </TableCell>
                            <TableCell>
                                {getFacilityName(invitation.facility_id)}
                            </TableCell>
                            <TableCell>{getStatusBadge(invitation)}</TableCell>
                            <TableCell>
                                {formatDate(invitation.expires_at)}
                            </TableCell>
                            <TableCell>
                                {formatDate(invitation.created_at)}
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <CopyTokenButton
                                                token={invitation.token}
                                            />
                                        </DropdownMenuItem>
                                        {!invitation.revoked_at && (
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() =>
                                                    onRevokeInvitation(
                                                        invitation.inv_id
                                                    )
                                                }
                                                disabled={isLoading}>
                                                Revoke Invitation
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!invitations?.length && (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="text-center text-muted-foreground">
                                No invitations found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export default InvitationTable
