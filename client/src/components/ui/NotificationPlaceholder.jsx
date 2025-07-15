import React from "react"

// UI Components
import { IoIosNotificationsOutline } from "react-icons/io"
import { Avatar, Menu, Portal } from "@chakra-ui/react"

const AccountPlaceholder = () => {
    return (
        <div>
            <Menu.Root positioning={{ placement: "bottom-end" }}>
                <Menu.Trigger
                    rounded="full"
                    className="cursor-pointer hover:bg-gray-200 transition-all duration-300 delay-30">
                    <Avatar.Root size="sm">
                        <IoIosNotificationsOutline className="text-2xl" />
                    </Avatar.Root>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner className="w-50">
                        <Menu.Content className="flex flex-col gap-2">
                            <span className="px-3">
                                <h1>Dr. S. Wong </h1>
                                <p className="text-sm text-gray-500">
                                    Sulfur Soap
                                </p>
                            </span>
                            <Menu.Separator />
                            <Menu.Item
                                value="logout"
                                className="bg-white"></Menu.Item>
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>
        </div>
    )
}

export default AccountPlaceholder
