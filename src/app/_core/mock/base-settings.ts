import { Type } from '@angular/core';
import { DateColumnComponent } from '@app-theme/components/base-table-layout/base-date-column.component';
import { BooleanColumnRenderComponent, LinkRenderComponent } from '@app-theme/components/render-column-layout';
import { DefaultEditor, ViewCell } from '@vamidicreations/ng2-smart-table';

export interface Column {
	title: string,
	type?: string,

	index?: number,

	width?: string,
	class?: string,

	defaultValue?: any,

	addable?: boolean,

	editable?: boolean,
	filter?: boolean,
	hidden?: boolean,

	editor?: {
		type?: 'custom',
		component?: Type<DefaultEditor>,
		data?: any,
		config?: any,
	},
	renderComponent?: Type<ViewCell>,
	onComponentInitFunction?: (instance: ViewCell) => void,
	valuePrepareFunction?: (cell , row) => string,
}

export interface ISettings
{
	mode?: 'inline' | 'external';
	selectMode?: string;
	noDataMessage?: string;
	actions?: {
		add?: boolean,
		edit?: boolean,
		delete?: boolean,
		position?: 'left' | 'right',
		width?: string,
		custom?: {name: string, title: string}[],
	};
	add?: {
		addButtonContent?: string,
		createButtonContent?: string,
		cancelButtonContent?: string,
		confirmCreate?: boolean,
		width?: string,
	};
	edit?: {
		editButtonContent?: string,
		saveButtonContent?: string,
		cancelButtonContent?: string,
		confirmSave?: boolean,
		width?: string,
	},
	delete?: {
		deleteButtonContent?: string,
		confirmDelete?: boolean,
		width?: string,
	};
	columns: { [key: string]: Column };
}

export class BaseSettings implements ISettings
{
	mode?: 'inline' | 'external' = 'inline'; /* external */
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
	columns: { [key: string]: Column } = {
		id: {
			title: 'ID',
			type: 'number',
			editable: false,
			addable: false,
			width: '50px',
			filter:false,
			hidden: false,
			defaultValue: Number.MAX_SAFE_INTEGER,
		},
		deleted: {
			title: 'Deleted',
			type: 'string',
			editable: false,
			addable: false,
			filter:false,
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
			filter:false,
			hidden: true,
			defaultValue: Math.floor(Date.now() / 1000),
		},
		updated_at: {
			title: 'Date Modified',
			type: 'custom',
			renderComponent: DateColumnComponent,
			editable: false,
			addable: false,
			filter:false,
			hidden: true,
			defaultValue: Math.floor(Date.now() / 1000),
		},
	};
}
