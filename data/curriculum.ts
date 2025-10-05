export interface Kazanım {
  id: string;
  text: string;
}

export interface AltKonu {
  name: string;
  kazanımlar: Kazanım[];
}

export interface OgrenmeAlani { // Learning Area
  name: string;
  altKonular: AltKonu[];
}

export const curriculumData: Record<string, Record<number, OgrenmeAlani[]>> = {
  'social-studies': {
    5: [
      {
        name: 'Birlikte Yaşamak',
        altKonular: [
          {
            name: 'Birlikte Yaşamak',
            kazanımlar: [
              { id: 'SB.5.1.1', text: 'Dâhil olduğu gruplar ve bu gruplardaki rolleri arasındaki ilişkileri çözümleyebilme' },
              { id: 'SB.5.1.2', text: 'Kültürel özelliklere saygı duymanın birlikte yaşamaya etkisini yorumlayabilme' },
              { id: 'SB.5.1.3', text: 'Toplumsal birliği sürdürmeye yönelik yardımlaşma ve dayanışma faaliyetlerine katkı sağlayabilme' },
            ],
          },
        ],
      },
      {
        name: 'Evimiz Dünya',
        altKonular: [
          {
            name: 'Evimiz Dünya',
            kazanımlar: [
              { id: 'SB.5.2.1', text: 'Yaşadığı ilin göreceli konum özelliklerini belirleyebilme' },
              { id: 'SB.5.2.2', text: 'Yaşadığı ilde doğal ve beşerî çevredeki değişimi neden ve sonuçlarıyla yorumlayabilme' },
              { id: 'SB.5.2.3', text: 'Yaşadığı ilde meydana gelebilecek afetlerin etkilerini azaltmaya yönelik farkındalık etkinlikleri düzenleyebilme' },
              { id: 'SB.5.2.4', text: 'Ülkemize komşu devletler hakkında bilgi toplayabilme' },
            ]
          },
        ]
      },
      {
          name: 'Ortak Mirasımız',
          altKonular: [
            {
              name: 'Ortak Mirasımız',
              kazanımlar: [
                { id: 'SB.5.3.1', text: 'Yaşadığı ildeki ortak miras ögelerine ilişkin oluşturduğu ürünü paylaşabilme' },
                { id: 'SB.5.3.2', text: 'Anadolu’da ilk yerleşimleri kuran toplumların sosyal hayatlarına yönelik bakış açısı geliştirebilme' },
                { id: 'SB.5.3.3', text: 'Mezopotamya ve Anadolu medeniyetlerinin ortak mirasa katkılarını karşılaştırabilme' },
              ]
            },
          ]
      },
      {
          name: 'Yaşayan Demokrasimiz',
          altKonular: [
              {
                  name: 'Yaşayan Demokrasimiz',
                  kazanımlar: [
                      { id: 'SB.5.4.1', text: 'Demokrasi ve cumhuriyet kavramları arasındaki ilişkiyi çözümleyebilme' },
                      { id: 'SB.5.4.2', text: 'Toplum düzenine etkisi bakımından etkin vatandaş olmanın önemine yönelik çıkarımda bulunabilme' },
                      { id: 'SB.5.4.3', text: 'Temel insan hak ve sorumluluklarının önemini sorgulayabilme' },
                      { id: 'SB.5.4.4', text: 'Bir ihtiyaç hâlinde veya sorun karşısında başvuru yapılabilecek kurumlar hakkında bilgi toplayabilme' },
                  ]
              }
          ]
      },
      {
          name: 'Hayatımızdaki Ekonomi',
          altKonular: [
              {
                  name: 'Hayatımızdaki Ekonomi',
                  kazanımlar: [
                      { id: 'SB.5.5.1', text: 'Kaynakları verimli kullanmanın doğa ve insanlar üzerindeki etkisini yorumlayabilme' },
                      { id: 'SB.5.5.2', text: 'İhtiyaç ve isteklerini karşılamak için gerekli bütçeyi planlayabilme' },
                      { id: 'SB.5.5.3', text: 'Yaşadığı ildeki ekonomik faaliyetleri özetleyebilme' },
                  ]
              }
          ]
      },
      {
          name: 'Teknoloji ve Sosyal Bilimler',
          altKonular: [
              {
                  name: 'Teknoloji ve Sosyal Bilimler',
                  kazanımlar: [
                      { id: 'SB.5.6.1', text: 'Teknolojik gelişmelerin toplum hayatına etkilerini tartışabilme' },
                      { id: 'SB.5.6.2', text: 'Teknolojik ürünlerin bilinçli kullanımının önemine ilişkin ürün oluşturabilme' },
                  ]
              }
          ]
      }
    ],
    6: [
      {
        name: 'Birlikte Yaşamak',
        altKonular: [
          {
            name: 'Birlikte Yaşamak',
            kazanımlar: [
              { id: 'SB.6.1.1', text: 'Dâhil olduğu grupların ve bu gruplardaki rollerinin zaman içerisinde değişebileceğine ilişkin çıkarım yapabilme' },
              { id: 'SB.6.1.2', text: 'Kültürel bağlarımızın ve millî değerlerimizin toplumsal birliğe etkisini yorumlayabilme' },
              { id: 'SB.6.1.3', text: 'Toplumsal hayatta karşılaşılan sorunlara yönelik çözüm önerilerini müzakere edebilme' },
            ]
          }
        ]
      },
      {
          name: 'Evimiz Dünya',
          altKonular: [
              {
                  name: 'Evimiz Dünya',
                  kazanımlar: [
                      { id: 'SB.6.2.1', text: 'Ülkemizin, kıtaların ve okyanusların konum özelliklerini belirleyebilme' },
                      { id: 'SB.6.2.2', text: 'Ülkemizin doğal ve beşerî çevre özellikleri arasındaki ilişkiyi çözümleyebilme' },
                      { id: 'SB.6.2.3', text: 'Ülkemizin Türk dünyasıyla kültürel iş birliklerini yorumlayabilme' },
                  ]
              }
          ]
      },
      {
          name: 'Ortak Mirasımız',
          altKonular: [
              {
                  name: 'Ortak Mirasımız',
                  kazanımlar: [
                      { id: 'SB.6.3.1', text: 'Türkistan’da kurulan ilk Türk devletlerinin medeniyetimize katkılarını sorgulayabilme' },
                      { id: 'SB.6.3.2', text: 'VII-XIII. yüzyıllar arasında İslam medeniyetinin insanlığın ortak mirasına katkılarına dair akıl yürütebilme' },
                      { id: 'SB.6.3.3', text: 'İslamiyet’in kabulüyle Türklerin sosyal ve kültürel hayatlarında meydana gelen değişimi dönemin bakış açısıyla değerlendirebilme' },
                      { id: 'SB.6.3.4', text: 'XI-XIII. yüzyıllar arasındaki askerî mücadelelerin Anadolu’nun Türkleşmesi ve İslamlaşmasına etkisini özetleyebilme' },
                  ]
              }
          ]
      },
      {
          name: 'Yaşayan Demokrasimiz',
          altKonular: [
              {
                  name: 'Yaşayan Demokrasimiz',
                  kazanımlar: [
                      { id: 'SB.6.4.1', text: 'Yönetimin karar alma sürecini etkileyen unsurları çözümleyebilme' },
                      { id: 'SB.6.4.2', text: 'Toplumsal düzenin sürdürülmesinde temel hak ve sorumlulukların önemini yorumlayabilme' },
                      { id: 'SB.6.4.3', text: 'Vatandaşlık haklarının kullanımında dijitalleşme ve teknolojik gelişmelerin etkilerini sorgulayabilme' },
                  ]
              }
          ]
      },
      {
          name: 'Hayatımızdaki Ekonomi',
          altKonular: [
              {
                  name: 'Hayatımızdaki Ekonomi',
                  kazanımlar: [
                      { id: 'SB.6.5.1', text: 'Ülkemizin kaynakları ile ekonomik faaliyetler arasındaki ilişkiyi çözümleyebilme' },
                      { id: 'SB.6.5.2', text: 'Ekonomik faaliyetler ve meslekler arasındaki ilişki hakkında çıkarımda bulunabilme' },
                      { id: 'SB.6.5.3', text: 'Tasarladığı bir ürün için yatırım ve pazarlama proje önerisi hazırlayabilme' },
                  ]
              }
          ]
      },
      {
          name: 'Teknoloji ve Sosyal Bilimler',
          altKonular: [
              {
                  name: 'Teknoloji ve Sosyal Bilimler',
                  kazanımlar: [
                      { id: 'SB.6.6.1', text: 'Ulaşım ve iletişim teknolojilerindeki gelişmelerin kültürel etkileşimdeki rolünü yapılandırabilme (geleceğe yönelik anlamlı bütün oluşturma)' },
                      { id: 'SB.6.6.2', text: 'Bir ürün veya fikrin telif ve patent süreçleriyle ilgili bilgi toplayabilme' },
                  ]
              }
          ]
      }
    ],
    7: [
      {
        name: 'Birey ve Toplum',
        altKonular: [
          {
            name: 'Birey ve Toplum',
            kazanımlar: [
              { id: 'SB.7.1.1', text: 'İletişimi etkileyen tutum ve davranışları analiz ederek kendi tutum ve davranışlarını sorgular.' },
              { id: 'SB.7.1.2', text: 'Bireysel ve toplumsal ilişkilerde olumlu iletişim yollarını kullanır.' },
              { id: 'SB.7.1.3', text: 'Medyanın sosyal değişim ve etkileşimdeki rolünü tartışır.' },
              { id: 'SB.7.1.4', text: 'İletişim araçlarından yararlanırken haklarını kullanır ve sorumluluklarını yerine getirir.' },
            ],
          },
        ],
      },
      {
        name: 'Kültür ve Miras',
        altKonular: [
          {
            name: 'Kültür ve Miras',
            kazanımlar: [
              { id: 'SB.7.2.1', text: 'Osmanlı Devleti’nin siyasi güç olarak ortaya çıkış sürecini ve bu süreci etkileyen faktörleri açıklar.' },
              { id: 'SB.7.2.2', text: 'Osmanlı Devleti’nin fetih siyasetini örnekler üzerinden analiz eder.' },
              { id: 'SB.7.2.3', text: 'Avrupa’daki gelişmelerle bağlantılı olarak Osmanlı Devleti’ni değişime zorlayan süreçleri kavrar.' },
              { id: 'SB.7.2.4', text: 'Osmanlı Devleti’nde ıslahat hareketleri sonucu ortaya çıkan kurumlardan hareketle toplumsal ve ekonomik değişim hakkında çıkarımlarda bulunur.' },
            ],
          },
        ],
      },
      {
        name: 'İnsanlar, Yerler ve Çevreler',
        altKonular: [
          {
            name: 'İnsanlar, Yerler ve Çevreler',
            kazanımlar: [
              { id: 'SB.7.3.1', text: 'Örnek incelemeler yoluyla geçmişten günümüze, yerleşmeyi etkileyen faktörler hakkında çıkarımlarda bulunur.' },
              { id: 'SB.7.3.2', text: 'Türkiye’de nüfusun dağılışını etkileyen faktörlerden hareketle Türkiye’nin demografik özelliklerini yorumlar.' },
              { id: 'SB.7.3.3', text: 'Örnek incelemeler yoluyla göçün neden ve sonuçlarını tartışır.' },
              { id: 'SB.7.3.4', text: 'Temel haklardan yerleşme ve seyahat özgürlüğünün kısıtlanması halinde ortaya çıkacak olumsuz durumlara örnekler gösterir.' },
            ],
          },
        ],
      },
      {
        name: 'Bilim, Teknoloji ve Toplum',
        altKonular: [
          {
            name: 'Bilim, Teknoloji ve Toplum',
            kazanımlar: [
              { id: 'SB.7.4.1', text: 'Bilginin korunması, yaygınlaştırılması ve aktarılmasında değişim ve sürekliliği inceler.' },
              { id: 'SB.7.4.2', text: 'Türk-İslam medeniyetinde yetişen bilginlerin bilimsel gelişme sürecine katkılarını tartışır.' },
              { id: 'SB.7.4.3', text: 'XV–XX. yüzyıllar arasında Avrupa’da yaşanan gelişmelerin günümüz bilimsel birikiminin oluşmasına etkisini analiz eder.' },
              { id: 'SB.7.4.4', text: 'Özgür düşüncenin bilimsel gelişmelere katkısını değerlendirir.' },
            ],
          },
        ],
      },
      {
        name: 'Üretim, Dağıtım ve Tüketim',
        altKonular: [
          {
            name: 'Üretim, Dağıtım ve Tüketim',
            kazanımlar: [
              { id: 'SB.7.5.1', text: 'Üretimde ve yönetimde toprağın önemini geçmişten ve günümüzden örneklerle açıklar.' },
              { id: 'SB.7.5.2', text: 'Üretim teknolojisindeki gelişmelerin sosyal ve ekonomik hayata etkilerini değerlendirir.' },
              { id: 'SB.7.5.3', text: 'Kurumların ve sivil toplum kuruluşlarının çalışmalarına ve sosyal yaşamdaki rollerine örnekler verir.' },
              { id: 'SB.7.5.4', text: 'Tarih boyunca Türklerde meslek edindirme ve meslek etiği kazandırmada rol oynayan kurumları tanır.' },
              { id: 'SB.7.5.5', text: 'Dünyadaki gelişmelere bağlı olarak ortaya çıkan yeni meslekleri dikkate alarak mesleki tercihlerine yönelik planlama yapar.' },
              { id: 'SB.7.5.6', text: 'Dijital teknolojilerin üretim, dağıtım ve tüketim ağında meydana getirdiği değişimleri analiz eder.' },
            ],
          },
        ],
      },
      {
        name: 'Etkin Vatandaşlık',
        altKonular: [
          {
            name: 'Etkin Vatandaşlık',
            kazanımlar: [
              { id: 'SB.7.6.1', text: 'Demokrasinin ortaya çıkışını, gelişim evrelerini ve günümüzde ifade ettiği anlamları açıklar.' },
              { id: 'SB.7.6.2', text: 'Atatürk’ün Türk demokrasisinin gelişimine katkılarını açıklar.' },
              { id: 'SB.7.6.3', text: 'Türkiye Cumhuriyeti Devleti’nin temel niteliklerini toplumsal hayattaki uygulamalarla ilişkilendirir.' },
              { id: 'SB.7.6.4', text: 'Demokrasinin uygulanma süreçlerinde karşılaşılan sorunları analiz eder.' },
            ],
          },
        ],
      },
    ],
    8: [
      {
        name: 'Bir Kahraman Doğuyor',
        altKonular: [
          {
            name: 'Bir Kahraman Doğuyor',
            kazanımlar: [
              { id: 'İTA.8.1.1', text: 'Avrupa’daki gelişmelerin yansımaları bağlamında Osmanlı Devleti’nin 20. yüzyıl başındaki siyasi ve sosyal durumunu kavrar.' },
              { id: 'İTA.8.1.2', text: 'Atatürk’ün ailesi, çocukluğu ve gençlik dönemi özelliklerini dönemin koşullarıyla ilişkilendirerek yorumlar.' },
            ],
          },
        ],
      },
      {
        name: 'Millî Uyanış: Bağımsızlık Yolunda Atılan Adımlar',
        altKonular: [
          {
            name: 'Millî Uyanış: Bağımsızlık Yolunda Atılan Adımlar',
            kazanımlar: [
              { id: 'İTA.8.2.1', text: 'Osmanlı Devleti’nin bu dönemdeki dış ve iç sorunlarını neden-sonuç ilişkisiyle açıklar.' },
              { id: 'İTA.8.2.2', text: 'I. Dünya Savaşı’na girme kararının dönemin şartlarıyla bağlantısını değerlendirir.' },
              { id: 'İTA.8.2.3', text: 'Mondros Ateşkes Antlaşması’nın imzalanması ve uygulanmasına yönelik Osmanlı yönetimi, Mustafa Kemal ve halkın tepkilerini analiz eder.' },
              { id: 'İTA.8.2.4', text: 'Kuvâ-yı Millîye’nin oluşum sürecini ve gelişimini kavrar.' },
            ],
          },
        ],
      },
      {
        name: 'Millî Bir Destan: Ya İstiklal Ya Ölüm!',
        altKonular: [
          {
            name: 'Millî Bir Destan: Ya İstiklal Ya Ölüm!',
            kazanımlar: [
              { id: 'İTA.8.3.1', text: 'Sivas Kongresi, Erzurum Kongresi gibi kararların önemini yorumlar.' },
              { id: 'İTA.8.3.2', text: 'TBMM’nin açılması ve işlevlerini dönemin koşullarıyla ilişkilendirerek değerlendirebilir.' },
              { id: 'İTA.8.3.3', text: 'Büyük Taarruz’un stratejisi ve sonuçlarını analiz eder.' },
              { id: 'İTA.8.3.4', text: 'Türk milletinin Millî Mücadele sürecindeki rolüne ilişkin eser veya sunu oluşturur.' },
            ],
          },
        ],
      },
      {
        name: 'Atatürkçülük ve Çağdaşlaşan Türkiye',
        altKonular: [
          {
            name: 'Atatürkçülük ve Çağdaşlaşan Türkiye',
            kazanımlar: [
              { id: 'İTA.8.4.1', text: 'Cumhuriyet’in ilanına kadar geçen siyasi ve diplomatik gelişmeleri özetler.' },
              { id: 'İTA.8.4.2', text: 'Atatürk’ün yaptığı inkılapları neden-sonuç ilişkisiyle analiz eder.' },
              { id: 'İTA.8.4.3', text: 'Atatürk ilke ve inkılapları arasında ilişkinin ortaya koyan üretici bir etkinlik yapar.' },
            ],
          },
        ],
      },
      {
        name: 'Demokratikleşme Çabaları',
        altKonular: [
          {
            name: 'Demokratikleşme Çabaları',
            kazanımlar: [
              { id: 'İTA.8.5.1', text: 'Atatürk dönemi demokratikleşme çabalarını açıklar (Cumhuriyet Halk Fırkası, Serbest Cumhuriyet Fırkası vb.).' },
              { id: 'İTA.8.5.2', text: 'Mustafa Kemal’e suikast girişimini analiz eder.' },
            ],
          },
        ],
      },
      {
        name: 'Atatürk Dönemi Türk Dış Politikası',
        altKonular: [
          {
            name: 'Atatürk Dönemi Türk Dış Politikası',
            kazanımlar: [
              { id: 'İTA.8.6.1', text: 'Türkiye’nin komşularla ilişkilerini tarihsel bağlamda değerlendirir.' },
              { id: 'İTA.8.6.2', text: 'Lozan Antlaşması’nın önemini ve etkilerini yorumlar.' },
              { id: 'İTA.8.6.3', text: 'Türkiye’nin uluslararası konumunu 20. yüzyıl başı koşullarıyla ilişkilendirerek analiz eder.' },
            ],
          },
        ],
      },
      {
        name: 'Atatürk’ün Ölümü ve Sonrası',
        altKonular: [
          {
            name: 'Atatürk’ün Ölümü ve Sonrası',
            kazanımlar: [
              { id: 'İTA.8.7.1', text: 'Atatürk’ün vefatının Türkiye ve dünya üzerindeki etkilerini tarihsel perspektifle açıklar.' },
              { id: 'İTA.8.7.2', text: 'Cumhuriyetin temel değerlerini ve mirasını tartışır.' },
              { id: 'İTA.8.7.3', text: 'Cumhurbaşkanlığı dönemini ve sonraki gelişmeleri analiz eder.' },
            ],
          },
        ],
      },
    ],
  },
  'math': {
    5: [
      {
        name: 'Sayılar ve Nicelikler',
        altKonular: [
          {
            name: 'Sayılar ve Nicelikler',
            kazanımlar: [
              { id: 'MAT.5.1.1', text: 'Altı basamaklı sayıları okuma ve yazmayı çok basamaklı sayılara genelleyebilme' },
              { id: 'MAT.5.1.2', text: 'Doğal sayılar ve işlemler içeren gerçek yaşam problemlerini çözebilme' },
              { id: 'MAT.5.1.3', text: 'Gerçek yaşam durumlarına karşılık gelen kesirleri farklı biçimlerde temsil edebilme' },
              { id: 'MAT.5.1.4', text: 'Farklı gösterimlerle ifade edilen kesirlerin karşılaştırılmasına yönelik çıkarım yapabilme' },
            ],
          },
        ],
      },
      {
        name: 'İşlemlerle Cebirsel Düşünme',
        altKonular: [
          {
            name: 'İşlemlerle Cebirsel Düşünme',
            kazanımlar: [
              { id: 'MAT.5.2.1', text: 'Eşitliğin korunumuna ve işlem özelliklerine yönelik çıkarım yapabilme' },
              { id: 'MAT.5.2.2', text: 'Karşılaştığı günlük hayat ya da matematiksel durumlarda işlem önceliğini yorumlayabilme' },
              { id: 'MAT.5.2.3', text: 'Sayı ve şekil örüntülerinin kuralına ilişkin muhakeme yapabilme' },
              { id: 'MAT.5.2.4', text: 'Temel aritmetik işlem içeren durumlardaki algoritmaları yorumlayabilme' },
            ],
          },
        ],
      },
      {
        name: 'Geometrik Şekiller',
        altKonular: [
          {
            name: 'Geometrik Şekiller',
            kazanımlar: [
              { id: 'MAT.5.3.1', text: 'Temel geometrik çizimler için matematiksel araç ve teknolojiden yararlanabilme' },
              { id: 'MAT.5.3.2', text: 'Temel geometrik çizimlere dayalı deneyimlerini yansıtabilme' },
              { id: 'MAT.5.3.3', text: 'Açıları ölçmek için matematiksel araç ve teknolojiden yararlanabilme' },
              { id: 'MAT.5.3.4', text: 'Düzlemde iki veya üç doğrunun birbirine göre durumuna bağlı olarak oluşabilecek açılara dair çıkarım yapabilme' },
              { id: 'MAT.5.3.5', text: 'Çokgenleri düzlemde ardışık olarak kesişen doğruların oluşturduğu kapalı şekiller olarak yorumlayabilme' },
              { id: 'MAT.5.3.6', text: 'Çokgenlerin özellikleri ile ilgili edindiği deneyimleri yansıtabilme' },
              { id: 'MAT.5.3.7', text: 'Matematiksel araç ve teknoloji yardımıyla düzlemde iki noktada kesişen çember çiftinin merkezleri ve kesişim noktalarından biri ile inşa edilen üçgenlerin kenar özelliklerine yönelik muhakeme yapabilme' },
            ],
          },
        ],
      },
      {
        name: 'Geometrik Nicelikler',
        altKonular: [
          {
            name: 'Geometrik Nicelikler',
            kazanımlar: [
              { id: 'MAT.5.4.1', text: 'Kenar uzunlukları doğal sayı olan bir dikdörtgenin çevre uzunluğu verildiğinde kenar uzunluklarını yorumlayabilme' },
              { id: 'MAT.5.4.2', text: 'Birim karelerden yola çıkarak dikdörtgenin alanını değerlendirebilme' },
              { id: 'MAT.5.4.3', text: 'Kenar uzunlukları doğal sayı olan bir dikdörtgenin alanının ölçüsü verildiğinde çevre uzunluğunu, çevre uzunluğu verildiğinde alanını yorumlayabilme' },
              { id: 'MAT.5.4.4', text: 'Dikdörtgenin çevre uzunluğu ve alanı ile ilgili problemleri çözebilme' },
            ],
          },
        ],
      },
      {
        name: 'İstatistiksel Araştırma Süreci',
        altKonular: [
          {
            name: 'İstatistiksel Araştırma Süreci',
            kazanımlar: [
              { id: 'MAT.5.5.1', text: 'Kategorik veri ile çalışabilme ve veriye dayalı karar verebilme' },
              { id: 'MAT.5.5.2', text: 'Başkaları tarafından oluşturulan kategorik veriye dayalı istatistiksel sonuç veya yorumları tartışabilme' },
            ],
          },
        ],
      },
      {
        name: 'Veriden Olasılığa',
        altKonular: [
          {
            name: 'Veriden Olasılığa',
            kazanımlar: [
              { id: 'MAT.5.6.1', text: 'Herhangi bir olayın olasılığının 0 (imkânsız) ile 1 (kesin) arasında (0 ve 1 dâhil) olduğunu (olasılık spektrumu) yorumlayabilme' },
              { id: 'MAT.5.6.2', text: 'Olayları az ya da çok olasılıklı şeklinde yapılandırabilme' },
            ],
          },
        ],
      },
    ],
    6: [
      {
        name: 'Sayılar ve Nicelikler',
        altKonular: [
          {
            name: 'Sayılar ve Nicelikler',
            kazanımlar: [
              { id: 'MAT.6.1.1', text: 'Problem durumlarında bir doğal sayının çarpan/kat ilişkisini keşfedip gerekçelendirebilme.' },
              { id: 'MAT.6.1.2', text: '2, 3, 4, 5, 6, 9 ve 10 ile tam bölünebilme kriterlerine yönelik çıkarım yapabilme ve kullanabilme.' },
              { id: 'MAT.6.1.3', text: 'Bir doğal sayının asal olup olmadığını ve asal çarpanlarını belirleyebilme.' },
              { id: 'MAT.6.1.4', text: 'İki sayının ortak bölen/ortak kat ilişkisini temsillerle yorumlayabilme.' },
              { id: 'MAT.6.1.5', text: 'Ondalık gösterimlerin basamak değerlerini kesirleri kullanarak yorumlayabilme.' },
              { id: 'MAT.6.1.6', text: 'Kesir–bölme ilişkisini (sonlu/devirli ondalıklar) tümevarımla açıklayabilme.' },
              { id: 'MAT.6.1.7', text: 'Standart uzunluk ölçme birimlerini inceleyip değerlendirebilme.' },
              { id: 'MAT.6.1.8', text: 'Kesir, ondalık ve yüzde ile dört işlem gerektiren gerçek yaşam problemlerini çözebilme.' },
            ],
          },
        ],
      },
      {
        name: 'İşlemlerle Cebirsel Düşünme ve Değişimler',
        altKonular: [
          {
            name: 'İşlemlerle Cebirsel Düşünme ve Değişimler',
            kazanımlar: [
              { id: 'MAT.6.2.1', text: 'Gerçek yaşamda bilinen niceliklerden bilinmeyen niceliklere geçişi tablo ve cebirle ifade edip anlamlandırabilme.' },
              { id: 'MAT.6.2.2', text: 'Sayı ve şekil örüntülerini yorumlayıp farklı temsillerle gösterme ve cebirsel ifade etme.' },
              { id: 'MAT.6.2.3', text: 'Cebirsel ifadeler içeren durumların algoritmalarını yorumlayabilme.' },
            ],
          },
        ],
      },
      {
        name: 'Geometrik Şekiller',
        altKonular: [
          {
            name: 'Geometrik Şekiller',
            kazanımlar: [
              { id: 'MAT.6.3.1', text: 'İki paralel doğru ve bir kesenle oluşan açıları sınıflandırma ve adlandırma.' },
              { id: 'MAT.6.3.2', text: 'İki paralel doğru ve iki kesenin oluşturduğu şekillerin temel özelliklerine (üçgen/dörtgen ilişkileri dâhil) dair çıkarım yapma.' },
              { id: 'MAT.6.3.3', text: 'Köşegenleri birbirini ortalayan dörtgenlere ilişkin özellikleri keşfetme.' },
              { id: 'MAT.6.3.4', text: 'Üçgen ve temel dörtgenlerin açılarıyla ilgili problemleri çözme.' },
            ],
          },
        ],
      },
      {
        name: 'Geometrik Nicelikler',
        altKonular: [
          {
            name: 'Geometrik Nicelikler',
            kazanımlar: [
              { id: 'MAT.6.4.1', text: 'Uzunluk ve alan birimleri arasındaki ilişkileri analojiyle açıklayabilme.' },
              { id: 'MAT.6.4.2', text: 'Dikdörtgen alanından hareketle paralelkenar ve üçgen alan bağıntılarına ulaşabilme.' },
              { id: 'MAT.6.4.3', text: 'Alanla modellenen gerçek yaşam problemlerini çözebilme.' },
              { id: 'MAT.6.4.4', text: 'Çember uzunluğu–çap ilişkisine dayalı çıkarım yapabilme (π’yi fark etme).' },
              { id: 'MAT.6.4.5', text: 'Çap/yarıçap verildiğinde çember uzunluğu ile ilgili problemler çözebilme.' },
              { id: 'MAT.6.4.6', text: 'Merkez açı ölçüsü–yay uzunluğu ilişkisini tümevarımla genelleyebilme.' },
            ],
          },
        ],
      },
      {
        name: 'İstatistiksel Araştırma Süreci',
        altKonular: [
          {
            name: 'İstatistiksel Araştırma Süreci',
            kazanımlar: [
              { id: 'MAT.6.5.1', text: 'Kategorik veya nicel (kesikli) veriye dayalı istatistiksel araştırma yürütme ve veriye dayalı karar verebilme.' },
              { id: 'MAT.6.5.2', text: 'Başkalarınca üretilmiş istatistiksel sonuç/yorumları temellendirip, hataları/yanlılıkları saptayarak tartışabilme.' },
            ],
          },
        ],
      },
      {
        name: 'Veriden Olasılığa',
        altKonular: [
          {
            name: 'Veriden Olasılığa',
            kazanımlar: [
              { id: 'MAT.6.6.1', text: 'Bir olayın olasılığını deneysel veriye (göreli sıklığa) dayalı olarak tahmin/hesaplayabilme.' },
            ],
          },
        ],
      },
    ],
    7: [
       {
        name: 'Sayılar ve İşlemler',
        altKonular: [
          {
            name: 'Sayılar ve İşlemler',
            kazanımlar: [
              { id: 'M.7.1.1', text: 'Tam Sayılarla İşlemler (toplama/çıkarma/çarpma-bölme, işlem özellikleri, problem çözme).' },
              { id: 'M.7.1.2', text: 'Rasyonel Sayılar (tanıma, gösterme, karşılaştırma/sıralama).' },
              { id: 'M.7.1.3', text: 'Rasyonel Sayılarla İşlemler (dört işlem ve problem çözme).' },
              { id: 'M.7.1.4', text: 'Oran ve Orantı (oran kavramı, denk oranlar, doğru orantı durumları).' },
              { id: 'M.7.1.5', text: 'Yüzdeler (yüzde kavramı, yüzdeyle problem çözme).' },
            ],
          },
        ],
      },
      {
        name: 'Cebir',
        altKonular: [
          {
            name: 'Cebir',
            kazanımlar: [
              { id: 'M.7.2.1', text: 'Cebirsel İfadeler (terim, katsayı, eşdeğer ifadeler).' },
              { id: 'M.7.2.2', text: 'Eşitlik ve Denklem (eşitliğin korunumu; 1. dereceden bir bilinmeyenli denklemler ve problemler).' },
            ],
          },
        ],
      },
      {
        name: 'Geometri ve Ölçme',
        altKonular: [
          {
            name: 'Geometri ve Ölçme',
            kazanımlar: [
              { id: 'M.7.3.1', text: 'Doğrular ve Açılar (paralel–kesen, yöndeş/ters/iç ters, açıortay vb.).' },
              { id: 'M.7.3.2', text: 'Çokgenler (özellikler, temel ilişkiler).' },
              { id: 'M.7.3.3', text: 'Çember ve Daire (elemanlar ve temel özellikler).' },
              { id: 'M.7.3.4', text: 'Cisimlerin Farklı Yönlerden Görünümleri.' },
            ],
          },
        ],
      },
      {
        name: 'Veri İşleme',
        altKonular: [
          {
            name: 'Veri İşleme',
            kazanımlar: [
              { id: 'M.7.4.1', text: 'Veri Analizi (temel merkezî eğilim ölçüleri ve grafikler).' },
            ],
          },
        ],
      },
    ],
    8: [
      {
        name: 'SAYILAR VE İŞLEMLER',
        altKonular: [
          {
            name: 'Çarpanlar ve Katlar',
            kazanımlar: [
              { id: 'M.8.1.1.1', text: 'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur; pozitif tam sayıların çarpanlarını üslü ifadelerin çarpımı şeklinde yazar.' },
              { id: 'M.8.1.1.2', text: 'İki doğal sayının EBOB’unu ve EKOK’unu hesaplar; ilgili problemleri çözer.' },
              { id: 'M.8.1.1.3', text: 'Verilen iki doğal sayının aralarında asal olup olmadığını belirler.' },
            ],
          },
          {
            name: 'Üslü İfadeler',
            kazanımlar: [
              { id: 'M.8.1.2.1', text: 'Tam sayıların tam sayı kuvvetlerini hesaplar.' },
              { id: 'M.8.1.2.2', text: 'Üslü ifadelerle ilgili temel kuralları anlar; birbirine denk ifadeler oluşturur.' },
              { id: 'M.8.1.2.3', text: 'Sayıların ondalık gösterimlerini 10’un tam sayı kuvvetleriyle çözümler.' },
              { id: 'M.8.1.2.4', text: 'Bir sayıyı 10’un farklı tam sayı kuvvetlerini kullanarak ifade eder.' },
              { id: 'M.8.1.2.5', text: 'Çok büyük/çok küçük sayıları bilimsel gösterimle ifade eder ve karşılaştırır.' },
            ],
          },
          {
            name: 'Kareköklü İfadeler',
            kazanımlar: [
              { id: 'M.8.1.3.1', text: 'Tamkare pozitif tam sayılarla bu sayıların karekökleri arasındaki ilişkiyi belirler.' },
              { id: 'M.8.1.3.2', text: 'Tamkare olmayan kareköklü bir sayının hangi iki doğal sayı arasında olduğunu belirler.' },
              { id: 'M.8.1.3.3', text: 'Kareköklü bir ifadeyi a√b biçiminde yazar; a√b ifadesinde katsayıyı kök içine alır.' },
              { id: 'M.8.1.3.4', text: 'Kareköklü ifadelerde çarpma ve bölme işlemlerini yapar.' },
              { id: 'M.8.1.3.5', text: 'Kareköklü ifadelerde toplama ve çıkarma işlemlerini yapar.' },
              { id: 'M.8.1.3.6', text: 'Kareköklü bir ifade ile çarpıldığında sonucu doğal sayı yapan çarpanlara örnek verir.' },
              { id: 'M.8.1.3.7', text: 'Ondalık ifadelerin kareköklerini belirler.' },
              { id: 'M.8.1.3.8', text: 'Gerçek sayıları tanır; rasyonel ve irrasyonel sayılarla ilişkilendirir.' },
            ],
          },
        ],
      },
      {
        name: 'CEBİR',
        altKonular: [
          {
            name: 'Cebirsel İfadeler ve Özdeşlikler',
            kazanımlar: [
              { id: 'M.8.2.1.1', text: 'Basit cebirsel ifadeleri anlar ve farklı biçimlerde yazar.' },
              { id: 'M.8.2.1.2', text: 'Cebirsel ifadelerin çarpımını yapar.' },
              { id: 'M.8.2.1.3', text: 'Özdeşlikleri modellerle açıklar.' },
              { id: 'M.8.2.1.4', text: 'Cebirsel ifadeleri çarpanlara ayırır.' },
            ],
          },
          {
            name: 'Doğrusal Denklemler',
            kazanımlar: [
              { id: 'M.8.2.2.1', text: 'Birinci dereceden bir bilinmeyenli denklemleri (rasyonel katsayılı) çözer.' },
              { id: 'M.8.2.2.2', text: 'Koordinat sistemini özellikleriyle tanır; sıralı ikilileri gösterir.' },
              { id: 'M.8.2.2.3', text: 'Aralarında doğrusal ilişki bulunan iki değişkende birinin diğerine bağlı değişimini tablo ve denklemle ifade eder.' },
              { id: 'M.8.2.2.4', text: 'Doğrusal denklemlerin grafiğini çizer.' },
              { id: 'M.8.2.2.5', text: 'Gerçek hayat durumlarına ait denklem‑tablo‑grafik oluşturur ve yorumlar.' },
              { id: 'M.8.2.2.6', text: 'Doğrunun eğimini modellerle açıklar; doğrusal denklemler/grafikleri eğimle ilişkilendirir.' },
            ],
          },
          {
            name: 'Eşitsizlikler',
            kazanımlar: [
              { id: 'M.8.2.3.1', text: 'Birinci dereceden bir bilinmeyenli eşitsizlik içeren durumlara uygun matematik cümleleri yazar.' },
              { id: 'M.8.2.3.2', text: 'Birinci dereceden bir bilinmeyenli eşitsizlikleri sayı doğrusunda gösterir.' },
              { id: 'M.8.2.3.3', text: 'Birinci dereceden bir bilinmeyenli eşitsizlikleri çözer.' },
            ],
          },
        ],
      },
      {
        name: 'GEOMETRİ VE ÖLÇME',
        altKonular: [
          {
            name: 'Üçgenler',
            kazanımlar: [
              { id: 'M.8.3.1.1', text: 'Üçgende kenarortay, açıortay ve yüksekliği inşa eder.' },
              { id: 'M.8.3.1.2', text: 'Üçgenin iki kenar uzunluğunun toplamı veya farkı ile üçüncü kenarın uzunluğunu ilişkilendirir.' },
              { id: 'M.8.3.1.3', text: 'Üçgenin kenar uzunlukları ile bu kenarların karşısındaki açıların ölçülerini ilişkilendirir.' },
              { id: 'M.8.3.1.4', text: 'Yeterli sayıda elemanı verilen bir üçgeni çizer.' },
              { id: 'M.8.3.1.5', text: 'Pisagor bağıntısını oluşturur; problemleri çözer.' },
            ],
          },
          {
            name: 'Dönüşüm Geometrisi',
            kazanımlar: [
              { id: 'M.8.3.2.1', text: 'Nokta, doğru parçası ve şekillerin öteleme sonucundaki görüntülerini çizer.' },
              { id: 'M.8.3.2.2', text: 'Nokta, doğru parçası ve şekillerin yansıma sonucu oluşan görüntüsünü oluşturur.' },
              { id: 'M.8.3.2.3', text: 'Çokgenlerin öteleme ve yansımalar sonucundaki görüntülerini oluşturur.' },
            ],
          },
          {
            name: 'Eşlik ve Benzerlik',
            kazanımlar: [
              { id: 'M.8.3.3.1', text: 'Eşlik ve benzerliği ilişkilendirir; eş/benzer şekillerin kenar ve açı ilişkilerini belirler.' },
              { id: 'M.8.3.3.2', text: 'Benzer çokgenlerin benzerlik oranını belirler; bir çokgene eş ve benzer çokgenler oluşturur.' },
            ],
          },
          {
            name: 'Geometrik Cisimler',
            kazanımlar: [
              { id: 'M.8.3.4.1', text: 'Dik prizmaları tanır; temel elemanlarını belirler; inşa eder; açınımını çizer.' },
              { id: 'M.8.3.4.2', text: 'Dik dairesel silindirin temel elemanlarını belirler; inşa eder; açınımını çizer.' },
              { id: 'M.8.3.4.3', text: 'Dik dairesel silindirin yüzey alanı bağıntısını oluşturur; problemleri çözer.' },
              { id: 'M.8.3.4.4', text: 'Dik dairesel silindirin hacim bağıntısını oluşturur; problemleri çözer.' },
              { id: 'M.8.3.4.5', text: 'Dik piramidi tanır; temel elemanlarını belirler; inşa eder; açınımını çizer (alan/hacim yok).' },
              { id: 'M.8.3.4.6', text: 'Dik koniyi tanır; temel elemanlarını belirler; inşa eder; açınımını çizer (alan/hacim yok).' },
            ],
          },
        ],
      },
      {
        name: 'VERİ İŞLEME',
        altKonular: [
          {
            name: 'Veri Analizi',
            kazanımlar: [
              { id: 'M.8.4.1.1', text: 'En fazla üç veri grubuna ait çizgi ve sütun grafiklerini yorumlar.' },
              { id: 'M.8.4.1.2', text: 'Verileri sütun, daire veya çizgi grafiği ile gösterir ve bu gösterimler arasında uygun dönüşümleri yapar.' },
            ],
          },
        ],
      },
      {
        name: 'OLASILIK',
        altKonular: [
          {
            name: 'Basit Olayların Olma Olasılığı',
            kazanımlar: [
              { id: 'M.8.5.1.1', text: 'Bir olaya ait olası durumları belirler.' },
              { id: 'M.8.5.1.2', text: '“Daha fazla”, “eşit”, “daha az” olasılıklı olayları ayırt eder; örnek verir.' },
              { id: 'M.8.5.1.3', text: 'Eş olasılıklı olaylarda her çıktının olasılığının 1/n olduğunu açıklar.' },
              { id: 'M.8.5.1.4', text: 'Olasılık değerinin 0 ile 1 arasında olduğunu anlar; tamamlayıcı olasılığı fark eder.' },
              { id: 'M.8.5.1.5', text: 'Basit bir olayın olma olasılığını hesaplar.' },
            ],
          },
        ],
      },
    ],
  },
  'science': {
    5: [
      {
        name: 'Madde ve Doğası',
        altKonular: [{
          name: 'Madde ve Doğası',
          kazanımlar: [
            { id: 'FEN.5.1.1', text: 'Maddenin temel özelliklerini (hacim, kütle, eylemsizlik) karşılaştırır.' },
            { id: 'FEN.5.1.2', text: 'Maddenin ölçülebilir özelliklerine dayanarak ayırt edici özellikleri hakkında çıkarımda bulunur.' },
            { id: 'FEN.5.1.3', text: 'Maddenin hâl değişim sürecini molekül modelleriyle açıklar.' },
            { id: 'FEN.5.1.4', text: 'Maddenin bir hâlden diğerine geçişine yönelik mühendislik uygulamaları geliştirir.' },
            { id: 'FEN.5.1.5', text: 'Isı ve sıcaklık arasındaki ilişkiyi açıklar.' },
            { id: 'FEN.5.1.6', text: 'Isı akışı ve yalıtım prensiplerine dayalı mühendislik uygulamaları geliştirir.' },
          ]
        }]
      },
      {
        name: 'Canlılar ve Yaşam',
        altKonular: [{
          name: 'Canlılar ve Yaşam',
          kazanımlar: [
            { id: 'FEN.5.2.1', text: 'Canlıları sınıflandırmanın temel mantığını ve gerekliliğini açıklar.' },
            { id: 'FEN.5.2.2', text: 'Canlıların temel sınıflandırma şemasını (bitkiler, hayvanlar, mantarlar, mikroskobik canlılar) oluşturur.' },
            { id: 'FEN.5.2.3', text: 'İnsan ve çevre arasındaki karşılıklı etkileşimin önemini değerlendirir.' },
            { id: 'FEN.5.2.4', text: 'Biyoçeşitliliğin korunmasına yönelik sorumluluk alır.' },
          ]
        }]
      },
      {
        name: 'Fiziksel Olaylar',
        altKonular: [{
          name: 'Fiziksel Olaylar',
          kazanımlar: [
            { id: 'FEN.5.3.1', text: 'Kuvvetin dinamik (hareket) ve statik (şekil) etkilerini karşılaştırır.' },
            { id: 'FEN.5.3.2', text: 'Sürtünme kuvvetinin etkilerini analiz eder ve mühendislik uygulamaları geliştirir.' },
            { id: 'FEN.5.3.3', text: 'Işığın maddeyle etkileşimini (yansıma, soğurulma) açıklar.' },
            { id: 'FEN.5.3.4', text: 'Sesin oluşumu, yayılması ve maddeyle etkileşimi hakkında çıkarımda bulunur.' },
            { id: 'FEN.5.3.5', text: 'Sesin özelliklerini (şiddet, yükseklik) kullanarak mühendislik uygulamaları geliştirir.' },
          ]
        }]
      },
      {
        name: 'Dünya ve Evren',
        altKonular: [{
          name: 'Dünya ve Evren',
          kazanımlar: [
            { id: 'FEN.5.4.1', text: 'Güneş, Dünya ve Ay’ın temel özelliklerini ve birbirine göre hareketlerini modellerle açıklar.' },
            { id: 'FEN.5.4.2', text: 'Ay’ın evrelerini ve bu evrelerin nedenlerini modellerle gösterir.' },
            { id: 'FEN.5.4.3', text: 'Güneş ve Ay tutulmalarının nasıl gerçekleştiğini modellerle açıklar.' },
          ]
        }]
      }
    ],
    6: [
      {
        name: 'Canlılar ve Yaşam',
        altKonular: [{
          name: 'Canlılar ve Yaşam',
          kazanımlar: [
            { id: 'FEN.6.1.1', text: 'Hücrenin temel kısımlarını ve görevlerini modellerle karşılaştırır.' },
            { id: 'FEN.6.1.2', text: 'Vücuttaki sistemlerin (destek-hareket, dolaşım, solunum, boşaltım) genel yapısını ve görevlerini açıklar.' },
            { id: 'FEN.6.1.3', text: 'Sistemler arasındaki koordineli çalışmanın yaşamsal önemini değerlendirir.' },
          ]
        }]
      },
      {
        name: 'Madde ve Doğası',
        altKonular: [{
          name: 'Madde ve Doğası',
          kazanımlar: [
            { id: 'FEN.6.2.1', text: 'Maddenin tanecikli, boşluklu ve hareketli yapısını modellerle gösterir.' },
            { id: 'FEN.6.2.2', text: 'Yoğunluk kavramını açıklar ve ilgili hesaplamalar yapar.' },
            { id: 'FEN.6.2.3', text: 'Madde-ısı etkileşimine bağlı olarak hâl değişimlerini ve genleşme/büzülmeyi açıklar.' },
            { id: 'FEN.6.2.4', text: 'Yakıtların enerji dönüşümündeki rolünü ve çevreye etkilerini değerlendirir.' },
          ]
        }]
      },
      {
        name: 'Fiziksel Olaylar',
        altKonular: [{
          name: 'Fiziksel Olaylar',
          kazanımlar: [
            { id: 'FEN.6.3.1', text: 'Bileşke kuvveti ve dengeleyici kuvveti açıklar.' },
            { id: 'FEN.6.3.2', text: 'Sürat kavramını ve birimlerini açıklar; ilgili hesaplamaları yapar.' },
            { id: 'FEN.6.3.3', text: 'Sesin maddeyle etkileşimini (yalıtım, yansıma, soğurulma) analiz eder.' },
          ]
        }]
      },
      {
        name: 'Dünya ve Evren',
        altKonular: [{
          name: 'Dünya ve Evren',
          kazanımlar: [
            { id: 'FEN.6.4.1', text: 'Güneş Sistemi’ndeki gezegenleri ve temel özelliklerini karşılaştırır.' },
            { id: 'FEN.6.4.2', text: 'Gezegenler arası uzaklıkları ve Güneş\'e olan konumlarını modellerle gösterir.' },
            { id: 'FEN.6.4.3', text: 'Güneş ve Ay tutulmalarının gerçekleşme nedenlerini açıklar.' },
          ]
        }]
      }
    ],
    7: [
      {
        name: 'Güneş Sistemi ve Ötesi',
        altKonular: [{
          name: 'Güneş Sistemi ve Ötesi',
          kazanımlar: [
            { id: 'F.7.1.1.1', text: 'Uzay teknolojilerini açıklar.' },
            { id: 'F.7.1.2.1', text: 'Gök cisimlerini (yıldız, galaksi, gezegen vb.) tanımlar.' },
            { id: 'F.7.1.2.2', text: 'Gök cisimleri arasındaki uzaklıkları belirtir.' },
          ]
        }]
      },
      {
        name: 'Hücre ve Bölünmeler',
        altKonular: [{
          name: 'Hücre ve Bölünmeler',
          kazanımlar: [
            { id: 'F.7.2.1.1', text: 'Hayvan ve bitki hücrelerinin temel kısımlarını ve görevlerini karşılaştırır.' },
            { id: 'F.7.2.1.2', text: 'Hücre-doku-organ-sistem-organizma ilişkisini açıklar.' },
            { id: 'F.7.2.2.1', text: 'Mitozun canlılar için önemini açıklar.' },
            { id: 'F.7.2.3.1', text: 'Mayozun canlılar için önemini açıklar.' },
          ]
        }]
      },
      {
        name: 'Kuvvet ve Enerji',
        altKonular: [{
          name: 'Kuvvet ve Enerji',
          kazanımlar: [
            { id: 'F.7.3.1.1', text: 'Kütle ve ağırlık kavramlarını karşılaştırır.' },
            { id: 'F.7.3.2.1', text: 'Fiziksel anlamda iş yapma durumunu açıklar.' },
            { id: 'F.7.3.2.2', text: 'Enerjiyi potansiyel ve kinetik olarak sınıflandırır.' },
            { id: 'F.7.3.2.3', text: 'Enerji dönüşümlerini (potansiyel-kinetik) örneklerle açıklar.' },
            { id: 'F.7.3.3.1', text: 'Sürtünme kuvvetinin kinetik enerjiye etkisini araştırır.' },
          ]
        }]
      },
      {
        name: 'Saf Madde ve Karışımlar',
        altKonular: [{
          name: 'Saf Madde ve Karışımlar',
          kazanımlar: [
            { id: 'F.7.4.1.1', text: 'Maddeleri atom, molekül, element, bileşik ve sembol/formül düzeyinde sınıflandırır.' },
            { id: 'F.7.4.2.1', text: 'Karışımları (homojen, heterojen) sınıflandırır.' },
            { id: 'F.7.4.2.2', text: 'Çözünme hızına etki eden faktörleri deneyle belirler.' },
            { id: 'F.7.4.3.1', text: 'Karışımların ayrılması için kullanılacak yöntemleri seçer.' },
            { id: 'F.7.4.4.1', text: 'Evsel atıkların geri dönüşümünün önemini açıklar.' },
          ]
        }]
      },
      {
        name: 'Işığın Madde ile Etkileşimi',
        altKonular: [{
          name: 'Işığın Madde ile Etkileşimi',
          kazanımlar: [
            { id: 'F.7.5.1.1', text: 'Işığın soğurulmasını açıklar.' },
            { id: 'F.7.5.2.1', text: 'Cisimlerin renkli görünme nedenini açıklar.' },
            { id: 'F.7.5.3.1', text: 'Aynalarda görüntü oluşumunu ve özelliklerini çizer.' },
            { id: 'F.7.5.4.1', text: 'Işığın kırılmasını ve ortam yoğunluğu ile ilişkisini açıklar.' },
            { id: 'F.7.5.5.1', text: 'Merceklerin özelliklerini ve kullanım alanlarını belirtir.' },
          ]
        }]
      },
      {
        name: 'Canlılarda Üreme, Büyüme ve Gelişme',
        altKonular: [{
          name: 'Canlılarda Üreme, Büyüme ve Gelişme',
          kazanımlar: [
            { id: 'F.7.6.1.1', text: 'İnsanda üremeyi sağlayan yapı ve organları şema ile gösterir.' },
            { id: 'F.7.6.2.1', text: 'Bitki ve hayvanlarda üreme, büyüme ve gelişme süreçlerini karşılaştırır.' },
          ]
        }]
      },
      {
        name: 'Elektrik Devreleri',
        altKonular: [{
          name: 'Elektrik Devreleri',
          kazanımlar: [
            { id: 'F.7.7.1.1', text: 'Ampullerin seri ve paralel bağlanma durumlarındaki parlaklık değişimini deneyle keşfeder.' },
            { id: 'F.7.7.2.1', text: 'Elektrik akımı, gerilim ve direnç kavramlarını tanımlar.' },
            { id: 'F.7.7.2.2', text: 'Bir devrede ampul parlaklığının gerilim ve dirençle ilişkisini kurar.' },
          ]
        }]
      }
    ],
    8: [
      {
        name: 'Mevsimler ve İklim',
        altKonular: [{
          name: 'Mevsimler ve İklim',
          kazanımlar: [
            { id: 'F.8.1.1.1', text: 'Mevsimlerin oluşumuna yönelik tahminlerde bulunur.' },
            { id: 'F.8.1.2.1', text: 'İklim ve hava olayları arasındaki farkı açıklar.' },
            { id: 'F.8.1.2.2', text: 'İklim biliminin (klimatoloji) bir bilim dalı olduğunu ve bu alanda çalışan uzmanları (klimatolog) tanıtır.' },
          ]
        }]
      },
      {
        name: 'DNA ve Genetik Kod',
        altKonular: [{
          name: 'DNA ve Genetik Kod',
          kazanımlar: [
            { id: 'F.8.2.1.1', text: 'Nükleotid, gen, DNA ve kromozom kavramlarını açıklar; bu kavramlar arasında ilişki kurar.' },
            { id: 'F.8.2.1.2', text: 'DNA\'nın yapısını model üzerinde gösterir.' },
            { id: 'F.8.2.1.3', text: 'DNA\'nın kendini nasıl eşlediğini ifade eder.' },
            { id: 'F.8.2.2.1', text: 'Kalıtımla ilgili kavramları (kalıtım, gen, alel, genotip, fenotip vb.) tanımlar.' },
            { id: 'F.8.2.2.2', text: 'Tek karakter çaprazlamaları ile ilgili problemler çözer.' },
            { id: 'F.8.2.3.1', text: 'Mutasyon ve modifikasyon kavramlarını ve aralarındaki farkları örneklerle açıklar.' },
            { id: 'F.8.2.4.1', text: 'Canlıların yaşadıkları çevreye uyumlarını (adaptasyon) gözlemleyerek açıklar.' },
            { id: 'F.8.2.5.1', text: 'Biyoteknolojinin uygulama alanlarını ve bu uygulamaların insanlık için önemini tartışır.' },
          ]
        }]
      },
      {
        name: 'Basınç',
        altKonular: [{
          name: 'Basınç',
          kazanımlar: [
            { id: 'F.8.3.1.1', text: 'Katı basıncını etkileyen değişkenleri deneyerek keşfeder.' },
            { id: 'F.8.3.1.2', text: 'Katı basıncının günlük yaşamdaki uygulamalarına örnekler verir.' },
            { id: 'F.8.3.2.1', text: 'Sıvı basıncını etkileyen değişkenleri tahmin eder ve tahminlerini test eder.' },
            { id: 'F.8.3.2.2', text: 'Sıvıların basıncı her yöne ilettiğini (Pascal Prensibi) belirtir ve kullanım alanlarına örnekler verir.' },
            { id: 'F.8.3.3.1', text: 'Açık hava basıncının varlığını deneylerle ispatlar.' },
          ]
        }]
      },
      {
        name: 'Madde ve Endüstri',
        altKonular: [{
          name: 'Madde ve Endüstri',
          kazanımlar: [
            { id: 'F.8.4.1.1', text: 'Periyodik sistemde grup ve periyotların nasıl oluşturulduğunu açıklar.' },
            { id: 'F.8.4.1.2', text: 'Elementlerin periyodik tablodaki yerine göre özelliklerini tahmin eder.' },
            { id: 'F.8.4.2.1', text: 'Fiziksel ve kimyasal değişim arasındaki farkları açıklar.' },
            { id: 'F.8.4.3.1', text: 'Kimyasal tepkime denklemlerini okur ve yorumlar.' },
            { id: 'F.8.4.4.1', text: 'Asit ve bazların genel özelliklerini ifade eder.' },
            { id: 'F.8.4.4.2', text: 'Asit ve bazları ayırt etmek için pH değerini ve belirtici kullanır.' },
            { id: 'F.8.4.5.1', text: 'Isı alışverişi temelinde endotermik ve ekzotermik tepkimeleri açıklar.' },
            { id: 'F.8.4.6.1', text: 'Türkiye\'deki kimya endüstrisinin gelişimini ve ülke ekonomisine katkısını tartışır.' },
          ]
        }]
      },
      {
        name: 'Basit Makineler',
        altKonular: [{
          name: 'Basit Makineler',
          kazanımlar: [
            { id: 'F.8.5.1.1', text: 'Basit makinelerin sağladığı avantajları örneklerle açıklar.' },
            { id: 'F.8.5.1.2', text: 'Kaldıraç, sabit/hareketli makara, palanga, eğik düzlem, çıkrık ve dişli/kasnaklardan yararlanarak günlük yaşamda iş kolaylığı sağlayan bir düzenek tasarlar.' },
          ]
        }]
      },
      {
        name: 'Enerji Dönüşümleri ve Çevre Bilimi',
        altKonular: [{
          name: 'Enerji Dönüşümleri ve Çevre Bilimi',
          kazanımlar: [
            { id: 'F.8.6.1.1', text: 'Besin zincirindeki üretici, tüketici ve ayrıştırıcıları örneklerle açıklar.' },
            { id: 'F.8.6.2.1', text: 'Fotosentez hızını etkileyen faktörleri deneylerle araştırır.' },
            { id: 'F.8.6.3.1', text: 'Solunumun canlılar için önemini açıklar.' },
            { id: 'F.8.6.4.1', text: 'Madde döngülerini (su, oksijen, karbon, azot) şema üzerinde açıklar.' },
            { id: 'F.8.6.5.1', text: 'Sürdürülebilir kalkınma kavramını ve kaynakların tasarruflu kullanımına olan etkisini tartışır.' },
          ]
        }]
      },
      {
        name: 'Elektrik Yükleri ve Elektrik Enerjisi',
        altKonular: [{
          name: 'Elektrik Yükleri ve Elektrik Enerjisi',
          kazanımlar: [
            { id: 'F.8.7.1.1', text: 'Elektrik yüklerini ve elektriklenmeyi açıklar.' },
            { id: 'F.8.7.1.2', text: 'Elektrik yüklü cisimler arasındaki etkileşimi (itme-çekme) açıklar.' },
            { id: 'F.8.7.1.3', text: 'Elektroskopun çalışma prensibini açıklar.' },
            { id: 'F.8.7.2.1', text: 'Elektrik enerjisinin ısı ve ışık enerjisine dönüşümünü tasarladığı bir düzenekle gösterir.' },
            { id: 'F.8.7.2.2', text: 'Elektrik enerjisinin ve gücünün hesaplamasını yapar.' },
            { id: 'F.8.7.2.3', text: 'Evlerde kullanılan elektrikli aletlerin gücünü ve tasarruflu kullanımını araştırır.' },
          ]
        }]
      }
    ]
  },
  'turkish': {
    5: [
      {
        name: 'Okuma Becerisi',
        altKonular: [{
          name: 'Okuma Becerisi',
          kazanımlar: [
            { id: 'T.5.OK.1.1', text: 'Metnin yüzey anlamını belirleyebilme.' },
            { id: 'T.5.OK.1.2', text: 'Metne ilişkin çıkarımlarda bulunabilme.' },
            { id: 'T.5.OK.1.3', text: 'Metnin içeriğiyle ilgili soru sorabilme.' },
            { id: 'T.5.OK.1.4', text: 'Metnin içeriğini yorumlayabilme.' },
            { id: 'T.5.OK.2.1', text: 'Metnin derin anlamını belirleyebilme.' },
            { id: 'T.5.OK.2.2', text: 'Metnin derin anlamını belirlemeye yönelik üst düzey çıkarımlar yapabilme.' },
            { id: 'T.5.OK.2.3', text: 'Metnin içeriğini farklı bakış açılarına göre değerlendirebilme.' },
            { id: 'T.5.OK.3.1', text: 'Metni değerlendirebilme.' },
            { id: 'T.5.OK.3.2', text: 'Metinler arasında karşılaştırma yapabilme.' },
          ]
        }]
      },
      {
        name: 'Dinleme/İzleme Becerisi',
        altKonular: [{
          name: 'Dinleme/İzleme Becerisi',
          kazanımlar: [
            { id: 'T.5.Dİ.1.1', text: 'Dinlediğinin/izlediğinin yüzey anlamını belirleyebilme.' },
            { id: 'T.5.Dİ.1.2', text: 'Dinlediğine/izlediğine ilişkin çıkarımlarda bulunabilme.' },
            { id: 'T.5.Dİ.1.3', text: 'Dinlediğinin/izlediğinin içeriğiyle ilgili soru sorabilme.' },
            { id: 'T.5.Dİ.1.4', text: 'Dinlediğinin/izlediğinin içeriğini yorumlayabilme.' },
            { id: 'T.5.Dİ.2.1', text: 'Dinlediğinin/izlediğinin derin anlamını belirlemeye yönelik basit çıkarımlar yapabilme.' },
            { id: 'T.5.Dİ.2.2', text: 'Dinlediğinin/izlediğinin derin anlamını belirlemeye yönelik üst düzey çıkarımlar yapabilme.' },
            { id: 'T.5.Dİ.2.3', text: 'Dinlediğinin/izlediğinin içeriğini farklı bakış açılarına göre değerlendirebilme.' },
            { id: 'T.5.Dİ.3.1', text: 'Dinlediğini/izlediğini değerlendirebilme.' },
            { id: 'T.5.Dİ.3.2', text: 'Dinlediklerini/izlediklerini karşılaştırabilme.' },
          ]
        }]
      },
      {
        name: 'Yazma Becerisi',
        altKonular: [{
          name: 'Yazma Becerisi',
          kazanımlar: [
            { id: 'T.5.YA.1.1', text: 'Süreç odaklı yazma alışkanlığı edinebilme.' },
            { id: 'T.5.YA.1.2', text: 'Yazma sürecini yönetebilme.' },
            { id: 'T.5.YA.1.3', text: 'Yazdıklarını zenginleştirebilme.' },
            { id: 'T.5.YA.1.4', text: 'Yazdıklarını düzenleyebilme.' },
            { id: 'T.5.YA.1.5', text: 'Yazdıklarını paylaşabilme.' },
            { id: 'T.5.YA.2.1', text: 'Bilgilendirici metin yazabilme.' },
            { id: 'T.5.YA.2.2', text: 'Öyküleyici metin yazabilme.' },
            { id: 'T.5.YA.2.3', text: 'Şiir yazabilme.' },
          ]
        }]
      },
      {
        name: 'Konuşma Becerisi',
        altKonular: [{
          name: 'Konuşma Becerisi',
          kazanımlar: [
            { id: 'T.5.KO.1.1', text: 'Süreç odaklı konuşma alışkanlığı edinebilme.' },
            { id: 'T.5.KO.1.2', text: 'Konuşma sürecini yönetebilme.' },
            { id: 'T.5.KO.1.3', text: 'Konuşmasını zenginleştirebilme.' },
            { id: 'T.5.KO.1.4', text: 'Konuşmasının anlaşılabilirliğini düzenleyebilme.' },
            { id: 'T.5.KO.2.1', text: 'Topluluk önünde hazırlıklı konuşma yapabilme.' },
            { id: 'T.5.KO.2.2', text: 'Topluluk önünde hazırlıksız konuşma yapabilme.' },
          ]
        }]
      }
    ],
    6: [
      {
        name: 'Okuma Becerisi',
        altKonular: [{
          name: 'Okuma Becerisi',
          kazanımlar: [
            { id: 'T.6.OK.1.1', text: 'Metnin yüzey anlamını belirleyebilme.' },
            { id: 'T.6.OK.1.2', text: 'Metne ilişkin çıkarımlarda bulunabilme.' },
            { id: 'T.6.OK.1.3', text: 'Metnin içeriğiyle ilgili soru sorabilme.' },
            { id: 'T.6.OK.1.4', text: 'Metnin içeriğini yorumlayabilme.' },
            { id: 'T.6.OK.2.1', text: 'Metnin derin anlamını belirleyebilme.' },
            { id: 'T.6.OK.2.2', text: 'Metnin derin anlamını belirlemeye yönelik üst düzey çıkarımlar yapabilme.' },
            { id: 'T.6.OK.2.3', text: 'Metnin içeriğini farklı bakış açılarına göre değerlendirebilme.' },
            { id: 'T.6.OK.3.1', text: 'Metni değerlendirebilme.' },
            { id: 'T.6.OK.3.2', text: 'Metinler arasında karşılaştırma yapabilme.' },
          ]
        }]
      },
      {
        name: 'Dinleme/İzleme Becerisi',
        altKonular: [{
          name: 'Dinleme/İzleme Becerisi',
          kazanımlar: [
            { id: 'T.6.Dİ.1.1', text: 'Dinlediğinin/izlediğinin yüzey anlamını belirleyebilme.' },
            { id: 'T.6.Dİ.1.2', text: 'Dinlediğine/izlediğine ilişkin çıkarımlarda bulunabilme.' },
            { id: 'T.6.Dİ.1.3', text: 'Dinlediğinin/izlediğinin içeriğiyle ilgili soru sorabilme.' },
            { id: 'T.6.Dİ.1.4', text: 'Dinlediğinin/izlediğinin içeriğini yorumlayabilme.' },
            { id: 'T.6.Dİ.2.1', text: 'Dinlediğinin/izlediğinin derin anlamını belirlemeye yönelik basit çıkarımlar yapabilme.' },
            { id: 'T.6.Dİ.2.2', text: 'Dinlediğinin/izlediğinin derin anlamını belirlemeye yönelik üst düzey çıkarımlar yapabilme.' },
            { id: 'T.6.Dİ.2.3', text: 'Dinlediğinin/izlediğinin içeriğini farklı bakış açılarına göre değerlendirebilme.' },
            { id: 'T.6.Dİ.3.1', text: 'Dinlediğini/izlediğini değerlendirebilme.' },
            { id: 'T.6.Dİ.3.2', text: 'Dinlediklerini/izlediklerini karşılaştırabilme.' },
          ]
        }]
      },
      {
        name: 'Yazma Becerisi',
        altKonular: [{
          name: 'Yazma Becerisi',
          kazanımlar: [
            { id: 'T.6.YA.1.1', text: 'Süreç odaklı yazma alışkanlığı edinebilme.' },
            { id: 'T.6.YA.1.2', text: 'Yazma sürecini yönetebilme.' },
            { id: 'T.6.YA.1.3', text: 'Yazdıklarını zenginleştirebilme.' },
            { id: 'T.6.YA.1.4', text: 'Yazdıklarını düzenleyebilme.' },
            { id: 'T.6.YA.1.5', text: 'Yazdıklarını paylaşabilme.' },
            { id: 'T.6.YA.2.1', text: 'Bilgilendirici metin yazabilme.' },
            { id: 'T.6.YA.2.2', text: 'Öyküleyici metin yazabilme.' },
            { id: 'T.6.YA.2.3', text: 'Şiir yazabilme.' },
          ]
        }]
      },
      {
        name: 'Konuşma Becerisi',
        altKonular: [{
          name: 'Konuşma Becerisi',
          kazanımlar: [
            { id: 'T.6.KO.1.1', text: 'Süreç odaklı konuşma alışkanlığı edinebilme.' },
            { id: 'T.6.KO.1.2', text: 'Konuşma sürecini yönetebilme.' },
            { id: 'T.6.KO.1.3', text: 'Konuşmasını zenginleştirebilme.' },
            { id: 'T.6.KO.1.4', text: 'Konuşmasının anlaşılabilirliğini düzenleyebilme.' },
            { id: 'T.6.KO.2.1', text: 'Topluluk önünde hazırlıklı konuşma yapabilme.' },
            { id: 'T.6.KO.2.2', text: 'Topluluk önünde hazırlıksız konuşma yapabilme.' },
            { id: 'T.6.KO.2.3', text: 'Topluluk önünde tartışmaya katılabilme.' },
          ]
        }]
      }
    ],
    7: [
      {
        name: 'Dinleme/İzleme',
        altKonular: [{
          name: 'Dinleme/İzleme',
          kazanımlar: [
            { id: 'T.7.1.1', text: 'Dinlediklerinde/izlediklerinde geçen olayların gelişimi ve sonucu hakkında tahminde bulunur.' },
            { id: 'T.7.1.2', text: 'Dinlediklerinde/izlediklerinde geçen, bilmediği kelimelerin anlamını tahmin eder.' },
            { id: 'T.7.1.3', text: 'Dinlediklerini/izlediklerini özetler.' },
            { id: 'T.7.1.4', text: 'Dinlediklerine/izlediklerine yönelik soruları cevaplar.' },
            { id: 'T.7.1.5', text: 'Dinlediklerinin/izlediklerinin konusunu belirler.' },
            { id: 'T.7.1.6', text: 'Dinlediklerinin/izlediklerinin ana fikrini/ana duygusunu belirler.' },
            { id: 'T.7.1.7', text: 'Dinlediklerine/izlediklerine yönelik farklı başlıklar önerir.' },
            { id: 'T.7.1.8', text: 'Dinlediği/izlediği hikâye edici metinleri canlandırır.' },
            { id: 'T.7.1.9', text: 'Dinlediklerinde/izlediklerinde başvurulan düşünceyi geliştirme yollarını tespit eder.' },
            { id: 'T.7.1.10', text: 'Dinlediklerinde/izlediklerinde tutarlılığı sorgular.' },
            { id: 'T.7.1.11', text: 'Dinledikleriyle/izledikleriyle ilgili görüşlerini bildirir.' },
            { id: 'T.7.1.12', text: 'Dinleme stratejilerini uygular.' },
            { id: 'T.7.1.13', text: 'Dinlediklerinin/izlediklerinin içeriğini değerlendirir.' },
            { id: 'T.7.1.14', text: 'Konuşmacının sözlü olmayan mesajlarını kavrar.' },
          ]
        }]
      },
      {
        name: 'Konuşma',
        altKonular: [{
          name: 'Konuşma',
          kazanımlar: [
            { id: 'T.7.2.1', text: 'Hazırlıklı konuşma yapar.' },
            { id: 'T.7.2.2', text: 'Hazırlıksız konuşma yapar.' },
            { id: 'T.7.2.3', text: 'Konuşma stratejilerini uygular.' },
            { id: 'T.7.2.4', text: 'Konuşmalarında beden dilini etkili bir şekilde kullanır.' },
            { id: 'T.7.2.5', text: 'Kelimeleri anlamlarına uygun kullanır.' },
            { id: 'T.7.2.6', text: 'Konuşmalarında uygun geçiş ve bağlantı ifadelerini kullanır.' },
            { id: 'T.7.2.7', text: 'Konuşmalarında yabancı dillerden alınmış, dilimize henüz yerleşmemiş kelimelerin Türkçelerini kullanır.' },
          ]
        }]
      },
      {
        name: 'Okuma',
        altKonular: [{
          name: 'Okuma',
          kazanımlar: [
            { id: 'T.7.3.1', text: 'Noktalama işaretlerine dikkat ederek sesli ve sessiz okur.' },
            { id: 'T.7.3.2', text: 'Metni türün özelliklerine uygun biçimde okur.' },
            { id: 'T.7.3.3', text: 'Farklı yazı karakterleri ile yazılmış yazıları okur.' },
            { id: 'T.7.3.4', text: 'Okuma stratejilerini kullanır.' },
            { id: 'T.7.3.5', text: 'Bağlamdan yararlanarak bilmediği kelime ve kelime gruplarının anlamını tahmin eder.' },
            { id: 'T.7.3.6', text: 'Deyim ve atasözlerinin metne katkısını belirler.' },
            { id: 'T.7.3.7', text: 'Çekim eklerinin işlevlerini ayırt eder.' },
            { id: 'T.7.3.8', text: 'Metindeki söz sanatlarını tespit eder.' },
            { id: 'T.7.3.9', text: 'Fiillerin anlam özelliklerini fark eder.' },
            { id: 'T.7.3.10', text: 'Ek fiilleri işlevlerine uygun olarak kullanır.' },
            { id: 'T.7.3.11', text: 'Zarfların metnin anlamına olan katkısını açıklar.' },
            { id: 'T.7.3.12', text: 'Basit, türemiş ve birleşik fiilleri ayırt eder.' },
            { id: 'T.7.3.13', text: 'Anlatım bozukluklarını tespit eder.' },
            { id: 'T.7.3.14', text: 'Metinle ilgili sorular sorar.' },
            { id: 'T.7.3.15', text: 'Metinle ilgili soruları cevaplar.' },
            { id: 'T.7.3.16', text: 'Metnin konusunu belirler.' },
            { id: 'T.7.3.17', text: 'Metnin ana fikrini/ana duygusunu belirler.' },
            { id: 'T.7.3.18', text: 'Metindeki yardımcı fikirleri belirler.' },
            { id: 'T.7.3.19', text: 'Metnin içeriğine uygun başlık/başlıklar belirler.' },
            { id: 'T.7.3.20', text: 'Okuduklarını özetler.' },
            { id: 'T.7.3.21', text: 'Metindeki hikâye unsurlarını belirler.' },
            { id: 'T.7.3.22', text: 'Metindeki düşünceyi geliştirme yollarını belirler.' },
            { id: 'T.7.3.23', text: 'Metindeki gerçek ve kurgusal unsurları ayırt eder.' },
            { id: 'T.7.3.24', text: 'Metindeki iş ve işlem basamaklarını kavrar.' },
            { id: 'T.7.3.25', text: 'Metinler arasında karşılaştırma yapar.' },
            { id: 'T.7.3.26', text: 'Metin türlerini ayırt eder.' },
            { id: 'T.7.3.27', text: 'Okudukları ile ilgili çıkarımlarda bulunur.' },
            { id: 'T.7.3.28', text: 'Metinler arası anlam kurar.' },
            { id: 'T.7.3.29', text: 'Görsellerle ilgili soruları cevaplar.' },
            { id: 'T.7.3.30', text: 'Grafik, tablo ve çizelgeyle sunulan bilgileri yorumlar.' },
            { id: 'T.7.3.31', text: 'Metnin içeriğini değerlendirir.' },
            { id: 'T.7.3.32', text: 'Metnin yazılış amacını belirler.' },
            { id: 'T.7.3.33', text: 'Yazarın olaylara bakış açısını tespit eder.' },
            { id: 'T.7.3.34', text: 'Metindeki öznel ve nesnel yaklaşımları değerlendirir.' },
            { id: 'T.7.3.35', text: 'Metindeki gerekçeli/gerekçesiz yargıları, duygusal ve abartılı ögeleri belirler.' },
            { id: 'T.7.3.36', text: 'Metindeki anlatım biçimlerini belirler.' },
          ]
        }]
      },
      {
        name: 'Yazma',
        altKonular: [{
          name: 'Yazma',
          kazanımlar: [
            { id: 'T.7.4.1', text: 'Şiir yazar.' },
            { id: 'T.7.4.2', text: 'Bilgilendirici metin yazar.' },
            { id: 'T.7.4.3', text: 'Hikâye edici metin yazar.' },
            { id: 'T.7.4.4', text: 'Betimleme yapar.' },
            { id: 'T.7.4.5', text: 'Bir işin işlem basamaklarını yazar.' },
            { id: 'T.7.4.6', text: 'Formları yönergelerine uygun doldurur.' },
            { id: 'T.7.4.7', text: 'Kısa metinler yazar.' },
            { id: 'T.7.4.8', text: 'Yazma stratejilerini uygular.' },
            { id: 'T.7.4.9', text: 'Yazılarını zenginleştirmek için atasözleri, deyimler ve özdeyişler kullanır.' },
            { id: 'T.7.4.10', text: 'Yazılarında uygun geçiş ve bağlantı ifadelerini kullanır.' },
            { id: 'T.7.4.11', text: 'Yazdıklarını düzenler.' },
            { id: 'T.7.4.12', text: 'Yazılarında eş sesli kelimelerin anlamlarını ayırt edecek şekilde kullanır.' },
            { id: 'T.7.4.13', text: 'Büyük harfleri ve noktalama işaretlerini uygun yerlerde kullanır.' },
            { id: 'T.7.4.14', text: 'Yazdıklarını paylaşır.' },
            { id: 'T.7.4.15', text: 'Yazdıklarında yabancı dillerden alınmış, dilimize henüz yerleşmemiş kelimelerin Türkçelerini kullanır.' },
            { id: 'T.7.4.16', text: 'Yazdığı metni biçimsel olarak değerlendirir.' },
            { id: 'T.7.4.17', text: 'Yazılarında anlatım bozukluklarını düzeltir.' },
          ]
        }]
      }
    ],
    8: [
      {
        name: 'Dinleme/İzleme',
        altKonular: [{
          name: 'Dinleme/İzleme',
          kazanımlar: [
            { id: 'T.8.1.1', text: 'Dinlediklerinde/izlediklerinde geçen olayların gelişimi ve sonucu hakkında tahminde bulunur.' },
            { id: 'T.8.1.2', text: 'Dinlediklerinde/izlediklerinde geçen bilmediği kelimelerin anlamını tahmin eder.' },
            { id: 'T.8.1.3', text: 'Dinlediklerini/izlediklerini özetler.' },
            { id: 'T.8.1.4', text: 'Dinlediklerinin/izlediklerinin konusunu belirler.' },
            { id: 'T.8.1.5', text: 'Dinlediklerinin/izlediklerinin ana fikrini/ana duygusunu belirler.' },
            { id: 'T.8.1.6', text: 'Dinlediklerinde/izlediklerinde tutarlılığı sorgular.' },
            { id: 'T.8.1.7', text: 'Dinlediklerine/izlediklerine yönelik sorulara cevap verir.' },
            { id: 'T.8.1.8', text: 'Dinledikleriyle/izledikleriyle ilgili görüşlerini bildirir.' },
            { id: 'T.8.1.9', text: 'Dinlediklerinde/izlediklerinde başvurulan düşünceyi geliştirme yollarını tespit eder.' },
            { id: 'T.8.1.10', text: 'Dinleme stratejilerini uygular.' },
            { id: 'T.8.1.11', text: 'Dinlediklerinin/izlediklerinin içeriğini değerlendirir.' },
            { id: 'T.8.1.12', text: 'Konuşmacının amacını belirler.' },
            { id: 'T.8.1.13', text: 'Dinlediklerindeki/izlediklerindeki anlatım bozukluklarını tespit eder.' },
          ]
        }]
      },
      {
        name: 'Konuşma',
        altKonular: [{
          name: 'Konuşma',
          kazanımlar: [
            { id: 'T.8.2.1', text: 'Hazırlıklı konuşma yapar.' },
            { id: 'T.8.2.2', text: 'Hazırlıksız konuşma yapar.' },
            { id: 'T.8.2.3', text: 'Konuşma stratejilerini uygular.' },
            { id: 'T.8.2.4', text: 'Konuşmalarında beden dilini etkili bir şekilde kullanır.' },
            { id: 'T.8.2.5', text: 'Kelimeleri anlamlarına uygun kullanır.' },
            { id: 'T.8.2.6', text: 'Konuşmalarında uygun geçiş ve bağlantı ifadelerini kullanır.' },
            { id: 'T.8.2.7', text: 'Konuşmalarında yabancı dillerden alınmış, dilimize henüz yerleşmemiş kelimelerin Türkçelerini kullanır.' },
          ]
        }]
      },
      {
        name: 'Okuma',
        altKonular: [{
          name: 'Okuma',
          kazanımlar: [
            { id: 'T.8.3.1', text: 'Noktalama işaretlerine dikkat ederek sesli ve sessiz okur.' },
            { id: 'T.8.3.2', text: 'Metni türün özelliklerine uygun biçimde okur.' },
            { id: 'T.8.3.3', text: 'Farklı yazı karakterleri ile yazılmış yazıları okur.' },
            { id: 'T.8.3.4', text: 'Okuma stratejilerini kullanır.' },
            { id: 'T.8.3.5', text: 'Bağlamdan yararlanarak bilmediği kelime ve kelime gruplarının anlamını tahmin eder.' },
            { id: 'T.8.3.6', text: 'Deyim, atasözü ve özdeyişlerin metne katkısını belirler.' },
            { id: 'T.8.3.7', text: 'Metindeki söz sanatlarını tespit eder.' },
            { id: 'T.8.3.8', text: 'Metindeki anlatım bozukluklarını belirler.' },
            { id: 'T.8.3.9', text: 'Fiilimsilerin cümledeki işlevlerini kavrar.' },
            { id: 'T.8.3.10', text: 'Geçiş ve bağlantı ifadelerinin metnin anlamına olan katkısını değerlendirir.' },
            { id: 'T.8.3.11', text: 'Metinle ilgili sorular sorar.' },
            { id: 'T.8.3.12', text: 'Metinle ilgili soruları cevaplar.' },
            { id: 'T.8.3.13', text: 'Okuduklarını özetler.' },
            { id: 'T.8.3.14', text: 'Metnin konusunu belirler.' },
            { id: 'T.8.3.15', text: 'Metindeki yardımcı fikirleri belirler.' },
            { id: 'T.8.3.16', text: 'Metnin içeriğine uygun başlık/başlıklar belirler.' },
            { id: 'T.8.3.17', text: 'Metnin ana fikrini/ana duygusunu belirler.' },
            { id: 'T.8.3.18', text: 'Metnin içeriğini yorumlar.' },
            { id: 'T.8.3.19', text: 'Metindeki hikâye unsurlarını belirler.' },
            { id: 'T.8.3.20', text: 'Metindeki düşünceyi geliştirme yollarını belirler.' },
            { id: 'T.8.3.21', text: 'Metindeki iş ve işlem basamaklarını kavrar.' },
            { id: 'T.8.3.22', text: 'Metinde ele alınan sorunlara farklı çözümler üretir.' },
            { id: 'T.8.3.23', text: 'Metinler arasında karşılaştırma yapar.' },
            { id: 'T.8.3.24', text: 'Metin türlerini ayırt eder.' },
            { id: 'T.8.3.25', text: 'Okudukları ile ilgili çıkarımlarda bulunur.' },
            { id: 'T.8.3.26', text: 'Metinler arası anlam kurar.' },
            { id: 'T.8.3.27', text: 'Görsellerle ilgili soruları cevaplar.' },
            { id: 'T.8.3.28', text: 'Grafik, tablo ve çizelgeyle sunulan bilgileri yorumlar.' },
            { id: 'T.8.3.29', text: 'Cümlenin ögelerini ayırt eder.' },
            { id: 'T.8.3.30', text: 'Fiillerin çatı özelliklerinin anlama olan katkısını kavrar.' },
            { id: 'T.8.3.31', text: 'Cümle türlerini tanır.' },
            { id: 'T.8.3.32', text: 'Metnin içeriğini değerlendirir.' },
            { id: 'T.8.3.33', text: 'Yazarın olaylara bakış açısını tespit eder.' },
            { id: 'T.8.3.34', text: 'Metindeki öznel ve nesnel yaklaşımları değerlendirir.' },
          ]
        }]
      },
      {
        name: 'Yazma',
        altKonular: [{
          name: 'Yazma',
          kazanımlar: [
            { id: 'T.8.4.1', text: 'Şiir yazar.' },
            { id: 'T.8.4.2', text: 'Bilgilendirici metin yazar.' },
            { id: 'T.8.4.3', text: 'Hikâye edici metin yazar.' },
            { id: 'T.8.4.4', text: 'Tutanak yazar.' },
            { id: 'T.8.4.5', text: 'Tartışmacı metinler yazar.' },
            { id: 'T.8.4.6', text: 'Bir işin işlem basamaklarını yazar.' },
            { id: 'T.8.4.7', text: 'Formları yönergelerine uygun doldurur.' },
            { id: 'T.8.4.8', text: 'Yazma stratejilerini uygular.' },
            { id: 'T.8.4.9', text: 'Yazılarını zenginleştirmek için atasözleri, deyimler ve özdeyişler kullanır.' },
            { id: 'T.8.4.10', text: 'Yazılarında uygun geçiş ve bağlantı ifadelerini kullanır.' },
            { id: 'T.8.4.11', text: 'Yazdıklarını düzenler.' },
            { id: 'T.8.4.12', text: 'Yazılarında anlatım bozukluklarını düzeltir.' },
            { id: 'T.8.4.13', text: 'Büyük harfleri ve noktalama işaretlerini uygun yerlerde kullanır.' },
            { id: 'T.8.4.14', text: 'Yazdıklarını paylaşır.' },
            { id: 'T.8.4.15', text: 'Yazdıklarında yabancı dillerden alınmış, dilimize henüz yerleşmemiş kelimelerin Türkçelerini kullanır.' },
            { id: 'T.8.4.16', text: 'Yazdığı metni biçimsel olarak değerlendirir.' },
            { id: 'T.8.4.17', text: 'Yazdığı metnin içeriğini değerlendirir.' },
            { id: 'T.8.4.18', text: 'Cümlenin ögelerini ayırt eder.' },
            { id: 'T.8.4.19', text: 'Cümle türlerini tanır.' },
            { id: 'T.8.4.20', text: 'Fiillerin çatı özelliklerinin anlama olan katkısını kavrar.' },
          ]
        }]
      }
    ]
  },
  'english': {
    5: [
      { name: 'Hello (Merhaba)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E5.1.L1', text: 'Öğrenciler, kişisel bilgi içeren basit diyaloglardaki temel ifadeleri anlar.' }, { id: 'E5.1.L2', text: 'Öğrenciler, sınıf içi yönergeleri ve komutları anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E5.1.S1', text: 'Öğrenciler, kendini tanıtır ve basit tanışma diyalogları kurar.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E5.1.R1', text: 'Öğrenciler, basit tanışma ve selamlaşma metinlerini anlar.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E5.1.W1', text: 'Öğrenciler, kişisel bilgilerini içeren basit formları doldurur.' } ]}
      ]},
      { name: 'My Town (Benim Şehrim)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E5.2.L1', text: 'Öğrenciler, bilindik yerler ve yönlerle ilgili basit diyalogları anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E5.2.S1', text: 'Öğrenciler, bir yerin konumunu basit ifadelerle sorar ve söyler.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E5.2.R1', text: 'Öğrenciler, bir yerin konumuyla ilgili kısa ve basit metinleri anlar.' } ]}
      ]},
      { name: 'Games and Hobbies (Oyunlar ve Hobiler)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E5.3.L1', text: 'Öğrenciler, hobiler ve hoşlanılan şeylerle ilgili kısa ve basit metinleri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E5.3.S1', text: 'Öğrenciler, sevdikleri ve sevmedikleri şeyler hakkında konuşur.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E5.3.R1', text: 'Öğrenciler, hobiler ve boş zaman aktiviteleri hakkındaki kısa metinleri anlar.' } ]}
      ]},
      { name: 'My Daily Routine (Günlük Rutinim)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E5.4.L1', text: 'Öğrenciler, günlük rutinler ve zaman ifadeleriyle ilgili kısa ve basit metinleri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E5.4.S1', text: 'Öğrenciler, günlük rutinlerini basit cümlelerle anlatır.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E5.4.R1', text: 'Öğrenciler, günlük rutinler ve saatler hakkındaki basit metinleri anlar.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E5.4.W1', text: 'Öğrenciler, kendi günlük rutinleri hakkında kısa ve basit cümleler yazar.' } ]}
      ]},
      { name: 'Health (Sağlık)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E5.5.L1', text: 'Öğrenciler, basit sağlık sorunları ve tavsiyelerle ilgili diyalogları anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E5.5.S1', text: 'Öğrenciler, basit sağlık sorunlarını ifade eder ve tavsiye ister/verir.' } ]}
      ]},
      { name: 'Movies (Filmler)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E5.6.L1', text: 'Öğrenciler, film türleri ve zamanları hakkındaki kısa ve basit bilgileri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E5.6.S1', text: 'Öğrenciler, film tercihlerini basit cümlelerle ifade eder.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E5.6.R1', text: 'Öğrenciler, basit film afişleri veya programlarını anlar.' } ]}
      ]},
      { name: 'Party Time (Parti Zamanı)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E5.7.L1', text: 'Öğrenciler, miktar ve sayı bildiren basit yönergeleri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E5.7.S1', text: 'Öğrenciler, bir partide basit isteklerde ve ricalarda bulunur.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E5.7.R1', text: 'Öğrenciler, basit parti davetiyelerindeki temel bilgileri anlar.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E5.7.W1', text: 'Öğrenciler, basit bir parti davetiyesi hazırlar.' } ]}
      ]},
      { name: 'Fitness (Formda Olma)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E5.8.L1', text: 'Öğrenciler, yetenek ve becerilerle ilgili basit ifadeleri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E5.8.S1', text: 'Öğrenciler, yapabildikleri ve yapamadıkları eylemler hakkında konuşur.' } ]}
      ]},
      { name: 'The Animal Shelter (Hayvan Barınağı)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E5.9.L1', text: 'Öğrenciler, hayvanlarla ilgili basit tanımlamaları anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E5.9.S1', text: 'Öğrenciler, hayvanları ve ihtiyaçlarını basit düzeyde ifade eder.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E5.9.R1', text: 'Öğrenciler, hayvanlar hakkında bilgi içeren basit ve kısa metinleri anlar.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E5.9.W1', text: 'Öğrenciler, sevdikleri bir hayvanı tanıtan kısa bir metin yazar.' } ]}
      ]},
      { name: 'Festivals (Festivaller)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E5.10.L1', text: 'Öğrenciler, festivaller ve özel günlerle ilgili temel bilgileri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E5.10.S1', text: 'Öğrenciler, özel günleri ve kutlamaları basit ifadelerle anlatır.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E5.10.R1', text: 'Öğrenciler, festivallerle ilgili basit bilgilendirme metinlerini anlar.' } ]}
      ]}
    ],
    6: [
      { name: 'Life (Yaşam)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E6.1.L1', text: 'Öğrenciler, tekrarlanan eylemlerle ilgili kelimeleri, ifadeleri ve anlatımları anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E6.1.S1', text: 'Öğrenciler, tekrarlanan eylemler hakkında konuşur.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E6.1.R1', text: 'Öğrenciler, günlük rutinler ve alışkanlıklar hakkındaki basit metinleri anlar.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E6.1.W1', text: 'Öğrenciler, günlük rutinleri hakkında kısa bir paragraf yazar.' } ]}
      ]},
      { name: 'Yummy Breakfast (Nefis Kahvaltı)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E6.2.L1', text: 'Öğrenciler, yiyecek ve içeceklerle ilgili diyaloglardaki belirli bilgileri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E6.2.S1', text: 'Öğrenciler, yiyecek ve içecek tercihleri hakkında konuşur.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E6.2.R1', text: 'Öğrenciler, basit yemek tariflerindeki ana fikri bulur.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E6.2.W1', text: 'Öğrenciler, basit bir yemek tarifinin adımlarını yazar.' } ]}
      ]},
      { name: 'Downtown (Şehir Merkezi)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E6.3.L1', text: 'Öğrenciler, talimatları dinler ve nesnelerin yerini bulur.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E6.3.S1', text: 'Öğrenciler, insanların ve nesnelerin yerleri hakkında konuşur.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E6.3.R1', text: 'Öğrenciler, bir şehirdeki yerler hakkında bilgi içeren basit metinleri anlar.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E6.3.W1', text: 'Öğrenciler, bir yerin konumunu tarif eden kısa bir metin yazar.' } ]}
      ]},
      { name: 'Weather and Emotions (Hava ve Duygular)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E6.4.L1', text: 'Öğrenciler, hava durumu ve duygular hakkındaki basit ifadeleri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E6.4.S1', text: 'Öğrenciler, hava durumu ve nasıl hissettikleri hakkında basit diyaloglar kurar.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E6.4.R1', text: 'Öğrenciler, hava durumu ve duygularla ilgili kısa metinlerdeki belirli bilgileri bulur.' } ]}
      ]},
      { name: 'At the Fair (Fuarda)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E6.5.L1', text: 'Öğrenciler, fuar gibi yerlerdeki diyaloglarda geçen belirli bilgileri (yer, zaman, fiyat) anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E6.5.S1', text: 'Öğrenciler, basit karşılaştırma cümleleri kurarak nesneler ve insanlar hakkında konuşur.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E6.5.R1', text: 'Öğrenciler, karşılaştırma içeren basit metinleri anlar.' } ]}
      ]},
      { name: 'Occupations (Meslekler)', altKonular: [ ]},
      { name: 'Holidays (Tatiller)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E6.7.L1', text: 'Öğrenciler, sözlü metinlerdeki geçmiş olayları anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E6.7.S1', text: 'Öğrenciler, belirli bir zamandaki geçmiş olaylar hakkında konuşur.' } ]}
      ]},
      { name: 'Bookworms (Kitap Kurtları)', altKonular: [ ]},
      { name: 'Saving the Planet (Gezegeni Kurtarmak)', altKonular: [ ]},
      { name: 'Democracy (Demokrasi)', altKonular: [ ]}
    ],
    7: [
      { name: 'Appearance and Personality (Dış Görünüş ve Kişilik)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E7.1.L1', text: 'Öğrenciler, insanların dış görünüşü ve kişilik özellikleri hakkındaki basit sözlü metinleri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E7.1.S1', text: 'Öğrenciler, insanları karşılaştırarak basit karşılaştırmalar yapar.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E7.1.R1', text: 'Öğrenciler, insanların dış görünüşünü ve karakterini anlatan metinlerdeki belirli bilgileri bulur.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E7.1.W1', text: 'Öğrenciler, bir kişinin dış görünüşünü ve kişiliğini anlatan basit ve kısa metinler yazar.' } ]}
      ]},
      { name: 'Sports (Sporlar)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E7.2.L1', text: 'Öğrenciler, spor ve aktivitelerle ilgili basit diyaloglardaki ana fikri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E7.2.S1', text: 'Öğrenciler, rutinler ve günlük aktiviteler hakkında konuşur.' } ]}
      ]},
      { name: 'Biographies (Biyografiler)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E7.3.L1', text: 'Öğrenciler, geçmiş olaylar ve tarihlerle ilgili basit sözlü metinleri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E7.3.S1', text: 'Öğrenciler, geçmiş olaylar hakkında konuşur.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E7.3.R1', text: 'Öğrenciler, basit biyografik metinlerdeki belirli bilgileri anlar.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E7.3.W1', text: 'Öğrenciler, bilinen bir kişinin hayatı hakkında kısa bir metin yazar.' } ]}
      ]},
      { name: 'Wild Animals (Vahşi Hayvanlar)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E7.4.L1', text: 'Öğrenciler, vahşi hayvanlar ve yaşam alanları hakkındaki basit tartışmaları takip eder.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E7.4.S1', text: 'Öğrenciler, önerilerde ve tavsiyelerde bulunur.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E7.4.R1', text: 'Öğrenciler, hayvanlar hakkındaki bilgilendirici metinlerdeki belirli bilgileri bulur.' } ]}
      ]},
      { name: 'Television (Televizyon)', altKonular: []},
      { name: 'Celebrations (Kutlamalar)', altKonular: []},
      { name: 'Dreams (Hayaller)', altKonular: []},
      { name: 'Public Buildings (Kamu Binaları)', altKonular: []},
      { name: 'Environment (Çevre)', altKonular: [
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E7.9.R1', text: 'Öğrenciler, çevre hakkındaki çeşitli metinlerdeki belirli bilgileri tanımlar.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E7.9.W1', text: 'Öğrenciler, çevre hakkında kısa, basit mesajlar yazar.' } ]}
      ]},
      { name: 'Planets (Gezegenler)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E7.10.L1', text: 'Öğrenciler, basit sözlü metinlerde popüler bilimle ilgili tartışma konusunu belirler.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E7.10.S1', text: 'Öğrenciler, basit karşılaştırmalar yapar.' }, { id: 'E7.10.S2', text: 'Öğrenciler, geçmiş olaylar hakkında konuşur.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E7.10.R1', text: 'Öğrenciler, gerçekler ve genel doğrular hakkındaki çeşitli metinlerdeki belirli bilgileri tanımlar.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E7.10.W1', text: 'Öğrenciler, gerçekler ve genel doğrular hakkında kısa ve temel açıklamalar yazar.' } ]}
      ]}
    ],
    8: [
      { name: 'Friendship (Arkadaşlık)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E8.1.L1', text: 'Öğrenciler, bir teklifi/daveti kabul etme, reddetme, özür dileme ve basit sorgulamalar yapma gibi günlük konulardaki kısa sohbetlerdeki belirli bilgileri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E8.1.S1', text: 'Öğrenciler, yapılandırılmış durumlarda makul bir kolaylıkla etkileşim kurar.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E8.1.R1', text: 'Öğrenciler, kısa ve basit davet mektuplarını, kartlarını ve e-postalarını anlar.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E8.1.W1', text: 'Öğrenciler, bir davete yanıt olarak, katılmama nedenlerini belirterek ve özür dileyerek kısa ve basit bir mektup yazar.' } ]}
      ]},
      { name: 'Teen Life (Gençlik Hayatı)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E8.2.L1', text: 'Öğrenciler, gençlerin yaşam tarzları hakkındaki basit sözlü metinlerdeki ana fikri anlar.' } ]},
          { name: 'Konuşma', kazanımlar: [ { id: 'E8.2.S1', text: 'Öğrenciler, alışkanlıklar ve tercihler hakkında konuşur.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E8.2.R1', text: 'Öğrenciler, gençlerin yaşam tarzları hakkındaki kısa ve basit metinlerdeki belirli bilgileri bulur.' } ]}
      ]},
      { name: 'In the Kitchen (Mutfakta)', altKonular: [
          { name: 'Konuşma', kazanımlar: [ { id: 'E8.3.S1', text: 'Öğrenciler, basit bir süreci tarif eder.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E8.3.W1', text: 'Öğrenciler, basit bir süreci tarif eden kısa ve sıralı metinler yazar.' } ]}
      ]},
      { name: 'On the Phone (Telefonda)', altKonular: [
          { name: 'Konuşma', kazanımlar: [ { id: 'E8.4.S1', text: 'Öğrenciler, gelecekteki düzenlemeler ve tahminler hakkında konuşur.' } ]}
      ]},
      { name: 'The Internet (İnternet)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E8.5.L1', text: 'Öğrenciler, internet alışkanlıkları hakkındaki kısa ve basit metinlerdeki ana fikirleri belirler.' } ]},
          { name: 'Okuduğunu Anlama', kazanımlar: [ { id: 'E8.5.R1', text: 'Öğrenciler, çeşitli metinlerde internetle ilgili belirli bilgileri bulur.' } ]},
          { name: 'Yazma', kazanımlar: [ { id: 'E8.5.W1', text: 'Öğrenciler, internet alışkanlıklarını açıklayan basit bir paragraf yazar.' } ]}
      ]},
      { name: 'Adventures (Maceralar)', altKonular: [
          { name: 'Dinleme Anlama', kazanımlar: [ { id: 'E8.6.L1', text: 'Öğrenciler, maceralarla ilgili bir tartışmayı takip eder.' } ]}
      ]},
      { name: 'Tourism (Turizm)', altKonular: []},
      { name: 'Chores (Ev İşleri)', altKonular: []},
      { name: 'Science (Bilim)', altKonular: []},
      { name: 'Natural Forces (Doğal Afetler)', altKonular: []}
    ]
  },
  'paragraph': {
    5: [
      {
        name: 'Paragraf Okuduğunu Anlama',
        altKonular: [{
          name: 'Paragraf Okuduğunu Anlama',
          kazanımlar: [
            { id: 'P.5.1', text: 'Okuduğu metindeki ana düşünceyi, yardımcı düşünceleri ve konuyu belirler.' }
          ]
        }]
      }
    ],
    6: [
      {
        name: 'Paragraf Okuduğunu Anlama',
        altKonular: [{
          name: 'Paragraf Okuduğunu Anlama',
          kazanımlar: [
            { id: 'P.6.1', text: 'Okuduğu metinle ilgili çıkarımlarda bulunur ve metni yorumlar.' }
          ]
        }]
      }
    ],
    7: [
      {
        name: 'Paragraf Okuduğunu Anlama',
        altKonular: [{
          name: 'Paragraf Okuduğunu Anlama',
          kazanımlar: [
            { id: 'P.7.1', text: 'Metindeki anlatım biçimlerini ve düşünceyi geliştirme yollarını belirler.' }
          ]
        }]
      }
    ],
    8: [
      {
        name: 'Paragraf Okuduğunu Anlama',
        altKonular: [{
          name: 'Paragraf Okuduğunu Anlama',
          kazanımlar: [
            { id: 'P.8.1', text: 'Metnin dil ve anlatım özelliklerini değerlendirir, metnin yazılış amacını belirler.' }
          ]
        }]
      }
    ]
  }
};
