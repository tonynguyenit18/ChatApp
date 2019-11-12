import axios from "axios";
// const BASE_URL = "http://192.168.1.105:8080";
// export const SOCKET_URL = "http://192.168.1.105:3000";
export const SOCKET_URL = "http://104.46.5.197:3000";
export const BASE_URL = "http://104.46.5.197:8080";

const axiosIns = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
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