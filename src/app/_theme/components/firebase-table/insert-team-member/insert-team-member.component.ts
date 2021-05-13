import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild } from '@angular/core';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap, map, startWith } from 'rxjs/operators';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { ButtonFieldComponent, DynamicFormComponent, TextFieldComponent } from '@app-theme/components/form';
import { Option } from '@app-core/data/forms/form-types';
import { NbDialogRef } from '@nebular/theme';
import { IFoundAbleUser, IUserTicket, User } from '@app-core/data/state/users';
import { Project } from '@app-core/data/state/projects';

@Component({
	selector: 'ngx-insert-member',
	templateUrl: './insert-team-member.component.html',
	styles:[
		`
			nb-card {
				min-width: 700px;
				max-width: 1000px;
				max-height: 800px;
			}
		`,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsertTeamMemberComponent implements OnInit
{
	selectedOptions: IFoundAbleUser[] = [];

	@Input()
	public project: Project = null;

	@Input()
	public user: User = null;

	@ViewChild('memberTextField', { static: true })
	public memberTextField: TextFieldComponent = null;

	@ViewChild('submitQuestion', { static: true })
	public submitQuestion: ButtonFieldComponent = null;

	public source: BaseFormSettings = {
		title: 'Invite Team Member',
		alias: 'invite-team-member',
		requiredText: 'Settings',
		fields: {},
	};

	@ViewChild(DynamicFormComponent, { static: true })
	private formComponent: DynamicFormComponent = null;

	private response: { users: IFoundAbleUser[] } = null;

	public constructor(
		protected ref: NbDialogRef<InsertTeamMemberComponent>,
		protected firebaseService: FirebaseService,
	) { }

	public ngOnInit(): void
	{
		const control = this.formComponent.addInput<string>(this.memberTextField, {
			placeholder: 'Enter team member',
			controlType: 'autocomplete',
			value: '',
			name: 'field',
			text: 'Field',
			required: false,
			onSelectEvent: (event) => this.onUserSelected(event),
		});

		this.memberTextField.assignPipe = control.valueChanges
			.pipe(
				debounceTime(500),
				startWith<string | Option<IFoundAbleUser>, string>(String('')),
				switchMap<any, Observable<{ users: IFoundAbleUser[] }>>(value =>
					{
						// TODO when more users enter we need to refresh the list
						if(this.response)
						{
							const users = this.response.users.filter(user => value !== '' && user.email.toLowerCase().includes(value))
							return of({ users: users});
						}
						else
							return this.firebaseService.search();
					},
				),
				map((value: { users: IFoundAbleUser[] }) =>
				{
					if(!this.response)
						this.response = value;

					const selection: Option<IFoundAbleUser>[] = [];
					value.users.forEach((user) => selection.push(new Option(
					{ key: user.email, value: { email: user.email, displayName: user.displayName }, selected: false },
					),
				));
				return selection;
			}),
		);

		this.formComponent.addInput(this.submitQuestion, {
			name: 'send-btn',
			text: 'Send-btn',
			value: 'Send',
			controlType: 'button',
		});
	}

	public dismiss()
	{
		this.ref.close();
	}

	public onSendForm()
	{
		this.selectedOptions.forEach((option) => {
			this.firebaseService.insert(
					<IUserTicket>{
						...option,
						projectID: this.project.id, token: 'random_token',
						uid: this.user.uid,
						title: this.project.metadata.title,
						roles: { reader: true },
					}, 'projectRequests',
				).then(() => this.ref.close());
		});
	}

	public viewHandle(value: string)
	{
		return value;
	}

	public onUserSelected(event: string | IFoundAbleUser)
	{
		if(event === '')
			return;

		if(!this.selectedOptions.find((option) => (<IFoundAbleUser>event).email === option.email))
			this.selectedOptions.push(<{email, displayName}>event);

		this.memberTextField.control.setValue('');
	}

	public removeMember(index: number)
	{
		this.selectedOptions.splice(index, 1);
	}
}
