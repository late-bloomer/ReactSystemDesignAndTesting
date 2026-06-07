import axios from "axios";

export const axiosBasedQuery = ({ baseUrl } = { baseUrl: "" }) => {
  return async ({ url, method, data, params }) => {
    try {
      const result = await axios({
        url: baseUrl + url,
        method,
        data, // request body for POST/PUT/PATCH
        params, //  query string params (e.g. ?search=foo)
      });
      return { data: result.data };
    } catch (err) {
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };
};
