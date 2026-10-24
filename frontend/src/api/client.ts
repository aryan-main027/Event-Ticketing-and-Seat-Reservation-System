import axios from "axios";

const client = axios.create({
  baseURL : import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers : { "X-Requested-With": "XMLHttpRequest" }
});

export default client;