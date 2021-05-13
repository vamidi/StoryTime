import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { IBehaviour } from '@app-core/interfaces/behaviour.interface';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { TablesService } from '@app-core/data/state/tables';
import { InsertMultipleDialogComponent } from '@app-theme/components/firebase-table/insert-multiple-items/insert-multiple-dialog.component';

@Component({
	selector: 'ngx-add-items-dialog',
	templateUrl: './insert-items-dialog.component.html',
	styleUrls: [
		'../insert-multiple-items/insert-multiple-dialog.component.scss',
	],
})
export class InsertItemsDialogComponent extends InsertMultipleDialogComponent implements
	OnInit, AfterViewInit, IBehaviour, OnDestroy
{
	constructor(
		protected ref: NbDialogRef<InsertItemsDialogComponent>,
		protected firebaseService: FirebaseService,
		protected tableService: TablesService,
		protected cd: ChangeDetectorRef)
	{
		super(ref, firebaseService, tableService, cd);
	}

	public ngOnInit()
	{
		super.ngOnInit();

		// Item details
		if(this.settings.columns.hasOwnProperty('description'))
			this.Source.fields['description'].controlType = 'textarea';
	}

}
