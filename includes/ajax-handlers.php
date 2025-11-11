<?php
if (!defined('ABSPATH')) {
    exit;
}

// AJAX: Zapisz projekt
add_action('wp_ajax_ocena_ryzyka_save_project', 'ocena_ryzyka_ajax_save_project');
add_action('wp_ajax_nopriv_ocena_ryzyka_save_project', 'ocena_ryzyka_ajax_save_project');

function ocena_ryzyka_ajax_save_project() {
    // Weryfikacja nonce
    check_ajax_referer('ocena-ryzyka-nonce', 'nonce');
    
    // Pobierz dane
    $nazwa_maszyny = isset($_POST['nazwa_maszyny']) ? sanitize_text_field($_POST['nazwa_maszyny']) : '';
    $data_json = isset($_POST['data_json']) ? wp_unslash($_POST['data_json']) : '';
    $images_json = isset($_POST['images']) ? wp_unslash($_POST['images']) : '{}';
    
    if (empty($data_json)) {
        wp_send_json_error(array(
            'message' => 'Brak danych do zapisania'
        ));
    }
    
    // Najpierw zapisz projekt i pobierz kod
    $result = ocena_ryzyka_save_project($nazwa_maszyny, $data_json);
    
    if (!$result['success']) {
        wp_send_json_error($result);
    }
    
    $projekt_kod = $result['kod_projektu'];
    
    // Dekoduj obrazy
    $images = json_decode($images_json, true);
    
    if ($images && count($images) > 0) {
        // Dekoduj data_json
        $project_data = json_decode($data_json, true);
        
        // Zapisz obrazy jako pliki i zamień placeholdery na URLe
        foreach ($images as $key => $base64_data) {
            // Wyodrębnij row_id i field_name z klucza (np. "row1_obraz")
            preg_match('/row(\d+)_(.+)/', $key, $matches);
            if ($matches) {
                $row_id = $matches[1];
                $field_name = $matches[2];
                
                // Zapisz obrazek jako plik
                $image_url = ocena_ryzyka_save_image_from_base64($base64_data, $projekt_kod, $row_id, $field_name);
                
                if ($image_url) {
                    // Zamień placeholder na URL w danych projektu
                    foreach ($project_data['rows'] as &$row) {
                        if ($row['lp'] == $row_id) {
                            $placeholder = 'PLACEHOLDER_' . $row_id . '_' . $field_name;
                            if ($row[$field_name] == $placeholder) {
                                $row[$field_name] = $image_url;
                            }
                        }
                    }
                }
            }
        }
        
        // Zaktualizuj projekt w bazie z URLami obrazów
        global $ocena_ryzyka_db;
        $ocena_ryzyka_db->update(
            'projekty',
            array('data_json' => json_encode($project_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)),
            array('kod_projektu' => $projekt_kod),
            array('%s'),
            array('%s')
        );
    }
    
    wp_send_json_success($result);
}

// AJAX: Wczytaj projekt
add_action('wp_ajax_ocena_ryzyka_load_project', 'ocena_ryzyka_ajax_load_project');
add_action('wp_ajax_nopriv_ocena_ryzyka_load_project', 'ocena_ryzyka_ajax_load_project');

function ocena_ryzyka_ajax_load_project() {
    check_ajax_referer('ocena-ryzyka-nonce', 'nonce');
    
    $kod_projektu = isset($_POST['kod_projektu']) ? sanitize_text_field($_POST['kod_projektu']) : '';
    
    if (empty($kod_projektu)) {
        wp_send_json_error(array('message' => 'Nie podano kodu projektu'));
    }
    
    $result = ocena_ryzyka_load_project($kod_projektu);
    
    if ($result['success']) {
        // BEZ stripslashes - JSON powinien być czysty
        wp_send_json_success($result);
    } else {
        wp_send_json_error($result);
    }
}

// AJAX: Usuń projekt
add_action('wp_ajax_ocena_ryzyka_delete_project', 'ocena_ryzyka_ajax_delete_project');

function ocena_ryzyka_ajax_delete_project() {
    // Weryfikacja nonce
    check_ajax_referer('ocena-ryzyka-nonce', 'nonce');
    
    // Sprawdź uprawnienia
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array(
            'message' => 'Brak uprawnień'
        ));
    }
    
    // Pobierz kod projektu
    $kod_projektu = isset($_POST['kod_projektu']) ? sanitize_text_field($_POST['kod_projektu']) : '';
    
    if (empty($kod_projektu)) {
        wp_send_json_error(array(
            'message' => 'Nie podano kodu projektu'
        ));
    }
    
    // Usuń projekt
    $result = ocena_ryzyka_delete_project($kod_projektu);
    
    if ($result['success']) {
        wp_send_json_success($result);
    } else {
        wp_send_json_error($result);
    }
}

// AJAX: Eksportuj do PDF
add_action('wp_ajax_ocena_ryzyka_export_pdf', 'ocena_ryzyka_ajax_export_pdf');
add_action('wp_ajax_nopriv_ocena_ryzyka_export_pdf', 'ocena_ryzyka_ajax_export_pdf');

function ocena_ryzyka_ajax_export_pdf() {
    // Weryfikacja nonce
    check_ajax_referer('ocena-ryzyka-nonce', 'nonce');
    
    // Pobierz kod projektu
    $kod_projektu = isset($_POST['kod_projektu']) ? sanitize_text_field($_POST['kod_projektu']) : '';
    
    if (empty($kod_projektu)) {
        wp_send_json_error(array(
            'message' => 'Nie podano kodu projektu. Najpierw zapisz projekt.'
        ));
    }
    
    // Generuj PDF
    $result = ocena_ryzyka_generate_pdf($kod_projektu);
    
    if (!$result['success']) {
        wp_send_json_error($result);
    }
    
    // Przygotuj URL do pobrania
    $temp_url = OCENA_RYZYKA_PLUGIN_URL . 'temp/' . $result['filename'];
    
    wp_send_json_success(array(
        'message' => $result['message'],
        'download_url' => $temp_url,
        'filename' => $result['filename'],
        'file_size' => $result['file_size'],
        'format_info' => $result['format_info']
    ));
}