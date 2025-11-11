<?php
if (!defined('ABSPATH')) {
    exit;
}

// Funkcja zapisywania projektu do bazy
function ocena_ryzyka_save_project($nazwa_maszyny, $data_json) {
    global $ocena_ryzyka_db;
    
    // Generuj unikalny kod projektu
    $kod_projektu = ocena_ryzyka_generate_unique_code();
    
    // Przygotuj dane
    $table_name = 'projekty';
    
    // Wstaw do bazy
    $result = $ocena_ryzyka_db->insert(
        $table_name,
        array(
            'kod_projektu' => $kod_projektu,
            'nazwa_maszyny' => $nazwa_maszyny,
            'data_json' => $data_json  // Pozostaw bez zmian
        ),
        array('%s', '%s', '%s')
    );
    
    if ($result === false) {
        return array(
            'success' => false,
            'message' => 'Błąd zapisu do bazy danych',
            'error' => $ocena_ryzyka_db->last_error
        );
    }
    
    return array(
        'success' => true,
        'kod_projektu' => $kod_projektu,
        'message' => 'Projekt zapisany pomyślnie'
    );
}

// Funkcja wczytywania projektu z bazy
function ocena_ryzyka_load_project($kod_projektu) {
    global $ocena_ryzyka_db;
    
    $table_name = 'projekty';
    
    // Pobierz projekt
    $projekt = $ocena_ryzyka_db->get_row(
        $ocena_ryzyka_db->prepare(
            "SELECT * FROM $table_name WHERE kod_projektu = %s",
            $kod_projektu
        ),
        ARRAY_A
    );
    
    if (!$projekt) {
        return array(
            'success' => false,
            'message' => 'Projekt nie znaleziony. Sprawdź kod i spróbuj ponownie.'
        );
    }
    
    return array(
        'success' => true,
        'projekt' => $projekt,
        'message' => 'Projekt wczytany pomyślnie'
    );
}

// Funkcja generowania unikalnego kodu
function ocena_ryzyka_generate_unique_code() {
    global $ocena_ryzyka_db;
    $table_name = 'projekty';
    $prefix = 'ORM-';
    
    do {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $code = '';
        
        for ($i = 0; $i < 6; $i++) {
            $code .= $characters[rand(0, strlen($characters) - 1)];
        }
        
        $full_code = $prefix . $code;
        
        // Sprawdź czy kod już istnieje
        $exists = $ocena_ryzyka_db->get_var(
            $ocena_ryzyka_db->prepare(
                "SELECT COUNT(*) FROM $table_name WHERE kod_projektu = %s",
                $full_code
            )
        );
    } while ($exists > 0);
    
    return $full_code;
}

// Funkcja usuwania projektu
function ocena_ryzyka_delete_project($kod_projektu) {
    global $ocena_ryzyka_db;
    
    // Usuń obrazy
    ocena_ryzyka_delete_project_images($kod_projektu);
    
    // Usuń z bazy
    $result = $ocena_ryzyka_db->delete(
        'projekty',
        array('kod_projektu' => $kod_projektu),
        array('%s')
    );
    
    if ($result === false) {
        return array(
            'success' => false,
            'message' => 'Błąd usuwania z bazy danych'
        );
    }
    
    return array(
        'success' => true,
        'message' => 'Projekt usunięty pomyślnie'
    );
}

// Pobierz wszystkie projekty
function ocena_ryzyka_get_all_projects() {
    global $ocena_ryzyka_db;
    
    $projekty = $ocena_ryzyka_db->get_results(
        "SELECT * FROM projekty ORDER BY data_utworzenia DESC",
        ARRAY_A
    );
    
    return $projekty;
}