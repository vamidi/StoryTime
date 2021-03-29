import { Pair } from '@app-core/functions/helper.functions';

export type KeyLanguageObject = { [key in KeyLanguage]: string; };

export type KeyLanguage =
	'af' 		|
	'ar' 		|
	'eu' 		|
	'be' 		|
	'bg' 		|
	'ca' 		|
	'zh-CN' 	|
	'zh-hans' 	|
	'zh-hant' 	|
	'hr' 		|
	'cs' 		|
	'da' 		|
	'nl' 		|
	'en' 		|
	'et' 		|
	'fo' 		|
	'fi' 		|
	'fr' 		|
	'de' 		|
	'el' 		|
	'he' 		|
	'hu' 		|
	'is' 		|
	'id' 		|
	'it' 		|
	'ja' 		|
	'ko' 		|
	'lv' 		|
	'lt' 		|
	'no' 		|
	'pl' 		|
	'pt' 		|
	'ro' 		|
	'ru' 		|
	'sk' 		|
	'sl' 		|
	'es' 		|
	'sv' 		|
	'th' 		|
	'tr' 		|
	'uk' 		|
	'vi';

export type SystemLanguage =
	'Afrikaans'				|
	'Arabic' 				|
	'Basque' 				|
	'Belarusian'			|
	'Bulgarian' 			|
	'Catalan' 				|
	'Chinese' 				|
	'ChineseSimplified'		|
	'ChineseTraditional'	|
	'SerboCroatian' 		|
	'Czech' 				|
	'Danish' 				|
	'Dutch' 				|
	'English' 				|
	'Estonian' 				|
	'Faroese' 				|
	'Finnish' 				|
	'French'				|
	'German' 				|
	'Greek' 				|
	'Hebrew' 				|
	'Hungarian' 			|
	'Icelandic' 			|
	'Indonesian' 			|
	'Italian' 				|
	'Japanese' 				|
	'Korean' 				|
	'Latvian' 				|
	'Lithuanian' 			|
	'Norwegian' 			|
	'Polish' 				|
	'Portuguese' 			|
	'Romanian' 				|
	'Russian' 				|
	'Slovak' 				|
	'Slovenian' 			|
	'Spanish' 				|
	'Swedish' 				|
	'Thai' 					|
	'Turkish' 				|
	'Ukrainian' 			|
	'Vietnamese';

/**
 * @brief current system languages that we support in the engine.
 */
export const systemLanguages: Map<KeyLanguage, SystemLanguage> = new Map<KeyLanguage, SystemLanguage>([
	Pair('af', 		'Afrikaans'),
	Pair('ar', 		'Arabic'),
	Pair('eu', 		'Basque'),
	Pair('be', 		'Belarusian'),
	Pair('bg', 		'Bulgarian'),
	Pair('ca',		'Catalan'),
	Pair('zh-CN',	'Chinese'),
	Pair('zh-hans',	'ChineseSimplified'),
	Pair('zh-hant',	'ChineseTraditional'),
	Pair('hr', 		'SerboCroatian'),
	Pair('cs', 		'Czech'),
	Pair('da', 		'Danish'),
	Pair('nl', 		'Dutch'),
	Pair('en', 		'English'),
	Pair('et', 		'Estonian'),
	Pair('fo', 		'Faroese'),
	Pair('fi', 		'Finnish'),
	Pair('fr', 		'French'),
	Pair('de', 		'German'),
	Pair('el', 		'Greek'),
	Pair('he', 		'Hebrew'),
	Pair('hu', 		'Hungarian'),
	Pair('is', 		'Icelandic'),
	Pair('id', 		'Indonesian'),
	Pair('it', 		'Italian'),
	Pair('ja', 		'Japanese'),
	Pair('ko', 		'Korean'),
	Pair('lv', 		'Latvian'),
	Pair('lt', 		'Lithuanian'),
	Pair('no', 		'Norwegian'),
	Pair('pl', 		'Polish'),
	Pair('pt', 		'Portuguese'),
	Pair('ro', 		'Romanian'),
	Pair('ru', 		'Russian'),
	Pair('sk', 		'Slovak'),
	Pair('sl', 		'Slovenian'),
	Pair('es', 		'Spanish'),
	Pair('sv', 		'Swedish'),
	Pair('th', 		'Thai'),
	Pair('tr', 		'Turkish'),
	Pair('uk', 		'Ukrainian'),
	Pair('vi', 		'Vietnamese'),
]);
