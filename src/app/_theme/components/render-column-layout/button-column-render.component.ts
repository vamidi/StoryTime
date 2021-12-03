import {
	AfterViewInit,
	ChangeDetectorRef,
	Component, EventEmitter,
	Input,
	OnDestroy,
	OnInit,
} from '@angular/core';
import { ViewCell } from '@vamidicreations/ng2-smart-table';
import { ActivatedRoute, Router } from '@angular/router';
import { NbComponentOrCustomStatus } from '@nebular/theme/components/component-status';

@Component({
	template: `<button nbButton fullWidth [ghost]="ghost" [status]="status" (click)="emitter.emit()">{{ value }}</button>
	`,
})
export class ButtonColumnRenderComponent implements ViewCell, OnInit, AfterViewInit, OnDestroy
{
	@Input()
	public rowData: any;

	@Input()
	public value: number;

	public ghost: boolean = true;

	public status: NbComponentOrCustomStatus = 'primary';

	public readonly emitter: EventEmitter<void> = new EventEmitter<void>();

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

	public ngOnDestroy(): void { }
}
