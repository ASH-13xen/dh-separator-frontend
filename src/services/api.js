import axios from 'axios';

// 1. Remove the '/api' from the local fallback. 
// It should ONLY be the domain/port.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const uploadPdf = async (file, metadata) => {
  const formData = new FormData();
  formData.append('pdf', file);
  if (metadata?.topperName) formData.append('topper_name', metadata.topperName);
  if (metadata?.topperYear) formData.append('topper_year', metadata.topperYear);
  if (metadata?.topperRank) formData.append('topper_rank', metadata.topperRank);
  if (metadata?.topperMarks) formData.append('topper_marks', metadata.topperMarks);

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

export const updateQuestion = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/data/questions/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating question:", error);
    throw error.response?.data || { error: 'Failed to update question.' };
  }
};