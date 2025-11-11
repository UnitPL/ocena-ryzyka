<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Dane list rozwijalnych z arkusza Excel "Listy rozwijalne" i "Wartości"
 */

// Źródła zagrożeń - z arkusza "Listy rozwijalne"
function ocena_ryzyka_get_zrodla_zagrozen() {
    return array(
        'Zagrożenia mechaniczne' => array(
            'Przyśpienienie, opuźnienie',
            'Części ostro zakończone',
            'Zbliżanie się elementu poruszającego się do części stałej',
            'Części tnące',
            'Części sprężyste',
            'Obiekty spadające',
            'Siła ciężkości',
            'Wysokość od poziomu podłoża',
            'Wysokie ciśnienie',
            'Brak stateczności',
            'Energia kinetyczna',
            'Mobilność maszyn',
            'Poruszające się elementy',
            'Wirujące elementy',
            'Nierówna, śliska nawierzchnia',
            'Ostre krawędzie',
            'Zakumulowana energia',
            'Próżnia-wciąganie'
        ),
        'Zagrożenia elektryczne' => array(
            'Łuk',
            'Zjawiska elektromagnetyczne',
            'Zjawiska elektrostatyczne',
            'Części czynne',
            'Niewystarczająca odległość od części czynnych pod wysokim napięciem',
            'Przeciążenie',
            'Części, które stały się czynne w wyniku uszkodzenia',
            'Zwarcie',
            'Promieniowanie cieplne'
        ),
        'Zagrożenia termiczne' => array(
            'Wybuch',
            'Płomień',
            'Obiekty lub materiały o wysokiej lub niskiej temperaturze',
            'Promieniowanie ze źródeł ciepła'
        ),
        'Zagrożenia hałasem' => array(
            'Zjawisko kawitacji',
            'Układ wydechowy',
            'Wypływ gazu z dużą prędkością',
            'Proces produkcyjny (tłoczenie, cięcie itd..)',
            'Poruszające się części',
            'Skrobanie powierzchni',
            'Niewyważone części wirujące',
            'Hałaśliwe układy pneumatyczne',
            'Zużyte części'
        ),
        'Zagrożenia powodowane drganiami mechanicznymi' => array(
            'Zjawisko kawitacji',
            'Niewspółosiowość ruchomych części',
            'Wyposażenie ruchome',
            'Skrobanie powierzchni',
            'Niewyważone części wirujące',
            'Sprzęt wibracyjny',
            'Zużyte części'
        ),
        'Zagrożenia powodowane promieniowaniem' => array(
            'Żródło promieniowania jonizującego',
            'Promieniowanie elektromagnetyczne o niskiej częstotliwości',
            'Promieniowanie optyczne (podczerwone, światła widzialnego i ultrafioletowe) łącznie z promieniowaniem laserowym',
            'Promieniowanie elektromagnetyczne o częstotliwości radiowej'
        ),
        'Zagrożenia powodowane materiałami/substancjami' => array(
            'Aerozole',
            'Czynniki biologiczne i mikrobiologiczne (wirusy lub bakterie)',
            'Materiały palne',
            'Pyły',
            'Materiały wybuchowe',
            'Włókno',
            'Materiały łatwopalne',
            'Płyny',
            'Wyziewy, spaliny, opary',
            'Gazy',
            'Mgła',
            'Utleniacze'
        ),
        'Zagrożenia powodowane nieprzestrzeganiem zasad ergonomii' => array(
            'Dostęp',
            'Konstrukcja lub umiejscowienie wskaźników i monitorów',
            'Konstrukcja, umiejscowienie lub rozpoznawalność urządzeń sterowniczych',
            'Wysiłek',
            'Migotanie światła, oślepianie światłem, cień, efekt stroboskopowy',
            'Oświetlenie miejscowe',
            'Przeciążenie / Niedociążenie psychiczne',
            'Niezdrowa pozycja',
            'Powtarzalność czynności',
            'Widzialność'
        ),
        'Zagrożenia wynikające ze środowiska, w którym maszyna jest użytkowana' => array(
            'Zapylenie i mgła',
            'Zakłócenia elektromagnetyczne',
            'Wyładowania atmosferyczne',
            'Wilgoć',
            'Zanieczyszczenie środowiska',
            'Śnieg',
            'Temperatura',
            'Woda',
            'Wiatr',
            'Brak tlenu'
        )
    );
}

// Wartości DPH - Stopień ewentualnej szkody
function ocena_ryzyka_get_dph_values() {
    return array(
        array('wartosc' => '0.1', 'opis' => 'Zadrapanie / stłuczenie'),
        array('wartosc' => '0.5', 'opis' => 'Skaleczenie / łagodny skutek'),
        array('wartosc' => '1', 'opis' => 'Złamanie – drobne kości lub drobne schorzenie (tymczasowe)'),
        array('wartosc' => '2', 'opis' => 'Złamanie – główne kości lub drobne schorzenie (trwałe)'),
        array('wartosc' => '4', 'opis' => 'Utrata 1 kończyny/oka lub poważne schorzenie (trwałe)'),
        array('wartosc' => '8', 'opis' => 'Utrata 2 kończyn/oka lub poważne schorzenie (trwałe)'),
        array('wartosc' => '15', 'opis' => 'Śmierć')
    );
}

// Wartości LO - Prawdopodobieństwo wystąpienia
function ocena_ryzyka_get_lo_values() {
    return array(
        array('wartosc' => '0.033', 'opis' => 'Prawie niemożliwe', 'szczegoly' => 'Nie może się prawie zdarzyć pod żadnym pozorem'),
        array('wartosc' => '1', 'opis' => 'Bardzo nieprawdopodobne', 'szczegoly' => 'Chociaż do przemyślenia'),
        array('wartosc' => '1.5', 'opis' => 'Mało prawdopodobne', 'szczegoly' => 'Ale może wystąpić'),
        array('wartosc' => '2', 'opis' => 'Możliwe', 'szczegoly' => 'Ale nietypowe'),
        array('wartosc' => '5', 'opis' => 'Bardzo możliwe', 'szczegoly' => 'Może się zdarzyć'),
        array('wartosc' => '8', 'opis' => 'Prawdopodobne', 'szczegoly' => 'Nie będące zaskoczeniem'),
        array('wartosc' => '10', 'opis' => 'Prawie pewne', 'szczegoly' => 'Spodziewane'),
        array('wartosc' => '15', 'opis' => 'Pewne', 'szczegoly' => 'Żadnych wątpliwości')
    );
}

// Wartości FE - Częstotliwość ekspozycji
function ocena_ryzyka_get_fe_values() {
    return array(
        array('wartosc' => '0.5', 'opis' => 'Raz w roku'),
        array('wartosc' => '1', 'opis' => 'Co miesiąc'),
        array('wartosc' => '1.5', 'opis' => 'Co tydzień'),
        array('wartosc' => '2.5', 'opis' => 'Codziennie'),
        array('wartosc' => '4', 'opis' => 'Co godzinę'),
        array('wartosc' => '5', 'opis' => 'Ciągle')
    );
}

// Wartości NP - Liczba osób zagrożonych
function ocena_ryzyka_get_np_values() {
    return array(
        array('wartosc' => '1', 'opis' => '1-2 osoby'),
        array('wartosc' => '2', 'opis' => '3-7 osób'),
        array('wartosc' => '4', 'opis' => '8-15 osób'),
        array('wartosc' => '8', 'opis' => '16-50 osób'),
        array('wartosc' => '12', 'opis' => 'Więcej niż 50 osób')
    );
}

// Poziomy ryzyka na podstawie HRN
function ocena_ryzyka_get_risk_levels() {
    return array(
        array('min' => 0, 'max' => 1, 'nazwa' => 'Ryzyko pomijalne'),
        array('min' => 2, 'max' => 5, 'nazwa' => 'Ryzyko bardzo niskie'),
        array('min' => 6, 'max' => 10, 'nazwa' => 'Ryzyko niskie'),
        array('min' => 11, 'max' => 50, 'nazwa' => 'Ryzyko znaczące'),
        array('min' => 51, 'max' => 100, 'nazwa' => 'Ryzyko wysokie'),
        array('min' => 101, 'max' => 500, 'nazwa' => 'Ryzyko bardzo wysokie'),
        array('min' => 501, 'max' => 1000, 'nazwa' => 'Ryzyko ekstremalne'),
        array('min' => 1001, 'max' => 100000000, 'nazwa' => 'Ryzyko nieakceptowalne')
    );
}

// Funkcja określająca stopień ryzyka na podstawie HRN
function ocena_ryzyka_calculate_risk_level($hrn) {
    $levels = ocena_ryzyka_get_risk_levels();
    
    foreach ($levels as $level) {
        if ($hrn >= $level['min'] && $hrn <= $level['max']) {
            return $level['nazwa'];
        }
    }
    
    return 'Nieznane';
}

// Funkcja obliczająca HRN
function ocena_ryzyka_calculate_hrn($dph, $lo, $fe, $np) {
    return $dph * $lo * $fe * $np;
}

// Funkcja obliczająca % obniżenia ryzyka
function ocena_ryzyka_calculate_risk_reduction($hrn_przed, $hrn_po) {
    if ($hrn_przed == 0) {
        return 0;
    }
    
    $reduction = (($hrn_przed - $hrn_po) / $hrn_przed) * 100;
    return round($reduction, 2);
}

// Rodzaje zagrożeń - główne kategorie w ustalonej kolejności
function ocena_ryzyka_get_rodzaje_zagrozen() {
    return array(
        'Zagrożenia mechaniczne',
        'Zagrożenia elektryczne',
        'Zagrożenia termiczne',
        'Zagrożenia hałasem',
        'Zagrożenia powodowane drganiami mechanicznymi',
        'Zagrożenia powodowane promieniowaniem',
        'Zagrożenia powodowane materiałami/substancjami',
        'Zagrożenia powodowane nieprzestrzeganiem zasad ergonomii',
        'Zagrożenia wynikające ze środowiska, w którym maszyna jest użytkowana',
        'Kombinacja zagrożeń'
    );
}

// Funkcja zwracająca indeks sortowania dla rodzaju zagrożenia
function ocena_ryzyka_get_rodzaj_sort_order($rodzaj) {
    $rodzaje = ocena_ryzyka_get_rodzaje_zagrozen();
    $index = array_search($rodzaj, $rodzaje);
    return $index !== false ? $index : 999;
}