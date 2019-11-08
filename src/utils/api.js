const BASE_URL = "http://192.168.1.105:8080";

export const login = (body) => {
    return fetch(`${BASE_URL}/api/login`, {
        headers: {
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(body)
    });
}
export const fetchMessages = () => {
    return fetch(`${BASE_URL}/api/messages`, {
        headers: {
            "Content-Type": "application/json"
        },
        method: "GET",
    });
}