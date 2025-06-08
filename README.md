# TikTok Takip Etmeyenleri Temizle

🚀 **TikTok'ta sizi takip etmeyen kullanıcıları otomatik olarak takipten çıkaran güçlü browser eklentisi**

## ✨ Özellikler

- 🔍 **Akıllı Analiz**: Takip ettiğiniz ve sizi takip eden kullanıcıları otomatik analiz eder
- 🎯 **Hedefli Temizlik**: Sadece sizi takip etmeyen kullanıcıları tespit eder
- ⚡ **Hızlı İşlem**: Toplu takipten çıkarma işlemi
- 🛡️ **Güvenli Mod**: Rate limiting ile hesap güvenliği
- 📊 **Detaylı İstatistikler**: Takip/takipçi sayıları ve analiz sonuçları
- 🎨 **Modern Arayüz**: Kullanıcı dostu ve responsive tasarım
- ⚙️ **Özelleştirilebilir**: Maksimum işlem sayısı ve bekleme süreleri

## 🚀 Kurulum

### Chrome/Edge için:

1. **Eklenti dosyalarını indirin**
   - Bu repository'yi bilgisayarınıza indirin
   - ZIP dosyasını çıkarın

2. **Developer Mode'u etkinleştirin**
   - Chrome: `chrome://extensions/` adresine gidin
   - Edge: `edge://extensions/` adresine gidin
   - Sağ üst köşedeki "Developer mode" seçeneğini açın

3. **Eklentiyi yükleyin**
   - "Load unpacked" butonuna tıklayın
   - İndirdiğiniz klasörü seçin
   - Eklenti otomatik olarak yüklenecektir

## 📖 Kullanım

### Adım 1: TikTok'a Giriş
- TikTok web sitesine gidin: `https://tiktok.com`
- Hesabınıza giriş yapın

### Adım 2: Profil Sayfasına Git
- Kendi profilinize gidin
- "Takip Ediliyor" sekmesine tıklayın

### Adım 3: Eklentiyi Başlat
- Browser'ın sağ üst köşesindeki eklenti ikonuna tıklayın
- "Analiz Et" butonuna basın
- Analiz tamamlanana kadar bekleyin

### Adım 4: Temizlik İşlemi
- Analiz sonuçlarını inceleyin
- Ayarları isteğinize göre düzenleyin:
  - **Güvenli Mod**: 3 saniye bekleme (önerilen)
  - **Maksimum İşlem**: Bir seferde kaç kişiyi takipten çıkaracağınız
- "Takipten Çıkar" butonuna basın

## ⚙️ Ayarlar

### Güvenli Mod
- ✅ **Açık**: Her işlem arasında 3 saniye bekler (önerilen)
- ❌ **Kapalı**: Hızlı işlem (risk artabilir)

### Maksimum İşlem
- **10**: Günlük küçük temizlik için
- **25**: Orta düzey temizlik (varsayılan)
- **50**: Büyük temizlik için
- **100**: Kapsamlı temizlik
- **Sınırsız**: Tüm takip etmeyenleri temizle

## 🛡️ Güvenlik

### Rate Limiting
- Eklenti, TikTok'un rate limit kurallarına uyar
- Güvenli mod ile hesap güvenliği sağlanır
- Aşırı hızlı işlem yapılmaz

### Gizlilik
- Hiçbir veri harici sunuculara gönderilmez
- Tüm işlemler yerel olarak gerçekleşir
- Şifreler veya kişisel bilgiler saklanmaz

## 🔧 Teknik Detaylar

### Desteklenen Tarayıcılar
- ✅ Google Chrome (v88+)
- ✅ Microsoft Edge (v88+)
- ✅ Brave Browser
- ✅ Opera (Chromium tabanlı)

### Sistem Gereksinimleri
- Modern web tarayıcısı
- Aktif internet bağlantısı
- TikTok hesabı

### Dosya Yapısı
```
tiktok-unf/
├── manifest.json          # Eklenti yapılandırması
├── popup.html             # Ana arayüz
├── popup.css              # Arayüz stilleri
├── popup.js               # Arayüz mantığı
├── content.js             # TikTok sayfa etkileşimi
├── styles.css             # Content script stilleri
└── README.md              # Bu dosya
```

## 🐛 Sorun Giderme

### Eklenti Çalışmıyor
1. TikTok web sitesinde olduğunuzdan emin olun
2. "Takip Ediliyor" sekmesinde olduğunuzu kontrol edin
3. Sayfayı yenileyin ve tekrar deneyin
4. Eklentiyi devre dışı bırakıp tekrar etkinleştirin

### Analiz Başarısız
1. İnternet bağlantınızı kontrol edin
2. TikTok hesabınıza giriş yaptığınızdan emin olun
3. Sayfayı yenileyin ve tekrar deneyin
4. Browser console'unu kontrol edin (F12)

### İşlem Yarıda Kesildi
1. "Durdur" butonuna basın
2. Birkaç dakika bekleyin
3. Sayfayı yenileyin
4. İşlemi tekrar başlatın

## 📊 Performans

### Hız
- **Güvenli Mod**: ~20 işlem/dakika
- **Hızlı Mod**: ~60 işlem/dakika

### Bellek Kullanımı
- Ortalama: 10-15 MB
- Maksimum: 25 MB

## 🔄 Güncellemeler

### v1.0 (Mevcut)
- İlk sürüm
- Temel takip temizleme özellikleri
- Modern arayüz
- Güvenlik önlemleri

### Gelecek Sürümler
- 🔄 Otomatik güncelleme
- 📅 Zamanlanmış temizlik
- 📈 Gelişmiş istatistikler
- 🎨 Tema seçenekleri

## ⚠️ Önemli Notlar

1. **Hesap Güvenliği**: Eklentiyi aşırı sık kullanmayın
2. **Rate Limiting**: TikTok'un kurallarına uyun
3. **Yedekleme**: Önemli takipleri manuel olarak not alın
4. **Sorumluluk**: Eklenti kullanımı kendi sorumluluğunuzdadır

## 📞 Destek

Sorularınız için:
- GitHub Issues bölümünü kullanın
- Detaylı hata raporları paylaşın
- Önerileri bildirin

## 📄 Lisans

Bu proje MIT lisansı altında yayınlanmıştır.

---

**⭐ Eklentiyi beğendiyseniz yıldız vermeyi unutmayın!**

*TikTok Takip Etmeyenleri Temizle - Sosyal medya deneyiminizi optimize edin* 🚀