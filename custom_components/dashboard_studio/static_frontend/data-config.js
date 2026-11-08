// CENTRAL FONT REGISTRY
window.BASE_FONTS = [
    "'Inter', sans-serif",
    "'JetBrains Mono', monospace",
    "'Roboto', sans-serif",
    "'Oswald', sans-serif",
    "'Open Sans', sans-serif",
    "'Montserrat', sans-serif",
    "'Lato', sans-serif",
    "'Poppins', sans-serif",
    "'Playpen Sans','Medium 500'"
];

// Temporarily keep this for backward compatibility until editor.js is updated
window.AVAILABLE_FONTS = [...window.BASE_FONTS];

// CENTRAL LOCALIZATION & REGIONAL HELPER
window.DashboardI18n = (function () {
    var PRESETS_STORAGE_KEY = 'ds_custom_locale_presets';

    var BUILTIN_LOCALES = {
        "en": {
                "code": "en",
                "name": "English",
                "units": {
                        "y": "y",
                        "d": "d",
                        "h": "h",
                        "m": "m",
                        "s": "s",
                        "year": "year",
                        "years": "years",
                        "day": "day",
                        "days": "days",
                        "hour": "hour",
                        "hours": "hours",
                        "minute": "minute",
                        "minutes": "minutes",
                        "second": "second",
                        "seconds": "seconds",
                        "and": "and",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday"
                        ],
                        "weekdaysShort": [
                                "Sun",
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat"
                        ],
                        "months": [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December"
                        ],
                        "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                        ],
                        "weekPrefix": "Week",
                        "am": "AM",
                        "pm": "PM"
                }
        },
        "nl": {
                "code": "nl",
                "name": "Nederlands (Dutch)",
                "units": {
                        "y": "j",
                        "d": "d",
                        "h": "u",
                        "m": "m",
                        "s": "s",
                        "year": "jaar",
                        "years": "jaar",
                        "day": "dag",
                        "days": "dagen",
                        "hour": "uur",
                        "hours": "uur",
                        "minute": "minuut",
                        "minutes": "minuten",
                        "second": "seconde",
                        "seconds": "seconden",
                        "and": "en",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "Zondag",
                                "Maandag",
                                "Dinsdag",
                                "Woensdag",
                                "Donderdag",
                                "Vrijdag",
                                "Zaterdag"
                        ],
                        "weekdaysShort": [
                                "Zo",
                                "Ma",
                                "Di",
                                "Wo",
                                "Do",
                                "Vr",
                                "Za"
                        ],
                        "months": [
                                "Januari",
                                "Februari",
                                "Maart",
                                "April",
                                "Mei",
                                "Juni",
                                "Juli",
                                "Augustus",
                                "September",
                                "Oktober",
                                "November",
                                "December"
                        ],
                        "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mrt",
                                "Apr",
                                "Mei",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Okt",
                                "Nov",
                                "Dec"
                        ],
                        "weekPrefix": "Week",
                        "am": "AM",
                        "pm": "PM"
                }
        },
        "de": {
                "code": "de",
                "name": "Deutsch (German)",
                "units": {
                        "y": "j",
                        "d": "T",
                        "h": "Std",
                        "m": "Min",
                        "s": "Sek",
                        "year": "Jahr",
                        "years": "Jahre",
                        "day": "Tag",
                        "days": "Tage",
                        "hour": "Stunde",
                        "hours": "Stunden",
                        "minute": "Minute",
                        "minutes": "Minuten",
                        "second": "Sekunde",
                        "seconds": "Sekunden",
                        "and": "und",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "Sonntag",
                                "Montag",
                                "Dienstag",
                                "Mittwoch",
                                "Donnerstag",
                                "Freitag",
                                "Samstag"
                        ],
                        "weekdaysShort": [
                                "So",
                                "Mo",
                                "Di",
                                "Mi",
                                "Do",
                                "Fr",
                                "Sa"
                        ],
                        "months": [
                                "Januar",
                                "Februar",
                                "März",
                                "April",
                                "Mai",
                                "Juni",
                                "Juli",
                                "August",
                                "September",
                                "Oktober",
                                "November",
                                "Dezember"
                        ],
                        "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mär",
                                "Apr",
                                "Mai",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Okt",
                                "Nov",
                                "Dez"
                        ],
                        "weekPrefix": "KW",
                        "am": "AM",
                        "pm": "PM"
                }
        },
        "fr": {
                "code": "fr",
                "name": "Français (French)",
                "units": {
                        "y": "a",
                        "d": "j",
                        "h": "h",
                        "m": "m",
                        "s": "s",
                        "year": "an",
                        "years": "ans",
                        "day": "jour",
                        "days": "jours",
                        "hour": "heure",
                        "hours": "heures",
                        "minute": "minute",
                        "minutes": "minutes",
                        "second": "seconde",
                        "seconds": "secondes",
                        "and": "et",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "Dimanche",
                                "Lundi",
                                "Mardi",
                                "Mercredi",
                                "Jeudi",
                                "Vendredi",
                                "Samedi"
                        ],
                        "weekdaysShort": [
                                "Dim",
                                "Lun",
                                "Mar",
                                "Mer",
                                "Jeu",
                                "Ven",
                                "Sam"
                        ],
                        "months": [
                                "Janvier",
                                "Février",
                                "Mars",
                                "Avril",
                                "Mai",
                                "Juin",
                                "Juillet",
                                "Août",
                                "Septembre",
                                "Octobre",
                                "Novembre",
                                "Décembre"
                        ],
                        "monthsShort": [
                                "Jan",
                                "Fév",
                                "Mar",
                                "Avr",
                                "Mai",
                                "Juin",
                                "Juil",
                                "Août",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Déc"
                        ],
                        "weekPrefix": "Semaine",
                        "am": "AM",
                        "pm": "PM"
                }
        },
        "es": {
                "code": "es",
                "name": "Español (Spanish)",
                "units": {
                        "y": "a",
                        "d": "d",
                        "h": "h",
                        "m": "m",
                        "s": "s",
                        "year": "año",
                        "years": "años",
                        "day": "día",
                        "days": "días",
                        "hour": "hora",
                        "hours": "horas",
                        "minute": "minuto",
                        "minutes": "minutos",
                        "second": "segundo",
                        "seconds": "segundos",
                        "and": "y",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "Domingo",
                                "Lunes",
                                "Martes",
                                "Miércoles",
                                "Jueves",
                                "Viernes",
                                "Sábado"
                        ],
                        "weekdaysShort": [
                                "Dom",
                                "Lun",
                                "Mar",
                                "Mié",
                                "Jue",
                                "Vie",
                                "Sáb"
                        ],
                        "months": [
                                "Enero",
                                "Febrero",
                                "Marzo",
                                "Abril",
                                "Mayo",
                                "Junio",
                                "Julio",
                                "Agosto",
                                "Septiembre",
                                "Octubre",
                                "Noviembre",
                                "Diciembre"
                        ],
                        "monthsShort": [
                                "Ene",
                                "Feb",
                                "Mar",
                                "Abr",
                                "May",
                                "Jun",
                                "Jul",
                                "Ago",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dic"
                        ],
                        "weekPrefix": "Semana",
                        "am": "AM",
                        "pm": "PM"
                }
        },
        "it": {
                "code": "it",
                "name": "Italiano (Italian)",
                "units": {
                        "y": "a",
                        "d": "g",
                        "h": "h",
                        "m": "m",
                        "s": "s",
                        "year": "anno",
                        "years": "anni",
                        "day": "giorno",
                        "days": "giorni",
                        "hour": "ora",
                        "hours": "ore",
                        "minute": "minuto",
                        "minutes": "minuti",
                        "second": "secondo",
                        "seconds": "secondi",
                        "and": "e",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "Domenica",
                                "Lunedì",
                                "Martedì",
                                "Mercoledì",
                                "Giovedì",
                                "Venerdì",
                                "Sabato"
                        ],
                        "weekdaysShort": [
                                "Dom",
                                "Lun",
                                "Mar",
                                "Mer",
                                "Gio",
                                "Ven",
                                "Sab"
                        ],
                        "months": [
                                "Gennaio",
                                "Febbraio",
                                "Marzo",
                                "Aprile",
                                "Maggio",
                                "Giugno",
                                "Luglio",
                                "Agosto",
                                "Settembre",
                                "Ottobre",
                                "Novembre",
                                "Dicembre"
                        ],
                        "monthsShort": [
                                "Gen",
                                "Feb",
                                "Mar",
                                "Apr",
                                "Mag",
                                "Giu",
                                "Lug",
                                "Ago",
                                "Set",
                                "Ott",
                                "Nov",
                                "Dic"
                        ],
                        "weekPrefix": "Settimana",
                        "am": "AM",
                        "pm": "PM"
                }
        },
        "da": {
                "code": "da",
                "name": "Dansk (Danish)",
                "units": {
                        "y": "år",
                        "d": "d",
                        "h": "t",
                        "m": "m",
                        "s": "s",
                        "year": "år",
                        "years": "år",
                        "day": "dag",
                        "days": "dage",
                        "hour": "time",
                        "hours": "timer",
                        "minute": "minut",
                        "minutes": "minutter",
                        "second": "sekund",
                        "seconds": "sekunder",
                        "and": "og",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "Søndag",
                                "Mandag",
                                "Tirsdag",
                                "Onsdag",
                                "Torsdag",
                                "Fredag",
                                "Lørdag"
                        ],
                        "weekdaysShort": [
                                "Søn",
                                "Man",
                                "Tir",
                                "Ons",
                                "Tor",
                                "Fre",
                                "Lør"
                        ],
                        "months": [
                                "Januar",
                                "Februar",
                                "Marts",
                                "April",
                                "Maj",
                                "Juni",
                                "Juli",
                                "August",
                                "September",
                                "Oktober",
                                "November",
                                "December"
                        ],
                        "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "Maj",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Okt",
                                "Nov",
                                "Dec"
                        ],
                        "weekPrefix": "Uge",
                        "am": "AM",
                        "pm": "PM"
                }
        },
        "sv": {
                "code": "sv",
                "name": "Svenska (Swedish)",
                "units": {
                        "y": "år",
                        "d": "d",
                        "h": "t",
                        "m": "m",
                        "s": "s",
                        "year": "år",
                        "years": "år",
                        "day": "dag",
                        "days": "dagar",
                        "hour": "timme",
                        "hours": "timmar",
                        "minute": "minut",
                        "minutes": "minuter",
                        "second": "sekund",
                        "seconds": "sekunder",
                        "and": "och",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "Söndag",
                                "Måndag",
                                "Tisdag",
                                "Onsdag",
                                "Torsdag",
                                "Fredag",
                                "Lördag"
                        ],
                        "weekdaysShort": [
                                "Sön",
                                "Mån",
                                "Tis",
                                "Ons",
                                "Tor",
                                "Fre",
                                "Lör"
                        ],
                        "months": [
                                "Januari",
                                "Februari",
                                "Mars",
                                "April",
                                "Maj",
                                "Juni",
                                "Juli",
                                "Augusti",
                                "September",
                                "Oktober",
                                "November",
                                "December"
                        ],
                        "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "Maj",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Okt",
                                "Nov",
                                "Dec"
                        ],
                        "weekPrefix": "Vecka",
                        "am": "AM",
                        "pm": "PM"
                }
        },
        "no": {
                "code": "no",
                "name": "Norsk (Norwegian)",
                "units": {
                        "y": "år",
                        "d": "d",
                        "h": "t",
                        "m": "m",
                        "s": "s",
                        "year": "år",
                        "years": "år",
                        "day": "dag",
                        "days": "dager",
                        "hour": "time",
                        "hours": "timer",
                        "minute": "minutt",
                        "minutes": "minutter",
                        "second": "sekund",
                        "seconds": "sekunder",
                        "and": "og",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "Søndag",
                                "Mandag",
                                "Tirsdag",
                                "Onsdag",
                                "Torsdag",
                                "Fredag",
                                "Lørdag"
                        ],
                        "weekdaysShort": [
                                "Søn",
                                "Man",
                                "Tir",
                                "Ons",
                                "Tor",
                                "Fre",
                                "Lør"
                        ],
                        "months": [
                                "Januar",
                                "Februar",
                                "Mars",
                                "April",
                                "Mai",
                                "Juni",
                                "Juli",
                                "August",
                                "September",
                                "Oktober",
                                "November",
                                "Desember"
                        ],
                        "monthsShort": [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "Mai",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Okt",
                                "Nov",
                                "Des"
                        ],
                        "weekPrefix": "Uke",
                        "am": "AM",
                        "pm": "PM"
                }
        },
        "pl": {
                "code": "pl",
                "name": "Polski (Polish)",
                "units": {
                        "y": "r",
                        "d": "d",
                        "h": "godz",
                        "m": "min",
                        "s": "sek",
                        "year": "rok",
                        "years": "lat",
                        "day": "dzień",
                        "days": "dni",
                        "hour": "godzina",
                        "hours": "godzin",
                        "minute": "minuta",
                        "minutes": "minut",
                        "second": "sekunda",
                        "seconds": "sekund",
                        "and": "i",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "Niedziela",
                                "Poniedziałek",
                                "Wtorek",
                                "Środa",
                                "Czwartek",
                                "Piątek",
                                "Sobota"
                        ],
                        "weekdaysShort": [
                                "Nie",
                                "Pon",
                                "Wto",
                                "Śro",
                                "Czw",
                                "Pią",
                                "Sob"
                        ],
                        "months": [
                                "Styczeń",
                                "Luty",
                                "Marzec",
                                "Kwiecień",
                                "Maj",
                                "Czerwiec",
                                "Lipiec",
                                "Sierpień",
                                "Wrzesień",
                                "Październik",
                                "Listopad",
                                "Grudzień"
                        ],
                        "monthsShort": [
                                "Sty",
                                "Lut",
                                "Mar",
                                "Kwi",
                                "Maj",
                                "Cze",
                                "Lip",
                                "Sie",
                                "Wrz",
                                "Paź",
                                "Lis",
                                "Gru"
                        ],
                        "weekPrefix": "Tydzień",
                        "am": "AM",
                        "pm": "PM"
                }
        },
        "ru": {
                "code": "ru",
                "name": "Русский (Russian)",
                "units": {
                        "y": "г",
                        "d": "д",
                        "h": "ч",
                        "m": "м",
                        "s": "с",
                        "year": "год",
                        "years": "лет",
                        "day": "день",
                        "days": "дней",
                        "hour": "час",
                        "hours": "часов",
                        "minute": "минута",
                        "minutes": "минут",
                        "second": "секунда",
                        "seconds": "секунд",
                        "and": "и",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "Воскресенье",
                                "Понедельник",
                                "Вторник",
                                "Среда",
                                "Четверг",
                                "Пятница",
                                "Суббота"
                        ],
                        "weekdaysShort": [
                                "Вс",
                                "Пн",
                                "Вт",
                                "Ср",
                                "Чт",
                                "Пт",
                                "Сб"
                        ],
                        "months": [
                                "Январь",
                                "Февраль",
                                "Март",
                                "Апрель",
                                "Май",
                                "Июнь",
                                "Июль",
                                "Август",
                                "Сентябрь",
                                "Октябрь",
                                "Ноябрь",
                                "Декабрь"
                        ],
                        "monthsShort": [
                                "Янв",
                                "Фев",
                                "Мар",
                                "Апр",
                                "Май",
                                "Июн",
                                "Июл",
                                "Авг",
                                "Сен",
                                "Окт",
                                "Ноя",
                                "Дек"
                        ],
                        "weekPrefix": "Неделя",
                        "am": "AM",
                        "pm": "PM"
                }
        },
        "ko": {
                "code": "ko",
                "name": "한국어 (Korean)",
                "units": {
                        "y": "년",
                        "d": "일",
                        "h": "시간",
                        "m": "분",
                        "s": "초",
                        "year": "년",
                        "years": "년",
                        "day": "일",
                        "days": "일",
                        "hour": "시간",
                        "hours": "시간",
                        "minute": "분",
                        "minutes": "분",
                        "second": "초",
                        "seconds": "초",
                        "and": "",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "일요일",
                                "월요일",
                                "화요일",
                                "수요일",
                                "목요일",
                                "금요일",
                                "토요일"
                        ],
                        "weekdaysShort": [
                                "일",
                                "월",
                                "화",
                                "수",
                                "목",
                                "금",
                                "토"
                        ],
                        "months": [
                                "1월",
                                "2월",
                                "3월",
                                "4월",
                                "5월",
                                "6월",
                                "7월",
                                "8월",
                                "9월",
                                "10월",
                                "11월",
                                "12월"
                        ],
                        "monthsShort": [
                                "1월",
                                "2월",
                                "3월",
                                "4월",
                                "5월",
                                "6월",
                                "7월",
                                "8월",
                                "9월",
                                "10월",
                                "11월",
                                "12월"
                        ],
                        "weekPrefix": "주차",
                        "am": "오전",
                        "pm": "오후"
                }
        },
        "ar": {
                "code": "ar",
                "name": "العربية (Arabic)",
                "units": {
                        "y": "س",
                        "d": "ي",
                        "h": "س",
                        "m": "د",
                        "s": "ث",
                        "year": "سنة",
                        "years": "سنوات",
                        "day": "يوم",
                        "days": "أيام",
                        "hour": "ساعة",
                        "hours": "ساعات",
                        "minute": "دقيقة",
                        "minutes": "دقائق",
                        "second": "ثانية",
                        "seconds": "ثوان",
                        "and": "و",
                        "done": ""
                },
                "calendar": {
                        "weekdays": [
                                "الأحد",
                                "الإثنين",
                                "الثلاثاء",
                                "الأربعاء",
                                "الخميس",
                                "الجمعة",
                                "السبت"
                        ],
                        "weekdaysShort": [
                                "أحد",
                                "إثنين",
                                "ثلاثاء",
                                "أربعاء",
                                "خميس",
                                "جمعة",
                                "سبت"
                        ],
                        "months": [
                                "يناير",
                                "فبراير",
                                "مارس",
                                "أبريل",
                                "مايو",
                                "يونيو",
                                "يوليو",
                                "أغسطس",
                                "سبتمبر",
                                "أكتوبر",
                                "نوفمبر",
                                "ديسمبر"
                        ],
                        "monthsShort": [
                                "يناير",
                                "فبراير",
                                "مارس",
                                "أبريل",
                                "مايو",
                                "يونيو",
                                "يوليو",
                                "أغسطس",
                                "سبتمبر",
                                "أكتوبر",
                                "نوفمبر",
                                "ديسمبر"
                        ],
                        "weekPrefix": "أسبوع",
                        "am": "ص",
                        "pm": "م"
                }
        }
};

    var BUILTIN_ORDER = ['en', 'nl', 'de', 'fr', 'es', 'it', 'da', 'sv', 'no', 'pl', 'ru', 'ko', 'ar'];

    var BCP47_MAP = {
        en: 'en-GB', nl: 'nl-NL', de: 'de-DE', fr: 'fr-FR', es: 'es-ES',
        it: 'it-IT', da: 'da-DK', sv: 'sv-SE', no: 'nb-NO', pl: 'pl-PL',
        ru: 'ru-RU', ko: 'ko-KR', ar: 'ar-SA'
    };

    function normalizeLocaleCode(raw) {
        if (raw === undefined || raw === null) return 'auto';
        var s = String(raw).trim();
        if (!s || s.toLowerCase() === 'auto') return 'auto';
        if (s === 'custom' || s.indexOf('preset:') === 0) return s;
        var lower = s.toLowerCase();
        if (BUILTIN_LOCALES[lower]) return lower;
        var primary = lower.split(/[-_]/)[0];
        if (primary === 'nb' || primary === 'nn') return 'no';
        if (BUILTIN_LOCALES[primary]) return primary;
        return 'en';
    }

    function detectBrowserLocaleCode() {
        try {
            var nav = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'en';
            var norm = normalizeLocaleCode(nav);
            return (norm && norm !== 'auto' && BUILTIN_LOCALES[norm]) ? norm : 'en';
        } catch (e) {
            return 'en';
        }
    }

    function getSavedCustomPresets() {
        try {
            if (typeof localStorage === 'undefined') return {};
            var raw = localStorage.getItem(PRESETS_STORAGE_KEY);
            if (!raw) return {};
            var parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    function saveCustomPresetToStorage(name, dict) {
        if (!name || !dict) return;
        try {
            if (typeof localStorage === 'undefined') return;
            var all = getSavedCustomPresets();
            all[name] = {
                name: name,
                units: Object.assign({}, BUILTIN_LOCALES.en.units, dict.units || {}),
                calendar: Object.assign({}, BUILTIN_LOCALES.en.calendar, dict.calendar || {})
            };
            localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(all));
        } catch (e) { /* ignore */ }
    }

    function cloneDictionary(src) {
        var base = BUILTIN_LOCALES.en;
        var u = Object.assign({}, base.units, (src && src.units) || {});
        var cSrc = (src && src.calendar) || {};
        var c = {
            weekdays: Array.isArray(cSrc.weekdays) && cSrc.weekdays.length === 7 ? cSrc.weekdays.slice() : base.calendar.weekdays.slice(),
            weekdaysShort: Array.isArray(cSrc.weekdaysShort) && cSrc.weekdaysShort.length === 7 ? cSrc.weekdaysShort.slice() : base.calendar.weekdaysShort.slice(),
            months: Array.isArray(cSrc.months) && cSrc.months.length === 12 ? cSrc.months.slice() : base.calendar.months.slice(),
            monthsShort: Array.isArray(cSrc.monthsShort) && cSrc.monthsShort.length === 12 ? cSrc.monthsShort.slice() : base.calendar.monthsShort.slice(),
            weekPrefix: (cSrc.weekPrefix !== undefined && cSrc.weekPrefix !== null) ? String(cSrc.weekPrefix) : base.calendar.weekPrefix,
            am: (cSrc.am !== undefined && cSrc.am !== null) ? String(cSrc.am) : base.calendar.am,
            pm: (cSrc.pm !== undefined && cSrc.pm !== null) ? String(cSrc.pm) : base.calendar.pm
        };
        return {
            code: (src && src.code) || 'custom',
            name: (src && src.name) || 'Custom',
            units: u,
            calendar: c
        };
    }

    function getEffectiveLocaleSetting(overrideLocale) {
        if (overrideLocale !== undefined && overrideLocale !== null && String(overrideLocale).trim() !== '' && String(overrideLocale).trim().toLowerCase() !== 'auto') {
            return normalizeLocaleCode(overrideLocale);
        }
        var masterLoc = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.locale) ? MASTER_SETTINGS.locale : 'auto';
        var norm = normalizeLocaleCode(masterLoc);
        if (norm === 'auto') return detectBrowserLocaleCode();
        return norm;
    }

    function getEffectiveBcp47Tag(overrideLocale) {
        var code = getEffectiveLocaleSetting(overrideLocale);
        if (BCP47_MAP[code]) return BCP47_MAP[code];
        var browserCode = detectBrowserLocaleCode();
        return BCP47_MAP[browserCode] || 'en-GB';
    }

    function getDictionary(overrideLocale) {
        var code = getEffectiveLocaleSetting(overrideLocale);
        if (code === 'custom' || (typeof code === 'string' && code.indexOf('preset:') === 0)) {
            if (typeof code === 'string' && code.indexOf('preset:') === 0) {
                var pName = code.slice(7);
                var presets = getSavedCustomPresets();
                if (presets[pName]) {
                    return cloneDictionary(presets[pName]);
                }
            }
            if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.customLocale && typeof MASTER_SETTINGS.customLocale === 'object') {
                return cloneDictionary(MASTER_SETTINGS.customLocale);
            }
            var fallbackCode = detectBrowserLocaleCode();
            return cloneDictionary(BUILTIN_LOCALES[fallbackCode] || BUILTIN_LOCALES.en);
        }
        return cloneDictionary(BUILTIN_LOCALES[code] || BUILTIN_LOCALES.en);
    }

    function getLanguageSelectOptions(includeInheritForWidget) {
        var opts = [];
        if (includeInheritForWidget) {
            opts.push({ value: 'auto', text: 'Inherit from Dashboard (Default)' });
        } else {
            opts.push({ value: 'auto', text: 'Auto (Browser Default)' });
        }
        for (var i = 0; i < BUILTIN_ORDER.length; i++) {
            var k = BUILTIN_ORDER[i];
            var entry = BUILTIN_LOCALES[k];
            if (entry) {
                opts.push({ value: k, text: entry.name });
            }
        }
        var presets = getSavedCustomPresets();
        var presetNames = Object.keys(presets);
        if (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.customLocale && MASTER_SETTINGS.customLocale.name) {
            var embName = String(MASTER_SETTINGS.customLocale.name).trim();
            if (embName && !presets[embName]) {
                presetNames.push(embName);
            }
        }
        presetNames.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
        for (var p = 0; p < presetNames.length; p++) {
            var pn = presetNames[p];
            opts.push({ value: 'preset:' + pn, text: pn + ' (Custom Preset)' });
        }
        opts.push({ value: 'custom', text: 'Custom...' });
        return opts;
    }

    function getEffectiveTimeFormat() {
        var tf = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.timeFormat) ? String(MASTER_SETTINGS.timeFormat).trim() : 'auto';
        if (tf === '24h' || tf === '12h') return tf;
        try {
            if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
                var ro = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
                if (ro && typeof ro.hour12 === 'boolean') {
                    return ro.hour12 ? '12h' : '24h';
                }
            }
        } catch (e) { /* ignore */ }
        return '24h';
    }

    function getEffectiveIs24Hour(widgetOverride) {
        if (widgetOverride === true) return true;
        if (widgetOverride === false) return false;
        return getEffectiveTimeFormat() !== '12h';
    }

    function getEffectiveDateFormat(overrideFormat) {
        if (overrideFormat && overrideFormat !== 'auto') return String(overrideFormat);
        var df = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.dateFormat) ? String(MASTER_SETTINGS.dateFormat).trim() : 'auto';
        if (df === 'DD-MM-YYYY' || df === 'MM-DD-YYYY' || df === 'YYYY-MM-DD') return df;
        try {
            if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
                var fmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
                if (typeof fmt.formatToParts === 'function') {
                    var parts = fmt.formatToParts(new Date(2026, 10, 25));
                    var order = [];
                    for (var i = 0; i < parts.length; i++) {
                        var t = parts[i].type;
                        if (t === 'year' || t === 'month' || t === 'day') order.push(t);
                    }
                    if (order[0] === 'year') return 'YYYY-MM-DD';
                    if (order[0] === 'month') return 'MM-DD-YYYY';
                    return 'DD-MM-YYYY';
                }
            }
        } catch (e) { /* ignore */ }
        return 'DD-MM-YYYY';
    }

    function getEffectiveFirstDayOfWeek(overrideStart) {
        if (overrideStart === 'monday' || overrideStart === 'sunday') return overrideStart;
        var fd = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.firstDayOfWeek) ? String(MASTER_SETTINGS.firstDayOfWeek).trim().toLowerCase() : 'auto';
        if (fd === 'monday' || fd === 'sunday') return fd;
        try {
            var nav = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || '';
            if (typeof Intl !== 'undefined' && typeof Intl.Locale === 'function' && nav) {
                var loc = new Intl.Locale(nav);
                var wi = loc.weekInfo || (typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : null);
                if (wi && wi.firstDay !== undefined) {
                    return (wi.firstDay === 7 || wi.firstDay === 0) ? 'sunday' : 'monday';
                }
            }
            var low = String(nav).toLowerCase();
            if (low.indexOf('en-us') === 0 || low.indexOf('en-ca') === 0 || low.indexOf('ko') === 0 || low.indexOf('ar') === 0 || low.indexOf('ja') === 0) {
                return 'sunday';
            }
        } catch (e) { /* ignore */ }
        return 'monday';
    }

    function openCustomTranslationDialog() {
        if (typeof document === 'undefined') return;
        var existing = document.getElementById('ds-custom-translation-modal');
        if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }

        var activeDict = getDictionary();
        var curLoc = (typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS && MASTER_SETTINGS.locale) ? String(MASTER_SETTINGS.locale) : 'auto';
        var initialPresetName = '';
        if (curLoc.indexOf('preset:') === 0) {
            initialPresetName = curLoc.slice(7);
        } else if (curLoc === 'custom' && typeof MASTER_SETTINGS !== 'undefined' && MASTER_SETTINGS.customLocale && MASTER_SETTINGS.customLocale.name) {
            initialPresetName = String(MASTER_SETTINGS.customLocale.name);
        }

        var overlay = document.createElement('div');
        overlay.id = 'ds-custom-translation-modal';
        overlay.className = 'ds-dialog-backdrop show';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.zIndex = '10050';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.boxSizing = 'border-box';
        overlay.style.padding = '16px';
        overlay.style.backgroundColor = 'var(--dialog-scrim, rgba(2, 6, 23, 0.75))';
        overlay.style.backdropFilter = 'var(--dialog-scrim-blur, blur(14px) saturate(1.2))';
        overlay.style.webkitBackdropFilter = 'var(--dialog-scrim-blur, blur(14px) saturate(1.2))';

        var dialog = document.createElement('div');
        dialog.className = 'modal-content ds-dialog';
        dialog.style.width = 'min(880px, 95vw)';
        dialog.style.maxHeight = '90vh';
        dialog.style.display = 'flex';
        dialog.style.flexDirection = 'column';

        var header = document.createElement('div');
        header.className = 'modal-header flex items-center justify-between px-5 py-3.5 border-b editor-hairline';
        header.innerHTML = '<h3 class="ds-dialog-title flex items-center gap-2 font-bold text-sm"><i class="ph-bold ph-translate ds-dialog-title-icon text-lg"></i><span>Edit / Customize Translations</span></h3>';
        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'ds-dialog-close';
        closeBtn.title = 'Close';
        closeBtn.innerHTML = '<i class="ph-bold ph-x"></i>';
        function closeModal() {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (typeof document !== 'undefined' && document.removeEventListener) {
                document.removeEventListener('keydown', onKeyDown);
            }
        }
        function onKeyDown(e) {
            if (e.key === 'Escape') closeModal();
        }
        closeBtn.onclick = closeModal;
        header.appendChild(closeBtn);
        dialog.appendChild(header);

        var body = document.createElement('div');
        body.className = 'modal-body ds-trans-body scrollbar-thin';

        var topBar = document.createElement('div');
        topBar.className = 'ds-trans-topbar';

        var presetWrap = document.createElement('div');
        presetWrap.className = 'flex flex-col gap-1';
        var presetLbl = document.createElement('label');
        presetLbl.className = 'control-label';
        presetLbl.textContent = 'Preset Name (optional - saves to Language dropdown)';
        var presetInp = document.createElement('input');
        presetInp.type = 'text';
        presetInp.className = 'control-input w-full';
        presetInp.placeholder = 'e.g. Nederlands (Kort) or Frisian';
        presetInp.value = initialPresetName;
        presetWrap.appendChild(presetLbl);
        presetWrap.appendChild(presetInp);

        var baseWrap = document.createElement('div');
        baseWrap.className = 'flex flex-col gap-1';
        var baseLbl = document.createElement('label');
        baseLbl.className = 'control-label';
        baseLbl.textContent = 'Load Template from Language';
        var baseSel = document.createElement('select');
        baseSel.className = 'control-input w-full';
        var placeholderOpt = document.createElement('option');
        placeholderOpt.value = '';
        placeholderOpt.textContent = '-- Keep Current Values --';
        baseSel.appendChild(placeholderOpt);
        for (var bi = 0; bi < BUILTIN_ORDER.length; bi++) {
            var bk = BUILTIN_ORDER[bi];
            var bo = document.createElement('option');
            bo.value = bk;
            bo.textContent = BUILTIN_LOCALES[bk].name;
            baseSel.appendChild(bo);
        }
        baseWrap.appendChild(baseLbl);
        baseWrap.appendChild(baseSel);

        topBar.appendChild(presetWrap);
        topBar.appendChild(baseWrap);
        body.appendChild(topBar);

        // Segmented Tab Controls
        var segmented = document.createElement('div');
        segmented.className = 'ds-trans-segmented';

        var tabDefs = [
            { id: 'countdown', label: 'Countdown & Duration', icon: 'ph-timer' },
            { id: 'weekdays', label: 'Weekdays (7)', icon: 'ph-calendar' },
            { id: 'months', label: 'Months (12)', icon: 'ph-calendar-blank' }
        ];
        var tabButtons = {};
        var tabPanes = {};

        tabDefs.forEach(function (td, idx) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ds-trans-tab-btn' + (idx === 0 ? ' is-active' : '');
            btn.innerHTML = '<i class="ph-bold ' + td.icon + '"></i><span>' + td.label + '</span>';
            btn.onclick = function () {
                tabDefs.forEach(function (other) {
                    tabButtons[other.id].classList.remove('is-active');
                    tabPanes[other.id].classList.add('is-hidden');
                });
                btn.classList.add('is-active');
                tabPanes[td.id].classList.remove('is-hidden');
            };
            tabButtons[td.id] = btn;
            segmented.appendChild(btn);

            var pane = document.createElement('div');
            pane.className = 'ds-trans-pane' + (idx === 0 ? '' : ' is-hidden');
            tabPanes[td.id] = pane;
        });
        body.appendChild(segmented);

        var unitInputs = {};
        var calSingleInputs = {};
        var calArrayInputs = {
            weekdays: [],
            weekdaysShort: [],
            months: [],
            monthsShort: []
        };

        // --- TAB 1: Countdown & Duration Units ---
        var paneCountdown = tabPanes.countdown;

        var uTitle = document.createElement('div');
        uTitle.className = 'ds-trans-section-title';
        uTitle.textContent = 'Duration Units Matrix';
        paneCountdown.appendChild(uTitle);

        var uTable = document.createElement('div');
        uTable.className = 'ds-trans-table';

        var uHeader = document.createElement('div');
        uHeader.className = 'ds-trans-row ds-trans-unit-row ds-trans-unit-header';
        uHeader.innerHTML = '<div>Unit</div><div>Short (Abbr)</div><div>Singular (1)</div><div>Plural (2+)</div>';
        uTable.appendChild(uHeader);

        var unitSpecs = [
            { name: 'Years', shortKey: 'y', singKey: 'year', plurKey: 'years', shortHolder: 'y', singHolder: 'year', plurHolder: 'years' },
            { name: 'Days', shortKey: 'd', singKey: 'day', plurKey: 'days', shortHolder: 'd', singHolder: 'day', plurHolder: 'days' },
            { name: 'Hours', shortKey: 'h', singKey: 'hour', plurKey: 'hours', shortHolder: 'h', singHolder: 'hour', plurHolder: 'hours' },
            { name: 'Minutes', shortKey: 'm', singKey: 'minute', plurKey: 'minutes', shortHolder: 'm', singHolder: 'minute', plurHolder: 'minutes' },
            { name: 'Seconds', shortKey: 's', singKey: 'second', plurKey: 'seconds', shortHolder: 's', singHolder: 'second', plurHolder: 'seconds' }
        ];

        unitSpecs.forEach(function (spec) {
            var row = document.createElement('div');
            row.className = 'ds-trans-row ds-trans-unit-row';

            var lbl = document.createElement('div');
            lbl.className = 'ds-trans-row-label';
            lbl.textContent = spec.name;

            var sInp = document.createElement('input');
            sInp.type = 'text';
            sInp.className = 'control-input';
            sInp.placeholder = spec.shortHolder;
            sInp.value = activeDict.units[spec.shortKey] != null ? String(activeDict.units[spec.shortKey]) : '';
            unitInputs[spec.shortKey] = sInp;

            var singInp = document.createElement('input');
            singInp.type = 'text';
            singInp.className = 'control-input';
            singInp.placeholder = spec.singHolder;
            singInp.value = activeDict.units[spec.singKey] != null ? String(activeDict.units[spec.singKey]) : '';
            unitInputs[spec.singKey] = singInp;

            var plurInp = document.createElement('input');
            plurInp.type = 'text';
            plurInp.className = 'control-input';
            plurInp.placeholder = spec.plurHolder;
            plurInp.value = activeDict.units[spec.plurKey] != null ? String(activeDict.units[spec.plurKey]) : '';
            unitInputs[spec.plurKey] = plurInp;

            row.appendChild(lbl);
            row.appendChild(sInp);
            row.appendChild(singInp);
            row.appendChild(plurInp);
            uTable.appendChild(row);
        });
        paneCountdown.appendChild(uTable);

        // Conjunction & Elapsed text
        var conjTitle = document.createElement('div');
        conjTitle.className = 'ds-trans-section-title mt-2';
        conjTitle.textContent = 'Sentence Conjunction & Elapsed Text';
        paneCountdown.appendChild(conjTitle);

        var conjGrid = document.createElement('div');
        conjGrid.className = 'grid grid-cols-2 gap-3';

        var andWrap = document.createElement('div');
        andWrap.className = 'flex flex-col gap-1';
        var andLbl = document.createElement('label');
        andLbl.className = 'control-label';
        andLbl.textContent = 'Conjunction (and - e.g. 2 hours and 5 minutes)';
        var andInp = document.createElement('input');
        andInp.type = 'text';
        andInp.className = 'control-input w-full';
        andInp.placeholder = 'and';
        andInp.value = activeDict.units.and != null ? String(activeDict.units.and) : '';
        unitInputs.and = andInp;
        andWrap.appendChild(andLbl);
        andWrap.appendChild(andInp);

        var doneWrap = document.createElement('div');
        doneWrap.className = 'flex flex-col gap-1';
        var doneLbl = document.createElement('label');
        doneLbl.className = 'control-label';
        doneLbl.textContent = 'Elapsed Ending Text (e.g. Done, Klaar, or blank)';
        var doneInp = document.createElement('input');
        doneInp.type = 'text';
        doneInp.className = 'control-input w-full';
        doneInp.placeholder = 'e.g. Done (or leave empty for 0:00)';
        doneInp.value = activeDict.units.done != null ? String(activeDict.units.done) : '';
        unitInputs.done = doneInp;
        doneWrap.appendChild(doneLbl);
        doneWrap.appendChild(doneInp);

        conjGrid.appendChild(andWrap);
        conjGrid.appendChild(doneWrap);
        paneCountdown.appendChild(conjGrid);

        // Clock & Calendar Indicators
        var clkTitle = document.createElement('div');
        clkTitle.className = 'ds-trans-section-title mt-2';
        clkTitle.textContent = 'Clock & Calendar Indicators';
        paneCountdown.appendChild(clkTitle);

        var miscGrid = document.createElement('div');
        miscGrid.className = 'grid grid-cols-3 gap-3';
        [
            { key: 'weekPrefix', label: 'Week Prefix (e.g. W)', placeholder: 'W' },
            { key: 'am', label: 'AM Label', placeholder: 'AM' },
            { key: 'pm', label: 'PM Label', placeholder: 'PM' }
        ].forEach(function (mr) {
            var cell = document.createElement('div');
            cell.className = 'flex flex-col gap-1';
            var l = document.createElement('label');
            l.className = 'control-label';
            l.textContent = mr.label;
            var inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'control-input w-full';
            inp.placeholder = mr.placeholder;
            inp.value = activeDict.calendar[mr.key] != null ? String(activeDict.calendar[mr.key]) : '';
            calSingleInputs[mr.key] = inp;
            cell.appendChild(l);
            cell.appendChild(inp);
            miscGrid.appendChild(cell);
        });
        paneCountdown.appendChild(miscGrid);

        // --- TAB 2: Weekdays ---
        var paneWeekdays = tabPanes.weekdays;

        var wdTitle = document.createElement('div');
        wdTitle.className = 'ds-trans-section-title';
        wdTitle.textContent = 'Days of the Week (Monday to Sunday)';
        paneWeekdays.appendChild(wdTitle);

        var wdTable = document.createElement('div');
        wdTable.className = 'ds-trans-table';

        var wdHeader = document.createElement('div');
        wdHeader.className = 'ds-trans-row ds-trans-day-row ds-trans-unit-header';
        wdHeader.innerHTML = '<div>Reference</div><div>Full Name</div><div>Short Abbreviation</div>';
        wdTable.appendChild(wdHeader);

        var enWeekdays = BUILTIN_LOCALES.en.calendar.weekdays;
        var wdDisplayOrder = [1, 2, 3, 4, 5, 6, 0];
        wdDisplayOrder.forEach(function (dayIdx) {
            var row = document.createElement('div');
            row.className = 'ds-trans-row ds-trans-day-row';

            var lbl = document.createElement('div');
            lbl.className = 'ds-trans-row-label';
            lbl.textContent = enWeekdays[dayIdx];

            var fullInp = document.createElement('input');
            fullInp.type = 'text';
            fullInp.className = 'control-input';
            fullInp.placeholder = enWeekdays[dayIdx];
            fullInp.value = activeDict.calendar.weekdays[dayIdx] || '';

            var shortInp = document.createElement('input');
            shortInp.type = 'text';
            shortInp.className = 'control-input';
            shortInp.placeholder = BUILTIN_LOCALES.en.calendar.weekdaysShort[dayIdx];
            shortInp.value = activeDict.calendar.weekdaysShort[dayIdx] || '';

            calArrayInputs.weekdays[dayIdx] = fullInp;
            calArrayInputs.weekdaysShort[dayIdx] = shortInp;

            row.appendChild(lbl);
            row.appendChild(fullInp);
            row.appendChild(shortInp);
            wdTable.appendChild(row);
        });
        paneWeekdays.appendChild(wdTable);

        // --- TAB 3: Months ---
        var paneMonths = tabPanes.months;

        var moTitle = document.createElement('div');
        moTitle.className = 'ds-trans-section-title';
        moTitle.textContent = 'Months of the Year (January to December)';
        paneMonths.appendChild(moTitle);

        var moGrid = document.createElement('div');
        moGrid.className = 'ds-trans-month-grid';

        var leftMoCol = document.createElement('div');
        leftMoCol.className = 'ds-trans-table';
        var rightMoCol = document.createElement('div');
        rightMoCol.className = 'ds-trans-table';

        var moHeaderLeft = document.createElement('div');
        moHeaderLeft.className = 'ds-trans-row ds-trans-month-row ds-trans-unit-header';
        moHeaderLeft.innerHTML = '<div>Month</div><div>Full Name</div><div>Short</div>';
        leftMoCol.appendChild(moHeaderLeft);

        var moHeaderRight = document.createElement('div');
        moHeaderRight.className = 'ds-trans-row ds-trans-month-row ds-trans-unit-header';
        moHeaderRight.innerHTML = '<div>Month</div><div>Full Name</div><div>Short</div>';
        rightMoCol.appendChild(moHeaderRight);

        var enMonths = BUILTIN_LOCALES.en.calendar.months;
        var enMonthsShort = BUILTIN_LOCALES.en.calendar.monthsShort;

        for (var mIdx = 0; mIdx < 12; mIdx++) {
            var mRow = document.createElement('div');
            mRow.className = 'ds-trans-row ds-trans-month-row';

            var mLbl = document.createElement('div');
            mLbl.className = 'ds-trans-row-label';
            mLbl.textContent = enMonthsShort[mIdx];

            var mFullInp = document.createElement('input');
            mFullInp.type = 'text';
            mFullInp.className = 'control-input';
            mFullInp.placeholder = enMonths[mIdx];
            mFullInp.value = activeDict.calendar.months[mIdx] || '';

            var mShortInp = document.createElement('input');
            mShortInp.type = 'text';
            mShortInp.className = 'control-input';
            mShortInp.placeholder = enMonthsShort[mIdx];
            mShortInp.value = activeDict.calendar.monthsShort[mIdx] || '';

            calArrayInputs.months[mIdx] = mFullInp;
            calArrayInputs.monthsShort[mIdx] = mShortInp;

            mRow.appendChild(mLbl);
            mRow.appendChild(mFullInp);
            mRow.appendChild(mShortInp);

            if (mIdx < 6) {
                leftMoCol.appendChild(mRow);
            } else {
                rightMoCol.appendChild(mRow);
            }
        }

        moGrid.appendChild(leftMoCol);
        moGrid.appendChild(rightMoCol);
        paneMonths.appendChild(moGrid);

        body.appendChild(paneCountdown);
        body.appendChild(paneWeekdays);
        body.appendChild(paneMonths);
        dialog.appendChild(body);

        function populateInputsFromDict(dict) {
            var d = cloneDictionary(dict);
            Object.keys(unitInputs).forEach(function (k) {
                unitInputs[k].value = d.units[k] != null ? String(d.units[k]) : '';
            });
            Object.keys(calSingleInputs).forEach(function (k) {
                calSingleInputs[k].value = d.calendar[k] != null ? String(d.calendar[k]) : '';
            });
            for (var i = 0; i < 7; i++) {
                if (calArrayInputs.weekdays[i]) calArrayInputs.weekdays[i].value = d.calendar.weekdays[i] || '';
                if (calArrayInputs.weekdaysShort[i]) calArrayInputs.weekdaysShort[i].value = d.calendar.weekdaysShort[i] || '';
            }
            for (var m = 0; m < 12; m++) {
                if (calArrayInputs.months[m]) calArrayInputs.months[m].value = d.calendar.months[m] || '';
                if (calArrayInputs.monthsShort[m]) calArrayInputs.monthsShort[m].value = d.calendar.monthsShort[m] || '';
            }
        }

        function collectDictFromInputs() {
            var u = {};
            Object.keys(unitInputs).forEach(function (k) {
                if (k === 'done') {
                    u[k] = unitInputs[k].value.trim();
                } else {
                    u[k] = unitInputs[k].value.trim() || BUILTIN_LOCALES.en.units[k];
                }
            });
            var wFull = [];
            var wShort = [];
            for (var i = 0; i < 7; i++) {
                wFull.push((calArrayInputs.weekdays[i] && calArrayInputs.weekdays[i].value.trim()) || BUILTIN_LOCALES.en.calendar.weekdays[i]);
                wShort.push((calArrayInputs.weekdaysShort[i] && calArrayInputs.weekdaysShort[i].value.trim()) || BUILTIN_LOCALES.en.calendar.weekdaysShort[i]);
            }
            var mFull = [];
            var mShort = [];
            for (var m = 0; m < 12; m++) {
                mFull.push((calArrayInputs.months[m] && calArrayInputs.months[m].value.trim()) || BUILTIN_LOCALES.en.calendar.months[m]);
                mShort.push((calArrayInputs.monthsShort[m] && calArrayInputs.monthsShort[m].value.trim()) || BUILTIN_LOCALES.en.calendar.monthsShort[m]);
            }
            var pName = presetInp.value.trim();
            return {
                code: 'custom',
                name: pName || 'Custom',
                units: u,
                calendar: {
                    weekdays: wFull,
                    weekdaysShort: wShort,
                    months: mFull,
                    monthsShort: mShort,
                    weekPrefix: calSingleInputs.weekPrefix ? calSingleInputs.weekPrefix.value : 'W',
                    am: (calSingleInputs.am && calSingleInputs.am.value.trim()) || 'AM',
                    pm: (calSingleInputs.pm && calSingleInputs.pm.value.trim()) || 'PM'
                }
            };
        }

        baseSel.onchange = function () {
            var code = baseSel.value;
            if (code && BUILTIN_LOCALES[code]) {
                populateInputsFromDict(BUILTIN_LOCALES[code]);
            }
        };

        var footer = document.createElement('div');
        footer.className = 'modal-footer ds-dialog-footer flex items-center justify-between px-5 py-3.5 border-t editor-hairline';

        var ioGroup = document.createElement('div');
        ioGroup.className = 'flex items-center gap-2';

        var exportBtn = document.createElement('button');
        exportBtn.type = 'button';
        exportBtn.className = 'btn-tool ds-dialog-button';
        exportBtn.innerHTML = '<i class="ph-bold ph-download-simple"></i><span>Export JSON</span>';
        exportBtn.onclick = function () {
            var dict = collectDictFromInputs();
            var safeName = (dict.name || 'custom-locale').toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
            var blob = new Blob([JSON.stringify(dict, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'locale-' + safeName + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        var importBtn = document.createElement('button');
        importBtn.type = 'button';
        importBtn.className = 'btn-tool ds-dialog-button';
        importBtn.innerHTML = '<i class="ph-bold ph-folder-open"></i><span>Import JSON</span>';
        importBtn.onclick = function () {
            var fileInp = document.createElement('input');
            fileInp.type = 'file';
            fileInp.accept = '.json,application/json';
            fileInp.onchange = function (ev) {
                var f = ev.target.files && ev.target.files[0];
                if (!f) return;
                var reader = new FileReader();
                reader.onload = function () {
                    try {
                        var parsed = JSON.parse(String(reader.result || '{}'));
                        if (!parsed || typeof parsed !== 'object' || (!parsed.units && !parsed.calendar)) {
                            if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                                void CustomDialog.alert('Invalid translation JSON file.', 'Import Error');
                            }
                            return;
                        }
                        if (parsed.name && typeof parsed.name === 'string') {
                            presetInp.value = parsed.name;
                        }
                        populateInputsFromDict(parsed);
                    } catch (err) {
                        if (typeof CustomDialog !== 'undefined' && CustomDialog.alert) {
                            void CustomDialog.alert('Could not parse JSON file: ' + err.message, 'Import Error');
                        }
                    }
                };
                reader.readAsText(f);
            };
            fileInp.click();
        };

        ioGroup.appendChild(exportBtn);
        ioGroup.appendChild(importBtn);

        var actionGroup = document.createElement('div');
        actionGroup.className = 'flex items-center gap-2';

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-tool ds-dialog-button';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = closeModal;

        var saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn-tool ds-dialog-button primary';
        saveBtn.innerHTML = '<i class="ph-bold ph-check"></i><span>Save & Apply</span>';
        saveBtn.onclick = function () {
            var dict = collectDictFromInputs();
            var pName = presetInp.value.trim();
            var nextLocaleVal = 'custom';
            if (pName) {
                saveCustomPresetToStorage(pName, dict);
                nextLocaleVal = 'preset:' + pName;
            }
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.updateGlobal === 'function') {
                Dashboard.updateGlobal({
                    locale: nextLocaleVal,
                    customLocale: dict
                }, false);
            } else if (typeof MASTER_SETTINGS !== 'undefined') {
                MASTER_SETTINGS.locale = nextLocaleVal;
                MASTER_SETTINGS.customLocale = dict;
            }
            if (typeof Editor !== 'undefined' && Editor.currentId === 'GLOBAL_SETTINGS' && typeof Editor.renderGlobalEditor === 'function') {
                Editor.renderGlobalEditor();
            }
            closeModal();
        };

        actionGroup.appendChild(cancelBtn);
        actionGroup.appendChild(saveBtn);

        footer.appendChild(ioGroup);
        footer.appendChild(actionGroup);
        dialog.appendChild(footer);

        overlay.appendChild(dialog);
        overlay.addEventListener('click', function (ev) {
            if (ev.target === overlay) {
                closeModal();
            }
        });
        if (typeof document !== 'undefined' && document.addEventListener) {
            document.addEventListener('keydown', onKeyDown);
        }
        document.body.appendChild(overlay);
    }

    return {
        BUILTIN_LOCALES: BUILTIN_LOCALES,
        BUILTIN_ORDER: BUILTIN_ORDER,
        normalizeLocaleCode: normalizeLocaleCode,
        detectBrowserLocaleCode: detectBrowserLocaleCode,
        getEffectiveLocaleSetting: getEffectiveLocaleSetting,
        getEffectiveBcp47Tag: getEffectiveBcp47Tag,
        getDictionary: getDictionary,
        getLanguageSelectOptions: getLanguageSelectOptions,
        getEffectiveTimeFormat: getEffectiveTimeFormat,
        getEffectiveIs24Hour: getEffectiveIs24Hour,
        getEffectiveDateFormat: getEffectiveDateFormat,
        getEffectiveFirstDayOfWeek: getEffectiveFirstDayOfWeek,
        getSavedCustomPresets: getSavedCustomPresets,
        saveCustomPresetToStorage: saveCustomPresetToStorage,
        openCustomTranslationDialog: openCustomTranslationDialog
    };
})();

// MASTER SETTINGS - CORE CONFIGURATION
const MASTER_SETTINGS = {
    // --- Data Connection ---
    dataDriver: "homey",
    driverSettings: {},

    /** Editor inspector complexity: `basic` | `advanced` (persisted under environment). */
    editorMode: 'advanced',
    /** Whether descriptive flyout tooltips show on setting hover in the editor. */
    editorTooltips: true,
    /**
     * Edit-mode view scale in percent (20-200). Saved with the dashboard.
     * Not a live setting: changing it does not mark the file unsaved, and it cannot be bound.
     */
    editorZoom: 100,
    /** Editor layout preference: icon Quick Toolbar (nested under environment on save). */
    quickToolbar: { visibility: 'auto', enabled: true, mode: 'docked', x: 0, y: 0, columns: 1, rows: 0 },

    // --- Regional & Localization ---
    locale: 'auto',
    timeFormat: 'auto',
    dateFormat: 'auto',
    firstDayOfWeek: 'auto',
    customLocale: null,

    // --- Canvas & Grid ---
    canvasBg: "@background",
    canvasBgOpacity: 100,
    canvasBgEnd: "@backgroundAccent",
    canvasBgEndOpacity: 100,
    canvasBgType: "radial",
    canvasBgAngle: 0,
    canvasBgOverlay: false,
    canvasImage: "",
    canvasBgSize: "cover",
    preloadImagesOnAllPages: false,

    canvasPreset: "1180,820",
    canvasWidth: 1180,
    canvasHeight: 820,

    layoutMode: 'fixed',
    layoutScaleKeepAspect: true,
    layoutResponsiveColumnCount: 6,
    layoutResponsiveReduceColumnsToFit: false,
    layoutResponsiveMinSize: 150,
    layoutResponsiveMaxSize: 0,
    layoutResponsiveGap: 10,
    layoutResponsiveAlign: 'center',
    layoutResponsiveMinWidgetHeight: 120,
    layoutResponsivePagePaddingLeft: 20,
    layoutResponsivePagePaddingRight: 20,
    layoutResponsivePagePaddingTop: 20,
    layoutResponsivePagePaddingBottom: 20,

    gridSize: 10,
    showGrid: true,
    /** Edit-mode canvas labels: "hide" | "always" | "hover" (default). */
    widgetLabelMode: 'hover',
    snapToGrid: true,
    hideScrollbars: false,

    // --- Page Management ---
    currentPage: 1,
    /** When set, runtime publishes the active page number to this topic on load, reconnect, and page changes. */
    currentPageOutputTopic: '',
    /** When true, open inactivityReturnPage on load, and return after inactivityTimeoutSeconds idle (0 = no return). A URL page= query wins on load. */
    inactivityPageEnabled: false,
    inactivityReturnPage: 1,
    inactivityTimeoutSeconds: 60,
    gestureTouchOnly: true,
    swipeLeftEnabled: false,
    swipeLeftAction: 'next_page',
    swipeLeftPage: 1,
    swipeLeftTopic: '',
    swipeLeftPayload: '',
    swipeRightEnabled: false,
    swipeRightAction: 'prev_page',
    swipeRightPage: 1,
    swipeRightTopic: '',
    swipeRightPayload: '',
    swipeUpEnabled: false,
    swipeUpAction: 'topic',
    swipeUpPage: 1,
    swipeUpTopic: '',
    swipeUpPayload: '',
    swipeDownEnabled: false,
    swipeDownAction: 'topic',
    swipeDownPage: 1,
    swipeDownTopic: '',
    swipeDownPayload: '',
    swipeIgnorePages: '',
    swipeWrapAround: false,
    /** Active dashboard theme key ('default_dark', preset key, or 'user:name'). */
    theme: 'default_dark',
    /** Seconds to press a Switch / Button before Hold to Activate actions run. */
    holdToActivateDuration: 1.5,
    /** Dashboard Audio: topic → audio URL rows (Homey /audio/… or absolute URL). */
    audioTopicMap: [],

    /** Dialog Box master chrome (nested under environment.dialogBox on save). Inherited radius / border width / opacity stay empty so Reset follows Container Style. */
    dialogBoxMessage: 'Are you sure?',
    dialogBoxConfirmLabel: 'Yes',
    dialogBoxDismissLabel: 'No',
    dialogBoxButtonColor: '@accent',
    dialogBoxShowButtonIcons: false,
    dialogBoxShowDialogIcon: true,
    dialogBoxAutoButtonSize: true,
    dialogBoxButtonWidth: 120,
    dialogBoxButtonHeight: 40,
    dialogBoxBackgroundColor: '@surface',
    dialogBoxBorderColor: '@borderAccent',
    dialogBoxAutoDialogSize: true,
    dialogBoxDialogWidth: 360,
    dialogBoxDialogHeight: 180,
    dialogBoxCenterDialog: true,
    dialogBoxDialogX: 0,
    dialogBoxDialogY: 0,
    dialogBoxModalMode: true,
    dialogBoxIconConfirmSource: 'phosphor',
    dialogBoxIconConfirmBuiltin: 'ph-check',
    dialogBoxIconConfirmWeight: 'bold',
    dialogBoxIconConfirmCustomUrl: '',
    dialogBoxIconConfirmTintImage: false,
    dialogBoxIconConfirmColor: '@onAccent',
    dialogBoxIconConfirmAccentColor: '@iconAccent',
    dialogBoxIconConfirmSize: 18,
    dialogBoxIconDismissSource: 'phosphor',
    dialogBoxIconDismissBuiltin: 'ph-x',
    dialogBoxIconDismissWeight: 'bold',
    dialogBoxIconDismissCustomUrl: '',
    dialogBoxIconDismissTintImage: false,
    dialogBoxIconDismissColor: '@onAccent',
    dialogBoxIconDismissAccentColor: '@iconAccent',
    dialogBoxIconDismissSize: 18,
    dialogBoxIconDialogSize: 50,

    // --- Global Container Style ---
    defaultWidth: 260,
    defaultHeight: 300,
    defaultPadding: 12,

    bgVisible: true,
    bgColStart: "@surface",
    bgOpacityStart: 80,
    bgColEnd: "@surfaceAlt",
    bgOpacityEnd: 80,
    bgAngle: 145,
    bgBlur: 0,

    glowEnabled: true,
    glowColor: "@glow",
    glowRadius: 34,
    glowOpacity: 26,

    borderColor: "@borderAccent",
    defaultBorderWidth: 1,
    defaultBorderOpacity: 100,
    defaultCornerRadius: 12,

    innerGlow: 0,
    innerGlowColor: "@borderAccent",
    innerGlowOpacity: 100,

    // --- Global Typography ---
    customFonts: [],
    fontFamily: "'Inter', sans-serif",
    defaultLabelCase: "uppercase",
    defaultLabelBold: false,
    defaultTextAlign: "center",
    defaultColVal: "@text",
    defaultColLabel: "@textMuted",
    defaultDeactivatedColor: "@controlOff",
    defaultDeactivatedColorAccent: "@textMuted",
    defaultLabelLineHeight: 1.5,
    defaultTextVerticalAlign: "middle",

    defaultFsGeneral: 24,
    defaultFsVal: 48,
    defaultFsUnit: 20,
    defaultFsLabel: 12,

    // --- Switch / Button Defaults ---
    switchColOn: "@glow",
    switchColOff: "@accentOff",
    switchColHover: "@accent",
    switchColThumb: "@thumb",
    switchColLabel: "@textMuted",
    switchButtonOutsideDefaultFs: 12,
    switchButtonOutsideDefaultAlign: "center",
    switchButtonOutsideDefaultCase: "uppercase",
    switchButtonOutsideDefaultBold: false,
    switchButtonOutsideDefaultItalic: false,
    switchButtonOutsideDefaultCol: "@text",
    switchButtonOutsideDefaultColOff: "@textMuted",
    switchButtonOutsideDefaultOpacity: 100,
    switchButtonOutsideDefaultOffX: 0,
    switchButtonOutsideDefaultOffY: 0,
    switchButtonInsideDefaultFs: 12,
    switchButtonInsideDefaultAlign: "center",
    switchButtonInsideDefaultCase: "capitalize",
    switchButtonInsideDefaultBold: false,
    switchButtonInsideDefaultItalic: false,
    switchButtonInsideDefaultCol: "@onAccent",
    switchButtonInsideDefaultColOff: "@thumb",
    switchButtonInsideDefaultOpacity: 100,
    switchButtonInsideDefaultOffX: 0,
    switchButtonInsideDefaultOffY: 0,
    switchIconColOn: "@onAccent",
    switchIconColOff: "@icon",
    switchIconColHover: "@text",

    defaultSwitchMode: "toggle",
    defaultSwitchStyle: "switch",
    defaultSwitchAlign: "center",
    defaultSwitchLabelPos: "top",
    defaultSwitchLabelHint: "truncated",
    defaultSwitchBevel: false,
    defaultSwitchScale: 1.0,
    switchCornerRadius: 12,
    switchButtonContentInset: 10,
    defaultSwitchIconSize: 24,
    defaultSwitchIconOffX: 0,
    defaultSwitchIconOffY: 0,
    defaultSwitchShowIcon: true,
    defaultSwitchIconOnFilled: true,
    defaultSwitchIconOffFilled: true,
    defaultSwitchIconOn: "ph-check-fat",

    switchGlow: true,
    switchGlowColor: "@glow",
    switchGlowRadius: 40,
    switchOutlineWidth: 0,
    switchOutlineColor: "@borderAccent",
    switchBackgroundOpacity: 100,
    switchOutlineOpacity: 100,
    switchButtonBlur: 0,
    switchButtonInnerGlow: 0,
    switchButtonInnerGlowColor: "@borderAccent",
    switchButtonInnerGlowOpacity: 100,
    switchThumbOutlineWidth: 0,
    switchThumbOutlineColor: "@accent",
    switchThumbOutlineOpacity: 100,
    switchThumbInnerGlow: 0,
    switchThumbInnerGlowColor: "@accent",
    switchThumbInnerGlowOpacity: 100,

    // --- Menu Defaults ---
    menuItemSpacing: 4,
    menuItemRadius: 8,
    menuIconColOn: "@onAccent",
    menuIconColOff: "@icon",
    menuIconAccentOn: "@iconAccent",
    menuIconAccentOff: "@iconAccent",
    menuIconSize: 24,
    menuItemBgOn: "@glow",
    menuItemBgOnOpacity: 100,
    menuItemBgOff: "@accentOff",
    // Off items default to the Accent Off token (same off color as Switch and Light
    // Grid). Opacity factory is 100 so it shows without a second step; the
    // transparent keyword still hides the background at any opacity.
    menuItemBgOffOpacity: 100,
    menuItemBgHover: "@accent",
    menuItemBgHoverOpacity: 10,
    menuItemOutlineWidth: 0,
    menuItemOutlineColor: "@borderAccent",
    menuItemOutlineOpacity: 100,
    menuItemBlur: 0,
    menuItemInnerGlow: 0,
    menuItemInnerGlowColor: "@borderAccent",
    menuItemInnerGlowOpacity: 100,
    menuSpacerStyle: "line",
    menuSpacerAmount: 5,
    menuSpacerColor: "@border",
    menuItemColOff: "@textMuted",
    menuDefaultItemFs: 12,
    menuDefaultItemAlign: "left",
    menuDefaultItemCase: "none",
    menuDefaultItemBold: false,
    menuDefaultItemItalic: false,
    menuDefaultItemCol: "@surfaceAlt",
    menuDefaultItemColOff: "@textMuted",
    menuDefaultItemOpacity: 100,
    menuDefaultItemOffX: 0,
    menuDefaultItemOffY: 0,
    menuDefaultLabelHint: "truncated",

    // --- Label Defaults ---
    labelDefaultWAuto: true,
    labelDefaultHAuto: true,
    labelDefaultFont: "",
    labelDefaultFs: 12,
    labelDefaultAlign: "left",
    labelDefaultCase: "none",
    labelDefaultBold: false,
    labelDefaultItalic: false,
    labelDefaultCol: "@onSurface",
    labelDefaultOpacity: 100,
    labelDefaultOffX: 0,
    labelDefaultOffY: 0,

    // --- Text widget (Markdown) master defaults ---
    textMdTextWrap: true,
    textMdLinkTarget: "markdown",
    textMdAutoFitText: false,
    textMdOverflowScroll: false,
    textMdParaBlockSpace: 8,
    textMdH1BlockSpace: 8,
    textMdH2BlockSpace: 8,
    textMdH3BlockSpace: 8,
    textMdThBlockSpace: 8,
    textMdTdBlockSpace: 0,
    textMdBlockTypographyBlockSpace: 8,
    textMdBlockTypographyLineHeight: 1.35,
    textMdSyncTableColumnWidths: false,
    textMdEqualTableColumnWidths: false,
    textMdTableColumnWidthPx: 0,
    textMdTableStyle: "minimal",
    textMdCalendarWeekStart: "monday",
    textMdTableBorderRadius: 5,
    textMdTableCellPadding: 10,
    textMdTableBorderColor: "@border",
    textMdTableBorderOpacity: 100,
    textMdSeparatorColor: "@border",
    textMdSeparatorOpacity: 100,
    textMdTableHeaderBg: "@accentSoft",
    textMdTableHeaderBgOpacity: 100,
    textMdTableHeaderAccentBg: "@accent",
    textMdTableHeaderAccentBgOpacity: 100,
    textMdTableRowBg: "@surfaceAlt",
    textMdTableRowBgOpacity: 40,
    textMdTableRowAltBg: "@surface",
    textMdTableRowAltBgOpacity: 40,
    textMdHrColor: "@border",
    textMdHrOpacity: 100,
    textMdIconColor: "@icon",
    textMdIconOpacity: 100,
    textMdIconWeight: "regular",
    textMdIconAccentColor: "@iconAccent",
    textMdIconAccentOpacity: 100,
    textMdBlock1Color: "@markerTint1",
    textMdBlock2Color: "@markerTint2",
    textMdBlock3Color: "@markerTint3",
    textMdBlock4Color: "@markerTint4",

    defaultTextContentAnimationOnLiveTopics: false,

    textMdParaFs: 12,
    textMdParaCol: "@textMuted",
    textMdParaAlign: "left",
    textMdParaCase: "none",
    textMdParaBold: false,
    textMdParaItalic: false,
    textMdParaOpacity: 100,
    textMdParaOffX: 0,
    textMdParaOffY: 0,

    textMdBlockTypographyFs: 12,
    textMdBlockTypographyCol: "@text",
    textMdBlockTypographyAlign: "left",
    textMdBlockTypographyCase: "none",
    textMdBlockTypographyBold: false,
    textMdBlockTypographyItalic: false,
    textMdBlockTypographyOpacity: 100,
    textMdBlockTypographyOffX: 0,
    textMdBlockTypographyOffY: 0,

    textMdH1Fs: 24,
    textMdH1Col: "@text",
    textMdH1Align: "left",
    textMdH1Case: "none",
    textMdH1Bold: true,
    textMdH1Italic: false,
    textMdH1Opacity: 100,
    textMdH1OffX: 0,
    textMdH1OffY: 0,

    textMdH2Fs: 18,
    textMdH2Col: "@text",
    textMdH2Align: "left",
    textMdH2Case: "none",
    textMdH2Bold: true,
    textMdH2Italic: false,
    textMdH2Opacity: 100,
    textMdH2OffX: 0,
    textMdH2OffY: 0,

    textMdH3Fs: 14,
    textMdH3Col: "@text",
    textMdH3Align: "left",
    textMdH3Case: "none",
    textMdH3Bold: true,
    textMdH3Italic: false,
    textMdH3Opacity: 100,
    textMdH3OffX: 0,
    textMdH3OffY: 0,

    textMdThFs: 12,
    textMdThCol: "@accentSoft",
    textMdThColFilled: "@onAccent",
    textMdThAlign: "table_defined",
    textMdThCase: "uppercase",
    textMdThBold: true,
    textMdThItalic: false,
    textMdThOpacity: 100,
    textMdThOffX: 0,
    textMdThOffY: 0,

    textMdTdFs: 12,
    textMdTdCol: "@text",
    textMdTdAlign: "table_defined",
    textMdTdCase: "none",
    textMdTdBold: false,
    textMdTdItalic: false,
    textMdTdOpacity: 100,
    textMdTdOffX: 0,
    textMdTdOffY: 0,

    textMdCodeFs: 12,
    textMdCodeCol: "@thumb",
    textMdCodeBg: "@accentOff",
    textMdCodeAlign: "left",
    textMdCodeCase: "none",
    textMdCodeBold: false,
    textMdCodeItalic: false,
    textMdCodeOpacity: 100,
    textMdCodeOffX: 0,
    textMdCodeOffY: 0,
    textMdCodeBlockSpace: 8,
    textMdCodeLineHeight: 1.35,

    // --- Track Defaults (Gauge/Slider) ---
    defaultGaugeTrackOutlineWidth: 0,
    defaultSliderTrackOutlineWidth: 0,
    defaultGaugeTrackOutlineColor: "@accent",
    defaultSliderTrackOutlineColor: "@accent",
    defaultGaugeTrackOpacity: 100,
    defaultSliderTrackOpacity: 100,
    defaultGaugeTrackOutlineOpacity: 100,
    defaultSliderTrackOutlineOpacity: 100,
    defaultGaugeTrackBlur: 0,
    defaultSliderTrackBlur: 0,
    defaultGaugeTrackInnerGlow: 0,
    defaultSliderTrackInnerGlow: 0,
    defaultGaugeTrackInnerGlowColor: "@accent",
    defaultSliderTrackInnerGlowColor: "@accent",
    defaultGaugeTrackInnerGlowOpacity: 100,
    defaultSliderTrackInnerGlowOpacity: 100,
    defaultGaugeBarOpacity: 100,
    defaultGaugeBarOutlineWidth: 0,
    defaultGaugeBarOutlineColor: "@thumb",
    defaultGaugeBarOutlineOpacity: 100,
    defaultGaugeBarInnerGlow: 0,
    defaultGaugeBarInnerGlowColor: "@thumb",
    defaultGaugeBarInnerGlowOpacity: 100,
    defaultSliderFillOpacity: 100,
    defaultSliderFillOutlineWidth: 0,
    defaultSliderFillOutlineColor: "@thumb",
    defaultSliderFillOutlineOpacity: 100,
    defaultSliderFillInnerGlow: 0,
    defaultSliderFillInnerGlowColor: "@thumb",
    defaultSliderFillInnerGlowOpacity: 100,
    defaultSliderThumbOutlineWidth: 0,
    defaultSliderThumbOutlineColor: "@accent",
    defaultSliderThumbOutlineOpacity: 100,
    defaultSliderThumbInnerGlow: 0,
    defaultSliderThumbInnerGlowColor: "@accent",
    defaultSliderThumbInnerGlowOpacity: 100,

    // --- Gauge Defaults (Extended) ---
    gaugeCol0: "@accent",
    gaugeCol100: "@accentSecondary",
    gaugeColTrack: "@border",
    gaugeColVal: "@text",
    gaugeColUnit: "@textMuted",
    gaugeColIcon: "@icon",
    gaugeBarGlow: true,
    defaultGaugeBarThick: 12,
    defaultGaugeTrackThick: 16,
    defaultGaugeRoundGap: -25,
    defaultGaugeHorizontalGap: 8,
    defaultGaugeSizeOffset: 0,
    defaultGaugeType: "round",
    defaultGaugeRoundLayout: "bottom",
    defaultGaugeHorizontalLayout: "right",
    defaultGaugeAbbreviateLargeValues: false,
    defaultGaugeKeepTrailingZeros: false,
    defaultGaugeCustomDisplayRange: false,
    defaultGaugeDisplayMin: 0,
    defaultGaugeDisplayMax: 100,
    defaultGaugeDisplayDecimalPlaces: 1,
    defaultGaugeDisplayKeepTrailingZeros: false,
    defaultGaugeSolidBarColor: false,
    defaultGaugeBoldVal: true,
    defaultGaugeValueFont: "",
    defaultGaugeShowIcon: true,
    defaultGaugeIconSource: "phosphor",
    defaultGaugeIconOn: "ph-thermometer-simple",
    defaultGaugeIconWeight: "fill",
    defaultGaugeIconCustomUrl: "",
    defaultGaugeIconTintImage: false,
    defaultGaugeIconSize: 80,
    defaultGaugeIconOffX: 0,
    defaultGaugeIconOffY: 0,
    defaultGaugeCaptionFs: 12,
    defaultGaugeCaptionCol: "@textMuted",
    defaultGaugeCaptionAlignRound: "center",
    defaultGaugeCaptionAlignHoriz: "left",
    defaultGaugeCaptionCase: "uppercase",
    defaultGaugeCaptionBold: false,
    defaultGaugeCaptionItalic: false,
    defaultGaugeCaptionOpacity: 100,
    defaultGaugeCaptionOffX: 0,
    defaultGaugeCaptionOffY: 0,
    defaultGaugeValueFs: 48,
    defaultGaugeValueCol: "@text",
    defaultGaugeValueBold: true,
    defaultGaugeValueItalic: false,
    defaultGaugeValueOpacity: 100,
    defaultGaugeValueOffX: 0,
    defaultGaugeValueOffY: 0,
    defaultGaugeUnitFs: 20,
    defaultGaugeUnitCol: "@textMuted",
    defaultGaugeUnitBold: false,
    defaultGaugeUnitItalic: false,
    defaultGaugeUnitOpacity: 100,
    defaultGaugeAxisFs: 11,
    defaultGaugeAxisCol: "@textMuted",
    defaultGaugeAxisBold: false,
    defaultGaugeAxisItalic: false,
    defaultGaugeAxisOpacity: 100,

    // --- Battery Defaults (Extended) ---
    battColGood: "@success",
    battColLow: "@danger",
    battColBorder: "@controlOff",
    battColEmpty: "@borderAccent",
    defaultBatteryVertical: false,
    defaultBatterySegments: 0,
    defaultBatteryLowThresh: 20,

    // --- Slider Defaults (Extended) ---
    sliderColTrack: "@border",
    sliderColFill: "@accent",
    sliderColThumb: "@thumb",
    sliderColVal: "@text",
    defaultSliderVertical: false,
    defaultSliderCustomDisplayRange: false,
    defaultSliderDisplayMin: 0,
    defaultSliderDisplayMax: 100,
    defaultSliderDisplayDecimalPlaces: 1,
    defaultSliderDisplayKeepTrailingZeros: false,
    defaultSliderValueLocation: "middle",
    defaultSliderLabelLocation: "top",
    defaultSliderUnitFs: 20,
    defaultSliderUnitCol: "@textMuted",
    defaultSliderUnitBold: false,
    defaultSliderUnitItalic: false,
    defaultSliderUnitOpacity: 100,

    // --- Icon Defaults (Extended) ---
    iconActive: "@danger",
    iconInactive: "@icon",
    defaultIconBlink: false,
    defaultIconGlowOnActive: true,
    defaultIconWidgetSource: "phosphor",
    defaultIconWidgetBuiltin: "ph-warning",
    defaultIconWidgetWeight: "fill",
    defaultIconWidgetCustomUrl: "",
    defaultIconWidgetTintImage: false,
    defaultIconWidgetAccentColor: "@iconAccent",
    defaultIconWidgetActiveSource: "phosphor",
    defaultIconWidgetActiveBuiltin: "",
    defaultIconWidgetActiveWeight: "fill",
    defaultIconWidgetActiveCustomUrl: "",
    defaultIconWidgetActiveTintImage: false,
    defaultIconWidgetActiveAccentColor: "@iconAccent",

    // --- Icon widget caption typography master defaults (keep in sync with IconWidget.globalSchema) ---
    defaultIconCaptionFont: null,
    defaultIconCaptionFs: null,
    defaultIconCaptionCol: null,
    defaultIconCaptionAlign: null,
    defaultIconCaptionCase: null,
    defaultIconCaptionBold: null,
    defaultIconCaptionOffX: null,
    defaultIconCaptionOffY: null,

    // --- List Defaults ---
    defaultListShowIcons: true,
    defaultListShowTimestamp: false,
    defaultListMaxLines: 10,
    defaultListRawMode: false,

    defaultListIconSize: 20,
    defaultListIconColor: "@icon",
    defaultListIconGap: 12,

    defaultListTextColor: "@onSurface",
    defaultListFontSize: 14,
    defaultListGap: 4,
    defaultListTextWrap: false,
    defaultListLineHeight: 1.5,
    defaultListCase: "none",
    defaultListFont: "'Inter', sans-serif",
    defaultListFontBold: false,

    // --- List Timestamp Defaults ---
    defaultListTimeSize: 12,
    defaultListTimeColor: "@warning",
    defaultListTimeFormat: "HH:mm",
    defaultListTime24h: true,
    defaultListDateFormat: "none",

    // --- Light Grid Defaults ---
    defaultLightGridPresets: [
        { state: "ON", brightness: 255, color_mode: "color_temp", color_temp: 153 },
        { state: "ON", brightness: 255, color_mode: "color_temp", color_temp: 250 },
        { state: "ON", brightness: 255, color_mode: "color_temp", color_temp: 350 },
        { state: "ON", brightness: 255, color_mode: "color_temp", color_temp: 500 },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 0, s: 100 } },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 30, s: 100 } },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 60, s: 100 } },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 90, s: 100 } },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 120, s: 100 } },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 150, s: 100 } },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 180, s: 100 } },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 210, s: 100 } },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 240, s: 100 } },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 270, s: 100 } },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 300, s: 100 } },
        { state: "ON", brightness: 255, color_mode: "hs", color: { h: 330, s: 100 } }
    ],
    lgPresetCols: 4,
    lgPresetRows: 4,
    lgPresetGap: 8,
    lgPresetIndicators: true,
    lgCols: 1,
    lgItemHeight: 60,
    lgItemWidth: 0,
    lgItemSpacing: 8,

    lgAutoDeselect: false,
    lgDeselectTime: 10,
    lgUseLightColor: true,

    lgIconSize: 24,
    lgIconColOff: "@icon",
    lgIconColOn: "@glow",
    lgIconColorize: false,

    lgColTileBg: "@surface",
    lgColTileHover: "@accentSoft",
    lgTileBackgroundOpacity: 100,
    lgTileOutlineWidth: 0,
    lgTileOutlineColor: "@borderAccent",
    lgTileOutlineOpacity: 100,
    lgTileBlur: 0,
    lgTileInnerGlow: 0,
    lgTileInnerGlowColor: "@borderAccent",
    lgTileInnerGlowOpacity: 100,
    lgColTileText: "@onSurface",
    lgColToggleOn: "@glow",
    lgColToggleOff: "@accentOff",

    lgTileFont: "'Inter', sans-serif",
    lgTileFontBold: true,

    lgPopoverW: 260,
    lgPopoverH: 360,

    // --- Light Grid typography master defaults (keep in sync with LightGridWidget.globalSchema) ---
    defaultLgWidgetLabelFont: null,
    defaultLgWidgetLabelFs: null,
    defaultLgWidgetLabelCol: null,
    defaultLgWidgetLabelAlign: null,
    defaultLgWidgetLabelCase: null,
    defaultLgWidgetLabelBold: null,
    defaultLgWidgetLabelOffX: null,
    defaultLgWidgetLabelOffY: null,

    defaultLgLightNameFont: null,
    defaultLgLightNameFs: null,
    defaultLgLightNameCol: null,
    defaultLgLightNameAlign: null,
    defaultLgLightNameCase: null,
    defaultLgLightNameBold: null,

    defaultLgPanelTitleFont: null,
    defaultLgPanelTitleFs: null,
    defaultLgPanelTitleCol: null,
    defaultLgPanelTitleAlign: null,
    defaultLgPanelTitleCase: null,
    defaultLgPanelTitleBold: null,
    defaultLgPanelTitleOffX: null,
    defaultLgPanelTitleOffY: null,

    // --- Graph Defaults (keep in sync with GraphWidget.globalSettings) ---
    defaultGraphType: "line",
    defaultGraphSmoothingAmount: 0,
    defaultGraphLineW: 2,
    defaultGraphBarDirection: "vertical",
    defaultGraphBarGroupMode: "side_by_side",
    defaultGraphBarStackGapStep: 0,
    defaultGraphBarGap: 2,
    defaultGraphPositiveColorOpacity: 100,
    defaultGraphNegativeColorOpacity: 100,
    defaultGraphPositiveStartOpacity: 40,
    defaultGraphPositiveEndOpacity: 0,
    defaultGraphNegativeStartOpacity: 40,
    defaultGraphNegativeEndOpacity: 0,
    defaultGraphBufferMode: "points",
    defaultGraphDurationPreset: "24h",
    defaultGraphDurationCustomValue: 1,
    defaultGraphDurationCustomUnit: "hours",
    defaultGraphFixedTimeWindow: false,
    defaultGraphTimelineAdvance: 'data',
    defaultGraphReverseDirection: false,
    defaultGraphLineGaps: "break",
    defaultGraphAxisXRotation: 0,
    defaultGraphAxisYRotation: 0,
    defaultGraphAxisXLabel: "",
    defaultGraphAxisYLabel: "",
    defaultGraphAxisXLabelFont: "'Inter', sans-serif",
    defaultGraphAxisXLabelFontSize: 10,
    defaultGraphAxisXLabelFontColor: "@iconMuted",
    defaultGraphAxisXLabelFontBold: false,
    defaultGraphAxisXLabelFontOpacity: 100,
    defaultGraphAxisXLabelRotation: 0,
    defaultGraphAxisYLabelRotation: -90,
    defaultGraphShowLegend: true,
    defaultGraphLegendPosition: "right",
    defaultGraphLegendLayout: "column",
    defaultGraphLegendSwatch: "square",
    defaultGraphLegendAutoSize: true,
    defaultGraphLegendWidth: 160,
    defaultGraphLegendHeight: 72,
    defaultGraphLegendItemFont: "'Inter', sans-serif",
    defaultGraphLegendItemFs: 12,
    defaultGraphLegendItemCol: "@text",
    defaultGraphLegendItemBold: false,
    defaultGraphLegendItemItalic: false,
    defaultGraphLegendItemAlign: "left",
    defaultGraphLegendItemCase: "none",
    defaultGraphLegendItemOpacity: 100,
    defaultGraphBarRadius: 4,
    graphBarOutlineColor: "@surfaceAlt",
    graphBarOutlineWidth: 0,
    graphNegBarOutlineColor: "@surfaceAlt",
    defaultGraphPointShow: false,
    defaultGraphPointSize: 4,
    defaultGraphAnimation: "none",
    defaultGraphAnimDuration: 2,
    defaultGraphAnimStreamDuration: 0.6,
    defaultGraphAnimShimmer: true,
    defaultGraphAnimStaggerBars: true,
    defaultGraphDynamicFloor: true,
    defaultGraphDynamicCeiling: true,
    defaultGraphAutoMin: true,
    defaultGraphAutoMax: true,
    defaultGraphUseBaseline: false,
    defaultGraphBaselineVal: 0,
    defaultGraphNegMode: 'show_neg',
    defaultGraphDecimals: 0,
    defaultGraphRoundingMode: 'smart',
    defaultGraphAbbreviateLargeValues: true,
    defaultGraphHeadroom: 0,
    defaultGraphTextFont: "'Inter', sans-serif",
    defaultGraphTextSize: 14,
    defaultGraphTextColor: "@onSurface",
    defaultGraphTextFontBold: false,
    defaultGraphMaxPoints: 20,
    defaultGraphScrollDir: 'left',
    defaultGraphOffX: 0,
    defaultGraphOffY: 0,
    defaultGraphShowAxisX: false,
    defaultGraphTimeFormat: "Datapoints",
    defaultGraphTime24h: true,
    defaultGraphDateFormat: "DD-MM-YYYY",
    defaultGraphConvertToLocalTime: true,
    defaultGraphTimeOffset: 0,
    defaultGraphTimezoneConvert: false,
    defaultGraphShowAxisY: false,
    defaultGraphAxisResX: 5,
    defaultGraphAxisResY: 4,
    defaultGraphAutoAxisResX: false,
    defaultGraphAutoAxisResY: false,
    defaultGraphAxisWidthY: 0,
    defaultGraphAxisWidthX: 0,
    defaultGraphAxisOffX: 10,
    defaultGraphAxisOffY: 10,
    defaultGraphAxisXFont: "'Inter', sans-serif",
    defaultGraphAxisXFontSize: 10,
    defaultGraphAxisXFontColor: "@iconMuted",
    defaultGraphAxisXFontBold: false,
    defaultGraphAxisXFontOpacity: 100,
    defaultGraphShowPointValues: false,
    defaultGraphPointValuesHoverOnly: false,
    defaultGraphPointValuesDistribution: 'timeHighLow',
    defaultGraphPointValuesTimeWidth: 48,
    defaultGraphPointValuesStep: 1,
    defaultGraphAutoPointValuesInterval: false,
    defaultGraphPointValuesDecimals: 0,
    defaultGraphPointValuesAbbreviate: true,
    defaultGraphPointValFont: "'Inter', sans-serif",
    defaultGraphPointValFs: 10,
    defaultGraphPointValCol: "@accent",
    defaultGraphPointValBold: false,
    defaultGraphPointValItalic: false,
    defaultGraphPointValAlign: "left",
    defaultGraphPointValCase: "none",
    defaultGraphPointValOpacity: 100,
    defaultGraphPointValOffX: 6,
    defaultGraphPointValOffY: -6,
    defaultGraphPointValInvertYNegative: true,
    defaultGraphPointValBarFont: "'Inter', sans-serif",
    defaultGraphPointValBarFs: 10,
    defaultGraphPointValBarCol: "@accent",
    defaultGraphPointValBarBold: false,
    defaultGraphPointValBarItalic: false,
    defaultGraphPointValBarAlign: "center",
    defaultGraphPointValBarCase: "none",
    defaultGraphPointValBarOpacity: 100,
    defaultGraphPointValBarOffX: 0,
    defaultGraphPointValBarOffY: -6,
    defaultGraphPointValBarInvertYNegative: true,
    defaultGraphGridHTopShow: false,
    defaultGraphGridHTopCol: "@accentSoft",
    defaultGraphGridHTopW: 2,
    defaultGraphGridHTopOp: 80,
    defaultGraphGridHBotShow: false,
    defaultGraphGridHBotCol: "@accentSoft",
    defaultGraphGridHBotW: 2,
    defaultGraphGridHBotOp: 80,
    defaultGraphGridHBaseShow: false,
    defaultGraphGridHBaseCol: "@warning",
    defaultGraphGridHBaseW: 2,
    defaultGraphGridHBaseOp: 80,
    defaultGraphGridHInnerShow: false,
    defaultGraphGridHInnerCol: "@borderAccent",
    defaultGraphGridHInnerW: 1,
    defaultGraphGridHInnerOp: 40,
    defaultGraphGridHInnerSpace: 0,
    defaultGraphGridVShow: false,
    defaultGraphGridVCol: "@borderAccent",
    defaultGraphGridVW: 1,
    defaultGraphGridVOp: 40,
    defaultGraphGridVSpace: 0,
    defaultGraphGridVLeftShow: false,
    defaultGraphGridVLeftCol: "@accentSoft",
    defaultGraphGridVLeftW: 2,
    defaultGraphGridVLeftOp: 80,
    defaultGraphGridVRightShow: false,
    defaultGraphGridVRightCol: "@accentSoft",
    defaultGraphGridVRightW: 2,
    defaultGraphGridVRightOp: 80,
    defaultGraphShowTickX: false,
    defaultGraphShowTickY: false,
    defaultGraphTickXSpacing: 0,
    defaultGraphTickYCount: 0,
    defaultGraphTickXSize: 5,
    defaultGraphTickXThickness: 2,
    defaultGraphTickXColor: "@accentSoft",
    defaultGraphTickXOffset: 0,
    defaultGraphTickYSize: 5,
    defaultGraphTickYThickness: 2,
    defaultGraphTickYColor: "@accentSoft",
    defaultGraphTickYOffset: 0,

    // --- Clock colors (keep in sync with ClockWidget.globalSettings) ---
    clockColTicks: "@controlOff",
    clockColNumbers: "@textMuted",
    clockColHour: "@text",
    clockColMin: "@onSurface",
    clockColSec: "@glow",
    defaultClockNumColor: "@textMuted",
    defaultClockFlipUpperColor: "@accentSoft",
    defaultClockFlipLowerColor: "@accent",
    defaultClockAnalogNumCol: "@textMuted",
    defaultClockFlipNumCol: "@onAccent",
    defaultClockFlipLabelCol: "@textMuted",
    defaultClockFlipAmPmCol: "@onAccent",
    defaultClockTimeDateCol: "@textMuted",

    // --- Arrow colors ---
    arrowColMain: "@accentSecondary",
    arrowColFlow: "@success",
    arrowColFlowRev: "@danger",
    arrowColGlow: "@accentSoft",

    // --- Edit Box colors ---
    editboxBgColor: "@surface",
    editboxBorderColor: "@accentSecondary",
    editboxFocusColor: "@link",
    editboxTextColor: "@text",
    editboxPlaceholderColor: "@placeholder",
    // --- Widget master values (keep in sync with each widget globalSettings) ---
    // Arrow
    arrowFlowWidth: 0,
    arrowGradientWidth: 100,
    arrowThick: 10,
    arrowHeadSz: 30,
    arrowLineRadius: 5,
    arrowHeadRound: 4,
    arrowAnimEnabled: true,
    arrowAnimSpeed: 2,
    arrowAnimReverse: false,
    arrowGlowWidth: 15,
    arrowGlowOpacity: 50,
    // Battery
    defaultBatteryOutlineWidth: 4,
    defaultBatteryInnerPad: 4,
    defaultBatteryTerminalSz: 10,
    // Clock
    defaultClockDisplayMode: "analog",
    defaultClockUse12Hour: false,
    defaultClockUseSystemTime: true,
    defaultClockOffset: 0,
    defaultClockTimezone: "UTC",
    defaultClockShowTicks: true,
    defaultClockShowNumbers: true,
    defaultClockSweep: "smooth",
    defaultClockNumDist: 70,
    defaultClockNumSize: 20,
    defaultClockCapSize: 12,
    defaultClockNumFont: "'Inter', sans-serif",
    defaultClockNumFontBold: true,
    defaultClockBackCapSize: 18,
    clockHandWidthHour: 8,
    clockHandLengthHour: 55,
    clockHandWidthMin: 5,
    clockHandLengthMin: 85,
    clockHandWidthSec: 2,
    clockHandLengthSec: 90,
    defaultClockFlipShowLabels: true,
    defaultClockFlipShowSeconds: true,
    defaultClockFlipSeparator: 6,
    defaultClockFlipCardRadius: 12,
    defaultClockFlipLabelHour: "",
    defaultClockFlipLabelMinute: "",
    defaultClockFlipLabelSecond: "",
    defaultClockTextShowTime: true,
    defaultClockTextSeparator: ":",
    defaultClockTextBlinkSeparator: false,
    defaultClockTextShowHour: true,
    defaultClockTextShowMinute: true,
    defaultClockTextShowSecond: true,
    defaultClockTextShowDate: true,
    defaultClockTextDateSeparator: "",
    defaultClockTextDateSeg0: "weekday",
    defaultClockTextDateSeg1: "day",
    defaultClockTextDateSeg2: "monthName",
    defaultClockTextDateSeg3: "yearLong",
    defaultClockTextDateSeg4: "none",
    defaultClockTextDateLinebreak: true,
    defaultClockTextWeekPrefix: "",
    defaultClockAnalogNumFont: "'Inter', sans-serif",
    defaultClockAnalogNumFs: 20,
    defaultClockAnalogNumCase: "none",
    defaultClockAnalogNumBold: true,
    defaultClockAnalogNumItalic: false,
    defaultClockFlipNumFont: "",
    defaultClockFlipNumFs: 28,
    defaultClockFlipNumBold: true,
    defaultClockFlipNumItalic: false,
    defaultClockFlipLabelFont: "",
    defaultClockFlipLabelFs: 10,
    defaultClockFlipLabelCase: "none",
    defaultClockFlipLabelBold: false,
    defaultClockFlipLabelItalic: false,
    defaultClockFlipLabelOffX: 0,
    defaultClockFlipLabelOffY: 0,
    defaultClockFlipAmPmFont: "",
    defaultClockFlipAmPmFs: 12,
    defaultClockFlipAmPmAlign: "center",
    defaultClockFlipAmPmCase: "none",
    defaultClockFlipAmPmBold: true,
    defaultClockFlipAmPmItalic: false,
    defaultClockFlipAmPmOffX: 0,
    defaultClockFlipAmPmOffY: 0,
    defaultClockTimeDateFont: "",
    defaultClockTimeDateFs: 16,
    defaultClockTimeDateAlign: "center",
    defaultClockTimeDateCase: "none",
    defaultClockTimeDateBold: false,
    defaultClockTimeDateItalic: false,
    // Edit Box
    editboxBgOpacity: 100,
    editboxBorderWidth: 1,
    editboxBorderRadius: 8,
    editboxEnableFocusColor: true,
    editboxTextPadding: 8,
    // Icon
    defaultIconSize: 80,
    defaultIconAnimSpeed: 1,
    // Image
    defaultImageFit: true,
    defaultImageProp: true,
    defaultImageScale: 100,
    defaultImageOpacity: 100,
    defaultImageFallbackUrl: "images/brokenlink.png",
    // Slider
    defaultSliderAllowDecimals: false,
    defaultSliderStepSize: 0.1,
    defaultSliderTrackThick: 36,
    defaultSliderFillThick: 24,
    defaultSliderThumbSz: 29,
    defaultSliderThumbShadow: true,
    defaultSliderShowVal: true,
};

const MASTER_SCHEMA = [
    {
        id: 'm_conn', title: 'Platform Connection', icon: 'ph-plugs-connected', editorTier: 'both',
        fields: [
            { key: 'dataDriver', type: 'select', label: 'Platform', options: ['homey', 'homeassistant', 'nodered', 'simulation', 'mqtt'], cols: 12, editorTier: 'both' }
        ]
    },
    {
        id: 'm_editor', title: 'Editor Environment', icon: 'ph-gear', editorTier: 'both',
        fields: [
            {
                key: 'editorMode', type: 'select', label: 'Editor Mode', cols: 6, editorTier: 'both',
                options: [
                    { value: 'basic', text: 'Basic' },
                    { value: 'advanced', text: 'Advanced' }
                ],
                hint: 'Basic hides advanced inspector sections and styling controls. Advanced shows the full editor.'
            },
            {
                key: 'editorTooltips', type: 'checkbox', label: 'Editor Setting Tooltips', cols: 6, default: true, editorTier: 'both',
                hint: 'Shows descriptive flyout tooltips and help links when hovering above settings labels in the editor.'
            },
            {
                key: 'quickToolbarVisibility', type: 'select', label: 'Quick Toolbar',
                cols: 12, default: 'auto', editorTier: 'both', noBind: true,
                options: [
                    { value: 'auto', text: 'Auto Hide When Docked' },
                    { value: 'always', text: 'Always Visible' },
                    { value: 'never', text: 'Never Visible' }
                ],
                hint: 'Auto Hide When Docked shows the icon toolbar when Universal Actions starts to scroll out of view. Always Visible keeps it on the editor edge. Never Visible hides it until you change this setting. You can still pop it out as a floating palette.'
            },
            { key: 'gridSize', type: 'number', label: 'Grid Size (px)', cols: 4, editorTier: 'both' },
            { key: 'snapToGrid', type: 'checkbox', label: 'Snap to Grid', cols: 4, editorTier: 'both',
                dynamicLabel: function (values) {
                    return values.layoutMode === 'responsive' ? 'Snap to Grid in groups' : 'Snap to Grid';
                },
                dependsOn: ['layoutMode'] },
            { key: 'showGrid', type: 'checkbox', label: 'Show Grid Overlay', cols: 4, editorTier: 'both',
                dynamicLabel: function (values) {
                    return values.layoutMode === 'responsive' ? 'Show Grid Overlay in groups' : 'Show Grid Overlay';
                },
                dependsOn: ['layoutMode'] },
            {
                key: 'widgetLabelMode',
                type: 'select',
                label: 'Widget Labels In Editor Canvas',
                cols: 12,
                editorTier: 'both',
                options: [
                    { value: 'hide', text: 'Hide' },
                    { value: 'always', text: 'Always' },
                    { value: 'hover', text: 'Hover' }
                ],
                hint: 'In edit mode: when to show the type and name label on each widget. Hover shows the label only when the pointer is over the widget.'
            }
        ]
    },
    {
        id: 'm_canvas', title: 'Dashboard Environment', icon: 'ph-desktop', editorTier: 'both',
        fields: [
            { key: 'currentPage', type: 'number', label: 'Active Page', cols: 6, editorTier: 'both' },
            { key: 'currentPageOutputTopic', type: 'topic', label: 'Current Page Output Topic', cols: 6, editorTier: 'both' },
            {
                key: 'theme',
                type: 'select',
                label: 'Theme',
                cols: 12,
                default: 'default_dark',
                editorTier: 'both',
                dynamicOptions: function (values, isGlobal) {
                    if (typeof Dashboard !== 'undefined' && typeof Dashboard.getThemeSelectOptions === 'function') {
                        return Dashboard.getThemeSelectOptions();
                    }
                    return [];
                },
                dependsOn: ['theme'],
                hint: 'Dashboard theme. When linked to a topic, receiving a matching theme name dynamically changes the theme.'
            },
            {
                key: 'layoutMode', type: 'select', label: 'Layout Mode', cols: 12, editorTier: 'both',
                options: [
                    { value: 'fixed', text: 'Fixed Resolution' },
                    { value: 'scale', text: 'Scale to Fit Screen' },
                    { value: 'responsive', text: 'Responsive Columns' }
                ],
                hint: 'Fixed Resolution: widgets use absolute pixel positions. Scale to Fit Screen: scales the fixed-resolution layout to fill the screen. Responsive Columns: widgets are arranged in a fluid CSS grid column layout.'
            },
            {
                key: 'layoutScaleKeepAspect', type: 'checkbox', label: 'Keep Aspect Ratio',
                cols: 12, default: true, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode === 'scale'; },
                dependsOn: ['layoutMode'],
                hint: 'When enabled, the dashboard scales uniformly and letterboxes the remaining space. The background always fills the whole screen. When disabled, the dashboard stretches to fill the full viewport.'
            },
            {
                key: 'layoutResponsiveColumnCount', type: 'number', label: 'Column Count',
                cols: 6, min: 1, max: 24, default: 6, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode === 'responsive'; },
                dependsOn: ['layoutMode'],
                hint: 'Maximum number of columns on a wide screen.'
            },
            {
                key: 'layoutResponsiveReduceColumnsToFit', type: 'checkbox', label: 'Reduce Columns to Fit',
                cols: 6, default: false, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode === 'responsive'; },
                dependsOn: ['layoutMode'],
                hint: 'Use fewer than Column Count when the window is too narrow for Min Column Width. Scroll only when a single column still cannot fit. The Column Count value is not changed.'
            },
            {
                key: 'layoutResponsiveMinSize', type: 'number', label: 'Min Column Width',
                cols: 4, min: 1, default: 150, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode === 'responsive'; },
                dependsOn: ['layoutMode'],
                hint: 'Hard floor for every column. With Reduce Columns to Fit, the dashboard uses fewer columns first. It scrolls only when a single column still cannot fit (or immediately if that checkbox is off). Hide Scrollbars on dashboard clips that overflow.'
            },
            {
                key: 'layoutResponsiveMaxSize', type: 'number', label: 'Max Column Width',
                cols: 4, min: 0, default: 0, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode === 'responsive'; },
                dependsOn: ['layoutMode'],
                hint: '0 = columns grow to fill the frame. When set, column width is capped at this value. Use Column Alignment Center to center leftover space.'
            },
            {
                key: 'layoutResponsiveAlign', type: 'select', label: 'Column Alignment', cols: 4, editorTier: 'both',
                options: [
                    { value: 'start', text: 'Left' },
                    { value: 'center', text: 'Center' },
                    { value: 'end', text: 'Right' },
                    { value: 'stretch', text: 'Stretch' }
                ],
                default: 'center',
                visibleWhen: function (values) { return values.layoutMode === 'responsive'; },
                dependsOn: ['layoutMode'],
                hint: 'Positions leftover space when Width is greater than 0, or when Max Column Width caps the columns. Left, Center, and Right align the page. Stretch fills the available width up to the configured Width.'
            },
            {
                key: 'layoutResponsiveGap', type: 'number', label: 'Gap (px)',
                cols: 6, min: 0, default: 10, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode === 'responsive'; },
                dependsOn: ['layoutMode']
            },
            {
                key: 'layoutResponsiveMinWidgetHeight', type: 'number', label: 'Min Widget Height',
                cols: 6, min: 0, default: 120, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode === 'responsive'; },
                dependsOn: ['layoutMode'],
                hint: 'Minimum pixel height for Auto cells, and the default Min Height for Fill cells.'
            },
            {
                key: 'canvasPreset', type: 'select', label: 'Resolution Presets', cols: 12, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode !== 'responsive'; },
                dependsOn: ['layoutMode'],
                options: [
                    { value: "0,0", text: "No limit" },
                    { value: "1920,1080", text: "Monitor FHD Landscape (1920 x 1080)" },
                    { value: "1080,1920", text: "Monitor FHD Portrait (1080 x 1920)" },
                    { value: "2560,1440", text: "Monitor 2K Landscape (2560 x 1440)" },
                    { value: "1440,2560", text: "Monitor 2K Portrait (1440 x 2560)" },
                    { value: "3840,2160", text: "Monitor 4K Landscape (3840 x 2160)" },
                    { value: "440,956", text: "iPhone 16 Pro Max (440 x 956)" },
                    { value: "430,932", text: "iPhone 15/14 Pro Max (430 x 932)" },
                    { value: "402,874", text: "iPhone 16 Pro (402 x 874)" },
                    { value: "393,852", text: "iPhone 15/14 Pro (393 x 852)" },
                    { value: "390,844", text: "iPhone 14/13/12 (390 x 844)" },
                    { value: "428,926", text: "iPhone 14/13/12 Plus (428 x 926)" },
                    { value: "375,667", text: "iPhone SE (375 x 667)" },
                    { value: "1376,1032", text: "iPad Pro 13\" (M4) Landscape" },
                    { value: "1194,834", text: "iPad Pro 11\" Landscape" },
                    { value: "1366,1024", text: "iPad Pro 12.9\" Landscape" },
                    { value: "1180,820", text: "iPad Air 10.9\" Landscape" },
                    { value: "1133,744", text: "iPad Mini 6 Landscape" },
                    { value: "1032,1376", text: "iPad Pro 13\" (M4) Portrait" },
                    { value: "834,1194", text: "iPad Pro 11\" Portrait" },
                    { value: "1024,1366", text: "iPad Pro 12.9\" Portrait" },
                    { value: "820,1180", text: "iPad Air 10.9\" Portrait" },
                    { value: "744,1133", text: "iPad Mini 6 Portrait" },
                    { value: "412,915", text: "Pixel 7/8 / S23 Ultra (412 x 915)" },
                    { value: "448,998", text: "Pixel 8 Pro (448 x 998)" },
                    { value: "360,800", text: "Generic Android Small (360 x 800)" },
                    { value: "480,854", text: "Generic Android Large (480 x 854)" },
                    { value: "1280,800", text: "Android Tablet Landscape (1280 x 800)" },
                    { value: "800,1280", text: "Android Tablet Portrait (800 x 1280)" }
                ]
            },
            {
                key: 'canvasWidth', type: 'number', label: 'Width (0=Unlimited)', cols: 6, editorTier: 'both',
                visibleWhen: function (values) { return true; },
                dependsOn: ['layoutMode'],
                hint: 'Responsive Columns: when greater than 0, this is the maximum pixel width (max-width) of the page container. The canvas shrinks fluidly below it so columns reflow, and is positioned within the viewport by Column Alignment. 0 = unlimited (fills the viewport).'
            },
            {
                key: 'canvasHeight', type: 'number', label: 'Height (0=Auto)', cols: 6, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode !== 'responsive'; },
                dependsOn: ['layoutMode']
            },
            {
                key: 'layoutResponsivePagePaddingLeft', type: 'number', label: 'Page Padding Left',
                cols: 3, min: 0, default: 20, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode === 'responsive'; },
                dependsOn: ['layoutMode']
            },
            {
                key: 'layoutResponsivePagePaddingRight', type: 'number', label: 'Page Padding Right',
                cols: 3, min: 0, default: 20, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode === 'responsive'; },
                dependsOn: ['layoutMode']
            },
            {
                key: 'layoutResponsivePagePaddingTop', type: 'number', label: 'Page Padding Top',
                cols: 3, min: 0, default: 20, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode === 'responsive'; },
                dependsOn: ['layoutMode']
            },
            {
                key: 'layoutResponsivePagePaddingBottom', type: 'number', label: 'Page Padding Bottom',
                cols: 3, min: 0, default: 20, editorTier: 'both',
                visibleWhen: function (values) { return values.layoutMode === 'responsive'; },
                dependsOn: ['layoutMode'],
                hint: 'Insets the widget grid from the viewport edges. The dashboard background still fills the full screen.'
            },
            { key: 'hideScrollbars', type: 'checkbox', label: 'Hide Scrollbars on dashboard', cols: 12, editorTier: 'both' },

            {
                key: 'canvasBgType', type: 'select', label: 'Background Style', editorTier: 'advanced',
                options: [
                    { value: 'flat', text: 'Flat Color' },
                    { value: 'linear', text: 'Linear Gradient' },
                    { value: 'linear_mirror', text: 'Mirror Gradient (Symetrical)' },
                    { value: 'radial', text: 'Radial (Center Out)' }
                ], cols: 6
            },
            { key: 'canvasBgAngle', type: 'number', min: 0, max: 360, label: 'Gradient Angle (deg)', cols: 6, editorTier: 'advanced' },
            {
                key: 'canvasBg',
                type: 'color',
                label: 'Color 1 (Start/Flat)',
                cols: 3,
                editorTier: 'advanced',
                editThemeLiteralWhenRefMatchesToken: 'background',
                hint: 'While this value is @background, it follows Theme Colors → Background; HSV sliders and used swatches edit that theme slot. Type a color and press Enter to set a fixed canvas color instead.'
            },
            { key: 'canvasBgOpacity', type: 'number', min: 0, max: 100, label: 'Opacity 1', cols: 3, editorTier: 'advanced' },
            {
                key: 'canvasBgEnd',
                type: 'color',
                label: 'Color 2 (End)',
                cols: 3,
                editorTier: 'advanced',
                editThemeLiteralWhenRefMatchesToken: 'backgroundAccent',
                hint: 'While this value is @backgroundAccent, it follows Theme Colors → Background Accent; HSV sliders and used swatches edit that theme slot. Type a color and press Enter to set a fixed canvas color instead.'
            },
            { key: 'canvasBgEndOpacity', type: 'number', min: 0, max: 100, label: 'Opacity 2', cols: 3, editorTier: 'advanced' },
            { key: 'canvasImage', type: 'text', label: 'Background Image URL', cols: 12, imagePicker: true, editorTier: 'advanced' },
            {
                key: 'canvasBgSize', type: 'select', label: 'Image Fit', options: ['cover', 'contain', 'tile'], cols: 6, editorTier: 'advanced',
                visibleWhen: function (values) { return !!(values && typeof values.canvasImage === 'string' && values.canvasImage.trim()); },
                dependsOn: ['canvasImage']
            },
            {
                key: 'canvasBgOverlay', type: 'checkbox', label: 'Color Overlay', cols: 6, editorTier: 'advanced',
                visibleWhen: function (values) { return !!(values && typeof values.canvasImage === 'string' && values.canvasImage.trim()); },
                dependsOn: ['canvasImage']
            },
            {
                key: 'inactivityPageEnabled',
                type: 'checkbox',
                label: 'Enable Startup Landing Page & Inactivity Return',
                cols: 12,
                default: false,
                editorTier: 'advanced',
                hint: 'Opens the Startup Landing Page when the dashboard loads, and returns to it after the Inactivity Timeout (seconds) from the last tap, click, key press, or scroll, including scrolling inside a text widget. Setting the timeout to 0 disables automatic return and only opens the page on startup. Add page= and a page number to the dashboard URL to open that page on load instead. The timer pauses in Edit Mode and starts over when you leave Edit Mode.'
            },
            {
                key: 'inactivityReturnPage',
                type: 'number',
                label: 'Startup Landing Page',
                cols: 6,
                min: 1,
                step: 1,
                default: 1,
                editorTier: 'advanced',
                visibleWhen: function (values) { return !!(values && values.inactivityPageEnabled === true); },
                dependsOn: ['inactivityPageEnabled']
            },
            {
                key: 'inactivityTimeoutSeconds',
                type: 'number',
                label: 'Inactivity Timeout (seconds, 0 = Disabled)',
                cols: 6,
                min: 0,
                max: 86400,
                step: 1,
                default: 60,
                editorTier: 'advanced',
                visibleWhen: function (values) { return !!(values && values.inactivityPageEnabled === true); },
                dependsOn: ['inactivityPageEnabled'],
                hint: 'Default is 60 seconds. Set to 0 to disable automatic return after inactivity.'
            },
            { key: 'preloadImagesOnAllPages', type: 'checkbox', label: 'Preload images on all pages', cols: 6, editorTier: 'advanced' },
            {
                key: 'holdToActivateDuration',
                type: 'number',
                label: 'Hold to Activate Duration (seconds)',
                cols: 6,
                min: 0.5,
                max: 10,
                step: 0.1,
                editorTier: 'advanced',
                hint: 'How long to press a Switch or Button when Hold to Activate is enabled before that action runs.'
            }
        ]
    },
    {
        id: 'm_regional', title: 'Regional & Localization', icon: 'ph-translate', editorTier: 'both',
        fields: [
            {
                key: 'locale',
                type: 'select',
                label: 'Language / Locale',
                cols: 12,
                default: 'auto',
                editorTier: 'both',
                dynamicOptions: function () {
                    if (typeof DashboardI18n !== 'undefined' && typeof DashboardI18n.getLanguageSelectOptions === 'function') {
                        return DashboardI18n.getLanguageSelectOptions(false);
                    }
                    return [{ value: 'auto', text: 'Auto (Browser Default)' }, { value: 'en', text: 'English' }];
                },
                dependsOn: ['locale', 'customLocale'],
                hint: 'Default language for countdown units, weekday names, and month names across the dashboard.'
            },
            {
                key: 'editTranslations',
                type: 'action_button',
                label: 'Edit / Customize Translations...',
                cols: 12,
                editorTier: 'both',
                noBind: true,
                title: 'Open the Custom Translation Dialog to view, edit, export, or import localized words and save custom presets.',
                onClick: function () {
                    if (typeof DashboardI18n !== 'undefined' && typeof DashboardI18n.openCustomTranslationDialog === 'function') {
                        DashboardI18n.openCustomTranslationDialog();
                    }
                }
            },
            {
                key: 'timeFormat',
                type: 'select',
                label: 'Time Format',
                cols: 4,
                default: 'auto',
                editorTier: 'both',
                options: [
                    { value: 'auto', text: 'Auto' },
                    { value: '24h', text: '24-Hour' },
                    { value: '12h', text: '12-Hour (AM/PM)' }
                ],
                hint: 'Default time display format for Clock, List, and Graph widgets.'
            },
            {
                key: 'dateFormat',
                type: 'select',
                label: 'Date Format',
                cols: 4,
                default: 'auto',
                editorTier: 'both',
                options: [
                    { value: 'auto', text: 'Auto' },
                    { value: 'DD-MM-YYYY', text: 'DD-MM-YYYY' },
                    { value: 'MM-DD-YYYY', text: 'MM-DD-YYYY' },
                    { value: 'YYYY-MM-DD', text: 'YYYY-MM-DD' }
                ],
                hint: 'Default date display format for List and Graph widgets.'
            },
            {
                key: 'firstDayOfWeek',
                type: 'select',
                label: 'First Day of Week',
                cols: 4,
                default: 'auto',
                editorTier: 'both',
                options: [
                    { value: 'auto', text: 'Auto' },
                    { value: 'monday', text: 'Monday' },
                    { value: 'sunday', text: 'Sunday' }
                ],
                hint: 'Default first day of the week for Markdown calendars in the Text widget.'
            }
        ]
    },
    {
        id: 'm_gestures', title: 'Gesture Controls', icon: 'ph-hand-swipe-right', editorTier: 'both',
        fields: [
            {
                key: 'gestureTouchOnly',
                type: 'checkbox',
                label: 'Touchscreen Only',
                cols: 12,
                default: true,
                editorTier: 'both',
                hint: 'When enabled, gestures only respond to touch input. Uncheck to also allow mouse click-and-drag testing on desktop.'
            },
            {
                key: 'swipeLeftEnabled',
                type: 'checkbox',
                label: 'Swipe Left',
                cols: 4,
                default: false,
                editorTier: 'both'
            },
            {
                key: 'swipeLeftAction',
                type: 'select',
                label: 'Action',
                cols: 8,
                default: 'next_page',
                editorTier: 'both',
                options: [
                    { value: 'next_page', text: 'Go to Next Page' },
                    { value: 'prev_page', text: 'Go to Previous Page' },
                    { value: 'specific_page', text: 'Go to Specific Page' },
                    { value: 'topic', text: 'Trigger Topic' }
                ],
                visibleWhen: function (values) { return !!(values && values.swipeLeftEnabled === true); },
                dependsOn: ['swipeLeftEnabled']
            },
            {
                key: 'swipeLeftPage',
                type: 'number',
                label: 'Target Page',
                cols: 12,
                min: 0,
                step: 1,
                default: 1,
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeLeftEnabled === true && values.swipeLeftAction === 'specific_page'); },
                dependsOn: ['swipeLeftEnabled', 'swipeLeftAction']
            },
            {
                key: 'swipeLeftTopic',
                type: 'topic',
                label: 'Swipe Left Topic',
                cols: 6,
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeLeftEnabled === true && values.swipeLeftAction === 'topic'); },
                dependsOn: ['swipeLeftEnabled', 'swipeLeftAction']
            },
            {
                key: 'swipeLeftPayload',
                type: 'text',
                label: 'Payload',
                cols: 6,
                placeholder: 'e.g. 1, true, open',
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeLeftEnabled === true && values.swipeLeftAction === 'topic'); },
                dependsOn: ['swipeLeftEnabled', 'swipeLeftAction']
            },
            {
                key: 'swipeRightEnabled',
                type: 'checkbox',
                label: 'Swipe Right',
                cols: 4,
                default: false,
                editorTier: 'both'
            },
            {
                key: 'swipeRightAction',
                type: 'select',
                label: 'Action',
                cols: 8,
                default: 'prev_page',
                editorTier: 'both',
                options: [
                    { value: 'next_page', text: 'Go to Next Page' },
                    { value: 'prev_page', text: 'Go to Previous Page' },
                    { value: 'specific_page', text: 'Go to Specific Page' },
                    { value: 'topic', text: 'Trigger Topic' }
                ],
                visibleWhen: function (values) { return !!(values && values.swipeRightEnabled === true); },
                dependsOn: ['swipeRightEnabled']
            },
            {
                key: 'swipeRightPage',
                type: 'number',
                label: 'Target Page',
                cols: 12,
                min: 0,
                step: 1,
                default: 1,
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeRightEnabled === true && values.swipeRightAction === 'specific_page'); },
                dependsOn: ['swipeRightEnabled', 'swipeRightAction']
            },
            {
                key: 'swipeRightTopic',
                type: 'topic',
                label: 'Swipe Right Topic',
                cols: 6,
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeRightEnabled === true && values.swipeRightAction === 'topic'); },
                dependsOn: ['swipeRightEnabled', 'swipeRightAction']
            },
            {
                key: 'swipeRightPayload',
                type: 'text',
                label: 'Payload',
                cols: 6,
                placeholder: 'e.g. 1, true, open',
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeRightEnabled === true && values.swipeRightAction === 'topic'); },
                dependsOn: ['swipeRightEnabled', 'swipeRightAction']
            },
            {
                key: 'swipeUpEnabled',
                type: 'checkbox',
                label: 'Swipe Up',
                cols: 4,
                default: false,
                editorTier: 'both'
            },
            {
                key: 'swipeUpAction',
                type: 'select',
                label: 'Action',
                cols: 8,
                default: 'topic',
                editorTier: 'both',
                options: [
                    { value: 'next_page', text: 'Go to Next Page' },
                    { value: 'prev_page', text: 'Go to Previous Page' },
                    { value: 'specific_page', text: 'Go to Specific Page' },
                    { value: 'topic', text: 'Trigger Topic' }
                ],
                visibleWhen: function (values) { return !!(values && values.swipeUpEnabled === true); },
                dependsOn: ['swipeUpEnabled']
            },
            {
                key: 'swipeUpPage',
                type: 'number',
                label: 'Target Page',
                cols: 12,
                min: 0,
                step: 1,
                default: 1,
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeUpEnabled === true && values.swipeUpAction === 'specific_page'); },
                dependsOn: ['swipeUpEnabled', 'swipeUpAction']
            },
            {
                key: 'swipeUpTopic',
                type: 'topic',
                label: 'Swipe Up Topic',
                cols: 6,
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeUpEnabled === true && values.swipeUpAction === 'topic'); },
                dependsOn: ['swipeUpEnabled', 'swipeUpAction']
            },
            {
                key: 'swipeUpPayload',
                type: 'text',
                label: 'Payload',
                cols: 6,
                placeholder: 'e.g. 1, true, open',
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeUpEnabled === true && values.swipeUpAction === 'topic'); },
                dependsOn: ['swipeUpEnabled', 'swipeUpAction']
            },
            {
                key: 'swipeDownEnabled',
                type: 'checkbox',
                label: 'Swipe Down',
                cols: 4,
                default: false,
                editorTier: 'both'
            },
            {
                key: 'swipeDownAction',
                type: 'select',
                label: 'Action',
                cols: 8,
                default: 'topic',
                editorTier: 'both',
                options: [
                    { value: 'next_page', text: 'Go to Next Page' },
                    { value: 'prev_page', text: 'Go to Previous Page' },
                    { value: 'specific_page', text: 'Go to Specific Page' },
                    { value: 'topic', text: 'Trigger Topic' }
                ],
                visibleWhen: function (values) { return !!(values && values.swipeDownEnabled === true); },
                dependsOn: ['swipeDownEnabled']
            },
            {
                key: 'swipeDownPage',
                type: 'number',
                label: 'Target Page',
                cols: 12,
                min: 0,
                step: 1,
                default: 1,
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeDownEnabled === true && values.swipeDownAction === 'specific_page'); },
                dependsOn: ['swipeDownEnabled', 'swipeDownAction']
            },
            {
                key: 'swipeDownTopic',
                type: 'topic',
                label: 'Swipe Down Topic',
                cols: 6,
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeDownEnabled === true && values.swipeDownAction === 'topic'); },
                dependsOn: ['swipeDownEnabled', 'swipeDownAction']
            },
            {
                key: 'swipeDownPayload',
                type: 'text',
                label: 'Payload',
                cols: 6,
                placeholder: 'e.g. 1, true, open',
                editorTier: 'both',
                visibleWhen: function (values) { return !!(values && values.swipeDownEnabled === true && values.swipeDownAction === 'topic'); },
                dependsOn: ['swipeDownEnabled', 'swipeDownAction']
            },
            {
                key: 'swipeIgnorePages',
                type: 'text',
                label: 'Ignore Pages',
                placeholder: 'e.g. 3, 5-7, 10',
                cols: 8,
                editorTier: 'both',
                hint: 'Pages or ranges of pages to skip during page swipe navigation.',
                visibleWhen: function (values) {
                    if (!values) return false;
                    var gestures = ['swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown'];
                    for (var i = 0; i < gestures.length; i++) {
                        var g = gestures[i];
                        if (values[g + 'Enabled'] === true && (values[g + 'Action'] === 'next_page' || values[g + 'Action'] === 'prev_page')) {
                            return true;
                        }
                    }
                    return false;
                },
                dependsOn: [
                    'swipeLeftEnabled', 'swipeLeftAction',
                    'swipeRightEnabled', 'swipeRightAction',
                    'swipeUpEnabled', 'swipeUpAction',
                    'swipeDownEnabled', 'swipeDownAction'
                ]
            },
            {
                key: 'swipeWrapAround',
                type: 'checkbox',
                label: 'Wrap Around Pages',
                cols: 4,
                default: false,
                editorTier: 'both',
                hint: 'When reaching the last page, swipe forward wraps back to the first available page, and vice versa.',
                visibleWhen: function (values) {
                    if (!values) return false;
                    var gestures = ['swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown'];
                    for (var i = 0; i < gestures.length; i++) {
                        var g = gestures[i];
                        if (values[g + 'Enabled'] === true && (values[g + 'Action'] === 'next_page' || values[g + 'Action'] === 'prev_page')) {
                            return true;
                        }
                    }
                    return false;
                },
                dependsOn: [
                    'swipeLeftEnabled', 'swipeLeftAction',
                    'swipeRightEnabled', 'swipeRightAction',
                    'swipeUpEnabled', 'swipeUpAction',
                    'swipeDownEnabled', 'swipeDownAction'
                ]
            }
        ]
    },
    {
        id: 'm_audio', title: 'Audio', icon: 'ph-music-notes', editorTier: 'both',
        fields: [
            {
                key: 'audioTopicMap',
                type: 'audio_topic_map',
                label: 'Topic Audio',
                cols: 12,
                editorTier: 'both',
                hint: 'Play an audio file when a topic receives a new payload. Playback stays muted for 5 seconds after the dashboard loads so Homey cache replay does not trigger every sound at once.'
            }
        ]
    },
    {
        id: 'm_typo', title: 'Typography', icon: 'ph-text-t',
        fields: [
            {
                key: 'customFonts',
                type: 'font_list',
                label: 'Custom Google Fonts',
                labelExternalLink: { href: 'https://fonts.google.com/', linkText: 'Google Fonts' },
                cols: 12
            },
            { key: 'fontFamily', type: 'select', label: 'Global Font Family', options: window.AVAILABLE_FONTS, cols: 12 },
            { key: 'defaultLabelCase', type: 'select', label: 'Case', options: [{ value: 'uppercase', text: 'UPPERCASE' }, { value: 'capitalize', text: 'Capitalize' }, { value: 'lowercase', text: 'lowercase' }, { value: 'none', text: 'None' }], cols: 4 },
            { key: 'defaultLabelBold', type: 'checkbox', label: 'Bold', cols: 4 },
            { key: 'defaultLabelLineHeight', type: 'number', label: 'Line Height', cols: 4, step: 0.1 },
            { key: 'defaultTextAlign', type: 'select', label: 'Horizontal Alignment', options: ['left', 'center', 'right'], cols: 6 },
            { key: 'defaultTextVerticalAlign', type: 'select', label: 'Vertical Alignment', options: ['top', 'middle', 'bottom'], cols: 6 },
            { key: 'defaultColVal', type: 'color', label: 'Value Color', cols: 6 },
            { key: 'defaultColLabel', type: 'color', label: 'Label Color', cols: 6 },
            { key: 'defaultFsGeneral', type: 'number', label: 'Base Size', cols: 3 },
            { key: 'defaultFsVal', type: 'number', label: 'Value Size', cols: 3 },
            { key: 'defaultFsLabel', type: 'number', label: 'Label Size', cols: 3 },
            { key: 'defaultFsUnit', type: 'number', label: 'Unit Size', cols: 3 }
        ]
    },
    {
        id: 'm_box', title: 'Container Style', icon: 'ph-paint-brush',
        fields: [
            { key: 'defaultWidth', type: 'number', label: 'Default Width', cols: 4 },
            { key: 'defaultHeight', type: 'number', label: 'Default Height', cols: 4 },
            { key: 'defaultPadding', type: 'number', label: 'Default Padding', cols: 4 },

            { key: 'bgVisible', type: 'checkbox', label: 'Show Container', cols: 4 },
            { key: 'glowEnabled', type: 'checkbox', label: 'Enable Glow', cols: 4 },
            { key: 'defaultCornerRadius', type: 'number', label: 'Radius', cols: 4 },

            { key: 'bgColStart', type: 'color', label: 'Start Color', cols: 3 },
            { key: 'bgOpacityStart', type: 'number', min: 0, max: 100, label: 'Start Opacity', cols: 3 },
            { key: 'bgColEnd', type: 'color', label: 'End Color', cols: 3 },
            { key: 'bgOpacityEnd', type: 'number', min: 0, max: 100, label: 'End Opacity', cols: 3 },
            { key: 'bgAngle', type: 'number', label: 'Gradient Angle', cols: 6 },
            { key: 'bgBlur', type: 'number', min: 0, max: 40, label: 'Background Blur', cols: 6, default: 0 },

            { key: 'glowColor', type: 'color', label: 'Glow Color', cols: 4 },
            { key: 'glowRadius', type: 'number', label: 'Glow Radius', cols: 4 },
            { key: 'glowOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 4 },

            { key: 'borderColor', type: 'color', label: 'Border Color', cols: 4 },
            { key: 'defaultBorderWidth', type: 'number', label: 'Border Width', cols: 4 },
            { key: 'defaultBorderOpacity', type: 'number', min: 0, max: 100, label: 'Opacity', cols: 4 },

            { key: 'innerGlow', type: 'number', min: 0, label: 'Inner Glow', cols: 4 },
            { key: 'innerGlowColor', type: 'color', label: 'Inner Glow Color', cols: 4, dependsOn: ['innerGlow'], visibleWhen: function (values) { return typeof BaseWidget !== 'undefined' && typeof BaseWidget.innerGlowDetailsVisible === 'function' ? BaseWidget.innerGlowDetailsVisible(values) : !!(values && Number(values.innerGlow) > 0); } },
            { key: 'innerGlowOpacity', type: 'number', min: 0, max: 100, label: 'Inner Glow Opacity', cols: 4, dependsOn: ['innerGlow'], visibleWhen: function (values) { return typeof BaseWidget !== 'undefined' && typeof BaseWidget.innerGlowDetailsVisible === 'function' ? BaseWidget.innerGlowDetailsVisible(values) : !!(values && Number(values.innerGlow) > 0); } }
        ]
    }
];