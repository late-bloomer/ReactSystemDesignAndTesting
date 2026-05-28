import i18next from "i18next";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";


i18next.use(I18nextBrowserLanguageDetector).use(initReactI18next).init({
    debug: true,
    fallbackLng: "fr",
    returnObjects: true,
    resources: {
        en: {
            translation: {
                greeting: "Hello, Welcome !!",
                description: {
                    line1: "Welcome to my <mybold>{{name}}</mybold> tutorial !!!",
                    line2: "Today you will learn i18n !!!"
                }
            }
        },
        fr: {
            translation: {
                greeting: "Bonjour, Bienvenue !!",
                description: {
                    line1: "Bonjour, bienvenue dans mon <mybold>{{name}}</mybold> tutoriel !!!",
                    line2: "Aujourd'hui, vous allez apprendre l'i18n !!!"
                }
            }
        },
        hi: {
            translation: {
                greeting: "नमस्ते, आपका स्वागत है !!",
                description: {
                    line1: "मेरे <mybold>{{name}}</mybold> ट्यूटोरियल में आपका स्वागत है !!!",
                    line2: "आज आप i18n सीखेंगे !!!"
                }
            }
        },
        ar: {
            translation: {
                greeting: "مرحباً، أهلاً وسهلاً !!",
                description: {
                    line1: "مرحباً بكم في <mybold>{{name}}</mybold> الدورة التدريبية الخاصة بي !!!",
                    line2: "اليوم سوف تتعلمون i18n !!!"
                }
            }
        }
    }
})