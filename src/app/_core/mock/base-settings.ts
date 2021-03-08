import { DateColumnComponent } from '@app-theme/components/base-table-layout/base-date-column.component';
import { BooleanColumnRenderComponent } from '@app-theme/components/render-column-layout';

export interface Column<T> {
	title: string,
	type: string,
	editable: boolean,
	addable: boolean,
	width: string,
	defaultValue: T,
}

export class BaseSettings
{
	mode?: string = 'inline'; /* external */
	selectMode?: string = ''; // 'multi';
	noDataMessage?: string = 'No items found'; // default: -> 'No data found'
	actions?: any = {
		add: false,
		edit: true,
		delete: true,
		position: 'right',
		/*
		width: '100px',
		custom: [
			{
				name: 'changelog',
				title: '<i class="nb-list" title="Changelog" style="height: 100%"></i>',
			},
		],
		*/
	};
	add?: any = {
		addButtonContent: '<i class="nb-plus"></i>',
		createButtonContent: '<i class="nb-checkmark"></i>',
		cancelButtonContent: '<i class="nb-close"></i>',
		confirmCreate: true,
		width: '50px',
	};
	edit?: any = {
		editButtonContent: '<i class="nb-edit"></i>',
		saveButtonContent: '<i class="nb-checkmark"></i>',
		cancelButtonContent: '<i class="nb-close"></i>',
		confirmSave: true,
		width: '50px',
	};
	delete?: any = {
		deleteButtonContent: '<i class="nb-trash"></i>',
		confirmDelete: true,
		width: '50px',
	};
	columns: any = {
		id: {
			title: 'ID',
			type: 'number',
			editable: false,
			addable: false,
			width: '50px',
			hidden: false,
			defaultValue: Number.MAX_SAFE_INTEGER,
		},
		deleted: {
			title: 'Deleted',
			type: 'string',
			editable: false,
			addable: false,
			hidden: true,
			defaultValue: false,
			editor: {
				type: 'custom',
				component: BooleanColumnRenderComponent,
			},
		},
		created_at: {
			title: 'Date Created',
			type: 'custom',
			renderComponent: DateColumnComponent,
			editable: false,
			addable: false,
			hidden: true,
			defaultValue: Math.floor(Date.now() / 1000),
		},
		updated_at: {
			title: 'Date Modified',
			type: 'custom',
			renderComponent: DateColumnComponent,
			editable: false,
			addable: false,
			hidden: true,
			defaultValue: Math.floor(Date.now() / 1000),
		},
	};
}
