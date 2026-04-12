import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const uploadPdf = async (file, metadata) => {
  const formData = new FormData();
  formData.append('pdf', file);
  if (metadata?.topperName) formData.append('topper_name', metadata.topperName);
  if (metadata?.topperYear) formData.append('topper_year', metadata.topperYear);
  if (metadata?.topperRank) formData.append('topper_rank', metadata.topperRank);
  if (metadata?.topperMarks) formData.append('topper_marks', metadata.topperMarks);

  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
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
    const response = await axios.get(`${API_BASE_URL}/data/questions`);
    return response.data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error.response?.data || { error: 'Failed to retrieve questions from server.' };
  }
};
