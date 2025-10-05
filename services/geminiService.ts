import { GoogleGenAI, Type } from "@google/genai";
import type { Difficulty, Question, QuestionType, QuizQuestion, FillInQuestion, MatchingQuestion } from '../types';
import { subjectApiKeys, defaultApiKey } from '../apiKeys';
import { promptTemplates } from '../data/promptTemplates'; // Yeni prompt kütüphanesini içeri aktar

// --- Akıllı API Anahtar Rotasyonu ---

// `apiKeys.ts` dosyasındaki tüm anahtarları tek bir listede birleştirir.
// Bu, bir anahtarın kotası dolduğunda otomatik olarak diğerine geçmeyi sağlar.
const allApiKeys = [
  defaultApiKey,
  ...Object.values(subjectApiKeys)
].filter(key => key && key.trim() !== ''); // Boş veya tanımsız anahtarları filtrele

let currentApiKeyIndex = 0;

/**
 * Sıradaki API anahtarına geçer.
 * @returns {boolean} - Yeni bir anahtara başarıyla geçilirse true, tüm anahtarlar tükendi ise false döner.
 */
const rotateApiKey = (): boolean => {
  if (currentApiKeyIndex < allApiKeys.length - 1) {
    currentApiKeyIndex++;
    console.warn(`API Kota Limiti Aşıldı. Bir sonraki API anahtarına geçiliyor... (Anahtar ${currentApiKeyIndex + 1}/${allApiKeys.length})`);
    return true;
  }
  console.error("Tüm API anahtarları için kota limitine ulaşıldı. Lütfen daha sonra tekrar deneyin veya 'apiKeys.ts' dosyanızı kontrol edin.");
  return false;
};

/**
 * Mevcut aktif GoogleGenAI istemcisini döndürür.
 * `currentApiKeyIndex`'teki anahtarı kullanır.
 * @returns {GoogleGenAI} - Başlatılmış bir GoogleGenAI istemcisi.
 * @throws Hiçbir API anahtarı yapılandırılmamışsa hata fırlatır.
 */
const getAiClient = (): GoogleGenAI => {
  if (allApiKeys.length === 0) {
    throw new Error("Gemini API anahtarı bulunamadı. Lütfen 'apiKeys.ts' dosyasını açıp en az bir API anahtarı eklediğinizden emin olun.");
  }
  const apiKey = allApiKeys[currentApiKeyIndex];
  return new GoogleGenAI({ apiKey });
};


const getQuizSchema = () => ({
  type: Type.OBJECT,
  properties: {
    kazanımId: { type: Type.STRING, description: "Sorunun hangi kazanım ID'sine yönelik oluşturulduğu. Bu, girdide verilen ID ile aynı olmalıdır." },
    question: { type: Type.STRING, description: "Sorunun metni." },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Dört seçenek. Doğru cevap da bu listede olmalı."
    },
    answer: { type: Type.STRING, description: "Doğru cevap. Seçeneklerden biriyle tam olarak eşleşmelidir." },
    explanation: { type: Type.STRING, description: "Doğru cevabın neden doğru olduğunu kısaca ve anlaşılır bir şekilde açıklayan metin." },
    visualPrompt: { type: Type.STRING, description: "Eğer soru görsel gerektiriyorsa, bu görselin üretilmesi için İngilizce, detaylı ve temiz bir komut. Görsel gerekmiyorsa bu alan boş bırakılmalıdır." }
  },
  required: ["kazanımId", "question", "options", "answer", "explanation"]
});

const getFillInSchema = () => ({
  type: Type.OBJECT,
  properties: {
    kazanımId: { type: Type.STRING, description: "Sorunun hangi kazanım ID'sine yönelik oluşturulduğu. Bu, girdide verilen ID ile aynı olmalıdır." },
    sentence: { type: Type.STRING, description: "Boşluğun '___' ile belirtildiği cümle." },
    answer: { type: Type.STRING, description: "Boşluğa gelecek doğru kelime veya kelime grubu." },
    distractors: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2 veya 3 adet yanlış, çeldirici kelime."
    }
  },
  required: ["kazanımId", "sentence", "answer", "distractors"]
});

const getMatchingSchema = () => ({
  type: Type.OBJECT,
  properties: {
    kazanımId: { type: Type.STRING, description: "Sorunun hangi kazanım ID'sine yönelik oluşturulduğu. Bu, girdide verilen ID ile aynı olmalıdır." },
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
  required: ["kazanımId", "question", "pairs"]
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
  skill: string, // New parameter for paragraph skill
  imageData?: { mimeType: string; data: string },
  retryCount = 0
): Promise<(Omit<Question, 'id' | 'grade' | 'topic' | 'difficulty' | 'type'> & { kazanımId?: string, visualPrompt?: string })[]> => {
  const getParagraphPrompt = (selectedSkill: string) => {
    const skillInstructions: Record<string, string> = {
        'main-idea': 'Paragrafın ana fikrini veya konusunu bulmaya yönelik olmalıdır.',
        'supporting-idea': 'Paragraftaki yardımcı fikirleri veya detayları tespit etmeye yönelik olmalıdır.',
        'inference': 'Paragraftan mantıksal bir çıkarım yapmayı gerektirmelidir. Cevap metinde doğrudan yazmamalıdır.',
        'vocabulary': 'Paragraftaki bir kelime veya deyimin bağlamdaki anlamını sormalıdır.',
        'author-purpose': 'Yazarın paragrafı yazma amacını veya metindeki tutumunu (örneğin, bilgilendirici, eleştirel, eğlendirici) sorgulamalıdır.'
    };
    
    const skillSpecificInstruction = skillInstructions[selectedSkill] 
        ? `2. SORU TÜRÜ: Soru, özellikle şu beceriyi ölçmelidir: ${skillInstructions[selectedSkill]}`
        : '2. SORU TÜRÜ: Soru, paragrafı anlama becerisini (ana fikir, yardımcı fikir, çıkarım yapma, kelime anlamı vb.) ölçmelidir. Her seferinde farklı bir anlama becerisine odaklanmaya çalış.';

    return `
    Sen, 5-8. sınıf öğrencileri için okuduğunu anlama testleri hazırlayan uzman bir Türkçe öğretmeni ve ölçme-değerlendirme uzmanısın.
    Görevin, belirtilen sınıf seviyesi ve zorluğa uygun, ${count} adet çoktan seçmeli paragraf sorusu oluşturmaktır.

    - Sınıf Seviyesi: ${grade}. sınıf
    - Kazanım ID: ${kazanımId}
    - Zorluk: ${difficulty}
    
    KRİTİK TALİMATLAR:
    1.  PARAGRAF: Her soru için, öncelikle Türkçe dilinde, kısa, ilgi çekici ve yaş grubuna uygun bir paragraf yaz. Paragraf 40 ile 80 kelime arasında olmalıdır.
    ${skillSpecificInstruction}
    3.  KAZANIM ID DOĞRULAMA: Oluşturduğun her soru nesnesine, o sorunun hangi kazanımı hedeflediğini belirten bir 'kazanımId' alanı ekle. Bu alana yazacağın değer, sana girdi olarak verilen '${kazanımId}' değeriyle birebir aynı olmalıdır.
    4.  YORUM GEREKSİNİMİ: Sorunun cevabı, paragraftan doğrudan kopyalanıp yapıştırılabilen bir cümle OLMAMALIDIR. Öğrencinin metni anlayıp yorumlaması gereklidir.
    5.  BİRLEŞTİRİLMİŞ METİN: JSON nesnesindeki nihai "question" alanı, HEM paragrafı HEM DE soru metnini, aralarında bir satır boşluğu olacak şekilde BİRLİKTE içermelidir. Örnek: "Paragraf metni burada yer alır.\\n\\nBu paragrafa göre aşağıdakilerden hangisi doğrudur?"
    6.  KALİTELİ ÇELDİRİCİLER: Dört adet seçenek sun. Sadece biri doğru olmalı. Diğer üç yanlış seçenek (çeldiriciler), metinle alakalı ve mantıklı olmalı, ancak öğrenciyi dikkatli düşünmeye sevk edecek şekilde yanlış olmalıdır. Çeldiriciler, bariz bir şekilde yanlış olmamalıdır.
    7.  ŞIK UZUNLUĞU: Doğru cevap her zaman en uzun veya en kısa seçenek olmamalıdır. Şıkların uzunluğunu değişken tut.
    8.  AÇIKLAMA: Doğru cevabın neden doğru olduğunu, paragraftaki ifadelere atıfta bulunarak ve diğer şıkların neden yanlış olduğunu kısaca açıklayarak net bir şekilde belirt.
    9.  JSON FORMATI: Yanıt, istenen şemaya uyan geçerli bir JSON dizisi (array) formatında olmalıdır. Başka hiçbir ek metin, giriş veya açıklama ekleme.
  `;
  };

  
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
    4.  KAZANIM ID VALIDATION: To each question object you create, add a 'kazanımId' field. The value for this field must be IDENTICAL to the Learning Outcome ID provided in the input, which is "${kazanımId}".
    5.  AGE APPROPRIATENESS: Keep the language simple, clear, and engaging for young learners (ages 10-14). Avoid complex grammar and vocabulary unless it is the direct subject of the learning outcome.
    6.  VARY OPTION LENGTH: To prevent students from guessing based on length, the word count of the correct answer and the distractors must be varied. The correct answer should not consistently be the longest or shortest option. Make all options plausible and of similar complexity.
    7.  EXPLANATION: For each question, generate a brief and clear 'explanation' text explaining why the correct answer is correct. This should help the learner understand the concept better.
    8.  RESPONSE FORMAT: The final output MUST be ONLY a valid JSON array of question objects matching the requested schema. Do not add any extra text, explanations, or introductory sentences.
  `;

  const getTurkishPrompt = (isImage: boolean) => {
    const imagePromptPart = `
    - ÖNEMLİ GÖRSEL ANALİZİ: Soru, doğrudan yüklenen görselle ilgili olmalı, görseldeki bir unsuru sormalı veya görseli bir kanıt/ipucu olarak kullandırmalıdır.`;

    const smartQuestionGenerationPart = `
    - BÜTÜNLEŞİK SORU TASARIMI: Sen, ${grade}. sınıf için, hem metin hem de görselin bütünleşik olduğu, öğrenciyi düşünmeye teşvik eden yaratıcı sorular hazırlayan uzman bir eğitim teknolojistisin. Görevin, aşağıda verilen kazanım için, görselin sorunun ayrılmaz bir parçası olduğu bir soru konsepti oluşturmaktır.

    **HEDEF KAZANIM:**
    - ID: ${kazanımId}
    - Metin: "${kazanımText}"

    **ÜRETİM SÜRECİ:**
    1.  **Önce Görseli Hayal Et:** Kazanımı en iyi anlatacak yaratıcı bir senaryo ve bu senaryoya ait bir görsel düşün. Bu görsel, sorunun verilerini içermeli (örn: bir grafikteki sayılar, bir haritadaki mesafeler, topların üzerindeki rakamlar vb.). Görsel, soruyu çözmek için GEREKLİ olmalı, sadece bir süsleme değil.
    2.  **Görsel Komutu (visualPrompt) Oluştur:** Hayal ettiğin bu görseli, bir yapay zeka resim üreticisi için (İngilizce olarak) detaylı, temiz ve metin içermeyen bir komut olarak yaz. Komut, "A clean, minimalist educational diagram showing..." gibi başlamalıdır. Görselde rakamlar veya geometrik harfler (A, B, x gibi) olabilir, ancak tam cümleler olmamalıdır.
    3.  **Soru Metnini Yaz:** Soru metnini, ürettiğin bu görsel komutuna doğrudan atıfta bulunacak şekilde yaz. Örneğin: "Yukarıdaki grafiğe göre...", "Görseldeki toplardan hangisi...".
    4.  **JSON Olarak Sun:** Tüm bu konsepti, istenen JSON şemasına uygun olarak paketle.

    **ÖRNEK ÇIKTI (Farklı bir kazanım için):**
    {
      "kazanımId": "M.8.1.1.1",
      "question": "Torbalarda verilen topların üzerinde yazan sayılardan 80 sayısının doğal sayı bölenlerinin yazılı olduğu top sayısı ile doğal sayı böleni olmayanların yazılı olduğu top sayısı arasındaki fark aşağıdakilerden hangisidir?",
      "options": ["1", "2", "3", "4"],
      "answer": "2",
      "explanation": "80'in doğal sayı bölenleri: 1, 2, 4, 5, 8, 10, 16, 20, 40, 80'dir...",
      "visualPrompt": "A minimalist and clean diagram showing two transparent bags on a table. The left bag contains five balls with the numbers 1, 3, 8, 10, 5 written on them. The right bag contains five balls with the numbers 15, 16, 29, 12, 20. The balls and numbers should be clearly visible."
    }

    **SENİN GÖREVİN:**
    Şimdi, yukarıdaki yapıyı ve kaliteyi referans alarak, hedef kazanım (${kazanımId}) için ${count} adet YENİ ve ÖZGÜN soru konsepti oluştur. **KRİTİK KURAL:** Her soru için mutlaka bir görsel konsepti oluşturmaya çalışmalısın. Soyut konular (örn: bölünebilme kuralları, cebirsel ifadeler) için yaratıcı olmalısın; sayıları toplar, kartlar veya bloklar olarak, denklemleri ise terazi veya modelleme ile temsil edebilirsin. 'visualPrompt' alanı, sadece ve sadece görselleştirmenin KESİNLİKLE imkansız olduğu istisnai durumlarda boş bırakılmalıdır.
    `;
    
    return `
    Lütfen aşağıdaki kriterlere${isImage ? ' ve sağlanan görsele' : ''} uygun ${count} adet bilgi yarışması sorusu oluştur:
    - Sınıf Seviyesi: ${grade}. sınıf
    - Kazanım ID: ${kazanımId}
    - Kazanım Metni: "${kazanımText}"
    - Zorluk: ${difficulty}
    - Soru Tipi: ${type}
    ${isImage ? imagePromptPart : smartQuestionGenerationPart}
    
    KRİTİK TALİMATLAR:
    1.  UYGUNLUK: Soru, belirtilen kazanım ID'si ve metnine tam olarak uygun olmalı ve bu kazanımı ölçmelidir.
    2.  KAZANIM ID DOĞRULAMA: Oluşturduğun her soru nesnesine, o sorunun hangi kazanımı hedeflediğini belirten bir 'kazanımId' alanı ekle. Bu alana yazacağın değer, sana girdi olarak verilen '${kazanımId}' değeriyle birebir aynı olmalıdır.
    3.  ŞIK UZUNLUĞU: Öğrencilerin sadece metin uzunluğuna bakarak doğru cevabı tahmin etmesini engellemek için, doğru cevabın ve çeldirici seçeneklerin kelime sayılarını/uzunluklarını değişken tut. Doğru cevap bazen en kısa, bazen en uzun, bazen de ortalama uzunlukta olmalıdır. Tüm seçenekler inandırıcı ve benzer karmaşıklıkta olmalıdır.
    4.  AÇIKLAMA: Her çoktan seçmeli soru için, doğru cevabın neden doğru olduğunu açıklayan, kısa ve anlaşılır bir 'explanation' metni oluştur. Bu açıklama, öğrencinin konuyu daha iyi anlamasına yardımcı olmalıdır.
    5.  JSON FORMATI: Yanıtın her zaman bir JSON dizisi (array) formatında olmalıdır. Sadece ve sadece istenen JSON formatında bir yanıt ver. Açıklama veya giriş metni ekleme.
  `;
  };

  let prompt;
  // KAZANIM KÜTÜPHANESİ KONTROLÜ
  const template = promptTemplates[kazanımId];

  if (template) {
    console.log(`"${kazanımId}" için özel prompt şablonu bulundu ve kullanılıyor.`);
    prompt = template;
  } else {
    // Özel prompt yoksa, genel mantığa geri dön
    if (subjectId === 'paragraph') {
        prompt = getParagraphPrompt(skill);
    } else if (subjectId === 'english') {
        prompt = getEnglishPrompt();
    } else {
        prompt = getTurkishPrompt(!!imageData);
    }
  }
  
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
  
  try {
      const aiClient = getAiClient();
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
  } catch (error) {
    console.error(`Soru üretimi sırasında bir hata oluştu:`, error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

    if ((errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) && retryCount < allApiKeys.length) {
      if (rotateApiKey()) {
        return generateQuestionWithAI(grade, kazanımId, kazanımText, difficulty, type, count, subjectId, skill, imageData, retryCount + 1);
      }
    }

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("Tüm API anahtarlarında metin üretimi için kota limitine ulaşıldı. Lütfen API anahtarlarınızı kontrol edin.");
    }
    
    throw error;
  }
};

export const generateImageForQuestion = async (
    visualPrompt: string,
    retryCount = 0
): Promise<string | null> => {
    if (!visualPrompt) {
        console.log("Görsel üretmek için bir komut (prompt) sağlanmadı.");
        return null;
    }

    try {
        const aiClient = getAiClient();
        console.log("Bütünleşik soru konseptinden gelen görsel komutu ile görsel üretiliyor...");
        const imageResponse = await aiClient.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: visualPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (!imageResponse.generatedImages || imageResponse.generatedImages.length === 0) {
            console.warn("Görsel üretilemedi.");
            return null;
        }
        
        const imageData = imageResponse.generatedImages[0].image.imageBytes;
        console.log("Görsel başarıyla üretildi.");
        return `data:image/png;base64,${imageData}`;

    } catch (error) {
        console.error(`Görsel üretimi sırasında bir hata oluştu:`, error);
        
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        
        if ((errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) && retryCount < allApiKeys.length) {
            if (rotateApiKey()) {
                return generateImageForQuestion(visualPrompt, retryCount + 1);
            }
        }

        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("Tüm API anahtarlarında görsel üretimi için kota limitine ulaşıldı. Bu durum, kısa sürede çok fazla istek gönderildiğinde veya API anahtarlarınızın ücretsiz kullanım limitini doldurduğunda meydana gelebilir. Lütfen `apiKeys.ts` dosyanızı ve Google Cloud projenizin faturalandırma durumunu kontrol edin.");
        }
        
        return null; // For other non-quota errors, fail gracefully
    }
};


export const extractQuestionFromImage = async (
    imageData: { mimeType: string; data: string },
    retryCount = 0
): Promise<(Omit<QuizQuestion, 'id' | 'grade' | 'topic' | 'type' | 'kazanımId' | 'imageUrl'> & { visualContext?: { x: number; y: number; width: number; height: number; } })[]> => {
    
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
            question: baseQuizSchema.properties.question,
            options: baseQuizSchema.properties.options,
            answer: baseQuizSchema.properties.answer,
            explanation: baseQuizSchema.properties.explanation,
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
        required: [...baseQuizSchema.required.filter(item => item !== 'explanation' && item !== 'kazanımId' && item !== 'visualPrompt'), 'difficulty']
    };

    const responseSchema = {
        type: Type.ARRAY,
        items: extractionQuizSchema,
    };

    try {
        const aiClient = getAiClient();
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
    } catch(error) {
        console.error(`Görselden soru çıkarılırken bir hata oluştu:`, error);
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        if ((errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) && retryCount < allApiKeys.length) {
            if (rotateApiKey()) {
                return extractQuestionFromImage(imageData, retryCount + 1);
            }
        }
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("Tüm API anahtarlarında görsel analizi için kota limitine ulaşıldı. Lütfen anahtarlarınızı kontrol edin.");
        }
        throw error;
    }
};

export const generatePromptTemplateForKazanım = async (
    kazanımId: string,
    kazanımText: string,
    retryCount = 0
): Promise<string> => {
    
    const masterPrompt = `
You are an expert prompt engineer and curriculum developer. Your task is to generate a high-quality "master prompt template" for a specific educational learning outcome (kazanım). This template will be used to guide another AI (Gemini) to create excellent, visually-oriented quiz questions.

**Target Learning Outcome:**
- **ID:** ${kazanımId}
- **Text:** "${kazanımText}"

**Instructions for the Master Prompt Template you will create:**

1.  **AI Persona:** The template must instruct the AI to act as an expert teacher and question designer for the relevant subject.
2.  **Visual-First Approach:** The core of the template must be to generate a question where a visual element is INTEGRAL. The template should instruct the AI to first imagine a creative visual (a diagram, chart, map, unique scenario) and then write the question based on that visual.
3.  **Include a High-Quality Example:** The template MUST include a complete, high-quality example of the desired JSON output. This example should be perfectly tailored to the provided learning outcome.
    *   The example's JSON must contain fields: "kazanımId", "question", "options", "answer", "explanation", and "visualPrompt".
    *   The "kazanımId" must be exactly "${kazanımId}".
    *   The "visualPrompt" must be a detailed, clear prompt in ENGLISH for an image generation AI, describing a clean, educational-style graphic with NO TEXT unless essential for a diagram.
4.  **Instruct to Generalize:** After the example, the template must instruct the AI to follow the example's structure and quality but to create a NEW and ORIGINAL question with a DIFFERENT scenario for the same learning outcome.
5.  **Final Output Format:** Your final output must be a string containing the complete master prompt template, formatted as a key-value pair to be inserted into a TypeScript object. For example: \`'${kazanımId}': \`...\`,\`. Do not add any other text or explanation outside of this format.

**Example for a different kazanım (M.8.1.1.1):**
\`\`\`typescript
'M.8.1.1.1': \`
Sen bir 8. sınıf matematik öğretmeni ve soru yazma uzmanısın. 
Amacın, hem metin hem de görsel içeren, görselin sorunun bir parçası olduğu özgün sorular üretmek.
Lütfen aşağıdaki JSON formatında bir çıktı üret:

{
  "kazanımId": "M.8.1.1.1",
  "question": "Torbalarda verilen topların üzerinde yazan sayılardan 80 sayısının doğal sayı bölenlerinin yazılı olduğu top sayısı ile doğal sayı böleni olmayanların yazılı olduğu top sayısı arasındaki fark aşağıdakilerden hangisidir?",
  "options": ["1", "2", "3", "4"],
  "answer": "2",
  "explanation": "80'in doğal sayı bölenleri: 1, 2, 4, 5, 8, 10, 16, 20, 40, 80'dir. Torbalardaki sayılardan 1, 5, 8, 10, 16, 20 olmak üzere 6 tanesi 80'in bölenidir. 3, 12, 15, 29 olmak üzere 4 tanesi ise böleni değildir. Aradaki fark 6 - 4 = 2'dir.",
  "visualPrompt": "Basit ve temiz bir çizim stiliyle, bir masanın üzerinde duran iki adet şeffaf torba. Soldaki torbanın içinde üzerinde 1, 3, 8, 10, 5 yazan beş adet top bulunsun. Sağdaki torbanın içinde ise üzerinde 15, 16, 29, 12, 20 yazan beş adet top bulunsun. Toplar ve sayılar net bir şekilde görülebilsin."
}

Yukarıdaki örneğe birebir benzer yapıda, aynı kazanım ("M.8.1.1.1") için, farklı sayılar ve farklı bir senaryo (örneğin kartlar, kutular vb.) kullanarak YENİ ve ÖZGÜN bir soru daha oluştur. Soru metni, seçenekler, cevap ve görsel açıklaması tamamen yeni olmalıdır.
  \`,
\`\`\`

Now, generate the master prompt template for kazanım **${kazanımId}**.
    `;

    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: masterPrompt,
        });

        let template = response.text.trim();
        const codeBlockRegex = /```(?:typescript|javascript|)\s*([\s\S]*?)\s*```/;
        const match = template.match(codeBlockRegex);
        if (match && match[1]) {
            template = match[1].trim();
        }
        
        return template;
    } catch(error) {
        console.error(`Prompt şablonu üretilirken bir hata oluştu:`, error);
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        if ((errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) && retryCount < allApiKeys.length) {
            if(rotateApiKey()) {
                return generatePromptTemplateForKazanım(kazanımId, kazanımText, retryCount + 1);
            }
        }
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("Tüm API anahtarlarında şablon üretimi için kota limitine ulaşıldı. Lütfen anahtarlarınızı kontrol edin.");
        }
        throw error;
    }
};