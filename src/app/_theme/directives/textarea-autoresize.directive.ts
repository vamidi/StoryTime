import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';

@Directive({
	selector: '[ngxTextareaAutoresize]',
})
export class TextareaAutoresizeDirective implements OnInit
{
	constructor(private elementRef: ElementRef) {}

	@HostListener(':input')
	onInput() {
		this.resize();
	}

	public ngOnInit()
	{
		if (this.elementRef.nativeElement.scrollHeight) {
			setTimeout(() => this.resize());
		}
	}

	public resize() {
		this.elementRef.nativeElement.style.height = 'inherit';
		this.elementRef.nativeElement.style.height = this.elementRef.nativeElement.scrollHeight + 'px';
	}
}
