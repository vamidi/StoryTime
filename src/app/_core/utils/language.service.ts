import { Injectable } from '@angular/core';
import { KeyLanguage } from '@app-core/data/state/node-editor/languages.model';

import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs/Observable';


@Injectable({ providedIn: 'root' })
export class LanguageService
{
	public set SetLanguage(lang: KeyLanguage)
	{
		this.selectedLanguage = lang; this.selectedLanguage$.next(this.selectedLanguage);
	}

	public get Language(): Observable<KeyLanguage> { return this.selectedLanguage$.asObservable(); }

	private selectedLanguage$: BehaviorSubject<KeyLanguage> = new BehaviorSubject<KeyLanguage>('en');

	private selectedLanguage: KeyLanguage = null;
}
