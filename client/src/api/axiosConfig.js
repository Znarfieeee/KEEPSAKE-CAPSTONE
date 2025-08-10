export const axiosConfig = {
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
    silent: true,
}

export const transformResponse = [
    data => {
        try {
            return JSON.parse(data)
        } catch {
            try {
                return JSON.parse(decodeURIComponent(escape(data)))
            } catch {
                return data
            }
        }
    },
]

export const axiosConfigWithTransform = {
    ...axiosConfig,
    transformResponse,
}
