// src/locales/index.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = ["en", "hi"];
export const DEFAULT_LANGUAGE = "en";

/**
 * Load translations from JSON files
 */
const loadTranslations = () => {
    const translations = {};

    for (const lang of SUPPORTED_LANGUAGES) {
        const langDir = path.join(__dirname, lang);
        translations[lang] = {};

        // Load errors
        const errorsPath = path.join(langDir, "errors.json");
        if (fs.existsSync(errorsPath)) {
            translations[lang].errors = JSON.parse(fs.readFileSync(errorsPath, "utf-8"));
        }

        // Load messages
        const messagesPath = path.join(langDir, "messages.json");
        if (fs.existsSync(messagesPath)) {
            translations[lang].messages = JSON.parse(fs.readFileSync(messagesPath, "utf-8"));
        }
    }

    return translations;
};

// Cache translations
const translations = loadTranslations();

/**
 * Get translation for a key
 * @param {string} key - Translation key (e.g., 'AUTH_001' or 'auth.loginSuccess')
 * @param {string} lang - Language code
 * @param {object} params - Parameters for interpolation
 * @returns {string} - Translated string
 */
export const translate = (key, lang = DEFAULT_LANGUAGE, params = {}) => {
    // Ensure language is supported
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
        lang = DEFAULT_LANGUAGE;
    }

    let translation;

    // Check if it's an error code (uppercase with underscore)
    if (/^[A-Z]+_\d+$/.test(key)) {
        translation = translations[lang]?.errors?.[key];
    } else {
        // Navigate nested object for messages (e.g., 'auth.loginSuccess')
        const keys = key.split(".");
        translation = translations[lang]?.messages;

        for (const k of keys) {
            translation = translation?.[k];
            if (!translation) break;
        }
    }

    // Fallback to English if translation not found
    if (!translation && lang !== DEFAULT_LANGUAGE) {
        if (/^[A-Z]+_\d+$/.test(key)) {
            translation = translations[DEFAULT_LANGUAGE]?.errors?.[key];
        } else {
            const keys = key.split(".");
            translation = translations[DEFAULT_LANGUAGE]?.messages;
            for (const k of keys) {
                translation = translation?.[k];
                if (!translation) break;
            }
        }
    }

    // If still not found, return the key itself
    if (!translation) {
        return key;
    }

    // Replace parameters (e.g., {{field}}, {{min}}, {{max}})
    return translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
    });
};

/**
 * Alias for translate function
 */
export const t = translate;

/**
 * Get error message
 */
export const getErrorMessage = (errorCode, lang = DEFAULT_LANGUAGE, params = {}) => {
    return translate(errorCode, lang, params);
};

/**
 * Get success message
 */
export const getMessage = (messageKey, lang = DEFAULT_LANGUAGE, params = {}) => {
    return translate(messageKey, lang, params);
};

/**
 * Middleware to extract language from request
 */
export const languageMiddleware = (req, res, next) => {
    // Get language from:
    // 1. Query parameter: ?lang=hi
    // 2. Header: Accept-Language
    // 3. User profile (if authenticated)
    // 4. Default language

    let lang = DEFAULT_LANGUAGE;

    // Check query parameter
    if (req.query.lang && SUPPORTED_LANGUAGES.includes(req.query.lang)) {
        lang = req.query.lang;
    }
    // Check Accept-Language header
    else if (req.headers["accept-language"]) {
        const headerLang = req.headers["accept-language"].split(",")[0].split("-")[0];
        if (SUPPORTED_LANGUAGES.includes(headerLang)) {
            lang = headerLang;
        }
    }
    // Check authenticated user's preferred language
    else if (req.user?.preferredLanguage && SUPPORTED_LANGUAGES.includes(req.user.preferredLanguage)) {
        lang = req.user.preferredLanguage;
    }

    // Attach language and translation function to request
    req.lang = lang;
    req.t = (key, params) => translate(key, lang, params);

    next();
};

export default {
    translate,
    t,
    getErrorMessage,
    getMessage,
    languageMiddleware,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
};
