import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input, OnDestroy,
	OnInit,
	Output,
	ViewChild,
} from '@angular/core';
import {
	ButtonFieldComponent,
	DynamicFormComponent,
} from '@app-theme/components/form';
import { NbDialogRef, NbDialogService, NbToastrService } from '@nebular/theme';
import { InsertTeamMemberComponent } from '@app-theme/components/firebase-table/insert-team-member/insert-team-member.component';
import { BaseSettings } from '@app-core/mock/base-settings';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { UserService } from '@app-core/data/state/users';
import { FirebaseRelationService } from '@app-core/utils/firebase-relation.service';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { Revision } from '@app-core/data/state/tables';
import { TablesService } from '@app-core/data/state/tables';

import { IUserTicket, Roles, UserModel } from '@app-core/data/state/users';
import { Project } from '@app-core/data/state/projects';
import { Subscription } from 'rxjs';
import isEqual from 'lodash.isequal';
import isEmpty from 'lodash.isempty';
import intersection from 'lodash.intersection';

@Component({
	selector: 'ngx-change-project-settings-dialog',
	templateUrl: './change-project-settings.component.html',
	styleUrls:['./change-project-settings.component.scss'],
	// styleUrls: ['./change-table-settings.component.scss'],
})
export class ChangeProjectSettingsComponent implements
	OnInit, AfterViewInit, OnDestroy
{
	@ViewChild('submitQuestion', { static: true })
	public submitQuestion: ButtonFieldComponent = null;

	@ViewChild(DynamicFormComponent, { static: true })
	private formComponent: DynamicFormComponent = null;

	@Input()
	public project: Project = null;

	@Input()
	public user: UserModel = null;

	@Input()
	public settings: BaseSettings = new BaseSettings();

	@Output()
	public onToggleEvent: EventEmitter<{ key: string, value: boolean }> =
		new EventEmitter<{ key: string, value: boolean }>();

	@Output()
	public onInsertAccept: Function | null = (): boolean => true;

	@Output()
	public onInsertRejected: Function | null = (): boolean => true;

	public get isAdmin()
	{
		return this.userService.isAdmin;
	}

	public source: BaseFormSettings = {
		title: 'Project Settings',
		alias: 'project-settings',
		requiredText: 'Settings',
		fields: {},
	};

	public invites: IUserTicket[] = [];

	public get revisions(): Map<string, Revision> {
		return new Map<string, Revision>();
	}

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();

	protected columns: Map<string, any> = new Map<string, any>();

	constructor(
		protected ref: NbDialogRef<ChangeProjectSettingsComponent>,
		protected dialogService: NbDialogService,
		protected toastrService: NbToastrService,
		protected tablesService: TablesService,
		protected userService: UserService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected cd: ChangeDetectorRef,
	) { }

	public ngOnInit(): void
	{
		const columns = Object.entries(this.settings.columns);

		// only include hidden values that we can see
		this.columns = new Map(columns.filter((item: [string, any] ) =>
		{
			if(this.userService.isAdmin)
				return true;

			return (
				// if this is the deleted or tstamp column hide it.
				(item[0] === 'deleted' || item[0] === 'created_at' || item[0] === 'updated_at') && this.userService.isAdmin
				// if we are not admin and it is not the deleted or timestamp column show it.
				|| this.userService.isAdmin === false
			)
		}));

		for(const [key, value] of this.columns)
		{
			this.source.fields[key] = {
				value: value.hidden,
				name: value.title.toLowerCase(),
				controlType: 'checkbox',
				// readOnly: !!column.defaultValue,
				// hidden: column.hidden,
				text: 'Hide/Unhide - ' + value.title,
				placeholder: value.title,
				required: true,
				onSelectEvent: (event: any) => this.OnToggle(event),
			};
		}

		this.mainSubscription.add(this.userService.getUser().subscribe((user) =>
		{
			this.user = user;
			this.firebaseService.getRef('projectRequests').orderByChild('uid')
				.equalTo(user.uid).on('value', result =>
				{
					if(result.exists())
					{
						const data: { [key: string]: IUserTicket } = result.val();
						for (const key of Object.keys(data))
						{
							if(this.invites.find((i) => isEqual(i, data[key])))
								continue;

							this.invites.push(data[key]);
						}
					}
				});
			}),
		);
	}

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public ngOnDestroy(): void
	{
		this.mainSubscription.unsubscribe();
		this.firebaseService.getRef('projectRequests').off();
	}

	public hasRole(allowedRoles: string[], roles: Roles)
	{
		if(!roles)
			return false;

		const userRoles = Object.keys(roles);
		return !isEmpty(intersection(allowedRoles, userRoles));
	}

	public OnToggle(event: any)
	{
		this.onToggleEvent.emit({ key: event.key, value: event.value });
	}

	public inviteMember()
	{
		this.dialogService.open(InsertTeamMemberComponent, {
			context: {
				project: this.project,
				user: this.user,
			},
		});
	}

	public save(i: number)
	{
		const invite = this.invites[i];
		if(invite && invite.pending)
		{
			this.firebaseService.updateInvite(invite);
			return;
		}

		this.firebaseService.updateRoles(invite);
	}

	public onEditConfirm(event: any)
	{
	}

	public onDeleteConfirm(event: any)
	{
	}

	public onSendForm()
	{

	}

	public dismiss()
	{
		this.ref.close();
	}
}
