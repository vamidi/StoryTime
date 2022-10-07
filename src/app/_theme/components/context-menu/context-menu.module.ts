/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxContextMenuDirective } from '@app-core/directives/ngx-context-menu.directive';
import { NgxContextMenuComponent } from '@app-theme/components/context-menu/context.menu.component';
import { NbButtonModule, NbIconModule, NbMenuModule, NbOverlayModule } from '@nebular/theme';
import { NgxNotificationsMenuComponent, NgxNotifyMenuItemComponent } from '@app-theme/components';
import { RouterModule } from '@angular/router';
import { AvatarModule } from 'ngx-avatars';

@NgModule({
	exports: [
		NgxContextMenuDirective,
		NgxNotificationsMenuComponent,
	],
	declarations: [
		NgxContextMenuDirective,
		NgxContextMenuComponent,
		NgxNotifyMenuItemComponent,
		NgxNotificationsMenuComponent,
	],
	/*
	entryComponents: [
		NgxContextMenuComponent,
		NgxNotifyMenuItemComponent,
	],
	 */
	imports: [
		CommonModule,
		RouterModule,
		NbMenuModule,
		NbOverlayModule,
		NbButtonModule,
		NbIconModule,
		AvatarModule,
	],
})
export class NgxContextMenuModule {
}
