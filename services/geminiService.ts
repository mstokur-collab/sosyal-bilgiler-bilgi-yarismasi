import { GoogleGenAI, Type } from "@google/genai";
import type { Difficulty, Question, QuestionType, QuizQuestion } from '../types';

/**
 * Initializes and returns the GoogleGenAI client.
 * The API key is sourced exclusively and securely from the `process.env.API_KEY` environment variable.
 * @returns An initialized GoogleGenAI client.
 * @throws An error if the API key is not configured in the environment.
 */
const getAiClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    // This user-friendly error will be caught and displayed to the user.
    throw new Error(`Gemini API anahtarı bulunamadı. Lütfen uygulamanın ortam değişkenlerinde (environment variables) API_KEY'in ayarlandığından emin olun.`);
  }
  return new GoogleGenAI({ apiKey });
};


const getQuizSchema = () => ({
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING, description: "Sorunun metni." },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Dört seçenek. Doğru cevap da bu listede olmalı."
    },
    answer: { type: Type.STRING, description: "Doğru cevap. Seçeneklerden biriyle tam olarak eşleşmelidir." },
    explanation: { type: Type.STRING, description: "Doğru cevabın neden doğru olduğunu kısaca ve anlaşılır bir şekilde açıklayan metin." }
  },
  required: ["question", "options", "answer", "explanation"]
});

const getFillInSchema = () => ({
  type: Type.OBJECT,
  properties: {
    sentence: { type: Type.STRING, description: "Boşluğun '___' ile belirtildiği cümle." },
    answer: { type: Type.STRING, description: "Boşluğa gelecek doğru kelime veya kelime grubu." },
    distractors: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2 veya 3 adet yanlış, çeldirici kelime."
    }
  },
  required: ["sentence", "answer", "distractors"]
});

const getMatchingSchema = () => ({
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING, description: "Eşleştirme için genel bir başlık veya soru. Örneğin: 'Olayları ve tarihleri eşleştirin.'" },
    pairs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING, description: "Eşleştirilecek ilk öğe." },
          definition: { type: Type.STRING, description: "Eşleştirilecek ikinci öğe." }
        },
        required: ["term", "definition"]
      },
      description: "3 ila 5 adet eşleştirme çifti."
    }
  },
  required: ["question", "pairs"]
});

const typeToSchemaMap: Record<QuestionType, () => { properties: Record<string, any>; required: string[] }> = {
  'quiz': getQuizSchema,
  'fill-in': getFillInSchema,
  'matching': getMatchingSchema,
};

export const generateQuestionWithAI = async (
  grade: number,
  kazanımId: string,
  kazanımText: string,
  difficulty: Difficulty,
  type: QuestionType,
  count: number,
  subjectId: string,
  imageData?: { mimeType: string; data: string }
): Promise<Omit<Question, 'id' | 'grade' | 'topic' | 'difficulty' | 'type'>[]> => {
  const aiClient = getAiClient();
  
  const getEnglishPrompt = () => `
    You are an expert curriculum designer and English language teacher for young learners (grades 5-8, CEFR A1-A2 level).
    Your task is to generate ${count} quiz questions in ENGLISH based on the following Turkish curriculum outcome.

    - Grade Level: ${grade}
    - Learning Outcome ID: ${kazanımId}
    - Learning Outcome Text (in Turkish): "${kazanımText}"
    - Difficulty: ${difficulty}
    - Question Type: ${type}
    
    CRITICAL INSTRUCTIONS:
    1.  LANGUAGE: The entire output, including questions, options, and answers, MUST be in ENGLISH.
    2.  CURRICULUM ANALYSIS: The Learning Outcome ID "${kazanımId}" is structured as E<Grade>.<Unit>.<Skill><Number>. The skill is crucial.
        - If the skill is 'L' (Listening) or 'R' (Reading), you MUST first generate a short, simple English text, dialogue, or scenario (max 50 words) relevant to the outcome. Then, create the quiz question(s) based on that text. For example, a reading passage followed by a multiple-choice question about it.
        - If the skill is 'S' (Speaking) or 'W' (Writing), generate a prompt-style question that encourages a response. For example, "Which sentence is the correct way to ask for permission?" or a fill-in-the-blank question testing grammar/vocabulary.
    3.  VISUAL CONTEXT (if provided): If an image is uploaded, the question MUST be directly related to the image. Use phrases like "Look at the picture. What is the boy doing?" or "Based on the image, where is the cat?".
    4.  AGE APPROPRIATENESS: Keep the language simple, clear, and engaging for young learners (ages 10-14). Avoid complex grammar and vocabulary unless it is the direct subject of the learning outcome.
    5.  VARY OPTION LENGTH: To prevent students from guessing based on length, the word count of the correct answer and the distractors must be varied. The correct answer should not consistently be the longest or shortest option. Make all options plausible and of similar complexity.
    6.  EXPLANATION: For each question, generate a brief and clear 'explanation' text explaining why the correct answer is correct. This should help the learner understand the concept better.
    7.  RESPONSE FORMAT: The final output MUST be ONLY a valid JSON array of question objects matching the requested schema. Do not add any extra text, explanations, or introductory sentences.
  `;

  const getTurkishPrompt = (isImage: boolean) => {
    const imagePromptPart = `
    - Önemli: Soru, doğrudan yüklenen görselle ilgili olmalı, görseldeki bir unsuru sormalı veya görseli bir kanıt/ipucu olarak kullandırmalıdır.`;
    
    return `
    Lütfen aşağıdaki kriterlere${isImage ? ' ve sağlanan görsele' : ''} uygun ${count} adet bilgi yarışması sorusu oluştur:
    - Sınıf Seviyesi: ${grade}. sınıf
    - Kazanım ID: ${kazanımId}
    - Kazanım Metni: ${kazanımText}
    - Zorluk: ${difficulty}
    - Soru Tipi: ${type}
    ${isImage ? imagePromptPart : ''}
    
    KRİTİK TALİMATLAR:
    1.  UYGUNLUK: Soru, belirtilen kazanım ID'si ve metnine tam olarak uygun olmalı ve bu kazanımı ölçmelidir.
    2.  ŞIK UZUNLUĞU: Öğrencilerin sadece metin uzunluğuna bakarak doğru cevabı tahmin etmesini engellemek için, doğru cevabın ve çeldirici seçeneklerin kelime sayılarını/uzunluklarını değişken tut. Doğru cevap bazen en kısa, bazen en uzun, bazen de ortalama uzunlukta olmalıdır. Tüm seçenekler inandırıcı ve benzer karmaşıklıkta olmalıdır.
    3.  AÇIKLAMA: Her çoktan seçmeli soru için, doğru cevabın neden doğru olduğunu açıklayan, kısa ve anlaşılır bir 'explanation' metni oluştur. Bu açıklama, öğrencinin konuyu daha iyi anlamasına yardımcı olmalıdır.
    4.  JSON FORMATI: Yanıtın her zaman bir JSON dizisi (array) formatında olmalıdır. Sadece ve sadece istenen JSON formatında bir yanıt ver. Açıklama veya giriş metni ekleme.
  `;
  };

  let prompt;
  if (subjectId === 'english') {
      prompt = getEnglishPrompt();
  } else {
      prompt = getTurkishPrompt(!!imageData);
  }
  
  // FIX: Standardize the `contents` structure to always use the `parts` array.
  // This prevents an SDK inconsistency that causes a misleading "Unsupported MIME type" error
  // when mixing string and object types for the `contents` parameter.
  // FIX: Explicitly type the `parts` array to allow both text and inlineData objects,
  // resolving a TypeScript error where `inlineData` was not a known property.
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: prompt }];
  if (imageData) {
    parts.unshift({ inlineData: { mimeType: imageData.mimeType, data: imageData.data } });
  }
  const contents = { parts };


  const schemaGenerator = typeToSchemaMap[type];
  const typeSchema = schemaGenerator();

  const singleQuestionSchema = {
    type: Type.OBJECT,
    properties: {
      ...typeSchema.properties,
    },
    required: [...typeSchema.required]
  };

  const responseSchema = {
    type: Type.ARRAY,
    items: singleQuestionSchema,
  };

  const response = await aiClient.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    },
  });

  const jsonText = response.text.trim();
  const generatedData = JSON.parse(jsonText);
  
  if (Array.isArray(generatedData)) {
      return generatedData;
  } else if (typeof generatedData === 'object' && generatedData !== null) {
      return [generatedData]; // Wrap single object in array for consistency
  } else {
      throw new Error("AI did not return a valid JSON array of questions.");
  }
};

export const extractQuestionFromImage = async (
    imageData: { mimeType: string; data: string },
    subjectId: string
): Promise<(Omit<QuizQuestion, 'id' | 'grade' | 'topic' | 'type' | 'kazanımId' | 'imageUrl'> & { visualContext?: { x: number; y: number; width: number; height: number; } })[]> => {
    const aiClient = getAiClient();

    const promptText = `
        Sen eğitim materyalleri için uzman bir OCR (Optik Karakter Tanıma) ve analiz aracısın.
        Sağlanan görseli analiz et. Bu görsel, üzerinde doğru cevapları bir şekilde işaretlenmiş (örneğin daire içine alınmış, üzeri çizilmiş, tik atılmış vb.) birden fazla çoktan seçmeli soru içerebilir.
        
        Görevin şunlardır:
        1.  Görseldeki TÜM soruları tespit et.
        2.  Her bir soru için, ana soru metnini tam olarak çıkar.
        3.  Her bir soru için, tüm seçenekleri (A, B, C, D gibi şık etiketleri olmadan) bir metin dizisi olarak çıkar.
        4.  Her bir soru için, görselde işaretlenmiş olan doğru cevabı tespit et.
        5.  Tespit ettiğin doğru cevabın metninin, ilgili sorunun seçenekler dizisindeki metinle birebir aynı olduğundan emin ol.
        6.  Her bir sorunun zorluk seviyesini, içeriğinin bilişsel karmaşıklığına göre değerlendirerek 'kolay', 'orta', veya 'zor' olarak belirle.
        7.  **ÇOK ÖNEMLİ - GÖRSEL BAĞLAM TESPİTİ:**
            - Bir sorunun metni, cevaplanması için görseldeki belirli bir parçaya atıfta bulunuyorsa (örneğin "Yukarıdaki tabloya göre...", "Verilen zaman çizelgesine göre...", "Haritadaki bilgilere dayanarak..."), bu parçayı \`visualContext\` olarak belirlemelisin.
            - \`visualContext\` olarak belirlediğin alan, **SADECE** referans verilen görsel öğeyi (tablo, grafik, resim, harita vb.) içermelidir.
            - Bu alan **KESİNLİKLE** sorunun metnini, seçeneklerini veya cevap işaretlerini içermemelidir.
            - Amacın, metin olarak ifade edilemeyen ve soruyu anlamak için gerekli olan görsel bilgiyi ayıklamaktır. Örneğin, bir zaman çizelgesindeki tarihleri ve olayları metne dökemezsin, bu yüzden o çizelgesinin kendisi \`visualContext\` olur.
            - Eğer bir soru herhangi bir görsel öğeye ihtiyaç duymuyorsa, \`visualContext\` alanını boş bırak.
        8.  **SINIRLAYICI KUTU KOORDİNATLARI:**
            - \`visualContext\` olarak belirlediğin alanın sınırlayıcı kutusunu (bounding box) hassas bir şekilde hesapla.
            - Koordinatları (x, y, genişlik, yükselik) görselin toplam boyutlarına göre 0 ile 1 arasında ondalık sayılar olarak ver. (0,0) sol üst köşedir.
        
        Sonucu, talep edilen JSON şemasına harfiyen uyacak şekilde bir JSON DİZİSİ (array) olarak döndür. Her soru dizinin bir elemanı olmalıdır. Başka hiçbir açıklama veya metin ekleme.
    `;

    // FIX: Standardize the `contents` structure to always use the `parts` array.
    const contents = {
        parts: [
            { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
            { text: promptText }
        ]
    };
    
    const baseQuizSchema = getQuizSchema();
    const extractionQuizSchema = {
        ...baseQuizSchema,
        properties: {
            ...baseQuizSchema.properties,
            difficulty: {
              type: Type.STRING,
              description: "Sorunun zorluk seviyesi. Sadece 'kolay', 'orta', veya 'zor' değerlerinden birini kullan."
            },
            visualContext: {
                type: Type.OBJECT,
                description: "Soruya bağlamsal görsel gerekiyorsa, bu görselin sınırlayıcı kutusu. Koordinatlar 0-1 aralığında yüzdelik değerlerdir.",
                properties: {
                    x: { type: Type.NUMBER, description: "Kutunun sol üst köşesinin x koordinatı (yüzdelik)." },
                    y: { type: Type.NUMBER, description: "Kutunun sol üst köşesinin y koordinatı (yüzdelik)." },
                    width: { type: Type.NUMBER, description: "Kutunun genişliği (yüzdelik)." },
                    height: { type: Type.NUMBER, description: "Kutunun yüksekliği (yüzdelik)." },
                },
            }
        },
        required: [...baseQuizSchema.required.filter(item => item !== 'explanation'), 'difficulty']
    };

    const responseSchema = {
        type: Type.ARRAY,
        items: extractionQuizSchema,
    };

    const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};
