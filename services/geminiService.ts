import { GoogleGenAI, Type } from "@google/genai";
import type { Difficulty, QuestionType } from "../types";
import { promptTemplates } from '../data/promptTemplates';

// FIX: Per coding guidelines, the API key must be obtained exclusively from process.env.API_KEY.
const apiKey = process.env.API_KEY;

if (!apiKey) {
    throw new Error("API_KEY (VITE_GEMINI_API_KEY veya API_KEY) ortam değişkeni ayarlanmamış. Lütfen doğru şekilde yapılandırdığınızdan emin olun.");
}

const ai = new GoogleGenAI({ apiKey });
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

    const customPromptTemplate = promptTemplates[kazanımId];

    // Use custom template only if it exists and matches some conditions (e.g., quiz with image)
    if (customPromptTemplate && questionType === 'quiz' && questionCount === 1 && shouldGenerateImage) {
        const response = await ai.models.generateContent({
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

    let imageInstruction = '';
    if (shouldGenerateImage && questionType === 'quiz') {
        imageInstruction = 'Eğer soru bir şekil, grafik, harita, tablo, deney düzeneği gibi bir görselden faydalanacaksa veya bir görselle daha anlaşılır hâle gelecekse, bu görseli bir resim üretme modelinin anlayabileceği şekilde detaylı olarak tarif eden bir "visualPrompt" alanı oluştur. Soru tamamen metin tabanlı ise ve görsele kesinlikle ihtiyaç duymuyorsa bu alanı boş bırak.';
    }
        
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
ÖNEMLİ KURAL: Çoktan seçmeli sorularda, "answer" alanı, "options" dizisindeki doğru seçeneğin metnini BİREBİR İÇERMELİDİR. Kesinlikle seçenek harfini (A, B, C, D gibi) KULLANMA.

Örnekler:
- Çoktan seçmeli: { "question": "Türkiye'nin başkenti neresidir?", "options": ["İstanbul", "Ankara", "İzmir", "Bursa"], "answer": "Ankara", "explanation": "...", "visualPrompt": "..." }
- Boşluk doldurma: { "sentence": "Güneş Sistemi'ndeki en büyük gezegen ___'dir.", "answer": "Jüpiter", "distractors": ["Mars", "Satürn"] }
- Eşleştirme: { "question": "...", "pairs": [{ "term": "...", "definition": "..." }] }

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

    const response = await ai.models.generateContent({
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
        const response = await ai.models.generateImages({
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

    const response = await ai.models.generateContent({
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
    
    const response = await ai.models.generateContent({
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

export const generateExamFromKazanims = async (
    grade: number,
    subjectName: string,
    kazanimSelections: { id: string; text: string; count: number }[],
    referenceExamDoc?: { mimeType: string; data: string },
    sourceContentDocs?: { name: string; content: { mimeType: string; data: string } }[]
): Promise<{ examContent: string, answerKeyContent: string }> => {
    const kazanimsList = kazanimSelections.map(k =>
        `- Kazanım: "${k.id} - ${k.text}" - İstenen Soru Sayısı: ${k.count}`
    ).join('\n');

    const totalQuestions = kazanimSelections.reduce((sum, k) => sum + k.count, 0);

    const prompt = `
Sen ${grade}. sınıf ${subjectName} dersi için bir yazılı sınav kağıdı hazırlayan uzman bir öğretmensin.
Görevin, sana verilen bilgilere göre tutarlı ve kaliteli bir sınav kağıdı oluşturmaktır.

Aşağıdaki kurallara harfiyen uymalısın:

1.  **Kazanımlar:** Sınav, **SADECE** aşağıdaki listede belirtilen kazanımları ve soru sayılarını içermelidir:
${kazanimsList}

2.  **Bilgi Kaynağı:**
${(sourceContentDocs && sourceContentDocs.length > 0) ?
    "**KRİTİK KURAL:** Soruların içeriğini ve cevaplarını **KESİNLİKLE** sana verilen 'BİLGİ KAYNAĞI' dökümanlarından (ders kitabı üniteleri vb.) oluşturmalısın. İstenen kazanım hangi dökümandaysa, o dökümanı kullan. Dışarıdan bilgi kullanma." :
    "Soruların içeriğini belirtilen kazanımlara uygun olarak genel müfredat bilgisiyle oluştur."}

3.  **Stil ve Format Referansı:**
${referenceExamDoc ?
    `**ÇOK ÖNEMLİ STİL KURALI:** Sana bir 'STİL VE FORMAT REFERANSI' dökümanı (örnek yazılı) veriyorum. Bu dökümanın içeriğini veya sorularını **KESİNLİKLE KOPYALAMA**. Senin görevin, bu referans dökümanın sadece **YAPISINI, SORU ÇEŞİTLERİNİ (örn: boşluk doldurma, tablo sorusu vb.), FORMATINI ve TARZINI** analiz edip taklit etmektir. Örneğin, referans sınav 5. sınıf Sosyal Bilgiler, ama senden istenen 6. sınıf Fen Bilimleri ise, üreteceğin sınav, Fen Bilimleri konularını içermeli ama soru tipleri ve görünüşü itibarıyla Sosyal Bilgiler sınavına benzemelidir. İçerik ve konular için MUTLAKA 1. ve 2. kurallara uymalısın.` :
    "Soru tiplerini çeşitlendir. Bilgiyi ölçen, net cevaplı sorulara odaklan (Kısa Cevap, Boşluk Doldurma, Tablo Doldurma, Eşleştirme, Doğru/Yanlış). 'Açıklayınız', 'Yorumlayınız' gibi uzun ve subjektif cevaplar gerektiren sorulardan kaçın. Çoktan seçmeli soru KULLANMA."}

4.  **Genel Sınav Kuralları:**
    - **Başlık:** Sınava uygun, resmi bir başlık oluştur.
    - **Puanlama:** Her sorunun yanına parantez içinde bir puan değeri ekle. Toplam puan 100 olmalıdır. Puanları, ${totalQuestions} adet soruya mantıklı ve adil bir şekilde dağıt.
    - **Cevap Anahtarı:** Sınavla birlikte, her sorunun doğru cevabını içeren, düzenli ve anlaşılır bir **Cevap Anahtarı** bölümü oluştur. Boşluk doldurma soruları için doğru kelimeleri, eşleştirme için doğru çiftleri, açık uçlu sorular için ise beklenen temel bilgileri içeren kısa ve net cevaplar ver.

Lütfen çıktını, iki anahtar içeren bir JSON nesnesi olarak ver:
1.  \`exam\`: Markdown formatındaki sınav kağıdının tamamını içeren bir string.
2.  \`answerKey\`: Markdown formatındaki detaylı cevap anahtarını içeren bir string.

Başka hiçbir açıklama veya metin ekleme.
`;

    const parts = [];

    if (referenceExamDoc) {
        parts.push({ text: "Aşağıda stil ve format için bir referans sınav dökümanı bulunmaktadır:" });
        
        if (referenceExamDoc.mimeType === 'text/plain') {
            parts.push({ text: referenceExamDoc.data });
        } else {
            parts.push({
                inlineData: {
                    mimeType: referenceExamDoc.mimeType,
                    data: referenceExamDoc.data,
                },
            });
        }
        
        parts.push({ text: "--- Referans Sınav Sonu ---" });
    }
    
    if (sourceContentDocs && sourceContentDocs.length > 0) {
        parts.push({ text: "Aşağıda soruları oluştururken içerik için kullanman gereken bilgi kaynağı dökümanları bulunmaktadır:" });
        sourceContentDocs.forEach(doc => {
            parts.push({ text: `--- BİLGİ KAYNAĞI BAŞLANGICI: ${doc.name} ---` });
            parts.push({
                inlineData: {
                    mimeType: doc.content.mimeType,
                    data: doc.content.data,
                },
            });
            parts.push({ text: `--- BİLGİ KAYNAĞI SONU: ${doc.name} ---` });
        });
    }

    parts.push({ text: prompt });

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            exam: { type: Type.STRING, description: "Markdown formatındaki sınav kağıdının tamamı." },
            answerKey: { type: Type.STRING, description: "Markdown formatındaki detaylı cevap anahtarı." }
        },
        required: ['exam', 'answerKey']
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    const responseText = response.text.trim();
    try {
        const result = JSON.parse(responseText);
        return {
            examContent: result.exam || '',
            answerKeyContent: result.answerKey || ''
        };
    } catch (e) {
        console.error("Failed to parse Gemini JSON response for exam generation:", responseText);
        throw new Error("Yapay zekadan geçersiz formatta bir yazılı yanıtı alındı.");
    }
};

export const improveGeneratedExam = async (examContent: string): Promise<string> => {
    const prompt = `
Sen deneyimli bir öğretmen, müfredat uzmanı ve ölçme-değerlendirme uzmanısın.
Sana Markdown formatında verilen aşağıdaki yazılı sınav kağıdını analiz et.

Sınav Kağıdı:
---
${examContent}
---

Lütfen bu sınavı aşağıdaki kriterlere göre değerlendir ve yapıcı geri bildirimlerde bulun:
1.  **Müfredat Uyumu ve Kapsam:** Sorular, ima edilen sınıf seviyesi ve konu için uygun mu? Konu dağılımı dengeli mi?
2.  **Zorluk Dengesi:** Sınavda kolay, orta ve zor seviyede sorular dengeli bir şekilde dağıtılmış mı?
3.  **Anlaşılırlık ve Adillik:** Sorular açık, net ve tek bir anlama gelecek şekilde mi yazılmış? Öğrenciyi yanıltabilecek ifadeler var mı?
4.  **Puanlama:** Soruların puan dağılımı, sorunun zorluğu ve gerektirdiği çaba ile orantılı mı? Toplam puan 100 mü?
5.  **Genel Kalite:** Sınavın genel yapısı, formatı ve kalitesi hakkında ne düşünüyorsun?

Değerlendirmeni, her bir maddeyi ele alacak şekilde, kısa ve öz maddeler halinde sun. Eğer sınav zaten çok kaliteliyse, bunu belirt ve nedenlerini açıkla. Cevabın sadece bu değerlendirme metni olmalı.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text.trim();
};

export const generatePromptTemplateForKazanım = async (kazanımId: string, kazanımText: string): Promise<string> => {
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text.trim();
};