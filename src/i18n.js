import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import usTranslations from './assets/locales/en/us.json';
import esTranslations from './assets/locales/es/es.json';
import plTranslations from './assets/locales/pl/pl.json';
import gbTranslations from './assets/locales/en/gb.json';
import itTranslations from './assets/locales/it/it.json';
import ptTranslations from './assets/locales/pt/pt.json';
import brTranslations from './assets/locales/pt/pt-br.json';

const resources = {
    'en-US': {
        translation: usTranslations
    },
    'en-GB': {
        translation: gbTranslations
    },
    es: {
        translation: esTranslations
    },
    pl: {
        translation: plTranslations
    },
    it: {
        translation: itTranslations
    },
    'pt-PT': {
        translation: ptTranslations
    },
    'pt-BR': {
        translation: brTranslations
    }
};

i18n
    .use( initReactI18next ) // passes i18n down to react-i18next
    .init( {
        resources,
        lng: "en",
        keySeparator: false, // we do not use keys in form messages.welcome

        interpolation: {
            escapeValue: false // react already safes from xss
        }
    } ).then(()=>{
        console.log("success on starting i18n!")
});

export default i18n;
