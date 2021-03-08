import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
	selector: '[ngxDigitOnly]',
})
export class DigitOnlyDirective {
	private decimalCounter = 0;
	private navigationKeys = [
		'Backspace',
		'Delete',
		'Tab',
		'Escape',
		'Enter',
		'Home',
		'End',
		'ArrowLeft',
		'ArrowRight',
		'Clear',
		'Copy',
		'Paste',
	];
	@Input() decimal? = false;
	inputElement: HTMLElement;

	constructor(public el: ElementRef)
	{
		this.inputElement = el.nativeElement;
	}

	@HostListener('keydown', ['$event'])
	onKeyDown(e: KeyboardEvent) {
		if (
			this.navigationKeys.indexOf(e.key) > -1 || // Allow: navigation keys: backspace, delete, arrows etc.
			(e.key === 'a' && e.ctrlKey === true) || // Allow: Ctrl+A
			(e.key === 'c' && e.ctrlKey === true) || // Allow: Ctrl+C
			(e.key === 'v' && e.ctrlKey === true) || // Allow: Ctrl+V
			(e.key === 'x' && e.ctrlKey === true) || // Allow: Ctrl+X
			(e.key === 'a' && e.metaKey === true) || // Allow: Cmd+A (Mac)
			(e.key === 'c' && e.metaKey === true) || // Allow: Cmd+C (Mac)
			(e.key === 'v' && e.metaKey === true) || // Allow: Cmd+V (Mac)
			(e.key === 'x' && e.metaKey === true) || // Allow: Cmd+X (Mac)
			(this.decimal && e.key === '.' && this.decimalCounter < 1) // Allow: only one decimal point
		) {
			// let it happen, don't do anything
			return;
		}
		// Ensure that it is a number and stop the keypress
		if (e.key === ' ' || isNaN(Number(e.key)))
		{
			e.preventDefault();
		}
	}

	@HostListener('keyup', ['$event'])
	onKeyUp(e: KeyboardEvent) {
		if (!this.decimal) {
			return;
		} else {
			this.decimalCounter = this.el.nativeElement.value.split('.').length - 1;
		}
	}

	@HostListener('paste', ['$event'])
	onPaste(event: ClipboardEvent) {
		event.preventDefault();
		const pastedInput: string = event.clipboardData.getData('text/plain');

		if (!this.decimal) {
			document.execCommand(
				'insertText',
				false,
				pastedInput.replace(/[^0-9]/g, ''),
			);
		} else if (this.isValidDecimal(pastedInput)) {
			document.execCommand(
				'insertText',
				false,
				pastedInput.replace(/[^0-9.]/g, ''),
			);
		}
	}

	@HostListener('drop', ['$event'])
	onDrop(event: DragEvent)
	{
		event.preventDefault();
		const textData = event.dataTransfer.getData('text');
		this.inputElement.focus();

		if (!this.decimal)
		{
			document.execCommand(
				'insertText',
				false,
				textData.replace(/[^0-9]/g, ''),
			);
		} else if (this.isValidDecimal(textData))
		{
			document.execCommand(
				'insertText',
				false,
				textData.replace(/[^0-9.]/g, ''),
			);
		}
	}

	isValidDecimal(string: string): boolean
	{
		return string.split('.').length <= 2;
	}
}
