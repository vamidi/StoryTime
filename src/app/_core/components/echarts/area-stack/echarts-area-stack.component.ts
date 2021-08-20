import { Component, Input } from '@angular/core';
import { EChartsOption } from 'echarts';

@Component({
	selector: 'ngx-echarts-area-stack',
	template: `
		<div echarts [options]="options" class="echart" [initOpts]="initOpts" [autoResize]="autoResize"></div>
	`,
})
export class EchartsAreaStackComponent
{
	@Input()
	public options: EChartsOption = {};

	@Input()
	public initOpts: {
		devicePixelRatio?: number;
		renderer?: string;
		width?: number | string;
		height?: number | string;
		locale?: string;
	} = {};

	@Input()
	public autoResize: boolean = true;
}
