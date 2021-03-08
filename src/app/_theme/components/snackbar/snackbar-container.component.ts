import { Component, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { NbGlobalPosition, NbLayoutDirectionService, NbPositionHelper } from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NbSnackbar } from './model';
import { NbSnackbarComponent } from './snackbar.component';

const voidState = style({
	transform: 'translateY({{ direction }}0)',
	marginTop: '0',
	marginBottom: '0',
	opacity: '0',
});

const defaultOptions = { params: { direction: '' } };

@Component({
	selector: 'nb-snackbar-container',
	template: `
    <nb-snackbar [@fadeIn]="fadeIn" *ngFor="let snackbar of content" [snackBar]="snackbar"></nb-snackbar>`,
	animations: [
		trigger('fadeIn', [
			transition(':enter', [voidState, animate(300)], defaultOptions),
			transition(':leave', [animate(300, voidState)], defaultOptions),
		]),
	],
})
export class NbSnackbarContainerComponent implements OnInit, OnDestroy
{
	@Input()
	public content: NbSnackbar[] = [];

	@Input()
	public context: Object;

	@Input()
	public position: NbGlobalPosition;

	@ViewChildren(NbSnackbarComponent)
	public snackbars: QueryList<NbSnackbarComponent>;

	public fadeIn: any;

	protected destroy$ = new Subject<void>();

	constructor(protected layoutDirection: NbLayoutDirectionService,
				protected positionHelper: NbPositionHelper) {
	}

	public ngOnInit(): void
	{
		this.layoutDirection.onDirectionChange()
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => this.onDirectionChange());
	}

	public ngOnDestroy(): void
	{
		this.destroy$.next();
		this.destroy$.complete();
	}

	protected onDirectionChange() {
		const direction = this.positionHelper.isRightPosition(this.position) ? '' : '-';
		this.fadeIn = { value: '', params: { direction } };
	}
}
