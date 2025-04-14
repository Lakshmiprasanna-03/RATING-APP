import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

const ratingService = {
  async submitRating(storeId, rating) {
    const response = await axios.post(
      `${API_URL}/ratings`,
      { storeId, rating },
      getAuthHeader()
    );
    return response.data;
  },

  async getUserRatings() {
    const response = await axios.get(
      `${API_URL}/ratings/my-ratings`,
      getAuthHeader()
    );
    return response.data;
  },

  async getStoreOwnerRatings() {
    const response = await axios.get(
      `${API_URL}/ratings/store-owner`,
      getAuthHeader()
    );
    return response.data;
  },
};

export default ratingService;
