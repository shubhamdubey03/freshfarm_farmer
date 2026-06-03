import { getToken } from "../utils/tokenstorage";
import axios from "axios"
export const apiFunction = async (
    api,
    params = [],
    data = {},
    type = "get",
    withAuth = false
) => {
    try {
        const url = `${api}${params.length ? "/" + params.join("/") : ""}`;
        console.log("kkk", url)

        const config = {};

        if (withAuth) {
            const token = await getToken();
            if (token) {
                config.headers = {
                    Authorization: `Bearer ${token}`,
                };
            }
        }

        let response;

        switch (type.toLowerCase()) {
            case "get":
                response = await axios.get(url, config);
                break;

            case "post":
                if (data instanceof FormData) {
                    console.log("form data", data)
                    const fetchResponse = await fetch(url, {
                        method: 'POST',
                        headers: {
                            ...config.headers,
                            // Content-Type mat daalo — browser khud set karega boundary ke saath
                        },
                        body: data,
                    });
                    const json = await fetchResponse.json();
                    response = { data: json, status: fetchResponse.status };
                } else {
                    response = await axios.post(url, data, config);
                }
                break;

            case "patch":
                console.log("patching data", data)
                console.log("patching config", config)
                if (data instanceof FormData) {
                    const fetchResponse = await fetch(url, {
                        method: 'PATCH',
                        headers: {
                            ...config.headers,
                        },
                        body: data,
                    });
                    const json = await fetchResponse.json();
                    response = { data: json, status: fetchResponse.status };
                } else {
                    response = await axios.patch(url, data, config);
                }
                break;

            case "delete":
                response = await axios.delete(url, config);
                break;

            default:
                throw new Error("Invalid request type");
        }

        return response;
    } catch (error) {
        console.log("FULL ERROR:", error);
        const errorData = error.response?.data || { error: error.message || "Network Error" };
        console.error("API Error:", errorData);
        return errorData;
    }
};