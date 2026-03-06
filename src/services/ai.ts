import { GoogleGenAI, Type } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const aiService = {
  generateQuiz: async (topic: string, count: number = 5, difficulty: string = 'Medium') => {
    const model = genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a ${count}-question quiz about "${topic}" with a ${difficulty} difficulty level. Return it in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-3)" }
                },
                required: ["text", "options", "correctAnswer"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    const response = await model;
    return JSON.parse(response.text || "{}");
  },

  analyzeSubmissions: async (quizTitle: string, submissions: any[]) => {
    const prompt = `
      Analyze the following student submissions for the quiz "${quizTitle}".
      Rank the students based on a combination of accuracy and speed (lower time is better).
      Provide a summary of the top performers and any general insights about the class performance.
      
      Submissions:
      ${JSON.stringify(submissions.map(s => ({
        name: s.student_name,
        score: s.score,
        timeTaken: s.time_taken,
        accuracy: s.accuracy
      })))}
      
      Return the analysis in a clear, professional format.
    `;

    const model = genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const response = await model;
    return response.text;
  }
};
