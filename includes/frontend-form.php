<?php
if (!defined('ABSPATH')) {
    exit;
}

// Rejestracja shortcode
add_shortcode('tabela_oceny_ryzyka', 'ocena_ryzyka_display_form');

function ocena_ryzyka_display_form() {
    ob_start();
    ?>
    
    <div id="ocena-ryzyka-container" class="ocena-ryzyka-wrapper">
        
        <!-- Panel zarządzania projektem -->
        <div class="ocena-ryzyka-toolbar">
            <div class="toolbar-left">
                <button type="button" id="btn-nowy-projekt" class="btn btn-secondary">
                    🔄 Nowy projekt
                </button>
                <button type="button" id="btn-zapisz-projekt" class="btn btn-primary">
                    💾 Zapisz projekt
                </button>
                <button type="button" id="btn-otworz-projekt" class="btn btn-secondary">
                    📂 Otwórz projekt
                </button>
                <button type="button" id="btn-eksportuj-pdf" class="btn btn-success">
                    📄 Eksportuj do PDF
                </button>
            </div>
            
            <div class="toolbar-right">
                <span id="autosave-status" class="autosave-status">
                    <span class="status-icon">💾</span>
                    <span class="status-text">Dane zapisane lokalnie</span>
                </span>
            </div>
        </div>
        
        <!-- Informacja o kodzie projektu (ukryta początkowo) -->
        <div id="projekt-info" class="projekt-info" style="display: none;">
            <strong>📋 Kod projektu:</strong> 
            <span id="projekt-kod" class="projekt-kod"></span>
            <button type="button" id="btn-kopiuj-kod" class="btn-link">📋 Kopiuj</button>
        </div>
        
        <!-- Modal: Otwórz projekt -->
        <div id="modal-otworz-projekt" class="ocena-modal" style="display: none;">
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h3>📂 Otwórz projekt</h3>
                <p>Wpisz kod projektu:</p>
                <input type="text" id="input-kod-projektu" class="modal-input" placeholder="np. ORM-A1B2C3" />
                <div class="modal-buttons">
                    <button type="button" id="btn-potwierdz-otworz" class="btn btn-primary">Otwórz</button>
                    <button type="button" id="btn-anuluj-otworz" class="btn btn-secondary">Anuluj</button>
                </div>
                <div id="modal-error" class="modal-error" style="display: none;"></div>
            </div>
        </div>
        
        <!-- Modal: Nazwa maszyny -->
        <div id="modal-nazwa-maszyny" class="ocena-modal" style="display: none;">
            <div class="modal-content">
                <span class="modal-close-nazwa">&times;</span>
                <h3>💾 Zapisz projekt</h3>
                <p>Podaj nazwę maszyny (opcjonalnie):</p>
                <input type="text" id="input-nazwa-maszyny" class="modal-input" placeholder="np. Prasa hydrauliczna XYZ-500" />
                <div class="modal-buttons">
                    <button type="button" id="btn-potwierdz-zapis" class="btn btn-primary">Zapisz</button>
                    <button type="button" id="btn-anuluj-zapis" class="btn btn-secondary">Anuluj</button>
                </div>
            </div>
        </div>
        
        <!-- Tabela oceny ryzyka -->
        <div class="ocena-ryzyka-table-wrapper">
            <table id="ocena-ryzyka-table" class="ocena-ryzyka-table">
                <thead id="table-headers">
                
                <!-- POZIOM 1 - Najwyższy (15px) -->
                <tr class="header-level-1">
                    <th colspan="3" class="header-empty"></th>
                    <th colspan="7" class="header-category">Identyfikacja zagrożeń</th>
                    <th colspan="5" class="header-category">Oszacowanie ryzyka</th>
                    <th colspan="1" class="header-category">Ewaluacja ryzyka</th>
                    <th colspan="1" class="header-category">Zmniejszanie ryzyka</th>
                    <th colspan="5" class="header-category">Iteracja oszacowania ryzyka</th>
                    <th colspan="1" class="header-category">Iteracja ewaluacji ryzyka</th>
                    <th colspan="5" class="header-empty"></th>
                </tr>
                
                <!-- POZIOM 2 - Średni -->
                <tr class="header-level-2">
                    <th rowspan="2" class="header-main">Lp.</th>
                    <th rowspan="2" class="header-main">Część systemu</th>
                    <th rowspan="2" class="header-main">Obraz</th>
                    <th rowspan="2" class="header-main">Źródło zagrożenia z listy rozwijanej</th>
                    <th rowspan="2" class="header-main">Źródło zagrożenia - opis</th>
                    <th rowspan="2" class="header-main">Obraz elementów niebezpiecznych</th>
                    <th colspan="2" class="header-main">Zagrożenie (zdarzenie) pierwotne</th>
                    <th rowspan="2" class="header-main">Możliwe skutki zagrożenia</th>
                    <th rowspan="2" class="header-main">Fazy życia produktu w których może wystąpić zagrożenie</th>
                    <th colspan="6" class="header-section">Przed korektą</th>
                    
                    <th rowspan="2" class="header-main">Zastosowane środki profilaktyczne</th>
                    <th colspan="6" class="header-section">Po korekcie</th>
                    
                    <th rowspan="2" class="header-main">Obniżono ryzyko o [%]</th>
                    <th rowspan="2" class="header-main">Rodzaj zagrożenia</th>
                    <th rowspan="2" class="header-main">Akcje</th>
                </tr>
                
                <!-- POZIOM 3 - Dolny (szczegóły) -->
                <tr class="header-level-3">
                    <!-- Zagrożenie (zdarzenie) pierwotne - rozdzielone -->
                    <th class="header-detail">Potencjalne następstwo</th>
                    <th class="header-detail">Część ciała której dotyczy zagrożenie</th>
                    
                    <!-- Przed korektą - szczegóły (5 kolumn) -->
                    <th class="header-detail">[DPH]<br>Stopień ewentualnej szkody</th>
                    <th class="header-detail">[LO]<br>Prawdopodobieństwo wystąpienia</th>
                    <th class="header-detail">[FE]<br>Częstotliwość ekspozycji</th>
                    <th class="header-detail">[NP]<br>Liczba osób zagrożonych</th>
                    <th class="header-detail">Ryzyko [HRN]</th>
                    <th class="header-detail">Stopień ryzyka</th>
                    
                    <!-- Po korekcie - szczegóły (5 kolumn) -->
                    <th class="header-detail">[DPH]<br>Stopień ewentualnej szkody</th>
                    <th class="header-detail">[LO]<br>Prawdopodobieństwo wystąpienia</th>
                    <th class="header-detail">[FE]<br>Częstotliwość ekspozycji</th>
                    <th class="header-detail">[NP]<br>Liczba osób zagrożonych</th>
                    <th class="header-detail">Ryzyko [HRN]</th>
                    <th class="header-detail">Stopień ryzyka</th>
                </tr>
                
            </thead>
                <tbody id="table-body">
                    <!-- Wiersze danych zostaną dodane dynamicznie przez JavaScript -->
                </tbody>
            </table>
        </div>
        
        <!-- Przycisk dodawania wiersza -->
        <div class="ocena-ryzyka-add-row">
            <button type="button" id="btn-dodaj-wiersz" class="btn btn-success">
                ➕ Dodaj wiersz
            </button>
        </div>
        
    </div>
    
    <?php
    return ob_get_clean();
}

// Enqueue skryptów tylko gdy shortcode jest używany
add_filter('the_content', 'ocena_ryzyka_check_shortcode');

function ocena_ryzyka_check_shortcode($content) {
    if (has_shortcode($content, 'tabela_oceny_ryzyka')) {  // <-- Zmień tutaj też!
        wp_localize_script('ocena-ryzyka-script', 'ocenaRyzykaData', array(
            'zrodla' => ocena_ryzyka_get_zrodla_zagrozen(),
            'dph' => ocena_ryzyka_get_dph_values(),
            'lo' => ocena_ryzyka_get_lo_values(),
            'fe' => ocena_ryzyka_get_fe_values(),
            'np' => ocena_ryzyka_get_np_values(),
            'riskLevels' => ocena_ryzyka_get_risk_levels(),
            'rodzajeZagrozen' => ocena_ryzyka_get_rodzaje_zagrozen()  // <-- DODAJ TO
        ));
    }
    return $content;
}