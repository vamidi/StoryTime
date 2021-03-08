import { InjectionToken } from '@angular/core';
import { NbComponentStatus, NbGlobalLogicalPosition, NbGlobalPosition, NbIconConfig } from '@nebular/theme';
import { emptyStatusWarning } from '@app-theme/components/helpers';

type IconToClassMap = {
	[status in NbComponentStatus]: string;
}

export const NB_SNACKBAR_CONFIG = new InjectionToken<NbSnackbarConfig>('Default snackbar options');

export declare type NbDuplicateSnackbarBehaviour = 'previous' | 'all';

export class NbSnackbarConfig {
	/**
	 * Determines where on the screen toast have to be rendered.
	 * */
	position: NbGlobalPosition = NbGlobalLogicalPosition.BOTTOM_START;
	/**
	 * Status chooses color scheme for the toast.
	 * */
	status: NbComponentStatus = 'basic';
	/**
	 * Duration is timeout between toast appears and disappears.
	 * */
	duration: number = 6000;
	/**
	 * If preventDuplicates is true then the toast with the same title, message and status will not be rendered.
	 * Find duplicates behaviour determined by `preventDuplicates`.
	 * The default `previous` duplicate behaviour is used.
	 * */
	preventDuplicates: boolean = false;
	/**
	 * Determines the how to threat duplicates.
	 * */
	duplicatesBehaviour: NbDuplicateSnackbarBehaviour = 'previous';
	/*
	 * The number of visible toasts. If the limit exceeded the oldest toast will be removed.
	 *
	*/
	limit?: number = null;
	/**
	 * Class to be applied to the toast.
	 */
	snackbarClass: string = '';
	/**
	 * Determines render icon or not.
	 * */
	hasIcon: boolean = true;
	/**
	 * Icon name or icon config object that can be provided to render custom icon.
	 * */
	icon: string | NbIconConfig = 'email';
	/**
	 * When the snackbar button is clicked.
	 */
	click?: Function = null;
	/**
	 * Toast status icon-class mapping.
	 * */
	protected icons: IconToClassMap = {
		danger: 'flash-outline',
		success: 'checkmark-outline',
		info: 'question-mark-outline',
		warning: 'alert-triangle-outline',
		primary: 'email-outline',
		control: 'email-outline',
		basic: 'email-outline',
	};

	constructor(config: Partial<NbSnackbarConfig>)
	{
		if ((config.status as string) === '')
		{
			emptyStatusWarning('NbSnackbar');
			config.status = 'basic';
		}

		this.patchIcon(config);
		Object.assign(this, config);
	}

	protected patchIcon(config: Partial<NbSnackbarConfig>)
	{
		if (!('icon' in config))
		{
			config.icon = {
				icon: this.icons[config.status || 'basic'],
				pack: 'nebular-essentials',
			};
		}
	}
}
