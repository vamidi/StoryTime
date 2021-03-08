import { ComponentFactoryResolver, ComponentRef, Inject, Injectable, Type, ViewContainerRef } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class DynamicComponentService
{
	private factoryResolver: ComponentFactoryResolver;
	private rootViewContainer: ViewContainerRef;

	constructor(
		@Inject(ComponentFactoryResolver) factoryResolver,
	)
	{
		this.factoryResolver = factoryResolver
	}
	setRootViewContainerRef(viewContainerRef: ViewContainerRef)
	{
		this.rootViewContainer = viewContainerRef;
	}

	// constructor(private resolver: ComponentFactoryResolver, private location: ViewContainerRef) { }

	addDynamicComponent<T>(typeComponent: Type<T>): ComponentRef<T>
	{
		const factory = this.factoryResolver.resolveComponentFactory(typeComponent);
		return this.rootViewContainer.createComponent(factory, this.rootViewContainer.length,
			this.rootViewContainer.injector, []);
		// this.rootViewContainer.insert(component.hostView);;
	}
}
