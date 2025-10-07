// @ts-nocheck
// This is a Vercel Serverless Function that acts as a secure proxy for Gemini API calls.
// The client (browser) will call this endpoint instead of Google's API directly.
// This function runs on the server, so it can safely access environment variables like API_KEY.

import { GoogleGenAI, Type } from "@google/genai";
import { promptTemplates } from '../data/promptTemplates';

// Helper function to get the AI client, initializing it only once.
// It safely reads the API_KEY from Vercel's environment variables on the server.
let ai;
const getAiClient = () => {
    if (!ai) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY is not defined in Vercel environment variables.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

// Main handler for all incoming requests to /api/gemini-proxy
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, params } = request.body;
        const client = getAiClient();
        let result;
        
        // Use a switch to handle different actions requested by the client
        switch (action) {
            case 'generateQuestionWithAI':
                result = await handleGenerateQuestion(client, params);
                break;
            case 'generateImageForQuestion':
                result = await handleGenerateImage(client, params);
                break;
            case 'extractQuestionFromImage':
                result = await handleExtractQuestionFromImage(client, params);
                break;
            case 'extractTopicsFromPDF':
                result = await handleExtractTopicsFromPDF(client, params);
                break;
            case 'generateExamFromReference':
                result = await handleGenerateExam(client, params);
                break;
            case 'generatePromptTemplateForKazanım':
                result = await handleGeneratePromptTemplate(client, params);
                break;
            default:
                return response.status(400).json({ error: `Unknown action: ${action}` });
        }

        return response.status(200).json({ result });

    } catch (error) {
        console.error("Error in gemini-proxy:", error);
        return response.status(500).json({ error: error.message || "An internal server error occurred." });
    }
}


// --- Action Handlers ---
// These functions contain the logic previously in geminiService.ts, now running securely on the server.

const model = 'gemini-2.5-flash';

const getQuestionSchema = (questionType) => {
    switch (questionType) {
        case 'quiz':
            return {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    visualPrompt: { type: Type.STRING, description: "If a visual is needed, a detailed prompt for an image generation model. Otherwise, empty string." }
                },
                required: ['question', 'options', 'answer']
            };
        case 'fill-in':
            return {
                type: Type.OBJECT,
                properties: {
                    sentence: { type: Type.STRING, description: "The sentence with '___' for the blank." },
                    answer: { type: Type.STRING },
                    distractors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of incorrect options." }
                },
                required: ['sentence', 'answer', 'distractors']
            };
        case 'matching':
            return {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "Optional instruction for the matching question." },
                    pairs: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                term: { type: Type.STRING },
                                definition: { type: Type.STRING }
                            },
                            required: ['term', 'definition']
                        }
                    }
                },
                required: ['pairs']
            };
        default: return { type: Type.OBJECT };
    }
};

async function handleGenerateQuestion(client, params) {
    const { grade, kazanımId, kazanımText, difficulty, questionType, questionCount, subject, paragraphSkill, shouldGenerateImage, documentContent, generationContext } = params;
    
    const customPromptTemplate = promptTemplates[kazanımId];
    if (customPromptTemplate && questionType === 'quiz' && questionCount === 1) {
        const response = await client.models.generateContent({ model, contents: customPromptTemplate });
        const result = JSON.parse(response.text.trim());
        return [result];
    }

    const questionTypeName = { 'quiz': 'Çoktan Seçmeli', 'fill-in': 'Boşluk Doldurma', 'matching': 'Eşleştirme' }[questionType];
    let context = `Sen ${grade}. sınıf ${subject} dersi için sorular hazırlayan uzman bir öğretmensin.`;
    if (generationContext === 'pdf-topic' && documentContent) {
        context += ` Aşağıda sana base64 formatında verilen döküman içeriğini ve bir konuyu referans alarak soru hazırla. Konu: "${kazanımText}".`;
    } else {
        context += ` Aşağıdaki kazanım için soru hazırla: "${kazanımId} - ${kazanımText}".`;
    }
    const paragraphSkills = {
        'main-idea': 'Ana Fikir / Konu', 'supporting-idea': 'Yardımcı Fikir', 'inference': 'Çıkarım Yapma', 'vocabulary': 'Sözcük Anlamı',
        'author-purpose': 'Yazarın Amacı / Tutumu', 'negative-question': 'Değinilmemiştir / Çıkarılamaz', 'structure-completion': 'Paragraf Tamamlama',
        'structure-flow': 'Anlatım Akışını Bozan Cümle', 'structure-division': 'Paragrafı İkiye Bölme'
    };
    let paragraphInstruction = subject === 'paragraph' && paragraphSkill ? `Paragraf sorusu, özellikle şu beceriyi ölçmelidir: ${paragraphSkills[paragraphSkill] || paragraphSkill}. Paragraf ve soru metnini iki yeni satır (\\n\\n) ile ayır.` : '';
    const imageInstruction = shouldGenerateImage && questionType === 'quiz' ? 'Soru, çözümü için bir görsele ihtiyaç duyuyorsa, bu görselin bir model tarafından üretilebilmesi için detaylı bir "visualPrompt" alanı oluştur. Görsel istemiyorsan bu alanı boş bırak.' : '';
    let qualityInstruction = questionType === 'quiz' ? `
ÖNEMLİ KURAL: Çoktan seçmeli sorularda, doğru cevabın metin uzunluğu değişken olmalıdır. Bazen en kısa şık, bazen orta uzunlukta bir şık doğru cevap olsun. Doğru cevabın sürekli olarak diğer şıklardan daha uzun veya daha detaylı olmasından KESİNLİKLE KAÇIN. Çeldirici şıklar da mantıklı ve benzer uzunluklarda olmalıdır. Bu, sınavın kalitesi için kritiktir.` : '';
    const prompt = `${context}\nİstenenler:\n- Zorluk Seviyesi: ${difficulty}\n- Soru Tipi: ${questionTypeName}\n- Soru Sayısı: ${questionCount}\n${paragraphInstruction}\n${imageInstruction}\n${qualityInstruction}\n\nLütfen cevabını, istenen soru sayısı kadar eleman içeren bir JSON dizisi formatında ver. Her bir eleman, soru tipine uygun şemada olmalıdır.\nÖrneğin çoktan seçmeli için: { "question": "...", "options": ["A", "B", "C", "D"], "answer": "A", "explanation": "...", "visualPrompt": "..." }\nBoşluk doldurma için: { "sentence": "...", "answer": "...", "distractors": ["...", "..."] }\nEşleştirme için: { "question": "...", "pairs": [{ "term": "...", "definition": "..." }] }\nJSON çıktısı dışında başka hiçbir metin ekleme.`;
    
    const parts = [];
    if (generationContext === 'pdf-topic' && documentContent) {
        parts.push({ inlineData: { mimeType: documentContent.mimeType, data: documentContent.data } });
    }
    parts.push({ text: prompt });
    
    const response = await client.models.generateContent({
        model,
        contents: { parts },
        config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: getQuestionSchema(questionType) } }
    });
    const result = JSON.parse(response.text.trim());
    return Array.isArray(result) ? result : [result];
}

async function handleGenerateImage(client, params) {
    const { prompt } = params;
    if (!prompt) return null;
    const response = await client.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' }
    });
    return (response.generatedImages && response.generatedImages.length > 0) ? response.generatedImages[0].image.imageBytes : null;
}

async function handleExtractQuestionFromImage(client, params) {
    const { image } = params;
    const prompt = `Bu görseldeki çoktan seçmeli soruyu analiz et. Soruyu, seçeneklerini, doğru cevabı ve cevabın kısa bir açıklamasını çıkar. Cevabını aşağıdaki JSON formatında bir dizi olarak ver. Görselde birden fazla soru varsa, her biri için bir JSON nesnesi oluştur.\n\nÖrnek format:\n[\n  { "question": "...", "options": ["A", "B", "C", "D"], "answer": "...", "explanation": "..." }\n]`;
    const responseSchema = {
        type: Type.ARRAY,
        items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ['question', 'options', 'answer'] }
    };
    const response = await client.models.generateContent({
        model,
        contents: { parts: [{ inlineData: { mimeType: image.mimeType, data: image.data } }, { text: prompt }] },
        config: { responseMimeType: "application/json", responseSchema }
    });
    const result = JSON.parse(response.text.trim());
    return Array.isArray(result) ? result : [result];
}

async function handleExtractTopicsFromPDF(client, params) {
    const { pdf } = params;
    const prompt = `Bu PDF dökümanının içeriğini analiz et ve içindeki ana konuları veya bölümleri başlıklar halinde listele. Bu başlıklar, daha sonra bu konulardan soru üretmek için kullanılacak. Cevabını, sadece konu başlıklarını içeren bir JSON dizisi (string array) formatında ver.\nÖrnek: ["Konu 1", "Bölüm 2: Alt Başlık", "Ünite 3'ün Özeti"]`;
    const responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
    const response = await client.models.generateContent({
        model,
        contents: { parts: [{ inlineData: { mimeType: pdf.mimeType, data: pdf.data } }, { text: prompt }] },
        config: { responseMimeType: "application/json", responseSchema }
    });
    const result = JSON.parse(response.text.trim());
    return Array.isArray(result) ? result : [];
}

async function handleGenerateExam(client, params) {
    const { document } = params;
    const prompt = `Sen deneyimli bir öğretmen ve sınav hazırlama uzmanısın. Sana base64 formatında verilen referans sınav dökümanını (PDF veya düz metin olabilir) analiz et. Bu referans dökümanın formatını, soru tiplerini, konu dağılımını ve zorluk seviyesini dikkate alarak, TAMAMEN YENİ VE ÖZGÜN SORULARLA benzer yapıda yeni bir sınav kağıdı hazırla.\n\nİstenenler:\n1.  **Başlık:** Sınava uygun bir başlık oluştur (Örn: "8. Sınıf Matematik Dersi 1. Dönem 2. Yazılı Sınavı").\n2.  **Puanlama:** Her sorunun yanına parantez içinde puan değerini belirt (Örn: "(10 Puan)"). Toplam puan 100 olmalıdır.\n3.  **Soru Tipleri:** Referans sınavdaki soru tiplerini (çoktan seçmeli, boşluk doldurma, doğru-yanlış, açık uçlu vb.) koru.\n4.  **İçerik:** Sorular tamamen özgün olmalı, referans dökümandaki soruların kopyası OLMAMALIDIR. Ancak aynı konu ve kazanımları hedeflemelidir.\n5.  **Format:** Cevabını temiz ve düzenli bir Markdown formatında oluştur. Başlıklar için '##', sorular için numaralandırma kullan.\n\nÇıktın sadece Markdown metni olmalıdır.`;
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ inlineData: { mimeType: document.mimeType, data: document.data } }, { text: prompt }] },
    });
    return response.text.trim();
}

async function handleGeneratePromptTemplate(client, params) {
    const { kazanımId, kazanımText } = params;
    const prompt = `Sen, Gemini gibi üretken yapay zeka modelleri için "prompt mühendisi" olarak çalışan bir uzmansın. Görevin, sana verilen bir eğitim kazanımı için, yapay zekanın görsel destekli ve yüksek kaliteli sorular üretmesini sağlayacak bir "prompt şablonu" oluşturmak.\n\nOluşturacağın şablonun özellikleri:\n1.  **Rol Tanımı:** Yapay zekaya bir rol vermelisin (örn: "Sen bir 8. sınıf ... öğretmeni ve soru yazma uzmanısın.").\n2.  **Amaç:** Yapay zekanın amacını net bir şekilde belirtmelisin (örn: "Amacın, hem metin hem de görsel içeren, görselin sorunun bir parçası olduğu özgün sorular üretmek.").\n3.  **Örnek JSON:** Yapay zekanın üreteceği çıktının formatını gösteren, elle yazılmış, yüksek kaliteli ve o kazanıma uygun bir örnek JSON nesnesi içermelidir. Bu örnek şunları içermeli:\n    -   \`kazanımId\`: "${kazanımId}"\n    -   \`question\`: Örnek bir soru metni.\n    -   \`options\`: Örnek seçenekler.\n    -   \`answer\`: Örnek doğru cevap.\n    -   \`explanation\`: Örnek cevap açıklaması.\n    -   \`visualPrompt\`: Soruyu destekleyen, bir resim üretme modelinin (örn: DALL-E) anlayabileceği, detaylı ve sanatsal yönü olan bir görsel tarif. Bu tarif, sorunun çözümü için gerekli bir ipucu veya veri içermeli.\n4.  **Talimat:** Örnekten sonra, yapay zekaya, bu örneğe benzer yapıda, aynı kazanım için, farklı bir senaryo kullanarak YENİ ve ÖZGÜN bir soru daha üretmesi talimatını vermelisin.\n\nAşağıdaki kazanım için bu prompt şablonunu oluştur:\n-   **Kazanım ID:** ${kazanımId}\n-   **Kazanım Metni:** ${kazanımText}\n\nÇıktın, doğrudan bir JavaScript/TypeScript dosyasındaki "promptTemplates" nesnesine eklenebilecek formatta olmalı. Yani, bir anahtar-değer çifti şeklinde olmalı: \`'${kazanımId}': \`...\`\`. Şablon metni, backtick (\`) karakterleri içinde yer almalı.`;
    const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim();
}
