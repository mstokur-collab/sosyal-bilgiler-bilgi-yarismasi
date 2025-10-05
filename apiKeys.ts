// --- API Anahtar Yönetimi ---
// Bu dosyaya, her bir ders için ayrı ayrı Gemini API anahtarlarınızı girebilirsiniz.
// Bu, Google'ın kota limitlerine takılmadan daha fazla soru üretmenize olanak tanır.
// Eğer sadece bir adet API anahtarınız varsa, onu aşağıdaki `defaultApiKey` alanına yapıştırmanız yeterlidir.
// Sistem, bir derse özel anahtar bulamazsa otomatik olarak `defaultApiKey`'i kullanacaktır.

export const subjectApiKeys: Record<string, string> = {
  // Lütfen tırnak işaretlerinin ('') arasına kendi API anahtarlarınızı yapıştırın.
  'social-studies': 'AIzaSyDPasBMHG6-T8Rilg06xmfhwkwClSqdnYg', // <-- Sosyal Bilgiler API Anahtarınız
  'math': 'AIzaSyAQgZB22xThNCqsmjfgAIJFmuWv4nKSOxY',           // <-- Matematik API Anahtarınız
  'science': 'AIzaSyA863DSKi8dVUcs8a_d0ciKqqOcf8J_y8E',        // <-- Fen Bilimleri API Anahtarınız
  'turkish': 'AIzaSyA9pXHICAieT_0cPkjQVMEhbY3qt9_naFQ',        // <-- Türkçe API Anahtarınız
  'english': 'AIzaSyAz5wgB3JGcjzDu9Z7w93RMy0y6Wjyjzo4',        // <-- İngilizce API Anahtarınız
  'paragraph': 'AIzaSyBqh3LG-EBkGujZXrHJW3fFL_jidz1svlM',      // <-- Paragraf Soru Bankası API Anahtarınız
};

// Yukarıda bir derse özel anahtar belirtilmemişse veya bulunamazsa kullanılacak
// varsayılan (yedek) API anahtarı.
export const defaultApiKey = 'AIzaSyCSl_xSycRRGOAnPjHGPNHvPmauKW35iWI'; // <-- Genel veya tek API Anahtarınızı buraya yapıştırın