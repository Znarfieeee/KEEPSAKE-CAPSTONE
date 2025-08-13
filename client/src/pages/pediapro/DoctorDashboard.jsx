import React from "react"

const DoctorDashboard = () => {
    return (
        <>
            <div className="grid grid-cols-12 grid-rows-7 gap-4">
                <div className="col-span-4">1</div>
                <div className="col-span-4 col-start-5">2</div>
                <div className="col-span-4 col-start-9">3</div>
                <div className="col-span-7 row-span-3 row-start-2">4</div>
                <div className="col-span-5 row-span-3 col-start-8 row-start-2">
                    5
                </div>
                <div className="col-span-12 row-span-3 row-start-5">6</div>
            </div>
        </>
    )
}

export default DoctorDashboard
