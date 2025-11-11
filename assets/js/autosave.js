(function($) {
    'use strict';
    
    const AUTOSAVE_KEY = 'ocena_ryzyka_autosave';
    const AUTOSAVE_INTERVAL = 3000; // 3 sekundy
    let autosaveTimer = null;
    
    $(document).ready(function() {
        console.log('Auto-save - inicjalizacja');
        
        // Wczytaj dane z localStorage przy starcie
        loadFromLocalStorage();
        
        // Uruchom auto-save co 3 sekundy
        startAutoSave();
        
        // Zapisz przy każdej zmianie w tabeli (debounced)
        $(document).on('change keyup', '.ocena-ryzyka-table input, .ocena-ryzyka-table select, .ocena-ryzyka-table textarea', function() {
            scheduleAutoSave();
        });
    });
    
    // Uruchomienie cyklicznego auto-save
    function startAutoSave() {
        setInterval(function() {
            saveToLocalStorage();
        }, AUTOSAVE_INTERVAL);
    }
    
    // Opóźniony zapis (po zmianach)
    function scheduleAutoSave() {
        if (autosaveTimer) {
            clearTimeout(autosaveTimer);
        }
        
        autosaveTimer = setTimeout(function() {
            saveToLocalStorage();
        }, 1000); // Czekaj 1 sekundę po ostatniej zmianie
    }
    
    // Zapisywanie do localStorage
    function saveToLocalStorage() {
        try {
            const data = collectTableData();
            
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
            
            // Zaktualizuj status
            updateSaveStatus('success');
            
            console.log('Auto-save: Dane zapisane', data);
        } catch (error) {
            console.error('Auto-save: Błąd zapisu', error);
            updateSaveStatus('error');
        }
    }
    
    // Zbieranie danych z tabeli
    function collectTableData() {
        const rows = [];

        $('#table-body tr:not(.selection-row)').each(function() {
            const $row = $(this);
            const rowData = {
                lp: $row.find('.cell-lp .lp-number').text(),
                rodzaj_zagrozenia: $row.attr('data-rodzaj') || '',
                czesc_systemu: $row.find('[data-field="czesc_systemu"]').val() || '',
                obraz: $row.find('[data-field="obraz"]').siblings('.preview-image').attr('src') || '',
                zrodlo_zagrozenia: $row.find('[data-field="zrodlo_zagrozenia"]').val() || '',
                zrodlo_zagrozenia_custom: $row.find('[data-field="zrodlo_zagrozenia_custom"]').val() || '',
                zrodlo_zagrozenia_opis: $row.find('[data-field="zrodlo_zagrozenia_opis"]').val() || '',
                obraz_elementow: $row.find('[data-field="obraz_elementow"]').siblings('.preview-image').attr('src') || '',
                potencjalne_nastepstwo: $row.find('[data-field="potencjalne_nastepstwo"]').val() || '',
                czesc_ciala: $row.find('[data-field="czesc_ciala"]').val() || '',
                skutki: $row.find('[data-field="skutki"]').val() || '',
                fazy_zycia: $row.find('[data-field="fazy_zycia"]').val() || '',
                dph_przed: $row.find('[data-field="dph_przed"]').val() || '',
                lo_przed: $row.find('[data-field="lo_przed"]').val() || '',
                fe_przed: $row.find('[data-field="fe_przed"]').val() || '',
                np_przed: $row.find('[data-field="np_przed"]').val() || '',
                hrn_przed: $row.find('.calc-hrn-przed').text() || '',
                stopien_przed: $row.find('.calc-stopien-przed').text() || '',
                srodki_profilaktyczne: $row.find('[data-field="srodki_profilaktyczne"]').val() || '',
                dph_po: $row.find('[data-field="dph_po"]').val() || '',
                lo_po: $row.find('[data-field="lo_po"]').val() || '',
                fe_po: $row.find('[data-field="fe_po"]').val() || '',
                np_po: $row.find('[data-field="np_po"]').val() || '',
                hrn_po: $row.find('.calc-hrn-po').text() || '',
                stopien_po: $row.find('.calc-stopien-po').text() || '',
                redukcja: $row.find('.calc-redukcja').text() || '',
                // Dane o grupowaniu i scalonych komórkach
                merge_data: {
                    group_key: $row.attr('data-merge-group') || null,
                    position: $row.attr('data-merge-position') || null
                }
            };

            rows.push(rowData);
        });

        return {
            rows: rows,
            timestamp: new Date().toISOString(),
            rowCounter: window.ocenaRyzykaRowCounter || rows.length + 1
        };
    }
    
    // Wczytywanie z localStorage
    function loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem(AUTOSAVE_KEY);
            
            if (!savedData) {
                console.log('Auto-save: Brak zapisanych danych');
                return;
            }
            
            const data = JSON.parse(savedData);
            
            if (!data.rows || data.rows.length === 0) {
                console.log('Auto-save: Pusta tabela w zapisie');
                return;
            }
            
            // Wyczyść obecną tabelę (usuń wszystkie wiersze)
            $('#table-body').empty();
            
            // Przywróć rowCounter
            if (data.rowCounter) {
                window.ocenaRyzykaRowCounter = data.rowCounter;
            }

            // Dodaj wiersze z zapisanych danych
            data.rows.forEach(function(rowData) {
                restoreRow(rowData);
            });

            // Zastosuj grupowanie i scalanie komórek po przywróceniu wszystkich wierszy
            if (typeof window.ocenaRyzykaApplyRowGrouping === 'function') {
                window.ocenaRyzykaApplyRowGrouping();
            }

            // Zaktualizuj status
            const savedTime = new Date(data.timestamp);
            updateSaveStatus('loaded', savedTime);

            console.log('Auto-save: Dane wczytane', data);
        } catch (error) {
            console.error('Auto-save: Błąd wczytywania', error);
        }
    }
    
    // Przywracanie pojedynczego wiersza
    function restoreRow(rowData) {
        // Sprawdź czy to wiersz z danymi czy wiersz wyboru
        if (!rowData.rodzaj_zagrozenia) {
            // Jeśli brak rodzaju zagrożenia - nie przywracaj (może być w trakcie wypełniania)
            return;
        }
        
        // Użyj funkcji z głównego skryptu do dodania wiersza
        if (typeof window.ocenaRyzykaGenerateDataRow === 'function') {
            const rowHtml = window.ocenaRyzykaGenerateDataRow(rowData.lp, rowData.rodzaj_zagrozenia);
            $('#table-body').append(rowHtml);
            
            const $row = $('#row-' + rowData.lp);
            
            // Wypełnij dane
            // Część systemu - ustaw wartość i dodaj do listy jeśli nie istnieje
            const czescSystemu = rowData.czesc_systemu;
            if (czescSystemu && czescSystemu.trim() !== '') {
                // Dodaj do listy części jeśli nie istnieje
                if (typeof window.addCzescSystemuToList === 'function') {
                    window.addCzescSystemuToList(czescSystemu);
                }
                $row.find('[data-field="czesc_systemu"]').val(czescSystemu);
                $row.find('[data-field="czesc_systemu_select"]').val(czescSystemu);
            }

            $row.find('[data-field="zrodlo_zagrozenia"]').val(rowData.zrodlo_zagrozenia);
            $row.find('[data-field="zrodlo_zagrozenia_custom"]').val(rowData.zrodlo_zagrozenia_custom);

            // Jeśli było wybrane "Inne źródło" i jest wartość custom, pokaż pole
            if (rowData.zrodlo_zagrozenia === '__INNE__' && rowData.zrodlo_zagrozenia_custom) {
                $row.find('[data-field="zrodlo_zagrozenia_custom"]').show();
            }

            $row.find('[data-field="zrodlo_zagrozenia_opis"]').val(rowData.zrodlo_zagrozenia_opis);
            $row.find('[data-field="potencjalne_nastepstwo"]').val(rowData.potencjalne_nastepstwo);
            $row.find('[data-field="czesc_ciala"]').val(rowData.czesc_ciala);
            $row.find('[data-field="skutki"]').val(rowData.skutki);
            $row.find('[data-field="fazy_zycia"]').val(rowData.fazy_zycia);
            $row.find('[data-field="dph_przed"]').val(rowData.dph_przed);
            $row.find('[data-field="lo_przed"]').val(rowData.lo_przed);
            $row.find('[data-field="fe_przed"]').val(rowData.fe_przed);
            $row.find('[data-field="np_przed"]').val(rowData.np_przed);
            $row.find('[data-field="srodki_profilaktyczne"]').val(rowData.srodki_profilaktyczne);
            $row.find('[data-field="dph_po"]').val(rowData.dph_po);
            $row.find('[data-field="lo_po"]').val(rowData.lo_po);
            $row.find('[data-field="fe_po"]').val(rowData.fe_po);
            $row.find('[data-field="np_po"]').val(rowData.np_po);
            
            // Przywróć obrazy
            if (rowData.obraz) {
                $row.find('[data-field="obraz"]').siblings('.preview-image').attr('src', rowData.obraz).show();
                $row.find('[data-field="obraz"]').text('✓');
            }
            
            if (rowData.obraz_elementow) {
                $row.find('[data-field="obraz_elementow"]').siblings('.preview-image').attr('src', rowData.obraz_elementow).show();
                $row.find('[data-field="obraz_elementow"]').text('✓');
            }
            
            // Dodaj obsługę zdarzeń
            if (typeof window.ocenaRyzykaAttachRowEvents === 'function') {
                window.ocenaRyzykaAttachRowEvents($row);
            }
            
            // Przelicz ryzyko
            if (typeof window.ocenaRyzykaCalculateRisk === 'function') {
                window.ocenaRyzykaCalculateRisk($row);
            }
        }
    }
    
    // Aktualizacja statusu zapisu
    function updateSaveStatus(status, time) {
        const $statusElement = $('#autosave-status');
        const $statusText = $statusElement.find('.status-text');
        const $statusIcon = $statusElement.find('.status-icon');
        
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0') + ':' + 
                          now.getSeconds().toString().padStart(2, '0');
        
        switch(status) {
            case 'success':
                $statusIcon.text('💾');
                $statusText.text('Zapisano lokalnie ' + timeString);
                $statusElement.css('background', '#d4edda');
                break;
            case 'error':
                $statusIcon.text('⚠️');
                $statusText.text('Błąd zapisu');
                $statusElement.css('background', '#f8d7da');
                break;
            case 'loaded':
                $statusIcon.text('📂');
                const loadedTime = time.getHours().toString().padStart(2, '0') + ':' + 
                                  time.getMinutes().toString().padStart(2, '0');
                $statusText.text('Wczytano dane z ' + loadedTime);
                $statusElement.css('background', '#cce5ff');
                
                // Po 3 sekundach zmień na normalny status
                setTimeout(function() {
                    updateSaveStatus('success');
                }, 3000);
                break;
        }
    }
    
    // Funkcja czyszczenia localStorage (będzie używana przez "Nowy projekt")
    window.ocenaRyzukaClearLocalStorage = function() {
        localStorage.removeItem(AUTOSAVE_KEY);
        console.log('Auto-save: localStorage wyczyszczony');
    };
    
    window.ocenaRyzykaRestoreRow = restoreRow;

})(jQuery);