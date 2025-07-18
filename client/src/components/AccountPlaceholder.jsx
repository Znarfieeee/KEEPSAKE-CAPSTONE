import React from "react"
import { useAuth } from "../context/auth"
import { useNavigate } from "react-router-dom"

// UI Components
import { AiOutlineUser } from "react-icons/ai"
import { BiLogOut } from "react-icons/bi"
import { BiCog } from "react-icons/bi"
import { Avatar, Menu, Portal } from "@chakra-ui/react"

const AccountPlaceholder = () => {
    const { signOut, user, userDetail } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await signOut()
        } catch (e) {
            console.error("Logout failed", e)
        } finally {
            // After sign-out, redirect to login page
            navigate("/login")
        }
    }
    return (
        <div>
            <Menu.Root positioning={{ placement: "bottom-end" }}>
                <Menu.Trigger
                    rounded="full"
                    className="cursor-pointer hover:bg-gray-200 transition-all duration-300 delay-30">
                    <Avatar.Root size="sm">
                        <AiOutlineUser className="text-2xl" />
                    </Avatar.Root>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner className="w-50">
                        <Menu.Content className="flex flex-col gap-2">
                            <span className="px-3 flex flex-col gap-0.5">
                                <h1>
                                    {`${userDetail?.firstname || ""} ${
                                        userDetail?.lastname || ""
                                    }`.trim() ||
                                        user?.metadata?.full_name ||
                                        user?.metadata?.name ||
                                        user?.email ||
                                        "User"}
                                </h1>
                                {userDetail?.specialty && (
                                    <p className="text-sm text-gray-500 capitalize">
                                        {user?.role === "admin"
                                            ? "System Administrator"
                                            : userDetail?.specialty}
                                    </p>
                                )}
                                {user?.role && (
                                    <p className="text-sm text-gray-500 capitalize">
                                        {user.role}
                                    </p>
                                )}
                            </span>
                            <Menu.Separator />
                            <Menu.Item
                                value="settings"
                                className="bg-white"
                                onClick={() => navigate("/admin/settings")}>
                                <BiCog className="text-xl" />
                                Settings
                            </Menu.Item>
                            <Menu.Item
                                value="logout"
                                className="bg-white"
                                onClick={handleLogout}>
                                <BiLogOut className="text-xl" />
                                Logout
                            </Menu.Item>
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>
        </div>
    )
}

export default AccountPlaceholder
