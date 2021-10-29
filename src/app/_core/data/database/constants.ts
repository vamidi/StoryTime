import { KeyLanguage, KeyLanguageObject, systemLanguages } from '@app-core/data/state/node-editor/languages.model';

export const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
export const DEFAULT_LANGUAGE_OBJ: KeyLanguageObject = { en: '' };

export function validateLanguageObject(value: Object): boolean {
	const keyValue = value as KeyLanguageObject;
	if (keyValue !== null) {
		const languages = Object.keys(keyValue);
		// Are we dealing with a language object
		if (systemLanguages.has(languages[0] as KeyLanguage)) {
			return true;
		}
	}

	return false;
}
