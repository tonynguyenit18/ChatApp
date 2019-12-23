import axios from "axios";
// export const BASE_URL = "http://192.168.1.103:8080";
// export const SOCKET_URL = "http://192.168.1.103:3000";
export const SOCKET_URL = "http://104.46.5.197:3000";
export const BASE_URL = "http://104.46.5.197:8080";

const axiosIns = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
})

export const login = (body) => {
    return axiosIns.post(`/api/login`, body);
}
export const fetchMessages = () => {
    return axiosIns.get(`/api/messages`);
}

export const fetchMessage = (msgId) => {
    return axiosIns.get(`/api/message/${msgId}`);
}

export const updateUserLocation = (body) => {
    return axiosIns.post(`/api/location/`, body);
}

export const updateImage = (body) => {
    return axiosIns.post(`/api/image/`, body);
}