<?php
/**
 * Test obliczania wymiarów i wyboru formatu
 * Uruchom w przeglądarce: /wp-content/plugins/ocena-ryzyka/test-dimensions.php
 */

// Załaduj WordPress
require_once('../../../wp-load.php');

// Załaduj wymagane pliki wtyczki
require_once('includes/pdf-generator.php');

// Sprawdź czy jesteśmy zalogowani jako admin LUB mamy włączony WP_DEBUG
$has_permission = current_user_can('manage_options') || (defined('WP_DEBUG') && WP_DEBUG);

if (!$has_permission) {
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Brak uprawnień</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 50px; text-align: center; }
            .error-box { background: #ffebee; border: 1px solid #ef5350; padding: 30px; border-radius: 5px; max-width: 600px; margin: 0 auto; }
            h1 { color: #c62828; }
            .instructions { background: #e3f2fd; padding: 20px; margin-top: 20px; border-radius: 5px; text-align: left; }
            code { background: #f5f5f5; padding: 2px 8px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <div class="error-box">
            <h1>🔒 Brak uprawnień</h1>
            <p>Aby uruchomić ten test, musisz być zalogowany jako administrator WordPress.</p>
            
            <div class="instructions">
                <h3>📋 Instrukcje:</h3>
                <p><strong>OPCJA 1 - Zaloguj się jako admin:</strong></p>
                <ol>
                    <li>Przejdź do: <a href="<?php echo admin_url(); ?>">Panel Administratora WordPress</a></li>
                    <li>Zaloguj się jako administrator</li>
                    <li>Wróć tutaj i odśwież stronę</li>
                </ol>
                
                <p><strong>OPCJA 2 - Włącz tryb DEBUG (tymczasowo):</strong></p>
                <ol>
                    <li>Otwórz plik <code>wp-config.php</code></li>
                    <li>Znajdź linię: <code>define('WP_DEBUG', false);</code></li>
                    <li>Zmień na: <code>define('WP_DEBUG', true);</code></li>
                    <li>Zapisz i odśwież stronę</li>
                    <li><strong>Pamiętaj:</strong> Po testach wyłącz DEBUG!</li>
                </ol>
                
                <p><strong>OPCJA 3 - Test bezpośredni (najprostsze):</strong></p>
                <p>Uruchom test bezpośrednio w panelu admina WordPress - przygotowuję dla Ciebie specjalną stronę...</p>
            </div>
        </div>
    </body>
    </html>
    <?php
    die();
}

// Testowe dane
$test_cases = array(
    array('name' => 'Bardzo mała tabela', 'rows' => 3),
    array('name' => 'Mała tabela', 'rows' => 10),
    array('name' => 'Średnia tabela', 'rows' => 25),
    array('name' => 'Duża tabela', 'rows' => 50),
    array('name' => 'Bardzo duża tabela', 'rows' => 80),
    array('name' => 'Ogromna tabela', 'rows' => 120),
);

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test wymiarów tabeli - Ocena Ryzyka</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #0073aa;
            padding-bottom: 10px;
        }
        .test-case {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .test-case h3 {
            margin-top: 0;
            color: #0073aa;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f0f0f0;
            font-weight: bold;
        }
        .format-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 3px;
            font-weight: bold;
            color: white;
        }
        .format-A3 { background: #28a745; }
        .format-A2 { background: #ffc107; color: #333; }
        .format-A1 { background: #dc3545; }
        .reason {
            font-style: italic;
            color: #666;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>🧪 Test obliczania wymiarów i formatu strony PDF</h1>
    
    <?php foreach ($test_cases as $test): ?>
        <?php
        // Przygotuj dane testowe
        $rows = array();
        for ($i = 0; $i < $test['rows']; $i++) {
            $rows[] = array(
                'lp' => $i + 1,
                'rodzaj_zagrozenia' => 'Zagrożenia mechaniczne',
                'obraz' => ($i % 3 === 0) ? 'test.jpg' : '', // Co trzeci wiersz ma obrazek
            );
        }
        
        $data = array('rows' => $rows);
        
        // Oblicz wymiary
        $dimensions = ocena_ryzyka_calculate_table_dimensions($data);
        
        // Wybierz format
        $format = ocena_ryzyka_select_page_format($dimensions);
        
        // Pobierz rozmiar strony w mm
        $page_size = ocena_ryzyka_get_page_size_mm($format['size'], $format['orientation']);
        ?>
        
        <div class="test-case">
            <h3><?php echo esc_html($test['name']); ?> (<?php echo $test['rows']; ?> wierszy)</h3>
            
            <table>
                <tr>
                    <th>Parametr</th>
                    <th>Wartość</th>
                </tr>
                <tr>
                    <td>Liczba wierszy</td>
                    <td><strong><?php echo $dimensions['row_count']; ?></strong></td>
                </tr>
                <tr>
                    <td>Liczba kolumn</td>
                    <td><strong><?php echo $dimensions['col_count']; ?></strong></td>
                </tr>
                <tr>
                    <td>Szacowana szerokość</td>
                    <td><?php echo $dimensions['estimated_width_mm']; ?> mm</td>
                </tr>
                <tr>
                    <td>Szacowana wysokość</td>
                    <td><?php echo $dimensions['estimated_height_mm']; ?> mm</td>
                </tr>
                <tr>
                    <td>Zawiera obrazki?</td>
                    <td><?php echo $dimensions['has_images'] ? '✅ Tak' : '❌ Nie'; ?></td>
                </tr>
                <tr>
                    <td><strong>Wybrany format</strong></td>
                    <td>
                        <span class="format-badge format-<?php echo $format['size']; ?>">
                            <?php echo $format['size']; ?> 
                            <?php echo $format['orientation'] === 'L' ? 'poziomo' : 'pionowo'; ?>
                        </span>
                    </td>
                </tr>
                <tr>
                    <td>Rozmiar strony</td>
                    <td><?php echo $page_size['width']; ?> × <?php echo $page_size['height']; ?> mm</td>
                </tr>
            </table>
            
            <div class="reason">
                💡 <?php echo esc_html($format['reason']); ?>
            </div>
        </div>
    <?php endforeach; ?>
    
    <div style="margin-top: 40px; padding: 20px; background: #e7f3ff; border-left: 4px solid #0073aa;">
        <strong>ℹ️ Informacja:</strong> Wymiary są szacowane na podstawie średnich wartości. 
        Rzeczywiste wymiary mogą się różnić w zależności od zawartości komórek.
    </div>
</body>
</html>