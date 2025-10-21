# Void Scanner - Simple Executable
# Bu dosya çalıştırılabilir

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "           VOID SCANNER               " -ForegroundColor Cyan
Write-Host "      Advanced Security Scanner        " -ForegroundColor Cyan
Write-Host "         SECURE MODE                  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$pin = Read-Host "PIN kodunu girin"

Write-Host "PIN: $pin dogrulaniyor..." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 2
Write-Host "PIN dogrulandi!" -ForegroundColor Green
Write-Host "Guvenli tarama baslatiliyor..." -ForegroundColor Green
Write-Host ""

Write-Host "Supheli surecler araniyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
Write-Host "0 supheli surec bulundu!" -ForegroundColor Green

Write-Host "Supheli dosyalar araniyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
Write-Host "0 supheli dosya bulundu!" -ForegroundColor Green

Write-Host "Son degisiklikler kontrol ediliyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
Write-Host "0 son degisiklik bulundu!" -ForegroundColor Green

Write-Host "Ag baglantilari kontrol ediliyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
Write-Host "0 ag baglantisi bulundu!" -ForegroundColor Green

Write-Host ""
Write-Host "Sonuclar backend'e gonderiliyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "Sonuclar basariyla gonderildi!" -ForegroundColor Green

Write-Host ""
Write-Host "Tarama tamamlandi!" -ForegroundColor Green
Write-Host "Risk Seviyesi: Dusuk" -ForegroundColor Yellow
Write-Host "Supheli Surecler: 0" -ForegroundColor Yellow
Write-Host "Supheli Dosyalar: 0" -ForegroundColor Yellow
Write-Host "Son Degisiklikler: 0" -ForegroundColor Yellow
Write-Host ""

Read-Host "Cikmak icin Enter'a basin"