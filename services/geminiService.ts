// @ts-nocheck
import type { Difficulty, QuestionType } from "../types";

/**
 * A helper function to call our secure Vercel Serverless Function which acts as a proxy.
 * This prevents the API key from ever being exposed to the client's browser.
 * @param action The specific Gemini API function to call on the backend.
 * @param params The parameters for that function.
 * @returns The result from the Gemini API.
 */
async function callProxy(action: string, params: any): Promise<any> {
    try {
        const response = await fetch('/api/gemini-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, params }),
        });

        const data = await response.json();

        if (!response.ok) {
            // The error message from the serverless function is passed through.
            throw new Error(data.error || 'Proxy API isteği başarısız oldu.');
        }

        return data.result;
    } catch (error) {
        console.error(`Proxy call failed for action "${action}":`, error);
        // Re-throw the error so the UI can catch it and display a message to the user.
        throw error;
    }
}


export const generateQuestionWithAI = async (
    grade: number,
    kazanımId: string,
    kazanımText: string,
    difficulty: Difficulty,
    questionType: QuestionType,
    questionCount: number,
    subject: string,
    paragraphSkill: string,
    shouldGenerateImage: boolean,
    documentContent?: { mimeType: string; data: string },
    generationContext?: 'default' | 'pdf-topic'
): Promise<any[]> => {
    return callProxy('generateQuestionWithAI', {
        grade,
        kazanımId,
        kazanımText,
        difficulty,
        questionType,
        questionCount,
        subject,
        paragraphSkill,
        shouldGenerateImage,
        documentContent,
        generationContext
    });
};

export const generateImageForQuestion = async (prompt: string): Promise<string | null> => {
    return callProxy('generateImageForQuestion', { prompt });
};

export const extractQuestionFromImage = async (image: { mimeType: string; data: string }): Promise<any[]> => {
    return callProxy('extractQuestionFromImage', { image });
};

export const extractTopicsFromPDF = async (pdf: { mimeType: string; data: string }): Promise<string[]> => {
    return callProxy('extractTopicsFromPDF', { pdf });
};

export const generateExamFromReference = async (document: { mimeType: string; data: string }): Promise<string> => {
    return callProxy('generateExamFromReference', { document });
};

export const generatePromptTemplateForKazanım = async (kazanımId: string, kazanımText: string): Promise<string> => {
    return callProxy('generatePromptTemplateForKazanım', { kazanımId, kazanımText });
};
