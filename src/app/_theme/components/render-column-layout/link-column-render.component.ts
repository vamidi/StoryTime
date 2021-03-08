import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnDestroy,
	OnInit,
	ViewChild,
} from '@angular/core';
import { DefaultEditor, ViewCell } from '@vamidicreations/ng2-smart-table';
import { ActivatedRoute, Router } from '@angular/router';


// obj[column.key] = '<a href="/dashboard/projects/' + key + '">' + value.metadata[column.key] + '</a>';

@Component({
	template: `<a [routerLink]="" (click)="goTo()">{{ value }}</a>`,
})
export class LinkRenderComponent implements ViewCell, OnInit, AfterViewInit, OnDestroy
{
	@Input()
	public rowData: any;

	@Input()
	public value: string | number;

	public url: string = '/';

	constructor(
		protected activatedRoute: ActivatedRoute,
		protected router: Router,
		private cd: ChangeDetectorRef,
	) {}

	ngOnInit(): void { }

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public ngOnDestroy(): void
	{
	}

	public goTo()
	{
		if(this.rowData.hasOwnProperty('id'))
		{
			this.router.navigate([this.url, this.rowData.id], {relativeTo: this.activatedRoute}).then();
			return;
		}
		this.router.navigate([this.url], { relativeTo: this.activatedRoute }).then();
	}
}

@Component({
	template: `
    Name: <input [ngClass]="inputClass"
            #name
            class="form-control short-input"
            [name]="cell.getId()"
            [disabled]="!cell.isEditable()"
            [placeholder]="cell.getTitle()"
            (click)="onClick.emit($event)"
            (keyup)="updateValue()"
            (keydown.enter)="onEdited.emit($event)"
            (keydown.esc)="onStopEditing.emit()"><br>
    Url: <input [ngClass]="inputClass"
            #url
            class="form-control short-input"
            [name]="cell.getId()"
            [disabled]="!cell.isEditable()"
            [placeholder]="cell.getTitle()"
            (click)="onClick.emit($event)"
            (keyup)="updateValue()"
            (keydown.enter)="onEdited.emit($event)"
            (keydown.esc)="onStopEditing.emit()">
    <div [hidden]="true" [innerHTML]="cell.getValue()" #htmlValue></div>
  `,
})
export class LinkColumnRenderComponent extends DefaultEditor implements AfterViewInit
{
	@ViewChild('name') name: ElementRef;
	@ViewChild('url') url: ElementRef;
	@ViewChild('htmlValue') htmlValue: ElementRef;

	constructor() {
		super();
	}

	ngAfterViewInit() {
		if (this.cell.newValue !== '') {
			this.name.nativeElement.value = this.getUrlName();
			this.url.nativeElement.value = this.getUrlHref();
		}
	}

	updateValue() {
		const href = this.url.nativeElement.value;
		const name = this.name.nativeElement.value;
		this.cell.newValue = `<a href='${href}'>${name}</a>`;
	}

	getUrlName(): string {
		return this.htmlValue.nativeElement.innerText;
	}

	getUrlHref(): string {
		return this.htmlValue.nativeElement.querySelector('a').getAttribute('href');
	}
}
