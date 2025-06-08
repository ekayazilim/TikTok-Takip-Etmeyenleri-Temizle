@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                TikTok Takip Temizleyici v1.0                ║
echo ║              Browser Eklentisi Kurulum Yardımcısı            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🚀 TikTok Takip Temizleyici eklentisini kurmak için:
echo.
echo 📋 ADIMLAR:
echo ────────────────────────────────────────────────────────────────
echo.
echo 1️⃣  Chrome/Edge tarayıcınızı açın
echo.
echo 2️⃣  Adres çubuğuna şunlardan birini yazın:
echo     • Chrome için: chrome://extensions/
echo     • Edge için:   edge://extensions/
echo.
echo 3️⃣  Sağ üst köşedeki "Developer mode" (Geliştirici modu) seçeneğini açın
echo.
echo 4️⃣  "Load unpacked" (Paketlenmemiş yükle) butonuna tıklayın
echo.
echo 5️⃣  Bu klasörü seçin: %~dp0
echo.
echo 6️⃣  TikTok web sitesine gidin ve eklentiyi kullanmaya başlayın!
echo.
echo ────────────────────────────────────────────────────────────────
echo.
echo 💡 İPUCU: Eklenti yüklendikten sonra TikTok profilinizde
echo    "Takip Ediliyor" sekmesine gidin ve eklenti ikonuna tıklayın.
echo.
echo ⚠️  UYARI: Eklentiyi güvenli mod ile kullanmanız önerilir.
echo.
echo 📖 Detaylı kullanım talimatları için README.md dosyasını okuyun.
echo.
echo ────────────────────────────────────────────────────────────────
echo.
echo 🔗 Klasör yolunu panoya kopyalamak için herhangi bir tuşa basın...
echo.
pause >nul
echo %~dp0| clip
echo ✅ Klasör yolu panoya kopyalandı!
echo    Şimdi tarayıcınızda "Load unpacked" seçeneğini kullanabilirsiniz.
echo.
echo 🎉 Kurulum tamamlandığında eklentiyi kullanmaya başlayabilirsiniz!
echo.
pause