import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnInit,
	OnDestroy,
	Output,
	ViewChild,
} from '@angular/core';
import { Option } from '@app-core/data/forms/form-types';
import { BehaviourType } from '@app-core/types';
import {
	ButtonFieldComponent,
	DropDownFieldComponent,
	DynamicFormComponent, CheckboxFieldComponent,
} from '@app-theme/components/form';
import { IBehaviour } from '@app-core/interfaces/behaviour.interface';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { Table, TablesService } from '@app-core/data/state/tables';
import { IItem, IItemType } from '@app-core/data/standard-tables';
import { Project } from '@app-core/data/state/projects';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
	selector: 'ngx-insert-trait-dialog',
	templateUrl: './insert-trait.component.html',
	// styleUrls: ['./insert-trait.component.scss'],
})
export class InsertTraitComponent implements OnInit, AfterViewInit, OnDestroy, IBehaviour
{
	@Input()
	public project: Project = null;

	@Input()
	public items: Table<IItem> = null;

	@Input()
	public itemTypes: Table<IItemType> = null;

	@Input()
	public behaviourType$: BehaviorSubject<BehaviourType> = new BehaviorSubject(BehaviourType.INSERT);

	@Input()
	public behaviourType: BehaviourType = BehaviourType.INSERT;

	@Output()
	public saveEvent: EventEmitter<any> = new EventEmitter<any>();

	@Output()
	public closeEvent: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild('itemTypeListQuestion', { static: true })
	public itemTypeListQuestion: DropDownFieldComponent = null;

	@ViewChild('itemListQuestion', { static: true })
	public itemListQuestion: DropDownFieldComponent<number> = null;

	@ViewChild('submitQuestion', { static: true })
	public submitQuestion: ButtonFieldComponent = null;

	@ViewChild('checkboxQuestion', { static: true })
	public checkboxQuestion: CheckboxFieldComponent = null;

	public source: BaseFormSettings = {
		title: 'Insert Trait',
		alias: 'insert-trait',
		requiredText: 'Fill in all fields',
		fields: {},
	};

	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	protected mainSubscription: Subscription = new Subscription();

	constructor(
		protected tablesService: TablesService,
		protected cd: ChangeDetectorRef,
	) { }

	public ngOnInit()
	{
		this.formComponent.showLabels = true;

		this.behaviourType$.subscribe((type: BehaviourType) =>
		{
			// TODO reset the form
			this.behaviourType = type;
			this.changeTitle();
			this.generateForm();
		});

		// Item type Dropdown question
		this.formComponent.addInput<number>(this.itemTypeListQuestion, {
			value: Number.MAX_SAFE_INTEGER,
			text: 'Item Type',
			name: 'item-type',
			errorText: 'Choose an option',
			required: true,
			controlType: 'dropdown',
			options$: new BehaviorSubject<Option<number>[]>([]),
		});

		// Items dropdown question.
		this.formComponent.addInput<number>(this.itemListQuestion, {
			value: Number.MAX_SAFE_INTEGER,
			text: 'Item Equipment',
			name: 'item-equipment',
			placeholder: 'Item Equipment',
			errorText: 'Select item equipment',
			required: true,
			controlType: 'dropdown',
			disabled: true,
			options$: new BehaviorSubject<Option<number>[]>([]),
		});


		// Custom adding a submit button. This is normally not needed.
		this.formComponent.addInput<string>(this.submitQuestion, {
			name: 'send-btn',
			text: 'Send-btn',
			value: 'Send',
			controlType: 'submitbutton',
		});

		this.formComponent.addInput<boolean>(this.checkboxQuestion, {
			value: false,
			name: 'r-one',
			groupCss: 'd-inline-block align-text-top',
			text: 'Create another',
			controlType: 'checkbox',
		});

		// Initialize the insert column form
		// set all variables of the grabbed form.
		this.generateForm();
	}

	public ngAfterViewInit()
	{
		this.cd.detectChanges();
	}

	public ngOnDestroy(): void
	{
		this.mainSubscription.unsubscribe();
	}

	public onSendForm()
	{
		// If the form is valid
		if(this.formComponent.isValid)
		{
			const val = this.formComponent.formContainer.toGroup().value;
			const hasItemTypeValue = val[this.itemTypeListQuestion.question.key];
			const hasItemListValue = val[this.itemListQuestion.question.key];

			switch(this.behaviourType)
			{
				case BehaviourType.INSERT:
				{
					this.saveEvent.emit({
							newData: { typeId: hasItemTypeValue, item: hasItemListValue },
							type: this.behaviourType,
					});
					if(val[this.checkboxQuestion.question.key])
						this.formComponent.reset();
					else
						this.closeEvent.emit();
				}
					break;
				case BehaviourType.UPDATE:
				{

				}
					break;
				case BehaviourType.DELETE:
				{
				}
					break;
			}
		}
	}

	public dismiss()
	{
		this.closeEvent.emit();
	}

	public onItemTypeSelected(event: any)
	{
		this.itemListQuestion.setValue = Number.MAX_SAFE_INTEGER;

		const options: Option<number>[] = [];
		this.items.forEach((item: IItem) =>
		{
			if(item.typeId === this.itemTypeListQuestion.value)
				options.push(new Option({ key: item.name['en'], value: item.id, selected: false }));
		});
		this.itemListQuestion.question.options$.next(options);
		// when we select an item type we need to load the options
		// for the other list.
		this.itemListQuestion.disabled$.next(false);
	}

	protected changeTitle()
	{
		switch (this.behaviourType)
		{
			case BehaviourType.INSERT:
				this.source.title = 'Insert';
				this.formComponent.formContainer.set(this.submitQuestion.question.key,'Insert column');
				break;
			case BehaviourType.UPDATE:
				this.source.title = 'Update';
				this.formComponent.formContainer.set(this.submitQuestion.question.key,'Update column');
				break;
			case BehaviourType.DELETE:
				this.source.title = 'Delete';
				this.formComponent.formContainer.set(this.submitQuestion.question.key,'Delete column');
				break;
			default:
				break;
		}
	}

	protected generateForm()
	{
		switch(this.behaviourType)
		{
			case BehaviourType.INSERT:
			{
				if(this.project)
				{
					const options: Option<number>[] = [
						new Option({ key: 'None', value: Number.MAX_SAFE_INTEGER, selected: true }),
					];
					this.itemTypes.forEach((item) => {
						options.push(new Option({ key: item.name['en'], value: item.id, selected: false }));
					});
					this.itemTypeListQuestion.question.options$.next(options);
				}

				this.formComponent.reset();
			}
				break;
			case BehaviourType.UPDATE:
			{

					this.formComponent.reset();
			}
			break;
		}
	}
}
