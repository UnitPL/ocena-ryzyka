# 📸 Obsługa obrazków w PDF - Dokumentacja

## Jak to działa?

### 1. Dodawanie obrazków w projekcie
Użytkownicy dodają obrazki przez interfejs wtyczki (przyciski 📷).

### 2. Przetwarzanie dla PDF
Gdy generowany jest PDF, każdy obrazek przechodzi przez proces optymalizacji:

#### Krok 1: Rozpoznanie ścieżki
- Sprawdzenie czy to URL czy lokalna ścieżka
- Konwersja URL wtyczki na lokalną ścieżkę
- Pobieranie zdalnych obrazków do `/temp/`

#### Krok 2: Cache
- Sprawdzenie czy obrazek został już przetworzony wcześniej
- Cache znajduje się w `/temp/pdf-images/`
- Klucz cache: MD5(ścieżka + czas modyfikacji)

#### Krok 3: Resize
- **Maksymalny rozmiar**: 945×945 pikseli (8cm × 8cm przy 300 DPI)
- **Zachowanie proporcji**: TAK
- **Metoda**: Lanczos (Imagick) lub Bicubic (GD)

#### Krok 4: Optymalizacja
- **Kompresja JPEG**: 90% jakości (konfigurowane)
- **DPI**: 300 (standard dla druku)
- **Usunięcie metadata**: TAK (zmniejsza rozmiar)

#### Krok 5: Format wyjściowy
- **PNG** → zachowane jako PNG (z przezroczystością)
- **JPEG/JPG** → JPEG (zoptymalizowany)
- **GIF** → JPEG (konwersja)

---

## Wymagania systemowe

### Opcja 1: Imagick (zalecane)
- Lepsza jakość
- Więcej opcji kompresji
- Lepsze zachowanie kolorów

```bash
# Sprawdź czy Imagick jest zainstalowane:
php -m | grep imagick
```

### Opcja 2: GD (fallback)
- Standardowo dostępne w PHP
- Nieco gorsza jakość przy resize
- Wystarczające dla większości przypadków

```bash
# Sprawdź czy GD jest zainstalowane:
php -m | grep gd
```

---

## Konfiguracja

### Stałe w `pdf-generator.php`:

```php
define('OCENA_RYZYKA_PDF_IMAGE_SIZE', 945);        // Rozmiar w pikselach
define('OCENA_RYZYKA_PDF_IMAGE_QUALITY', 90);      // Jakość 0-100
define('OCENA_RYZYKA_PDF_DPI', 300);               // DPI dla PDF
```

### Dostosowanie rozmiaru obrazków:

Jeśli chcesz zmienić rozmiar obrazków w PDF:
1. Zmień `OCENA_RYZYKA_PDF_IMAGE_SIZE` (domyślnie 945px = 8cm przy 300 DPI)
2. Wyczyść cache: usuń `/temp/pdf-images/`
3. Wygeneruj PDF ponownie

**Przelicznik:**
- 1 cm przy 300 DPI = 118.125 pikseli
- 8 cm = 945 pikseli
- 10 cm = 1181 pikseli

---

## Cache obrazków

### Automatyczne czyszczenie
- **Częstotliwość**: Codziennie (WordPress Cron)
- **Wiek**: Pliki starsze niż 7 dni
- **Lokalizacja**: `/temp/pdf-images/`

### Ręczne czyszczenie

#### Przez kod PHP:
```php
ocena_ryzyka_clean_image_cache(7); // usuń starsze niż 7 dni
```

#### Przez terminal:
```bash
rm -rf wp-content/plugins/ocena-ryzyka/temp/pdf-images/*
```

---

## Rozwiązywanie problemów

### Obrazki nie pojawiają się w PDF

**1. Sprawdź ścieżki:**
```php
// Włącz debug w wp-config.php:
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);

// Sprawdź logi w: wp-content/debug.log
```

**2. Sprawdź uprawnienia:**
```bash
chmod 755 wp-content/plugins/ocena-ryzyka/temp/
chmod 755 wp-content/plugins/ocena-ryzyka/uploads/
```

**3. Sprawdź czy GD/Imagick działa:**
```php
// Test GD:
if (extension_loaded('gd')) {
    echo "GD: OK";
} else {
    echo "GD: BRAK";
}

// Test Imagick:
if (extension_loaded('imagick')) {
    echo "Imagick: OK";
} else {
    echo "Imagick: BRAK";
}
```

### Obrazki mają złą jakość

**1. Zwiększ jakość kompresji:**
```php
define('OCENA_RYZYKA_PDF_IMAGE_QUALITY', 95); // domyślnie 90
```

**2. Zwiększ rozmiar:**
```php
define('OCENA_RYZYKA_PDF_IMAGE_SIZE', 1181); // 10cm zamiast 8cm
```

**3. Używaj obrazków w wysokiej rozdzielczości:**
- Minimum 1000×1000 pikseli
- Format JPEG lub PNG
- Unikaj GIF (niska jakość)

### PDF jest za duży

**1. Zmniejsz jakość kompresji:**
```php
define('OCENA_RYZYKA_PDF_IMAGE_QUALITY', 85); // domyślnie 90
```

**2. Zmniejsz rozmiar obrazków:**
```php
define('OCENA_RYZYKA_PDF_IMAGE_SIZE', 700); // ~6cm
```

**3. Zmniejsz DPI:**
```php
define('OCENA_RYZYKA_PDF_DPI', 200); // domyślnie 300
```

---

## Wydajność

### Czas przetwarzania (szacunki):

| Rozmiar oryginalny | Liczba obrazków | Czas (Imagick) | Czas (GD) |
|-------------------|-----------------|----------------|-----------|
| 2000×2000px       | 5               | ~0.5s          | ~1s       |
| 3000×3000px       | 10              | ~1s            | ~2.5s     |
| 4000×4000px       | 20              | ~2.5s          | ~5s       |

### Rozmiar plików (szacunki):

| Format źródłowy | Rozmiar przed | Rozmiar po | Redukcja |
|----------------|---------------|------------|----------|
| PNG (3000px)   | 8 MB          | 400 KB     | 95%      |
| JPEG (3000px)  | 2 MB          | 300 KB     | 85%      |
| GIF (500px)    | 500 KB        | 150 KB     | 70%      |

---

## Wsparcie

Jeśli masz problemy z obrazkami:
1. Sprawdź logi: `wp-content/debug.log`
2. Sprawdź uprawnienia katalogów
3. Sprawdź czy GD/Imagick jest zainstalowane
4. Sprawdź rozmiar oryginalnych obrazków

---

## Changelog

### v1.0.0
- ✅ Resize do 945×945px (8cm przy 300 DPI)
- ✅ Zachowanie proporcji
- ✅ Kompresja 90% jakości
- ✅ Cache przetworzonych obrazków
- ✅ Automatyczne czyszczenie cache (7 dni)
- ✅ Obsługa PNG, JPEG, GIF
- ✅ Imagick + GD fallback