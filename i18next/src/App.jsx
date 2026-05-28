import { useEffect } from 'react';
import './App.css'
import { Trans, useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', language: "English" },
  { code: 'ar', language: "Arabic" },
  { code: 'fr', language: "French" },
  { code: 'hi', language: "Hindi" },
]

function App() {
  const { t, i18n } = useTranslation();
  const { line1, line2 } = t("description");
  useEffect(() => {
    // document.body.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.body.dir = i18n.dir();
    document.body.lang = i18n.language;
  }, [i18n, i18n.language]);
  const handleLanguageChange = (event, langCode) => {
    i18n.changeLanguage(langCode)
  }

  return (
    <>
      <div style={{
        display: 'flex',
        direction: 'column',
        gap: 10
      }}>
        {LANGUAGES.map((language) => (
          <button onClick={(e) => handleLanguageChange(e, language.code)} style={i18n.language === language.code ? { border: "2px solid red" } : {}}>
            {language.language}
          </button>
        ))}
      </div>
      <h1>{t("greeting")}</h1>
      <h2>
        <Trans
          i18nKey={line1} v
          values={{ name: "Internationalization" }}
          components={{ mybold: <span style={{ fontWeight: "bold", color: "red" }} /> }}
        />
        {/* {line1} */}
      </h2>
      <h3>{line2}</h3>
    </>
  )
}

export default App
