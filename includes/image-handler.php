<?php
if (!defined('ABSPATH')) {
    exit;
}

// Katalog uploadów wtyczki
function ocena_ryzyka_get_upload_dir() {
    $upload_dir = OCENA_RYZYKA_PLUGIN_DIR . 'uploads/';
    
    // Utwórz katalog jeśli nie istnieje
    if (!file_exists($upload_dir)) {
        wp_mkdir_p($upload_dir);
        
        // Dodaj .htaccess dla bezpieczeństwa (opcjonalnie)
        $htaccess = $upload_dir . '.htaccess';
        if (!file_exists($htaccess)) {
            file_put_contents($htaccess, 'Options -Indexes');
        }
    }
    
    return $upload_dir;
}

// URL do katalogu uploadów
function ocena_ryzyka_get_upload_url() {
    return OCENA_RYZYKA_PLUGIN_URL . 'uploads/';
}

// Zapisz obrazek base64 jako plik
function ocena_ryzyka_save_image_from_base64($base64_data, $projekt_kod, $row_id, $field_name) {
    $upload_dir = ocena_ryzyka_get_upload_dir();
    $upload_url = ocena_ryzyka_get_upload_url();
    
    // Katalog dla projektu
    $projekt_dir = $upload_dir . $projekt_kod . '/';
    $projekt_url = $upload_url . $projekt_kod . '/';
    
    // Utwórz katalog projektu jeśli nie istnieje
    if (!file_exists($projekt_dir)) {
        wp_mkdir_p($projekt_dir);
    }
    
    // Wyodrębnij dane base64
    if (preg_match('/^data:image\/(\w+);base64,/', $base64_data, $type)) {
        $base64_data = substr($base64_data, strpos($base64_data, ',') + 1);
        $type = strtolower($type[1]); // jpg, png, gif
        
        // Dekoduj base64
        $data = base64_decode($base64_data);
        
        if ($data === false) {
            return false;
        }
        
        // Nazwa pliku
        $filename = "row{$row_id}_{$field_name}." . $type;
        $filepath = $projekt_dir . $filename;
        
        // Zapisz plik
        if (file_put_contents($filepath, $data)) {
            return $projekt_url . $filename;
        }
    }
    
    return false;
}

// Usuń obrazy projektu
function ocena_ryzyka_delete_project_images($projekt_kod) {
    $upload_dir = ocena_ryzyka_get_upload_dir();
    $projekt_dir = $upload_dir . $projekt_kod . '/';
    
    if (file_exists($projekt_dir)) {
        // Usuń wszystkie pliki w katalogu
        $files = glob($projekt_dir . '*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        // Usuń katalog
        rmdir($projekt_dir);
        return true;
    }
    
    return false;
}

// Pobierz rozmiar katalogu projektu
function ocena_ryzyka_get_project_size($projekt_kod) {
    $upload_dir = ocena_ryzyka_get_upload_dir();
    $projekt_dir = $upload_dir . $projekt_kod . '/';
    
    if (!file_exists($projekt_dir)) {
        return 0;
    }
    
    $size = 0;
    $files = glob($projekt_dir . '*');
    foreach ($files as $file) {
        if (is_file($file)) {
            $size += filesize($file);
        }
    }
    
    return $size;
}

// Formatuj rozmiar pliku
function ocena_ryzyka_format_size($bytes) {
    $units = array('B', 'KB', 'MB', 'GB');
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, 2) . ' ' . $units[$pow];
}