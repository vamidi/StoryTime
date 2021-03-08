import { Directive, ElementRef, Input, OnChanges, OnInit } from '@angular/core';
import {
	NbContextMenuDirective,
	NbDynamicOverlay,
	NbDynamicOverlayHandler,
	NbMenuItem,
	NbMenuService,
} from '@nebular/theme';
import { NgxContextMenuComponent } from '@app-theme/components/context-menu/context.menu.component';

@Directive({
	selector: '[ngxContextMenu]',
	providers: [NbDynamicOverlayHandler, NbDynamicOverlay],
	exportAs: 'ngxContextMenu',
})
export class NgxContextMenuDirective extends NbContextMenuDirective implements OnInit, OnChanges
{
	/**
	 * Basic menu items, will be passed to the internal NbMenuComponent.
	 * */
	@Input('ngxContextMenu')
	get items(): NbMenuItem[] {
		return super.items;
	}
	set items(items: NbMenuItem[])
	{
		if(items.length) {
			console.log(items.length);
			super.items = items;
			this.rebuild();
		}
	};

	constructor(private _hostRef: ElementRef,
				private _menuService: NbMenuService,
				private _dynamicOverlayHandler: NbDynamicOverlayHandler)
	{
		super(_hostRef, _menuService, _dynamicOverlayHandler);
	}

	public ngOnInit(): void
	{
		this._dynamicOverlayHandler
			.host(this._hostRef)
			.componentType(NgxContextMenuComponent);
	}

}
