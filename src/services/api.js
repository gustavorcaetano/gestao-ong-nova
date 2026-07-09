import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Aponta direto para o seu Node.js
});

export default api;