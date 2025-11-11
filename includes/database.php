<?php
/**
 * Obsługa bazy danych dla wtyczki Ocena Ryzyka
 */

// Zapobieganie bezpośredniemu dostępowi
if (!defined('ABSPATH')) {
    exit;
}

// ==========================================
// KONFIGURACJA POŁĄCZENIA Z BAZĄ DANYCH
// ==========================================
if (!defined('OCENA_RYZYKA_DB_HOST')) {
    define('OCENA_RYZYKA_DB_HOST', 'localhost');
}
if (!defined('OCENA_RYZYKA_DB_NAME')) {
    define('OCENA_RYZYKA_DB_NAME', 'sprzymi439');
}
if (!defined('OCENA_RYZYKA_DB_USER')) {
    define('OCENA_RYZYKA_DB_USER', 'sprzymi439');
}
if (!defined('OCENA_RYZYKA_DB_PASSWORD')) {
    define('OCENA_RYZYKA_DB_PASSWORD', 'Vf6dUBH4oL7Ro9');
}
if (!defined('OCENA_RYZYKA_DB_CHARSET')) {
    define('OCENA_RYZYKA_DB_CHARSET', 'utf8mb4');
}
if (!defined('OCENA_RYZYKA_DB_COLLATE')) {
    define('OCENA_RYZYKA_DB_COLLATE', '');
}
// ==========================================

global $ocena_ryzyka_db;

// Utwórz połączenie tylko jeśli jeszcze nie istnieje
if (!isset($ocena_ryzyka_db) || !$ocena_ryzyka_db) {
    $ocena_ryzyka_db = new wpdb(
        OCENA_RYZYKA_DB_USER,
        OCENA_RYZYKA_DB_PASSWORD,
        OCENA_RYZYKA_DB_NAME,
        OCENA_RYZYKA_DB_HOST
    );

    // Ustaw kodowanie
    $ocena_ryzyka_db->set_charset($ocena_ryzyka_db->dbh, OCENA_RYZYKA_DB_CHARSET, OCENA_RYZYKA_DB_COLLATE);

    // Pokaż błędy podczas debugowania
    if (defined('WP_DEBUG') && WP_DEBUG) {
        $ocena_ryzyka_db->show_errors();
    }

    // Sprawdź czy połączenie działa
    if ($ocena_ryzyka_db->last_error) {
        error_log('Ocena Ryzyka - Błąd połączenia z bazą danych: ' . $ocena_ryzyka_db->last_error);
    }
}

/**
 * Funkcja tworząca tabele w bazie danych
 */
function ocena_ryzyka_create_tables() {
    global $ocena_ryzyka_db;
    
    // Sprawdź czy połączenie istnieje
    if (!isset($ocena_ryzyka_db) || !$ocena_ryzyka_db) {
        error_log('Ocena Ryzyka: Brak połączenia z bazą danych podczas tworzenia tabel');
        return false;
    }
    
    $charset_collate = '';
    if (!empty(OCENA_RYZYKA_DB_CHARSET)) {
        $charset_collate = "DEFAULT CHARACTER SET " . OCENA_RYZYKA_DB_CHARSET;
    }
    if (!empty(OCENA_RYZYKA_DB_COLLATE)) {
        $charset_collate .= " COLLATE " . OCENA_RYZYKA_DB_COLLATE;
    }
    
    // USUNIĘTO "KEY kod_projektu (kod_projektu)" - UNIQUE automatycznie tworzy klucz
    $sql_projekty = "CREATE TABLE IF NOT EXISTS projekty (
        id INT(11) NOT NULL AUTO_INCREMENT,
        kod_projektu VARCHAR(20) NOT NULL UNIQUE,
        nazwa_maszyny VARCHAR(255) NOT NULL,
        data_json LONGTEXT,
        data_utworzenia DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_modyfikacji DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset_collate;";
    
    // Wykonaj zapytanie
    $result = $ocena_ryzyka_db->query($sql_projekty);
    
    if ($result === false) {
        error_log('Ocena Ryzyka - Błąd tworzenia tabeli: ' . $ocena_ryzyka_db->last_error);
        return false;
    }
    
    error_log('Ocena Ryzyka: Tabele utworzone pomyślnie');
    return true;
}

/**
 * Funkcja sprawdzająca czy tabela istnieje
 */
function ocena_ryzyka_table_exists($table_name) {
    global $ocena_ryzyka_db;
    
    if (!isset($ocena_ryzyka_db) || !$ocena_ryzyka_db) {
        error_log('Ocena Ryzyka: Brak połączenia z bazą danych w table_exists');
        return false;
    }
    
    $result = $ocena_ryzyka_db->get_var("SHOW TABLES LIKE '$table_name'");
    return ($result == $table_name);
}