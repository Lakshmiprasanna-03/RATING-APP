import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

const storeService = {
  async getStores(search = '', sortBy = 'name', sortOrder = 'ASC') {
    const response = await axios.get(
      `${API_URL}/stores?search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    );
    return response.data;
  },

  async getStore(id) {
    const response = await axios.get(`${API_URL}/stores/${id}`);
    return response.data;
  },

  async getMyStore() {
    const response = await axios.get(
      `${API_URL}/stores/my-store`,
      getAuthHeader()
    );
    return response.data;
  },

  async createStore(storeData) {
    const response = await axios.post(
      `${API_URL}/stores`,
      storeData,
      getAuthHeader()
    );
    return response.data;
  },

  async updateStore(id, storeData) {
    const response = await axios.put(
      `${API_URL}/stores/${id}`,
      storeData,
      getAuthHeader()
    );
    return response.data;
  },

  async deleteStore(id) {
    const response = await axios.delete(
      `${API_URL}/stores/${id}`,
      getAuthHeader()
    );
    return response.data;
  },

  async getStats() {
    const response = await axios.get(
      `${API_URL}/stores/stats`,
      getAuthHeader()
    );
    return response.data;
  },
};

export default storeService;
