import {
	AfterViewInit,
	ChangeDetectorRef,
	Component, Input,
	OnInit, ViewChild,
} from '@angular/core';
import { NbDialogRef, NbStepComponent, NbToastrService } from '@nebular/theme';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { ProjectService } from '@app-core/data/projects.service';
import { Option } from '@app-core/data/forms/form-types';
import { ICharacter, IDialogue, IStory } from '@app-core/data/standard-tables';
import { UtilsService } from '@app-core/utils';
import { Table } from '@app-core/data/table';
import {
	ButtonFieldComponent,
	DropDownFieldComponent,
	DynamicFormComponent,
	TextFieldComponent,
} from '@app-theme/components/form';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { BehaviorSubject } from 'rxjs';

@Component({
	selector: ' ngx-insert-story',
	templateUrl: './insert-story.component.html',
	styles: [`
		nb-card {
			min-width: 500px;
		}
	`,
	],
})
export class InsertStoryComponent implements OnInit, AfterViewInit
{
	@Input()
	public characters: Table<ICharacter> = null;

	@Input()
	public stories: Table<IStory> = null;

	@Input()
	public dialogues: Table<IDialogue> = null;

	public get Ref(): NbDialogRef<InsertStoryComponent> { return this.ref; }

	public set Characters(characters: Table<ICharacter>)
	{
		this.characters = characters;
		if(this.characterList)
			this.characterList.question.options$.next(this.getCharacterOptions());
	}

	public set Dialogues(dialogues: Table<IDialogue>)
	{
		this.dialogues = dialogues;
		if(this.dialogueList)
			this.dialogueList.question.options$.next(this.getDialogueOptions());
	}

	// region Character form
	/* ----------------- Character form ------------------------- */

	@ViewChild('charFormComponent', { static: true })
	public charFormComponent: DynamicFormComponent = null;

	@ViewChild('characterList', { static: true })
	public characterList: DropDownFieldComponent = null;

	@ViewChild('characterName', { static: true })
	public characterName: TextFieldComponent = null;

	@ViewChild('charStepper', { static: true })
	public charStepper: NbStepComponent = null;

	@ViewChild('charStepBtn', { static: true })
	public charStepBtn: ButtonFieldComponent = null;

	public charSource: BaseFormSettings = {
		title: 'Character Form',
		alias: 'character-form',
		requiredText: 'Fill in all fields',
		fields: {},
	};

	// endregion

	// region Story form
	/* ----------------- Story form ------------------------- */

	@ViewChild('storyFormComponent', { static: true })
	public storyFormComponent: DynamicFormComponent = null;

	@ViewChild('storyTitle', { static: true })
	public storyTitle: TextFieldComponent = null;

	@ViewChild('storyDescription', { static: true })
	public storyDescription: TextFieldComponent = null;

	@ViewChild('storyCharacter', { static: true })
	public storyCharacter: TextFieldComponent = null;

	@ViewChild('storyStepper', { static: true })
	public storyStepper: NbStepComponent = null;

	@ViewChild('storyStepBtn', { static: true })
	public storyStepBtn: ButtonFieldComponent = null;

	public storySource: BaseFormSettings = {
		title: 'Story Form',
		alias: 'story-form',
		requiredText: 'Fill in all fields',
		fields: {},
	};

	// endregion

	// region Dialogue form
	/* ----------------- Dialogue form ------------------------- */

	public dialogueSource: BaseFormSettings = {
		title: 'Dialogue Form',
		alias: 'dialogue-form',
		requiredText: 'Fill in all fields',
		fields: {},
	};

	@ViewChild('dialogueFormComponent', { static: true })
	public dialogueFormComponent: DynamicFormComponent = null;

	@ViewChild('dialogueList', { static: true })
	public dialogueList: DropDownFieldComponent = null;

	@ViewChild('dialogueText', { static: true })
	public dialogueText: TextFieldComponent = null;

	@ViewChild('dialogueStepper', { static: true })
	public dialogueStepper: NbStepComponent = null;

	@ViewChild('dialogueStepBtn', { static: true })
	public dialogueStepBtn: ButtonFieldComponent = null;

	// endregion

	/* ----------------- Other ------------------------- */

	public title: string = 'New Project';
	public defaultValue: number = Number.MAX_SAFE_INTEGER;

	private story: IStory = {
		title: '',
		description: '',
		id: -1,
		deleted: false,
		parentId: Number.MAX_SAFE_INTEGER,
		childId: Number.MAX_SAFE_INTEGER,
		storyFile: '',
		typeId: Number.MAX_SAFE_INTEGER,
		taskId: Number.MAX_SAFE_INTEGER,
		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,
	}
	private character: ICharacter = {
		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,
		deleted: false,
		name: '',
		description: '',
	};
	private dialogue: IDialogue = {
		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,
		deleted: false,
		text: '',
		characterId: Number.MAX_SAFE_INTEGER,
		nextId: Number.MAX_SAFE_INTEGER,
		parentId: Number.MAX_SAFE_INTEGER,
	}

	constructor(
		protected ref: NbDialogRef<InsertStoryComponent>,
		protected toastrService: NbToastrService,
		protected firebaseService: FirebaseService,
		protected projectService: ProjectService,
		protected cd: ChangeDetectorRef)
	{

	}

	public ngOnInit(): void
	{
		this.dialogueFormComponent.showLabels = this.storyFormComponent.showLabels = this.charFormComponent.showLabels = true;
		this.initCharForm();
		this.initStoryForm();
		this.initDialogueForm();
	}

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public dismiss()
	{
		// TODO first create the story and pass it to the node editor
		// TODO create local storage for auto save feature
		// TODO validate the story
		this.createStory().then(() => this.ref.close(this.story));
	}

	/* ----------------- Character form ------------------------- */

	public addCharacter()
	{
		// TODO validate?
		this.characterList.setDisabledState(true);
		this.characterName.hidden = false;
		this.charStepBtn.setDisabledState(true);

	}

	public onNewCharacterChange(event: string)
	{
		this.character.name = event;
	}

	public onSelectCharacter(event: number)
	{
		this.story.parentId = event;

		// Set the character name to the second form
		const character: ICharacter = this.characters.find(this.story.parentId);
		this.storyFormComponent.formContainer.set(this.storyCharacter.question.key, character ? character.name : '');
	}

	public cancelInsertCharacter()
	{
		// TODO validate?
		this.characterList.setDisabledState(false);
		this.characterName.hidden = true;
		this.charStepBtn.setDisabledState(false);
	}

	public insertCharacter()
	{
		const tblName = `tables/${this.characters.id}`;
		this.firebaseService.insertData(tblName + '/data', this.character, tblName)
			.then((data) =>
				{
					UtilsService.showToast(
						this.toastrService,
						'Character inserted!',
						'Character has been successfully created',
					);

					if(data && typeof data === 'number') {
						this.story.parentId = data;
					}

					this.character.formContainer.set(this.characterList.question.key, this.story.parentId);

					setTimeout(() => this.dialogueList.selectComponent.selectedChange.emit(this.story.parentId), 500);

					this.characterList.setDisabledState(false);
					this.characterName.hidden = true;
					this.charStepBtn.setDisabledState(false);
				},
			);
	}

	protected getCharacterOptions(): Option<number>[]
	{
		const options: Option<number>[] = [];
		this.characters.filteredData.forEach((pObj) => options.push(
			new Option<number>({
				key: pObj.id + '. ' + UtilsService.truncate(pObj.name, 50),
				value: +pObj.id,
				selected: false,
			})),
		);

		return options;
	}

	/* ----------------- Story form ------------------------- */

	public onStoryTitleChanged(event: string)
	{
		this.story.title = event;
	}

	public onStoryDescriptionChanged(event: string)
	{
		this.story.description = event;
	}

	public createStory(): Promise<void|boolean>
	{
		const tblName = `tables/${this.stories.id}`;
		return this.firebaseService.insertData(tblName + '/data', this.story, tblName)
			.then((data) =>
				{
					UtilsService.showToast(
						this.toastrService,
						'Story created!',
						'Story has been successfully created',
					);

					if(data && typeof data === 'number') {
						this.story.id = data;
					}

					return Promise.resolve(true);
				},
			);
	}

	// region Dialogue form
	/* ----------------- Dialogue form ------------------------- */

	public addDialogue()
	{
		// TODO validate?
		this.dialogueList.setDisabledState(true);
		this.dialogueText.hidden = false;
		this.dialogueStepBtn.setDisabledState(true);
	}

	public onNewDialogueChanged(event: string)
	{
		this.dialogue.text = event;
	}

	public onDialogueSelected(event: number)
	{
		this.story.childId = event;
		this.dialogue.id = event;
	}

	public cancelDialogueCreation()
	{
		this.dialogueList.setDisabledState(false);
		this.dialogueText.hidden = true;
		this.dialogueStepBtn.setDisabledState(false);
		// TODO when this is pressed disable the next button of the stepper
		// TODO disable the list
		// TODO on insert send new request to the database
		// TODO maybe validate?
	}

	public insertDialogue()
	{
		const tblName = `tables/${this.dialogues.id}`;
		this.firebaseService.insertData(tblName + '/data', this.dialogue, tblName)
			.then((data) =>
				{
					UtilsService.showToast(
						this.toastrService,
						'Dialogue inserted!',
						'Dialogue has been successfully created',
					);

					// grab the latest id and store it in the story and in the dialogue
					if(data && typeof data === 'number') {
						this.story.childId = data;
						this.dialogue.id = data;
					}

					this.dialogueFormComponent.formContainer.set(this.dialogueList.question.key, this.dialogue.id);

					setTimeout(() => this.dialogueList.selectComponent.selectedChange.emit(this.dialogue.id), 500);

					this.dialogueList.setDisabledState(false);
					this.dialogueText.hidden = true;
					this.dialogueStepBtn.setDisabledState(false);
				},
			);
	}

	protected getDialogueOptions(): Option<number>[]
	{
		const options: Option<number>[] = [];
		this.dialogues.filteredData.forEach((pObj) => options.push(
			new Option<number>({
				key: pObj.id + '. ' + UtilsService.truncate(pObj.text, 50),
				value: +pObj.id,
				selected: false,
			})),
		);

		return options;
	}

	// endregion

	protected initCharForm()
	{
		if(this.characters && this.characters.filteredData.length)
		{
			const options: Option<number>[] = this.getCharacterOptions();

			// Character form
			this.charFormComponent.addInput(this.characterList, {
				value: Number.MAX_SAFE_INTEGER,
				text: 'Character',
				name: 'character',
				errorText: 'Choose a Character',
				required: true,
				controlType: 'dropdown',
				options$: new BehaviorSubject<Option<number>[]>(options),
				onSelectEvent: (event: number) => this.onSelectCharacter(event),
				onIconClickEvent: () => this.addCharacter(),
			});
		}

		this.charFormComponent.addInput(this.characterName, {
			value: '',
			text: 'Character name',
			name: 'character-name',
			errorText: 'Type in a Character',
			hidden: true,
			required: false,
			controlType: 'textbox',
			onKeyUpEvent: (event: string) => this.onNewCharacterChange(event),
		});

		this.charFormComponent.addInput(this.charStepBtn, {
			value: 'Next',
			text: 'Next step',
			name: 'nextStep',
			controlType: 'stepper',
		});

		this.charStepper.stepControl = this.charFormComponent.formContainer.form;
	}

	public initStoryForm()
	{
		this.storyFormComponent.addInput(this.storyTitle, {
			value: '',
			text: 'Story title',
			name: 'story-title',
			errorText: 'Type in a story',
			hidden: false,
			required: true,
			controlType: 'textbox',
			onKeyUpEvent: (event: string) => this.onStoryTitleChanged(event),
		});

		this.storyFormComponent.addInput(this.storyDescription, {
			value: '',
			text: 'Story description',
			name: 'story-description',
			errorText: 'Type in a description',
			hidden: false,
			required: true,
			controlType: 'textbox',
			onKeyUpEvent: (event: string) => this.onStoryDescriptionChanged(event),
		});

		this.storyFormComponent.addInput(this.storyCharacter, {
			value: '',
			text: 'Character name',
			name: 'character-name',
			errorText: 'No character found',
			hidden: false,
			required: true,
			readOnly: true,
			controlType: 'textbox',
		});

		this.storyFormComponent.addInput(this.storyStepBtn, {
			value: 'Next',
			text: 'Next step',
			name: 'nextStep',
			controlType: 'stepper',
		});

		this.storyStepper.stepControl = this.storyFormComponent.formContainer.form;
	}

	public initDialogueForm()
	{
		if(this.dialogues && this.dialogues.filteredData.length)
		{
			const options: Option<number>[] = this.getDialogueOptions();

			// Dialogue form
			this.dialogueFormComponent.addInput(this.dialogueList, {
				value: Number.MAX_SAFE_INTEGER,
				text: 'Dialogue',
				name: 'dialogue',
				errorText: 'Choose a dialogue',
				required: true,
				controlType: 'dropdown',
				options$: new BehaviorSubject<Option<number>[]>(options),
				onSelectEvent: (event: number) => this.onDialogueSelected(event),
				onIconClickEvent: () => this.addDialogue(),
			});
		}

		this.charFormComponent.addInput(this.dialogueText, {
			value: '',
			text: 'Dialogue',
			name: 'dialogue-text',
			errorText: 'Dialogue not filled in',
			hidden: true,
			required: false,
			controlType: 'textarea',
			onKeyUpEvent: (event: string) => this.onNewDialogueChanged(event),
		});

		this.dialogueFormComponent.addInput(this.dialogueStepBtn, {
			value: 'Next',
			text: 'Next step',
			name: 'nextStep',
			controlType: 'stepper',
		});

		this.dialogueStepper.stepControl = this.dialogueFormComponent.formContainer.form;
	}
}
