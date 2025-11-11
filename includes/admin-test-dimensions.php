<?php
/**
 * Strona testowa wymiarów PDF w panelu admina
 */

if (!defined('ABSPATH')) {
    exit;
}

// Dodaj podmenu w panelu admina
add_action('admin_menu', 'ocena_ryzyka_add_test_page', 99);

function ocena_ryzyka_add_test_page() {
    add_submenu_page(
        'ocena-ryzyka',                          // Parent slug
        'Test wymiarów PDF',                     // Page title
        '🧪 Test PDF',                           // Menu title
        'manage_options',                        // Capability
        'ocena-ryzyka-test-dimensions',         // Menu slug
        'ocena_ryzyka_render_test_page'         // Callback
    );
}

function ocena_ryzyka_render_test_page() {
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
    
    <div class="wrap">
        <h1>🧪 Test obliczania wymiarów i formatu strony PDF</h1>
        
        <div class="notice notice-info">
            <p>
                <strong>ℹ️ Ten test pokazuje jak system wybiera format strony PDF na podstawie liczby wierszy w tabeli.</strong>
            </p>
        </div>
        
        <style>
            .test-case {
                background: white;
                padding: 20px;
                margin: 20px 0;
                border: 1px solid #ccc;
                border-radius: 5px;
            }
            .test-case h3 {
                margin-top: 0;
                color: #0073aa;
            }
            .test-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            .test-table th,
            .test-table td {
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            .test-table th {
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
                padding: 10px;
                background: #f9f9f9;
                border-left: 3px solid #0073aa;
            }
        </style>
        
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
                
                <table class="test-table">
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
        
        <div class="notice notice-success" style="margin-top: 40px;">
            <p>
                <strong>✅ Test zakończony pomyślnie!</strong> System automatycznie wybiera optymalny format strony.
            </p>
        </div>
        
        <div style="margin-top: 20px; padding: 20px; background: #e7f3ff; border-left: 4px solid #0073aa;">
            <h3>ℹ️ Jak to działa?</h3>
            <ul>
                <li><strong>A3 poziomo (420×297mm):</strong> Do 35 wierszy - mała/średnia tabela</li>
                <li><strong>A2 poziomo (594×420mm):</strong> 36-70 wierszy - duża tabela</li>
                <li><strong>A1 poziomo (841×594mm):</strong> 71+ wierszy - bardzo duża tabela</li>
            </ul>
            <p>
                <em>Wymiary są szacowane na podstawie średnich wartości. 
                Rzeczywiste wymiary mogą się różnić w zależności od zawartości komórek.</em>
            </p>
        </div>
    </div>
    
    <?php
}