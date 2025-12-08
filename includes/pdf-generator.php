<?php
/**
 * Generator PDF dla Oceny Ryzyka
 * Wykorzystuje bibliotekę mPDF
 */

if (!defined('ABSPATH')) {
    exit;
}

// Sprawdź czy mPDF jest zainstalowane
if (!file_exists(OCENA_RYZYKA_PLUGIN_DIR . 'vendor/autoload.php')) {
    add_action('admin_notices', function() {
        echo '<div class="notice notice-error"><p>';
        echo '<strong>Ocena Ryzyka:</strong> Biblioteka mPDF nie jest zainstalowana. ';
        echo 'Uruchom <code>composer require mpdf/mpdf</code> w katalogu wtyczki.';
        echo '</p></div>';
    });
    return;
}

require_once OCENA_RYZYKA_PLUGIN_DIR . 'vendor/autoload.php';

// Konfiguracja PDF
define('OCENA_RYZYKA_PDF_IMAGE_SIZE', 800);        // 800px = 3.4cm przy 600 DPI
define('OCENA_RYZYKA_PDF_IMAGE_SIZE_MM', 34);      // Fizyczny rozmiar w PDF (mm)
define('OCENA_RYZYKA_PDF_IMAGE_QUALITY', 90);
define('OCENA_RYZYKA_PDF_MAX_SIZE', 40);
define('OCENA_RYZYKA_PDF_DPI', 600);               // Zwiększone z 300 do 600 DPI

/**
 * Główna funkcja generująca PDF
 */
function ocena_ryzyka_generate_pdf($kod_projektu) {
    try {
        $result = ocena_ryzyka_load_project($kod_projektu);
        
        if (!$result['success']) {
            return array(
                'success' => false,
                'message' => 'Nie można wczytać projektu: ' . $result['message']
            );
        }
        
        $projekt = $result['projekt'];
        $data = json_decode($projekt['data_json'], true);
        
        if (!$data || !isset($data['rows'])) {
            return array(
                'success' => false,
                'message' => 'Nieprawidłowe dane projektu'
            );
        }
        
        $format = ocena_ryzyka_calculate_optimal_page_format($data);
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('Ocena Ryzyka PDF - Format: ' . $format['size'] . ' ' . $format['orientation']);
            error_log('Ocena Ryzyka PDF - Wymiary: ' . print_r($format['dimensions'], true));
            error_log('Ocena Ryzyka PDF - Powód: ' . $format['reason']);
        }
        
        $mpdf = new \Mpdf\Mpdf([
            'mode' => 'utf-8',
            'format' => $format['size'],
            'orientation' => $format['orientation'],
            'margin_left' => 10,
            'margin_right' => 10,
            'margin_top' => 15,
            'margin_bottom' => 15,
            'margin_header' => 5,
            'margin_footer' => 5,
            'default_font_size' => 9,
            'default_font' => 'dejavusans',
            'tempDir' => OCENA_RYZYKA_PLUGIN_DIR . 'temp/'
        ]);
        
        $mpdf->SetTitle('Ocena Ryzyka - ' . ($projekt['nazwa_maszyny'] ?: $kod_projektu));
        $mpdf->SetAuthor('Ocena Ryzyka Plugin');
        $mpdf->SetCreator('Ocena Ryzyka v' . OCENA_RYZYKA_VERSION);
        
        $css = ocena_ryzyka_get_pdf_styles();
        $mpdf->WriteHTML($css, \Mpdf\HTMLParserMode::HEADER_CSS);
        
        $html = ocena_ryzyka_generate_pdf_html($projekt, $data, $format);
        $mpdf->WriteHTML($html, \Mpdf\HTMLParserMode::HTML_BODY);
        
        $temp_dir = OCENA_RYZYKA_PLUGIN_DIR . 'temp/';
        if (!file_exists($temp_dir)) {
            wp_mkdir_p($temp_dir);
        }
        
        $filename = sanitize_file_name($projekt['nazwa_maszyny'] ?: $kod_projektu) . '_' . current_time('Y-m-d') . '.pdf';
        $file_path = $temp_dir . $filename;
        
        $mpdf->Output($file_path, \Mpdf\Output\Destination::FILE);
        
        $file_size = filesize($file_path) / (1024 * 1024);
        
        if ($file_size > OCENA_RYZYKA_PDF_MAX_SIZE) {
            unlink($file_path);
            return array(
                'success' => false,
                'message' => 'PDF przekracza maksymalny rozmiar (' . round($file_size, 2) . ' MB)'
            );
        }
        
        return array(
            'success' => true,
            'file_path' => $file_path,
            'filename' => $filename,
            'file_size' => round($file_size, 2),
            'format_info' => ocena_ryzyka_format_page_info($format),
            'message' => 'PDF wygenerowany pomyślnie'
        );
        
    } catch (Exception $e) {
        error_log('Ocena Ryzyka PDF Error: ' . $e->getMessage());
        return array(
            'success' => false,
            'message' => 'Błąd generowania PDF: ' . $e->getMessage()
        );
    }
}

function ocena_ryzyka_calculate_optimal_page_format($data) {
    $dimensions = ocena_ryzyka_calculate_table_dimensions($data);
    $format = ocena_ryzyka_select_page_format($dimensions);
    return array_merge($format, array('dimensions' => $dimensions));
}

function ocena_ryzyka_calculate_table_dimensions($data) {
    $row_count = isset($data['rows']) ? count($data['rows']) : 0;
    $col_count = 26; // Zaktualizowano: 28 -> 26 (usunięto M i S/D)
    $estimated_width_mm = ($col_count * 35) + 20;
    $header_height = 45;
    $row_height = 25;
    $margins = 30;
    $estimated_height_mm = $header_height + ($row_count * $row_height) + $margins;
    
    return array(
        'row_count' => $row_count,
        'col_count' => $col_count,
        'estimated_width_mm' => $estimated_width_mm,
        'estimated_height_mm' => $estimated_height_mm,
        'header_rows' => 3,
        'has_images' => ocena_ryzyka_check_if_has_images($data)
    );
}

function ocena_ryzyka_check_if_has_images($data) {
    if (!isset($data['rows']) || empty($data['rows'])) {
        return false;
    }
    
    foreach ($data['rows'] as $row) {
        if (!empty($row['obraz']) || !empty($row['obraz_elementow'])) {
            return true;
        }
    }
    
    return false;
}

function ocena_ryzyka_select_page_format($dimensions) {
    $row_count = $dimensions['row_count'];
    
    if ($row_count <= 15) {
        return array(
            'size' => 'A3',
            'orientation' => 'L',
            'reason' => 'Mała tabela (≤15 wierszy) - A3 poziomo'
        );
    }
    
    if ($row_count <= 35) {
        return array(
            'size' => 'A3',
            'orientation' => 'L',
            'reason' => 'Średnia tabela (16-35 wierszy) - A3 poziomo'
        );
    }
    
    if ($row_count <= 70) {
        return array(
            'size' => 'A2',
            'orientation' => 'L',
            'reason' => 'Duża tabela (36-70 wierszy) - A2 poziomo'
        );
    }
    
    return array(
        'size' => 'A1',
        'orientation' => 'L',
        'reason' => 'Bardzo duża tabela (>70 wierszy) - A1 poziomo'
    );
}

function ocena_ryzyka_get_pdf_styles() {
    $css_file = OCENA_RYZYKA_PLUGIN_DIR . 'assets/css/pdf-style.css';
    
    if (!file_exists($css_file)) {
        error_log('Ocena Ryzyka PDF: Brak pliku CSS: ' . $css_file);
        return '';
    }
    
    $css = file_get_contents($css_file);
    
    if ($css === false) {
        error_log('Ocena Ryzyka PDF: Nie można wczytać CSS');
        return '';
    }
    
    return $css;
}

function ocena_ryzyka_generate_pdf_html($projekt, $data, $format) {
    $html = '';
    $html .= ocena_ryzyka_generate_pdf_header($projekt, $format);
    $html .= '<table>';
    $html .= ocena_ryzyka_generate_table_headers();
    $html .= '<tbody>';

    if (isset($data['rows']) && !empty($data['rows'])) {
        // Oblicz rowspan dla scalonych komórek
        $rowspan_infos = ocena_ryzyka_calculate_rowspans($data['rows']);

        foreach ($data['rows'] as $index => $row) {
            $rowspan_info = isset($rowspan_infos[$index]) ? $rowspan_infos[$index] : array();
            $html .= ocena_ryzyka_generate_table_row($row, $rowspan_info);
        }
    }

    $html .= '</tbody>';
    $html .= '</table>';
    $html .= ocena_ryzyka_generate_pdf_footer($projekt);
    
    return $html;
}

function ocena_ryzyka_generate_pdf_header($projekt, $format) {
    $nazwa_maszyny = !empty($projekt['nazwa_maszyny']) ? $projekt['nazwa_maszyny'] : 'Bez nazwy';
    $kod_projektu = $projekt['kod_projektu'];
    $data_utworzenia = date('d.m.Y', strtotime($projekt['data_utworzenia']));
    $data_eksportu = current_time('d.m.Y H:i');
    $orientation_text = $format['orientation'] === 'L' ? 'poziomo' : 'pionowo';
    
    $html = '<div class="pdf-header">';
    $html .= '<div class="pdf-title">Ocena Ryzyka Maszyny</div>';
    $html .= '<div class="pdf-subtitle">' . htmlspecialchars($nazwa_maszyny) . '</div>';
    $html .= '<div class="pdf-info">';
    $html .= '<div class="pdf-info-row">';
    $html .= '<span class="pdf-info-label">Kod projektu:</span>';
    $html .= '<span>' . htmlspecialchars($kod_projektu) . '</span>';
    $html .= '</div>';
    $html .= '<div class="pdf-info-row">';
    $html .= '<span class="pdf-info-label">Data utworzenia:</span>';
    $html .= '<span>' . $data_utworzenia . '</span>';
    $html .= '</div>';
    $html .= '<div class="pdf-info-row">';
    $html .= '<span class="pdf-info-label">Data eksportu PDF:</span>';
    $html .= '<span>' . $data_eksportu . '</span>';
    $html .= '</div>';
    $html .= '<div class="pdf-info-row">';
    $html .= '<span class="pdf-info-label">Format:</span>';
    $html .= '<span>' . $format['size'] . ' ' . $orientation_text . '</span>';
    $html .= '</div>';
    $html .= '</div>';
    $html .= '</div>';
    
    return $html;
}

function ocena_ryzyka_generate_table_headers() {
    $html = '<thead>';
    
    // POZIOM 1 - Najwyższy (26 kolumn razem)
    $html .= '<tr class="header-level-1">';
    $html .= '<th colspan="3" class="header-empty"></th>'; // Lp, Część systemu
    $html .= '<th colspan="7" class="header-category">Identyfikacja zagrożeń</th>';
    $html .= '<th colspan="5" class="header-category">Oszacowanie ryzyka</th>';
    $html .= '<th colspan="1" class="header-category">Ewaluacja ryzyka</th>';
    $html .= '<th colspan="1" class="header-category">Zmniejszanie ryzyka</th>';
    $html .= '<th colspan="5" class="header-category">Iteracja oszacowania ryzyka</th>';
    $html .= '<th colspan="1" class="header-category">Iteracja ewaluacji ryzyka</th>';
    $html .= '<th colspan="2" class="header-empty"></th>'; // Redukcja, Rodzaj zagrożenia
    $html .= '</tr>';
    
    // POZIOM 2 - Średni
    $html .= '<tr class="header-level-2">';
    $html .= '<th rowspan="2" class="col-lp">Lp.</th>';
    $html .= '<th rowspan="2" class="col-czesc-systemu">Część systemu</th>';
    $html .= '<th rowspan="2" class="col-obraz">Obraz</th>';
    $html .= '<th rowspan="2" class="col-zrodlo">Źródło zagrożenia</th>';
    $html .= '<th rowspan="2" class="col-opis">Opis</th>';
    $html .= '<th rowspan="2" class="col-obraz">Obraz elementów</th>';
    $html .= '<th colspan="2">Zagrożenie pierwotne</th>';
    $html .= '<th rowspan="2" class="col-skutki">Skutki</th>';
    $html .= '<th rowspan="2" class="col-fazy">Fazy życia</th>';
    $html .= '<th colspan="6" class="header-section">Przed korektą</th>';
    $html .= '<th rowspan="2" class="col-srodki">Środki profilaktyczne</th>';
    $html .= '<th colspan="6" class="header-section">Po korekcie</th>';
    $html .= '<th rowspan="2" class="col-redukcja">Redukcja</th>';
    $html .= '<th rowspan="2">Rodzaj zagrożenia</th>';
    $html .= '</tr>';
    
    // POZIOM 3 - Dolny (szczegóły)
    $html .= '<tr class="header-level-3">';
    $html .= '<th>Następstwo</th>';
    $html .= '<th>Część ciała</th>';
    $html .= '<th>DPH</th>';
    $html .= '<th>LO</th>';
    $html .= '<th>FE</th>';
    $html .= '<th>NP</th>';
    $html .= '<th>HRN</th>';
    $html .= '<th>Stopień</th>';
    $html .= '<th>DPH</th>';
    $html .= '<th>LO</th>';
    $html .= '<th>FE</th>';
    $html .= '<th>NP</th>';
    $html .= '<th>HRN</th>';
    $html .= '<th>Stopień</th>';
    $html .= '</tr>';
    
    $html .= '</thead>';
    
    return $html;
}

// Oblicz rowspan dla scalonych komórek (część systemu i obraz)
function ocena_ryzyka_calculate_rowspans($rows) {
    $grouped = array();
    $rowspan_info = array();

    // Grupuj wiersze według rodzaj + część systemu
    foreach ($rows as $index => $row) {
        $rodzaj = isset($row['rodzaj_zagrozenia']) ? $row['rodzaj_zagrozenia'] : '';
        $czesc = isset($row['czesc_systemu']) ? $row['czesc_systemu'] : '';

        // Pomiń wiersze bez części systemu
        if (empty($czesc)) {
            $rowspan_info[$index] = array(
                'czesc_rowspan' => 0,
                'obraz_rowspan' => 0,
                'is_first' => false,
                'skip_czesc' => false,
                'skip_obraz' => false
            );
            continue;
        }

        $group_key = $rodzaj . '___' . $czesc;

        if (!isset($grouped[$group_key])) {
            $grouped[$group_key] = array();
        }

        $grouped[$group_key][] = $index;
    }

    // Dla każdej grupy ustaw rowspan
    foreach ($grouped as $group_key => $indices) {
        $rowspan = count($indices);

        foreach ($indices as $position => $index) {
            if ($position === 0) {
                // Pierwszy wiersz w grupie - ma rowspan
                $rowspan_info[$index] = array(
                    'czesc_rowspan' => $rowspan,
                    'obraz_rowspan' => $rowspan,
                    'is_first' => true,
                    'skip_czesc' => false,
                    'skip_obraz' => false
                );
            } else {
                // Pozostałe wiersze - pomijają komórki
                $rowspan_info[$index] = array(
                    'czesc_rowspan' => 0,
                    'obraz_rowspan' => 0,
                    'is_first' => false,
                    'skip_czesc' => true,
                    'skip_obraz' => true
                );
            }
        }
    }

    return $rowspan_info;
}

function ocena_ryzyka_generate_table_row($row, $rowspan_info = array()) {
    $rodzaj_class = '';
    if (!empty($row['rodzaj_zagrozenia'])) {
        $rodzaj_class = ocena_ryzyka_get_rodzaj_css_class($row['rodzaj_zagrozenia']);
    }
    
    $html = '<tr class="' . $rodzaj_class . '">';

    // 1. Lp z ikonką
    $html .= '<td class="cell-lp"><span class="lp-number">' . ocena_ryzyka_format_cell_value($row['lp']) . '</span></td>';

    // 2. Część systemu - z rowspan jeśli jest w grupie
    if (!empty($rowspan_info) && isset($rowspan_info['skip_czesc']) && $rowspan_info['skip_czesc']) {
        // Pomiń komórkę (jest scalona z poprzednią)
    } else {
        $rowspan_attr = '';
        if (!empty($rowspan_info) && isset($rowspan_info['czesc_rowspan']) && $rowspan_info['czesc_rowspan'] > 1) {
            $rowspan_attr = ' rowspan="' . $rowspan_info['czesc_rowspan'] . '"';
        }
        $html .= '<td class="text-small"' . $rowspan_attr . '>' . ocena_ryzyka_format_cell_value($row['czesc_systemu']) . '</td>';
    }

    // 3. Obraz - z rowspan jeśli jest w grupie
    if (!empty($rowspan_info) && isset($rowspan_info['skip_obraz']) && $rowspan_info['skip_obraz']) {
        // Pomiń komórkę (jest scalona z poprzednią)
    } else {
        $rowspan_attr = '';
        if (!empty($rowspan_info) && isset($rowspan_info['obraz_rowspan']) && $rowspan_info['obraz_rowspan'] > 1) {
            $rowspan_attr = ' rowspan="' . $rowspan_info['obraz_rowspan'] . '"';
        }
        $html .= '<td class="cell-image"' . $rowspan_attr . '>' . ocena_ryzyka_generate_image_html($row['obraz']) . '</td>';
    }
    
    // 4. Źródło zagrożenia z listy
    // Jeśli wybrano "Inne źródło" i jest wartość custom, użyj jej
    $zrodlo_display = $row['zrodlo_zagrozenia'];
    if ($row['zrodlo_zagrozenia'] === '__INNE__' && !empty($row['zrodlo_zagrozenia_custom'])) {
        $zrodlo_display = $row['zrodlo_zagrozenia_custom'];
    }
    $html .= '<td class="text-small">' . ocena_ryzyka_format_cell_value($zrodlo_display) . '</td>';
    
    // 5. Źródło zagrożenia - opis
    $html .= '<td class="text-small">' . ocena_ryzyka_format_cell_value($row['zrodlo_zagrozenia_opis']) . '</td>';
    
    // 6. Obraz elementów niebezpiecznych
    $html .= '<td class="cell-image">' . ocena_ryzyka_generate_image_html($row['obraz_elementow']) . '</td>';
    
    // 7. Potencjalne następstwo
    $html .= '<td class="text-small">' . ocena_ryzyka_format_cell_value($row['potencjalne_nastepstwo']) . '</td>';
    
    // 8. Część ciała
    $html .= '<td class="text-small">' . ocena_ryzyka_format_cell_value($row['czesc_ciala']) . '</td>';
    
    // 9. Możliwe skutki zagrożenia
    $html .= '<td class="text-small">' . ocena_ryzyka_format_cell_value($row['skutki']) . '</td>';
    
    // 10. Fazy życia produktu
    $fazy_zycia_display = ocena_ryzyka_format_fazy_zycia($row['fazy_zycia']);
    $html .= '<td class="text-small">' . $fazy_zycia_display . '</td>';
    
    // 11-14: Parametry PRZED korektą
    $html .= '<td class="cell-calculated">' . ocena_ryzyka_format_cell_value($row['dph_przed']) . '</td>';
    $html .= '<td class="cell-calculated">' . ocena_ryzyka_format_cell_value($row['lo_przed']) . '</td>';
    $html .= '<td class="cell-calculated">' . ocena_ryzyka_format_cell_value($row['fe_przed']) . '</td>';
    $html .= '<td class="cell-calculated">' . ocena_ryzyka_format_cell_value($row['np_przed']) . '</td>';
    
    // 15. HRN przed (obliczane)
    $colors_przed = ocena_ryzyka_get_hrn_color($row['hrn_przed']);
    $html .= '<td class="cell-calculated" style="background-color: ' . $colors_przed['bg'] . '; color: ' . $colors_przed['color'] . '; font-weight: bold;">' . ocena_ryzyka_format_cell_value($row['hrn_przed']) . '</td>';

    // 16. Stopień ryzyka przed (obliczany) - używa tego samego koloru co HRN przed
    if (!empty($row['stopien_przed'])) {
        $html .= '<td class="cell-calculated" style="background-color: ' . $colors_przed['bg'] . '; color: ' . $colors_przed['color'] . '; font-weight: bold;">' . ocena_ryzyka_format_cell_value($row['stopien_przed']) . '</td>';
    } else {
        $html .= '<td class="cell-calculated">-</td>';
    }
    
    // 17. Środki profilaktyczne
    $html .= '<td class="text-small">' . ocena_ryzyka_format_cell_value($row['srodki_profilaktyczne']) . '</td>';
    
    // 18-21: Parametry PO korekcie
    $html .= '<td class="cell-calculated">' . ocena_ryzyka_format_cell_value($row['dph_po']) . '</td>';
    $html .= '<td class="cell-calculated">' . ocena_ryzyka_format_cell_value($row['lo_po']) . '</td>';
    $html .= '<td class="cell-calculated">' . ocena_ryzyka_format_cell_value($row['fe_po']) . '</td>';
    $html .= '<td class="cell-calculated">' . ocena_ryzyka_format_cell_value($row['np_po']) . '</td>';
    
    // 22. HRN po (obliczane)
    $colors_po = ocena_ryzyka_get_hrn_color($row['hrn_po']);
    $html .= '<td class="cell-calculated" style="background-color: ' . $colors_po['bg'] . '; color: ' . $colors_po['color'] . '; font-weight: bold;">' . ocena_ryzyka_format_cell_value($row['hrn_po']) . '</td>';

    // 23. Stopień ryzyka po (obliczany) - używa tego samego koloru co HRN po
    if (!empty($row['stopien_po'])) {
        $html .= '<td class="cell-calculated" style="background-color: ' . $colors_po['bg'] . '; color: ' . $colors_po['color'] . '; font-weight: bold;">' . ocena_ryzyka_format_cell_value($row['stopien_po']) . '</td>';
    } else {
        $html .= '<td class="cell-calculated">-</td>';
    }
    
    // 24. Obniżono ryzyko o [%]
    $redukcja_value = floatval($row['redukcja']);
    if ($redukcja_value > 0) {
        // Dodatnia - zielone tło (obniżono ryzyko)
        $redukcja_style = 'background-color: #d4edda; color: #155724;';
    } else if ($redukcja_value < 0) {
        // Ujemna - czerwone tło (zwiększono ryzyko)
        $redukcja_style = 'background-color: #f8d7da; color: #721c24;';
    } else {
        // Zero - białe tło (brak zmiany)
        $redukcja_style = 'background-color: #ffffff; color: #000000;';
    }
    $html .= '<td class="cell-calculated" style="' . $redukcja_style . ' font-weight: bold;">' . ocena_ryzyka_format_cell_value($row['redukcja']) . '</td>';
    
    // 25. Rodzaj zagrożenia
    $html .= '<td class="text-small">' . ocena_ryzyka_format_cell_value($row['rodzaj_zagrozenia']) . '</td>';
    
    $html .= '</tr>';
    
    return $html;
}

function ocena_ryzyka_generate_image_html($image_path) {
    if (empty($image_path)) {
        return '-';
    }
    
    $processed_image = ocena_ryzyka_prepare_image_for_pdf($image_path);
    
    if ($processed_image === false) {
        return '✘';
    }
    
    // Użyj stałej dla rozmiaru w mm
    $size_mm = OCENA_RYZYKA_PDF_IMAGE_SIZE_MM;
    $style = sprintf(
        'max-width:%dmm; max-height:%dmm; width:%dmm; height:auto; display:block; margin:0 auto;',
        $size_mm, $size_mm, $size_mm
    );
    
    return '<img src="' . htmlspecialchars($processed_image) . '" style="' . $style . '" alt="Obraz" />';
}

function ocena_ryzyka_generate_pdf_footer($projekt) {
    $html = '<div class="pdf-footer">';
    $html .= 'Dokument wygenerowany przez system Ocena Ryzyka v' . OCENA_RYZYKA_VERSION;
    $html .= ' | Kod projektu: ' . htmlspecialchars($projekt['kod_projektu']);
    $html .= ' | Data: ' . current_time('d.m.Y H:i');
    $html .= '</div>';
    return $html;
}

function ocena_ryzyka_prepare_image_for_pdf($image_path) {
    if (empty($image_path)) {
        return false;
    }
    
    $real_path = ocena_ryzyka_resolve_image_path($image_path);
    
    if ($real_path === false) {
        return false;
    }
    
    $cache_path = ocena_ryzyka_get_cached_image_path($real_path);
    
    if (file_exists($cache_path)) {
        return $cache_path;
    }
    
    $processed_path = ocena_ryzyka_process_image_for_pdf($real_path, $cache_path);
    
    if ($processed_path === false) {
        return $real_path;
    }
    
    return $processed_path;
}

function ocena_ryzyka_resolve_image_path($image_path) {
    if (filter_var($image_path, FILTER_VALIDATE_URL)) {
        $plugin_url = OCENA_RYZYKA_PLUGIN_URL . 'uploads/';
        if (strpos($image_path, $plugin_url) === 0) {
            $relative = str_replace($plugin_url, '', $image_path);
            $local_path = OCENA_RYZYKA_PLUGIN_DIR . 'uploads/' . $relative;
            
            if (file_exists($local_path)) {
                return $local_path;
            }
        }
        
        return ocena_ryzyka_download_remote_image($image_path);
    }
    
    if (file_exists($image_path)) {
        return $image_path;
    }
    
    $upload_path = OCENA_RYZYKA_PLUGIN_DIR . 'uploads/' . $image_path;
    if (file_exists($upload_path)) {
        return $upload_path;
    }
    
    if (preg_match('/^ORM-[A-Z0-9]+\//', $image_path)) {
        $full_path = OCENA_RYZYKA_PLUGIN_DIR . 'uploads/' . $image_path;
        if (file_exists($full_path)) {
            return $full_path;
        }
    }
    
    return false;
}

function ocena_ryzyka_download_remote_image($url) {
    $temp_dir = OCENA_RYZYKA_PLUGIN_DIR . 'temp/';
    
    if (!file_exists($temp_dir)) {
        wp_mkdir_p($temp_dir);
    }
    
    $filename = 'remote_' . md5($url) . '.jpg';
    $temp_path = $temp_dir . $filename;
    
    if (file_exists($temp_path)) {
        return $temp_path;
    }
    
    $response = wp_remote_get($url, array('timeout' => 30));
    
    if (is_wp_error($response)) {
        return false;
    }
    
    $image_data = wp_remote_retrieve_body($response);
    
    if (empty($image_data)) {
        return false;
    }
    
    file_put_contents($temp_path, $image_data);
    
    return $temp_path;
}

function ocena_ryzyka_get_cached_image_path($original_path) {
    $temp_dir = OCENA_RYZYKA_PLUGIN_DIR . 'temp/pdf-images/';
    
    if (!file_exists($temp_dir)) {
        wp_mkdir_p($temp_dir);
    }
    
    $hash = md5($original_path . filemtime($original_path));
    $extension = pathinfo($original_path, PATHINFO_EXTENSION);
    $filename = 'cached_' . $hash . '.' . $extension;
    
    return $temp_dir . $filename;
}

function ocena_ryzyka_process_image_for_pdf($source_path, $dest_path) {
    if (!extension_loaded('gd') && !extension_loaded('imagick')) {
        return false;
    }
    
    if (extension_loaded('imagick')) {
        return ocena_ryzyka_process_image_imagick($source_path, $dest_path);
    }
    
    return ocena_ryzyka_process_image_gd($source_path, $dest_path);
}

function ocena_ryzyka_process_image_imagick($source_path, $dest_path) {
    try {
        $imagick = new Imagick($source_path);
        
        $width = $imagick->getImageWidth();
        $height = $imagick->getImageHeight();
        
        $max_size = OCENA_RYZYKA_PDF_IMAGE_SIZE;
        $new_dimensions = ocena_ryzyka_calculate_new_dimensions($width, $height, $max_size);
        
        $imagick->resizeImage(
            $new_dimensions['width'],
            $new_dimensions['height'],
            Imagick::FILTER_LANCZOS,
            1
        );
        
        $imagick->setImageCompressionQuality(OCENA_RYZYKA_PDF_IMAGE_QUALITY);
        $imagick->stripImage();
        $imagick->setImageResolution(OCENA_RYZYKA_PDF_DPI, OCENA_RYZYKA_PDF_DPI);
        $imagick->writeImage($dest_path);
        $imagick->clear();
        $imagick->destroy();
        
        return $dest_path;
        
    } catch (Exception $e) {
        error_log('Ocena Ryzyka PDF Imagick Error: ' . $e->getMessage());
        return false;
    }
}

function ocena_ryzyka_process_image_gd($source_path, $dest_path) {
    $image_info = getimagesize($source_path);
    
    if ($image_info === false) {
        return false;
    }
    
    $mime_type = $image_info['mime'];
    
    switch ($mime_type) {
        case 'image/jpeg':
            $source_image = imagecreatefromjpeg($source_path);
            break;
        case 'image/png':
            $source_image = imagecreatefrompng($source_path);
            break;
        case 'image/gif':
            $source_image = imagecreatefromgif($source_path);
            break;
        default:
            return false;
    }
    
    if ($source_image === false) {
        return false;
    }
    
    $width = imagesx($source_image);
    $height = imagesy($source_image);
    
    $max_size = OCENA_RYZYKA_PDF_IMAGE_SIZE;
    $new_dimensions = ocena_ryzyka_calculate_new_dimensions($width, $height, $max_size);
    
    $dest_image = imagecreatetruecolor($new_dimensions['width'], $new_dimensions['height']);
    
    if ($mime_type === 'image/png') {
        imagealphablending($dest_image, false);
        imagesavealpha($dest_image, true);
        $transparent = imagecolorallocatealpha($dest_image, 255, 255, 255, 127);
        imagefilledrectangle($dest_image, 0, 0, $new_dimensions['width'], $new_dimensions['height'], $transparent);
    }
    
    imagecopyresampled(
        $dest_image,
        $source_image,
        0, 0, 0, 0,
        $new_dimensions['width'],
        $new_dimensions['height'],
        $width,
        $height
    );
    
    $success = false;
    if ($mime_type === 'image/png') {
        $success = imagepng($dest_image, $dest_path, 9);
    } else {
        $success = imagejpeg($dest_image, $dest_path, OCENA_RYZYKA_PDF_IMAGE_QUALITY);
    }
    
    imagedestroy($source_image);
    imagedestroy($dest_image);
    
    return $success ? $dest_path : false;
}

function ocena_ryzyka_calculate_new_dimensions($width, $height, $max_size) {
    if ($width <= $max_size && $height <= $max_size) {
        return array('width' => $width, 'height' => $height);
    }
    
    $ratio = $width / $height;
    
    if ($width > $height) {
        $new_width = $max_size;
        $new_height = round($max_size / $ratio);
    } else {
        $new_height = $max_size;
        $new_width = round($max_size * $ratio);
    }
    
    return array('width' => (int) $new_width, 'height' => (int) $new_height);
}

function ocena_ryzyka_clean_image_cache($days = 7) {
    $cache_dir = OCENA_RYZYKA_PLUGIN_DIR . 'temp/pdf-images/';
    
    if (!file_exists($cache_dir)) {
        return 0;
    }
    
    $deleted = 0;
    $cutoff_time = time() - ($days * 24 * 60 * 60);
    $files = glob($cache_dir . '*');
    
    foreach ($files as $file) {
        if (is_file($file) && filemtime($file) < $cutoff_time) {
            if (unlink($file)) {
                $deleted++;
            }
        }
    }
    
    return $deleted;
}

function ocena_ryzyka_risk_level_to_css_class($stopien) {
    $stopien = trim(strtolower($stopien));

    $mapping = array(
        'ryzyko pomijalne' => 'risk-pomijalne',
        'ryzyko bardzo niskie' => 'risk-bardzo-niskie',
        'ryzyko niskie' => 'risk-niskie',
        'ryzyko znaczące' => 'risk-znaczace',
        'ryzyko wysokie' => 'risk-wysokie',
        'ryzyko bardzo wysokie' => 'risk-bardzo-wysokie',
        'ryzyko ekstremalne' => 'risk-ekstremalne',
        'ryzyko nieakceptowalne' => 'risk-nieakceptowalne',
    );

    return isset($mapping[$stopien]) ? $mapping[$stopien] : '';
}

function ocena_ryzyka_get_hrn_color($hrn) {
    // Konwertuj HRN na liczbę
    $hrn_value = floatval($hrn);

    if ($hrn_value <= 5) {
        return array('bg' => '#90EE90', 'color' => '#000000'); // zielony - Ryzyko pomijalne i bardzo niskie
    } else if ($hrn_value <= 10) {
        return array('bg' => '#FFEB3B', 'color' => '#000000'); // żółty - Ryzyko niskie
    } else if ($hrn_value <= 500) {
        return array('bg' => '#FFA726', 'color' => '#000000'); // pomarańczowy - Ryzyko znaczące, wysokie i bardzo wysokie
    } else {
        return array('bg' => '#F44336', 'color' => '#FFFFFF'); // czerwony - Ryzyko ekstremalne i nieakceptowalne
    }
}

function ocena_ryzyka_get_rodzaj_css_class($rodzaj_zagrozenia) {
    $rodzaje = ocena_ryzyka_get_rodzaje_zagrozen();
    $index = array_search($rodzaj_zagrozenia, $rodzaje);
    
    if ($index !== false) {
        return 'rodzaj-' . $index;
    }
    
    return '';
}

function ocena_ryzyka_format_cell_value($value) {
    if (empty($value) || $value === '' || $value === null) {
        return '-';
    }

    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function ocena_ryzyka_format_fazy_zycia($fazy_zycia) {
    // Jeśli puste, zwróć myślnik
    if (empty($fazy_zycia)) {
        return '-';
    }

    // Jeśli to tablica, sformatuj jako lista z przecinkami
    if (is_array($fazy_zycia)) {
        if (count($fazy_zycia) === 0) {
            return '-';
        }

        // Połącz fazy przecinkami
        $formatted = implode(", ", array_map(function($faza) {
            return htmlspecialchars($faza, ENT_QUOTES, 'UTF-8');
        }, $fazy_zycia));

        return $formatted;
    }

    // Jeśli to string (stare dane), zwróć jako string
    return htmlspecialchars($fazy_zycia, ENT_QUOTES, 'UTF-8');
}

function ocena_ryzyka_format_page_info($format) {
    $orientation_text = $format['orientation'] === 'L' ? 'poziomo' : 'pionowo';
    $dimensions = $format['dimensions'];
    
    $text = sprintf(
        'Format: %s %s | Wiersze: %d | %s',
        $format['size'],
        $orientation_text,
        $dimensions['row_count'],
        $format['reason']
    );
    
    return $text;
}

function ocena_ryzyka_get_page_size_mm($size, $orientation = 'L') {
    $sizes = array(
        'A4' => array('width' => 210, 'height' => 297),
        'A3' => array('width' => 297, 'height' => 420),
        'A2' => array('width' => 420, 'height' => 594),
        'A1' => array('width' => 594, 'height' => 841),
        'A0' => array('width' => 841, 'height' => 1189),
    );
    
    if (!isset($sizes[$size])) {
        return $sizes['A3'];
    }
    
    $page = $sizes[$size];
    
    if ($orientation === 'L') {
        return array('width' => $page['height'], 'height' => $page['width']);
    }
    
    return $page;
}