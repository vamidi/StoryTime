import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { UserModel } from '@app-core/data/users';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { UserService } from '@app-core/data/users.service';
import { ButtonFieldComponent, DynamicFormComponent, TextFieldComponent } from '@app-theme/components';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';

@Component({
	selector: 'ngx-profile',
	templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit, AfterViewInit
{
	@ViewChild('displayNameField', { static: true })
	public displayNameQuestion: TextFieldComponent = null;

	@ViewChild('emailField', { static: true })
	public emailQuestion: TextFieldComponent = null;

	@ViewChild(DynamicFormComponent, { static: true })
	private formComponent: DynamicFormComponent = null;

	@ViewChild('submitQuestion', { static: true })
	public submitQuestion: ButtonFieldComponent = null;

	public get isEmailVerified()
	{
		return this.userService.isVerified;
	}

	public source: BaseFormSettings = {
		title: 'Insert',
		alias: 'insert-new-profile',
		requiredText: 'Fill in all fields',
		fields: {},
	};

	public user: UserModel = new UserModel();

	constructor(
		protected cd: ChangeDetectorRef,
		protected firebaseService: FirebaseService,
		protected userService: UserService) { }

	public ngOnInit(): void
	{
		this.formComponent.addInput(this.displayNameQuestion, {
			value: this.user.metadata.displayName,
			text: 'Display Name',
			name: 'display-name',
			placeholder: 'Enter your display name',
			errorText: 'This field is required',
			required: true,
			controlType: 'textbox',
			// TODO async to check if name already exist
			// onKeyUp: (event: any) => this.onTableKeyUp(event);
		});

		this.formComponent.addInput(this.emailQuestion, {
			value: '',
			text: 'Email',
			name: 'email',
			placeholder: 'Enter a valid email address',
			errorText: 'This field is required',
			required: true,
			controlType: 'textbox',
			// onKeyUp: (event: any) => this.onTableKeyUp(event);
		});

		this.formComponent.addInput<string>(this.submitQuestion, {
			name: 'submit',
			text: 'Submit-btn',
			value: 'Submit',
			controlType: 'submitbutton',
		});

		this.userService.getUser().subscribe((obsUser: UserModel) =>
		{
			if(obsUser)
			{
				this.user = obsUser;

				if(this.user )
				{
					this.formComponent.formContainer.set(this.displayNameQuestion.question.key, this.user.metadata.displayName);
					this.formComponent.formContainer.set(this.emailQuestion.question.key, this.user.metadata.email);

					this.formComponent.formContainer.markDirty();
				}

				// console.log(obsUser);
			}
		});
	}

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public onSendForm()
	{
		const val = this.formComponent.formContainer.value;
		if(this.formComponent.isValid)
		{
			const field0 = val?.nieuw_veld0;
			// set the display name
			if(field0)
			{
				this.user.metadata.displayName = field0;
			}

			// this.firebaseService.updateUser(this.user);
		}
	}

	public resendMail()
	{
		this.userService.resendMail();
	}
}
