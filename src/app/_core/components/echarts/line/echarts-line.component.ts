import { Component, Input } from '@angular/core';
import { EChartsOption } from 'echarts';

@Component({
	selector: 'ngx-echarts-line',
	template: `
		<div echarts [options]="options" class="echart"></div>
	`,
})
export class EchartsLineComponent
{
	@Input()
	options: EChartsOption = {};
}
