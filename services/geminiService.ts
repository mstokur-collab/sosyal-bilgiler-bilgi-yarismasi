// @ts-nocheck
import { GoogleGenAI, Type } from "@google/genai";
import type { Difficulty, QuestionType } from "../types";
import { promptTemplates } from '../data/promptTemplates';

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        // Vercel, client-side (tarayıcı) kodunun ortam değişkenlerine erişebilmesi için
        // değişken adının 'VITE_' ile başlamasını gerektirir.
        const apiKey = process.env.VITE_API_KEY;
        if (!apiKey) {
            // This error will be caught by the calling function's try/catch block
            // and displayed in the UI, which is better than a blank screen crash.
            throw new Error("API Anahtarı bulunamadı. Lütfen Vercel projenizin ayarlarını kontrol edin.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

const model = 'gemini-2.5-flash';

const getQuestionSchema = (questionType: QuestionType) => {
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
        default:
            // Fallback for safety, though QuestionType should be one of the above.
            return { type: Type.OBJECT };
    }
};

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
    const client = getAiClient();
    const customPromptTemplate = promptTemplates[kazanımId];

    // Use custom template only if it exists and matches some conditions (e.g., quiz with image)
    if (customPromptTemplate && questionType === 'quiz' && questionCount === 1) {
        const response = await client.models.generateContent({
            model: model,
            contents: customPromptTemplate,
        });
        try {
            // The template is designed to return a single JSON object.
            const result = JSON.parse(response.text.trim());
            return [result];
        } catch (e) {
            console.error("Failed to parse Gemini response from custom template:", response.text);
            throw new Error("Yapay zekadan (özel şablon) geçersiz formatta bir yanıt alındı. Lütfen tekrar deneyin.");
        }
    }

    // Generic prompt generation
    const questionTypeName = {
        'quiz': 'Çoktan Seçmeli',
        'fill-in': 'Boşluk Doldurma',
        'matching': 'Eşleştirme'
    }[questionType];

    let context = `Sen ${grade}. sınıf ${subject} dersi için sorular hazırlayan uzman bir öğretmensin.`;
    if (generationContext === 'pdf-topic' && documentContent) {
        context += ` Aşağıda sana base64 formatında verilen döküman içeriğini ve bir konuyu referans alarak soru hazırla. Konu: "${kazanımText}".`;
    } else {
        context += ` Aşağıdaki kazanım için soru hazırla: "${kazanımId} - ${kazanımText}".`;
    }
    
    const paragraphSkills: Record<string, string> = {
        'main-idea': 'Ana Fikir / Konu',
        'supporting-idea': 'Yardımcı Fikir',
        'inference': 'Çıkarım Yapma',
        'vocabulary': 'Sözcük Anlamı',
        'author-purpose': 'Yazarın Amacı / Tutumu',
        'negative-question': 'Değinilmemiştir / Çıkarılamaz',
        'structure-completion': 'Paragraf Tamamlama',
        'structure-flow': 'Anlatım Akışını Bozan Cümle',
        'structure-division': 'Paragrafı İkiye Bölme'
    };
      
    let paragraphInstruction = '';
    if (subject === 'paragraph' && paragraphSkill) {
        paragraphInstruction = `Paragraf sorusu, özellikle şu beceriyi ölçmelidir: ${paragraphSkills[paragraphSkill] || paragraphSkill}. Paragraf ve soru metnini iki yeni satır (\\n\\n) ile ayır.`;
    }

    const imageInstruction = shouldGenerateImage && questionType === 'quiz'
        ? 'Soru, çözümü için bir görsele ihtiyaç duyuyorsa, bu görselin bir model tarafından üretilebilmesi için detaylı bir "visualPrompt" alanı oluştur. Görsel istemiyorsan bu alanı boş bırak.'
        : '';
        
    let qualityInstruction = '';
    if (questionType === 'quiz') {
        qualityInstruction = `
ÖNEMLİ KURAL: Çoktan seçmeli sorularda, doğru cevabın metin uzunluğu değişken olmalıdır. Bazen en kısa şık, bazen orta uzunlukta bir şık doğru cevap olsun. Doğru cevabın sürekli olarak diğer şıklardan daha uzun veya daha detaylı olmasından KESİNLİKLE KAÇIN. Çeldirici şıklar da mantıklı ve benzer uzunluklarda olmalıdır. Bu, sınavın kalitesi için kritiktir.
`;
    }

    const prompt = `
${context}
İstenenler:
- Zorluk Seviyesi: ${difficulty}
- Soru Tipi: ${questionTypeName}
- Soru Sayısı: ${questionCount}
${paragraphInstruction}
${imageInstruction}
${qualityInstruction}

Lütfen cevabını, istenen soru sayısı kadar eleman içeren bir JSON dizisi formatında ver. Her bir eleman, soru tipine uygun şemada olmalıdır.
Örneğin çoktan seçmeli için: { "question": "...", "options": ["A", "B", "C", "D"], "answer": "A", "explanation": "...", "visualPrompt": "..." }
Boşluk doldurma için: { "sentence": "...", "answer": "...", "distractors": ["...", "..."] }
Eşleştirme için: { "question": "...", "pairs": [{ "term": "...", "definition": "..." }] }
JSON çıktısı dışında başka hiçbir metin ekleme.
`;
    
    const parts = [];
    if (generationContext === 'pdf-topic' && documentContent) {
        parts.push({
            inlineData: {
                mimeType: documentContent.mimeType,
                data: documentContent.data
            }
        });
    }
    parts.push({ text: prompt });
    
    const responseSchema = {
        type: Type.ARRAY,
        items: getQuestionSchema(questionType)
    };

    const response = await client.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    const responseText = response.text.trim();
    try {
        const result = JSON.parse(responseText);
        return Array.isArray(result) ? result : [result];
    } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", responseText);
        throw new Error("Yapay zekadan geçersiz formatta bir yanıt alındı. Lütfen tekrar deneyin.");
    }
};

export const generateImageForQuestion = async (prompt: string): Promise<string | null> => {
    if (!prompt) return null;
    try {
        const client = getAiClient();
        const response = await client.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            }
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        return null;
    } catch (error) {
        console.error("Image generation failed:", error);
        return null;
    }
};

export const extractQuestionFromImage = async (image: { mimeType: string; data: string }): Promise<any[]> => {
    const client = getAiClient();
    const prompt = `
Bu görseldeki çoktan seçmeli soruyu analiz et. Soruyu, seçeneklerini, doğru cevabı ve cevabın kısa bir açıklamasını çıkar.
Cevabını aşağıdaki JSON formatında bir dizi olarak ver. Görselde birden fazla soru varsa, her biri için bir JSON nesnesi oluştur.

Örnek format:
[
  {
    "question": "Soru metni...",
    "options": ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D"],
    "answer": "Doğru olan seçenek metni",
    "explanation": "Cevabın kısa açıklaması..."
  }
]
`;
    
    const imagePart = {
        inlineData: {
            mimeType: image.mimeType,
            data: image.data,
        },
    };
    const textPart = {
        text: prompt
    };

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING }
            },
            required: ['question', 'options', 'answer']
        }
    };

    const response = await client.models.generateContent({
        model: model,
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });
    
    try {
        const result = JSON.parse(response.text.trim());
        return Array.isArray(result) ? result : [result];
    } catch (e) {
        console.error("Failed to parse Gemini response for image extraction:", response.text);
        throw new Error("Görselden soru çıkarılırken bir hata oluştu.");
    }
};

export const extractTopicsFromPDF = async (pdf: { mimeType: string; data: string }): Promise<string[]> => {
    const client = getAiClient();
    const prompt = `
Bu PDF dökümanının içeriğini analiz et ve içindeki ana konuları veya bölümleri başlıklar halinde listele. 
Bu başlıklar, daha sonra bu konulardan soru üretmek için kullanılacak. 
Cevabını, sadece konu başlıklarını içeren bir JSON dizisi (string array) formatında ver.
Örnek: ["Konu 1", "Bölüm 2: Alt Başlık", "Ünite 3'ün Özeti"]
`;
    
    const pdfPart = {
        inlineData: {
            mimeType: pdf.mimeType,
            data: pdf.data,
        },
    };
    const textPart = {
        text: prompt
    };
    
    const responseSchema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };
    
    const response = await client.models.generateContent({
        model: model,
        contents: { parts: [pdfPart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    try {
        const result = JSON.parse(response.text.trim());
        return Array.isArray(result) ? result : [];
    } catch (e) {
        console.error("Failed to parse Gemini response for topic extraction:", response.text);
        throw new Error("PDF'ten konu başlıkları çıkarılırken bir hata oluştu.");
    }
};

export const generateExamFromReference = async (document: { mimeType: string; data: string }): Promise<string> => {
    const client = getAiClient();
    const prompt = `
Sen deneyimli bir öğretmen ve sınav hazırlama uzmanısın.
Sana base64 formatında verilen referans sınav dökümanını (PDF veya düz metin olabilir) analiz et.
Bu referans dökümanın formatını, soru tiplerini, konu dağılımını ve zorluk seviyesini dikkate alarak, TAMAMEN YENİ VE ÖZGÜN SORULARLA benzer yapıda yeni bir sınav kağıdı hazırla.

İstenenler:
1.  **Başlık:** Sınava uygun bir başlık oluştur (Örn: "8. Sınıf Matematik Dersi 1. Dönem 2. Yazılı Sınavı").
2.  **Puanlama:** Her sorunun yanına parantez içinde puan değerini belirt (Örn: "(10 Puan)"). Toplam puan 100 olmalıdır.
3.  **Soru Tipleri:** Referans sınavdaki soru tiplerini (çoktan seçmeli, boşluk doldurma, doğru-yanlış, açık uçlu vb.) koru.
4.  **İçerik:** Sorular tamamen özgün olmalı, referans dökümandaki soruların kopyası OLMAMALIDIR. Ancak aynı konu ve kazanımları hedeflemelidir.
5.  **Format:** Cevabını temiz ve düzenli bir Markdown formatında oluştur. Başlıklar için '##', sorular için numaralandırma kullan.

Çıktın sadece Markdown metni olmalıdır.
`;
    
    const docPart = {
        inlineData: {
            mimeType: document.mimeType,
            data: document.data,
        },
    };
    const textPart = {
        text: prompt
    };

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [docPart, textPart] },
    });
    
    return response.text.trim();
};

export const generatePromptTemplateForKazanım = async (kazanımId: string, kazanımText: string): Promise<string> => {
    const client = getAiClient();
    const prompt = `
Sen, Gemini gibi üretken yapay zeka modelleri için "prompt mühendisi" olarak çalışan bir uzmansın.
Görevin, sana verilen bir eğitim kazanımı için, yapay zekanın görsel destekli ve yüksek kaliteli sorular üretmesini sağlayacak bir "prompt şablonu" oluşturmak.

Oluşturacağın şablonun özellikleri:
1.  **Rol Tanımı:** Yapay zekaya bir rol vermelisin (örn: "Sen bir 8. sınıf ... öğretmeni ve soru yazma uzmanısın.").
2.  **Amaç:** Yapay zekanın amacını net bir şekilde belirtmelisin (örn: "Amacın, hem metin hem de görsel içeren, görselin sorunun bir parçası olduğu özgün sorular üretmek.").
3.  **Örnek JSON:** Yapay zekanın üreteceği çıktının formatını gösteren, elle yazılmış, yüksek kaliteli ve o kazanıma uygun bir örnek JSON nesnesi içermelidir. Bu örnek şunları içermeli:
    -   \`kazanımId\`: "${kazanımId}"
    -   \`question\`: Örnek bir soru metni.
    -   \`options\`: Örnek seçenekler.
    -   \`answer\`: Örnek doğru cevap.
    -   \`explanation\`: Örnek cevap açıklaması.
    -   \`visualPrompt\`: Soruyu destekleyen, bir resim üretme modelinin (örn: DALL-E) anlayabileceği, detaylı ve sanatsal yönü olan bir görsel tarif. Bu tarif, sorunun çözümü için gerekli bir ipucu veya veri içermeli.
4.  **Talimat:** Örnekten sonra, yapay zekaya, bu örneğe benzer yapıda, aynı kazanım için, farklı bir senaryo kullanarak YENİ ve ÖZGÜN bir soru daha üretmesi talimatını vermelisin.

Aşağıdaki kazanım için bu prompt şablonunu oluştur:
-   **Kazanım ID:** ${kazanımId}
-   **Kazanım Metni:** ${kazanımText}

Çıktın, doğrudan bir JavaScript/TypeScript dosyasındaki "promptTemplates" nesnesine eklenebilecek formatta olmalı. Yani, bir anahtar-değer çifti şeklinde olmalı: \`'${kazanımId}': \`...\`\`. Şablon metni, backtick (\`) karakterleri içinde yer almalı.
`;

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text.trim();
};