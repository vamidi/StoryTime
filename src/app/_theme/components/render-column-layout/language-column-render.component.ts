import {
	AfterViewInit,
	ChangeDetectorRef,
	Component, Input, OnDestroy,
	OnInit,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';

import { DefaultEditor, ViewCell } from '@vamidicreations/ng2-smart-table';
import { TextAreaQuestion } from '@app-core/data/forms/form-types';
import { KeyLanguage, KeyLanguageObject } from '@app-core/data/state/node-editor/languages.model';
import { LanguageService } from '@app-core/data/state/projects/projects.service';

@Component({
	template: `
		<span>{{ convertedValue | async }}</span>
	`,
})
export class LanguageRenderComponent implements ViewCell, OnInit, AfterViewInit, OnDestroy
{
	@Input()
	public rowData: any;

	@Input()
	public value: any;

	public convertedValue: BehaviorSubject<string> = new BehaviorSubject<string>('');

	private currentValue: KeyLanguageObject;

	private subscription: Subscription = new Subscription();

	constructor(
		private cd: ChangeDetectorRef,
		private languageService: LanguageService) {}

	public ngOnInit(): void
	{
		this.currentValue = this.value as KeyLanguageObject;
		if(this.currentValue !== null)
		{
			// Set to default value first
			this.subscription.add(this.languageService.Language.subscribe((lang) => {
				const newValue: string = this.currentValue[lang];
				if(this.convertedValue.getValue() === newValue)
					return;

				this.convertedValue.next(newValue);
			}));
		}
	}

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public ngOnDestroy(): void
	{
		if(this.subscription) this.subscription.unsubscribe();
	}
}


@Component({
	template: `
		<div *ngIf="cell.getColumn().isEditable">
			<label class="formHeading" for="{{ question.key }}--area">{{ question.text }}</label>
			<textarea id="{{ question.key }}--area" nbInput fullWidth
					  [name]="question.name"
					  [value]="question.value"
					  (change)="onChange($event)">
			</textarea>
		</div>
	`,
})
export class LanguageColumnRenderComponent extends DefaultEditor implements OnInit, AfterViewInit
{
	public question: TextAreaQuestion = new TextAreaQuestion({
		text: 'Name',
		name: 'Test text',
		placeholder: 'Select relation',
		required: true,
		options: new BehaviorSubject<any[]>([]),
	});

	public defaultValue: string = null;

	private selectedLanguage: KeyLanguage = null;

	private subscription: Subscription = new Subscription();

	constructor(
		private languageService: LanguageService,
		private cd: ChangeDetectorRef)
	{
		super();
	}

	// TODO this data should be automatic for relation ship columns
	ngOnInit(): void
	{
		const value: KeyLanguageObject = this.cell.getValue() as KeyLanguageObject;
		if(value !== null)
		{
			// Set to default value first
			this.subscription.add(this.languageService.Language.subscribe(( lang: KeyLanguage) =>
			{
				if(this.selectedLanguage === lang)
					return;

				this.selectedLanguage = lang;
				if(!value.hasOwnProperty(lang))
					value[lang] = '';

				const newValue: string = value[lang];
				this.question.value = this.defaultValue = newValue;
			}));
		}
	}

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public onChange(event: any)
	{
		const value: KeyLanguageObject = this.cell.getValue() as KeyLanguageObject;
		this.cell.newValue = { ...value };
		this.cell.newValue[this.selectedLanguage] = event.target.value;
	}
}
