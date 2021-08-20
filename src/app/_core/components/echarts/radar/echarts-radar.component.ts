import { Component, Input } from '@angular/core';
import { EChartsOption } from 'echarts';

@Component({
	selector: 'ngx-echarts-radar',
	template: `
		<div echarts [options]="options" class="echart"></div>
	`,
})
export class EchartsRadarComponent
{
	@Input()
	options: EChartsOption = {};
}
