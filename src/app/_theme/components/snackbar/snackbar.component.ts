import { Component, Input, OnInit, Output, EventEmitter, HostBinding, ElementRef, Renderer2 } from '@angular/core';
import { NbSnackbar } from '@app-theme/components/snackbar/model';
import { NbIconConfig } from '@nebular/theme';

@Component({
	selector: 'nb-snackbar',
	templateUrl: 'snackbar.component.html',
	styleUrls: ['snackbar.component.scss'],
})
export class NbSnackbarComponent implements OnInit
{
	@Input()
	public snackBar: NbSnackbar;

	@Output()
	destroy: EventEmitter<void> = new EventEmitter();

	@HostBinding('class.status-success')
	get success(): boolean {
		return this.snackBar.config.status === 'success';
	}

	@HostBinding('class.status-info')
	get info(): boolean {
		return this.snackBar.config.status === 'info';
	}

	@HostBinding('class.status-warning')
	get warning(): boolean {
		return this.snackBar.config.status === 'warning';
	}

	@HostBinding('class.status-primary')
	get primary(): boolean {
		return this.snackBar.config.status === 'primary';
	}

	@HostBinding('class.status-danger')
	get danger(): boolean {
		return this.snackBar.config.status === 'danger';
	}

	@HostBinding('class.status-basic')
	get basic(): boolean {
		return this.snackBar.config.status === 'basic';
	}

	@HostBinding('class.status-control')
	get control(): boolean {
		return this.snackBar.config.status === 'control';
	}

	@HostBinding('class.has-icon')
	get hasIcon(): boolean {
		const { icon } = this.snackBar.config;
		if (typeof icon === 'string') {
			return true;
		}

		return !!(icon && (icon as NbIconConfig).icon);
	}

	@HostBinding('class.custom-icon')
	get customIcon(): boolean {
		return !!this.icon;
	}

	get icon(): string | NbIconConfig {
		return this.snackBar.config.icon;
	}

	public constructor(protected renderer: Renderer2, protected elementRef: ElementRef) { }

	public ngOnInit(): void
	{
		if (this.snackBar.config.snackbarClass) {
			this.renderer.addClass(this.elementRef.nativeElement, this.snackBar.config.snackbarClass);
		}
	}

	public onSnackbarClicked()
	{
		if(this.snackBar.config.hasOwnProperty('click'))
			this.snackBar.config.click();

		this.destroy.emit();
	}
}
