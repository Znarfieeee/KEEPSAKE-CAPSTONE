import React from "react"

// UI Components
import { IoIosNotificationsOutline } from "react-icons/io"
import { Avatar, Menu, Portal } from "@chakra-ui/react"

const notifications = {
    1: {
        id: 1,
        title: "Check your email",
        description: "We sent you an email to verify your account",
        time: "12:00 PM",
    },
    2: {
        id: 2,
        title: "New Facility Added",
        description: "A new facility has been added to the system",
        time: "12:00 PM",
    },
    3: {
        id: 3,
        title: "New user subscribed!",
        description: "A new facility has been added to the system",
        time: "12:00 PM",
    },
}

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
                            {Object.entries(notifications).map(
                                ([id, notif]) => {
                                    return (
                                        <Menu.Item key={id} value={notif.title}>
                                            <div>
                                                <h1>{notif.title}</h1>
                                                <p>{notif.description}</p>
                                                <p>{notif.time}</p>
                                            </div>
                                        </Menu.Item>
                                    )
                                }
                            )}

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
