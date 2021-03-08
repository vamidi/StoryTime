import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NbBadgePosition, NbComponentStatus, NbIconConfig } from '@nebular/theme';

@Component({
	selector: 'nb-notifications',
	templateUrl: 'notifications.component.html',
	styles:[
		`
			.position-right {
				right:10px!important;
			}
			.position-top {
				top: inherit!important;
				bottom: 12px;
			}
		`,
	],
})
export class NbNotificationsComponent
{
	@Input()
	icon: string | NbIconConfig = 'bell-outline';

	/**
	 * Badge text to display
	 * @type string
	 */
	@Input() badgeText: string = null;

	/**
	 * Badge status (adds specific styles):
	 * `primary`, `info`, `success`, `warning`, `danger`
	 * @param {string} val
	 */
	@Input() badgeStatus: NbComponentStatus = 'basic';

	/**
	 * Badge position.
	 * Can be set to any class or to one of predefined positions:
	 * 'top left', 'top right', 'bottom left', 'bottom right',
	 * 'top start', 'top end', 'bottom start', 'bottom end'
	 * @type string
	 */
	@Input() badgePosition: NbBadgePosition;
}
