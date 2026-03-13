const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const api = {
  async uploadMaterial(file: File, userId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (userId) formData.append('user_id', userId);

    const response = await fetch(`${API_BASE_URL}/materials/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload material');
    }

    return response.json();
  },

  async getRoadmap(materialId: string, userId?: string) {
    const url = new URL(`${API_BASE_URL}/study/roadmap/${materialId}`);
    if (userId) url.searchParams.append('user_id', userId);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch roadmap');
    return response.json();
  },

  async generateQuiz(topicId: string, count: number = 5, difficulty: string = 'medium') {
    const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId, count, difficulty }),
    });

    if (!response.ok) throw new Error('Failed to generate quiz');
    return response.json();
  },

  async submitQuiz(quizId: string, userAnswers: number[], topicId: string, userId?: string) {
    const response = await fetch(`${API_BASE_URL}/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quiz_id: quizId,
        user_answers: userAnswers,
        topic_id: topicId,
        user_id: userId,
      }),
    });

    if (!response.ok) throw new Error('Failed to submit quiz');
    return response.json();
  },

  async gradeHandwritten(file: File, question: string, topic: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('question', question);
    formData.append('topic', topic);

    const response = await fetch(`${API_BASE_URL}/grader/handwritten`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to grade handwritten answer');
    }

    return response.json();
  },

  async chatWithTutor(message: string, context: string = '') {
    const response = await fetch(`${API_BASE_URL}/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok) throw new Error('Failed to chat with tutor');
    return response.json();
  },

  async updateMastery(topicId: string, quality: number, userId?: string) {
    const response = await fetch(`${API_BASE_URL}/study/update-mastery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_id: topicId, quality, user_id: userId }),
    });

    if (!response.ok) throw new Error('Failed to update mastery');
    return response.json();
  },
};
