import axios from "axios";

const API = axios.create({
  baseURL: "https://your-server.com/api", 
});

export default API;
