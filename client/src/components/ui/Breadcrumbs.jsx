import React from "react"
import { Link, useLocation } from "react-router-dom"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const SEGMENT_LABELS = {
    "": "Home",
    admin: "Dashboard",
    facilities: "Facilities Registry",
    sub_billing: "Subscription & Billing",
    tokinv_system: "Token & Invite System",
    audit_logs: "Audit & Logs",
    api_webhooks: "API & Webhooks",
    system_config: "System Configuration",
    maintenance_mode: "Maintenance Mode",
}

function Breadcrumbs() {
    const location = useLocation()
    const segments = location.pathname.split("/").filter(Boolean)

    if (segments.length === 0) return null // at root

    let pathAcc = ""

    return (
        <Breadcrumb className="mb-4 ml-10 text-sm text-gray-400">
            <BreadcrumbList>
                {segments.map((seg, idx) => {
                    pathAcc += `/${seg}`
                    const isLast = idx === segments.length - 1
                    const label = SEGMENT_LABELS[seg] || seg
                    return (
                        <React.Fragment key={idx}>
                            <BreadcrumbItem className="hover:text-black hover:underline duration-300 transition-colors">
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link to={pathAcc}>{label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export default Breadcrumbs
