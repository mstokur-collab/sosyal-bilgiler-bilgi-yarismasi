import { GoogleGenAI, Type } from "@google/genai";
import type { Difficulty, Question, QuestionType, QuizQuestion } from '../types';

// Use a variable to hold the initialized client.
// This allows for "lazy initialization" - we only create the client when it's first needed.
let ai: GoogleGenAI | null = null;

/**
 * Initializes and returns the GoogleGenAI client.
 * Throws an error if the API key is not available.
 * This function ensures the main app can run even if AI features are not configured.
 */
const getAiClient = (): GoogleGenAI => {
  if (!ai) {
    // FIX: API key must be retrieved from environment variables as per guidelines.
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      // This user-friendly error will be caught by the TeacherPanel component
      // and displayed to the user without crashing the entire application.
      throw new Error("Gemini API anahtarı bulunamadı. Lütfen `API_KEY` ortam değişkenini ayarlayın.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
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
    answer: { type: Type.STRING, description: "Doğru cevap. Seçeneklerden biriyle tam olarak eşleşmelidir." }
  },
  required: ["question", "options", "answer"]
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
  imageData?: { mimeType: string; data: string }
): Promise<Omit<Question, 'id' | 'grade' | 'topic' | 'difficulty' | 'type'>[]> => {
  // Get the AI client only when this function is called.
  const aiClient = getAiClient();
  
  const promptText = `
    Lütfen aşağıdaki kriterlere ve sağlanan görsele uygun ${count} adet sosyal bilgiler bilgi yarışması sorusu oluştur:
    - Sınıf Seviyesi: ${grade}. sınıf
    - Kazanım ID: ${kazanımId}
    - Kazanım Metni: ${kazanımText}
    - Zorluk: ${difficulty}
    - Soru Tipi: ${type}
    - Önemli: Soru, doğrudan yüklenen görselle ilgili olmalı, görseldeki bir unsuru sormalı veya görseli bir kanıt/ipucu olarak kullandırmalıdır.
    Soru, belirtilen kazanım ID'si ve metnine tam olarak uygun olmalı ve bu kazanımı ölçmelidir.
    Yanıtın her zaman bir JSON dizisi (array) formatında olmalıdır.
    Sadece ve sadece istenen JSON formatında bir yanıt ver. Açıklama veya giriş metni ekleme.
  `;
  
  const plainTextPrompt = `
    Lütfen aşağıdaki kriterlere uygun ${count} adet sosyal bilgiler bilgi yarışması sorusu oluştur:
    - Sınıf Seviyesi: ${grade}. sınıf
    - Kazanım ID: ${kazanımId}
    - Kazanım Metni: ${kazanımText}
    - Zorluk: ${difficulty}
    - Soru Tipi: ${type}

    Soru, belirtilen kazanım ID'si ve metnine tam olarak uygun olmalı ve bu kazanımı ölçmelidir.
    Yanıtın her zaman bir JSON dizisi (array) formatında olmalıdır.
    Sadece ve sadece istenen JSON formatında bir yanıt ver. Açıklama veya giriş metni ekleme.
  `;

  let contents: any;
  if (imageData) {
    contents = {
        parts: [
            { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
            { text: promptText }
        ]
    };
  } else {
    contents = plainTextPrompt;
  }


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
    imageData: { mimeType: string; data: string }
): Promise<(Omit<QuizQuestion, 'id' | 'grade' | 'topic' | 'type' | 'kazanımId' | 'imageUrl'> & { visualContext?: { x: number; y: number; width: number; height: number; } })[]> => {
    // Get the AI client only when this function is called.
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
            - Amacın, metin olarak ifade edilemeyen ve soruyu anlamak için gerekli olan görsel bilgiyi ayıklamaktır. Örneğin, bir zaman çizelgesindeki tarihleri ve olayları metne dökemezsin, bu yüzden o çizelgenin kendisi \`visualContext\` olur.
            - Eğer bir soru herhangi bir görsel öğeye ihtiyaç duymuyorsa, \`visualContext\` alanını boş bırak.
        8.  **SINIRLAYICI KUTU KOORDİNATLARI:**
            - \`visualContext\` olarak belirlediğin alanın sınırlayıcı kutusunu (bounding box) hassas bir şekilde hesapla.
            - Koordinatları (x, y, genişlik, yükselik) görselin toplam boyutlarına göre 0 ile 1 arasında ondalık sayılar olarak ver. (0,0) sol üst köşedir.
        
        Sonucu, talep edilen JSON şemasına harfiyen uyacak şekilde bir JSON DİZİSİ (array) olarak döndür. Her soru dizinin bir elemanı olmalıdır. Başka hiçbir açıklama veya metin ekleme.
    `;

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
        required: [...baseQuizSchema.required, 'difficulty']
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