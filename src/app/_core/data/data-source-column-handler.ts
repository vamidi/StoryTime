import { NbControlTypes, Option } from '@app-core/data/forms/form-types';
import { BaseFormSettings, FormField } from '@app-core/mock/base-form-settings';
import { BehaviorSubject } from 'rxjs';
import { Validators } from '@angular/forms';
import { UtilsService } from '@app-core/utils';
import { Column } from '@app-core/mock/base-settings';
import { KeyLanguage, KeyLanguageObject, systemLanguages } from '@app-core/data/state/node-editor/languages.model';

declare type ColumnFunc = (key: string, column: Column, index: number) => FormField<unknown>;

export class DataSourceColumnHandler
{
	private initialized: boolean = false;

	private customFunc: ColumnFunc;
	private columnData: { [key: string]: Column } = null;

	constructor(public source: BaseFormSettings, public readonly data: any = {}) { }

	public initialize(columnData: { [key: string]: Column },
		customFunc: ColumnFunc = null)
	{
		this.columnData = columnData;
		this.customFunc = customFunc;
		this.initialized = true;
	}

	public createFields()
	{
		if(!this.initialized) {
			UtilsService.onError('Did you call initialize?');
			return;
		}

		// Initialize the insert column form
		// set all variables of the grabbed form.
		let index = 0;
		for (const [key, value] of Object.entries(this.columnData))
		{
			// value: T;
			// type: T;
			// id?: number;
			// key: string;
			// groupCss?: string;
			// inputCss?: string;
			// name: string;
			// text: string;
			// placeholder?: string;
			// errorText?: string;
			// required?: boolean;
			// disabled?: boolean;
			// readOnly: boolean;
			// required_text: string;
			// order: number;
			// controlType: NbControlTypes;
			// options?: Option<T>[];
			const column: Column = value;
			let field: FormField<any> = null;
			const idx = column.hasOwnProperty('index') ? column.index : index;
			switch (column.type)
			{
				case 'number':
					field = this.configureField<number>(key, column, 'number', 0, index);
					field.errorText = 'This field requires a minimal number of zero';
					this.source.fields[key] = field;
					break;
				case 'string':
				case 'html':
					if (column.hasOwnProperty('editor') && column.editor.hasOwnProperty('component'))
					{
						if (column.editor.component.name === 'BooleanColumnRenderComponent')
						{
							field = this.configureField<boolean>(key, column, 'dropdown', false, index);
							const b: boolean = field.value;
							field.options$ = new BehaviorSubject<Option<boolean>[]>([
								new Option<boolean>({
									key: 'false',
									value: false,
									selected: b === false,
								}),
								new Option<boolean>({key: 'true', value: true, selected: b === true}),
							]);

							this.source.fields[key] = field;
						}
					} else {
						field = this.configureField<string>(key, column, 'textbox','', index);
						field.validatorOrOpts = [
							Validators.minLength(1),
						];
						field.errorText = 'This field needs to be filled in';
						this.source.fields[key] = field;
					}
					break;
				case 'custom':
					if(column.hasOwnProperty('editor') && column.editor.hasOwnProperty('component'))
					{
						if(column.editor.component.name === 'LanguageColumnRenderComponent')
						{
							field = this.configureField<string>(key, column, 'textbox', '', index);
							field.validatorOrOpts = [
								Validators.minLength(1),
							];
							field.errorText = 'This field needs to be filled in';
							this.source.fields[key] = field;
							break;
						}

						field = this.customFunc ? this.customFunc(key, column, index) : null;
						this.source.fields[key] = field;
					} else {
						if(this.customFunc) {
							field = this.customFunc ? this.customFunc(key, column, index) : null;
							this.source.fields[key] = field;
						}
					}
					break;
			}
			index++;

			/*
			if (component)
			{
				const instance = component.instance;
				instance.parent = this.formComponent;
				this.configureComponent(key, column, instance);
				this.formComponent.addElement(instance);
				this.inputs.set(key, instance.question);

				// Generate the form
				this.insertFormContainer.add(instance.question);
				component.changeDetectorRef.detectChanges();
			}
 			*/
		}
	}

	public configureField<T extends string | number | boolean>(
		key: string, column: Column, type: NbControlTypes, defaultValue: T,
	index: number): FormField<T>
	{
		let value: T = null;
		if(this.data.hasOwnProperty(key))
		{
			// data is existing data we try to manipulate.
			if(column.type === 'number' || column.type === 'string' || column.type === 'html' || column.type === 'custom')
			{
				if(typeof defaultValue === 'string' && typeof this.data[key] === 'object')
					value = this.handleLanguageValue(this.data[key]) as T;
				else
					value = this.data[key];
			}
		}
		else if (column.hasOwnProperty('defaultValue'))
		{
			if( key === 'id' && this.data.hasOwnProperty(key))
			{
				value =  <T>this.data[key];
			}
			else {
				if(typeof defaultValue === 'string' && typeof column.defaultValue === 'object')
					value = this.handleLanguageValue(column.defaultValue) as T;
				else
					value = column.defaultValue as T;
			}
		}

		const editable = column.editable ?? true;
		return {
			index,
			value: value ?? defaultValue,
			name: column.title.toLowerCase(),
			controlType: type,
			readOnly: column.readonly ?? !!column.defaultValue,
			hidden: column.hidden,
			disabled: !editable,
			text: column.title,
			placeholder: column.title,
			required: true,
		};
	}

	private handleLanguageValue(data: KeyLanguageObject)
	{
		const languages = Object.keys(data);
		// Are we dealing with a language object
		if (systemLanguages.has(languages[0] as KeyLanguage))
		{
			return data['en'];
		}

		return '';
	}
}
