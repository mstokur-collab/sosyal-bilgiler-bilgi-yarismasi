// BU DOSYA ARTIK KULLANILMIYOR.
// API anahtarı yönetimi, daha güvenli bir yöntem olan `process.env.API_KEY`
// ortam değişkeni kullanılarak doğrudan `services/geminiService.ts` dosyası
// içinde gerçekleştirilmektedir. Bu değişiklik, API anahtarlarının
// koda gömülmesini engelleyerek güvenliği artırmaktadır.
// Bu dosyayı projenizden silebilirsiniz.

export const subjectApiKeys: Record<string, string> = {};
export const defaultApiKey = process.env.API_KEY || '';
