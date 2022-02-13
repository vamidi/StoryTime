import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BaseFormSettings, FormField } from '../../_core/mock/base-form-settings';
import { Option } from '../../_core/data/forms/form-types';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
	ButtonFieldComponent,
	DropDownFieldComponent,
	DynamicFormComponent,
	TextFieldComponent,
} from '../../_theme/components';
import { ElectronService } from '../../_core/utils/electron.service';
import { IEnvironment, Provider } from '../../_core/interfaces/environment.interface';
import { environment } from '../../../environments/environment';
import { UserPreferencesService } from '../../_core/utils/user-preferences.service';
import { UserPreferences } from '../../_core/utils/utils.service';
import { NbStepperComponent } from '@nebular/theme';
import { Router } from '@angular/router';


@Component({
	selector: 'ngx-intro',
	templateUrl: './intro.component.html',
	styleUrls: ['./intro.component.scss'],
})
export class IntroComponent implements OnInit, OnDestroy
{
	@ViewChild('stepper')
	public stepper: NbStepperComponent;

	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('providerQuestion', { static: true })
	public listQuestion: DropDownFieldComponent = null;

	@ViewChild('localServerQuestion', { static: true })
	public localServerQuestion: DropDownFieldComponent = null;

	@ViewChild('nextQuestion', { static: true })
	public nextBtnQuestion: ButtonFieldComponent = null;

	@ViewChild('apiKey', { static: true })
	public apiKeyQuestion: TextFieldComponent<string> = null;

	@ViewChild('authDomain', { static: true })
	public authDomainQuestion: TextFieldComponent<string> = null;

	@ViewChild('databaseURL', { static: true })
	public databaseURLQuestion: TextFieldComponent<string> = null;

	@ViewChild('projectId', { static: true })
	public projectIdQuestion: TextFieldComponent<string> = null;

	@ViewChild('storageBucket', { static: true })
	public storageBucketQuestion: TextFieldComponent<string> = null;

	@ViewChild('messagingSenderId', { static: true })
	public messagingSenderIdQuestion: TextFieldComponent<string> = null;

	@ViewChild('appId', { static: true })
	public appIdQuestion: TextFieldComponent<string> = null;

	public get IntroSet() { return this.userPreferences.introSet }

	public source: BaseFormSettings = {
		title: 'Insert Trait',
		alias: 'insert-trait',
		requiredText: 'Fill in all fields',
		fields: {},
	};

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();
	protected userPreferences: UserPreferences = null;

	private textFields: FormField<string>[] = [
		{
			value: '',
			text: 'Api key',
			name: 'api-key',
			errorText: 'Fill in an api key',
			required: true,
			controlType: 'textbox',
		},
		{
			value: '',
			text: 'Auth Domain',
			name: 'auth-domain',
			errorText: 'Fill in the auth domain',
			required: true,
			controlType: 'textbox',
		},
		{
			value: '',
			text: 'Database URL',
			name: 'database-url',
			errorText: 'Fill in a database url',
			required: true,
			controlType: 'textbox',
		},
		{
			value: '',
			text: 'Project id',
			name: 'project id',
			errorText: 'Fill in a project id',
			required: true,
			controlType: 'textbox',
		},
		{
			value: '',
			text: 'Storage bucket',
			name: 'storage-bucket',
			errorText: 'Fill in the storage bucket',
			required: true,
			controlType: 'textbox',
		},
		{
			value: '',
			text: 'Messaging sender id',
			name: 'messaging-sender-id',
			errorText: 'Fill in the sender id',
			required: true,
			controlType: 'textbox',
		},
		{
			value: '',
			text: 'App ID',
			name: 'app-id',
			errorText: 'Fill in an app id',
			required: true,
			controlType: 'textbox',
		},
	];

	private config: IEnvironment = environment;

	public constructor(
		private router: Router,
		protected electronService: ElectronService,
		protected userPreferencesService: UserPreferencesService,
	) {}

	public ngOnInit()
	{
		this.mainSubscription.add(
			this.userPreferencesService.getUserPreferences().subscribe((userPreferences: UserPreferences) => {
				this.userPreferences = { ...userPreferences };
			}),
		);

		if(this.electronService.isElectron)
			this.electronService.ipcRenderer.on('setConfig', (event, args) => this.onConfigSet());

		this.formComponent.showLabels = true;
		// Dropdown question
		this.formComponent.addInput<string>(this.listQuestion, {
			value: 'firebase',
			text: 'Provider',
			name: 'provider',
			errorText: 'Choose an option',
			required: true,
			controlType: 'dropdown',
			options$: new BehaviorSubject<Option<string>[]>([
				new Option<string>({ key: 'Firebase', value: 'firebase', selected: false }),
				new Option<string>({ key: 'SQLite', value: 'prisma', selected: false }),
				new Option<string>({ key: 'PostreSQL', value: 'prisma', selected: false }),
				new Option<string>({ key: 'MySQL', value: 'prisma', selected: false }),
				new Option<string>({ key: 'MongoDB', value: 'prisma', selected: false, disabled: true }),
			]),
		});

		// Dropdown question
		this.formComponent.addInput<boolean>(this.localServerQuestion, {
			value: true,
			text: 'Server',
			name: 'server',
			errorText: 'Choose an option',
			required: true,
			controlType: 'dropdown',
			options$: new BehaviorSubject<Option<boolean>[]>([
				new Option<boolean>({ key: 'Local', value: true, selected: false }),
				new Option<boolean>({ key: 'Server', value: false, selected: false }),
			]),
		});

		this.formComponent.addInputs<string>([
			this.apiKeyQuestion,
			this.authDomainQuestion,
			this.databaseURLQuestion,
			this.projectIdQuestion,
			this.storageBucketQuestion,
			this.messagingSenderIdQuestion,
			this.appIdQuestion,
		], this.textFields);

		this.formComponent.addInput<string>(this.nextBtnQuestion, {
			name: 'next-step',
			text: 'Next step',
			value: 'nextStep',
			controlType: 'submitbutton',
		});
	}

	public ngOnDestroy()
	{
		this.mainSubscription.unsubscribe();

		if(this.electronService.isElectron)
			this.electronService.ipcRenderer.off('setConfig', (event, args) => this.onConfigSet());
	}

	public sendForm()
	{
		if(this.formComponent.isValid)
		{
			const provider: Provider = this.formComponent.formContainer.get(this.listQuestion.key).value ?? 'firebase';
			const apiKey = this.formComponent.formContainer.get(this.apiKeyQuestion.key).value ?? '';
			const authDomain = this.formComponent.formContainer.get(this.authDomainQuestion.key).value ?? '';
			const projectId = this.formComponent.formContainer.get(this.projectIdQuestion.key).value ?? '';
			const storageBucket = this.formComponent.formContainer.get(this.storageBucketQuestion.key).value ?? '';
			const messagingSenderId = this.formComponent.formContainer.get(this.messagingSenderIdQuestion.key).value ?? '';
			const appId = this.formComponent.formContainer.get(this.appIdQuestion.key).value ?? '';

			// Whether to use a local server or production ready server.
			this.userPreferences.localServer = this.formComponent.formContainer.get(this.localServerQuestion.key).value ?? false;

			if(provider === 'firebase')
			{
				const databaseURL = this.formComponent.formContainer.get(this.databaseURLQuestion.key).value ?? '';

				this.config.firebase = {
					apiKey,
					authDomain,
					databaseURL,
					projectId,
					storageBucket,
					messagingSenderId,
					appId,
				}
			}

			if(provider === 'prisma')
			{
				this.config.prisma = {
					apiKey,
					authDomain,
					projectId,
					storageBucket,
					messagingSenderId,
					appId,
				}
			}

			if(this.electronService.isElectron)
				this.electronService.ipcRenderer.send('saveConfig', this.config);

			// TODO.. hack until update from Nebular.
			this.stepper.next(); // call next step
		}
	}

	public onConfigSet() {
		this.userPreferences.introSet = true;
		this.userPreferences.localServer = true;
		this.userPreferencesService.setUserPreferences(this.userPreferences);
		this.router.navigate(['/auth/login']).then(() => {
			if(this.userPreferences.localServer && this.electronService.isElectron) this.electronService.ipcRenderer.send('startServer');
		})
	}
}
