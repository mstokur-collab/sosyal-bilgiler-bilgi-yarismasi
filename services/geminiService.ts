import { GoogleGenAI, Type } from "@google/genai";
import type { Difficulty, Question, QuestionType, QuizQuestion, FillInQuestion, MatchingQuestion } from '../types';
import { promptTemplates } from '../data/promptTemplates'; // Yeni prompt kütüphanesini içeri aktar

/**
 * Mevcut aktif GoogleGenAI istemcisini döndürür.
 * `process.env.API_KEY`'i kullanır.
 * @returns {GoogleGenAI} - Başlatılmış bir GoogleGenAI istemcisi.
 * @throws API anahtarı yapılandırılmamışsa hata fırlatır.
 */
// FIX: Refactored to use `process.env.API_KEY` exclusively, as per coding guidelines.
const getAiClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API anahtarı bulunamadı. Lütfen `process.env.API_KEY` ortam değişkenini ayarlayın.");
  }
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
  skill: string,
  shouldGenerateImage: boolean,
  documentData?: { mimeType: string; data: string },
  generationContext: 'pdf-topic' | 'default' = 'default'
): Promise<(Omit<Question, 'id' | 'grade' | 'topic' | 'difficulty' | 'type'> & { kazanımId?: string, visualPrompt?: string })[]> => {
  const getParagraphPrompt = (selectedSkill: string) => {
    const skillInstructions: Record<string, string> = {
        'main-idea': 'Paragrafın ana fikrini veya konusunu bulmaya yönelik olmalıdır.',
        'supporting-idea': 'Paragraftaki yardımcı fikirleri veya detayları tespit etmeye yönelik olmalıdır.',
        'inference': 'Paragraftan mantıksal bir çıkarım yapmayı gerektirmelidir. Cevap metinde doğrudan yazmamalıdır.',
        'vocabulary': 'Paragraftaki bir kelime veya deyimin bağlamdaki anlamını sormalıdır.',
        'author-purpose': 'Yazarın paragrafı yazma amacını veya metindeki tutumunu (örneğin, bilgilendirici, eleştirel, eğlendirici) sorgulamalıdır.',
        'negative-question': "Paragraftan kesin olarak **çıkarılamayacak** yargıyı veya metinde **değinilmemiş** bir konuyu bulmaya yönelik olmalıdır. Çeldiriciler metinle ilişkili olmalı ancak metinde geçmemeli veya metnin ima etmediği şeyler olmalıdır.",
        'structure-completion': "Paragrafın sonuna (veya başına) anlam bütünlüğünü sağlayacak şekilde getirilebilecek en uygun cümleyi bulmaya yönelik olmalıdır. Soru kökü 'Bu paragrafın sonuna düşüncenin akışına göre aşağıdakilerden hangisi getirilmelidir?' şeklinde olmalı ve seçenekler tam cümleler içermelidir.",
        'structure-flow': "Paragraftaki cümleleri Romen rakamlarıyla numaralandır: (I), (II), (III), (IV), (V) şeklinde. Soru, paragrafın anlam bütünlüğünü bozan cümleyi bulmayı istemelidir. Soru kökü: 'Numaralanmış cümlelerden hangisi düşüncenin akışını bozmaktadır?'. Seçenekler sadece cümlenin numarasını içermelidir: 'I.', 'II.', 'III.', 'IV.' gibi.",
        'structure-division': "Paragraftaki cümleleri Romen rakamlarıyla numaralandır. Soru, paragrafın ikiye bölünmesi durumunda ikinci paragrafın hangi cümleyle başlayacağını bulmayı istemelidir. Soru kökü: 'Bu paragraf ikiye ayrılmak istense ikinci paragraf numaralanmış cümlelerin hangisiyle başlar?'. Seçenekler sadece cümlenin numarasını içermelidir: 'II.', 'III.', 'IV.', 'V.' gibi."
    };
    
    const skillSpecificInstruction = skillInstructions[selectedSkill] 
        ? `2. SORU TÜRÜ: Soru, özellikle şu beceriyi ölçmelidir: ${skillInstructions[selectedSkill]}`
        : '2. SORU TÜRÜ: Soru, paragrafı anlama becerisini (ana fikir, yardımcı fikir, çıkarım yapma, kelime anlamı vb.) ölçmelidir. Her seferinde farklı bir anlama becerisine odaklanmaya çalış.';

    const numberingInstruction = ['structure-flow', 'structure-division'].includes(selectedSkill)
        ? "PARAGRAF FORMATI: Paragrafı oluşturan her cümlenin başına (I), (II), (III)... şeklinde Romen rakamları ile numaralandırma ekle. Bu numaralandırma, nihai 'question' alanında görünmelidir."
        : "PARAGRAF FORMATI: Paragrafı düz metin olarak yaz.";

    return `
    Sen, LGS ve TYT gibi ulusal sınavlar için paragraf soruları hazırlayan, ölçme-değerlendirme alanında uzmanlaşmış bir Türkçe editörüsün.
    Görevin, belirtilen sınıf seviyesi ve zorluğa uygun, LGS standartlarında, ${count} adet çoktan seçmeli paragraf sorusu oluşturmaktır.

    - Sınıf Seviyesi: ${grade}. sınıf
    - Kazanım ID: ${kazanımId}
    - Zorluk: ${difficulty}
    
    KRİTİK TALİMATLAR:
    1.  PARAGRAF: Her soru için, öncelikle Türkçe dilinde, edebi veya bilgilendirici nitelikte, ilgi çekici ve öğrencinin çıkarım yapma yeteneğini test edecek derinliğe sahip bir paragraf yaz. Paragraf 50 ile 90 kelime arasında olmalıdır.
    ${skillSpecificInstruction}
    3.  ${numberingInstruction}
    4.  KAZANIM ID DOĞRULAMA: Oluşturduğun her soru nesnesine, 'kazanımId' alanı olarak girdi olarak verilen '${kazanımId}' değerini ekle. Bu, izlenebilirlik için zorunludur.
    5.  YORUM GEREKSİNİMİ: Sorunun cevabı, paragraftan doğrudan kopyalanıp yapıştırılabilen bir cümle OLMAMALIDIR. Öğrencinin metni anlayıp yorumlaması, satır aralarını okuması gereklidir.
    6.  BİRLEŞTİRİLMİŞ METİN: JSON nesnesindeki nihai "question" alanı, HEM paragrafı HEM DE soru metnini, aralarında bir satır boşluğu olacak şekilde BİRLİKTE içermelidir. Örnek: "Paragraf metni burada yer alır.\\n\\nBu paragrafa göre aşağıdakilerden hangisi doğrudur?"
    7.  PROFESYONEL ÇELDİRİCİLER: Dört adet seçenek sun. Sadece biri doğru olmalı. Diğer üç yanlış seçenek (çeldiriciler), metinle güçlü bir şekilde ilişkili ve mantıklı görünmeli, ancak dikkatli bir okuma ve analizle elenebilmelidir. Çeldiriciler, metindeki bazı kelimeleri içererek öğrenciyi yanıltmaya yönelik olmalıdır; bariz şekilde yanlış olmamalıdır.
    8.  ŞIK UZUNLUĞU: Doğru cevap her zaman en uzun veya en kısa seçenek olmamalıdır. Şıkların uzunluğunu değişken tut.
    9.  AÇIKLAMA: Doğru cevabın neden doğru olduğunu, paragraftaki ifadelere atıfta bulunarak ve diğer şıkların neden çeldirici olduğunu mantıksal olarak açıklayarak net bir şekilde belirt. Açıklama, öğrenciye konuyu öğreten bir nitelikte olmalıdır.
    10. JSON FORMATI: Yanıt, istenen şemaya uyan geçerli bir JSON dizisi (array) formatında olmalıdır. Başka hiçbir ek metin, giriş veya açıklama ekleme.
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

    const getTurkishPrompt = (subjectId: string, isImage: boolean, shouldGenerateImage: boolean, generationContext: 'pdf-topic' | 'default') => {
        // Case 0: Generating questions from a PDF topic context.
        if (generationContext === 'pdf-topic' && documentData) {
            return `
            Sen, sana verilen bir ders kitabı bölümünü (PDF içeriği) analiz ederek, o bölümdeki bilgilere dayalı okuduğunu anlama soruları hazırlayan uzman bir eğitim materyali geliştiricisisin. Görevin, bir NotebookLM gibi, sana verilen kaynağa %100 sadık kalarak sorular üretmektir.

            **GİRDİLER:**
            - **PDF İçeriği:** Sana şu anda bir ders kitabından alınmış metin ve görselleri içeren bir bölüm sunuluyor.
            - **Seçilen Ana Konu:** "${kazanımText}"
            - **Sınıf Seviyesi:** ${grade}
            - **Zorluk:** ${difficulty}
            - **Soru Tipi:** ${type}
            - **Soru Sayısı:** ${count}
            - **Referans Kazanım ID:** ${kazanımId}
        
            **KRİTİK TALİMATLAR:**
            1.  **METNİ DAHİL ET:** Her bir soru için, önce PDF içeriğinden, seçilen konuyla ilgili, kendi içinde anlamlı ve soruyu cevaplamak için yeterli bilgiyi içeren kısa bir paragraf (30-70 kelime) seç.
            2.  **BİRLEŞİK SORU OLUŞTUR:** JSON çıktısındaki 'question' alanına, önce seçtiğin bu paragrafı, ardından iki satır boşluk bırakarak (\\n\\n) bu paragrafla ilgili hazırladığın soruyu yaz. Soru, "Bu metne göre...", "Yukarıdaki paragrafa göre..." gibi ifadelerle başlamalıdır.
            3.  **KAYNAĞA SADIK KAL:** Üreteceğin sorunun doğru cevabı, **SADECE** seçtiğin ve soruya eklediğin paragrafın içinde bulunmalıdır. Dışarıdan bilgi kullanma.
            4.  **KAZANIM ID DOĞRULAMA:** JSON çıktısındaki 'kazanımId' alanı için sana referans olarak verilen '${kazanımId}' değerini KULLANMALISIN.
            5.  **JSON FORMATI:** Yanıtın her zaman, talep edilen şemaya tam olarak uyan geçerli bir JSON dizisi (array) formatında olmalıdır. Başka hiçbir ek metin, giriş veya açıklama ekleme.
            
            **ÖRNEK ÇIKTI YAPISI ('question' alanı için):**
            "İpek Yolu, eski Dünya'nın en önemli ticaret rotalarından biriydi ve Çin'den başlayarak Orta Asya'yı aşıp Anadolu üzerinden Avrupa'ya ulaşırdı. Bu yol sadece ipek gibi ticari malların değil, aynı zamanda kültürlerin, dinlerin ve fikirlerin de yayılmasını sağlamıştır.\\n\\nBu metne göre İpek Yolu'nun önemi aşağıdakilerden hangisidir?"
            `;
        }
        
        // Case 1: An image is uploaded by the user for analysis.
        if (isImage) {
            return `
            Lütfen aşağıdaki kriterlere ve sağlanan görsele uygun ${count} adet bilgi yarışması sorusu oluştur:
            - Sınıf Seviyesi: ${grade}. sınıf
            - Kazanım ID: ${kazanımId}
            - Kazanım Metni: "${kazanımText}"
            - Zorluk: ${difficulty}
            - Soru Tipi: ${type}
            - ÖNEMLİ GÖRSEL ANALİZİ: Soru, doğrudan yüklenen görselle ilgili olmalı, görseldeki bir unsuru sormalı veya görseli bir kanıt/ipucu olarak kullandırmalıdır.
            
            KRİTİK TALİMATLAR:
            1. UYGUNLUK: Soru, belirtilen kazanım ID'si ve metnine tam olarak uygun olmalı ve bu kazanımı ölçmelidir.
            2. KAZANIM ID DOĞRULAMA: Oluşturduğun her soru nesnesine, 'kazanımId' alanı olarak girdi olarak verilen '${kazanımId}' değerini ekle.
            3. AÇIKLAMA: Her çoktan seçmeli soru için, doğru cevabın neden doğru olduğunu açıklayan, kısa ve anlaşılır bir 'explanation' metni oluştur.
            4. JSON FORMATI: Yanıtın her zaman bir JSON dizisi (array) formatında olmalıdır. Sadece ve sadece istenen JSON formatında bir yanıt ver.
            `;
        }

        // Case 2: No image uploaded, but user wants AI to generate one.
        if (shouldGenerateImage) {
            const subjectSpecificVisualPromptGuidance: Record<string, string> = {
                'science': `
                - **DERS ÖZEL YAKLAŞIM (FEN BİLİMLERİ):** Görsel, bir deney düzeneğini, biyolojik bir şemayı (hücre, besin ağı vb.), bir fiziksel olayı (kaldıraç sistemi, elektrik devresi) veya verileri içeren bir grafiği göstermelidir. Soru, öğrencinin cevabı bulmak için bu görseli yorumlamasını ZORUNLU kılmalıdır.`,
                'math': `
                - **DERS ÖZEL YAKLAŞIM (MATEMATİK):** Görsel, problemin verilerini sunmalıdır. Geometrik bir şekil, bir grafik, sayı doğrusu, üzerinde sayılar olan nesneler (zarlar, kartlar) veya gerçek hayat senaryosu (fiyat etiketli ürünler) olabilir. Soru, görseldeki verileri kullanarak bir hesaplama yapmayı gerektirmelidir.`
            };
        
            const specificGuidance = subjectSpecificVisualPromptGuidance[subjectId] || '';
        
            return `
            - BÜTÜNLEŞİK SORU TASARIMI: Sen, ${grade}. sınıf öğrencileri için, özellikle Matematik ve Fen Bilimleri alanlarında, görselin sorunun ayrılmaz ve temel bir parçası olduğu yaratıcı sorular hazırlayan uzman bir eğitim materyali geliştiricisisin.
            
            **HEDEF KAZANIM:**
            - ID: ${kazanımId}
            - Metin: "${kazanımText}"
            ${specificGuidance}
        
            **ÜRETİM SÜRECİ (ZORUNLU):**
            1.  **ÖNCE GÖRSELİ TASARLA:** Kazanımı en iyi şekilde ölçen bir senaryo düşün. Bu senaryo için, soruyu çözmek için **GEREKLİ BİLGİLERİ İÇEREN** bir görsel tasarla. Görsel asla bir süsleme olmamalıdır; sorunun verilerini içermelidir (örneğin bir grafikteki sayılar, bir haritadaki anahtar noktalar, bir deney düzeneğindeki etiketler).
            2.  **PROFESYONEL GÖRSEL KOMUTU YAZ ('visualPrompt'):** Tasarladığın bu görseli, bir yapay zeka resim üreticisi için **İngilizce, detaylı, net ve temiz** bir komut olarak yaz. Komut, 'educational infographic style', 'clean diagram', 'simple flat vector illustration' gibi ifadeler içermeli ve gereksiz metinlerden arındırılmış olmalıdır.
            3.  **SORU METNİNİ GÖRSELE BAĞLA:** Soru metnini, ürettiğin bu görsel komutuna doğrudan atıfta bulunacak şekilde yaz. "Yukarıdaki şemaya göre...", "Görselde verilen deney düzeneğine bakarak..." gibi ifadeler kullan.
            4.  **JSON OLARAK PAKETLE:** Tüm bu konsepti, istenen JSON şemasına uygun olarak paketle.
            
            **SENİN GÖREVİN:**
            Şimdi, bu profesyonel yapıyı ve kaliteyi referans alarak, hedef kazanım (${kazanımId}) için ${count} adet YENİ ve ÖZGÜN soru konsepti oluştur. 'visualPrompt' alanı **ASLA** boş bırakılmamalıdır; en soyut kavramlar için bile yaratıcı bir görselleştirme (terazi, bloklar, metaforik çizimler vb.) bulunmalıdır.
            
            **EK KRİTİK TALİMATLAR:**
            - **KAZANIM ID DOĞRULAMA:** Oluşturduğun her soru nesnesine, 'kazanımId' alanı olarak girdi olarak verilen '${kazanımId}' değerini ekle.
            - **JSON FORMATI:** Yanıtın her zaman bir JSON dizisi (array) formatında olmalıdır.
            `;
        }

        // Case 3: Text-only question generation with enhanced subject-specific prompts.
        const subjectSpecificTextPrompts: Record<string, string> = {
          'social-studies': `
          - SORU STİLİ: Sen, ${grade}. sınıf öğrencilerinin eleştirel düşünme ve tarihsel empati becerilerini geliştirmeyi amaçlayan uzman bir Sosyal Bilgiler öğretmenisin. Ezbere dayalı bilgi yerine, neden-sonuç ilişkisi kurmayı gerektiren, bir olayın farklı sonuçlarını değerlendirmeyi isteyen veya tarihî bir karakterin yerine kendini koymayı gerektiren senaryo tabanlı sorular oluştur. Sorular, "Bu durumun en olası sonucu ne olurdu?" veya "Verilen bilgilere göre, aşağıdakilerden hangisi X olayının temel nedenlerinden biri sayılamaz?" gibi analitik düşünmeyi teşvik etmelidir.`,
          'science': `
          - SORU STİLİ: Sen, bilimi sevdiren, deney ve gözleme dayalı sorular hazırlayan deneyimli bir Fen Bilimleri öğretmenisin. Soruları, basit bir deney düzeneği (örneğin, "Bir öğrenci, özdeş iki bitkiden birini aydınlık, diğerini karanlık bir ortama koyuyor...") veya günlük hayattan bir gözlem (örneğin, "Kışın pencerelerin buğulanması...") üzerinden kurgula. Sorular, öğrencilerin sadece tanımı bilmesini değil, bilimsel kavramları (yoğunluk, genleşme, fotosentez vb.) bu senaryolar üzerinden açıklayabilmesini ölçmelidir.`,
          'math': `
          - SORU STİLİ: Sen, öğrencilere matematiğin gerçek hayattaki kullanımını gösteren yaratıcı problemler hazırlayan bir matematik eğitimcisisin. Soruları, günlük yaşamla ilişkili, birden fazla işlem adımı gerektiren ve mantıksal akıl yürütmeye dayalı senaryolar (örneğin bir alışveriş, bir gezi planı, bir tarifin ölçeklendirilmesi vb.) üzerine kur. Sorular, doğrudan formül sormak yerine, öğrencinin problemi anlama ve çözüm stratejisi geliştirme yeteneğini ölçmelidir.`,
          'turkish': `
          - SORU STİLİ: Sen, Türkçenin inceliklerine hâkim bir dil uzmanısın. Soruları, sadece dil bilgisi kuralını sormak yerine, bu kuralın bir metin veya cümle içindeki anlamını ve kullanım amacını sorgulayacak şekilde tasarla. Örneğin, bir deyimin veya atasözünün metne kattığı anlamı, bir fiilimsinin cümleye kattığı zaman veya durum anlamını ya da bir cümlenin ögelerinin vurguyu nasıl değiştirdiğini sorgulayan sorular oluştur. Paragraf sorularından farklı olarak burada odak noktası dilin kendisi ve kullanımı olmalıdır.`
        };

        const defaultTextPrompt = `
            - SORU STİLİ: Sorular, belirtilen kazanımı doğrudan ve net bir şekilde ölçmelidir. Öğrencinin sadece ezber bilgisini değil, aynı zamanda temel kavramları anlama ve uygulama becerisini de test etmelidir. Çeldiriciler, konuyla ilgili ve mantıklı olmalıdır.`;
        
        const specificPrompt = subjectSpecificTextPrompts[subjectId] || defaultTextPrompt;

        return `
        Lütfen aşağıdaki kriterlere uygun, METİN TABANLI ${count} adet bilgi yarışması sorusu oluştur:
        - Sınıf Seviyesi: ${grade}. sınıf
        - Kazanım ID: ${kazanımId}
        - Kazanım Metni: "${kazanımText}"
        - Zorluk: ${difficulty}
        - Soru Tipi: ${type}
        ${specificPrompt}
        
        KRİTİK TALİMATLAR:
        1.  BAĞIMSIZ SORU: Bu sorular için bir görsel VEYA harici bir metin referansı yoktur. Soru metinleri "resme göre", "metne göre", "parçaya göre" gibi ifadelere KESİNLİKLE atıfta bulunmamalıdır. Her soru, kendi içinde bağımsız ve anlaşılır olmalıdır.
        2.  'visualPrompt' ALANINI BOŞ BIRAK: JSON çıktısında 'visualPrompt' alanı bulunuyorsa, bu alanı boş bir string ("") olarak bırak veya hiç ekleme.
        3.  UYGUNLUK: Soru, belirtilen kazanım ID'si ve metnine tam olarak uygun olmalı ve bu kazanımı ölçmelidir.
        4.  KAZANIM ID DOĞRULAMA: Oluşturduğun her soru nesnesine, 'kazanımId' alanı olarak girdi olarak verilen '${kazanımId}' değerini ekle.
        5.  AÇIKLAMA: Her çoktan seçmeli soru için, doğru cevabın neden doğru olduğunu açıklayan, kısa ve anlaşılır bir 'explanation' metni oluştur.
        6.  JSON FORMATI: Yanıtın her zaman bir JSON dizisi (array) formatında olmalıdır. Sadece ve sadece istenen JSON formatında bir yanıt ver.
      `;
    };

    let prompt;
    const template = promptTemplates[kazanımId];

    // Özel şablonlar genellikle görsel odaklı olduğundan, sadece görsel üretme istendiğinde kullan
    if (template && shouldGenerateImage) {
        console.log(`"${kazanımId}" için özel prompt şablonu bulundu ve kullanılıyor.`);
        prompt = template;
    } else {
        // Genel mantığa geri dön
        if (subjectId === 'paragraph') {
            prompt = getParagraphPrompt(skill);
        } else if (subjectId === 'english') {
            prompt = getEnglishPrompt();
        } else {
            prompt = getTurkishPrompt(subjectId, !!documentData, shouldGenerateImage, generationContext);
        }
    }
  
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: prompt }];
  if (documentData) {
    // PDF veya resim verisi, metin prompt'undan önce eklenmelidir.
    parts.unshift({ inlineData: { mimeType: documentData.mimeType, data: documentData.data } });
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
  // FIX: Removed API key rotation logic to comply with guidelines. Errors are now re-thrown.
  } catch (error) {
    console.error(`Soru üretimi sırasında bir hata oluştu:`, error);
    throw error;
  }
};

export const generateImageForQuestion = async (
    visualPrompt: string
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

    // FIX: Removed API key rotation logic to comply with guidelines. Errors are now re-thrown.
    } catch (error) {
        console.error(`Görsel üretimi sırasında bir hata oluştu:`, error);
        
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("Görsel üretimi için kota limitine ulaşıldı. Bu durum, kısa sürede çok fazla istek gönderildiğinde veya API anahtarınızın ücretsiz kullanım limitini doldurduğunda meydana gelebilir. Lütfen `process.env.API_KEY` değişkeninizi ve Google Cloud projenizin faturalandırma durumunu kontrol edin.");
        }
        
        return null; // For other non-quota errors, fail gracefully
    }
};


export const extractQuestionFromImage = async (
    imageData: { mimeType: string; data: string }
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
    // FIX: Removed API key rotation logic to comply with guidelines. Errors are now re-thrown.
    } catch(error) {
        console.error(`Görselden soru çıkarılırken bir hata oluştu:`, error);
        throw error;
    }
};

export const extractTopicsFromPDF = async (
    pdfData: { mimeType: string; data: string }
): Promise<string[]> => {
    const promptText = `
        Sen, eğitim materyallerini analiz eden, NotebookLM gibi derinlemesine anlama yeteneğine sahip uzman bir yapay zekasın.
        Sana bir ders kitabından alınmış bir PDF dokümanı sunuluyor.

        Görevin:
        1.  Dokümanın içeriğini dikkatlice analiz et. Sadece başlıklara değil, metnin geneline odaklan.
        2.  Metindeki ana ünite veya ana tema başlığını belirle.
        3.  Bu ana tema altındaki temel alt konuları, anahtar kavramları, önemli tanımları, özel isimleri ve tarihleri çıkar.
        4.  Bulduğun tüm bu başlık ve kavramları, öğretmenin soru üretmek için seçebileceği anlamlı bir liste halinde topla.
        5.  Sonucu, sadece ve sadece bu başlıkları içeren bir JSON dizisi (array) olarak döndür.
        
        Örnek Çıktı Formatı:
        ["Türkistan’da Kurulan İlk Türk Devletleri", "Asya Hun Devleti", "Köktürk Devleti", "Uygur Devleti", "İpek Yolu'nun Önemi"]
        
        Başka hiçbir açıklama, giriş metni veya not eklemeden, sadece JSON dizisini döndür. Çıktın temiz ve doğrudan kullanılabilir olmalı.
    `;

    const contents = {
        parts: [
            { inlineData: { mimeType: pdfData.mimeType, data: pdfData.data } },
            { text: promptText }
        ]
    };

    const responseSchema = {
        type: Type.ARRAY,
        items: { type: Type.STRING },
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
    // FIX: Removed API key rotation logic to comply with guidelines. Errors are now re-thrown.
    } catch (error) {
        console.error(`PDF'ten konu başlıkları çıkarılırken bir hata oluştu:`, error);
        throw error;
    }
};

export const generatePromptTemplateForKazanım = async (
    kazanımId: string,
    kazanımText: string
): Promise<string> => {
    
    const masterPrompt = `
You are a master AI prompt engineer and an expert in instructional design. Your mission is to create a "master prompt template" for a specific Turkish educational outcome (kazanım). This template will serve as a blueprint for another AI (Gemini) to generate world-class, visually-integrated quiz questions.

**Target Learning Outcome (Kazanım):**
- **ID:** ${kazanımId}
- **Text:** "${kazanımText}"

**Instructions for the "Master Prompt Template" you will generate:**

1.  **AI Persona:** The template must start by assigning a clear, expert persona to the AI (e.g., "You are an 8th-grade physics teacher and a specialist in creating visual-based problems.").
2.  **Visual-First Pedagogy:** The core instruction must enforce a "visual-first" design process. The AI must be instructed to:
    a.  First, devise a creative, real-world or conceptual scenario that assesses the learning outcome.
    b.  Second, conceptualize a visual element (diagram, chart, infographic, map) that is **ESSENTIAL** for solving the problem. The visual must contain the data or context; it cannot be decorative.
    c.  Third, write the question text which **relies on interpreting the visual**.
3.  **Create a Perfect Example:** The template MUST include a complete, high-quality, and creative example of the final JSON output.
    *   This example must be perfectly aligned with the target learning outcome (${kazanımId}).
    *   The "kazanımId" field in the example must be exactly "${kazanımId}".
    *   The "question" must refer to the visual (e.g., "According to the diagram...").
    *   The "visualPrompt" must be a highly detailed, professional, and clear prompt in **ENGLISH** for an image generation AI. It should describe a clean, educational-style graphic with NO TEXT unless it's part of a diagram's labels. Use terms like 'clean vector art', 'infographic style', 'educational diagram'.
    *   The "options", "answer", and "explanation" must be accurate and well-crafted.
4.  **Instruct for Generalization:** After providing the perfect example, the template must explicitly instruct the AI to use that example as a quality benchmark, but to generate a **COMPLETELY NEW and ORIGINAL question** with a different scenario, different data, and a different visual concept for the *same* learning outcome.
5.  **Output Format:** Your final output must be ONLY the string for the master prompt template, formatted as a key-value pair ready for a TypeScript object. Example: \`'${kazanımId}': \`...\`,\`. Do not add any other text, explanation, or markdown formatting outside of this.

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

Now, generate the professional master prompt template for kazanım **${kazanımId}**.
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
    // FIX: Removed API key rotation logic to comply with guidelines. Errors are now re-thrown.
    } catch(error) {
        console.error(`Prompt şablonu üretilirken bir hata oluştu:`, error);
        throw error;
    }
};