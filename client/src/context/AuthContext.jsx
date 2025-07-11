import React, { createContext, useState, useContext, useEffect } from "react"
// import backendConnection from "../api/BackendConnection"
// import { showToast } from "../util/alertHelper"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(undefined)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // useEffect(() => {
    //     supabase.auth.getSession().then(({data: { session }})=> {
    //         setSession(session)
    //     })
    // }, [])

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                loading,
            }}>
            {children}
        </AuthContext.Provider>
    )
}

// Custom hook for using auth context
export const useAuth = () => {
    return useContext(AuthContext)
}

export default AuthContext
