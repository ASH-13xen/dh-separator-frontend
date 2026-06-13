import axios from 'axios';

// 1. Remove the '/api' from the local fallback. 
// It should ONLY be the domain/port.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const uploadPdf = async (file, metadataList) => {
  const formData = new FormData();
  formData.append('pdf', file);
  if (metadataList && Array.isArray(metadataList)) {
    formData.append('metadataList', JSON.stringify(metadataList));
  }

  try {
    // 2. Explicitly add '/api/upload' here
    const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading PDF:", error);
    throw error.response?.data || { error: 'An unexpected error occurred during upload.' };
  }
};

export const uploadManualQuestion = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/upload/manual`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error manual uploading PDF:", error);
    throw error.response?.data || { error: 'An unexpected error occurred during manual upload.' };
  }
};

export const fetchQuestions = async () => {
  try {
    // 3. This one stays exactly the same as you had it
    const response = await axios.get(`${API_BASE_URL}/api/data/questions`);
    return response.data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error.response?.data || { error: 'Failed to retrieve questions from server.' };
  }
};

export const fetchTags = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/data/tags`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error.response?.data || { error: 'Failed to retrieve tags from server.' };
  }
};

export const fetchHierarchy = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/data/hierarchy`);
    return response.data;
  } catch (error) {
    console.error("Error fetching hierarchy:", error);
    throw error.response?.data || { error: 'Failed to retrieve hierarchy from server.' };
  }
};

export const updateQuestion = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/data/questions/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating question:", error);
    throw error.response?.data || { error: 'Failed to update question.' };
  }
};

export const updateToppers = async (updates) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/upload/update-toppers`, { updates });
    return response.data;
  } catch (error) {
    console.error("Error updating toppers:", error);
    throw error.response?.data || { error: 'Failed to update toppers.' };
  }
};

export const addCustomTag = async (tagData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/data/hierarchy/custom`, tagData);
    return response.data;
  } catch (error) {
    console.error("Error adding custom tag:", error);
    throw error.response?.data || { error: 'Failed to add custom tag.' };
  }
};

export const processQuesPdf = async (file, startPage, endPage, chunkSize) => {
  const formData = new FormData();
  formData.append('pdf', file);
  if (startPage) formData.append('startPage', startPage);
  if (endPage) formData.append('endPage', endPage);
  if (chunkSize) formData.append('chunkSize', chunkSize);
  try {
    const response = await axios.post(`${API_BASE_URL}/api/quespdf/process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error processing QuesPDF:", error);
    throw error.response?.data || { error: 'An unexpected error occurred during QuesPDF processing.' };
  }
};

export const fetchQuesPdfHistory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/quespdf/history`);
    return response.data;
  } catch (error) {
    console.error("Error fetching QuesPDF history:", error);
    throw error.response?.data || { error: 'Failed to retrieve QuesPDF history.' };
  }
};

export const updateQuesPdf = async (id, questions) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/quespdf/${id}`, { questions });
    return response.data;
  } catch (error) {
    console.error("Error updating QuesPDF record:", error);
    throw error.response?.data || { error: 'Failed to update QuesPDF record.' };
  }
};

export const deleteQuesPdf = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/quespdf/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting QuesPDF record:", error);
    throw error.response?.data || { error: 'Failed to delete QuesPDF record.' };
  }
};

export const processReorderPdf = async (file) => {
  const formData = new FormData();
  formData.append('pdf', file);
  try {
    const response = await axios.post(`${API_BASE_URL}/api/reorder/process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error processing PDF for reorder:", error);
    throw error.response?.data || { error: 'An unexpected error occurred during PDF processing.' };
  }
};

export const fetchReorderHistory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/reorder/history`);
    return response.data;
  } catch (error) {
    console.error("Error fetching reorder history:", error);
    throw error.response?.data || { error: 'Failed to retrieve reorder history.' };
  }
};

export const fetchReorderRecord = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/reorder/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching reorder record:", error);
    throw error.response?.data || { error: 'Failed to retrieve reorder record.' };
  }
};

export const updateReorderRecord = async (id, chunks) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/reorder/${id}`, { chunks });
    return response.data;
  } catch (error) {
    console.error("Error updating reorder record:", error);
    throw error.response?.data || { error: 'Failed to update record.' };
  }
};

export const compileReorderPdf = async (id, subject) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/reorder/${id}/compile`, { subject });
    return response.data;
  } catch (error) {
    console.error("Error compiling PDF:", error);
    throw error.response?.data || { error: 'Failed to compile reordered PDF.' };
  }
};

export const deleteReorderRecord = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/reorder/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting reorder record:", error);
    throw error.response?.data || { error: 'Failed to delete record.' };
  }
};