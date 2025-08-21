import axios from "axios";
import SummaryApi from "./SummaryApi";

const api = axios.create({
  baseURL: SummaryApi?.BASE_URL || "", // তোমার BASE URL থাকলে সেট করো
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // এখানে global toast/map করা যায় চাইলে
    return Promise.reject(err);
  }
);

export default api;
