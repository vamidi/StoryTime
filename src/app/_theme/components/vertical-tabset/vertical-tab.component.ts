import { Component, HostBinding, Input } from '@angular/core';
import { convertToBoolProperty, NbBooleanInput } from './../helpers';
import { NbBadgePosition, NbComponentOrCustomStatus, NbTabComponent } from '@nebular/theme';
import { NbIconConfig } from '@nebular/theme/components/icon/icon.component';

@Component({
	selector: 'nb-vertical-tab',
	template: `
    <ng-container *ngIf="init">
      <ng-content></ng-content>
    </ng-container>
  `,
})
export class NbVerticalTabComponent extends NbTabComponent
{

	/**
	 * Tab title
	 * @type {string}
	 */
	@Input() tabTitle: string;

	/**
	 * Tab id
	 * @type {string}
	 */
	@Input() tabId: string;

	/**
	 * Use badge dot mode
	 * @type {boolean}
	 */
	@Input()
	get badgeDot(): boolean {
		return this._badgeDot;
	}
	set badgeDot(val: boolean) {
		this._badgeDot = convertToBoolProperty(val);
	}
	protected _badgeDot: boolean;
	static ngAcceptInputType_badgeDot: NbBooleanInput;

	/**
	 * Tab icon name or icon config object
	 * @type {string | NbIconConfig}
	 */
	@Input() tabIcon: string | NbIconConfig;

	/**
	 * Item is disabled and cannot be opened.
	 * @type {boolean}
	 */
	@Input('disabled')
	@HostBinding('class.disabled')
	get disabled(): boolean {
		return this.disabledValue;
	}
	set disabled(val: boolean) {
		this.disabledValue = convertToBoolProperty(val);
	}
	static ngAcceptInputType_disabled: NbBooleanInput;

	/**
	 * Show only icons when width is smaller than `tabs-icon-only-max-width`
	 * @type {boolean}
	 */
	@Input()
	set responsive(val: boolean) {
		this.responsiveValue = convertToBoolProperty(val);
	}
	get responsive() {
		return this.responsiveValue;
	}
	static ngAcceptInputType_responsive: NbBooleanInput;

	@Input() route: string;

	@HostBinding('class.content-active')
	activeValue: boolean = false;

	responsiveValue: boolean = false;
	disabledValue = false;

	/**
	 * Specifies active tab
	 * @returns {boolean}
	 */
	@Input()
	get active() {
		return this.activeValue;
	}
	set active(val: boolean) {
		this.activeValue = convertToBoolProperty(val);
		if (this.activeValue) {
			this.init = true;
		}
	}
	static ngAcceptInputType_active: NbBooleanInput;

	/**
	 * Lazy load content before tab selection
	 * TODO: rename, as lazy is by default, and this is more `instant load`
	 * @param {boolean} val
	 */
	@Input()
	set lazyLoad(val: boolean) {
		this.init = convertToBoolProperty(val);
	}
	static ngAcceptInputType_lazyLoad: NbBooleanInput;

	/**
	 * Badge text to display
	 * @type string
	 */
	@Input() badgeText: string;

	/**
	 * Badge status (adds specific styles):
	 * 'primary', 'info', 'success', 'warning', 'danger'
	 * @param {string} val
	 */
	@Input() badgeStatus: NbComponentOrCustomStatus = 'basic';

	/**
	 * Badge position.
	 * Can be set to any class or to one of predefined positions:
	 * 'top left', 'top right', 'bottom left', 'bottom right',
	 * 'top start', 'top end', 'bottom start', 'bottom end'
	 * @type string
	 */
	@Input() badgePosition: NbBadgePosition;

	init: boolean = false;
}
