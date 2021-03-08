import { NbSnackbar } from '@app-theme/components/snackbar/model';
import {
	NB_DOCUMENT, NbComponentPortal, NbGlobalLogicalPosition,
	NbGlobalPosition,
	NbOverlayRef,
	NbOverlayService,
	NbPositionBuilderService, NbPositionHelper, patch,
} from '@nebular/theme';
import { NbSnackbarComponent } from './snackbar.component';
import { ComponentFactoryResolver, ComponentRef, Inject, Injectable } from '@angular/core';
import { NbSnackbarContainerComponent } from '@app-theme/components/snackbar/snackbar-container.component';
import { NB_SNACKBAR_CONFIG, NbSnackbarConfig } from '@app-theme/components/snackbar/snackbar-config';

export class NbSnackbarRef
{
	constructor(private snackContainer: NbSnackbarContainer,
				private snackBar: NbSnackbar)
	{
	}

	close() {
		this.snackContainer.destroy(this.snackBar);
	}
}

export class NbSnackbarContainer
{
	protected snackbars: NbSnackbar[] = [];
	protected prevSnackbar: NbSnackbar;

	get nativeElement() {
		return this.containerRef.location.nativeElement;
	}

	constructor(protected position: NbGlobalPosition,
				protected containerRef: ComponentRef<NbSnackbarContainerComponent>,
				protected positionHelper: NbPositionHelper) {
	}

	attach(snackBar: NbSnackbar): NbSnackbarRef
	{
		if (snackBar.config.preventDuplicates && this.isDuplicate(snackBar))
		{
			return;
		}

		this.removeSnackbarIfLimitReached(snackBar);
		this.subscribeOnClick(this.attachSnackbar(snackBar), snackBar);

		if (snackBar.config.duration) {
			this.setDestroyTimeout(snackBar);
		}

		this.prevSnackbar = snackBar;

		return new NbSnackbarRef(this, snackBar);
	}

	destroy(snackbar: NbSnackbar)
	{
		if (this.prevSnackbar === snackbar) {
			this.prevSnackbar = null;
		}

		this.snackbars = this.snackbars.filter(t => t !== snackbar);
		this.updateContainer();
	}

	protected isDuplicate(snackbar: NbSnackbar): boolean {
		return snackbar.config.duplicatesBehaviour === 'previous'
			? this.isDuplicatePrevious(snackbar)
			: this.isDuplicateAmongAll(snackbar);
	}

	protected isDuplicatePrevious(snackBar: NbSnackbar): boolean {
		return this.prevSnackbar && this.snackbarDuplicateCompareFunc(this.prevSnackbar, snackBar);
	}

	protected isDuplicateAmongAll(snackBar: NbSnackbar): boolean {
		return this.snackbars.some(t => this.snackbarDuplicateCompareFunc(t, snackBar));
	}

	protected snackbarDuplicateCompareFunc = (t1: NbSnackbar, t2: NbSnackbar): boolean => {
		return t1.message === t2.message
			&& t1.title === t2.title
			&& t1.config.status === t2.config.status;
	};

	protected removeSnackbarIfLimitReached(snackBar: NbSnackbar) {
		if (!snackBar.config.limit || this.snackbars.length < snackBar.config.limit) {
			return;
		}
		if (this.positionHelper.isTopPosition(snackBar.config.position)) {
			this.snackbars.pop();
		} else {
			this.snackbars.shift();
		}
	}

	protected attachSnackbar(snackBar: NbSnackbar): NbSnackbarComponent {
		if (this.positionHelper.isTopPosition(snackBar.config.position)) {
			return this.attachToTop(snackBar);
		} else {
			return this.attachToBottom(snackBar);
		}
	}

	protected attachToTop(snackBar: NbSnackbar): NbSnackbarComponent {
		this.snackbars.unshift(snackBar);
		this.updateContainer();
		return this.containerRef.instance.snackbars.first;
	}

	protected attachToBottom(snackBar: NbSnackbar): NbSnackbarComponent {
		this.snackbars.push(snackBar);
		this.updateContainer();
		return this.containerRef.instance.snackbars.last;
	}

	protected setDestroyTimeout(snackBar: NbSnackbar) {
		setTimeout(() => this.destroy(snackBar), snackBar.config.duration);
	}

	protected subscribeOnClick(snackbarComponent: NbSnackbarComponent, snackbar: NbSnackbar) {
		snackbarComponent.destroy.subscribe(() => this.destroy(snackbar));
	}

	protected updateContainer() {
		patch(this.containerRef, { content: this.snackbars, position: this.position });
	}
}

interface NbSnackbarOverlayWithContainer
{
	overlayRef: NbOverlayRef;
	snackbarContainer: NbSnackbarContainer;
}

@Injectable()
export class NbSnackbarContainerRegistry
{
	protected overlays: Map<NbGlobalPosition, NbSnackbarOverlayWithContainer> = new Map();

	constructor(protected overlay: NbOverlayService,
				protected positionBuilder: NbPositionBuilderService,
				protected positionHelper: NbPositionHelper,
				protected cfr: ComponentFactoryResolver,
				@Inject(NB_DOCUMENT) protected document: any)
	{
	}

	get(position: NbGlobalPosition): NbSnackbarContainer
	{
		const logicalPosition: NbGlobalLogicalPosition = this.positionHelper.toLogicalPosition(position);

		const overlayWithContainer = this.overlays.get(logicalPosition);
		if (!overlayWithContainer || !this.existsInDom(overlayWithContainer.snackbarContainer))
		{
			if (overlayWithContainer)
			{
				overlayWithContainer.overlayRef.dispose();
			}
			this.instantiateContainer(logicalPosition);
		}

		return this.overlays.get(logicalPosition).snackbarContainer;
	}

	protected instantiateContainer(position: NbGlobalLogicalPosition)
	{
		const snackbarOverlayWithContainer = this.createContainer(position);
		this.overlays.set(position, snackbarOverlayWithContainer);
	}

	protected createContainer(position: NbGlobalLogicalPosition): NbSnackbarOverlayWithContainer
	{
		const positionStrategy = this.positionBuilder.global().position(position);
		const ref = this.overlay.create({ positionStrategy });
		this.addClassToOverlayHost(ref);
		const containerRef = ref.attach(new NbComponentPortal(NbSnackbarContainerComponent, null, null, this.cfr));
		return {
			overlayRef: ref,
			snackbarContainer: new NbSnackbarContainer(position, containerRef, this.positionHelper),
		};
	}

	protected addClassToOverlayHost(overlayRef: NbOverlayRef)
	{
		overlayRef.hostElement.classList.add('snackbar-overlay-container');
	}

	protected existsInDom(snackbarContainer: NbSnackbarContainer): boolean
	{
		return this.document.body.contains(snackbarContainer.nativeElement);
	}
}

/**
 * The `NbSnackbarService` provides a capability to build snackbars notifications.
 *
 * @stacked-example(Showcase, snackbar/snackbar-showcase.component)
 *
 * `NbSnackbarService.show(message, title, config)` accepts three params, title and config are optional.
 *
 * ### Installation
 *
 * Import `NbSnackbarModule.forRoot()` to your app module.
 * ```ts
 * @NgModule({
 *   imports: [
 *     // ...
 *     NbSnackbarModule.forRoot(config),
 *   ],
 * })
 * export class AppModule { }
 * ```
 *
 * ### Usage
 *
 * Calling `NbSnackbarService.show(...)` will render new snackbar and return `NbSnackbarRef` with
 * help of which you may close newly created snackbar by calling `close` method.
 *
 * ```ts
 * const snackbarRef: NbSnackbarRef = this.snackbarService.show(...);
 * snackbarRef.close();
 * ```
 *
 * Config accepts following options:
 *
 * `position` - determines where on the screen snackbar will be rendered.
 * Default is `top-end`.
 *
 * @stacked-example(Position, snackbar/snackbar-positions.component)
 *
 * `status` - coloring and icon of the snackbar.
 * Default is `basic`.
 *
 * @stacked-example(Status, snackbar/snackbar-statuses.component)
 *
 * `duration` - the time after which the snackbar will be destroyed.
 * `0` means endless snackbar, that may be destroyed by click only.
 * Default is 3000 ms.
 *
 * @stacked-example(Duration, snackbar/snackbar-duration.component)
 *
 * `destroyByClick` - provides a capability to destroy snackbar by click.
 * Default is true.
 *
 * @stacked-example(Destroy by click, snackbar/snackbar-destroy-by-click.component)
 *
 * `preventDuplicates` - don't create new snackbar if it has the same title, message and status.
 * Default is false.
 *
 * @stacked-example(Prevent duplicates, snackbar/snackbar-prevent-duplicates.component)
 *
 * `duplicatesBehaviour` - determines how to threat the snackbars duplication.
 * Compare with the previous message `previous`
 * or with all visible messages `all`.
 *
 * @stacked-example(Prevent duplicates behaviour , snackbar/snackbar-prevent-duplicates-behaviour.component)
 *
 * `limit` - the number of visible snackbars in the snackbar container. The number of snackbars is unlimited by default.
 *
 * @stacked-example(Prevent duplicates behaviour , snackbar/snackbar-limit.component)
 *
 * `hasIcon` - if true then render snackbar icon.
 * `icon` - you can pass icon class that will be applied into the snackbar.
 *
 * @stacked-example(Has icon, snackbar/snackbar-icon.component)
 * */
@Injectable()
export class NbSnackbarService
{
	constructor(@Inject(NB_SNACKBAR_CONFIG) protected globalConfig: NbSnackbarConfig,
				protected containerRegistry: NbSnackbarContainerRegistry)
	{
	}

	/**
	 * Shows snackbar with message, title and user config.
	 * */
	show(message, title?, userConfig?: Partial<NbSnackbarConfig>): NbSnackbarRef
	{
		const config = new NbSnackbarConfig({ ...this.globalConfig, ...userConfig });
		const container = this.containerRegistry.get(config.position);
		const snackbar: NbSnackbar = { message, title, config };
		return container.attach(snackbar);
	}

	/**
	 * Shows success snackbar with message, title and user config.
	 * */
	success(message: string, title?, config?: Partial<NbSnackbarConfig>): NbSnackbarRef {
		return this.show(message, title, { ...config, status: 'success' });
	}

	/**
	 * Shows info snackbar with message, title and user config.
	 * */
	info(message: string, title?, config?: Partial<NbSnackbarConfig>): NbSnackbarRef {
		return this.show(message, title, { ...config, status: 'info' });
	}

	/**
	 * Shows warning snackbar with message, title and user config.
	 * */
	warning(message: string, title?, config?: Partial<NbSnackbarConfig>): NbSnackbarRef {
		return this.show(message, title, { ...config, status: 'warning' });
	}

	/**
	 * Shows primary snackbar with message, title and user config.
	 * */
	primary(message: string, title?, config?: Partial<NbSnackbarConfig>): NbSnackbarRef {
		return this.show(message, title, { ...config, status: 'primary' });
	}

	/**
	 * Shows danger snackbar with message, title and user config.
	 * */
	danger(message: string, title?, config?: Partial<NbSnackbarConfig>): NbSnackbarRef {
		return this.show(message, title, { ...config, status: 'danger' });
	}

	/**
	 * Shows default snackbar with message, title and user config.
	 * */
	default(message: string, title?, config?: Partial<NbSnackbarConfig>): NbSnackbarRef {
		return this.show(message, title, { ...config, status: 'basic' });
	}

	/**
	 * Shows control snackbar with message, title and user config.
	 * */
	control(message: string, title?, config?: Partial<NbSnackbarConfig>): NbSnackbarRef {
		return this.default(message, title, { ...config, status: 'control' });
	}
}
