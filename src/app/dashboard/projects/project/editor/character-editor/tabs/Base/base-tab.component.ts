import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import { ICharacter } from '@app-core/data/database/interfaces';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { UserService } from '@app-core/data/state/users';
import { BaseSourceDataComponent } from '@app-core/components/firebase/base-source-data.component';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { Table, TablesService } from '@app-core/data/state/tables';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { InsertMultipleDialogComponent } from '@app-theme/components/firebase-table';
import { NbDialogConfig } from '@nebular/theme/components/dialog/dialog-config';
import { KeyLanguage, KeyLanguageObject } from '@app-core/data/state/node-editor/languages.model';
import { ProxyObject } from '@app-core/data/base';
import { DynamicFormComponent } from '@app-theme/components';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';

@Component({ template: '' })
export abstract class BaseTabComponent<T extends ProxyObject>
	extends BaseSourceDataComponent implements OnInit, OnDestroy
{
	@Input()
	public characters: Table<ICharacter> = null;

	public get charData(): ICharacter
	{
		return this.characterData;
	}

	public selectedObject: T = null;

	public defaultValue: number = Number.MAX_SAFE_INTEGER;

	public abstract formComponent: DynamicFormComponent;
	public abstract source: BaseFormSettings = null;

	protected characterData: ICharacter = null;

	protected mainSubscription: Subscription = new Subscription();

	protected selectedLanguage: KeyLanguage = 'en';

	protected constructor(
		protected firebaseService: FirebaseService,
		protected userService: UserService,
		protected projectsService: ProjectsService,

		protected route: ActivatedRoute,
		protected router: Router,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected dialogService: NbDialogService,
		protected userPreferencesService: UserPreferencesService,
		protected tableService: TablesService,
		protected firebaseRelationService: FirebaseRelationService,
		protected languageService: LanguageService,
		@Inject(String)protected tableId = '',
	) {
		super(route, router, toastrService, snackbarService, userService, userPreferencesService, projectsService,
			tableService, firebaseService, firebaseRelationService, languageService, tableId);
	}

	public ngOnDestroy(): void
	{
		// Unsubscribe to all table events
		this.mainSubscription.unsubscribe();
	}

	/**
	 * @brief - public access from the html.
	 */
	public getLanguageProperty(prop: KeyLanguageObject): string
	{
		return this.languageService.getLanguageFromProperty(prop, this.selectedLanguage);
	}

	public deleteSelected()
	{
		if(this.selectedObject)
			this.onDeleteConfirm({ data: this.selectedObject });
	}

	public onChangelogConfirm(event)
	{

	}

	public onActiveSelection(event: number)
	{
		this.selectedObject = null;
	}

	public addMultiple<C>(userConfig?: Partial<NbDialogConfig<Partial<C> | string>>)
	{
		const ref = this.dialogService.open(InsertMultipleDialogComponent, userConfig);

		// Otherwise scope will make this undefined in the method
		ref.componentRef.instance.insertEvent.subscribe((event: any) =>
			this.onCreateConfirm(event, this.tableId));
	}

	public onLanguageChange(event: KeyLanguage)
	{
		super.onLanguageChange(event);

		this.selectedLanguage = event;
		if(this.selectedObject !== null)
			this.onActiveSelection(this.selectedObject.id);
	}

	protected validate() { }
}
