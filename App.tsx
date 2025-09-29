import React, { useState, useEffect, useCallback } from 'react';
// FIX: Imported 'CompetitionMode' type to resolve a 'Cannot find name' error on line 77.
import type { ScreenId, Question, HighScore, GameSettings, QuestionType, CompetitionMode } from './types';
import { Screen, Button, BackButton, DeveloperSignature } from './components/UI';
import { GameScreen } from './components/QuizComponents';
import { TeacherPanel } from './components/TeacherPanel';
import { curriculumData } from './data/curriculum';

// --- Initial Data & LocalStorage Hook ---

const initialQuestions: Question[] = [
  {
    "id": 1759001132983,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "type": "quiz",
    "question": "Murat, zamanında gelerek derslerine girmektedir. Derslerden önce 2 gün anlatacağı konulara hazırlık yapmaktadır. Teneffüslerde nöbetçi olduğu gün nöbetini tutarken kendisine gelen soruları cevaplamaktadır. Öğrencileri tarafından çok sevilmektedir. Buna göre Murat'ın üyesi olduğu grup ve sahip olduğu rol aşağıdakilerden hangisinde doğru verilmiştir?",
    "options": [
      "Üyesi Olduğu Grup: Okul, Sahip Olduğu Rol: Öğretmen",
      "Üyesi Olduğu Grup: Arkadaş, Sahip Olduğu Rol: Öğrenci",
      "Üyesi Olduğu Grup: Sınıf, Sahip Olduğu Rol: Okul müdürü",
      "Üyesi Olduğu Grup: Hastane, Sahip Olduğu Rol: Nöbetçi doktor"
    ],
    "answer": "Üyesi Olduğu Grup: Okul, Sahip Olduğu Rol: Öğretmen",
    "difficulty": "kolay"
  },
  {
    "id": 1759001132984,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "type": "quiz",
    "question": "İnsanlar, hayatları boyunca çeşitli gruplar içinde farklı roller üstlenirler. Bir kişi, ailede anne, iş hayatında doktor, okulda öğrenci, markette müşteri gibi çeşitli rollere sahip olabilir. Bu roller, bireylerin davranışlarını şekillendirir ve uygun davranış sergilemesi toplum tarafından beklenir. Örneğin, öğrenci rolündeki birinin derslerine düzenli çalışması beklenir ve bu, doğru bir davranıştır. Ayrıca, bir müşteri olarak markette saygılı olmak ve kasada sıraya girmek de uygun bir davranış şeklidir. Buna göre aşağıdakilerden hangisine ulaşılamaz?",
    "options": [
      "İnsanların sahip olduğu roller beraberinde sorumluluklar getirebilir.",
      "Bazı rollerin sorumlulukları diğer sorumluluklardan daha önemlidir.",
      "Bir kişi aynı anda birden fazla role ve sorumluluğa sahip olabilir.",
      // FIX: Corrected typo from "grupara" to "gruplara".
      "Sahip olunan roller, gruplara göre farklılık gösterebilir."
    ],
    "answer": "Bazı rollerin sorumlulukları diğer sorumluluklardan daha önemlidir.",
    "difficulty": "orta"
  },
  {
    "id": 1759001132985,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "type": "quiz",
    "question": "Sosyal bilgiler öğretmeni 6/A sınıfında gruplar ve roller konusunu işlerken öğrencilerine sahip olduğu rolleri sormuş ve cevapları tahtaya yazmıştır. Ardından, gelecekte sahip olmak istedikleri rolleri de defterlerine nedenleri ile birlikte yazmalarını istemiştir. Buna göre 6/A sınıfı öğrencileri aşağıdaki rollerden hangisini gelecekte sahip olmak istedikleri rol olarak defterlerine yazmış olabilirler?",
    "options": [
      "Nöbetçi",
      "Bilim insanı",
      "Sınıf başkanı",
      "Oyun arkadaşı"
    ],
    "answer": "Bilim insanı",
    "difficulty": "kolay"
  },
  {
    "id": 1759001132986,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "type": "quiz",
    "question": "Demir ailesinin ikinci çocuğu olarak dünyaya gelen Hasan, Atatürk Ortaokulu 6. sınıf öğrencisidir. Okul takımının kaptanlığını yapan Hasan, şehrin en iyi futbol takımında forvet olarak oynamaktadır. Annesi, babası, dedesi ve ablası Hasan'ın maçlarını izlemeye gelmektedir. Buna göre aşağıdaki yargılardan hangisine ulaşılabilir?",
    "options": [
      "Aynı anda birden fazla gruba ve role sahip olunabilir.",
      "Sahip olunan rollerin tamamı sonradan kazanılan rollerdir.",
      "Farklı rollere sahip olunsa da sorumluluklar hep aynı kalmaktadır.",
      "Hayat boyunca üye olunan gruplar ve rollerde değişim yaşanmamaktadır."
    ],
    "answer": "Aynı anda birden fazla gruba ve role sahip olunabilir.",
    "difficulty": "kolay"
  },
  {
    "id": 1759001132987,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "type": "quiz",
    "question": "Doğuştan kazanılan ve insanların seçme şansı olmadığı grup ve roller vardır. Doğum ile üye olunan bu grupta rol de doğum ile birlikte gelir. Bu duruma aşağıdaki grup ve rollerden hangisi örnek gösterilebilir?",
    "options": [
      "Üyesi Olduğu Grup: Aile, Sahip Olduğu Rol: Evlat",
      "Üyesi Olduğu Grup: Arkadaş, Sahip Olduğu Rol: Oyuncu",
      "Üyesi Olduğu Grup: Sınıf, Sahip Olduğu Rol: Öğrenci",
      "Üyesi Olduğu Grup: Hastane, Sahip Olduğu Rol: Hemşire"
    ],
    "answer": "Üyesi Olduğu Grup: Aile, Sahip Olduğu Rol: Evlat",
    "difficulty": "kolay"
  },
  {
    "id": 1759001220217,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "type": "quiz",
    "question": "Verilen zaman çizelgesine göre Elif ile ilgili aşağıdakilerden hangisine ulaşılamaz?",
    "options": [
      "Doğuştan üyesi olduğu grup ve rolleri vardır.",
      "Gelecek yıllarda farklı rollere sahip olacaktır.",
      "Aile ve okul grubunda rollere sahip olmuştur.",
      "Zaman içerisinde rolleri değişikliğe uğramıştır."
    ],
    "answer": "Doğuştan üyesi olduğu grup ve rolleri vardır.",
    "difficulty": "orta"
  },
  {
    "id": 1759001220218,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "type": "quiz",
    "question": "Aşağıdaki tabloda rol ve rolün bireye katkısı eşleştirilmiştir: Verilen tabloda kaç numaralı eşleştirmede hata yapılmıştır?",
    "options": [
      "I",
      "II",
      "III",
      "IV"
    ],
    "answer": "III",
    "difficulty": "orta"
  },
  {
    "id": 1759001220219,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "type": "quiz",
    "question": "On iki yaşındaki Arda, babası, annesi ve kardeşiyle birlikte akşam yemeğini yedi. Sonrasında odasına geçip ödevlerini tamamladı. Ertesi gün okulda derslerine odaklanarak öğretmeninin anlattıklarını dikkatle dinledi ve grup çalışmasında aktif rol aldı. Teneffüslerde arkadaşlarıyla basketbol oynadı. Bu anlatıma göre aşağıdakilerden hangisi Arda’nın sahip olduğu haklardan biri olarak gösterilebilir?",
    "options": [
      "Derslerini dikkatli bir şekilde dinlemek",
      "Grup çalışmasında üzerine düşeni yapmak",
      "Ödevlerini eksiz olarak zamanında yapmak",
      "Boş zamanlarında arkadaşlarıyla oynamak"
    ],
    "answer": "Boş zamanlarında arkadaşlarıyla oynamak",
    "difficulty": "orta"
  },
  {
    "id": 1759001220220,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "type": "quiz",
    "question": "Okul ve sınıf grupları insan yaşamında önemli bir yere sahiptir. Aileden sonra üye olunan gruplardan olan okul ve sınıf gruplarında çeşitli roller üstlenilir. Bu bilgiden hareketle bireyler, I. Öğrenci II. Nöbetçi III. Öğretmen rollerinden hangilerini okul ve sınıf gruplarında üstlenebilir?",
    "options": [
      "I ve II",
      "I ve III",
      "II ve III",
      "I, II ve III"
    ],
    "answer": "I ve II",
    "difficulty": "kolay"
  },
  {
    "id": 1759001220221,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "type": "quiz",
    "question": "İnsanlar doğar ve büyür. Bu süreç uzun yıllar devam eder. Doğum anından itibaren insanlar çeşitli gruplara üye olunur. Bazı gruplara doğuştan üye olunurken bazı gruplara üye olmak insanların kendi seçimleridir. Üye olunan gruplarda insanlar roller üstlenir. Yaşam boyunca gruplar ve üstlenilen roller değişime uğrayabilir. İnsanların yaşları üye olunan grupların ve sahip olunan rollerin değişmesinde etki eden faktörlerden biridir. Buna göre 6. sınıfa giden bir öğrencinin aşağıdakilerde rolllerden hangisine sahip olması beklenemez?",
    "options": [
      "Abi",
      "Evlat",
      "Dede",
      "Torun"
    ],
    "answer": "Dede",
    "difficulty": "kolay"
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Aşağıdaki tabloda rol ve rolün bireye katkısı eşleştirilmiştir:\nI. Sınıf başkanı - İş birliği ve liderlik özelliklerinin gelişmesini sağlar.\nII. Anne - Birlikte yaşama ve dayanışmaya eğitir.\nIII. Müzisyen - Çevre sorunlarına karşı duyarlı bir birey olmaya katkı sağlar.\nIV. Sporcu - Hem bedensel hem sosyal beceriyi geliştirir.\n\nVerilen tabloda kaç numaralı eşleştirmede hata yapılmıştır?",
    "options": [
      "I",
      "II",
      "III",
      "IV"
    ],
    "answer": "II",
    "id": 1759007353568
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "On iki yaşındaki Arda, babası, annesi ve kardeşiyle birlikte akşam yemeğini yedi. Sonrasında odasına geçip ödevlerini tamamladı. Ertesi gün okulda derslerine odaklanarak öğretmeninin anlattıklarını dikkatle dinledi ve grup çalışmasında aktif rol aldı. Teneffüste ise arkadaşleriyle basketbol oynadı. Bu anlatıma göre aşağıdakilerden hangisi Arda'nın sahip olduğu haklardan biri olarak gösterilebilir?",
    "options": [
      "Derslerini dikkatli bir şekilde dinlemek",
      "Grup çalışmasında üzerine düşeni yapmak",
      "Ödevlerini eksiz olarak zamanında yapmak",
      "Boş zamanlarında arkadaşleriyle oynamak"
    ],
    "answer": "Boş zamanlarında arkadaşleriyle oynamak",
    "id": 1759007353569
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Okul ve sınıf grupları insan yaşamında önemli bir yere sahiptir. Aileden sonra üye olunan gruplardan olan okul ve sınıf gruplarında çeşitli roller üstlenilir. Bu bilgiden hareketle bireyler;\nI. Öğrenci\nII. Nöbetçi\nIII. Öğretmen\nrollerinden hangilerini okul ve sınıf gruplarında üstlenebilir?",
    "options": [
      "I ve II",
      "I ve III",
      "II ve III",
      "I, II ve III"
    ],
    "answer": "I ve II",
    "id": 1759007353570
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "İnsanlar doğar ve büyür. Bu süreç uzun yıllar devam eder. Doğum anından itibaren insanlar çeşitli gruplara üye olurlar. Bazı gruplara doğuştan üye olunurken bazı gruplara üye olmak insanların kendi seçimleridir. Üye olunan gruplarda insanlar roller üstlenir. Yaşam boyunca gruplar ve üstlenilen roller değişime uğrayabilir. İnsanların yaşları üye olunan grupların ve sahip olunan rollerin değişmesinde etki eden faktörlerden biridir. Buna göre 6. sınıfa giden bir öğrencinin aşağıdakilerden hangisine sahip olması beklenmez?",
    "options": [
      "Dede",
      "Evlat",
      "Abi",
      "Torun"
    ],
    "answer": "Dede",
    "id": 1759007353571
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Murat, zamanında gelerek derslerine girmektedir. Derslerinden önce o gün anlatacağı konulara hazırlık yapmaktadır. Teneffüslerde nöbetçi olduğu gün nöbetini tutarken kendisine gelen soruları cevaplamaktadır. Öğrencileri tarafından çok sevilmektedir. Buna göre Murat’ın üyesi olduğu grup ve sahip olduğu rol aşağıdakilerden hangisinde doğru verilmiştir?",
    "options": [
      "Üyesi Olduğu Grup: Okul, Sahip Olduğu Rol: Öğretmen",
      "Üyesi Olduğu Grup: Arkadaş, Sahip Olduğu Rol: Öğrenci",
      "Üyesi Olduğu Grup: Sınıf, Sahip Olduğu Rol: Okul müdürü",
      "Üyesi Olduğu Grup: Hastane, Sahip Olduğu Rol: Nöbetçi doktor"
    ],
    "answer": "Üyesi Olduğu Grup: Arkadaş, Sahip Olduğu Rol: Öğrenci",
    "id": 1759007353572
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "İnsanlar, hayatları boyunca çeşitli gruplar içinde farklı roller üstlenirler. Bir kişi, ailede anne, iş hayatında doktor, okulda öğrenci, markette müşteri gibi çeşitli rollere sahip olabilir. Bu roller, bireylerin davranışlarını şekillendirir ve uygun davranışı sergilemesi beklenir. Örneğin, öğrenci rolündeki birinin derslerini düzenli çalışması beklenir ve bu doğru bir davranıştır. Ayrıca, bir müşteri olarak markette saygılı olmak ve kasada sıraya girmek de uygun bir davranış şeklidir. Buna göre aşağıdakilerden hangisine ulaşılamaz?",
    "options": [
      "İnsanların sahip olduğu roller beraberinde sorumluluklar getirebilir.",
      "Bazı rollerin sorumlulukları diğer sorumluluklardan daha önemlidir.",
      "Bir kişi aynı anda birden fazla role ve sorumluluğa sahip olabilir.",
      "Sahip olunan roller, gruplara göre farklılık gösterebilir."
    ],
    "answer": "Bazı rollerin sorumlulukları diğer sorumluluklardan daha önemlidir.",
    "id": 1759007353573
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Sosyal bilgiler öğretmeni 6/A sınıfında gruplar ve roller konusunu işlerken öğrencilerine sahip olduğu rolleri sormuş ve cevapları tahtaya yazmıştır. Ardından, gelecekte sahip olmak istedikleri rolleri de defterlerine nedenleri ile birlikte yazmalarını istemiştir. Buna göre 6/A sınıfı öğrencilerinin aşağıdaki rollerden hangisini gelecekte sahip olmak istedikleri rol olarak defterlerine yazmış olabilirler?",
    "options": [
      "Nöbetçi",
      "Bilim insanı",
      "Sınıf başkanı",
      "Oyun arkadaşı"
    ],
    "answer": "Bilim insanı",
    "id": 1759007353574
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Demir ailesinin ikinci çocuğu olarak dünyaya gelen Hasan, Atatürk Ortaokulu 6. sınıf öğrencisidir. Okul takımının kaptanlığını yapan Hasan, şehrin en iyi futbol takımında forvet olarak oynamaktadır. Annesi, babası, dedesi ve ablası Hasan'ın maçlarını izlemeye gelmektedir. Buna göre aşağıdaki yargılardan hangisine ulaşılabilir?",
    "options": [
      "Aynı anda birden fazla gruba ve role sahip olunabilir.",
      "Sahip olunan rollerin tamamı sonradan kazanılan rollerdir.",
      "Farklı rollere sahip olunsa da sorumluluklar hep aynı kalmaktadır.",
      "Hayat boyunca üye olunan gruplar ve rollerde değişim yaşanmamaktadır."
    ],
    "answer": "Aynı anda birden fazla gruba ve role sahip olunabilir.",
    "id": 1759007353575
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Doğuştan kazanılan ve insanların seçme şansı olmadığı grup ve roller vardır. Doğum ile üye olunan bu grupla rol de doğum ile birlikte gelir. Bu duruma aşağıdaki grup ve rollerden hangisi örnek gösterilebilir?",
    "options": [
      "Üyesi Olduğu Grup: Aile, Sahip Olduğu Rol: Evlat",
      "Üyesi Olduğu Grup: Arkadaş, Sahip Olduğu Rol: Oyuncu",
      "Üyesi Olduğu Grup: Sınıf, Sahip Olduğu Rol: Öğrenci",
      "Üyesi Olduğu Grup: Hastane, Sahip Olduğu Rol: Hemşire"
    ],
    "answer": "Üyesi Olduğu Grup: Aile, Sahip Olduğu Rol: Evlat",
    "id": 1759007353576
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Verilen gruplar ve roller bilgi grafiğine göre aşağıdaki yargılardan hangisine ulaşılabilir?\n(Grafik: Aile [Kardeş, Abi, Abla, Anne, Baba], Akraba [Teyze, Dayı, Hala, Yeğen, Dede, Torun], Arkadaş [Oyun arkadaşı, Mahalle arkadaşı, Okul arkadaşı], Sınıf [Öğrenci, Nöbetçi, Başkan, Başkan yardımcısı])",
    "options": [
      "Sonradan kazanılan roller, doğuştan gelen rollerden daha önemlidir.",
      "İnsanlar hayatları boyunca farklı gruplarda farklı rollere sahip olabilirler.",
      "Öğrenci ve arkadaş rolleri doğuştan kazanılan roller arasında gösterilebilir.",
      "Bireylerin yaşamlarında üyesi oldukları gruplarda değişim olmamaktadır."
    ],
    "answer": "İnsanlar hayatları boyunca farklı gruplarda farklı rollere sahip olabilirler.",
    "id": 1759007353577
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "İlkokul ve ortaokul yılları hakkında çok şey hatırlamayan Mehmet, lise ve üniversite yıllarını babasına yardım ederek geçirdiğini ve mesleği hakkında ilk deneyimleri öğrendiğini gayet iyi hatırlıyordu. Makine mühendisi olarak çalıştığı kurumda çalışanlara verdiği eğitimlerde sık sık bu anılara yer veriyordu. Torunlarına da bu anılardan bahsediyordu. Mesleğinin son aylarını yaşayan Mehmet, yıl sonunda emekli olacaktı. Buna göre Mehmet zaman içerisinde;\nI. Evlat\nII. Dede\nIII. Öğrenci\nIV. Arkadaş\nrollerinden hangilerine sahip olmuştur?",
    "options": [
      "I, II ve III",
      "I, III ve IV",
      "II, III ve IV",
      "I, II, III ve IV"
    ],
    "answer": "I, II, III ve IV",
    "id": 1759007353578
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Verilen tabloda aşağıdaki Grup, Rol ve Sorumluluk eşleştirmelerinden hangisinde hata yapılmıştır?\nI. Grup: Akraba, Rol: Torun, Sorumluluk: Büyüklerine karşı saygılı davranmak\nII. Grup: Okul, Rol: Öğretmen, Sorumluluk: Ödevlerini eksiksiz şekilde yapmak\nIII. Grup: Koro, Rol: Bağlamacı, Sorumluluk: Türkülerde sırası geldiğinde bağlama çalmak\nIV. Grup: Resim, Rol: Katılımcı, Sorumluluk: Eğitmenin verdiği görevleri yerine getirmek",
    "options": [
      "I",
      "II",
      "III",
      "IV"
    ],
    "answer": "II",
    "id": 1759007353579
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Sosyal bilgiler öğretmeni, 6. sınıf öğrencilerine etkileşimli tahtadan aşağıdaki rol kartlarını (Öğrenci, Aşçı, Polis, Doktor) açmıştır. Sorumluluklar:\n- Toplumun huzur ve güvenliğini sağlamak\n- Hastaneye gelen hastaları tedavi etmek\n- Ödevlerini zamanında ve eksiksiz yapmak\nBu rol kartları ile verilen sorumluluklar eşleştirildiğinde hangi rol kartı açıkta kalır?",
    "options": [
      "Öğrenci",
      "Polis",
      "Aşçı",
      "Doktor"
    ],
    "answer": "Aşçı",
    "id": 1759007353580
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Verilen görsel ve bilgilere göre aşağıdakilerden hangisine ulaşılabilir?\n(Görsel bilgileri: Erdem, 1969 yılında dünyaya geldi. İlkokulda okulun basketbol takımında oynadı. Eğitim hayatı boyunca kitaplarla arası hep iyi oldu. Üniversiteyi başka bir şehirde okudu ve avukat oldu. Avukat olarak uzun yıllar mesleğini başarı ile yaptı. Avukatlıktan emekli olan Erdem emekliliğin tadını çıkartıyor.)",
    "options": [
      "Bireylerin rollerinin zaman içerisinde değişebileceğine",
      "Rollerin getirdikleri hak ve sorumlulukların bulunduğuna",
      "İnsanların yaşamında rollerin aynı sıra ile devam ettiğine",
      "Erdem’in yaşamında avukatlığın diğer rollerden önemli olduğuna"
    ],
    "answer": "Bireylerin rollerinin zaman içerisinde değişebileceğine",
    "id": 1759007353581
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Bireyler sahip olduğu rollerin bazılarını doğuştan elde ederken bazılarını da sosyal statüsüne göre sonradan kazanır. Aşağıdakilerden hangisi bireylerin doğuştan kazandığı sosyal rollerden biridir?",
    "options": [
      "Kardeş",
      "Öğretmen",
      "Futbolcu",
      "Memur"
    ],
    "answer": "Kardeş",
    "id": 1759008691061
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Evli ve iki çocuk annesi Ayşe Hanım, çocukları büyüdükten sonra çalışmaya karar vermiştir. Özel bir firmanın Ankara-İstanbul arası yolcu taşıyan otobüslerini sürmeye başlamış, böylece anne ve eş gibi sosyal rollerine kaptanlık rolü de eklenmiştir. Buna göre sosyal rollerle ilgili aşağıdakilerden hangisi söylenebilir?",
    "options": [
      "Zamana bağlı olarak değişebilir.",
      "Kişinin yaşından bağımsız olarak kazanılır.",
      "Her rolün gerektirdiği sorumluluk aynıdır.",
      "Sadece çalışan kişiler sosyal role sahip olabilirler."
    ],
    "answer": "Zamana bağlı olarak değişebilir.",
    "id": 1759008691062
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Bireyler sahip olduğu rollerin bazılarını doğuştan elde ederken bazılarını da sosyal statüsüne göre sonradan kazanır. Aşağıdakilerden hangisi bireylerin doğuştan kazandığı sosyal rollerdendir?",
    "options": [
      "Polislik",
      "Müzisyenlik",
      "Gazetecilik",
      "Kardeşlik"
    ],
    "answer": "Kardeşlik",
    "id": 1759008691063
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "\"Atatürk Ortaokulu 5. sınıf öğrencisiyim. Annem, babam, dedem ve kardeşimle beraber yaşıyorum.\" Metne göre aşağıdakilerden hangisi Aslı'nın üstlendiği rollerden biri değildir?",
    "options": [
      "Evlat",
      "Öğrenci",
      "Abi",
      "Torun"
    ],
    "answer": "Abi",
    "id": 1759008691064
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Ahmet Bey, gün boyu doktor rolünü üstlendikten sonra akşam taksiyle eve giderken müşteri rolündedir. Evine geldiğinde ise çocuklarına karşı baba rolündedir. En büyük kızı evlenince kayınbaba olmuştur. Buna göre sosyal rollerle ilgili, I. Zaman içinde değişebilir. II. Bazıları sonradan kazanılır. III. Aynı anda farklı rollere sahip olabilir. yargılarından hangilerine ulaşılabilir?",
    "options": [
      "Yalnız I.",
      "I ve III.",
      "II ve III.",
      "I, II ve III."
    ],
    "answer": "I, II ve III.",
    "id": 1759008691065
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Birey olarak dünyaya geldiğimiz andan itibaren çeşitli roller üstleniriz. Rollerimizin bir kısmı doğuştan sahip olduğumuz rollerdir. Bazı rollerimiz de vardır ki bunlara isteğimizle çalışarak, başarı göstererek sonradan sahip oluruz. Bunlar özgür irademizle katıldığımız grupların bize yüklediği rollerdir. Yukarıda verilen açıklamaya göre aşağıdakilerden hangisi sonradan kendi isteğimizle elde ettiğimiz rollerdendir?",
    "options": [
      "Kardeş",
      "Abla",
      "Anne - Baba",
      "Torun"
    ],
    "answer": "Anne - Baba",
    "id": 1759008691066
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Aşağıdakilerden hangisi evdeki rollerimize uygun bir hakkımızdır?",
    "options": [
      "Evlat olarak güvenli bir ortamda yaşamak",
      "Evlat olarak odamızı temiz tutmak",
      "Öğrenci olarak eğitim imkânlarından yararlanmak",
      "Müşteri olarak alışveriş yapmak"
    ],
    "answer": "Evlat olarak güvenli bir ortamda yaşamak",
    "id": 1759008691067
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Herkes ait olduğu gruba göre farklı roller üstlenmiştir ve bu roller zaman içerisinde değişebilir. Aşağıdakilerden hangisi bu duruma örnek olarak gösterilebilir?",
    "options": [
      "Ben bir okulda öğretmen olarak çalışıyorum. Öğrencilerimi çok seviyorum.",
      "Evin tek çocuğu olarak anneme ev işlerinde yardım ediyorum.",
      "6. sınıf öğrencisiyim ve aynı zamanda okul takımında kaptanlık yapıyorum.",
      "Okulda başarılı olmak için ödevlerimi zamanında yapıyorum."
    ],
    "answer": "6. sınıf öğrencisiyim ve aynı zamanda okul takımında kaptanlık yapıyorum.",
    "id": 1759008691068
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Ahmet Bey, gün boyu öğretmen rolünü üstlendikten sonra akşam pazara uğradığında müşteri rolündedir. Evine geldiğinde ise karısına karşı eş, çocuklarına karşı baba rolündedir. Evlerine misafir gelirse o anki eş ve baba rolüne ek olarak bir de ev sahibi rolünü de üstlenir. Bu örnekte de görüldüğü gibi biz de toplumun küçük bir modeli olan ailemizin içinde ve toplumda Yukarıdaki paragrafın aşağıdaki hangi cümleyle devam ettirilmesi doğru olur?",
    "options": [
      "aynı anda birden fazla rol sahibi olabiliriz.",
      "rollerimiz hiçbir zaman değişmez.",
      "bireysel çıkarlarımızı üstün tutmalıyız.",
      "rollerimiz bize görev yüklemez."
    ],
    "answer": "aynı anda birden fazla rol sahibi olabiliriz.",
    "id": 1759008691069
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Birey olarak dünyaya geldiğimiz andan itibaren çeşitli roller üstleniriz. Bu rollerimizin bir kısmı biyolojik özelliklerimizden kaynaklanır, seçme şansımız yoktur. Bazı rollerimizi ise ilgi ve yeteneklerimiz doğrutusunda sonradan kazanırız. Buna göre, aşağıdakilerden hangisi ilgi ve yeteneklerimiz doğrutusunda kazandığımız rollerimizden biri değildir?",
    "options": [
      "Öğretmen",
      "Arkadaş",
      "Kardeş",
      "Mimar"
    ],
    "answer": "Kardeş",
    "id": 1759008691070
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "İçinde bulunduğumuz ilk grup ve kurum aşağıdakilerden hangisidir?",
    "options": [
      "Okul",
      "Aile",
      "Oyun",
      "Çalışma"
    ],
    "answer": "Aile",
    "id": 1759008691071
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Aşağıda yer alan görev-sorumluluk eşleştirmelerinden hangisi yanlıştır?",
    "options": [
      "Öğrenci – Ödev",
      "Çocuk – Oyun",
      "Evlat – Oda toplama",
      "Öğretmen – Ders anlatma"
    ],
    "answer": "Çocuk – Oyun",
    "id": 1759008691072
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "zor",
    "type": "quiz",
    "question": "Ortaokul 6. sınıf öğrencisi olan Mustafa sabah yatağından kalktı, yüzünü yıkadı, yatağını düzeltti. Annesi, babası, babaannesi ve küçük kardeşiyle kahvaltısını yaptıktan sonra okul servisine binip okula gitti, derse başladı. Okulun çevre koruma kulübünün faaliyetlerine üye olarak katıldı. Okuldan eve okul servisiyle dönen Mustafa, arkadaşlarıyla dışarıda oyun oynamak için annesinden izin istedi. Ona izin veren annesi gelirken ekmek almasını söyledi. Arkadaşlarıyla oynadığı maçta kalecilik yapan Mustafa, marketten ekmek alıp eve döndü. Mustafa gün içinde kaç farklı role sahip olmuştur?",
    "options": [
      "8",
      "7",
      "6",
      "5"
    ],
    "answer": "8",
    "id": 1759008691073
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "İnsanlar, hayatları boyunca içinde bulundukları grup ve kurumlarda çeşitli roller üstlenirler. Doğuştan sahip olunan ve sonradan kazanılan rollerimiz vardır. Hatta aynı anda birden fazla rol de üstlenebilirler. Kişi; ailede çocuk, okulda öğrenci, oyun grubunda oyuncu, toplu taşıma aracında yolcu, markette müşteri vb. roller içerisinde olabilir. Bireylerin içinde bulundukları rollerle birlikte kendilerinden beklenen davranışlar da değişmektedir. Açıklamaya göre rollerle ilgili aşağıdakilerden hangisi yanlış bir ifadedir?",
    "options": [
      "Günlük yaşamda çeşitli roller ediniriz.",
      "Her rolün gerektirdiği bir de sorumluluğumuz vardır.",
      "Rollerimizi birbirine karıştırmamalı ve rollerimize uygun davranmalıyız.",
      "Rollerimize doğuştan sahip oluruz."
    ],
    "answer": "Rollerimize doğuştan sahip oluruz.",
    "id": 1759008691074
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Aşağıdakilerden hangisi üyesi olduğumuz grupta üstlendiğimiz görevlere verilen addır?",
    "options": [
      "Birey",
      "Rol",
      "Sorumluluk",
      "Kurum"
    ],
    "answer": "Rol",
    "id": 1759008691075
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Aşağıdakilerden hangisi 6. sınıf öğrencisi Metin'in okuldaki sorumluluklarından biri değildir?",
    "options": [
      "Okulu temiz tutmak",
      "Okul eşyalarına zarar vermemek",
      "Okuldaki görevlilere saygılı olmak",
      "Arkadaşlarının eşyalarını izinsiz kullanmak"
    ],
    "answer": "Arkadaşlarının eşyalarını izinsiz kullanmak",
    "id": 1759008691076
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Rollerimiz doğuştan kazanılan ve sonradan kazanılan roller olarak ikiye ayrılır. Yukarıdaki açıklamaya göre aşağıdakilerden hangisi farklı bir rol çeşididir?",
    "options": [
      "Sınıf Başkanı",
      "Takım Kaptanı",
      "Evlat",
      "Okul Müdürü"
    ],
    "answer": "Evlat",
    "id": 1759008691077
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Bireylerin üstlendikleri roller değiştikçe kendilerinden beklenen davranışlar da değişmektedir. Üstlendiğimiz role uygun davranışlarda bulunmak ve farklı rollerin davranışlarını birbirine karıştırmamak büyük önem taşımaktadır. Buna göre aşağıdakilerden hangisi 6. sınıfta okuyan Umut'un yerine getirmesi beklenen davranışlardandır?",
    "options": [
      "Anne ve babasına ev işlerinde yardım etmek.",
      "Evin ihtiyaçlarının karşılanmasını takip etmek.",
      "Ailede alınan kararların uygulanmasını sağlamak.",
      "Ailesinin güvenilir bir ortama sahip olmasını sağlamak."
    ],
    "answer": "Anne ve babasına ev işlerinde yardım etmek.",
    "id": 1759008691078
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "zor",
    "type": "quiz",
    "question": "Yaşlı anne ve babasıyla yaşayan Belkıs Hanım, okuldaki öğrencilerinin tavsiyesiyle katıldığı müzik kursunda çok mutlu olmuştu. Belkıs Hanım'ın sahip olduğu roller aşağıdakilerin hangisinde doğru verilmiştir?",
    "options": [
      "Evlat - Öğretmen - Öğrenci",
      "Anne - Evlat - Öğretmen",
      "Müdür - Anne - Öğrenci",
      "Anne - Öğrenci - Öğretmen"
    ],
    "answer": "Evlat - Öğretmen - Öğrenci",
    "id": 1759008691079
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Murat evli ve iki çocuk babası bir öğretmendir. Buna göre, aşağıdakilerden hangisi Murat'ın üstlenebileceği rollerden biri olamaz?",
    "options": [
      "Baba",
      "Eş",
      "Öğretmen",
      "Kardeş"
    ],
    "answer": "Kardeş",
    "id": 1759008691080
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "\"İçinde bulunduğumuz zamana ve duruma göre farklı roller üstleniriz.\" Buna göre bu yıl 6. sınıfa başlayan Ali; I. Öğrenci II. Yolcu III. Üye IV. Doktor rollerinden hangisini üstlenemez?",
    "options": [
      "I",
      "II",
      "III",
      "IV"
    ],
    "answer": "IV",
    "id": 1759008691081
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Bir kişinin iş yerinde sekreter, evde anne, yardımlaşma kulübünde temsilci olabileceği düşünüldüğünde roller hakkında aşağıdakilerden hangisi söylenebilir?",
    "options": [
      "Toplumda bireylerin farklı rolleri bulunur.",
      "Rollerin getirdiği sorumluluklar vardır.",
      "Rollerin tamamı doğuştan kazanılır.",
      "Roller kişilere haklar kazandırır."
    ],
    "answer": "Toplumda bireylerin farklı rolleri bulunur.",
    "id": 1759008691082
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Altıncı sınıf öğrencisi Reyyan, yaşadığı çevreyi temiz tutmaya özen göstermekte ve okulda kurulan çevre kulübü faaliyetlerindeki görevlerini zamanında yapmaktadır. Buna göre Reyyan'ın davranışları aşağıdaki kavramlardan hangisine örnektir?",
    "options": [
      "Hak",
      "Özgürlük",
      "Ön yargı",
      "Sorumluluk"
    ],
    "answer": "Sorumluluk",
    "id": 1759008691083
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.1",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "İsmim Zafer Ege, taksicilik yapıyorum. Çocuklarım evimizin neşesidir, onların ödevlerine yardımcı olurum. Annem de bizimle birlikte kalıyor. Akşam eve geldiğimde ilk iş olarak ellerini öper ve bir sıkıntısı olup olmadığını sorarım. Metne göre aşağıdakilerden hangisi Zafer Bey'in üstlendiği rollerden biri değildir?",
    "options": [
      "Evlat olmak",
      "Şoför olmak",
      "Baba olmak",
      "Yönetici olmak"
    ],
    "answer": "Yönetici olmak",
    "id": 1759008691084
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "“‘Türk milletindenim.’ diyen kişi, her şeyden önce kesinlikle Türkçe konuşmalıdır. Türkçe konuşmayan bir kişi, Türk kültürüne ve milletine bağlılığını öne sürerse buna inanmak doğru olmaz.” Mustafa Kemal Atatürk bu sözünde kültürel ögelerden hangisinin önemine vurgu yapmıştır?",
    "options": [
      "Dil",
      "Tarih",
      "Sanat",
      "Gelenek"
    ],
    "answer": "Dil",
    "id": 1759045757107
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "orta",
    "type": "quiz",
    "question": "“Sevgide güneş gibi ol, dostluk ve kardeşlikte akarsu gibi ol, hataları örtmede gece gibi ol, tevazuda toprak gibi ol, öfkede ölü gibi ol, her ne olursan ol, ya olduğun gibi görün, ya göründüğün gibi ol.” Mevlânâ bu sözünde aşağıdaki kültürel değerlerden hangisine vurgu yapmıştır?",
    "options": [
      "Adalet",
      "Dürüstlük",
      "Özgürlük",
      "Aile birliği"
    ],
    "answer": "Dürüstlük",
    "id": 1759045757108
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "İnsanlığın temel unsurlarından biri olan din, insanların günlük yaşamını etkiler. İslam dinine ait özel günlerde kişiler barışır, sevenler buluşur, uzun süredir görüşmeyenler bir araya gelir. Manevi duyguların yoğun olarak yaşandığı bu günler, toplumda barış ve huzurun sağlanmasına katkı sağlar. Bu duruma aşağıdakilerden hangisi örnek olarak gösterilebilir?",
    "options": [
      "Ramazan Bayramı",
      "Kız isteme törenleri",
      "Kültür yolu festivalleri",
      "Asker uğurlama merasimi"
    ],
    "answer": "Ramazan Bayramı",
    "id": 1759045757109
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "zor",
    "type": "quiz",
    "question": "Millî kültürün oluşturulmasında tarih önemli rol oynamaktadır. Tarih, bir toplumun kimliğinin şekillenmesinde, geçmişte yaşanan olayların, mücadelelerin, iyi ve kötü günlerin gelecek kuşaklara aktarılmasını sağlamaktadır. Tarihî olaylar toplumu oluşturan bireyler arasında birlik ve beraberlik duygusunu geliştirir. Bu bilgide tarihin aşağıdakilerden hangisine katkı sağladığına değinilmektedir?",
    "options": [
      "Millî kültürün oluşmasındaki payına",
      "Bir arada yaşama duygusuna etkisine",
      "Kültürün nesilden nesile aktarılmasına",
      "Bireylerin yaşam tarzları üzerindeki rolüne"
    ],
    "answer": "Bir arada yaşama duygusuna etkisine",
    "id": 1759045757110
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Millî kültür bir toplumu millet yapan, toplumun bir arada yaşamasını sağlayan etkenlerin başında gelir. Topluma millî bir kimlik kazandırır. Geçmişten günümüze meydana getirilen maddi ve manevi değerlerin bütünüdür. Toplumları diğer toplumlardan ayırma özelliğine sahiptir. Toplumu oluşturan bireyler arasında bağların kurulmasında ve güçlenmesinde etkilidir. Bu bilgiden aşağıdaki çıkarımlardan hangisi yapılamaz?",
    "options": [
      "Millî kültür insanların bir arada yaşamasına ortam hazırlar.",
      "Millî kültürün nesiller arasında aktarılmasında dil önemli bir etkendir.",
      "Toplumların millet olmasında kültürel değerlerin rolü önemlidir.",
      "Her toplumun kendine özgü millî kültürü bulunmaktadır."
    ],
    "answer": "Millî kültürün nesiller arasında aktarılmasında dil önemli bir etkendir.",
    "id": 1759045757111
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Kültürel bağlar ve millî değerler toplumsal birikteliğin oluşmasına, güçlenmesine katkı sağlar. Toplumsal birliğin oluşmasında gelenek ve görenekler etkili olmaktadır. Buna göre, I. Nişan ve düğünlerde türkülerin çağrılmaya devam etmesi II. Çocukların uyuması için ninnilerin söylenmesi III. Vatani görevini yapmaya giden gençlere uğurlama töreni yapılması uygulamalarından hangisi ya da hangileri toplumsal birliğin oluşmasına katkı sağlar?",
    "options": [
      "Yalnız I",
      "I ve III",
      "II ve III",
      "I, II ve III"
    ],
    "answer": "I, II ve III",
    "id": 1759045757112
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Türk milleti, dünya tarihine önemli izler bırakmış şanlı bir millettir. Yüzyıllar boyunca üç kıtada güçlü devletler kurarak gittiği her yere barış, adalet ve medeniyet götürmüş, diğer milletlere örnek olmuştur. Milletimizin tarihini bilmek ve ortak bir tarih bilinci oluşturmak, toplumsal birliği güçlendirmektedir. Millî kültürün oluşmasında tarihin rolü her dönem önemli olmuştur. Buna göre, I. Ortak tarih bilincinin oluşmasında konuşulan dil önemli bir faktördür. II. Tarih bilmek toplumun geçmişinin öğrenilmesini sağlar. III. Tarihî olaylar birlik ve beraberliğin güçlenmesinde etkilidir. yargılarından hangilerine ulaşılabilir?",
    "options": [
      "I ve II",
      "I ve III",
      "II ve III",
      "I, II ve III"
    ],
    "answer": "II ve III",
    "id": 1759045757113
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Verilen cümleler ile Türk kültürünü oluşturan ögelerden hangisi eşleştirilirken hata yapılmıştır?  A) Kız istemeye gelenlere yüzlerce yıldır kahve ikram ediyoruz. -> Sanat B) Millî Mücadele yıllarında destan yazarak düşmanı yurttan kovduk. -> Tarih C) Türkçesi varken yabancı kelimeleri kullanmamalıyız. -> Dil D) Ramazan ve Kurban Bayramlarını, kandilleri her yıl kutluyoruz. -> Din",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answer": "A",
    "id": 1759045757114
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Aynı dili konuşan, benzer duygu ve düşüncelere sahip olan insanlar bir araya geldiğinde anlaşabilirler, amaçlarına daha kısa sürede ulaşabilirler. Dilin ortak olması, insanların aynı toplumun üyesi oldukları anlamına gelir. Ortak kültüre sahip toplumlar aynı dili konuşur. Toplumda aidiyet duygusunu geliştirir. Geçmişteki değerlerin geleceğe aktarılmasında dil araç görevi üstlenmektedir. Buna göre aşağıdakilerden hangisi söylenemez?",
    "options": [
      "Kültürün oluşmasında dil etkilidir.",
      "Dil kültürü gelecek kuşaklara aktarır.",
      "Dil ekonomik refahın artmasını sağlar.",
      "İnsanlar arasında dil ile iletişim kurulabilir."
    ],
    "answer": "Dil ekonomik refahın artmasını sağlar.",
    "id": 1759045757115
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Millî bayramlar, birlik ve beraberlik için son derece önemli olan özel günlerdendir. Bu bayramlar kültürel mirası ve ortak geçmişi hatırlatırken, toplumsal bağları güçlendirir. Aynı zamanda, bu bayramlar, paylaşılan duygular ve kutlamalarla bireyler arası dayanışmayı artırır. Bu nedenle bu günler, millet olma bilincini pekiştirir. Bu bilgiden hareketle aşağıdakilerden hangisi bu özel günler arasında gösterilemez?",
    "options": [
      "Zafer Bayramı",
      "Nevruz Bayramı",
      "Cumhuriyet Bayramı",
      "Ulusal Egemenlik ve Çocuk Bayramı"
    ],
    "answer": "Nevruz Bayramı",
    "id": 1759045757116
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "orta",
    "type": "quiz",
    "question": "15 Temmuz 2016'da hain girişim ile karşı karşıya kalan Türkiye, darbecilere karşı milleti ve devleti ile omuz omuza vererek darbecilerin amaçlarına ulaşmasını engelledi. Destansı bir direnişle tüm dünyaya millet olma bilincini gösterdi. Bu direniş, devleti ile el ele vererek neler yapabileceğini kanıtladı. Bu durum Türk milletinin, I. Mücadele II. Dayanışma III. Birlik ve beraberlik anlayışlarından hangilerine sahip olduğunu gösterir?",
    "options": [
      "I ve II",
      "I ve III",
      "II ve III",
      "I, II ve III"
    ],
    "answer": "I, II ve III",
    "id": 1759045757117
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Türk milleti geçmişten günümüze her zaman geçirdiği zor dönemleri millî değerlerine sahip çıkarak atlatmıştır. Çanakkale Savaşı'nda düşmana karşı savaşmaktan geri durmamış, Millî Mücadele yıllarında Atatürk'ün emri ile elinde neyi var neyi yok ordusuna vermiştir. İstiklal Yolu'nda kadın, erkek, çocuk demeden cepheye cephane taşımıştır. Buna göre Türk milletinin, I. Özverili II. Fedakâr III. Vatansever değerlerinden hangisi ya da hangilerine sahip olduğu söylenebilir?",
    "options": [
      "Yalnız III",
      "I ve II",
      "II ve III",
      "I, II ve III"
    ],
    "answer": "I, II ve III",
    "id": 1759045757118
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Bir toplumda, bir toplulukta eskiden kalmış olmaları dolayısıyla saygın tutulup kuşaktan kuşağa iletilen, yaptırım gücü olan kültürel kalıntılar, alışkanlıklar, bilgi, töre ve davranışlara gelenek denir. Buna göre aşağıdakilerden hangisi Türk kültürüne ait gelenekler arasında gösterilemez?",
    "options": [
      "Halk oyunları",
      "Düğün törenleri",
      "Nevruz Bayramı",
      "Tribün kutlamaları"
    ],
    "answer": "Tribün kutlamaları",
    "id": 1759045757119
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "‘Çinilerde kullanılan her desenin ve rengin kendine özgü bir anlamı, bir dili vardır. Bu desen ve renkler, süsleme işlevlerinin yanı sıra sözsüz bir iletişim aracı olarak çeşitli mesajlar iletir.’ diyen bir kişinin, bu sözleri aşağıdaki kültürel ögelerden öncelikle hangisi ile ilişkilendirilebilir?",
    "options": [
      "Gelenek",
      "Dil",
      "Sanat",
      "Tarih"
    ],
    "answer": "Sanat",
    "id": 1759045757120
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Ramazan ayında bazı hayırseverler, borçlu kişileri rencide etmemek için isimlerini bilmeden mahalle esnafına giderek borçlarının bir kısmını gizlice öderlerdi. Kimin borcu ödendiği bilinmez, sadece defterdeki bazı sayfalar satın alınırdı. Bu uygulama sayesinde ihtiyaç sahipleri sessizce desteklenmiş olurdu. Bu uygulama Osmanlı toplumunda aşağıdakilerden hangisinin geliştiğini gösterir?",
    "options": [
      "Bireysel ön yargıların",
      "Demokratik devlet anlayışının",
      "Yardımlaşma ve dayanışmanın",
      "Bireysel zenginliğin ön plana çıkmasının"
    ],
    "answer": "Yardımlaşma ve dayanışmanın",
    "id": 1759045757121
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Yukarıdaki görsellerde yer alan etkinliklerde, farklı yörelere ait kıyafetler, müzikler ve hareketler yer almaktadır. Bu tür etkinlikler toplumun sosyal yapısını güçlendirir, birlik ve beraberlik duygusunu pekiştirir. Aynı zamanda kuşaktan kuşağa aktarılan değerlerin yaşatılmasına da katkı sağlar. Buna göre bu tür kültürel etkinliklerin topluma sağladığı katkı aşağıdakilerden hangisidir?",
    "options": [
      "Teknolojik ilerlemeyi hızlandırır.",
      "Ekonomik büyümeyi sağlar.",
      "Toplumsal dayanışmayı artırır.",
      "Tarımsal üretimi geliştirir."
    ],
    "answer": "Toplumsal dayanışmayı artırır.",
    "id": 1759045757122
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Bir toplumu oluşturan ve onun bütünlüğünü sağlayan unsurlardan biri millî kültürdür. Millî kültür, bir millete kimlik kazandıran, tarih boyunca oluşmuş maddi ve manevi değerlerin toplamıdır. Ait olduğu toplumun karakterini yansıtarak onu diğer toplumlardan ayırır ve bireyler arasında güçlü bağlar oluşturur. Millî kültür; dil, din, tarih, sanat ve gelenekler gibi unsurları ile ortak duyguları güçlendirir. Buna göre, I. Dayanışma II. Yardımlaşma III. Birlik ve beraberlik duygularından hangileri bireyler arasında bağların güçlenmesine katkı sağlar?",
    "options": [
      "I ve II",
      "I ve III",
      "II ve III",
      "I, II ve III"
    ],
    "answer": "I, II ve III",
    "id": 1759045757123
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "orta",
    "type": "quiz",
    "question": "“...Ben hiç do zengin ve refah bir halka kağan olmadım. Karnı aç, sırtı çıplak, yoksul (ve) perişan bir halka kağan oldum... Türk halkı için gece uyumadım, gündüz oturmadım. Kardeşim Kültegin ve iki Şad ile (birlikte) öle yite çalıştım, çabaladım...” Orhun (Göktürk) Kitabeleri’nde yer alan bu metin, Türk milletinin aşağıdaki millî ve kültürel değerlerinden hangileriyle ilişkili değildir?",
    "options": [
      "Fedakârlık",
      "Vatanseverlik",
      "Misafirperverlik",
      "Birlik ve beraberlik"
    ],
    "answer": "Misafirperverlik",
    "id": 1759045757124
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "kolay",
    "type": "quiz",
    "question": "Türk toplumunda “bayramlaşma”, dinî bayramlarda aile büyüklerinin ellerinin öpülmesi, hal hatır sorulması ve tatlı ikram edilmesi gibi uygulamaları kapsar. Bayram sabahlarında büyükler evin en yaşlısının evinde toplanır. Bu sırada “Bayramınız mübarek olsun!”, “Allah kabul etsin!” gibi dualar sıkça kullanılır. Ayrıca bu gelenek, Osmanlı Dönemi’nde de önemliydi; padişahlar bayram namazı sonrası tebaa ile bayramlaşırdı. Bu tür uygulamalar hem dinî hem de geleneksel bağları güçlendirmiştir. Bu parçada millî kültürümüzü oluşturan ögelerden hangisine yer verilmemiştir?",
    "options": [
      "Sanat",
      "Din",
      "Tarih",
      "Gelenek"
    ],
    "answer": "Sanat",
    "id": 1759045757125
  },
  {
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.2",
    "difficulty": "orta",
    "type": "quiz",
    "question": "Halk oyunları, Türk milletinin geçmişten günümüze taşıdığı önemli kültürel ögelerdendir. Farklı yörelere ait bu oyunlar özel günlerde toplu olarak oynanır. Halk oyunları; .............. sağlayan unsurlardır. Verilen bilgideki “...........” ile boş bırakılan yer aşağıdakilerden hangisi ile tamamlanamaz?",
    "options": [
      "kültürel kimliğin yaşatılmasını",
      "toplumsal birlikteliği",
      "ortak değerlerin aktarımını",
      "bireysel çıkar çatışmasını"
    ],
    "answer": "bireysel çıkar çatışmasını",
    "id": 1759045757126
  },
  {
    "id": 1760000000001,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Dört öğrencinin toplumsal sorunlara dair fikirleri şöyledir: Nihat: 'Bireylere hijyen ve sağlıklı yaşam alışkanlıkları kazandırılmalıdır.' Elif: 'Geri dönüşüm kutuları yaygınlaştırılmalıdır.' Can: 'Binalar sağlam zemin üzerine inşa edilmelidir.' Ece: 'Gıdaları ihtiyaç kadar almak, kaynakları boşa harcamamızı engeller.' Bu öğrencilerin konuşmalarına bakarak ulaşılabilecek en kapsamlı yargı hangisidir?",
    "options": [
      "İsrafın önlenmesi üzerine tartışmaktadırlar.",
      "Toplumsal sorunlara yönelik çözümler üretmektedirler.",
      "Afetlerin etkilerini azaltmak için tedbirleri söylemektedirler.",
      "Çevre kirliliğinin azalması için fikirler vermektedirler."
    ],
    "answer": "Toplumsal sorunlara yönelik çözümler üretmektedirler.",
    "difficulty": "orta"
  },
  {
    "id": 1760000000002,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Bir genel ağ haberinde şu ifadeler yer almaktadır: 'Son yıllarda Türkiye'de özellikle gıda ve su tüketiminde ciddi bir artış yaşanıyor. Marketlerden alınan ancak tüketilmeyen yiyecekler, çöpe atılan ekmekler ve musluklardan boşa akan sular, doğal kaynakların hızla tükenmesine neden oluyor. Uzmanlar, bu durumun hem çevreye hem de ekonomiye zarar verdiğini belirterek daha dikkatli ve ölçülü tüketim çağrısında bulunuyor.' Buna göre genel ağ haberinde bahsedilen durum aşağıdaki toplumsal sorunlardan hangisi ile ilişkilendirilebilir?",
    "options": [
      "Göç",
      "İsraf",
      "Çevre kirliliği",
      "Salgın hastalıklar"
    ],
    "answer": "İsraf",
    "difficulty": "kolay"
  },
  {
    "id": 1760000000003,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Kırsal bölgelerde iş imkânlarının azlığı ve yaşam koşullarının zorluğu nedeniyle insanlar büyük şehirlere göç etmektedir. Bu durum şehirlerde nüfus artışına, altyapı sorunlarına ve konut sıkıntısına yol açmaktadır. Aynı zamanda kırsalda üretim azalmakta, köyler boşalmaktadır. Bu duruma bağlı olarak aşağıdakilerden hangisi göç sorununa yönelik uygun bir çözüm olabilir?",
    "options": [
      "Kırsal bölgelerde tarım ve hayvancılığı desteklemek",
      "Şehirlerdeki ulaşım ücretlerini artırmak",
      "Büyükşehirlerde konut yapımını durdurmak",
      "Göç edenleri geri göndermek için kurallar koymak"
    ],
    "answer": "Kırsal bölgelerde tarım ve hayvancılığı desteklemek",
    "difficulty": "orta"
  },
  {
    "id": 1760000000004,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Her yıl milyonlarca ton atık su, nehirlere ve denizlere bırakılıyor. Bu durum hem su canlılarını tehdit ediyor hem de insanların temiz suya erişimini zorlaştırıyor. Kirlenen su kaynakları, dünyadaki .................. başlıca nedenlerinden biri sayılıyor. Verilen metinde '......' ile boş bırakılan yere aşağıdakilerden hangisinin yazılması daha uygun olur?",
    "options": [
      "eğitimde fırsat eşitliğinin",
      "salgın hastalıkların ve temiz su krizinin",
      "tarımsal üretim artışının",
      "enerji tüketiminin ve genel ağ erişiminin"
    ],
    "answer": "salgın hastalıkların ve temiz su krizinin",
    "difficulty": "kolay"
  },
  {
    "id": 1760000000005,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Bir habere göre, Türkiye'de 2024 yılında 3800 adet orman yangını meydana geldi ve yaklaşık 27 bin hektar alan zarar gördü. Bir önceki yıla göre hem yangın sayısı hem de zarar gören alan miktarında artış yaşandığı belirtildi. Orman yangınlarının azalması için insanların gerekli önlemleri alması gerektiğine vurgu yapıldı. Bu haberden hareketle aşağıdakilerden hangisi orman yangınlarının azalması için alınacak tedbirlerden değildir?",
    "options": [
      "Piknik alanlarında yanıcı ateşleri söndürmek",
      "Cam kırıklarını ormanlık alanlardan toplamak",
      "Yangın yolları ve şeritleri oluşturmak",
      "Araçlara filtre takarak egzoz salınımını azaltmak"
    ],
    "answer": "Araçlara filtre takarak egzoz salınımını azaltmak",
    "difficulty": "orta"
  },
  {
    "id": 1760000000006,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Her yıl dünyada milyarlarca ton gıda israf edilmektedir. İnsanlar, tükettiklerinden fazla gıdaları çöpe atmakta, bu da gıda israfına neden olmaktadır. Hazırlanan gıda raporuna göre milyarlarca dolarlık gıda çöpe gitmektedir. Bu durum aşağıdaki küresel sorunlardan hangisine zemin hazırlamaktadır?",
    "options": [
      "Afet",
      "Göç",
      "Açlık",
      "Salgın"
    ],
    "answer": "Açlık",
    "difficulty": "kolay"
  },
  {
    "id": 1760000000007,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Ülkemizdeki doğa kaynaklı afetler (deprem, sel, heyelan gibi), hem maddi hem de manevi kayıplara neden olarak önemli toplumsal sorunlar arasında yer alır. Aşağıdakilerden hangisi bu afetlerin etkilerini azaltmaya yönelik uygun bir çözüm önerisidir?",
    "options": [
      "Yerleşim yerlerini dere yataklarına kurmak",
      "Ağaç kesimini teşvik etmek",
      "Binaları fay hatlarına inşa etmek",
      "Erken uyarı sistemleri kurmak"
    ],
    "answer": "Erken uyarı sistemleri kurmak",
    "difficulty": "orta"
  },
  {
    "id": 1760000000008,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Toplumda sağlık sorunlarının önlenebilmesi için bireylerin hijyen kurallarına dikkat etmesi, sağlık hizmetlerinden doğru şekilde yararlanması ve bulaşıcı hastalıklara karşı önlem alması gerekir. Buna göre, I. El yıkama alışkanlığı kazanmak II. Hastayken başkalarıyla temasta bulunmak III. Aşı yaptırmak IV. Çöpleri açık alanlara dökmek tutumlarından hangilerinin toplum sağlığını olumlu yönde etkilemesi beklenir?",
    "options": [
      "I ve III",
      "II ve IV",
      "I, II ve III",
      "II, III ve IV"
    ],
    "answer": "I ve III",
    "difficulty": "orta"
  },
  {
    "id": 1760000000009,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Su krizi, dünya genelinde su kaynaklarının yetersizliği veya kirlenmesi nedeniyle ortaya çıkan bir sorundur. Dünya nüfusunun hızla artması, su talebini artırmakta ve mevcut kaynakları zorlamaktadır. Bu durum yağış düzenlerini etkileyerek bazı bölgelerde kuraklık, diğerlerinde ise aşırı yağış ve sel olaylarına yol açmaktadır. Buna göre su krizinin aşağıdaki sorunlardan hangisinin oluşmasına en çok katkı sağladığı söylenebilir?",
    "options": [
      "Hava kirliliği",
      "Toprak kirliliği",
      "İklim değişikliği",
      "Salgın hastalıklar"
    ],
    "answer": "İklim değişikliği",
    "difficulty": "orta"
  },
  {
    "id": 1760000000010,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Doğaya bırakılan çöpler, çevre üzerinde ciddi etkilere yol açmaktadır. Plastik atıklar, su kaynaklarında birikerek su canlılarının yaşam alanlarını tehdit eder ve bu canlıların besin zincirine girmesiyle insanların hasta olmasına neden olabilir. Ayrıca, kimyasal maddeler içeren çöpler toprağa karışarak toprak kalitesini düşürür ve bu durum bitkilerin büyümesini olumsuz etkiler. Buna göre doğaya bırakılan çöpler ile ilgili aşağıdakilerden hangisi söylenemez?",
    "options": [
      "Çevre sorunlarına neden olmaktadır.",
      "Doğa üzerinde olumsuz etkileri bulunmaktadır.",
      "Doğal yaşamın bir parçası olmayı başarmıştır.",
      "İnsan sağlığı açısından tehdit oluşturmaktadır."
    ],
    "answer": "Doğal yaşamın bir parçası olmayı başarmıştır.",
    "difficulty": "zor"
  },
  {
    "id": 1760000000011,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Uluslararası Göç İstatistikleri'ne göre yurt dışından Türkiye'ye 314 bin 588 kişi göç ederken, Türkiye'den yurt dışına 424 bin 345 kişi göç etmiştir. Göç edenlerin cinsiyet dağılımları ve vatandaşlık durumları da grafiklerde belirtilmiştir. Verilen bilgi grafiğine göre aşağıdaki çıkarımlardan hangisi yapılamaz?",
    "options": [
      "Göç eden erkeklerin sayısı kadınların sayısından fazladır.",
      "Yabancı uyruklular Türk vatandaşlarından daha fazla göç etmektedir.",
      "Yurt dışından Türkiye'ye göçün ana nedeni daha iyi şartlarda yaşamaktadır.",
      "Göç edenlerin sayısına göre Türkiye'nin nüfusu göç yolu ile azalmaktadır."
    ],
    "answer": "Yurt dışından Türkiye'ye göçün ana nedeni daha iyi şartlarda yaşamaktadır.",
    "difficulty": "orta"
  },
  {
    "id": 1760000000012,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Dünya üzerinde etkisini göstermediği ülke kalmayan Kovid-19, Türkiye'de de etkisini gösterdi. Salgın döneminde okullar tatil edildi, birçok iş yeri kapandı ve sokağa çıkma yasağı uygulandı. Kamusal alanda yapılacak konser, festival gibi etkinlikler iptal edildi. Buna göre Kovid-19 salgını ile ilgili aşağıdakilerden hangisi söylenemez?",
    "options": [
      "Çevre sorunlarına yol açmıştır.",
      "Sosyal etkinlikler yapılamamıştır.",
      "Eğitim faaliyetlerine ara verilmiştir.",
      "Ekonomi üzerinde etkileri olmuştur."
    ],
    "answer": "Çevre sorunlarına yol açmıştır.",
    "difficulty": "kolay"
  },
  {
    "id": 1760000000013,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Sivas'ta 1321 yılında Hatab bin Mehmod tarafından kurulan vakıf, cüzzam gibi bulaşıcı hastalığa yakalanıp evlerine mahkûm olanları tedavi ettirip masraflarının karşılanmasını üstleniyordu. Bu vakıf toplumun aşağıdaki alanlardan hangisinde yaşadığı soruna çözüm bulmak için faaliyet göstermiştir?",
    "options": [
      "Çevre",
      "Eğitim",
      "Sağlık",
      "Ekonomi"
    ],
    "answer": "Sağlık",
    "difficulty": "kolay"
  },
  {
    "id": 1760000000014,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Dünya üzerinde yaşayan insanların genelini ilgilendiren sorunlar toplumsal sorunlar olarak nitelendirilir. Toplumsal sorunların ortaya çıkmasında icatlar yapılması, devletler arası anlaşmazlık sonucunda silahlı mücadelelerin, çatışmaların yaşanması etkili olan nedenlerden bazılarıdır. Bu bilgide toplumsal sorunların ortaya çıkmasında etkili olan nedenlerden hangisine vurgu yapılmıştır?",
    "options": [
      "Kentleşme – Savaşlar",
      "Salgın hastalıklar – Göç",
      "Hızlı nüfus artışı – Kentleşme",
      "Savaşlar – Teknolojik gelişmeler"
    ],
    "answer": "Savaşlar – Teknolojik gelişmeler",
    "difficulty": "orta"
  },
  {
    "id": 1760000000015,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Bireylerin yaşadığı çevreye ve topluma değer vermesi, üzerine düşen sorumlulukları zamanında ve eksiksiz yerine getirmesi, toplumsal sorunlara karşı duyarlı olup çözüm yolları araması önemlidir. Buna göre aşağıdakilerden hangisi toplumsal sorunların azalmasına katkı sağlamaz?",
    "options": [
      "Ailelere karşı toplumu bilinçlendirmek",
      "Yaşanan sorunları görmezden gelmek",
      "Çevreye karşı duyarlı davranışlar sergilemek",
      "Her türlü israftan kaçınarak yaşamı sürdürmek"
    ],
    "answer": "Yaşanan sorunları görmezden gelmek",
    "difficulty": "kolay"
  },
  {
    "id": 1760000000016,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Kişinin kendi davranışlarının sonuçlarını üstlenmesine sorumluluk, bir konuya hassasiyet göstermesine ise duyarlılık denir. Buna göre aşağıdakilerden hangisi duyarlılık olarak tanımlanabilir?",
    "options": [
      "Ali'nin kendine ait odayı temiz tutması",
      "Ayşe'nin parktaki cam kırıklarını toplaması",
      "Ahmet'in içtiği gazozun şişesini yere atması",
      "Aysel'in Kovid-19 döneminde iş yerine gitmesi"
    ],
    "answer": "Ayşe'nin parktaki cam kırıklarını toplaması",
    "difficulty": "orta"
  },
  {
    "id": 1760000000017,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Görselde fabrika bacalarından çıkan dumanların neden olduğu hava kirliliği gösterilmektedir. Bu çevre sorununun çözümü için aşağıdaki önerilerden hangisi yapılabilir?",
    "options": [
      "Tek kullanımlık plastikler kullanılmalıdır.",
      "Atılacak çöpler atıklara ayrılarak atılmalıdır.",
      "Tasarruf yapılabilecek ürünler satın alınmalıdır.",
      "Sanayi kuruluşlarının bacalarına filtre takılmalıdır."
    ],
    "answer": "Sanayi kuruluşlarının bacalarına filtre takılmalıdır.",
    "difficulty": "kolay"
  },
  {
    "id": 1760000000018,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Toplumsal sorun, bir toplumun veya insanlığın önemli bir kesimini etkileyen, bireylerin yaşam kalitesini düşüren ve genel toplumsal düzeni, huzuru veya adaleti bozan sorunlara denir. Buna göre aşağıdakilerden hangisi toplumsal sorun olarak nitelendirilemez?",
    "options": [
      "Savaştan dolayı insanların ülkelerini terk ederek başka ülkelere göç etmesi",
      "Küresel ısınmadan kaynaklı dünya genelinde sıcaklığın artması",
      "İş bulmakta sorun yaşayan birinin başka bir şehre yerleşmesi",
      "Salgın hastalıklardan dolayı ülkeler arası seyahatin kısıtlanması"
    ],
    "answer": "İş bulmakta sorun yaşayan birinin başka bir şehre yerleşmesi",
    "difficulty": "orta"
  },
  {
    "id": 1760000000019,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Ahmet'in yaşadığı ilin nüfusu kurulan yeni fabrikalar nedeniyle hızla arttı. Bu durum, ilin ortasından geçen ırmağın fabrika atıklarıyla kirlenmesi gibi bazı sorunları da beraberinde getirdi. Ahmet'in yaşadığı ildeki bu sorunun çözümü için aşağıdakilerden hangisi öncelikli olarak yapılmalıdır?",
    "options": [
      "Fabrikalara atık su tesisi kurmak",
      "Irmağın etrafına ağaçlar dikmek",
      "Dışarıdan gelen göçü engellemek",
      "Göç eden insanlara iş olanağı sunmak"
    ],
    "answer": "Fabrikalara atık su tesisi kurmak",
    "difficulty": "orta"
  },
  {
    "id": 1760000000020,
    "grade": 6,
    "topic": "Birlikte Yaşamak",
    "kazanımId": "SB.6.1.3",
    "type": "quiz",
    "question": "Uluslararası göç, bireylerin veya grupların, bir ülkeden başka bir ülkeye yerleşmesidir. Bireyler daha iyi iş olanakları, kaliteli üniversitelerde eğitim almak veya doğal kaynaklara yakın olmak gibi nedenlerle uluslararası göç yapmaktadır. Bu bilgide göçün aşağıdaki nedenlerinden hangisine vurgu yapılmamıştır?",
    "options": [
      "Siyasi",
      "Eğitim",
      "Çevresel",
      "Ekonomik"
    ],
    "answer": "Siyasi",
    "difficulty": "kolay"
  }
];

function usePersistentState<T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    return [state, setState];
}


// --- Main App Component ---

export default function App() {
    const [screen, setScreen] = useState<ScreenId>('start');
    const [playerName, setPlayerName] = useState('');
    const [groupNames, setGroupNames] = useState({ grup1: 'Grup 1', grup2: 'Grup 2' });
    const [gameSettings, setGameSettings] = useState<GameSettings>({});
    const [questions, setQuestions] = usePersistentState<Question[]>('socialStudiesQuestions', initialQuestions);
    const [highScores, setHighScores] = usePersistentState<HighScore[]>('socialStudiesHighScores', []);
    const [lastGameResult, setLastGameResult] = useState<{score: number; finalGroupScores?: {grup1: number, grup2: number}}>({score: 0});
    const [questionsForGame, setQuestionsForGame] = useState<Question[]>([]);
    
    useEffect(() => {
        document.body.className = 'theme-dark';
    }, []);
    
    const handleGameEnd = useCallback((score: number, finalGroupScores?: { grup1: number, grup2: number }) => {
        const finalScore = finalGroupScores ? Math.max(finalGroupScores.grup1, finalGroupScores.grup2) : score;
        setLastGameResult({ score, finalGroupScores });

        if (finalScore > 0) {
            let entryName = playerName;
            if (gameSettings.competitionMode === 'grup' && finalGroupScores) {
                if (finalGroupScores.grup1 > finalGroupScores.grup2) {
                    entryName = groupNames.grup1;
                } else if (finalGroupScores.grup2 > finalGroupScores.grup1) {
                    entryName = groupNames.grup2;
                } else {
                    entryName = `${groupNames.grup1} & ${groupNames.grup2} (Berabere)`;
                }
            }

            const newHighScore: HighScore = {
                name: entryName,
                score: finalScore,
                date: new Date().toLocaleDateString('tr-TR'),
                settings: gameSettings,
            };
            setHighScores(prev => [...prev, newHighScore].sort((a, b) => b.score - a.score).slice(0, 10));
        }
        setScreen('end');
    }, [playerName, gameSettings, setHighScores, groupNames]);
    
    const resetGame = () => {
      setPlayerName('');
      setGroupNames({ grup1: 'Grup 1', grup2: 'Grup 2' });
      setGameSettings({});
      setQuestionsForGame([]);
      setScreen('start');
    }

    const startGame = () => {
        if (gameSettings.competitionMode === 'grup') {
            setGroupNames(prev => ({
                grup1: prev.grup1.trim() || 'Grup 1',
                grup2: prev.grup2.trim() || 'Grup 2',
            }));
        }
        const filtered = questions.filter(q =>
            q.grade == gameSettings.grade &&
            q.topic == gameSettings.topic &&
            // FIX: Corrected property name to 'kazanımId' to match the type definition.
            q.kazanımId == gameSettings.kazanımId &&
            q.type == gameSettings.gameMode &&
            q.difficulty == gameSettings.difficulty
        );
        setQuestionsForGame(filtered);
        setScreen('game');
    };

    const handleSelectQuestion = (question: Question) => {
        setGameSettings({
            grade: question.grade,
            topic: question.topic,
            // FIX: Corrected property name to 'kazanımId' to match the 'GameSettings' type definition.
            kazanımId: question.kazanımId,
            competitionMode: 'bireysel',
            difficulty: question.difficulty,
            gameMode: question.type,
        });
        setQuestionsForGame([question]);
        setPlayerName('Öğretmen');
        setScreen('game');
    };
    
    const renderScreen = () => {
        switch (screen) {
            case 'start':
                return (
                    <Screen id="start-screen" isActive={true}>
                        <h1 className="text-4xl sm:text-6xl font-extrabold mb-8 text-shadow-lg">🏛️ Sosyal Bilgiler Bilgi Yarışması</h1>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
                            <Button onClick={() => setScreen('grade-select')}>🎮 Oyuna Başla</Button>
                            <Button variant="secondary" onClick={() => setScreen('teacher-panel')}>👩‍🏫 Öğretmen Paneli</Button>
                        </div>
                        <Button variant="success" className="mt-6 w-full max-w-md" onClick={() => setScreen('high-scores')}>🏆 Yüksek Skorlar</Button>
                        <DeveloperSignature />
                    </Screen>
                );
            case 'grade-select':
                 return (
                    <Screen id="grade-select" isActive={true}>
                        <BackButton onClick={() => setScreen('start')} />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center">📚 Sınıfınızı Seçin</h2>
                        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-8 animate-fadeIn">
                            <Button 
                                onClick={() => { setGameSettings({ grade: 5 }); setScreen('learning-area-select'); }}
                                className="absolute top-0 left-0 w-32 h-32 sm:w-36 sm:h-36 rounded-full !p-0 flex items-center justify-center text-xl sm:text-2xl"
                                variant="success"
                            >
                                5. Sınıf
                            </Button>
                            <Button 
                                onClick={() => { setGameSettings({ grade: 6 }); setScreen('learning-area-select'); }}
                                className="absolute top-0 right-0 w-32 h-32 sm:w-36 sm:h-36 rounded-full !p-0 flex items-center justify-center text-xl sm:text-2xl"
                                variant="success"
                            >
                                6. Sınıf
                            </Button>
                            <Button 
                                onClick={() => { setGameSettings({ grade: 7 }); setScreen('learning-area-select'); }}
                                className="absolute bottom-0 left-0 w-32 h-32 sm:w-36 sm:h-36 rounded-full !p-0 flex items-center justify-center text-xl sm:text-2xl"
                                variant="success"
                            >
                                7. Sınıf
                            </Button>
                            <Button 
                                onClick={() => { setGameSettings({ grade: 8 }); setScreen('learning-area-select'); }}
                                className="absolute bottom-0 right-0 w-32 h-32 sm:w-36 sm:h-36 rounded-full !p-0 flex items-center justify-center text-xl sm:text-2xl"
                                variant="success"
                            >
                                8. Sınıf
                            </Button>
                        </div>
                    </Screen>
                );
            case 'learning-area-select':
                const availableLearningAreas = curriculumData[gameSettings.grade!] || [];
                return (
                    <Screen id="learning-area-select" isActive={true}>
                        <BackButton onClick={() => setScreen('grade-select')} />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8">📖 Öğrenme Alanı Seçin</h2>
                        <div className="w-full max-w-2xl max-h-[70vh] overflow-y-auto space-y-3 p-1">
                            {availableLearningAreas.length > 0 ? availableLearningAreas.map(area => (
                                <button
                                    key={area.name}
                                    className="w-full text-left p-5 bg-slate-800/40 border border-slate-700 rounded-xl hover:bg-slate-700/60 hover:border-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xl font-semibold text-slate-100"
                                    onClick={() => { setGameSettings(s => ({ ...s, topic: area.name })); setScreen('kazanim-select'); }}
                                >
                                    {area.name}
                                </button>
                            )) : <p className="text-slate-400">Bu sınıf için öğrenme alanı bulunamadı.</p>}
                        </div>
                    </Screen>
                );
            case 'kazanim-select':
                const learningAreas = curriculumData[gameSettings.grade!] || [];
                const selectedArea = learningAreas.find(oa => oa.name === gameSettings.topic);
                const availableKazanims = selectedArea?.altKonular[0]?.kazanımlar || [];
                return (
                    <Screen id="kazanim-select" isActive={true}>
                        <BackButton onClick={() => setScreen('learning-area-select')} />
                        <h2 className="text-3xl font-bold mb-6">🎯 Kazanım Seçin</h2>
                        <div className="w-full max-w-4xl max-h-[70vh] overflow-y-auto space-y-3 p-1">
                            {availableKazanims.length > 0 ? availableKazanims.map(kazanim => (
                                <button 
                                    key={kazanim.id} 
                                    className="w-full text-left p-4 bg-slate-800/40 border border-slate-700 rounded-xl hover:bg-slate-700/60 hover:border-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    onClick={() => { setGameSettings(s => ({ ...s, kazanımId: kazanim.id })); setScreen('game-mode'); }}
                                >
                                    <span className="font-bold text-amber-300">{kazanim.id}:</span>
                                    <span className="ml-2 text-slate-200">{kazanim.text}</span>
                                </button>
                            )) : <p className="text-slate-400">Bu öğrenme alanı için kazanım bulunamadı.</p>}
                        </div>
                    </Screen>
                );
            case 'game-mode':
                const availableTypes: Record<QuestionType, boolean> = { quiz: false, 'fill-in': false, matching: false };
                questions
                    .filter(q => 
                        q.grade === gameSettings.grade && 
                        q.topic === gameSettings.topic && 
                        q.kazanımId === gameSettings.kazanımId
                    )
                    .forEach(q => {
                        if (q.type in availableTypes) availableTypes[q.type] = true;
                    });
                
                // Helper component for the new card design
                const GameModeCard: React.FC<{
                    icon: string;
                    title: string;
                    description: string;
                    onClick: () => void;
                    disabled: boolean;
                }> = ({ icon, title, description, onClick, disabled }) => {
                    const baseClasses = "flex flex-col items-center p-6 text-center bg-slate-800/40 border border-slate-700 rounded-2xl transition-all duration-300";
                    const enabledClasses = "hover:bg-slate-700/60 hover:border-indigo-400 hover:scale-105 cursor-pointer";
                    const disabledClasses = "opacity-50 cursor-not-allowed";
                    
                    return (
                        <button
                            onClick={onClick}
                            disabled={disabled}
                            className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
                        >
                            <div className="text-5xl mb-4">{icon}</div>
                            <h3 className="text-2xl font-bold text-white">{title}</h3>
                            <p className="text-slate-300 mt-2 text-sm flex-grow">{description}</p>
                        </button>
                    );
                };

                return (
                     <Screen id="game-mode" isActive={true}>
                        <BackButton onClick={() => setScreen('kazanim-select')} />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8">🎯 Oyun Türünü Seçin</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                            <GameModeCard
                                icon="✅"
                                title="Çoktan Seçmeli"
                                description="Verilen soruya karşı sunulan seçeneklerden doğru olanı bulun."
                                onClick={() => { setGameSettings(s => ({ ...s, gameMode: 'quiz'})); setScreen('difficulty-select');}}
                                disabled={!availableTypes.quiz}
                            />
                            <GameModeCard
                                icon="📝"
                                title="Boşluk Doldurma"
                                description="Cümledeki boşluğa en uygun ifadeyi seçenekler arasından seçin."
                                onClick={() => { setGameSettings(s => ({ ...s, gameMode: 'fill-in'})); setScreen('difficulty-select');}}
                                disabled={!availableTypes['fill-in']}
                            />
                            <GameModeCard
                                icon="🔗"
                                title="Eşleştirme"
                                description="İlgili kavramları ve açıklamalarını doğru şekilde bir araya getirin."
                                onClick={() => { setGameSettings(s => ({ ...s, gameMode: 'matching'})); setScreen('difficulty-select');}}
                                disabled={!availableTypes.matching}
                            />
                        </div>
                    </Screen>
                );
             case 'difficulty-select':
                // Helper component for the new difficulty card design
                const DifficultyCard: React.FC<{
                    icon: string;
                    title: string;
                    description: string;
                    variant: 'green' | 'yellow' | 'red';
                    onClick: () => void;
                }> = ({ icon, title, description, variant, onClick }) => {
                    const variantClasses = {
                        green: 'border-green-500/80 hover:border-green-400',
                        yellow: 'border-yellow-500/80 hover:border-yellow-400',
                        red: 'border-red-500/80 hover:border-red-400',
                    };
                    return (
                        <button
                            onClick={onClick}
                            className={`flex flex-col items-center p-6 text-center bg-slate-800/40 border-2 rounded-2xl transition-all duration-300 hover:bg-slate-700/60 hover:scale-105 cursor-pointer ${variantClasses[variant]}`}
                        >
                            <div className="text-5xl mb-4">{icon}</div>
                            <h3 className="text-2xl font-bold text-white">{title}</h3>
                            <p className="text-slate-300 mt-2 text-sm flex-grow">{description}</p>
                        </button>
                    );
                };

                return (
                     <Screen id="difficulty-select" isActive={true}>
                        <BackButton onClick={() => setScreen('game-mode')} />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8">⚡ Zorluk Seviyesini Seçin</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                            <DifficultyCard
                                icon="😊"
                                title="Kolay"
                                description="Rahat bir başlangıç için daha fazla zaman ve temel düzeyde sorular."
                                variant="green"
                                onClick={() => { setGameSettings(s => ({ ...s, difficulty: 'kolay' })); setScreen('competition-mode'); }}
                            />
                            <DifficultyCard
                                icon="🤔"
                                title="Orta"
                                description="Dengeli bir meydan okuma. Standart zaman ve orta zorlukta sorular."
                                variant="yellow"
                                onClick={() => { setGameSettings(s => ({ ...s, difficulty: 'orta' })); setScreen('competition-mode'); }}
                            />
                            <DifficultyCard
                                icon="😤"
                                title="Zor"
                                description="Bilginizi test edin! Kısıtlı zaman ve ileri düzey sorular sizi bekliyor."
                                variant="red"
                                onClick={() => { setGameSettings(s => ({ ...s, difficulty: 'zor' })); setScreen('competition-mode'); }}
                            />
                        </div>
                    </Screen>
                );
            case 'competition-mode':
                // Helper component for the new competition mode card design
                const CompetitionModeCard: React.FC<{
                    icon: string;
                    title: string;
                    description: string;
                    onClick: () => void;
                }> = ({ icon, title, description, onClick }) => (
                    <button
                        onClick={onClick}
                        className="flex flex-col items-center p-8 text-center bg-slate-800/40 border border-slate-700 rounded-2xl transition-all duration-300 hover:bg-slate-700/60 hover:border-indigo-400 hover:scale-105 cursor-pointer w-full"
                    >
                        <div className="text-6xl mb-4">{icon}</div>
                        <h3 className="text-3xl font-bold text-white">{title}</h3>
                        <p className="text-slate-300 mt-2 flex-grow">{description}</p>
                    </button>
                );

                return (
                     <Screen id="competition-mode" isActive={true}>
                        <BackButton onClick={() => setScreen('difficulty-select')} />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8">🏆 Yarışma Türünü Seçin</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
                             <CompetitionModeCard
                                icon="🙋‍♂️"
                                title="Bireysel Yarışma"
                                description="Kendi bilginizi test edin ve en yüksek skoru hedefleyin."
                                onClick={() => { setGameSettings(s => ({ ...s, competitionMode: 'bireysel' })); setScreen('player-name'); }}
                            />
                            <CompetitionModeCard
                                icon="👥"
                                title="Grup Yarışması"
                                description="Arkadaşlarınızla takım olun ve rekabetin tadını çıkarın."
                                onClick={() => { setGameSettings(s => ({ ...s, competitionMode: 'grup' })); setScreen('player-name'); }}
                            />
                        </div>
                    </Screen>
                );
             case 'player-name':
                const isGroupMode = gameSettings.competitionMode === 'grup';
                return (
                    <Screen id="player-name-screen" isActive={true}>
                        <BackButton onClick={() => setScreen('competition-mode')} />
                        <h2 className="text-3xl font-bold mb-6">{isGroupMode ? '👥 Grup İsimlerini Girin' : '👤 Oyuncu Adınızı Girin'}</h2>
                        <form onSubmit={(e) => { e.preventDefault(); startGame(); }} className="flex flex-col items-center gap-6 w-full max-w-sm">
                            {isGroupMode ? (
                                <>
                                    <input
                                        type="text"
                                        value={groupNames.grup1}
                                        onChange={(e) => setGroupNames(prev => ({...prev, grup1: e.target.value}))}
                                        placeholder="Grup 1 Adı..."
                                        maxLength={20}
                                        className="w-full text-center p-4 text-xl bg-white/10 rounded-xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <input
                                        type="text"
                                        value={groupNames.grup2}
                                        onChange={(e) => setGroupNames(prev => ({...prev, grup2: e.target.value}))}
                                        placeholder="Grup 2 Adı..."
                                        maxLength={20}
                                        className="w-full text-center p-4 text-xl bg-white/10 rounded-xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </>
                            ) : (
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="Adınızı yazın..."
                                    maxLength={20}
                                    className="w-full text-center p-4 text-xl bg-white/10 rounded-xl border border-white/20 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            )}
                            <Button 
                                type="submit" 
                                className="w-full"
                                disabled={isGroupMode ? false : !playerName.trim()}
                            >
                                Oyunu Başlat →
                            </Button>
                        </form>
                    </Screen>
                );
            case 'game':
                return questionsForGame.length > 0 ? (
                    <Screen id="game-screen" isActive={true} className="justify-between">
                        <GameScreen 
                            questions={questionsForGame} 
                            settings={gameSettings} 
                            onGameEnd={handleGameEnd} 
                            groupNames={groupNames}
                        />
                    </Screen>
                ) : (
                     <Screen id="no-questions" isActive={true}>
                        <h2 className="text-2xl mb-4">Soru Bulunamadı</h2>
                        <p className="mb-6">Seçtiğiniz kriterlere uygun soru bulunamadı.</p>
                        <Button onClick={() => setScreen('game-mode')}>Geri Dön</Button>
                    </Screen>
                );
            case 'end':
                const { score, finalGroupScores } = lastGameResult;
                return (
                    <Screen id="end-screen" isActive={true}>
                        <h2 className="text-5xl font-bold mb-4">🎉 Oyun Bitti!</h2>
                        <div className="text-2xl mb-8 leading-relaxed">
                            {finalGroupScores ? (
                                <>
                                    <p>{groupNames.grup1}: {finalGroupScores.grup1} Puan</p>
                                    <p>{groupNames.grup2}: {finalGroupScores.grup2} Puan</p>
                                    <p className="mt-4 font-bold text-yellow-300">
                                      {finalGroupScores.grup1 > finalGroupScores.grup2 ? `🏆 Kazanan: ${groupNames.grup1}!` : finalGroupScores.grup2 > finalGroupScores.grup1 ? `🏆 Kazanan: ${groupNames.grup2}!` : "🤝 Berabere!"}
                                    </p>
                                </>
                            ) : (
                                <p>🎯 Toplam Skorun: {score}</p>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={resetGame}>🏠 Ana Menü</Button>
                            <Button variant="secondary" onClick={() => setScreen('high-scores')}>🏆 Yüksek Skorlar</Button>
                        </div>
                    </Screen>
                );
            case 'high-scores':
                return (
                    <Screen id="high-scores-screen" isActive={true}>
                        <BackButton onClick={() => setScreen('start')} />
                        <h2 className="text-4xl font-bold mb-6">🏆 Yüksek Skorlar</h2>
                        <div className="w-full max-w-2xl space-y-3">
                            {highScores.length > 0 ? highScores.map((hs, index) => (
                                <div key={index} className="bg-yellow-300/10 backdrop-blur-md border border-yellow-300/30 rounded-lg p-4 flex justify-between items-center text-left">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-bold w-8">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}</span>
                                        <div>
                                            <p className="font-bold text-lg">{hs.name}</p>
                                            <p className="text-sm text-slate-300">{hs.settings.topic}</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-xl">{hs.score}</p>
                                </div>
                            )) : <p>Henüz kayıtlı skor yok.</p>}
                        </div>
                         {highScores.length > 0 && <Button variant="warning" className="mt-6 text-base px-6 py-2" onClick={() => setHighScores([])}>🗑️ Skorları Temizle</Button>}
                    </Screen>
                );
            case 'teacher-panel':
                return (
                    <Screen id="teacher-panel-screen" isActive={true} className="p-0 sm:p-0">
                         <BackButton onClick={() => setScreen('start')} />
                         <TeacherPanel questions={questions} setQuestions={setQuestions} onSelectQuestion={handleSelectQuestion} />
                    </Screen>
                );
            default:
                return <div>Bilinmeyen Ekran</div>;
        }
    };
    
    return (
        <main className="h-screen w-screen font-sans overflow-hidden">
            <div className="relative w-full h-full p-2 sm:p-4">
                <div className="w-full h-full bg-slate-900/30 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                    {renderScreen()}
                </div>
            </div>
        </main>
    );
}