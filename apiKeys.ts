// --- API Anahtar Yönetimi ---
// Bu dosyaya, her bir ders için ayrı ayrı Gemini API anahtarlarınızı girebilirsiniz.
// Bu, Google'ın kota limitlerine takılmadan daha fazla soru üretmenize olanak tanır.
// Eğer sadece bir adet API anahtarınız varsa, onu aşağıdaki `defaultApiKey` alanına yapıştırmanız yeterlidir.
// Sistem, bir derse özel anahtar bulamazsa otomatik olarak `defaultApiKey`'i kullanacaktır.

export const subjectApiKeys: Record<string, string> = {
  // Lütfen tırnak işaretlerinin ('') arasına kendi API anahtarlarınızı yapıştırın.
  'social-studies': 'AIzaSyCSl_xSycRRGOAnPjHGPNHvPmauKW35iWI', // <-- Sosyal Bilgiler API Anahtarınız
  'math': 'AIzaSyAJMXhd0pjkg31x0eNFADLaBHg74PpL1sA',           // <-- Matematik API Anahtarınız
  'science': 'AIzaSyAJMXhd0pjkg31x0eNFADLaBHg74PpL1sA',        // <-- Fen Bilimleri API Anahtarınız
  'turkish': 'AIzaSyAJMXhd0pjkg31x0eNFADLaBHg74PpL1sA',        // <-- Türkçe API Anahtarınız
  'english': 'AIzaSyAJMXhd0pjkg31x0eNFADLaBHg74PpL1sA',        // <-- İngilizce API Anahtarınız
};

// Yukarıda bir derse özel anahtar belirtilmemişse veya bulunamazsa kullanılacak
// varsayılan (yedek) API anahtarı.
export const defaultApiKey = 'AIzaSyAJMXhd0pjkg31x0eNFADLaBHg74PpL1sA'; // <-- Genel veya tek API Anahtarınızı buraya yapıştırın
